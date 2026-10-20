// Dynamic copyright year
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// ----------------------------------------------------
// 1. Dark / Light Theme Toggle
// ----------------------------------------------------
const themeToggleBtn = document.getElementById('theme-toggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

const setTheme = (theme, persist = false) => {
  document.documentElement.setAttribute('data-theme', theme);
  if (persist) {
    localStorage.setItem('theme', theme);
  }
  if (themeToggleBtn) {
    const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    themeToggleBtn.setAttribute('aria-label', label);
    themeToggleBtn.setAttribute('title', label);
  }
};

// Initialize theme on load without locking out OS preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  setTheme(savedTheme, false);
} else {
  setTheme(prefersDark.matches ? 'dark' : 'light', false);
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(currentTheme === 'dark' ? 'light' : 'dark', true);
  });
}

// Respond to OS/browser theme preference changes if user hasn't explicitly set one
prefersDark.addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    setTheme(e.matches ? 'dark' : 'light', false);
  }
});

// ----------------------------------------------------
// 2. Mobile Navigation Toggle & Accessibility
// ----------------------------------------------------
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

if (navToggle && siteNav) {
  const openMenu = () => {
    siteNav.classList.add('is-open');
    navToggle.classList.add('is-active');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close navigation');
  };

  const closeMenu = () => {
    siteNav.classList.remove('is-open');
    navToggle.classList.remove('is-active');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation');
  };

  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = siteNav.classList.contains('is-open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close when clicking any nav link
  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close when clicking outside of the navigation
  document.addEventListener('click', (e) => {
    if (siteNav.classList.contains('is-open')) {
      if (!siteNav.contains(e.target) && !navToggle.contains(e.target)) {
        closeMenu();
      }
    }
  });

  // Close on Escape key and return focus to toggle
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && siteNav.classList.contains('is-open')) {
      closeMenu();
      navToggle.focus();
    }
  });

  // Reset menu when resized above mobile breakpoint
  window.addEventListener('resize', () => {
    if (window.innerWidth > 700 && siteNav.classList.contains('is-open')) {
      closeMenu();
    }
  });
}

// ----------------------------------------------------
// 3. Scroll-Spy Active Navigation
// ----------------------------------------------------
const navLinks = document.querySelectorAll('.site-nav a[href^="#"]');
const trackedSections = Array.from(navLinks)
  .map((link) => {
    const id = link.getAttribute('href').slice(1);
    return document.getElementById(id);
  })
  .filter(Boolean);

const updateActiveNav = () => {
  const scrollPos = window.scrollY + 130; // Offset for header height and comfortable threshold
  let currentSectionId = '';

  trackedSections.forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    if (scrollPos >= top && scrollPos < top + height) {
      currentSectionId = section.getAttribute('id');
    }
  });

  // Detect bottom of page so contact stays active
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60) {
    if (trackedSections.length > 0) {
      currentSectionId = trackedSections[trackedSections.length - 1].getAttribute('id');
    }
  }

  navLinks.forEach((link) => {
    const targetId = link.getAttribute('href').slice(1);
    if (targetId === currentSectionId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
};

window.addEventListener('scroll', updateActiveNav, { passive: true });
updateActiveNav();

// ----------------------------------------------------
// 4. Interactive Copy Email & Contact Interactions
// ----------------------------------------------------
const copyEmailBtn = document.getElementById('copy-email-btn');
const copyLabel = document.getElementById('copy-label');
const copyFeedback = document.getElementById('copy-feedback');
const emailTextEl = document.getElementById('email-text');
const emailDisplayBox = document.getElementById('email-display-box');
const topicPills = document.querySelectorAll('.topic-pill');

const copyTextToClipboard = async (text) => {
  let copied = false;
  // Modern Clipboard API (available in secure contexts)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (e) {
      // Fall through to fallback
    }
  }

  // Fallback for file://, http://, or if Clipboard API was blocked
  if (!copied) {
    try {
      const tempInput = document.createElement('textarea');
      tempInput.value = text;
      tempInput.style.position = 'fixed';
      tempInput.style.left = '-9999px';
      tempInput.style.top = '0';
      tempInput.setAttribute('readonly', '');
      document.body.appendChild(tempInput);
      tempInput.select();
      tempInput.setSelectionRange(0, 99999);
      copied = document.execCommand('copy');
      document.body.removeChild(tempInput);
    } catch (err) {
      console.error('execCommand copy failed:', err);
    }
  }

  return copied;
};

let resetFeedbackTimeout = null;
let resetButtonTimeout = null;

