/* ============================================================
   LE FOND — « la journée ». Mission `affichage`, volet fond, oct. 2026.
   Canvas 2D, vanille, sans dépendance. Ses jetons : /assets/fond.css.

   CE QU'IL DIT. La page est une journée de travail, et le défilement est
   le temps qui passe — la journée de travail est le centre du *Capital*,
   et le site s'éclaire à la bougie. Trois façons de le dire, une par mode
   (html[data-mode], événement `lm:mode`) :
     bougie  — une flamme posée HORS CHAMP, dans la marge de droite. Sa
               lueur vacille (une somme de sinus aux périodes non
               multiples : une flamme ne bat jamais la mesure), et la
               poussière de la pièce ne se voit que dans son halo. À mesure
               qu'on descend, la bougie BAISSE : le halo descend et faiblit
               un peu. C'est une FONCTION de la position : on remonte, elle
               se relève.
     jour    — un rai de lumière par la croisée : le dessin des carreaux
               projeté en biais sur la page, la poussière qui scintille
               dedans. Matin en haut, soir en bas : le rai tourne, s'allonge
               et se réchauffe. Fonction de la position, donc réversible.
     edition — un imprimé ne bouge pas. Le papier vergé de 1872 : les
               vergeures serrées et les pontuseaux espacés, très pâles,
               IMMOBILES sur la feuille (ils défilent avec elle), sans lueur.

   LE HASARD EST SEMÉ. Les grains de poussière, les irrégularités du papier
   naissent d'un hachage de leur rang et d'une graine fixe (1867) : même
   image à chaque visite. Aucun Math.random.

   LES ÉGARDS. Un VOILE repeint le papier par-dessus tout bloc qui porte un
   texte (92 % du fond effacé) et presque entièrement sous les colonnes de
   lecture (99 %, en quatre paliers de fondu) : on ne lit jamais à travers
   une lumière qui bouge. Mouvement réduit, économie de données, réglage
   « immobile » : une image fixe, redessinée seulement pour que le voile
   suive le texte. Onglet masqué : rien ne tourne.

   OÙ. Seulement là où il ne gâche pas le propos (liste ICI) : à propos,
   mentions, l'agrégation et les commentaires, les chapitres expliqués, le
   forum, la messagerie, l'index du glossaire, la 404. JAMAIS sur l'accueil,
   la bibliothèque, /karl-marx, le carnet, les ateliers, le jeu, les pages
   de notion (elles ont glossaire/fond.js). Une page le refuse par
   body[data-fond="aucun"]. Ailleurs, l'API existe (le menu mémorise le
   réglage) mais etat().effectif vaut 'absent'.

   L'API :
     LM_FOND.regler('anime' | 'fixe' | 'aucun')   mémorisé (liremarx.fond.v1)
     LM_FOND.reglage()
     LM_FOND.etat()      { reglage, effectif, raison, mode }
     LM_FOND.remesurer() les zones de texte (après une mise en page qu'aucun
                         événement ne dit)
     LM_FOND.image(t)    une image tout de suite, à l'instant t (un onglet
                         piloté ne fait pas tourner requestAnimationFrame) ;
                         même t + même position = même image
     LM_FOND.figer(t)    arrête la boucle et peint l'instant t (sonde) ; figer(null) rend la main
     LM_FOND.mesure()    { images, ms_moyen, ms_max, grains, zones… }
     ?fond=logiciel      chaque image forcée jusqu'au pixel : la seule façon
                         de mesurer ce qu'elle coûte (le canvas accéléré
                         n'enregistre que des ordres)
   Chaque changement émet `lm:fond` sur document, detail = etat().
   ============================================================ */
