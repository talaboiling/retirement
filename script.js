/* ===============================================
   BIRTHDAY INVITATION — Interactive Logic
   =============================================== */

(function () {
  'use strict';

  // ---- Storage Key ----
  const STORAGE_KEY = 'birthday_guests';

  // ---- DOM References ----
  const sections = document.querySelectorAll('.section');
  const navDots = document.querySelectorAll('.nav-dot');
  const scrollProgress = document.getElementById('scrollProgress');
  const rsvpForm = document.getElementById('rsvpForm');
  const formSuccess = document.getElementById('formSuccess');
  const downloadBtn = document.getElementById('downloadBtn');
  const guestCountDisplay = document.getElementById('guestCountDisplay');

  // ================================================================
  // 1. FLOATING PARTICLES (Hero section background)
  // ================================================================
  function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const count = window.innerWidth < 768 ? 15 : 30;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.classList.add('particle');
      const size = Math.random() * 4 + 1;
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDuration = (Math.random() * 12 + 8) + 's';
      particle.style.animationDelay = (Math.random() * 10) + 's';
      particle.style.opacity = 0;
      container.appendChild(particle);
    }
  }

  // ================================================================
  // 2. SCROLL OBSERVATION — Animate elements on scroll
  // ================================================================
  function setupScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-in');
    const observerOptions = {
      root: null,
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    animatedElements.forEach(el => observer.observe(el));
  }

  // ================================================================
  // 3. ACTIVE SECTION TRACKING — Nav dots + scroll progress
  // ================================================================
  function setupSectionTracking() {
    const sectionObserverOptions = {
      root: null,
      threshold: 0.5
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Array.from(sections).indexOf(entry.target);
          updateActiveDot(idx);
        }
      });
    }, sectionObserverOptions);

    sections.forEach(section => sectionObserver.observe(section));

    // Nav dot click
    navDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.getAttribute('data-section'));
        sections[idx].scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Scroll progress bar
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      scrollProgress.style.width = progress + '%';
    }, { passive: true });
  }

  function updateActiveDot(activeIdx) {
    navDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIdx);
    });
  }

  // ================================================================
  // 4. COUNTER ANIMATION — Stats numbers
  // ================================================================
  function setupCounters() {
    const counters = document.querySelectorAll('.stat__number[data-count]');

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => counterObserver.observe(c));
  }

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'));
    const duration = 1800;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.round(eased * target);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ================================================================
  // ================================================================
  // 5. GUEST LIST — API Calls
  // ================================================================
  async function updateGuestCount() {
    try {
      const response = await fetch('/api/guests');
      const guests = await response.json();
      const attending = guests.filter(g => g.attending === 'yes').length;
      if (guestCountDisplay) {
        guestCountDisplay.textContent = attending;
      }
      // Show download button if there are guests
      if (downloadBtn) {
        downloadBtn.style.display = guests.length > 0 ? 'inline-flex' : 'none';
      }
    } catch (err) {
      console.error('Error fetching guests:', err);
    }
  }

  async function saveGuest(name, attending) {
    try {
      await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, attending })
      });
      updateGuestCount();
    } catch (err) {
      console.error('Error saving guest:', err);
    }
  }

  // ================================================================
  // 6. CSV DOWNLOAD
  // ================================================================
  window.downloadGuestList = function () {
    window.location.href = '/api/guests/download';
  };

  // ================================================================
  // 7. FORM SUBMISSION
  // ================================================================
  function setupForm() {
    if (!rsvpForm) return;

    rsvpForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('guestName').value.trim();
      const attendance = document.querySelector('input[name="attendance"]:checked');

      if (!name || !attendance) return;

      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      // Save
      await saveGuest(name, attendance.value);

      // Animate out form, show success
      rsvpForm.style.opacity = '0';
      rsvpForm.style.transform = 'translateY(-10px)';
      rsvpForm.style.transition = 'all 0.4s ease';

      setTimeout(() => {
        rsvpForm.classList.add('form--hidden');
        formSuccess.classList.add('show');
      }, 400);
    });
  }

  // ================================================================
  // 8. KEYBOARD NAVIGATION — Arrow keys to navigate sections
  // ================================================================
  function setupKeyboardNav() {
    let currentSection = 0;

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        currentSection = Math.min(currentSection + 1, sections.length - 1);
        sections[currentSection].scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        currentSection = Math.max(currentSection - 1, 0);
        sections[currentSection].scrollIntoView({ behavior: 'smooth' });
      }
    });

    // Keep currentSection in sync with scroll
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          currentSection = Array.from(sections).indexOf(entry.target);
        }
      });
    }, { threshold: 0.5 });

    sections.forEach(s => sectionObserver.observe(s));
  }

  // ================================================================
  // 9. PHOTO SECTION — Click to toggle text fade in/out
  // ================================================================
  function setupPhotoToggle() {
    const photosSection = document.getElementById('section-photos');
    if (!photosSection) return;

    photosSection.addEventListener('click', (e) => {
      // Don't toggle if user is clicking on a link or button inside
      if (e.target.closest('a, button')) return;
      photosSection.classList.toggle('text-hidden');
    });
  }

  // ================================================================
  // INIT
  // ================================================================
  function init() {
    createParticles();
    setupScrollAnimations();
    setupSectionTracking();
    setupCounters();
    setupForm();
    setupKeyboardNav();
    setupPhotoToggle();
    updateGuestCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
