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


// v14: persist selected nav item and update it on click/hash changes.
(function () {
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[data-nav]'));
  if (!navLinks.length) return;

  const storageKey = 'theorem-active-nav';

  function setActive(hash, persist = true) {
    if (!hash) return;

    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === hash);
    });

    if (persist) {
      try { localStorage.setItem(storageKey, hash); } catch (_) {}
    }
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const hash = link.getAttribute('href');
      setActive(hash, true);
    });
  });

  window.addEventListener('hashchange', () => {
    setActive(window.location.hash, true);
  });

  const initialHash = window.location.hash;
  let storedHash = '';
  try { storedHash = localStorage.getItem(storageKey) || ''; } catch (_) {}

  const validHashes = navLinks.map((link) => link.getAttribute('href'));
  if (initialHash && validHashes.includes(initialHash)) {
    setActive(initialHash, true);
  } else if (storedHash && validHashes.includes(storedHash)) {
    setActive(storedHash, false);
  } else {
    setActive('#solutions', false);
  }
})();
