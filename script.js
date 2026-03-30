document.addEventListener('DOMContentLoaded', function() {
    // Preloader
    const preloader = document.getElementById('preloader');

    function hidePreloader() {
        if (preloader) preloader.style.display = 'none';
    }

    window.addEventListener('load', hidePreloader);
    // Fallback: hide preloader after 5 seconds even if 'load' doesn't fire
    setTimeout(hidePreloader, 5000);

    // GSAP and ScrollTrigger registration
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // Hamburger Menu
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
    });

    document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
    }));

    // Hero Section Animations
    gsap.from(".hero-content .fade-in", {
        duration: 1,
        opacity: 0,
        y: 50,
        stagger: 0.2,
        ease: "power3.out"
    });

    // Scroll-based Animations
    const sections = gsap.utils.toArray('.content-section');
    sections.forEach(section => {
        gsap.from(section.querySelectorAll(".section-title, p, .project-card, .skill-category, .timeline-item, .card"), {
            scrollTrigger: {
                trigger: section,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none none"
            },
            opacity: 0,
            y: 50,
            duration: 1,
            stagger: 0.1,
            ease: "power3.out"
        });
    });

    // Particles.js
    particlesJS('particles-js', {
      "particles": {
        "number": {
          "value": 80,
          "density": {
            "enable": true,
            "value_area": 800
          }
        },
        "color": {
          "value": "#8A2BE2"
        },
        "shape": {
          "type": "circle",
        },
        "opacity": {
          "value": 0.5,
          "random": false,
        },
        "size": {
          "value": 3,
          "random": true,
        },
        "line_linked": {
          "enable": true,
          "distance": 150,
          "color": "#8A2BE2",
          "opacity": 0.4,
          "width": 1
        },
        "move": {
          "enable": true,
          "speed": 4,
          "direction": "none",
          "random": false,
          "straight": false,
          "out_mode": "out",
          "bounce": false,
        }
      },
      "interactivity": {
        "detect_on": "canvas",
        "events": {
          "onhover": {
            "enable": true,
            "mode": "repulse"
          },
          "onclick": {
            "enable": true,
            "mode": "push"
          },
          "resize": true
        },
        "modes": {
          "repulse": {
            "distance": 100,
            "duration": 0.4
          },
          "push": {
            "particles_nb": 4
          }
        }
      },
      "retina_detect": true
    });
});

const toggleButton = document.getElementById("themeToggle");
const toggleCheckbox = document.getElementById("t");
const toggle = toggleButton || toggleCheckbox;
const body = document.body;

function setTheme(mode) {
  if (mode === "dark") {
    body.classList.add("theme-dark");
    body.classList.remove("theme-light");
    document.documentElement.setAttribute('data-theme', 'dark');
    if (toggleButton) toggleButton.setAttribute("aria-pressed", "true");
    if (toggleCheckbox) toggleCheckbox.checked = true;
  } else {
    body.classList.add("theme-light");
    body.classList.remove("theme-dark");
    document.documentElement.setAttribute('data-theme', 'light');
    if (toggleButton) toggleButton.setAttribute("aria-pressed", "false");
    if (toggleCheckbox) toggleCheckbox.checked = false;
  }
  localStorage.setItem("theme-mode", mode);
}

function initTheme() {
  const stored = localStorage.getItem("theme-mode");
  if (stored === "dark" || stored === "light") {
    setTheme(stored);
    return;
  }
  const prefersDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
}

if (toggleButton) {
  toggleButton.addEventListener("click", () => {
    const isDark = body.classList.contains("theme-dark");
    setTheme(isDark ? "light" : "dark");
  });

  toggleButton.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleButton.click();
    }
  });
}

if (toggleCheckbox) {
  toggleCheckbox.addEventListener("change", () => {
    setTheme(toggleCheckbox.checked ? "dark" : "light");
  });
}

initTheme();

// Guru chatbot with RAG backend support + local fallback
const chatbotToggle = document.getElementById('chatbot-toggle');
const chatbotPanel = document.getElementById('chatbot-panel');
const chatbotMaximize = document.getElementById('chatbot-maximize');
const chatbotClose = document.getElementById('chatbot-close');
const chatbotMessages = document.getElementById('chatbot-messages');
const chatbotForm = document.getElementById('chatbot-form');
const chatbotInput = document.getElementById('chatbot-input');