(function () {
  'use strict';
  if (window.LM_FOND) return;
  const html = document.documentElement;
  const CLE = 'liremarx.fond.v1';
  const GRAINE = 1867;                         /* l'édition allemande du Livre I */
  const LOGICIEL = /[?&]fond=logiciel/.test(location.search);
  const ctx2d = c => c.getContext('2d', LOGICIEL ? { willReadFrequently: true } : undefined);

  /* ---------- où il se monte ---------- */
  const ICI = [
    /^\/a-propos\/?$/, /^\/mentions-legales\/?$/, /^\/agregation-2027\/?$/,
    /^\/commentaires\/[^/]+\/?$/, /^\/oeuvres\/capital-1\/chapitre-\d+\/?$/,
    /^\/oeuvres\/(forum|messages)\/?$/, /^\/glossaire\/?$/, /^\/glossaire\/index$/
  ];
  /* une page qui porte déjà sa scène ou son fond ne reçoit rien, même si une
     adresse future la mettait dans la liste */
  const SCENES = '[data-fond="aucun"],.nt-ambiance,.nt-fond,#hero-bg,#circuit-bg,.monde';
  const CALMES = '.nt-essai,.ap-corps,.ml-corps,.reader-content,[data-fond="calme"]';
  const HORS = '.topbar,.sidebar,.fond,script,style,noscript,template,svg,canvas,[hidden],.sr-only';

  function ici() {
    const p = location.pathname.replace(/\.html$/, '');
    if (ICI.some(r => r.test(p))) return true;
    return !!document.querySelector('.e-wrap .e-code');     /* la 404, servie à n'importe quelle adresse */
  }

  const lire = () => { try { const v = localStorage.getItem(CLE); return v === 'fixe' || v === 'aucun' ? v : 'anime'; } catch (e) { return 'anime'; } };
  let reglage = lire();
  let absent = true;                                         /* décidé quand le corps est là */
  const reduit = matchMedia('(prefers-reduced-motion: reduce)');
  const econome = !!(navigator.connection && navigator.connection.saveData);
  const modeDe = () => { const m = html.getAttribute('data-mode'); return m === 'jour' || m === 'edition' ? m : 'bougie'; };

  function etat() {
    const mode = modeDe();
    if (absent) return { reglage, effectif: 'absent', raison: 'page sans fond', mode };
    if (reglage === 'aucun') return { reglage, effectif: 'aucun', raison: 'réglage', mode };
    if (reglage === 'fixe') return { reglage, effectif: 'fixe', raison: 'réglage', mode };
    if (reduit.matches) return { reglage, effectif: 'fixe', raison: 'mouvement réduit', mode };
    if (econome) return { reglage, effectif: 'fixe', raison: 'économie de données', mode };
    if (mode === 'edition') return { reglage, effectif: 'fixe', raison: 'un imprimé ne bouge pas', mode };
    return { reglage, effectif: 'anime', raison: '', mode };
  }
  const annonce = () => document.dispatchEvent(new CustomEvent('lm:fond', { detail: etat() }));
  const stats = { n: 0, tot: 0, max: 0 };
  const api = {
    regler(v) {
      if (v !== 'anime' && v !== 'fixe' && v !== 'aucun') return etat();
      reglage = v;
      try { if (v === 'anime') localStorage.removeItem(CLE); else localStorage.setItem(CLE, v); } catch (e) {}
      if (!absent) appliquer();
      annonce();
      return etat();
    },
    reglage: () => reglage,
    etat,
    remesurer() { if (absent || !actif) return null; mesurerZones(); voileY = NaN; rendre(performance.now(), true); return api.mesure(); },
    mesure: () => ({
      images: stats.n, ms_moyen: stats.n ? +(stats.tot / stats.n).toFixed(3) : 0, ms_max: +stats.max.toFixed(3),
      mode: dessin, grains: grains.length, dessines: boites.length, zones: [calmes.length, voiles.length], zones_ms: +zonesMs.toFixed(1), collants: voiles.filter(z => z.el).length,
      p: +pDe(sL).toFixed(4)
    }),
    image(t) { if (absent || !actif) return null; sL = window.scrollY; rendre(t == null ? performance.now() : t, true); return api.mesure(); },
    /* pour une sonde : arrêter la boucle et peindre l'instant t (null rend la main) */
    figer(t) {
      if (absent || !actif) return null;
      if (t == null) { fige = false; dernier = 0; relancer(); return api.mesure(); }
      fige = true; tFige = t; arreter(); mesurerZones(); sL = window.scrollY; rendre(t, true); return api.mesure();
    }
  };
  window.LM_FOND = api;

  /* ---------- le hasard SEMÉ : mulberry32, et un hachage de rang ---------- */
  function semis(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const hache = (k, i) => (Math.imul(i + 1, 73856093) ^ Math.imul(k + 1, 19349663) ^ GRAINE) | 0;
  const lerp = (a, b, t) => a + (b - a) * t;
  const lisse = t => t * t * (3 - 2 * t);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* ---------- les jetons ---------- */
  let J = {};
  function rgb(v, d) { const m = String(v || '').match(/[\d.]+/g); return m && m.length >= 3 ? m.slice(0, 3).map(Number) : d; }
  function jetons() {
    const cs = getComputedStyle(html), g = n => cs.getPropertyValue(n), num = (n, d) => { const x = parseFloat(g(n)); return isFinite(x) ? x : d; };
    J = {
      papier: rgb(cs.backgroundColor, [21, 16, 11]),
      lueur: rgb(g('--fond-lueur'), [255, 170, 84]), lueurA: num('--fond-lueur-a', .13),
      coeur: rgb(g('--fond-coeur'), [255, 206, 128]), coeurA: num('--fond-coeur-a', .07),
      grain: rgb(g('--fond-grain'), [255, 218, 160]), grainA: num('--fond-grain-a', .6),
      matin: rgb(g('--fond-matin'), [255, 253, 246]), soir: rgb(g('--fond-soir'), [255, 214, 150]),
      raiA: num('--fond-rai-a', 0), soirA: num('--fond-soir-a', 0), ombre: rgb(g('--fond-ombre'), [60, 42, 20]),
      vergeure: rgb(g('--fond-vergeure'), [40, 30, 18]), vergeureA: num('--fond-vergeure-a', 0),
      doux: num('--fond-doux', .55), douxCalme: num('--fond-doux-calme', .7),
      sbw: (() => { const s = document.querySelector('.sidebar'); if (!s) return 0; const r = s.getBoundingClientRect(); return r.right > 0 && r.left < 1 && getComputedStyle(s).visibility !== 'hidden' ? Math.round(r.right) : 0; })()
    };
  }
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (+a).toFixed(4) + ')';

  /* ---------- l'état ----------
     Les lumières (le halo, les deux rais) et le papier vergé sont peints UNE
     fois et DÉPLACÉS par transform et opacity CSS : le compositeur les fait
     bouger sans rien repeindre. Il ne reste à redessiner à chaque image que
     les grains de poussière (et seulement leurs petites boîtes) et, quand la
     page a défilé, le voile. */
  const boite = document.createElement('div');
  boite.className = 'fond'; boite.setAttribute('aria-hidden', 'true');
  const sv = document.createElement('canvas'), gv = document.createElement('canvas'), vv = document.createElement('canvas');
  const ombre = document.createElement('div'); ombre.className = 'fond-ombre';
  sv.className = 'fond-voile'; gv.className = 'fond-grain';
  /* le voile doux est minuscule (un huitième de la fenêtre) : il est peint par
     le processeur, où le flou est le même à chaque fois — sur le GPU, deux
     peintures identiques différaient de 30 niveaux par endroits (mesuré sur
     téléphone par tools/sonde-fond.js --reversible) */
  const stx = sv.getContext('2d', { willReadFrequently: true }), gtx = ctx2d(gv), vtx = vv.getContext('2d', { willReadFrequently: true });
  let masque = null;                                  /* la couverture du voile net, lue une fois par voile */
  let lumieres = [];
  let W = 0, H = 0, dT = 1, dessin = 'bougie', grains = [], boites = [], calmes = [], voiles = [];
  let sL = window.scrollY, raf = 0, repos = 0, dernier = 0, actif = false, mode = 'anime', voileY = NaN, zonesMs = 0;
  const DPR_GRAIN = 1.5, VOILE = .25, DOUX = .125, FLOU = 56, ECH_LUM = .5, PERIODE = 240;

  /* la position dans la journée : 0 en haut de page (le matin, la bougie
     neuve), 1 en bas (le soir, la bougie usée) */
  function pDe(y) {
    const max = Math.max(1, document.documentElement.scrollHeight - H);
    return max < 40 ? 0 : clamp(y / max, 0, 1);
  }

  function construire() {
    jetons();
    dessin = modeDe();
    W = window.innerWidth; H = window.innerHeight;
    dT = Math.min(DPR_GRAIN, window.devicePixelRatio || 1);
    lumieres.forEach(c => c.remove()); lumieres = [];
    if (dessin === 'bougie') lumieres = [halo()];
    else if (dessin === 'jour') lumieres = [rai(J.matin), rai(J.soir)];
    for (const c of lumieres) boite.insertBefore(c, sv);
    if (dessin === 'edition' && J.vergeureA > 0) html.style.setProperty('--fond-verge', 'url(' + vergé() + ')');
    else html.style.removeProperty('--fond-verge');
    gv.width = Math.round(W * dT); gv.height = Math.round(H * dT);
    gtx.setTransform(1, 0, 0, 1, 0, 0); gtx.clearRect(0, 0, gv.width, gv.height); boites = [];
    vv.width = Math.ceil(W * VOILE); vv.height = Math.ceil(H * VOILE);
    sv.width = Math.ceil(W * DOUX); sv.height = Math.ceil(H * DOUX);
    semer(); mesurerZones();
  }

  /* LE HALO. Peint une fois, à demi-résolution (un dégradé n'y perd rien),
     centré sur la flamme ; la flamme est hors champ, à droite. */
  const rayon = () => Math.max(.92 * W, .86 * H, 420);
  function halo() {
    const R = rayon(), n = Math.ceil(2 * R * ECH_LUM);
    const c = document.createElement('canvas'); c.className = 'fond-lumiere';
    c.width = c.height = n; c.style.width = c.style.height = (n / ECH_LUM) + 'px';
    const g = c.getContext('2d'), m = n / 2;
    let gr = g.createRadialGradient(m, m, 0, m, m, m);
    const a = J.lueurA;
    gr.addColorStop(0, rgba(J.lueur, a)); gr.addColorStop(.16, rgba(J.lueur, a * .78));
    gr.addColorStop(.38, rgba(J.lueur, a * .38)); gr.addColorStop(.62, rgba(J.lueur, a * .13));
    gr.addColorStop(.84, rgba(J.lueur, a * .03)); gr.addColorStop(1, rgba(J.lueur, 0));
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
    /* le cœur : là où la flamme éclaire de près, plus chaud, plus jaune */
    gr = g.createRadialGradient(m, m, 0, m, m, m * .34);
    gr.addColorStop(0, rgba(J.coeur, J.coeurA)); gr.addColorStop(.5, rgba(J.coeur, J.coeurA * .35)); gr.addColorStop(1, rgba(J.coeur, 0));
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
    return c;
  }
  /* la flamme à la position p, à l'instant t : sa place, son éclat */
  function flamme(p, t, vit) {
    const R = rayon(), e = lisse(p);
    const x = W + (W < 700 ? .14 : .035) * W + (vit ? 2.4 * Math.sin(t / 1930 + .6) + 1.1 * Math.sin(t / 610 + 2.3) : 0);
    const y = H * lerp(.16, .74, e) + (vit ? 1.8 * Math.sin(t / 2290 + 1.1) : 0);
    /* elle faiblit un peu en baissant : la cire est presque usée le soir */
    let k = lerp(1, .7, e) * (W < 700 ? .55 : 1);           /* sur un téléphone, le texte va jusqu'au bord : la flamme y est plus loin */
    if (vit) k *= 1 + .046 * Math.sin(t / 1130 + .3) + .031 * Math.sin(t / 467 + 1.7) + .02 * Math.sin(t / 2731 + 4.1) + .012 * Math.sin(t / 191 + 2.2);
    return { x, y, R, k };
  }

  /* LE RAI. La croisée : deux battants de trois carreaux, leurs petits bois.
     Peint une fois par teinte (matin, soir), flou comme un jour qui passe
     par une vitre ancienne ; le soir est le même dessin plus chaud. */
  const CROISEE = { w: 1, h: 1.42, cols: 2, rangs: 3, bois: .045, dormant: .06 };
  const tailleRai = () => Math.max(150, Math.min(.36 * W, .5 * H));
  function rai(teinte) {
    const S = tailleRai(), w = S * CROISEE.w, h = S * CROISEE.h, pad = S * .18;
    const c = document.createElement('canvas'); c.className = 'fond-lumiere';
    const cw = Math.ceil((w + 2 * pad) * ECH_LUM), ch = Math.ceil((h + 2 * pad) * ECH_LUM);
    c.width = cw; c.height = ch; c.style.width = (cw / ECH_LUM) + 'px'; c.style.height = (ch / ECH_LUM) + 'px';
    c._w = cw / ECH_LUM; c._h = ch / ECH_LUM;
    const g = c.getContext('2d'); g.scale(ECH_LUM, ECH_LUM);
    const flou = Math.max(2, S * .028);
    try { g.filter = 'blur(' + (flou * ECH_LUM).toFixed(1) + 'px)'; } catch (e) {}
    /* la lumière, carreau par carreau */
    g.fillStyle = rgba(teinte, 1);
    const b = S * CROISEE.bois, d = S * CROISEE.dormant;
    const iw = (w - 2 * d - (CROISEE.cols - 1) * b * 1.6) / CROISEE.cols, ih = (h - 2 * d - (CROISEE.rangs - 1) * b) / CROISEE.rangs;
    const carreaux = [];
    for (let i = 0; i < CROISEE.cols; i++) for (let j = 0; j < CROISEE.rangs; j++) {
      const x = pad + d + i * (iw + b * 1.6), y = pad + d + j * (ih + b);
      carreaux.push([x, y, iw, ih]); g.fillRect(x, y, iw, ih);
    }
    /* l'ombre du dormant et du meneau : un rien plus sombre que la page */
    g.filter = 'none';
    try { g.filter = 'blur(' + (flou * 1.6 * ECH_LUM).toFixed(1) + 'px)'; } catch (e) {}
    g.globalCompositeOperation = 'destination-over';
    g.fillStyle = rgba(J.ombre, .045);
    g.fillRect(pad + d * .3, pad + d * .3, w - d * .6, h - d * .6);
    c._carreaux = carreaux;
    return c;
  }
  /* la matrice du rai à la position p : le soleil tourne, la tache s'allonge */
  function matriceRai(p) {
    const e = lisse(p), S = tailleRai();
    const c = lumieres[0]; const cw = c._w, ch = c._h;
    const x0 = J.sbw + (W - J.sbw) * lerp(.84, .7, e), y0 = H * lerp(.3, .6, e);
    const ang = lerp(-26, 20, e) * Math.PI / 180, sk = lerp(22, -30, e) * Math.PI / 180;
    const sx = lerp(.94, 1.1, e), sy = lerp(.92, 1.34, e);
    const m = new DOMMatrix().translateSelf(x0, y0).rotateSelf(ang * 180 / Math.PI)
      .multiplySelf(new DOMMatrix([1, 0, Math.tan(sk), 1, 0, 0])).scaleSelf(sx, sy).translateSelf(-cw / 2, -ch / 2);
    return { m, S };
  }

  /* LE PAPIER VERGÉ. Les vergeures (les fils serrés de la forme, ici tous les
     4 px) et les pontuseaux (les fils qui les tiennent, tous les 92 px),
     comme on les voit en levant la feuille au jour. Une tuile semée, posée en
     FOND DE html : elle défile avec la feuille, sans le moindre décalage, et
     sans qu'aucune image soit repeinte (un canvas fixe recalé à chaque image
     glisserait d'une image en retard sur le texte). */
  const TW = 552;                                              /* six pontuseaux */
  function vergé() {
    const te = Math.min(2, window.devicePixelRatio || 1);
    const tuile = document.createElement('canvas');
    tuile.width = Math.round(TW * te); tuile.height = Math.round(PERIODE * te);
    const t = tuile.getContext('2d'); t.scale(te, te);
    const r = semis(hache(9, 0)), a = J.vergeureA;
    /* la feuille n'est pas égale : quelques nuées plus claires dans la pâte (l'épair) */
    for (let q = 0; q < 5; q++) {
      const cx = r() * TW, cy = r() * PERIODE, rr = 50 + r() * 90;
      for (const ox of [-TW, 0, TW]) for (const oy of [-PERIODE, 0, PERIODE]) {
        const gr = t.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, rr);
        gr.addColorStop(0, rgba(J.vergeure, a * .22)); gr.addColorStop(1, rgba(J.vergeure, 0));
        t.fillStyle = gr; t.fillRect(cx + ox - rr, cy + oy - rr, 2 * rr, 2 * rr);
      }
    }
    /* les vergeures : chacune son poids, et une ondulation à peine sensible
       (périodique sur la tuile, pour que la répétition ne se voie pas) */
    for (let y = 2; y < PERIODE; y += 4) {
      const w = .55 + r() * .5, al = a * (.3 + r() * .25), ph = r() * 6.283;
      t.strokeStyle = rgba(J.vergeure, al); t.lineWidth = w; t.beginPath();
      for (let x = 0; x <= TW; x += 12) { const yy = y + .35 * Math.sin(x / TW * 6.283 * 4 + ph); if (x) t.lineTo(x, yy); else t.moveTo(x, yy); }
      t.stroke();
    }
    /* les pontuseaux : plus marqués, flanqués d'une ombre d'épaisseur de pâte */
    for (let k = 0; k < 6; k++) {
      const x = 46 + k * 92 + (r() - .5) * 5;
      for (const [dx, lw, f] of [[0, 1.1, 1], [-2.4, 2.6, .28], [2.4, 2.6, .28]]) {
        t.strokeStyle = rgba(J.vergeure, a * f * (.8 + r() * .3)); t.lineWidth = lw; t.beginPath();
        for (let y = 0; y <= PERIODE; y += 10) { const xx = x + dx + .6 * Math.sin(y / PERIODE * 6.283 * 2 + k); if (y) t.lineTo(xx, y); else t.moveTo(xx, y); }
        t.stroke();
      }
    }
    return tuile.toDataURL('image/png');
  }

  /* LA POUSSIÈRE. Semée par rang, dans la fenêtre ; chaque grain a sa
     profondeur (il défile plus ou moins avec la page), sa taille, sa dérive
     lente (deux sinus et une montée — l'air chaud de la flamme). */
  function semer() {
    grains = [];
    if (dessin === 'edition' || !(J.grainA > 0)) return;
    const n = Math.round(clamp(W * H / 6200, 60, 240));
    for (let i = 0; i < n; i++) {
      const r = semis(hache(3, i));
      grains.push({ u: r(), v: r(), z: .35 + r() * .65, s: .7 + r() * 1.3, a: r() * 6.283, b: r() * 6.283, c: r() * 6.283, tw: 700 + r() * 1400, mont: .002 + r() * .006 });
    }
  }
  function placer(G, t, s) {
    const HH = H + 40;
    const x = G.u * W + 16 * G.z * Math.sin(t / 8900 + G.a) + 6 * Math.sin(t / 3170 + G.b);
    let y = G.v * HH - s * .1 * G.z + 12 * G.z * Math.sin(t / 7300 + G.c) - t * G.mont;
    y = ((y % HH) + HH) % HH - 20;
    return [x, y];
  }

  /* LES ZONES : les colonnes de lecture et chaque bloc qui porte un texte,
     en coordonnées du document. Un bloc dans un ancêtre collant ou fixe est
     remesuré à chaque voile. */
  function mesurerZones() {
    const t0 = performance.now();
    const sy = window.scrollY, sx = window.scrollX, memo = new Map();
    const collant = e => {
      for (let n = e; n && n !== document.body; n = n.parentElement) {
        if (memo.has(n)) return memo.get(n);
        const p = getComputedStyle(n).position;
        if (p === 'sticky' || p === 'fixed') { memo.set(n, true); return true; }
      }
      return false;
    };
    /* au pixel entier : un défilement fractionnaire (téléphone) ne doit pas
       changer le voile d'un rien à chaque passage */
    const rect = e => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left + sx), y: Math.round(b.top + sy), w: Math.round(b.width), h: Math.round(b.height), el: collant(e) ? e : null }; };
    const els = [...document.querySelectorAll(CALMES)].filter(e => !e.parentElement.closest(CALMES) && !e.closest(HORS));
    calmes = els.map(rect).filter(b => b.w > 0 && b.h > 0);
    const blocs = new Set(), tw = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.nodeType === 1 ? (n.matches(CALMES) || n.matches(HORS) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP)
        : (n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP)
    });
    while (tw.nextNode()) {
      let e = tw.currentNode.parentElement;
      while (e && e !== document.body && getComputedStyle(e).display.startsWith('inline')) e = e.parentElement;
      if (e && e !== document.body) blocs.add(e);
    }
    voiles = [...blocs].map(rect).filter(b => b.w > 0 && b.h > 0);
    for (const e of document.querySelectorAll('main svg, main canvas, main img')) { const b = rect(e); if (b.w > 120 && b.h > 80) voiles.push(b); }
    zonesMs = performance.now() - t0; voileY = NaN;
  }

  /* ---------- une image ---------- */
  function rendre(t, force) {
    const t0 = performance.now();
    if (fige) { t = tFige; force = true; sL = window.scrollY; }
    /* une fenêtre qui a changé de taille sans le dire (sur téléphone, la
       première mesure peut précéder la mise en page, et une page qui déborde
       élargit le viewport sans événement « resize ») */
    if (window.innerWidth !== W || window.innerHeight !== H) { if (force) construire(); else reconstruire(); }
    const vit = mode === 'anime' && (force || !document.hidden);
    const s = vit ? sL : 0, p = vit ? pDe(sL) : .3, tt = vit ? t : 0;
    /* la lumière : placée et dosée par le compositeur */
    let lit = null;
    if (dessin === 'bougie' && lumieres[0]) {
      const F = flamme(p, tt, vit), c = lumieres[0];
      c.style.transform = 'translate3d(' + (F.x - F.R).toFixed(1) + 'px,' + (F.y - F.R).toFixed(1) + 'px,0)';
      c.style.opacity = clamp(F.k, 0, 1).toFixed(3);
      lit = (x, y) => { const d = Math.hypot(x - F.x, y - F.y) / F.R; return d >= 1 ? 0 : Math.pow(1 - d, 1.7) * F.k; };
    } else if (dessin === 'jour' && lumieres.length === 2) {
      const { m, S } = matriceRai(p), e = lisse(p);
      const tr = m.toString();
      lumieres[0].style.transform = tr; lumieres[1].style.transform = tr;
      lumieres[0].style.opacity = (J.raiA * (1 - e)).toFixed(3);
      lumieres[1].style.opacity = (J.soirA * e).toFixed(3);
      const inv = m.inverse(), car = lumieres[0]._carreaux, bord = S * .05;
      lit = (x, y) => {
        const q = inv.transformPoint(new DOMPoint(x, y));
        let best = 0;
        for (const [cx, cy, cw, ch] of car) {
          const dx = Math.min(q.x - cx, cx + cw - q.x), dy = Math.min(q.y - cy, cy + ch - q.y);
          const v = Math.min(dx, dy) / bord; if (v > best) best = v;
        }
        return clamp(best, 0, 1);
      };
    }
    /* le voile AVANT la poussière : c'est lui qui la masque. Posé après, il
       laissait les grains de cette image sous le masque de l'image d'avant —
       à la même position, deux images différentes selon d'où l'on venait
       (trouvé par tools/sonde-fond.js --reversible) */
    if (window.scrollY !== voileY) voiler();
    /* la poussière : on n'efface que les boîtes de l'image d'avant */
    gtx.setTransform(dT, 0, 0, dT, 0, 0);
    for (const [x, y, z] of boites) gtx.clearRect(x - 1, y - 1, z + 2, z + 2);
    boites = [];
    if (lit && grains.length) {
      const jour = dessin === 'jour';
      gtx.fillStyle = rgba(J.grain, 1);
      for (const G of grains) {
        const [x, y] = placer(G, tt, s);
        if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
        const l = lit(x, y); if (l < .02) continue;
        const sc = vit ? Math.sin(tt / G.tw + G.a) : .5;
        /* le jour, un grain ne se voit que quand il accroche le soleil : il scintille ;
           à la bougie, il flotte et luit doucement */
        const tw = jour ? .25 + .75 * Math.pow(Math.max(0, sc), 2) : .62 + .38 * sc;
        let a = J.grainA * l * tw * (.5 + .5 * G.z);
        if (masque) { const mx = Math.min(vv.width - 1, Math.max(0, x * VOILE | 0)), my = Math.min(vv.height - 1, Math.max(0, y * VOILE | 0)); a *= 1 - masque[(my * vv.width + mx) * 4 + 3] / 255; }
        if (a < .012) continue;
        gtx.globalAlpha = Math.min(1, a);
        const z = G.s * (jour ? 1 : .9 + .25 * G.z);
        gtx.fillRect(x, y, z, z); boites.push([x, y, z]);
      }
      gtx.globalAlpha = 1;
    }
    if (LOGICIEL) { gtx.getImageData(0, 0, 1, 1); stx.getImageData(0, 0, 1, 1); }
    const ms = performance.now() - t0;
    stats.n++; stats.tot += ms; if (ms > stats.max) stats.max = ms;
  }

  /* LES DEUX VOILES. Le papier repeint par-dessus le fond là où l'on lit.
     — Le voile NET (un quart de la résolution, jamais affiché) est un MASQUE
       pour la poussière : elle bouge, on ne lit pas à travers elle. Presque
       entier sous les colonnes de lecture, aux trois quarts sous tout bloc qui
       porte un texte, en paliers de fondu. Peint en papier par-dessus le halo,
       il y découpait des boîtes ; il ne fait plus qu'éteindre les grains.
     — Le voile DOUX (un huitième de la résolution, flou de 56 px) atténue la
       lumière et le papier vergé. Un voile net sur une lueur lisse y DÉCOUPAIT
       des rectangles sombres, cernés d'un liseré de lumière : le texte se lisait
       dans une boîte (vu à la première capture). Flou, il ne dessine rien ; il
       baisse seulement la lumière là où il y a du texte.
     Chaque palier est UNE union de rectangles, un seul remplissage, pour que
     deux paragraphes voisins ne se cumulent pas. */
  function voiler() {
    voileY = window.scrollY;
    vtx.setTransform(VOILE, 0, 0, VOILE, 0, 0);
    vtx.clearRect(0, 0, W, H);
    masque = null;
    if (grains.length) {
      vtx.fillStyle = '#000';
      poser(vtx, calmes, [[44, .35], [26, .5], [10, .7], [-6, .9]]);
      poser(vtx, voiles, [[20, .35], [9, .5], [0, .75]]);
      vtx.globalAlpha = 1;
      masque = vtx.getImageData(0, 0, vv.width, vv.height).data;
    }
    stx.setTransform(DOUX, 0, 0, DOUX, 0, 0);
    stx.filter = 'none';
    stx.clearRect(0, 0, W, H);
    stx.fillStyle = rgba(J.papier, 1);
    try { stx.filter = 'blur(' + (FLOU * DOUX).toFixed(2) + 'px)'; } catch (e) {}
    poser(stx, voiles, [[24, J.doux]]);
    poser(stx, calmes, [[40, J.douxCalme]]);
    stx.filter = 'none'; stx.globalAlpha = 1;
  }
  function poser(c2, liste, paliers) {
    if (!liste.length) return;
    const sy = window.scrollY, sx = window.scrollX, vus = [];
    for (const c of liste) {
      let x = c.x - sx, y = c.y - sy, w = c.w, h = c.h;
      if (c.el) { const b = c.el.getBoundingClientRect(); x = Math.round(b.left); y = Math.round(b.top); w = Math.round(b.width); h = Math.round(b.height); }
      if (!(y > H + 60 || y + h < -60 || x > W + 60 || x + w < -60)) vus.push([x, y, w, h]);
    }
    if (!vus.length) return;
    for (const [m, a] of paliers) {
      c2.globalAlpha = a; c2.beginPath();
      for (const [x, y, w, h] of vus) {
        const yy = Math.max(-80, y - m), hh = Math.min(H + 80, y + h + m) - yy;
        if (hh <= 0) continue;
        if (c2.roundRect) c2.roundRect(x - m, yy, w + 2 * m, hh, Math.max(0, m)); else c2.rect(x - m, yy, w + 2 * m, hh);
      }
      c2.fill('nonzero');
    }
  }

  /* ---------- la boucle ----------
     La flamme vacille toujours : la boucle tourne tant que la page est vue.
     Pendant le défilement, une image par image ; au repos, une toutes les
     50 ms suffit à une flamme et à de la poussière — le navigateur dort
     entre deux. */
  let besoin = false, fige = false, tFige = 0;
  function boucle(t) {
    raf = 0;
    if (!actif || fige || document.hidden || mode !== 'anime') return;
    const dt = Math.min(64, dernier ? t - dernier : 16);
    const ecart = window.scrollY - sL, bouge = Math.abs(ecart) > .4;
    if (bouge) sL += ecart * (1 - Math.pow(.86, dt / 16.7)); else sL = window.scrollY;
    rendre(t); dernier = t;
    if (bouge || besoin) { besoin = false; raf = requestAnimationFrame(boucle); }
    else repos = setTimeout(() => { repos = 0; if (!raf) raf = requestAnimationFrame(boucle); }, 50);
  }
  const arreter = () => { if (raf) cancelAnimationFrame(raf); if (repos) clearTimeout(repos); raf = 0; repos = 0; };
  const relancer = () => {
    if (mode !== 'anime' || !actif || fige || document.hidden) return;
    if (repos) { clearTimeout(repos); repos = 0; }
    if (!raf) raf = requestAnimationFrame(boucle);
  };
  let fixeRaf = 0, finDefil = 0;
  const auDefilement = () => {
    if (!actif) return;
    /* au repos, on remesure : les révélations et les gestes au défilement
       déplacent des blocs sans qu'aucun événement le dise */
    clearTimeout(finDefil); finDefil = setTimeout(() => { if (actif) { mesurerZones(); voileY = NaN; if (mode !== 'anime') rendre(0); } }, 220);
    if (mode === 'anime') { besoin = true; relancer(); return; }
    if (!fixeRaf && !fige) fixeRaf = requestAnimationFrame(() => { fixeRaf = 0; rendre(0); });
  };

  function appliquer() {
    const e = etat().effectif;
    if (e === 'aucun' || e === 'absent') {
      actif = false; html.classList.remove('fond-on'); html.style.removeProperty('--fond-verge');
      arreter(); boite.remove(); return;
    }
    mode = e;
    if (!boite.isConnected) { boite.append(sv, ombre, gv); document.body.insertBefore(boite, document.body.firstChild); }
    html.classList.add('fond-on');
    if (!actif) { actif = true; construire(); signature = signer(); }
    else if (dessin !== modeDe()) { construire(); signature = signer(); }
    sL = window.scrollY;
    rendre(performance.now());                 /* le filet : une image tout de suite, même onglet masqué */
    if (mode === 'anime') { dernier = 0; relancer(); } else arreter();
  }

  let attente = 0;
  const reconstruire = () => { clearTimeout(attente); attente = setTimeout(() => { if (!actif) return; construire(); rendre(performance.now()); }, 120); };
  /* un changement de classe sur html ne repeint que si les jetons ont changé */
  let signature = '';
  const signer = () => { jetons(); const { sbw, ...k } = J; return modeDe() + JSON.stringify(k); };
  const aRepeindre = () => {
    if (absent) return;
    const e = etat().effectif;
    if ((e === 'anime' || e === 'fixe') !== actif || (actif && e !== mode)) { appliquer(); annonce(); return; }
    if (!actif) return;
    const s = signer(); if (s === signature) return;
    signature = s; construire(); rendre(performance.now());
  };

  function init() {
    absent = !ici() || !!document.querySelector(SCENES);
    if (absent) { annonce(); return; }
    appliquer(); annonce();
    addEventListener('scroll', auDefilement, { passive: true });
    addEventListener('resize', reconstruire);
    document.addEventListener('visibilitychange', () => { if (document.hidden) arreter(); else if (actif) { rendre(performance.now()); dernier = 0; relancer(); } });
    document.addEventListener('lm:mode', aRepeindre);
    new MutationObserver(aRepeindre).observe(html, { attributes: true, attributeFilter: ['data-mode'] });
    reduit.addEventListener && reduit.addEventListener('change', () => { appliquer(); annonce(); });
    if (window.ResizeObserver) {
      let t = 0; const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => { if (actif) { mesurerZones(); auDefilement(); } }, 60); });
      ro.observe(document.body);
      /* la barre latérale se replie : le rai se recadre sur ce qui reste */
      const sb = document.querySelector('.sidebar'); if (sb) ro.observe(sb);
    }
    let fin = 0; const apres = () => { clearTimeout(fin); fin = setTimeout(() => { if (actif) { mesurerZones(); voileY = NaN; rendre(performance.now()); } }, 80); };
    document.addEventListener('transitionend', apres, true);
    document.addEventListener('animationend', apres, true);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (actif) { mesurerZones(); auDefilement(); } });
    addEventListener('load', () => { if (actif) { mesurerZones(); auDefilement(); } });
  }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();
