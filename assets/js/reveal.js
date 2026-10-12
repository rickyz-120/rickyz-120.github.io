// Revela elementos ao entrarem na tela. Só esconde o que ainda está abaixo da dobra,
// e nada fica escondido sem IntersectionObserver, com movimento reduzido ou com animações pausadas.
import { prefersReducedMotion } from './util.js';

export function createReveal(isPaused) {
  const ok = 'IntersectionObserver' in window;
  const io = ok ? new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      show(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }) : null;

  function show(el) {
    io?.unobserve(el);
    el.classList.add('rv-in');
    el.classList.remove('rv');
  }

  return {
    observe(nodes) {
      if (!io || prefersReducedMotion() || isPaused()) return;
      const vh = window.innerHeight;
      nodes.forEach((el) => {
        if (el.getBoundingClientRect().top < vh) return; // já visível: não esconde
        el.classList.add('rv');
        io.observe(el);
      });
    },
    revealAll() { document.querySelectorAll('.rv').forEach(show); },
  };
}