const CHATBOT_DEBUG = false;
const RAG_SOURCE_FILES = [
    'assets/bot-data/about.txt',
    'assets/bot-data/education.txt',
    'assets/bot-data/projects.txt',
    'assets/bot-data/skills.txt',
    'assets/bot-data/contact.txt'
];
let ragContent = [];

function addMessage(text, sender) {
    if (!chatbotMessages) return;
    const msgEl = document.createElement('div');
    msgEl.className = `chatbot-message ${sender}`;
    msgEl.textContent = text;
    chatbotMessages.appendChild(msgEl);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function addImageMessage(src, alt) {
    if (!chatbotMessages) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'chatbot-message bot chatbot-avatar';
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || 'chatbot image';
    img.style.width = '80px';
    img.style.height = '80px';
    img.style.objectFit = 'contain';
    img.style.display = 'block';
    img.style.margin = '0 auto 0.5rem';
    wrapper.appendChild(img);
    chatbotMessages.appendChild(wrapper);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function initialBotPrompt() {
    addImageMessage('assets/chatbot.png', 'Chatbot');
    addMessage("Hi, I'm Guru. Ask me anything about myself.", 'bot');
}

function bestMatchFromRAG(question) {
    const q = question.trim().toLowerCase();
    if (!q) return null;

    let best = {score: 0, text: ''};
    ragContent.forEach(item => {
        const text = item.text.toLowerCase();
        let score = 0;
        q.split(/\s+/).forEach(tok => {
            if (tok.length < 3) return;
            if (text.includes(tok)) score += 1;
        });
        if (score > best.score) {
            best.score = score;
            best.text = item.text;
        }
    });

    return best.score > 0 ? best.text : null;
}

function decodeText(raw) {
    if (!raw || typeof raw !== 'string') return raw;
    // Convert escaped newline sequences to real newlines and trim.
    return raw.replace(/\\n/g, '\n').trim();
}

function isCategoryQuestion(question) {
    // project/skills/education categories are list-friendly, 'about' is narrative
    return /\b(projects?|education|skills?|tools|frameworks?)\b/i.test(question);
}

function personalAnswer(phrase) {
    if (!phrase || typeof phrase !== 'string') return phrase;
    return phrase
        .replace(/\bGuru\b/g, 'I')
        .replace(/\bGurunadh Kothuru\b/gi, 'I')
        .replace(/\byour portfolio assistant\b/gi, '')
        .trim();
}

function extractShortParagraph(text, sentenceCount = 3) {
    if (!text || typeof text !== 'string') return '';
    const normalized = decodeText(text).replace(/\n+/g, ' ');
    const sentences = normalized.split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(Boolean);
    return sentences.slice(0, sentenceCount).join(' ').trim();
}

function truncateLongAnswer(answer) {
    if (!answer || typeof answer !== 'string') return answer;

    const words = answer.trim().split(/\s+/);
    if (words.length <= 90) return answer.trim();

    // Prefer first 3 bullet lines when possible
    const lines = answer.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length >= 3) {
        return lines.slice(0, 3).join('\n');
    }

    // fallback to first 3 sentences
    const sentences = answer.trim().split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
    return sentences.slice(0, 3).join(' ');
}

function formatAsBulletList(text) {
    if (!text || typeof text !== 'string') return text;
    let decoded = decodeText(text);

    // Remove common section headers for cleaner numbered list output.
    decoded = decoded.replace(/^\s*(Education|Skills|Contact|Projects|About|Certifications|Achievements)\s*:\s*/i, '');

    // Normalize pipeline separators to newline first.
    decoded = decoded.replace(/\s*\|\s*/g, '\n').replace(/;\s*/g, '\n');

    let items = decoded.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    if (items.length === 1) {
        // Numeric list style in a single line: "1. A 2. B 3. C"
        const numericSplit = decoded.split(/\d+\.\s*/).map(l => l.trim()).filter(Boolean);
        if (numericSplit.length > 1) {
            items = numericSplit;
        } else {
            // Try sentence-based splitting if the string is one long paragraph.
            if (decoded.includes('. ') && !decoded.includes('\n')) {
                const sentenceSplit = decoded.split(/\.\s+/).map(l => l.trim()).filter(Boolean);
                if (sentenceSplit.length > 1) items = sentenceSplit;
            }
            // Further split comma-delimited lists.
            if (items.length === 1 && decoded.includes(',') && !decoded.match(/\d\./)) {
                const commaItems = decoded.split(/,\s*/).map(l => l.replace(/^[\-•\*]\s*/, '').trim()).filter(Boolean);
                if (commaItems.length > 1) items = commaItems;
            }
        }
    }

    const normalized = items.map(item => item.replace(/^[\-•\*]\s*/, '').replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
    if (normalized.length < 2) {
        return decoded;
    }

    return normalized.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function formatResponse(question, rawAnswer) {
    const answer = decodeText(rawAnswer || '').trim();
    if (!answer) return '';

    const preferList = isCategoryQuestion(question) || /\b(list|all|items|points|steps|things|show me|details|tell me)\b/i.test(question);
    if (preferList) {
        const list = formatAsBulletList(answer);
        return truncateLongAnswer(list || answer);
    }

    return truncateLongAnswer(answer);
}

function formatRagAnswer(rawAnswer, question) {
    const answer = decodeText(rawAnswer);
    const isListIntent = /\b(list|all|items|points|steps|things|show me|details|tell me)\b/i.test(question);
    const isCategoryIntent = /\b(projects|skills|education|contact|experience|about|achievements|certifications)\b/i.test(question);

    if (isListIntent || isCategoryIntent) {
        return formatAsBulletList(answer);
    }

    return answer;
}

function extractAnswerSnippet(question, text) {
    const normalizedQ = question.toLowerCase();
    const queryTokens = normalizedQ.match(/[a-z0-9]{4,}/g) || [];

    if (/(visio.*voice|visio-voice)/i.test(normalizedQ)) {
        return "Visio-Voice is an image-to-audio accessibility solution for visually impaired users. It uses CNN-based image feature extraction, LSTM sequence generation, and text-to-speech (gTTS) to describe images verbally.";
    }

    if (/(crowd monitoring|fight detection)/i.test(normalizedQ)) {
        return "Crowd Monitoring project uses deep learning (YOLO-style approach) to detect abnormal crowd behavior and improve public safety with real-time alerts.";
    }

    if (/(eKart|e-commerce)/i.test(normalizedQ)) {
        return "eKart is a cloud-based e-commerce platform with product listing, user interaction, and AWS deployment for scalable online shopping.";
    }

    if (/(heart disease)/i.test(normalizedQ)) {
        return "Heart Disease Prediction model uses supervised ML on health features (age, blood pressure, cholesterol) to predict risk.";
    }

    if (/(maze solving)/i.test(normalizedQ)) {
        return "Maze Solving uses image processing morphological operations (erosion/dilation) to determine paths in maze images.";
    }

    if (!text || !queryTokens.length) {
        return null;
    }

    const sentences = text.split(/[\.\n]/).map(s => s.trim()).filter(Boolean);
    for (const sentence of sentences) {
        const lowerSent = sentence.toLowerCase();
        if (queryTokens.some(tok => lowerSent.includes(tok))) {
            return sentence;
        }
    }

    return null;
}

async function loadRagData() {
    // Prefer server-side parsed documents (including PDF resume)
    try {
        const response = await fetch(`${window.location.origin}/api/docs`);
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data.docs) && data.docs.length > 0) {
                ragContent = data.docs;
                return;
            }
        }
    } catch (err) {
        console.warn('Could not load /api/docs, falling back to local files:', err.message);
    }

    // Fallback to local text files if server docs were unavailable
    const entries = [];
    for (const pathUrl of RAG_SOURCE_FILES) {
        try {
            const response = await fetch(pathUrl);
            if (!response.ok) continue;
            const text = await response.text();
            if (text.trim()) {
                entries.push({source: pathUrl, text: decodeText(text.trim())});
            }
        } catch (err) {
            console.warn('Local RAG load error:', pathUrl, err);
        }
    }
    ragContent = entries;
}

