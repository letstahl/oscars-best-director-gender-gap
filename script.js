(function () {
  'use strict';

  const btnSeeStory  = document.getElementById('btn-see-story');
  const btnSkipStory = document.getElementById('btn-skip-story');
  const storyWrapper = document.getElementById('story-wrapper');
  const sectionChart = document.getElementById('section-chart');

  let nomsAnswered  = false;
  let trophyAnswered = false;
  let refreshQuiz1Scrolly = null;
  let refreshQuiz2Scrolly = null;

  /* ── Slower, gentler smooth-scroll for button-triggered navigation ── */
  function smoothScrollTo(target, duration) {
    if (!target) return;
    // CSS scroll-snap fights a JS-driven scroll mid-flight (it tries to snap
    // while we're still animating), which reads as a stutter. Suspend it
    // for the duration of this animation.
    document.documentElement.classList.add('no-snap');
    const startY = window.scrollY;
    const endY = startY + target.getBoundingClientRect().top;
    const startTime = performance.now();
    function step(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      window.scrollTo(0, startY + (endY - startY) * eased);
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        document.documentElement.classList.remove('no-snap');
      }
    }
    requestAnimationFrame(step);
  }

  /* ── Gold glitter cursor trail ── */
  (function setupCursorGlitter() {
    let lastSpawn = 0;
    document.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - lastSpawn < 70) return;
      lastSpawn = now;
      const dot = document.createElement('div');
      dot.className = 'cursor-glitter';
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 700);
    }, { passive: true });
  })();

  function setupScrollCue() {
    const cue = document.getElementById('scroll-cue');
    const freeZoneStart = document.getElementById('section-db');
    if (!cue || !freeZoneStart) return;
    cue.classList.add('is-visible');
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        cue.classList.remove('is-visible');
        obs.disconnect();
      }
    }, { threshold: 0.15 });
    obs.observe(freeZoneStart);
  }

  /* ── Softer crossfade for full-screen slides ── */
  function setupFadeSections() {
    const sections = document.querySelectorAll('.fade-section');
    if (!sections.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-in-view', entry.isIntersecting);
      });
    }, { threshold: 0.35 });
    sections.forEach((s) => obs.observe(s));
  }

  /* ── Scrolly: sticky pin + floating step cards ── */
  function setupScrolly(id, gateFn) {
    const root = document.getElementById(id);
    if (!root) return null;
    const steps = Array.from(root.querySelectorAll('.scrolly-step'));
    const gate = gateFn || (() => true);

    function apply(step, intersecting) {
      step.dataset.intersecting = intersecting ? '1' : '0';
      step.classList.toggle('is-active', intersecting && gate());
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => apply(entry.target, entry.isIntersecting));
    }, { threshold: 0.5 });
    steps.forEach((s) => obs.observe(s));

    return function refresh() {
      steps.forEach((s) => apply(s, s.dataset.intersecting === '1'));
    };
  }

  function revealStory(scrollTarget) {
    storyWrapper.classList.remove('hidden');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        storyWrapper.classList.add('is-revealed');
        observeRevealBlocks();
        setupChartObserver();
        setupPictogramObserver();
        setupVoicesCarousel();
        setupScrollCue();
        setupFadeSections();
        refreshQuiz1Scrolly = setupScrolly('scrolly-quiz1', () => nomsAnswered);
        refreshQuiz2Scrolly = setupScrolly('scrolly-quiz2', () => trophyAnswered);
        setupScrolly('scrolly-chart');
        if (scrollTarget) {
          setTimeout(() => smoothScrollTo(scrollTarget, 1400), 450);
        }
      });
    });
  }

  btnSeeStory.addEventListener('click',  () => revealStory(document.getElementById('scrolly-quiz1')));
  btnSkipStory.addEventListener('click', () => revealStory(document.getElementById('section-db')));

  /* ── Reveal blocks ── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
  );

  function observeRevealBlocks() {
    document.querySelectorAll('.reveal-block').forEach((el) => revealObserver.observe(el));
  }

  /* ── Counters ── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1600;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
      else {
        el.textContent = target;
        el.classList.add('is-settled');
      }
    }
    requestAnimationFrame(step);
  }

  /* ── Chart ── */
  function setupChartObserver() {
    if (!sectionChart) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        sectionChart.classList.add('is-entered');
        if (typeof window.initOscarsChart === 'function') window.initOscarsChart();
        obs.disconnect();
      }
    }, { threshold: 0.1 });
    obs.observe(sectionChart);
  }

  /* ── Pictogram ── */
  function setupPictogramObserver() {
    const container = document.getElementById('section-db');
    if (!container) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (typeof window.initPictogram === 'function') window.initPictogram();
        obs.disconnect();
      }
    }, { threshold: 0.08 });
    obs.observe(container);
  }

  /* ── Voices carousel ── */
  function setupVoicesCarousel() {
    const track  = document.getElementById('voices-track');
    const dotsEl = document.getElementById('voices-dots');
    const prevBtn = document.getElementById('voices-prev');
    const nextBtn = document.getElementById('voices-next');
    if (!track || !dotsEl) return;

    const cards = track.querySelectorAll('.vcard');
    const total = cards.length;
    // How many cards visible at once depends on viewport
    function visibleCount() {
      const w = window.innerWidth;
      if (w < 660)  return 3;
      if (w < 860)  return 4;
      return 5;
    }

    let currentOffset = 0; // in card units
    const CARD_W = () => (cards[0] ? cards[0].offsetWidth + 2 : 182);

    function maxOffset() { return Math.max(0, total - visibleCount()); }

    // Build dots
    function buildDots() {
      dotsEl.innerHTML = '';
      const pages = maxOffset() + 1;
      for (let i = 0; i < pages; i++) {
        const dot = document.createElement('div');
        dot.className = 'voices-dot' + (i === currentOffset ? ' is-active' : '');
        dot.addEventListener('click', () => goTo(i));
        dotsEl.appendChild(dot);
      }
    }

    function updateDots() {
      dotsEl.querySelectorAll('.voices-dot').forEach((d, i) => {
        d.classList.toggle('is-active', i === currentOffset);
      });
    }

    function goTo(offset) {
      currentOffset = Math.max(0, Math.min(offset, maxOffset()));
      track.style.transform = `translateX(-${currentOffset * CARD_W()}px)`;
      updateDots();
    }

    // Wrap track for overflow clipping
    const wrapper = track.parentElement;
    wrapper.style.overflow = 'hidden';
    track.style.transition = 'transform 0.5s var(--ease-out, cubic-bezier(0.16,1,0.3,1))';
    track.style.display = 'flex';
    track.style.gap = '2px';

    prevBtn && prevBtn.addEventListener('click', () => goTo(currentOffset - 1));
    nextBtn && nextBtn.addEventListener('click', () => goTo(currentOffset + 1));

    // Drag support
    let dragStart = null;
    wrapper.addEventListener('mousedown', (e) => { dragStart = e.clientX; });
    window.addEventListener('mouseup', (e) => {
      if (dragStart === null) return;
      const dx = dragStart - e.clientX;
      if (Math.abs(dx) > 40) goTo(currentOffset + (dx > 0 ? 1 : -1));
      dragStart = null;
    });

    // Touch support
    let touchStart = null;
    wrapper.addEventListener('touchstart', (e) => { touchStart = e.touches[0].clientX; }, { passive: true });
    wrapper.addEventListener('touchend', (e) => {
      if (touchStart === null) return;
      const dx = touchStart - e.changedTouches[0].clientX;
      if (Math.abs(dx) > 40) goTo(currentOffset + (dx > 0 ? 1 : -1));
      touchStart = null;
    });

    buildDots();
    window.addEventListener('resize', () => { buildDots(); goTo(Math.min(currentOffset, maxOffset())); });
  }

  /* ── Quiz 1: guess the nominees ── */
  const quizNomsOptions  = document.getElementById('quiz-noms-options');
  const quizNomsReveal   = document.getElementById('quiz-noms-reveal');
  const quizNomsCounter  = document.getElementById('quiz-noms-counter');

  if (quizNomsOptions && quizNomsReveal) {
    quizNomsOptions.querySelectorAll('.quiz-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (nomsAnswered) return;
        nomsAnswered = true;
        quizNomsOptions.querySelectorAll('.quiz-btn').forEach((b) => b.classList.add('is-disabled'));
        btn.classList.add('is-selected', 'is-wrong');
        if (quizNomsCounter) animateCounter(quizNomsCounter);
        quizNomsReveal.classList.add('is-visible');
        if (refreshQuiz1Scrolly) refreshQuiz1Scrolly();
      });
    });
  }

  /* ── Quiz 2: paint the trophies ── */
  const trophyGrid   = document.getElementById('trophy-grid');
  const trophySubmit = document.getElementById('trophy-submit');
  const trophyReveal  = document.getElementById('trophy-reveal');
  const trophyRevealText = document.getElementById('trophy-reveal-text');
  const trophyStatNumber = document.getElementById('trophy-stat-number');

  if (trophyGrid && trophySubmit) {
    const allTrophyBtns = Array.from(trophyGrid.querySelectorAll('.trophy-btn'));

    function paintUpTo(idx, className) {
      allTrophyBtns.forEach((b) => {
        b.classList.toggle(className, +b.dataset.index <= idx);
      });
    }

    allTrophyBtns.forEach((btn) => {
      const idx = +btn.dataset.index;
      btn.addEventListener('click', () => {
        if (trophyGrid.classList.contains('is-locked')) return;
        paintUpTo(idx, 'is-gold');
      });
      btn.addEventListener('mouseenter', () => {
        if (trophyGrid.classList.contains('is-locked')) return;
        paintUpTo(idx, 'is-hover-preview');
      });
    });
    trophyGrid.addEventListener('mouseleave', () => {
      if (trophyGrid.classList.contains('is-locked')) return;
      allTrophyBtns.forEach((b) => b.classList.remove('is-hover-preview'));
    });

    trophySubmit.addEventListener('click', () => {
      if (trophyGrid.classList.contains('is-locked')) return;
      const guessCount = allTrophyBtns.filter((b) => b.classList.contains('is-gold')).length;

      trophyGrid.classList.add('is-locked');
      trophySubmit.classList.add('is-disabled');

      allTrophyBtns.forEach((b) => b.classList.remove('is-gold', 'is-hover-preview'));

      setTimeout(() => {
        allTrophyBtns.slice(0, 3).forEach((b, i) => {
          setTimeout(() => b.classList.add('is-truth'), i * 180);
        });

        if (trophyRevealText) {
          trophyRevealText.textContent = guessCount === 3
            ? 'You got it. Just three, in 97 years.'
            : guessCount > 3
              ? `Fewer than that. You guessed ${guessCount}, the real number is just three.`
              : `More than that, actually. You guessed ${guessCount}, but three women have won.`;
        }
        if (trophyStatNumber) animateCounter(trophyStatNumber);
        if (trophyReveal) trophyReveal.classList.add('is-visible');
        trophyAnswered = true;
        if (refreshQuiz2Scrolly) refreshQuiz2Scrolly();
      }, 450);
    });
  }

  /* ── DB filter buttons ── */
  document.querySelectorAll('#db-filter-status .db-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#db-filter-status .db-btn').forEach(b => b.classList.remove('db-btn--active'));
      btn.classList.add('db-btn--active');
      if (typeof window.filterPictogram === 'function') window.filterPictogram(btn.dataset.filter);
    });
  });

})();