const showCopySuccess = (message = '✓ Email address copied to clipboard!') => {
  if (copyEmailBtn) copyEmailBtn.classList.add('copied');
  if (copyLabel) copyLabel.textContent = 'Copied!';

  if (copyFeedback) {
    copyFeedback.className = 'copy-feedback show';
    copyFeedback.textContent = message;
  }

  clearTimeout(resetButtonTimeout);
  clearTimeout(resetFeedbackTimeout);

  resetButtonTimeout = setTimeout(() => {
    if (copyEmailBtn) copyEmailBtn.classList.remove('copied');
    if (copyLabel) copyLabel.textContent = 'Copy';
  }, 2500);

  resetFeedbackTimeout = setTimeout(() => {
    if (copyFeedback) {
      copyFeedback.className = 'copy-feedback';
      copyFeedback.textContent = '';
    }
  }, 4500);
};

if (emailTextEl) {
  const emailToCopy = emailTextEl.textContent.trim();

  const handleCopy = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const success = await copyTextToClipboard(emailToCopy);
    if (success) {
      showCopySuccess('✓ Email address copied to clipboard!');
    }
  };

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleCopy(e);
    });
  }

  if (emailDisplayBox) {
    emailDisplayBox.addEventListener('click', (e) => {
      if (e.target.closest('#copy-email-btn')) return;
      handleCopy(e);
    });

    emailDisplayBox.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCopy(e);
      }
    });
  }

  // When clicking quick topic templates: copy email and announce template opening
  topicPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      copyTextToClipboard(emailToCopy);
      const label = pill.querySelector('span')?.textContent.trim() || 'Template';
      showCopySuccess(`✓ Opening Gmail for ${label} (Email address copied!)`);
    });
  });
}

// ----------------------------------------------------
// 5. Hero Metric Counters Animation
// ----------------------------------------------------
const initCounters = () => {
  const counters = document.querySelectorAll('.counter[data-target]');
  if (!counters.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return; // Keep pre-rendered static values

  const animateCounter = (el) => {
    const target = parseFloat(el.getAttribute('data-target'));
    const decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1500;
    const startTime = performance.now();

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic: 1 - (1 - t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = (easeProgress * target).toFixed(decimals);
      el.textContent = `${currentVal}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = `${target.toFixed(decimals)}${suffix}`;
      }
    };

    requestAnimationFrame(step);
  };

  const metricsContainer = document.querySelector('.hero-metrics');
  if (metricsContainer && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            counters.forEach((c) => animateCounter(c));
            obs.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(metricsContainer);
  } else {
    counters.forEach((c) => animateCounter(c));
  }
};

initCounters();

// ----------------------------------------------------
// 6. Scroll-Driven Entrance Reveals
// ----------------------------------------------------
const initScrollReveals = () => {
  const revealEls = document.querySelectorAll('.reveal-on-scroll');
  if (!revealEls.length) return;

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealEls.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.08,
    }
  );

  revealEls.forEach((el) => revealObserver.observe(el));
};

initScrollReveals();

// ----------------------------------------------------
// 7. Back-to-Top Floating Button
// ----------------------------------------------------
const backToTopBtn = document.getElementById('back-to-top');
if (backToTopBtn) {
  const toggleBackToTop = () => {
    if (window.scrollY > 380) {
      backToTopBtn.classList.add('is-visible');
    } else {
      backToTopBtn.classList.remove('is-visible');
    }
  };

  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
}

// ----------------------------------------------------
// 8. Interactive Project Category Filtering
// ----------------------------------------------------
const initProjectFilters = () => {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card[data-category]');
  if (!filterBtns.length || !projectCards.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      // Update active button state
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter cards with smooth entrance animation
      projectCards.forEach((card) => {
        const category = card.getAttribute('data-category');
        const match = filter === 'all' || category === filter;

        if (match) {
          card.classList.remove('is-hidden');
          // Re-trigger micro-animation
          card.classList.remove('filter-animating');
          void card.offsetWidth; // Force DOM reflow
          card.classList.add('filter-animating');
        } else {
          card.classList.add('is-hidden');
          card.classList.remove('filter-animating');
        }
      });
    });
  });
};

initProjectFilters();

// ----------------------------------------------------
// 9. Interactive Certification Category Filtering
// ----------------------------------------------------
const initCertFilters = () => {
  const certFilterBtns = document.querySelectorAll('.cert-filter-btn');
  const certCards = document.querySelectorAll('.cert-card[data-cert-category]');
  if (!certFilterBtns.length || !certCards.length) return;

  certFilterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-cert-filter');

      // Update active button state
      certFilterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter cert cards with smooth entrance animation
      certCards.forEach((card) => {
        const category = card.getAttribute('data-cert-category');
        const match = filter === 'all' || category === filter;

        if (match) {
          card.classList.remove('is-hidden');
          // Re-trigger micro-animation
          card.classList.remove('filter-animating');
          void card.offsetWidth; // Force DOM reflow
          card.classList.add('filter-animating');
        } else {
          card.classList.add('is-hidden');
          card.classList.remove('filter-animating');
        }
      });
    });
  });
};

initCertFilters();