function getLocalRagAnswer(question) {
    const lower = question.toLowerCase();

    const getDocText = (name) => {
        const doc = ragContent.find(item => item.source.toLowerCase().includes(name));
        return doc ? decodeText(doc.text) : '';
    };

    const extractSection = (text, headingPattern) => {
        if (!text) return '';
        const lines = text.split(/\r?\n/);
        const start = lines.findIndex(l => new RegExp(headingPattern, 'i').test(l));
        if (start === -1) return '';

        const sectionLines = [];
        for (let i = start + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            if (/^[-]{3,}$/.test(line)) break;
            if (/^\s*#/i.test(line)) break;
            sectionLines.push(line);
        }
        return sectionLines.join('\n').trim();
    };

    const aboutText = getDocText('about');
    const educationText = getDocText('education');
    const projectsText = getDocText('projects');
    const skillsText = getDocText('skills');
    const contactText = getDocText('contact');
    const certificationsText = extractSection(aboutText, 'Certifications|Certifications / Courses');
    const publicationsText = extractSection(aboutText, 'Research Publications|Academic Work');

    if (/\b(resume|experience details|work experience|professional experience|career trajectory)\b/i.test(question)) {
        if (aboutText) {
            return "Here is my profile summary:\n" + aboutText.split(/---/)[2]?.trim() || aboutText;
        }
        return "I am a fresher with no prior industry experience, actively looking for an opportunity where I can apply my technical skills, gain hands-on experience, and contribute to meaningful projects.";
    }

    if (/\b(experience|industry|fresher|internship|work history)\b/i.test(question)) {
        return "I am a fresher with no prior industry experience, actively looking for an opportunity where I can apply my technical skills, gain hands-on experience, and contribute to meaningful projects.";
    }

    if (/\b(gpa|cgpa|percentage)\b/i.test(question)) {
        const gpas = [];
        const lines = educationText.split(/\n/).map(l => l.trim());
        lines.forEach(l => {
            const m = l.match(/(B\.Tech|Intermediate|High School|Amrita School of Engineering|Narayana Junior College|Dr\. KKR's Gowtham).*?([0-9]+\.?[0-9]*)\s*\/\s*10|([0-9]+\.?[0-9]*)/i);
            if (m) {
                const grade = m[1] || m[3];
                // fallback: capture GPA pattern later
            }
        });

        const gpaMatches = educationText.match(/GPA\s*[:\-]?\s*([0-9]+\.?[0-9]*)/gi) || [];
        const unique = [...new Set(gpaMatches.map(v => v.match(/([0-9]+\.?[0-9]*)/)[1]))];
        if (unique.length) {
            let resp = "I have the following GPA records:";
            if (unique[0]) resp += `\n- B.Tech GPA: ${unique[0]}/10`;
            if (unique[1]) resp += `\n- Intermediate GPA: ${unique[1]}/10`;
            if (unique[2]) resp += `\n- High School GPA: ${unique[2]}/10`;
            return resp;
        }

        // fallback: include interpreted education lines
        return "My education record includes: \n" + formatAsBulletList(educationText);
    }

    if (/\b(technical skills|skills|tool|tools|frameworks?)\b/i.test(question)) {
        if (skillsText) {
            return "Technical Skills:\n" + formatAsBulletList(skillsText);
        }
        return "I am skilled with Python, HTML/CSS, SQL, TensorFlow, PyTorch, scikit-learn, NumPy, OpenCV, Django, AWS, Git, MATLAB, and other data/AI tools.";
    }

    if (/\b(strength|strengths|personal traits)\b/i.test(question)) {
        return "Strengths / Personal Traits:\n- Quick learner and adaptable to new technologies\n- Strong problem-solving and analytical thinking\n- Team player with collaborative mindset\n- Passionate about AI and continuous learning\n- Ability to work on real-world projects";
    }

    if (/\b(weakness|improvement|areas of improvement|improve)\b/i.test(question)) {
        return "Areas of Improvement / Weakness:\n- Fresher with no industry experience\n- Actively improving through projects, research, and self-learning\n- Working on gaining more real-world exposure";
    }

    if (/\b(achievement|achievements|certifications|awards)\b/i.test(question)) {
        let responseParts = [];

        if (certificationsText) {
            responseParts.push("Certifications:\n" + certificationsText);
        } else if (aboutText.toLowerCase().includes('certifications')) {
            const certInfo = aboutText.match(/\bCertifications(?:\s*\/\s*Courses)?\b[\s\S]*?(?=---|$)/i);
            if (certInfo) responseParts.push(certInfo[0].trim());
        }

        // include project achievements when available
        if (projectsText) {
            responseParts.push("Project Achievements:\n" + projectsText.split(/\n/).slice(0, 6).join('\n')); // top 6 lines for a concise summary
        }

        if (responseParts.length) {
            return responseParts.join('\n\n');
        }

        return "No certifications or achievements are listed in the profile data.";
    }

    if (/(research|publication|paper|ieee)/i.test(question)) {
        if (publicationsText) {
            return "Research Publications / Academic Work:\n" + publicationsText;
        }
        if (aboutText.toLowerCase().includes('research publications') || aboutText.toLowerCase().includes('academic work')) {
            const info = aboutText.match(/\bResearch Publications(?:\s*\/\s*Academic Work)?\b[\s\S]*?(?=---|$)/i);
            if (info) return info[0].trim();
            return "Research publications are mentioned in profile data. (Compiler for Mathematical Operations, Visio-Voice, eKart, Energy Management System).";
        }
        return "No publications are listed in the current profile data.";
    }

    if (/\b(objective|goal|career objective|career goal)\b/i.test(question)) {
        return "Career Objective / Goals:\n- To work as an AI/ML Engineer in a growth-oriented organization\n- To build scalable and impactful AI solutions\n- To specialize in NLP, LLMs, and data-driven systems\n- To continuously learn and contribute to cutting-edge technologies";
    }

    // explicit fallback category mapping
    const categoryMap = [
        {regex: /\b(projects?|show projects?)\b/i, file: 'projects'},
        {regex: /\b(skills?)\b/i, file: 'skills'},
        {regex: /\b(education|school|college|university|graduation)\b/i, file: 'education'},
        {regex: /\b(contact|email|phone|linkedin|github)\b/i, file: 'contact'},
        {regex: /\b(about|who is|tell me about)\b/i, file: 'about'}
    ];

    for (const map of categoryMap) {
        if (map.regex.test(lower)) {
            const match = ragContent.find(item => item.source.includes(map.file));
            if (match) {
                if (CHATBOT_DEBUG) console.debug(`source= ${map.file} (category)`);
                return formatResponse(question, match.text);
            }
        }
    }

    if (/^(who are you|what('?| )s your name|name|who is gurunadh|who is gurunadh kothuru)$/i.test(lower)) {
        return "I am Gurunadh Kothuru, an aspiring AI engineer and machine learning enthusiast.";
    }

    if (/(tell me about yourself|about yourself|tell me about you|about me|who is gurunadh)/i.test(lower)) {
        return "I am Gurunadh Kothuru, an aspiring AI engineer and machine learning enthusiast with a B.Tech in AI Engineering. I like building impactful AI solutions and working on practical ML projects.";
    }

    if (/(about)/i.test(lower)) {
        const match = ragContent.find(item => item.source.includes('about'));
        if (match) {
            return personalAnswer(truncateLongAnswer(extractShortParagraph(match.text, 3)));
        }
    }

    if (/(hi|hello|hey|greetings)/i.test(lower)) {
        return "Hello! I’m Guru. Ask me anything about education, projects, skills, or contact information.";
    }

    if (/(study|education|school|college|university|graduation)/i.test(lower)) {
        const match = ragContent.find(item => item.source.includes('education'));
        if (match) return match.text;
    }

    if (/(projects?|project list|list projects)/i.test(lower)) {
        const match = ragContent.find(item => item.source.includes('projects'));
        if (match) return match.text;
    }

    if (/(skills?|technical skills)/i.test(lower)) {
        const match = ragContent.find(item => item.source.includes('skills'));
        if (match) return match.text;
    }

    if (/(contact|email|phone|linkedin|github)/i.test(lower)) {
        const match = ragContent.find(item => item.source.includes('contact'));
        if (match) return match.text;
    }

    if (/(gpa|cgpa|percentage)/i.test(lower)) {
        const education = ragContent.find(item => item.source.includes('education'))?.text || '';
        const gpaMatches = (education.match(/GPA\s*[:\-]?\s*([0-9]+\.?[0-9]*)/gi) || []).map(v => v.match(/([0-9]+\.?[0-9]*)/)[1]);
        if (gpaMatches.length) {
            const [btech, inter, high] = gpaMatches;
            let output = 'My GPA details are:';
            if (btech) output += `\n- B.Tech: ${btech}/10`;
            if (inter) output += `\n- Intermediate: ${inter}/10`;
            if (high) output += `\n- High School: ${high}/10`;
            return output;
        }
        return "My profile contains education details but exact GPA values are not found in the text.";
    }

    if (/(explain any 1 project|explain any project|explain one project)/i.test(lower)) {
        return "I can explain any of these:\n1. Visio-Voice\n2. Crowd Monitoring\n3. eKart\n4. Heart Disease Prediction\n5. Maze Solving\n6. University Course Re-registration";
    }

    const projectDetailed = {
        visio: "Visio-Voice: a multimodal accessible system for visually impaired users. Input images are processed via CNN-based feature extraction, mapped through an LSTM sequence generation model to create textual descriptions, then converted to speech using gTTS.",
        crowd: "Crowd Monitoring: a real-time computer vision pipeline using YOLO-style object detection and behavior classification to identify overcrowding and fight patterns, with alerting for public safety.",
        ekart: "eKart: full-stack cloud e-commerce platform with product catalog, user auth, cart management, and AWS deployment for scalability and availability.",
        heart: "Heart Disease Prediction: ML model using features like age, blood pressure, cholesterol, and domain features trained with classification algorithms for risk analysis and decision support.",
        maze: "Maze Solving: image-processing solution with morphological operations (erosion/dilation) to detect walls and find optimum path from start to goal.",
        course: "University Course Re-registration: Django + SQL web app to streamline student course selection, schedule validation, and enrollment workflow."
    };

    if (/\b(project\s*4|heart disease)\b/i.test(lower)) {
        return projectDetailed.heart;
    }
    if (/\b(project\s*1|visio.*voice|visio-voice)\b/i.test(lower)) {
        return projectDetailed.visio;
    }
    if (/\b(project\s*2|crowd monitoring|fight detection)\b/i.test(lower)) {
        return projectDetailed.crowd;
    }
    if (/\b(project\s*3|ekart|e-commerce)\b/i.test(lower)) {
        return projectDetailed.ekart;
    }
    if (/\b(project\s*5|maze solving)\b/i.test(lower)) {
        return projectDetailed.maze;
    }
    if (/\b(project\s*6|course re-registration|re-registration)\b/i.test(lower)) {
        return projectDetailed.course;
    }

    if (/visio.*voice.*algorithm/i.test(lower) || /(what|which).*(algorithm|models?).*(visio.*voice)/i.test(lower)) {
        return "The profile entry for Visio-Voice does not list specific algorithms. It is an image-to-sound solution, so likely the project uses computer vision + audio synthesis pipelines (image feature extraction and sound mapping).";
    }

    if (/(paper publications|publications|research paper|ieee)/i.test(lower)) {
        const aboutMatch = ragContent.find(item => item.source.includes('about'));
        const pubs = aboutMatch ? extractSection(aboutMatch.text, 'Research Publications|Academic Work') : '';
        if (pubs) {
            return "Research Publications / Academic Work:\n" + pubs;
        }
        return "No publications are listed in the current profile data.";
    }

    if (/(top|best).*(project|projects)/i.test(lower) || /(project|projects).*(top|best)/i.test(lower)) {
        const projects = ragContent.find(item => item.source.includes('projects'));
        if (projects) {
            const lines = projects.text.split(/[\n\.]+/).map(l => l.trim()).filter(Boolean);
            const top = lines.slice(0, 3);
            if (top.length) {
                return `Top 3 projects:\n1. ${top[0]}\n2. ${top[1] || top[0]}\n3. ${top[2] || top[1] || top[0]}`;
            }
        }
    }

    if (/(project|projects)/i.test(lower)) {
        const match = ragContent.find(item => item.source.includes('projects'));
        if (match) return formatResponse(question, match.text);
    }

    if (/(skill|skills|tool|tools|framework)/i.test(lower)) {
        const match = ragContent.find(item => item.source.includes('skills'));
        if (match) return formatResponse(question, match.text);
    }

    if (/(contact|email|phone|linkedin|github)/i.test(lower)) {
        const match = ragContent.find(item => item.source.includes('contact'));
        if (match) return formatResponse(question, match.text);
    }

    if (/(explain any 1 project|explain any project)/i.test(lower)) {
        return "Pick one for details: 1. Visio-Voice, 2. Crowd Monitoring, 3. eKart, 4. Heart Disease Prediction, 5. Maze Solving, 6. Course Re-registration.";
    }

    if (/(explain|about).*\b(visio|crowd|ekart|heart|maze|course)\b/i.test(lower)) {
        if (/visio/.test(lower)) return projectDetailed.visio;
        if (/crowd/.test(lower)) return projectDetailed.crowd;
        if (/ekart|e-commerce/.test(lower)) return projectDetailed.ekart;
        if (/heart|heart disease/.test(lower)) return projectDetailed.heart;
        if (/maze/.test(lower)) return projectDetailed.maze;
        if (/course|re-registration/.test(lower)) return projectDetailed.course;
    }

    // no 
    if (/(achievements|certifications|awards)/i.test(lower)) {
        return "No achievements or certifications are listed in the current profile data.";
    }

    if (/(publications|papers|research)/i.test(lower)) {
        return "No publications are listed in the current profile data.";
    }

    if (/(name|who are you)/i.test(lower)) {
        return "I am Guru, portfolio assistant for Gurunadh Kothuru.";
    }

    if (/(from|location|where.*from)/i.test(lower)) {
        return "Information is based on the portfolio data in this site, and identifies Gurunadh’s study and work context (Amrita School of Engineering, Narayana Junior College).";
    }

    if (/(how are you|how do you do|i.*good)/i.test(lower)) {
        return "I am a chatbot assistant built to answer questions about Gurunadh; I don't have personal feelings, but I’m here to help.";
    }

    if (/\b(learn|learning|experience|skillset).*(project|projects)/i.test(lower)) {
        const proj = ragContent.find(item => item.source.includes('projects'));
        if (proj) {
            return "During projects, Guru learned advanced AI/ML model development, cloud deployment, and practical data science problem solving.\n" +
                formatAsBulletList(proj.text);
        }
    }

    const best = bestMatchFromRAG(question);
    if (best) {
        const snippet = extractAnswerSnippet(question, best);
        let final;
        if (snippet) {
            if (CHATBOT_DEBUG) console.debug('source= RAG-snippet');
            final = formatResponse(question, snippet);
        } else {
            if (CHATBOT_DEBUG) console.debug('source= RAG-best');
            const short = best.split(/[.?!]\s+/).map(s => s.trim()).filter(Boolean).slice(0, 3).join('. ');
            final = formatResponse(question, short);
        }
        return truncateLongAnswer(final);
    }

    return "I’m focused on Gurunadh’s profile data and can only answer directly from those details.";
}

async function queryGuruBot(question) {
    addMessage('⏳ Guru is thinking...', 'bot');

    try {
        const response = await fetch(`${window.location.origin}/api/query`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ question })
        });

        if (response.ok) {
            const data = await response.json();
            const loading = chatbotMessages.querySelector('.bot:last-child');
            if (loading && loading.textContent === '⏳ Guru is thinking...') loading.remove();
            const rawAnswer = data.answer || 'Sorry, I could not answer that right now.';
            const out = formatResponse(question, rawAnswer);
            addMessage(out, 'bot');
            return;
        }

        console.warn('API /api/query response non-ok', response.status);
        throw new Error(`API status ${response.status}`);
    } catch (error) {
        const loading = chatbotMessages.querySelector('.bot:last-child');
        if (loading && loading.textContent === '⏳ Guru is thinking...') loading.remove();

        const localAnswer = getLocalRagAnswer(question);
        addMessage(localAnswer, 'bot');
        console.error('RAG server fetch failed; using local static QA. Error:', error);
    }
}

function openChatbot() {
    if (!chatbotPanel) return;
    chatbotPanel.classList.add('open');
    chatbotPanel.setAttribute('aria-hidden', 'false');
}

function closeChatbot() {
    if (!chatbotPanel) return;
    chatbotPanel.classList.remove('open');
    chatbotPanel.setAttribute('aria-hidden', 'true');
}

function toggleChatbotFullscreen() {
    if (!chatbotPanel) return;
    chatbotPanel.classList.toggle('fullscreen');
    if (chatbotPanel.classList.contains('fullscreen')) {
        chatbotPanel.style.resize = 'none';
    } else {
        chatbotPanel.style.resize = 'both';
    }
}

async function initChatbot() {
    initialBotPrompt();
    await loadRagData();
}

if (chatbotToggle) {
    chatbotToggle.addEventListener('click', () => {
        if (chatbotPanel.classList.contains('open')) closeChatbot();
        else openChatbot();
    });
}
if (chatbotMaximize) {
    chatbotMaximize.addEventListener('click', toggleChatbotFullscreen);
}
if (chatbotClose) {
    chatbotClose.addEventListener('click', closeChatbot);
}
if (chatbotForm) {
    chatbotForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const question = chatbotInput.value.trim();
        if (!question) return;
        addMessage(question, 'user');
        chatbotInput.value = '';
        await queryGuruBot(question);
    });
}

if (chatbotInput) {
    chatbotInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            if (chatbotForm) {
                chatbotForm.requestSubmit();
            }
        }
    });
}

initChatbot();
