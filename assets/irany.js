/* KISSTERV — arculati irány-minta (betű + szín együtt). Csak a minta-irany.html tölti be; élesbe NEM kerül.
   ?i=0 jelenlegi · ?i=a Szakvélemény · ?i=b Tervlap · ?i=c Közszolgálat */
(() => {
  const I = {
    0: { name: 'Jelenlegi — Archivo keskeny + palakék/terrakotta', v: {} },
    a: { name: 'A · Szakvélemény — Source Serif 4 + Source Sans 3 · tinta + bordó',
      v: { '--display': '"Source Serif 4", Georgia, serif', '--sans': '"Source Sans 3", system-ui, sans-serif', '--display-w': '100%',
        '--brand': '#1d2a38', '--main': '#1d2a38', '--main-2': '#141e29', '--main-wash': '#e6e9ed', '--paper': '#f7f5f0', '--paper-2': '#eeebe4', '--paper-3': '#e6e2d9',
        '--accent': '#8a2c3a', '--accent-2': '#70232f', '--brand-hi': '#e7a3ab', '--on-brand-2': '#d6dbe2', '--on-brand-3': '#b3bcc8' },
      css: 'h1,h2,h3,.brand__name,.hero__facts dt,.calc__big{font-weight:600!important;letter-spacing:-.01em!important}.hero h1{font-weight:600!important;line-height:1.05!important}.brand__name{letter-spacing:.02em!important}' },
    b: { name: 'B · Tervlap — IBM Plex Sans + Plex Mono · grafit + téglapiros + zöldterület',
      v: { '--display': '"IBM Plex Sans", system-ui, sans-serif', '--sans': '"IBM Plex Sans", system-ui, sans-serif', '--display-w': '100%',
        '--brand': '#262b31', '--main': '#2f5d46', '--main-2': '#244a37', '--main-wash': '#e3ece6', '--main-soft': '#9bbba8', '--paper': '#f6f6f3', '--paper-2': '#edeee9', '--paper-3': '#e3e6df',
        '--accent': '#b5452f', '--accent-2': '#953724', '--brand-hi': '#f0a08c', '--on-brand-2': '#d9dcdf', '--on-brand-3': '#b5bbc2' },
      css: 'h1,h2,h3,.brand__name,.hero__facts dt,.calc__big{font-weight:600!important;letter-spacing:-.02em!important}.label{font-family:"IBM Plex Mono",monospace!important;letter-spacing:.04em!important}' },
    c: { name: 'C · Közszolgálat — Public Sans · fenyőzöld + sárgaréz',
      v: { '--display': '"Public Sans", system-ui, sans-serif', '--sans': '"Public Sans", system-ui, sans-serif', '--display-w': '100%',
        '--brand': '#1e4636', '--main': '#1e4636', '--main-2': '#163428', '--main-wash': '#dfeae3', '--main-soft': '#88ad9b', '--paper': '#f6f5f0', '--paper-2': '#ecf0ed', '--paper-3': '#dfe8e2',
        '--accent': '#94661b', '--accent-2': '#7a5314', '--brand-hi': '#e8bd5c', '--on-brand-2': '#d3e2d9', '--on-brand-3': '#b2c9bc' },
      css: 'h1,h2,h3,.brand__name,.hero__facts dt,.calc__big{font-weight:700!important;letter-spacing:-.025em!important}.hero__cta .btn:not(.btn--ghost),.nav .btn{background:#d9a531!important;border-color:#d9a531!important;color:#171c22!important}' }
  };
  const k = new URLSearchParams(location.search).get('i') || '0', d = I[k] || I[0];
  const r = document.documentElement.style; Object.entries(d.v).forEach(([p, v]) => r.setProperty(p, v));
  const st = document.createElement('style'); st.textContent = (d.css || '') + '.irany-tag{position:fixed;left:12px;bottom:12px;z-index:200;background:#fff;color:#14201b;font:600 13px system-ui;padding:8px 12px;border-radius:6px;box-shadow:0 8px 24px -8px rgba(0,0,0,.4)}';
  document.head.append(st);
  addEventListener('DOMContentLoaded', () => { const t = document.createElement('div'); t.className = 'irany-tag'; t.textContent = d.name; document.body.append(t); });
})();
