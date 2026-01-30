document.addEventListener("DOMContentLoaded", function () {

    /* ================= PRELOADER ================= */
    const preloader = document.getElementById("preloader");
    if (preloader) {
        window.addEventListener("load", () => {
            preloader.style.display = "none";
        });
    }

    /* ================= GSAP REGISTER ================= */
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
        gsap.registerPlugin(ScrollTrigger);
    }

    /* ================= HAMBURGER MENU ================= */
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });

        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => {
                hamburger.classList.remove("active");
                navMenu.classList.remove("active");
            });
        });
    }

    /* ================= THEME SWITCH ================= */
    const themeSwitch = document.getElementById("checkbox");
    if (themeSwitch) {
        themeSwitch.addEventListener("change", () => {
            document.documentElement.setAttribute(
                "data-theme",
                themeSwitch.checked ? "dark" : "light"
            );
        });
    }

    /* ================= HERO SECTION ANIMATION ================= */
    if (typeof gsap !== "undefined" && document.querySelector(".hero-content .fade-in")) {
        gsap.from(".hero-content .fade-in", {
            duration: 1,
            opacity: 0,
            y: 50,
            stagger: 0.2,
            ease: "power3.out"
        });
    }

    /* ================= GSAP SCROLL REVEAL (YOUR CODE) ================= */
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
        gsap.utils.toArray(".reveal").forEach(el => {
            gsap.from(el, {
                opacity: 0,
                y: 60,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: el,
                    start: "top 85%",
                    once: true
                }
            });
        });
    }

    /* ================= SECTION-BASED ANIMATIONS ================= */
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
        const sections = gsap.utils.toArray(".content-section");

        sections.forEach(section => {
            const targets = section.querySelectorAll(
                ".section-title, p, .project-card, .skill-category, .timeline-item, .card"
            );

            if (targets.length > 0) {
                gsap.from(targets, {
                    scrollTrigger: {
                        trigger: section,
                        start: "top 80%",
                        toggleActions: "play none none none"
                    },
                    opacity: 0,
                    y: 50,
                    duration: 1,
                    stagger: 0.1,
                    ease: "power3.out"
                });
            }
        });
    }

    /* ================= PARTICLES.JS ================= */
    if (
        typeof particlesJS !== "undefined" &&
        document.getElementById("particles-js")
    ) {
        particlesJS("particles-js", {
            particles: {
                number: {
                    value: 80,
                    density: { enable: true, value_area: 800 }
                },
                color: { value: "#8A2BE2" },
                shape: { type: "circle" },
                opacity: { value: 0.5 },
                size: { value: 3, random: true },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: "#8A2BE2",
                    opacity: 0.4,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 4,
                    direction: "none",
                    random: false,
                    straight: false,
                    out_mode: "out",
                    bounce: false
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: true, mode: "repulse" },
                    onclick: { enable: true, mode: "push" },
                    resize: true
                },
                modes: {
                    repulse: { distance: 100, duration: 0.4 },
                    push: { particles_nb: 4 }
                }
            },
            retina_detect: true
        });
    }

});
