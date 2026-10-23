/* Lire Marx — LA SONDE (mission `affichage`, oct. 2026). À coller dans la
   console, ou injectée par tools/sonde-modes.mjs. Elle mesure ce qu'un
   fichier ne peut pas dire : le contraste RÉEL, la taille réelle du texte,
   la taille réelle des cibles, le débordement horizontal.

   Elle reprend la sonde de Lire Debord et les pièges que CE dépôt a payés :
     - `getComputedStyle().color` peut rendre `color(srgb 0.75 0.70 0.61)`
       depuis color-mix() : une sonde qui lit des 0-255 y voit du noir ;
     - un texte replié en `visibility:hidden` garde des rects : on remonte
       les ancêtres (visibility, display, opacité nulle) ;
     - les transitions et animations sont GELÉES dans un onglet masqué :
       `LM_SONDE({fini:true})` les ACHÈVE (durée .001 s) au lieu de les couper
       — `animation:none` renverrait un élément à son opacité de départ ;
     - le papier vit sur html OU sur body (un fond monté rend body transparent) ;
     - un fond en DÉGRADÉ (la carte d'emphase) : on mesure contre la pire
       couleur de ses arrêts ; un fond en IMAGE (photographie) n'est pas
       mesurable ici — le texte est compté à part (`surImage`), à vérifier à
       l'œil ou par capture.

   Elle refuse : contraste < 4,5:1 (3:1 pour ≥ 24 px, ou ≥ 18,66 px gras) ;
   texte < 11 px (règle de la maison) ; cible < 24 × 24 hors liens EN LIGNE
   dans une phrase (WCAG 2.5.8) ; débordement horizontal.
   Elle laisse passer `aria-hidden="true"`, `.sr-only`, le contenu d'un
   `details` fermé, et ce qui est hors de l'arbre rendu.

   Usage : await LM_SONDE({fini:true}) → { echecs, min, contraste, petits, cibles, … } */
