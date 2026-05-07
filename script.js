/* ===============================================
   RETIREMENT INVITATION — Interactive Logic
   =============================================== */

(function () {
  'use strict';

  // ---- Constants ----
  const STORAGE_KEY = 'retirement_guests';
  const LOCAL_COUNT_KEY = 'retirement_guest_count';
  // Event date: June 20, 2026, 18:00 (local time)
  const EVENT_DATE = new Date(2026, 5, 20, 18, 0, 0);

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
  // 5. GUEST LIST — Client-side with API fallback
  // ================================================================
  function getLocalGuestCount() {
    const count = localStorage.getItem(LOCAL_COUNT_KEY);
    return count ? parseInt(count) : 0;
  }

  function incrementLocalGuestCount() {
    const current = getLocalGuestCount();
    const newCount = current + 1;
    localStorage.setItem(LOCAL_COUNT_KEY, newCount.toString());
    return newCount;
  }

  function updateGuestCountDisplay(count) {
    if (guestCountDisplay) {
      guestCountDisplay.textContent = count;
    }
  }

  async function updateGuestCount() {
    // First show local count immediately
    const localCount = getLocalGuestCount();
    updateGuestCountDisplay(localCount);

    // Then try to fetch from server
    try {
      const response = await fetch('/api/guests');
      if (response.ok) {
        const guests = await response.json();
        const attending = guests.filter(g => g.attending === 'yes').length;
        // Use server count if it's higher
        const displayCount = Math.max(attending, localCount);
        updateGuestCountDisplay(displayCount);
        // Sync local storage
        localStorage.setItem(LOCAL_COUNT_KEY, displayCount.toString());
      }
    } catch (err) {
      // Server unavailable, keep using local count
      console.log('Using local guest count:', localCount);
    }
  }

  async function saveGuest(name, attending) {
    // Always increment local count if attending
    if (attending === 'yes') {
      const newCount = incrementLocalGuestCount();
      updateGuestCountDisplay(newCount);
    }

    // Try to save to server
    try {
      await fetch('/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, attending })
      });
    } catch (err) {
      console.log('Server unavailable, guest saved locally');
    }
  }

  // ================================================================
  // 6. CSV DOWNLOAD
  // ================================================================
  window.downloadGuestList = function () {
    window.location.href = '/api/download';
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
        submitBtn.textContent = 'Жіберілуде...';
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
      if (e.target.closest('a, button')) return;
      photosSection.classList.toggle('text-hidden');
    });
  }

  // ================================================================
  // 10. VINYL DISC MUSIC PLAYER
  // ================================================================
  function setupVinylPlayer() {
    const audio = document.getElementById('bgMusic');
    const vinylPlayer = document.getElementById('vinylPlayer');
    const vinylDisc = document.getElementById('vinylDisc');
    const vinylStatus = document.getElementById('vinylStatus');

    if (!audio || !vinylPlayer) return;

    let isPlaying = false;

    function toggleMusic() {
      if (isPlaying) {
        audio.pause();
        vinylDisc.classList.remove('spinning');
        vinylDisc.classList.add('paused');
        vinylStatus.textContent = '▶';
        vinylPlayer.classList.remove('playing');
      } else {
        audio.play().then(() => {
          vinylDisc.classList.add('spinning');
          vinylDisc.classList.remove('paused');
          vinylStatus.textContent = '❚❚';
          vinylPlayer.classList.add('playing');
        }).catch(err => {
          console.log('Autoplay blocked, user interaction needed:', err);
        });
      }
      isPlaying = !isPlaying;
    }

    vinylPlayer.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMusic();
    });

    // Auto-play on first user interaction (click anywhere)
    function autoPlayOnInteraction() {
      if (!isPlaying) {
        audio.play().then(() => {
          isPlaying = true;
          vinylDisc.classList.add('spinning');
          vinylDisc.classList.remove('paused');
          vinylStatus.textContent = '❚❚';
          vinylPlayer.classList.add('playing');
        }).catch(() => {});
      }
      document.removeEventListener('click', autoPlayOnInteraction);
      document.removeEventListener('touchstart', autoPlayOnInteraction);
      document.removeEventListener('scroll', autoPlayOnInteraction);
    }

    document.addEventListener('click', autoPlayOnInteraction, { once: false });
    document.addEventListener('touchstart', autoPlayOnInteraction, { once: false });
    document.addEventListener('scroll', autoPlayOnInteraction, { once: false });

    // Handle audio ending (though it loops, just in case)
    audio.addEventListener('ended', () => {
      isPlaying = false;
      vinylDisc.classList.remove('spinning');
      vinylStatus.textContent = '▶';
      vinylPlayer.classList.remove('playing');
    });
  }

  // ================================================================
  // 11. COUNTDOWN TIMER
  // ================================================================
  function setupCountdown() {
    const daysEl = document.getElementById('countDays');
    const hoursEl = document.getElementById('countHours');
    const minutesEl = document.getElementById('countMinutes');
    const secondsEl = document.getElementById('countSeconds');

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

    function updateCountdown() {
      const now = new Date();
      const diff = EVENT_DATE - now;

      if (diff <= 0) {
        daysEl.textContent = '0';
        hoursEl.textContent = '0';
        minutesEl.textContent = '0';
        secondsEl.textContent = '0';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      daysEl.textContent = days;
      hoursEl.textContent = hours.toString().padStart(2, '0');
      minutesEl.textContent = minutes.toString().padStart(2, '0');
      secondsEl.textContent = seconds.toString().padStart(2, '0');
    }

    // Update immediately, then every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
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
    setupVinylPlayer();
    setupCountdown();
    updateGuestCount();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
