/* ─────────────────────────────────────────────────────────────────────────
   SPA NAVIGATION SYSTEM
   Zoom-in/zoom-out card navigation with blur transitions for Ecosistema Digital

   Features:
   - Animated card navigation with zoom and blur effects
   - Multi-level hierarchy (base -> sections -> sub-panels)
   - Keyboard support (ESC to close)
   - Browser history management
   - Deep linking via URL hash
   - Body scroll locking during overlays
   - Touch device optimization
   - Re-run reveal observers on new content
   ───────────────────────────────────────────────────────────────────────── */

const SPA = {
  // State management
  levelStack: [],        // Stack of navigation levels
  currentLevel: 0,
  isAnimating: false,
  isScrollLocked: false,

  // Configuration
  ANIM_DURATION: 500,    // ms - smooth cubic-bezier animation
  EASING: 'cubic-bezier(0.22, 1, 0.36, 1)',

  // Initialize the entire SPA system
  init() {
    this.setupCardHandlers();
    this.setupBackHandlers();
    this.setupKeyboardHandlers();
    this.setupHistoryHandlers();
    this.checkInitialHash();
    this.setupTouchOptimizations();
  },

  /**
   * Set up click handlers for main section cards
   */
  setupCardHandlers() {
    // Main section cards
    document.querySelectorAll('.spa-card[data-section]').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const sectionId = card.dataset.section;
        this.navigateTo(sectionId);
      });
    });

    // Sub-cards
    document.querySelectorAll('.spa-subcard[data-sub]').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const subId = card.dataset.sub;
        this.navigateToSub(subId);
      });
    });
  },

  /**
   * Set up click-outside handlers — clicking on the overlay
   * background (outside .spa-section-content) closes the panel
   */
  setupBackHandlers() {
    // Click on overlay background (outside content) to close
    document.addEventListener('click', (e) => {
      // Check if click is directly on the overlay (not on content inside)
      if (e.target.classList.contains('spa-section-overlay')) {
        e.stopPropagation();
        this.navigateBack();
      }
      if (e.target.classList.contains('spa-sub-panel')) {
        e.stopPropagation();
        this.navigateBack();
      }
    });
  },

  /**
   * Set up keyboard handlers (ESC to close)
   */
  setupKeyboardHandlers() {
    document.addEventListener('keydown', (e) => {
      // ESC key closes current level
      if (e.key === 'Escape' && this.levelStack.length > 0) {
        e.preventDefault();
        this.navigateBack();
      }
    });
  },

  /**
   * Set up browser back button handling via popstate
   */
  setupHistoryHandlers() {
    window.addEventListener('popstate', (e) => {
      if (this.levelStack.length > 0) {
        this.navigateBack(true); // skipHistory = true
      }
    });
  },

  /**
   * Check URL hash on page load and navigate if needed
   */
  checkInitialHash() {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash && document.getElementById('spa-section-' + hash)) {
      // Delay to ensure DOM is fully ready
      setTimeout(() => this.navigateTo(hash), 300);
    }
  },

  /**
   * Detect touch devices and add appropriate class
   */
  setupTouchOptimizations() {
    const isTouchDevice = () => {
      return (('ontouchstart' in window) ||
              (navigator.maxTouchPoints > 0) ||
              (navigator.msMaxTouchPoints > 0));
    };

    if (isTouchDevice()) {
      document.body.classList.add('is-touch-device');
    }
  },

  /**
   * Lock body scroll when overlay is active
   */
  lockScroll() {
    if (this.isScrollLocked) return;
    this.isScrollLocked = true;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = scrollbarWidth + 'px';
  },

  /**
   * Unlock body scroll when returning to base
   */
  unlockScroll() {
    if (!this.isScrollLocked) return;
    this.isScrollLocked = false;

    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  },

  /**
   * Navigate to a main section
   * Zooms in with blur effect on parent level
   */
  navigateTo(sectionId) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const base = document.getElementById('spa-base');
    const section = document.getElementById('spa-section-' + sectionId);

    if (!base || !section) {
      this.isAnimating = false;
      return;
    }

    // Add to navigation stack
    this.levelStack.push({
      sectionId,
      type: 'section'
    });

    // Update URL hash
    window.history.pushState(
      { level: this.levelStack.length },
      '',
      '#' + sectionId
    );

    // Lock scroll
    this.lockScroll();

    // Animate base layer (blur, scale down, fade)
    base.style.transition = `all ${this.ANIM_DURATION}ms ${this.EASING}`;
    base.style.filter = 'blur(12px)';
    base.style.transform = 'scale(0.92)';
    base.style.opacity = '0.3';
    base.style.pointerEvents = 'none';

    // Prepare section (start from small, scaled position)
    section.classList.add('active');
    section.style.opacity = '0';
    section.style.transform = 'scale(0.88)';

    // Force reflow then animate section in (double-rAF for reliability)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        section.style.transition = `opacity ${this.ANIM_DURATION}ms ${this.EASING}, transform ${this.ANIM_DURATION}ms ${this.EASING}`;
        section.style.opacity = '1';
        section.style.transform = 'scale(1)';
      });
    });

    // Update navigation highlights
    this.updateNav(sectionId);

    // Hide PUM-AI when inside a panel
    const pumai = document.getElementById('pumaiBtn');
    if (pumai) pumai.style.display = 'none';

    // Smooth scroll overlay to top
    section.scrollTop = 0;

    // Complete animation and re-run observers
    setTimeout(() => {
      this.isAnimating = false;
      this.rerunRevealObserver(section);
    }, this.ANIM_DURATION + 50);
  },

  /**
   * Navigate to a sub-panel within current section
   * Zooms in with blur on section content
   */
  navigateToSub(subId) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const currentSection = this.getCurrentSection();
    if (!currentSection) {
      this.isAnimating = false;
      return;
    }

    const subPanel = document.getElementById('spa-sub-' + subId);
    if (!subPanel) {
      this.isAnimating = false;
      return;
    }

    // Add to navigation stack
    this.levelStack.push({
      subId,
      type: 'sub'
    });

    // Lock scroll
    this.lockScroll();

    // Blur section content (parent level)
    const sectionContent = currentSection.querySelector('.spa-section-content');
    if (sectionContent) {
      sectionContent.style.transition = `all ${this.ANIM_DURATION}ms ${this.EASING}`;
      sectionContent.style.filter = 'blur(8px)';
      sectionContent.style.transform = 'scale(0.95)';
      sectionContent.style.opacity = '0.3';
      sectionContent.style.pointerEvents = 'none';
    }

    // Prepare sub-panel (small scaled position)
    subPanel.classList.add('active');
    subPanel.style.opacity = '0';
    subPanel.style.transform = 'scale(0.85) translateY(20px)';

    // Trigger reflow and animate in
    requestAnimationFrame(() => {
      subPanel.style.transition = `all ${this.ANIM_DURATION}ms ${this.EASING}`;
      subPanel.style.opacity = '1';
      subPanel.style.transform = 'scale(1) translateY(0)';
    });

    // Complete animation and re-run observers
    setTimeout(() => {
      this.isAnimating = false;
      this.rerunRevealObserver(subPanel);
    }, this.ANIM_DURATION + 50);
  },

  /**
   * Navigate back to previous level (zoom out)
   * Current level scales up and fades, parent level is restored
   */
  navigateBack(skipHistory = false) {
    if (this.isAnimating || this.levelStack.length === 0) return;
    this.isAnimating = true;

    const last = this.levelStack.pop();

    if (last.type === 'sub') {
      // ─ Going back from sub-panel to section ─
      const subPanel = document.getElementById('spa-sub-' + last.subId);

      // Zoom out and fade sub-panel
      if (subPanel) {
        subPanel.style.transition = `all ${this.ANIM_DURATION}ms ${this.EASING}`;
        subPanel.style.opacity = '0';
        subPanel.style.transform = 'scale(1.1) translateY(-20px)';

        // Clean up after animation
        setTimeout(() => {
          subPanel.classList.remove('active');
          subPanel.style.transform = '';
          subPanel.style.opacity = '';
          subPanel.style.transition = '';
        }, this.ANIM_DURATION);
      }

      // Restore section content (remove blur, scale, opacity)
      const currentSection = this.getCurrentSection();
      if (currentSection) {
        const sectionContent = currentSection.querySelector('.spa-section-content');
        if (sectionContent) {
          sectionContent.style.transition = `all ${this.ANIM_DURATION}ms ${this.EASING}`;
          sectionContent.style.filter = 'none';
          sectionContent.style.transform = 'scale(1)';
          sectionContent.style.opacity = '1';
          sectionContent.style.pointerEvents = '';
        }
      }
    } else {
      // ─ Going back from section to base ─
      const section = document.getElementById('spa-section-' + last.sectionId);

      // Zoom out and fade section
      if (section) {
        section.style.transition = `opacity ${this.ANIM_DURATION}ms ${this.EASING}, transform ${this.ANIM_DURATION}ms ${this.EASING}`;
        section.style.opacity = '0';
        section.style.transform = 'scale(0.92)';

        // Clean up after animation
        setTimeout(() => {
          section.classList.remove('active');
          section.style.transform = '';
          section.style.opacity = '';
          section.style.transition = '';
        }, this.ANIM_DURATION);
      }

      // Restore base layer
      const base = document.getElementById('spa-base');
      if (base) {
        base.style.transition = `all ${this.ANIM_DURATION}ms ${this.EASING}`;
        base.style.filter = 'none';
        base.style.transform = 'scale(1)';
        base.style.opacity = '1';
        base.style.pointerEvents = '';
      }

      // Update URL if not triggered by browser back
      if (!skipHistory) {
        window.history.pushState({}, '', window.location.pathname);
      }

      // Update nav to show home
      this.updateNav('inicio');

      // Show PUM-AI when back on main page
      const pumai = document.getElementById('pumaiBtn');
      if (pumai) pumai.style.display = '';

      // Unlock scroll only when fully back at base
      this.unlockScroll();
    }

    // Complete animation
    setTimeout(() => {
      this.isAnimating = false;
    }, this.ANIM_DURATION + 50);
  },

  /**
   * Get the current section element from the stack
   */
  getCurrentSection() {
    // Find the last 'section' type in the stack
    for (let i = this.levelStack.length - 1; i >= 0; i--) {
      if (this.levelStack[i].type === 'section') {
        return document.getElementById('spa-section-' + this.levelStack[i].sectionId);
      }
    }
    return null;
  },

  /**
   * Update navigation active states
   */
  updateNav(activeId) {
    document.querySelectorAll('.nav-links a[data-section]').forEach(link => {
      link.classList.toggle('active', link.dataset.section === activeId);
    });
  },

  /**
   * Re-run the reveal intersection observer on newly visible content
   * This ensures scroll-reveal animations trigger on dynamically shown content
   */
  rerunRevealObserver(containerElement) {
    if (typeof observer === 'undefined' || !observer) {
      return;
    }

    // Get all reveal elements that haven't been revealed yet
    containerElement.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      observer.observe(el);
    });
  },

  /**
   * Navigate to section from navbar
   * This may require resetting the stack if we're in a nested state
   */
  goToSection(sectionId) {
    // Special case: go back to home
    if (sectionId === 'inicio') {
      this.goHome();
      return;
    }

    // If already in a section, reset cleanly without animation
    if (this.levelStack.length > 0) {
      this.resetStackSilently();
    }

    // Navigate to target section
    setTimeout(() => this.navigateTo(sectionId), 50);
  },

  /**
   * Return to home and clear all overlays
   */
  goHome() {
    // Close all overlays instantly without animation
    this.resetStackSilently();

    // Update navigation
    this.updateNav('inicio');

    // Unlock scroll
    this.unlockScroll();

    // Update URL
    window.history.pushState({}, '', window.location.pathname);
  },

  /**
   * Reset the entire stack silently (used for navigation between sections)
   */
  resetStackSilently() {
    // Remove all active overlays without animation
    document.querySelectorAll('.spa-section-overlay.active').forEach(section => {
      section.classList.remove('active');
      section.style.opacity = '';
      section.style.transform = '';
      section.style.transition = '';
      section.style.filter = '';
    });

    document.querySelectorAll('.spa-sub-panel.active').forEach(panel => {
      panel.classList.remove('active');
      panel.style.opacity = '';
      panel.style.transform = '';
      panel.style.transition = '';
      panel.style.filter = '';
    });

    // Restore base
    const base = document.getElementById('spa-base');
    if (base) {
      base.style.filter = '';
      base.style.transform = '';
      base.style.opacity = '';
      base.style.pointerEvents = '';
      base.style.transition = '';
    }

    // Reset stack
    this.levelStack = [];
    this.currentLevel = 0;
  }
};

// Initialize once when DOM is ready (defer scripts run after parsing)
(function() {
  let initialized = false;
  function initOnce() {
    if (initialized) return;
    initialized = true;
    SPA.init();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnce);
  } else {
    initOnce();
  }
})();
