/* LE PILOTE DES MONDES — commun à toutes les pages-monde du glossaire.
   Décide si la scène peut jouer (≥ 1100 px, pas de reduced-motion, WebGL),
   charge Three.js puis la scène de la notion (monde.js, qui expose
   window.LM_MONDE = function(canvas){ return {set(g,dt), frame(dt),
   resize(), render(), dispose()} }), et la pilote par la POSITION de
   lecture : g = index de la section sous la ligne de lecture + fraction
   parcourue. Tout est réversible — on remonte, la scène se range.
   Sans scène (mobile, reduced-motion, pas de WebGL, échec de chargement),
   l'image fixe reste : la page est finie sans une ligne de script.
   Les seuils se lisent à matchMedia, jamais à innerWidth (au moment où le
   script s'exécute, la fenêtre peut encore annoncer 0). */
/* ═══ LE GABARIT DE LECTURE (oct. 2026) : LA FIGURE À LA DEMANDE ═══
   Sur une page réécrite selon glossaire/mondes/CHARTE.md, la scène ne suit
   plus le défilement : elle est une figure, immobile par défaut (l'image
   fixe), que le lecteur fait jouer. « Voir la scène » charge Three.js et la
   scène, puis parcourt toutes les étapes d'un trait (g de 0 à N, la même
   chorégraphie qu'au défilement) ; les boutons d'étape y vont directement.
   Lecture interrompue par n'importe quel geste sur les étapes ; un bouton
   met en pause (WCAG 2.2.2). Sous reduced-motion, pas de glissement : on
   saute d'étape en étape. Et le sommaire marque la section qu'on lit. */
