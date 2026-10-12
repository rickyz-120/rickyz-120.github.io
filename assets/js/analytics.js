// Analytics leve e opcional (GoatCounter ou Plausible, ambos sem cookies).
// Só carrega se data/site.json > analytics.provider e siteId estiverem preenchidos.
// Respeita "Do Not Track" e Global Privacy Control, e não conta acessos locais.
export function initAnalytics(cfg) {
  if (!cfg || !cfg.provider || !cfg.siteId) return;
  const dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  if (dnt || local) return;

  const s = document.createElement('script');
  s.async = true;
  if (cfg.provider === 'goatcounter') {
    s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = `https://${cfg.siteId}.goatcounter.com/count`;
  } else if (cfg.provider === 'plausible') {
    s.defer = true;
    s.src = 'https://plausible.io/js/script.js';
    s.dataset.domain = cfg.siteId;
  } else {
    return;
  }
  document.head.appendChild(s);
}
