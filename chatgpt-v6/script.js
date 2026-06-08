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