(function(){
  'use strict';
  var fig = document.querySelector('.nt-fig');
  if (!fig) return;

  /* ── le sommaire suit la lecture (orientation : vaut partout) ── */
  var liens = [].slice.call(document.querySelectorAll('.nt-som a[href^="#"]'));
  var cibles = liens.map(function(a){ return document.getElementById(a.getAttribute('href').slice(1)); });
  var courant = -1, attente = false;
  function suivre(){
    attente = false;
    var ligne = (window.innerHeight || 800) * 0.3, i = -1;
    for (var k = 0; k < cibles.length; k++) if (cibles[k] && cibles[k].getBoundingClientRect().top <= ligne) i = k;
    if (i === courant) return;
    /* la lumière d'ambiance suit la section qu'on lit (meta.da.lumieres) */
    var lum = i >= 0 && cibles[i] && cibles[i].dataset.lumiere;
    if (lum) document.body.dataset.lumiere = lum; else delete document.body.dataset.lumiere;
    if (courant >= 0) liens[courant].removeAttribute('aria-current');
    if (i >= 0) liens[i].setAttribute('aria-current', 'location');
    courant = i;
  }
  document.addEventListener('scroll', function(){ if (!attente) { attente = true; requestAnimationFrame(suivre); } }, { passive: true, capture: true });
  window.addEventListener('load', suivre); setTimeout(suivre, 400); suivre();

  if (!fig.dataset.scene) return;
  var canvas = fig.querySelector('canvas'), still = fig.querySelector('.nt-monde-still');
  var go = fig.querySelector('.nt-fig-go'), barre = fig.querySelector('.nt-fig-barre');
  var lire = fig.querySelector('.nt-fig-lire'), cap = fig.querySelector('.nt-fig-cap');
  var pas = [].slice.call(fig.querySelectorAll('.nt-fig-pas button'));
  var N = pas.length;
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NEED3D = !!fig.dataset.three;
  function hasGL(){
    try { var c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); }
    catch (e) { return false; }
  }
  if (!canvas || !N || (NEED3D && !hasGL())) return;
  go.hidden = false; barre.hidden = false; lire.hidden = true;   /* un seul bouton de lecture avant le chargement */

  function load(src){
    return new Promise(function(res, rej){
      var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  var monde = null, charge = null;
  function charger(){
    if (charge) return charge;
    go.disabled = true;
    var p = (NEED3D && typeof THREE === 'undefined') ? load(fig.dataset.three) : Promise.resolve();
    charge = p.then(function(){ return load(fig.dataset.scene); }).then(function(){
      monde = window.LM_MONDE(canvas);
      return monde.ready || null;
    }).then(function(){
      var avaitFocus = document.activeElement === go;
      canvas.hidden = false; if (still) still.hidden = true; go.hidden = true; lire.hidden = false;
      if (avaitFocus) lire.focus();   /* le bouton qu'on vient d'activer disparaît : le focus ne doit pas tomber sur <body> */
      monde.resize(); boucle();
      window.__ntMonde = { monde: monde, set: function(v){ arreter(); poser(v); }, free: function(){}, get: function(){ return g; } };
    }).catch(function(){ go.disabled = false; charge = null; });
    return charge;
  }

  var g = Number(fig.dataset.g0) || 0, cible = g, depart = g, t0 = 0, duree = 0, lecture = false, legI = -1;
  function legende(){
    var i = Math.min(N - 1, Math.max(0, Math.floor(g)));
    if (i === legI) return;
    legI = i;
    pas.forEach(function(b, k){ b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    var txt = pas[i].dataset.leg || '';
    cap.classList.add('swap');
    setTimeout(function(){ cap.textContent = txt; cap.classList.remove('swap'); }, REDUCE ? 0 : 160);
  }
  function poser(v){ g = v; if (monde) monde.set(g); legende(); }
  function aller(v, ms){ depart = g; cible = v; t0 = performance.now(); duree = REDUCE ? 0 : ms; if (!duree) poser(v); }
  function arreter(){ lecture = false; fig.classList.remove('is-playing'); lire.setAttribute('aria-label', 'Lire la scène'); clearTimeout(saut); }
  var saut = null;
  function jouer(){
    lecture = true; fig.classList.add('is-playing'); lire.setAttribute('aria-label', 'Mettre la scène en pause');
    var debut = g >= N - 0.05 ? 0 : g;
    if (REDUCE) {   /* étape par étape, sans glissement */
      var i = Math.floor(debut);
      (function suivant(){ if (!lecture) return; poser(i + 0.6); i++; if (i < N) saut = setTimeout(suivant, 4200); else arreter(); })();
    } else { poser(debut); aller(N - 0.02, (N - debut) * 3600); }
  }
  /* la boucle : la scène vit (flamme, étiquette) tant qu'elle est à l'écran */
  var raf = null, last = 0, visible = true;
  function frame(now){
    raf = null;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
    if (duree) {
      var k = Math.min(1, (now - t0) / duree);
      var e = lecture ? k : (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
      poser(depart + (cible - depart) * e);
      if (k >= 1) { duree = 0; if (lecture) arreter(); }
    }
    monde.frame(dt);
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function boucle(){ if (monde && !raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
  if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ visible = es[0].isIntersecting; boucle(); }).observe(fig);
  document.addEventListener('visibilitychange', boucle);
  window.addEventListener('resize', function(){ if (monde) monde.resize(); });

  /* « Voir la scène » la montre depuis le début ; le bouton de lecture reprend où l'on en est */
  go.addEventListener('click', function(){ charger().then(function(){ if (monde) { poser(0); jouer(); } }); });
  lire.addEventListener('click', function(){
    charger().then(function(){ if (!monde) return; if (lecture) { arreter(); duree = 0; } else jouer(); });
  });
  pas.forEach(function(b, i){
    b.addEventListener('click', function(){
      arreter();
      charger().then(function(){ if (monde) aller(i + 0.6, 1300); });
    });
  });
  /* pour capture-monde.mjs : charger la scène sans geste */
  window.__ntFig = { charger: charger };
})();

(function(){
  'use strict';
  if (document.querySelector('.nt-fig')) return;
  var aside = document.querySelector('.nt-monde');
  if (!aside) return;
  var canvas = aside.querySelector('canvas');
  var still = aside.querySelector('.nt-monde-still');
  var cap = aside.querySelector('.nt-monde-cap');
  var secs = [].slice.call(document.querySelectorAll('.nt-sec[data-etape]'));
  if (!canvas || !secs.length) return;

  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function hasGL(){
    try { var c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); }
    catch (e) { return false; }
  }
  /* une scène en 2D ne déclare pas data-three : elle ne demande alors ni
     WebGL ni la bibliothèque — cent quarante-huit kilo-octets de moins */
  var NEED3D = !!aside.dataset.three;

  /* La bande collante des petits écrans se cale sous la topbar, dont la
     hauteur n'est PAS 44 px partout (trois rangées sous 520 px) et n'est
     connue qu'une fois la coquille montée et les polices arrivées — le piège
     de la mesure unique, déjà payé par l'abécédaire. */
  function topH(){
    var tb = document.querySelector('.topbar');
    var h = tb ? tb.getBoundingClientRect().height : 44;
    document.documentElement.style.setProperty('--nt-top', Math.round(h) + 'px');
  }
  topH(); requestAnimationFrame(topH); setTimeout(topH, 400);
  window.addEventListener('load', topH); window.addEventListener('resize', topH);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(topH);
  /* LA LÉGENDE REPLIÉE (téléphone, mission `mobile-lecture`) : une ligne,
     qu'on touche pour la lire en entier. Posé avant les gardes de mouvement :
     la bande est réduite aussi sous reduced-motion. */
  var FOLD = matchMedia('(max-width:760px)');
  function setOpen(o){
    cap.classList.toggle('is-open', o); aside.classList.toggle('cap-open', o);
    cap.setAttribute('aria-expanded', o ? 'true' : 'false');
  }
  function fold(){
    if (!cap) return;
    var on = FOLD.matches;
    aside.classList.toggle('cap-fold', on);
    if (on) { cap.setAttribute('role', 'button'); cap.tabIndex = 0; setOpen(cap.classList.contains('is-open')); }
    else { setOpen(false); cap.removeAttribute('role'); cap.removeAttribute('tabindex'); cap.removeAttribute('aria-expanded'); }
  }
  if (cap) {
    cap.addEventListener('click', function(){ if (FOLD.matches) setOpen(!cap.classList.contains('is-open')); });
    cap.addEventListener('keydown', function(e){
      if (!FOLD.matches) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(!cap.classList.contains('is-open')); }
      else if (e.key === 'Escape') setOpen(false);
    });
    if (FOLD.addEventListener) FOLD.addEventListener('change', fold);
    fold();
  }
  if (REDUCE || (NEED3D && !hasGL())) return;

  function load(src){
    return new Promise(function(res, rej){
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  /* ── LE FILET ─────────────────────────────────────────────────────────
     La décision se prend au moment de décider, et une seule mesure ne
     suffit pas : au moment où ce script s'exécute, la fenêtre peut encore
     annoncer une largeur qui n'est pas la sienne (onglet ouvert en
     arrière-plan, fenêtre restaurée, onglet piloté). Sans filet, la scène
     ne s'armait JAMAIS et la page restait sur son image fixe pour de bon —
     vécu en vérifiant le déploiement dans une pane étroite. Le seuil est
     donc redemandé au chargement et au premier redimensionnement, comme
     l'accueil et l'entrée du carnet le font déjà. */
  var lance = false;
  function armer(){
    /* mission vivant-sur-mobile : plus de seuil de largeur — sous 1100 px la
       scène est une BANDE COLLANTE en haut de l'écran (notion.css) */
    if (lance) return;
    lance = true;
    window.removeEventListener('resize', armer);
    window.removeEventListener('load', armer);
    var p = (NEED3D && typeof THREE === 'undefined') ? load(aside.dataset.three) : Promise.resolve();
    p.then(function(){ return load(aside.dataset.scene); }).then(start).catch(function(){});
  }
  armer();
  if (!lance) {
    window.addEventListener('resize', armer);
    window.addEventListener('load', armer);
    setTimeout(armer, 400);
  }

  function start(){
    if (typeof window.LM_MONDE !== 'function') return;
    var monde;
    try { monde = window.LM_MONDE(canvas); } catch (e) { monde = null; }
    if (!monde) return;
    canvas.hidden = false;
    if (still) still.hidden = true;
    document.documentElement.classList.add('js-monde');
    monde.resize();

    var g = 0, cur = -1, queued = false;
    function progress(){
      var vh = window.innerHeight || 0;
      if (!vh) return g;
      var line = vh * 0.55, out = secs.length;
      for (var i = 0; i < secs.length; i++) {
        var r = secs[i].getBoundingClientRect();
        if (line < r.top) { out = i; break; }
        if (line < r.bottom) { out = i + (line - r.top) / Math.max(1, r.height); break; }
      }
      return out;
    }
    function legend(){
      var i = Math.min(secs.length - 1, Math.max(0, Math.floor(g)));
      if (i === cur || !cap) return;
      cur = i;
      var txt = secs[i].dataset.legende || '';
      cap.classList.add('swap');
      setTimeout(function(){ cap.textContent = txt; cap.classList.remove('swap'); }, 180);
    }
    var locked = false;   /* la sonde tient la position : les remesures n'écrivent plus */
    function measure(){
      if (locked) return;
      g = progress();
      monde.set(g);
      legend();
    }
    function onScroll(){
      if (queued) return;
      queued = true;
      requestAnimationFrame(function(){ queued = false; measure(); });
    }
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('resize', function(){ monde.resize(); onScroll(); });

    /* Le piège de la mesure unique : la coquille se monte après nous et
       déplace tout — on remesure quand elle est là, et quand les polices
       arrivent. */
    measure();
    requestAnimationFrame(measure);
    setTimeout(measure, 400);
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    /* La boucle : ne tourne que si la scène est à l'écran et l'onglet
       visible — une bougie qui vacille pour personne, c'est du GPU jeté. */
    var onScreen = true, raf = null, last = 0;
    function frame(now){
      raf = null;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      monde.frame(dt);
      if (onScreen && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function run(){ if (!raf && onScreen && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(es){
        onScreen = es[0].isIntersecting; if (onScreen) run();
      }, { threshold: 0 }).observe(aside);
    }
    document.addEventListener('visibilitychange', run);
    run();
    /* Sonde pour la vérification à la main — sans effet en usage normal. */
    window.__ntMonde = { monde: monde, set: function(v){ locked = true; g = v; monde.set(v); legend(); }, free: function(){ locked = false; measure(); }, get: function(){ return g; } };
  }
})();
