const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'assets', 'bot-data');

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. RAG API endpoints will fail until it is configured in .env');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const HF_API_TOKEN = process.env.HF_API_TOKEN || '';
const HF_MODEL = process.env.HF_MODEL || 'gpt2';

async function loadDocuments() {
  const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
  const docs = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(DATA_DIR, entry.name);

    try {
      if (entry.name.toLowerCase().endsWith('.txt')) {
        const text = (await fs.readFile(filePath, 'utf8')).trim();
        if (text) docs.push({ id: entry.name, text });
      } else if (entry.name.toLowerCase().endsWith('.pdf')) {
        const buffer = await fs.readFile(filePath);
        const data = await pdfParse(buffer);
        const text = (data.text || '').trim();
        if (text) docs.push({ id: entry.name, text });
      }
    } catch (err) {
      console.warn(`Failed to load ${entry.name}:`, err.message);
    }
  }
  return docs;
}

function extractBulletListFromText(text) {
  if (!text || typeof text !== 'string') return text;
  const clean = text.replace(/\n+/g, ' ').trim();
  const items = clean
    .replace(/^\s*(Projects|Skills|Education|About|Contact):?/i, '')
    .split(/,\s*/)
    .map(i => i.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  if (items.length <= 1) return clean;
  return items.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
}

function pickDocForQuestion(question) {
  const q = (question || '').toLowerCase();
  if (/\b(projects?|projects)\b/.test(q)) return 'projects.txt';
  if (/\b(skills?|skill)\b/.test(q)) return 'skills.txt';
  if (/\b(education|school|college|university|graduation)\b/.test(q)) return 'education.txt';
  if (/\b(contact|email|phone|linkedin|github)\b/.test(q)) return 'contact.txt';
  if (/\b(about|who is|tell me about)\b/.test(q)) return 'about.txt';
  return null;
}

function truncateLongAnswer(answer) {
  if (!answer || typeof answer !== 'string') return answer;
  const words = answer.trim().split(/\s+/);
  if (words.length <= 90) return answer.trim();

  const lines = answer.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length >= 3) return lines.slice(0, 3).join('\n');

  const sentences = answer.trim().split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  return sentences.slice(0, 3).join(' ');
}

function normalizeEmbedding(e) {
  const norm = Math.sqrt(e.reduce((sum, val) => sum + val * val, 0));
  return e.map((v) => v / (norm || 1e-12));
}

function cosineSimilarity(a, b) {
  return a.reduce((sum, val, idx) => sum + val * (b[idx] || 0), 0);
}

async function queryHuggingFace(question, context) {
  if (!HF_API_TOKEN) {
    throw new Error('Hugging Face API token (HF_API_TOKEN) is not configured');
  }

  const prompt = `You are Guru, the personal assistant for Gurunadh Kothuru. Use context to answer questions about Gurunadh. If user asks for list-style details, provide numbered list format. Answer only from context and profile data.\n\nContext:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;

  const url = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.2,
        return_full_text: false
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Hugging Face request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Hugging Face model error: ${data.error}`);
  }

  let output = '';
  if (Array.isArray(data) && data[0]?.generated_text) {
    output = data[0].generated_text;
  } else if (typeof data === 'object' && data.generated_text) {
    output = data.generated_text;
  } else {
    output = JSON.stringify(data);
  }

  return output.trim();
}

function chunkText(text, chunkSize = 400, overlap = 80) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const start = i;
    const end = Math.min(text.length, i + chunkSize);
    chunks.push(text.slice(start, end));
    i += chunkSize - overlap;
  }
  return chunks;
}

async function buildVectorStore() {
  const docs = await loadDocuments();
  const embeddings = [];

  for (const doc of docs) {
    const pieces = chunkText(doc.text);
    for (const [index, piece] of pieces.entries()) {
      embeddings.push({
        id: `${doc.id}#${index}`,
        source: doc.id,
        text: piece,
        vector: null
      });
    }
  }

  if (!embeddings.length) return embeddings;

  const textBatches = [];
  const batchSize = 16;
  for (let i = 0; i < embeddings.length; i += batchSize) {
    textBatches.push(embeddings.slice(i, i + batchSize));
  }

  for (const batch of textBatches) {
    const res = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: batch.map((item) => item.text)
    });

    for (let i = 0; i < batch.length; i++) {
      batch[i].vector = normalizeEmbedding(res.data[i].embedding);
    }
  }

  return embeddings;
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

let cacheVectorStore = null;
let cacheTime = 0;

async function getVectorStore() {
  const now = Date.now();
  if (!cacheVectorStore || now - cacheTime > 5 * 60 * 1000) {
    cacheVectorStore = await buildVectorStore();
    cacheTime = now;
  }
  return cacheVectorStore;
}

app.post('/api/query', async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'question is required in body' });
  }

  try {
    const docId = pickDocForQuestion(question);
    if (docId) {
      const docs = await loadDocuments();
      const doc = docs.find((d) => d.id.toLowerCase() === docId.toLowerCase());
      if (doc) {
        const short = extractBulletListFromText(doc.text);
        const chosen = short || extractShortParagraph(doc.text, 3);
        return res.json({ answer: truncateLongAnswer(chosen), sourceCount: 1, source: docId });
      }
    }

    const store = await getVectorStore();
    const qEmbeddingResp = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: question
    });

    const queryVector = normalizeEmbedding(qEmbeddingResp.data[0].embedding);

    const scored = store
      .filter((item) => item.vector)
      .map((item) => ({ ...item, score: cosineSimilarity(queryVector, item.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const context = scored
      .map((item) => `Source: ${item.source}\n${item.text}`)
      .join('\n---\n');

    const systemPrompt = `You are Guru, a personal assistant for Gurunadh Kothuru. Use the profile document context to answer all questions about Gurunadh. If the user asks for details not present in the profile, respond with: 'I’m focused on Gurunadh's profile data and cannot provide a response to that.'
- For list-oriented questions, answer in a numbered list format.
- Keep answers concise and directly grounded in the provided context.
- Do not hallucinate facts not found in the profile content.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` }
    ];

    let answer = 'Unable to answer at the moment.';

    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 250,
          temperature: 0.2,
        });

        answer = completion.choices[0]?.message?.content?.trim() || answer;
      } catch (openAiError) {
        console.warn('OpenAI query failed, trying Hugging Face fallback:', openAiError.message);
        if (HF_API_TOKEN) {
          try {
            answer = await queryHuggingFace(question, context);
          } catch (hfError) {
            console.error('Hugging Face fallback failed:', hfError.message);
            return res.status(500).json({ error: 'Both OpenAI and Hugging Face queries failed.' });
          }
        } else {
          return res.status(500).json({ error: 'OpenAI query failed and no Hugging Face token available.' });
        }
      }
    } else if (HF_API_TOKEN) {
      answer = await queryHuggingFace(question, context);
    } else {
      return res.status(500).json({ error: 'No LLM provider configured (OPENAI_API_KEY or HF_API_TOKEN is required).' });
    }

    answer = truncateLongAnswer(answer);
    return res.json({ answer, sourceCount: scored.length, source: 'rag' });
  } catch (error) {
    console.error('RAG query error', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/docs', async (req, res) => {
  try {
    const docs = await loadDocuments();
    res.json({ docs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);
  try {
    await getVectorStore();
    console.log('RAG vector store loaded from assets/bot-data.');
  } catch (err) {
    console.error('Failed to load RAG vector store on startup:', err);
  }
});