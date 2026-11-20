/* KISSTERV — interakciók: fejléc, menü, belépők, díjkalkulátor, referencia-fülek, ajánlatkérő
   A díjkalkulátor számítási logikája és árai változatlanok (2026-10-11 óta). */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const AFA = 0.27;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const grp = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); // a hu-HU a 4 jegyűt nem tagolja (2700), itt mindig tagolunk — nem törő szóközzel
  const fmt = n => grp(n) + ' Ft';

  /* ---------- fejléc, menü ---------- */
  const hdr = $('#hdr');
  const onScroll = () => hdr.classList.toggle('is-stuck', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const burger = $('#burger'), nav = $('#nav');
  const desk = matchMedia('(min-width: 1100px)');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (open) { const a = $('a', nav); a && a.focus({ preventScroll: true }); }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
  });
  desk.addEventListener('change', () => setMenu(false));
  /* nyitott mobilmenüben a Tab ne szökjön ki a lapról */
  nav.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || desk.matches || !nav.classList.contains('is-open')) return;
    const f = $$('a, button', nav), first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); burger.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); burger.focus(); }
  });

  /* aktív menüpont */
  const links = $$('.nav__list a[href^="#"]');
  const spy = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    links.forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const t = $(a.getAttribute('href')); if (t) spy.observe(t); });

  /* belépők */
  if (!RM.matches && 'IntersectionObserver' in window) {
    const rvo = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); rvo.unobserve(en.target); }
    }), { rootMargin: '0px 0px -6% 0px' });
    $$('.rv').forEach(el => rvo.observe(el));
  } else $$('.rv').forEach(el => el.classList.add('in'));

  /* mobil akciósáv: a nyitókép után jelenik meg, a kapcsolatnál eltűnik; a kalkulátornál a végösszeget mutatja */
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

  /* ---------- ajánlatkérő előtöltése a szolgáltatás-hivatkozásokból (data-tip = a „Feladat” választó egy opciója) ---------- */
  const tipSel = $('#f-tip');
  $$('[data-tip]').forEach(a => a.addEventListener('click', () => {
    if (tipSel) tipSel.value = a.dataset.tip;
  }));

  /* ---------- díjkalkulátor (a régi oldalon közölt alapárak, nettó) ---------- */
  const RATES = { uj: [1000, 1200, 'Építészeti terv'], allapot: [500, 700, 'Állapotrögzítő terv'], terasz: [500, 800, 'Terasz terve'] };
  const calc = $('#calc');
  if (calc) {
    const m2 = $('#m2'), m2r = $('#m2r');
    const en = $('#o-en'), enW = $('#o-en-w'), alapW = $('#o-alap-w'), alap = $('#o-alap');
    const big$ = $('#out-brutto');
    const state = { text: '' };
    let last = '';

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
      const total = area ? range(nLo * (1 + AFA), nHi * (1 + AFA)) : '—';
      big$.textContent = total;
      if (total !== last && last && !RM.matches) { big$.classList.remove('tick'); void big$.offsetWidth; big$.classList.add('tick'); }
      last = total;
      $('#out-netto').textContent = area ? `nettó ${range(nLo, nHi)} + 27% ÁFA` : '';
      const sum = $('#abar-sum'); if (sum) sum.textContent = total;
      // tagolt számla: alapdíj · kiegészítők · nettó + ÁFA (a bruttó végösszeg fölötte, nagyban)
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

    const TIP = { uj: 'Lakóház tervezése / bővítése', allapot: 'Állapotrögzítő terv', terasz: 'Lakóház tervezése / bővítése' };
    const toForm = e => {
      const msg = $('#f-msg');
      if (msg) {
        e.preventDefault();
        msg.value = state.text + '\n\nHelyszín / megjegyzés: ';
        if (tipSel) tipSel.value = TIP[calc.querySelector('[name="tipus"]:checked').value];
        $('#ajanlat').scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' });
        setTimeout(() => $('#f-nev').focus({ preventScroll: true }), RM.matches ? 0 : 500);
      }
    };
    $('#calc-mail').addEventListener('click', toForm);
    const ac = $('#abar-calc-mail'); if (ac) ac.addEventListener('click', toForm);
    syncRange(); run();
  }

  /* ---------- referenciák: fülek (WAI-ARIA tabs). A tételek a HTML-ben vannak — JS nélkül mind látszik. ---------- */
  const box = $('#refs'), tabs = $('#filter');
  if (!box || !tabs) return;
  const tabEls = $$('[role="tab"]', tabs);
  const vert = matchMedia('(min-width: 1100px)');
  const syncOrient = () => tabs.setAttribute('aria-orientation', vert.matches ? 'vertical' : 'horizontal');
  vert.addEventListener('change', syncOrient); syncOrient();

  function select(k, focus, user = true) {
    tabEls.forEach(b => {
      const on = b.dataset.k === k;
      b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus({ preventScroll: true });
      /* mobilon csak a pill-sort görgetjük vízszintesen, az oldalt soha */
      if (on && user && !vert.matches) tabs.scrollTo({ left: b.offsetLeft - tabs.offsetLeft - 16, behavior: RM.matches ? 'auto' : 'smooth' });
    });
    $$('.rgroup', box).forEach(g => {
      const on = g.dataset.k === k;
      g.hidden = !on;
      g.classList.toggle('is-in', on && !RM.matches);
    });
  }
  tabs.addEventListener('click', e => { const b = e.target.closest('[role="tab"]'); if (b) select(b.dataset.k); });
  tabs.addEventListener('keydown', e => {
    const i = tabEls.indexOf(document.activeElement); if (i < 0) return;
    const next = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    let j = null;
    if (next) j = (i + next + tabEls.length) % tabEls.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = tabEls.length - 1;
    if (j === null) return;
    e.preventDefault(); select(tabEls[j].dataset.k, true);
  });
  $$('[data-ref]').forEach(a => a.addEventListener('click', () => select(a.dataset.ref)));
  select('tr', false, false);
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
