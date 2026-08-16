(() => {
  'use strict';
  const cards = [...document.querySelectorAll('.tw-card')];
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-paused', !entry.isIntersecting);
    });
  }, { threshold: 0.08 });
  cards.forEach(card => observer.observe(card));
})();
