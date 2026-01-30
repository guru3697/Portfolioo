document.addEventListener('DOMContentLoaded', function() {
    // Preloader
    const preloader = document.getElementById('preloader');
    window.addEventListener('load', () => {
        preloader.style.display = 'none';
    });

    // GSAP and ScrollTrigger registration
    gsap.registerPlugin(ScrollTrigger);

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

    // Theme Switch
    const themeSwitch = document.getElementById('checkbox');
    themeSwitch.addEventListener('change', () => {
        if (themeSwitch.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    });

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
