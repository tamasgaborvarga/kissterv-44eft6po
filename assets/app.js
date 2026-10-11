/* KISSTERV — interakciók: fejléc, menü, belépők, díjkalkulátor, referencialista + szűrő, ajánlatkérő */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EMAIL = 'kisstervkft@kiss-terv.hu';
  const AFA = 0.27;
  const grp = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // a hu-HU a 4 jegyűt nem tagolja (2700), itt mindig tagolunk
  const fmt = n => grp(n) + ' Ft';

  /* ---------- fejléc, menü ---------- */
  const hdr = $('#hdr');
  const onScroll = () => hdr.classList.toggle('is-stuck', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const burger = $('#burger'), nav = $('#nav');
  const setMenu = open => { burger.setAttribute('aria-expanded', open); nav.classList.toggle('is-open', open); };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* aktív menüpont */
  const links = $$('.nav a[href^="#"]:not(.btn)');
  const spy = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    links.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const t = $(a.getAttribute('href')); if (t) spy.observe(t); });

  /* belépők */
  const rvo = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); rvo.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('.rv').forEach(el => rvo.observe(el));


  /* mobil akciósáv: a hero után jelenik meg, a kapcsolatnál eltűnik; a kalkulátornál a végösszeget mutatja */
  const bar = $('#abar');
  if (bar) {
    const seen = { hero: true, contact: false, calc: false, out: false };
    const upd = () => {
      bar.classList.toggle('is-on', !seen.hero && !seen.contact);
      bar.classList.toggle('is-calc', seen.calc && !seen.out);
    };
    const watch = (el, key, opts) => el && new IntersectionObserver(([en]) => { seen[key] = en.isIntersecting; upd(); }, opts).observe(el);
    watch($('.hero'), 'hero', { threshold: 0 });
    watch($('#kapcsolat'), 'contact', { rootMargin: '0px 0px -30% 0px' });
    watch($('#calc'), 'calc', { rootMargin: '-20% 0px -20% 0px' });
    watch($('#calc-out'), 'out', { threshold: .35 });
  }


  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- díjkalkulátor (a régi oldalon közölt alapárak, nettó) ---------- */
  const RATES = { uj: [1000, 1200, 'Építészeti terv'], allapot: [500, 700, 'Állapotrögzítő terv'], terasz: [500, 800, 'Terasz terve'] };
  const calc = $('#calc');
  if (calc) {
    const m2 = $('#m2'), m2r = $('#m2r');
    const en = $('#o-en'), enW = $('#o-en-w'), alapW = $('#o-alap-w'), alap = $('#o-alap');
    const state = { text: '' };

    const syncRange = () => m2r.style.setProperty('--p', ((m2r.value - m2r.min) / (m2r.max - m2r.min) * 100) + '%');
    m2r.addEventListener('input', () => { m2.value = m2r.value; syncRange(); run(); });
    m2.addEventListener('input', () => {
      const v = Math.max(0, parseInt(m2.value, 10) || 0);
      m2r.value = Math.min(Math.max(v, +m2r.min), +m2r.max); syncRange(); run();
    });
    m2.addEventListener('change', () => {
      const v = Math.min(Math.max(parseInt(m2.value, 10) || +m2r.min, 1), +m2.max);
      m2.value = v; m2r.value = Math.max(v, +m2r.min); syncRange(); run();
    });
    calc.addEventListener('change', run);

    /* „Mikor kell ez?” — a választott feladathoz (jogszabályi háttér: ADATOK.md, 2026-10-11) */
    const HINT = {
      uj: 'Új ház építéséhez, meglévő bővítéséhez vagy átalakításához. Legfeljebb 300 m²-es új lakóháznál jellemzően egyszerű bejelentés elég, nagyobb vagy nem lakó épületnél építési engedély kell.',
      allapot: 'Ha a meglévő épületről nincs a valóságnak megfelelő terv — például fennmaradási engedélyhez, egy bővítés kiindulópontjaként vagy az energetikai tanúsításhoz.',
      terasz: 'Fedett vagy fedetlen terasz tervezéséhez; a díj a terasz jellegétől függ.'
    };
    const hint = $('#tip-hint span');

    function run() {
      const tip = calc.querySelector('[name="tipus"]:checked').value;
      const area = Math.max(0, parseInt(m2.value, 10) || 0);
      const [lo, hi, label] = RATES[tip];
      if (hint) hint.textContent = HINT[tip];
      const big = area > 150;
      const terasz = tip === 'terasz';
      enW.classList.toggle('is-off', terasz); en.disabled = terasz; if (terasz) en.checked = false;
      alapW.hidden = !en.checked || big; if (alapW.hidden) alap.checked = false;

      const lines = [[`${label} · ${area} m² × ${grp(lo)}–${grp(hi)} Ft/m²`, area * lo, area * hi]];
      if ($('#o-etdr').checked) lines.push(['ÉTDR-ügyintézés', 20000, 20000]);
      if (en.checked && !big) {
        lines.push(['Energetikai tanúsítás', 20000, 20000]);
        if (alap.checked) lines.push(['Felmérési alaprajz', 5000, 5000]);
      }
      if ($('#o-viz').checked) lines.push(['Víz- és szennyvízbekötési terv', 60000, 60000]);

      const nLo = lines.reduce((s, l) => s + l[1], 0), nHi = lines.reduce((s, l) => s + l[2], 0);
      const range = (a, b) => a === b ? fmt(a) : `${grp(a)} – ${fmt(b)}`;
      $('#out-brutto').textContent = area ? range(nLo * (1 + AFA), nHi * (1 + AFA)) : '—';
      $('#out-netto').textContent = area ? `nettó ${range(nLo, nHi)} + 27% ÁFA` : '';
      const sum = $('#abar-sum'); if (sum) sum.textContent = $('#out-brutto').textContent;
      // tagolt számla: alapdíj · kiegészítők · nettó + ÁFA (a bruttó végösszeg alatta, nagyban)
      const row = (k, a, b, cls = '') => `<div class="${cls}"><span>${k}</span><span>${range(a, b)}</span></div>`;
      const extra = lines.slice(1);
      $('#out-lines').innerHTML = !area ? '<div class="none"><span>Adja meg az alapterületet.</span></div>' :
        '<div class="grp"><span>Alapdíj</span></div>' + row(lines[0][0], lines[0][1], lines[0][2]) +
        '<div class="grp"><span>Kiegészítők</span></div>' +
        (extra.length ? extra.map(l => row(l[0], l[1], l[2])).join('') : '<div class="none"><span>nincs kiválasztva</span></div>') +
        row('Nettó összesen', nLo, nHi, 'sub') + row('ÁFA (27%)', nLo * AFA, nHi * AFA, 'sub');

      const warn = $('#out-warn');
      warn.hidden = !(en.checked && big);
      warn.textContent = '150 m² fölötti épület energetikai tanúsítására és alaprajzára egyedi ajánlatot adunk — ezt a becslés nem tartalmazza.';

      state.text = [
        `Feladat: ${label}`, `Hasznos alapterület: ${area} m²`,
        ...lines.slice(1).map(l => `+ ${l[0]}`),
        en.checked && big ? '+ Energetikai tanúsítás (150 m² fölött — egyedi ajánlat)' : '',
        `Kalkulátoros becslés: nettó ${range(nLo, nHi)} + ÁFA`
      ].filter(Boolean).join('\n');
    }

    const toForm = e => {
      const msg = $('#f-msg');
      if (msg) {
        e.preventDefault();
        msg.value = state.text + '\n\nHelyszín / megjegyzés: ';
        $('#ajanlat').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        setTimeout(() => $('#f-nev').focus({ preventScroll: true }), 500);
      }
    };
    $('#calc-mail').addEventListener('click', toForm);
    const ac = $('#abar-calc-mail'); if (ac) ac.addEventListener('click', toForm);
    syncRange(); run();
  }

  /* ---------- referenciák: a tételek a HTML-ben vannak (JS nélkül és keresőnek is látszanak); a JS csak szűr ---------- */
  const box = $('#refs'), filter = $('#filter');
  if (!box || !filter) return;
  let cat = 'tr'; // egyszerre egy csoport látszik; JS nélkül mind (a keresőnek is)

  filter.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    cat = b.dataset.k; apply();
    b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });

  function apply() {
    $$('.chip', filter).forEach(b => b.setAttribute('aria-pressed', b.dataset.k === cat));
    $$('.rgroup', box).forEach(g => { g.hidden = g.dataset.k !== cat; });
  }
  apply();
})();

/* ---------- ajánlatkérő: mailto ---------- */
(() => {
  const f = document.getElementById('ajanlat'); if (!f) return;
  f.elements.nev.addEventListener('input', () => { f.elements.nev.removeAttribute('aria-invalid'); document.getElementById('f-nev-err').hidden = true; });
  f.addEventListener('submit', e => {
    e.preventDefault();
    const v = n => (f.elements[n].value || '').trim();
    const nev = f.elements.nev, err = document.getElementById('f-nev-err');
    if (!v('nev')) { nev.setAttribute('aria-invalid', 'true'); err.hidden = false; nev.focus(); return; }
    const subj = `Ajánlatkérés — ${v('tip')}${v('hely') ? ' (' + v('hely') + ')' : ''}`;
    const body = [`Név: ${v('nev')}`, v('tel') ? `Telefon: ${v('tel')}` : null, `Feladat: ${v('tip')}`, v('hely') ? `Település: ${v('hely')}` : null, '', v('msg')].filter(x => typeof x === 'string').join('\n');
    location.href = `mailto:kisstervkft@kiss-terv.hu?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  });
})();
