const toggle = document.querySelector('.menu-toggle');

if (toggle) {
  toggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', () => {
    document.body.classList.remove('menu-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  });
});




// v15: persist selected nav item. Works with all .nav-links hash links.
(function () {
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (!navLinks.length) return;

  const storageKey = 'theorem-active-nav';

  function normalize(hash) {
    if (!hash || hash === '#') return '#solutions';
    return hash;
  }

  function setActive(hash, persist = true) {
    hash = normalize(hash);

    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === hash);
    });

    if (persist) {
      try { localStorage.setItem(storageKey, hash); } catch (_) {}
    }
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      setActive(link.getAttribute('href'), true);
    });
  });

  window.addEventListener('hashchange', () => {
    setActive(window.location.hash, true);
  });

  let storedHash = '';
  try { storedHash = localStorage.getItem(storageKey) || ''; } catch (_) {}

  const validHashes = navLinks.map((link) => link.getAttribute('href'));

  if (window.location.hash && validHashes.includes(window.location.hash)) {
    setActive(window.location.hash, true);
  } else if (storedHash && validHashes.includes(storedHash)) {
    setActive(storedHash, false);
  } else {
    setActive('#solutions', false);
  }
})();


// v22: hero text switch animation
(function () {
  const switcher = document.querySelector('.hero-switch > span');
  if (!switcher) return;

  const phrases = [
    'your workflows,',
    'your CRM,',
    'your support,',
    'your operations,'
  ];

  let index = 0;
  switcher.textContent = phrases[index];

  setInterval(() => {
    switcher.classList.add('is-changing');
    window.setTimeout(() => {
      index = (index + 1) % phrases.length;
      switcher.textContent = phrases[index];
      switcher.classList.remove('is-changing');
    }, 260);
  }, 2300);
})();


// v40 — pure HTML/CSS industry carousel
(function () {
  const carousel = document.querySelector('[data-industry-carousel]');
  if (!carousel) return;

  const track = carousel.querySelector('.industry-track');
  const slides = Array.from(carousel.querySelectorAll('.industry-card'));
  const prev = carousel.querySelector('.industry-prev');
  const next = carousel.querySelector('.industry-next');

  if (!track || !slides.length || !prev || !next) return;

  let page = 0;

  function perView() {
    if (window.innerWidth <= 720) return 1;
    if (window.innerWidth <= 1120) return 2;
    return 3;
  }

  function totalPages() {
    return Math.ceil(slides.length / perView());
  }

  function update(animate = true) {
    const maxPage = Math.max(totalPages() - 1, 0);
    page = Math.max(0, Math.min(page, maxPage));

    const targetIndex = Math.min(page * perView(), slides.length - 1);
    const offset = slides[targetIndex].offsetLeft;

    track.style.transition = animate ? 'transform .48s cubic-bezier(.22,.61,.36,1)' : 'none';
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;

    prev.disabled = page === 0;
    next.disabled = page === maxPage;
  }

  prev.addEventListener('click', function () {
    page -= 1;
    update(true);
  });

  next.addEventListener('click', function () {
    page += 1;
    update(true);
  });

  window.addEventListener('resize', function () {
    update(false);
  });

  window.addEventListener('load', function () {
    update(false);
  });

  update(false);
})();


// v47 — industry slider autoplay without next/previous buttons
(() => {
  const carousel = document.querySelector('[data-industry-carousel]');
  if (!carousel) return;

  const track = carousel.querySelector('.industry-track');
  const cards = Array.from(carousel.querySelectorAll('.industry-card'));
  if (!track || cards.length < 4) return;

  let index = 0;
  let timer = null;

  const getVisibleCount = () => {
    if (window.innerWidth <= 720) return 1;
    if (window.innerWidth <= 1120) return 2;
    return 3;
  };

  const update = () => {
    const visible = getVisibleCount();
    const maxIndex = Math.max(0, cards.length - visible);
    if (index > maxIndex) index = 0;

    const gap = parseFloat(getComputedStyle(track).gap || "0");
    const cardWidth = cards[0].getBoundingClientRect().width;
    track.style.transition = "transform 650ms cubic-bezier(.22,.8,.24,1)";
    track.style.transform = `translateX(-${index * (cardWidth + gap)}px)`;
  };

  const next = () => {
    const visible = getVisibleCount();
    const maxIndex = Math.max(0, cards.length - visible);
    index = index >= maxIndex ? 0 : index + 1;
    update();
  };

  const start = () => {
    stop();
    timer = window.setInterval(next, 2600);
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  carousel.addEventListener("mouseenter", stop);
  carousel.addEventListener("mouseleave", start);
  window.addEventListener("resize", update);

  update();
  start();
})();