window.LM_SONDE = async function (opts) {
  opts = opts || {};
  if (opts.fini) {
    const st = document.createElement('style');
    st.id = 'lm-sonde-fini';
    st.textContent = '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:.001s!important;animation-delay:0s!important;animation-iteration-count:1!important}';
    document.head.appendChild(st);
    document.querySelectorAll('.reveal,.reveal-stagger').forEach(e => e.classList.add('in'));
    await new Promise(r => setTimeout(r, 120));
  }
  const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const parse = s => {
    s = String(s);
    let m = s.match(/color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.e-]+%?))?\)/);
    if (m) { let a = m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4]); return { c: [+m[1] * 255, +m[2] * 255, +m[3] * 255], a }; }
    m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return { c: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
  };
  const blend = (fg, bg) => fg.c.map((v, i) => v * fg.a + bg[i] * (1 - fg.a));
  const stops = img => { const out = []; const re = /(color\(srgb[^)]*\)|rgba?\([^)]*\))/g; let m; while ((m = re.exec(img))) { const p = parse(m[1]); if (p) out.push(p); } return out; };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

  /* le(s) fond(s) possible(s) sous un élément : une liste de couleurs, la
     pire sera retenue ; null si une image (photo) est dessous */
  function fondsDe(el) {
    let e = el; const pile = [];
    while (e && e !== document.documentElement && e !== document.body) {
      const cs = getComputedStyle(e);
      const img = cs.backgroundImage;
      if (img && img !== 'none') {
        if (/url\(/.test(img)) return null;
        const st = stops(img).filter(p => p.a > 0.5);
        if (st.length) { pile.push({ grad: st }); break; }
      }
      const p = parse(cs.backgroundColor);
      if (p && p.a > 0) { pile.push(p); if (p.a >= 1) break; }
      e = e.parentElement;
    }
    let base = [[255, 255, 255]];
    for (const r of [document.documentElement, document.body]) { const x = parse(getComputedStyle(r).backgroundColor); if (x && x.a >= 1) base = [x.c]; }
    for (let i = pile.length - 1; i >= 0; i--) {
      const p = pile[i];
      if (p.grad) base = p.grad.map(g => g.a >= 1 ? g.c : blend(g, base[0]));
      else base = base.map(b => p.a >= 1 ? p.c : blend(p, b));
    }
    return base;
  }
  const cache = new WeakMap();
  function cache_(el) {
    if (cache.has(el)) return cache.get(el);
    const cs = getComputedStyle(el);
    let v = cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.01;
    if (v && el.parentElement && el.parentElement !== document.documentElement) v = cache_(el.parentElement) && cs.visibility !== 'hidden';
    cache.set(el, v); return v;
  }
  const ou = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');

  const contraste = [], petits = [], cibles = [], surImage = [];
  let mesures = 0, min = 99, ouMin = '';
  document.querySelectorAll('body *').forEach(el => {
    if (el.closest('[aria-hidden="true"],.sr-only,script,style,noscript,svg')) return;
    if (el.closest('details:not([open])') && !el.closest('summary')) return;
    const txt = [...el.childNodes].filter(x => x.nodeType === 3).map(x => x.textContent.trim()).join('');
    if (!txt) return;
    if (!cache_(el)) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const cs = getComputedStyle(el);
    const fg = parse(cs.color); if (!fg) return;
    const fonds = fondsDe(el);
    if (!fonds) { surImage.push(ou(el) + ' « ' + txt.slice(0, 24) + ' »'); return; }
    const taille = parseFloat(cs.fontSize), gras = parseInt(cs.fontWeight) >= 700;
    const grand = taille >= 24 || (gras && taille >= 18.66);
    let rt = 99;
    for (const bg of fonds) { const col = fg.a < 1 ? blend(fg, bg) : fg.c; rt = Math.min(rt, ratio(col, bg)); }
    mesures++;
    if (rt < min) { min = rt; ouMin = ou(el); }
    if (rt < (grand ? 3 : 4.5) - 0.005) contraste.push({ ou: ou(el), texte: txt.slice(0, 30), ratio: +rt.toFixed(2), taille, seuil: grand ? 3 : 4.5 });
    if (taille < 10.95) petits.push({ ou: ou(el), texte: txt.slice(0, 24), taille: +taille.toFixed(2) });
  });
  document.querySelectorAll('a,button,input,select,textarea,summary,[role="button"],[role="menuitemradio"],[role="option"]').forEach(el => {
    if (el.closest('.sr-only,[aria-hidden="true"]') || el.classList.contains('sr-only')) return;
    if (!cache_(el)) return;
    if (el.closest('details:not([open])') && !el.closest('summary') && el.tagName !== 'SUMMARY') return;
    const cs = getComputedStyle(el);
    const cadre = (el.tagName === 'INPUT' && el.closest('label')) || el;
    const r = cadre.getBoundingClientRect(); if (!r.width || !r.height) return;
    const enLigne = el.tagName === 'A' && cs.display === 'inline' && el.parentElement &&
      el.parentElement.closest('p,li,h1,h2,h3,h4,dd,dt,span,blockquote,figcaption,label,time,td,em,i,b,q');
    if (enLigne) return;
    if (r.width < 23.5 || r.height < 23.5) cibles.push({ ou: ou(el), texte: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24), l: Math.round(r.width), h: Math.round(r.height) });
  });
  const debord = document.documentElement.scrollWidth > innerWidth + 1;
  if (opts.fini) { const st = document.getElementById('lm-sonde-fini'); if (st && !opts.garder) st.remove(); }
  return {
    page: location.pathname, mode: document.documentElement.getAttribute('data-mode'), largeur: innerWidth,
    mesures, min: +min.toFixed(2), minSur: ouMin,
    echecs: contraste.length + petits.length + cibles.length + (debord ? 1 : 0),
    contraste, petits, cibles, surImage: surImage.length, surImageEx: surImage.slice(0, 6),
    debordement: debord ? document.documentElement.scrollWidth + ' px pour ' + innerWidth : false,
  };
};
