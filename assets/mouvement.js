/* Lire Marx — LES GESTES (mission `affichage`, volet « gestes », oct. 2026).

   Chargé `defer` par le bloc AFFICHAGE (fin de <head>, dérivé par
   tools/gen-seo.mjs), sur toutes les pages qui portent ce bloc. Il tourne
   donc APRÈS le parse, mais pas forcément après shell.js : tout ce qui en
   dépend (SHELL.recherche, SHELL.announce, la barre du haut) est cherché au
   moment de servir, jamais supposé.

   Cinq choses, toutes de la commodité — sans ce fichier chaque page reste
   entière :
     1. les transitions entre pages (le CSS les déclare ; ici on les saute en
        économie de données, et on nomme les deux barres le temps du passage) ;
     2. la bascule de mode, LM.basculer(m, origine) : une révélation
        circulaire autour du bouton — le jour s'ouvre depuis lui, ou la
        lumière se retire dans la flamme quand on revient à la bougie ;
     3. ⌘K / Ctrl+K : LA recherche de la barre (il n'y en a pas de seconde),
        présentée en palette, et ses actions (haut de page, adresse de la
        page ou de la section, barre latérale, carnet, plein écran) ;
     4. les micro-gestes qui ont besoin du DOM (la flèche d'un renvoi, sortie
        du texte pour pouvoir avancer) — le reste est en CSS ;
     5. le confort : trait de la part lue, retour en haut, ancres « # ».

   RIEN ne bouge sous prefers-reduced-motion : la bascule se fait tout net,
   les transitions entre pages n'existent pas, le retour en haut saute. Les
   gestes d'ORIENTATION (le trait de lecture, l'ancre, le retour en haut)
   restent, eux, sous mouvement réduit : ce ne sont pas des mouvements. */
(function(){
  'use strict';
  var html = document.documentElement;
  var LM = window.LM = window.LM || {};
  var MQR = matchMedia('(prefers-reduced-motion: reduce)');
  function reduit(){ return MQR.matches; }
  function economie(){ return !!(navigator.connection && navigator.connection.saveData); }
  function annoncer(m){ try { if(window.SHELL && SHELL.announce) SHELL.announce(m); } catch(e){} }
  var EASE = 'cubic-bezier(.16,1,.3,1)';

  /* ---------- 1. LES TRANSITIONS ENTRE PAGES ----------
     `@view-transition { navigation: auto }` vit dans mouvement.css, sous
     prefers-reduced-motion: no-preference. Les deux barres n'ont leur
     view-transition-name QUE pendant un passage (html.vt-nav) : posé en
     permanence, il ferait de la barre du haut une « racine d'arrière-plan »,
     et le verre dépoli de la pilule de l'accueil (backdrop-filter sur
     .topbar-in) ne verrait plus que la barre elle-même. pageswap pose la
     classe avant la capture de l'ancienne page ; sur la nouvelle, elle est
     posée tout de suite (ce script tourne avant le premier rendu utile la
     plupart du temps) puis retirée dès que le passage est fini — et, filet,
     après une seconde si aucun passage n'a eu lieu. */
  function tenir(vt){ if(!vt) return; vt.ready.catch(function(){}); vt.finished.catch(function(){}).then(function(){ html.classList.remove('vt-nav'); }); }
  addEventListener('pageswap', function(e){
    if(!e.viewTransition) return;
    if(economie()){ e.viewTransition.skipTransition(); return; }
    html.classList.add('vt-nav'); tenir(e.viewTransition);
  });
  addEventListener('pagereveal', function(e){
    if(!e.viewTransition) return;
    if(economie() || reduit()){ e.viewTransition.skipTransition(); return; }
    html.classList.add('vt-nav'); tenir(e.viewTransition);
  });
  /* la nouvelle page : la barre du haut est injectée par shell.js en fin de
     <body> ; si la capture a lieu après ce script, elle porte son nom */
  if(!reduit() && !economie()){
    html.classList.add('vt-nav');
    setTimeout(function(){ html.classList.remove('vt-nav'); }, 1200);
    addEventListener('pageshow', function(e){ if(e.persisted) setTimeout(function(){ html.classList.remove('vt-nav'); }, 900); });
  }

  /* ---------- 2. LA BASCULE DE MODE ----------
     Le contrat (brief commun) : LM.mode(m) applique de façon SYNCHRONE et
     n'ouvre aucune transition ; LM.basculer l'enveloppe dans
     startViewTransition. Pendant la bascule, html.vt-mode : la page entière
     est UNE image (les barres perdent leur nom), et l'on anime le clip-path
     d'une des deux images depuis le centre de l'origine.
       — vers un mode clair : la nouvelle image s'ouvre en cercle depuis le
         bouton, le jour qui entre par les volets ;
       — vers la bougie : l'ANCIENNE image (le jour) se resserre en cercle
         jusqu'au bouton, comme une lumière qui se retire dans la flamme. */
  function centre(o){
    var x = innerWidth / 2, y = innerHeight / 2;
    try {
      var r = o && (o.getBoundingClientRect ? o.getBoundingClientRect() : o);
      if(r && r.width) { x = r.left + r.width / 2; y = r.top + r.height / 2; }
      else if(r && r.x != null) { x = r.x; y = r.y; }
      /* un bouton replié (menu fermé, champ masqué) rend un rectangle nul */
      if(!(x > 0 || y > 0)) { x = innerWidth / 2; y = innerHeight / 2; }
    } catch(e){}
    return { x: x, y: y };
  }
  function basculer(m, origine){
    if(typeof LM.mode !== 'function') return Promise.resolve();
    var avant = html.getAttribute('data-mode');
    var apres = LM.resoudre ? LM.resoudre(m) : null;
    if(reduit() || economie() || document.hidden || typeof document.startViewTransition !== 'function' || (apres && apres === avant)){
      LM.mode(m); return Promise.resolve();
    }
    var c = centre(origine), x = c.x, y = c.y;
    var rayon = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var versBougie = apres === 'bougie';
    html.classList.add('vt-mode');
    html.classList.toggle('vt-ombre', versBougie);
    var vt;
    try { vt = document.startViewTransition(function(){ LM.mode(m); }); }
    catch(e){ html.classList.remove('vt-mode','vt-ombre'); LM.mode(m); return Promise.resolve(); }
    var petit = 'circle(0px at ' + x + 'px ' + y + 'px)', grand = 'circle(' + Math.ceil(rayon) + 'px at ' + x + 'px ' + y + 'px)';
    vt.ready.then(function(){
      if(versBougie)
        html.animate({ clipPath: [grand, petit] }, { duration: 620, easing: 'cubic-bezier(.55,0,.35,1)', fill: 'forwards', pseudoElement: '::view-transition-old(root)' });
      else
        html.animate({ clipPath: [petit, grand] }, { duration: 620, easing: EASE, pseudoElement: '::view-transition-new(root)' });
    }).catch(function(){});
    return vt.finished.catch(function(){}).then(function(){ html.classList.remove('vt-mode','vt-ombre'); });
  }
  LM.basculer = basculer;

  /* ---------- 3. ⌘K : LA RECHERCHE EN PALETTE ----------
     Il n'y a PAS de seconde recherche : ⌘K / Ctrl+K ouvre le champ de la
     barre (SHELL.recherche.ouvrir), et html.lm-palette le présente au
     centre, plus large, sur un voile. Tout le reste — l'index, les groupes,
     le plein texte, le clavier dans la liste — est celui de shell.js.
     La palette se replie avec le champ : Échap, un clic sur le voile, un
     résultat choisi, le focus qui s'en va. Le focus revient à ce qui
     l'avait avant ⌘K.

     ⌘K est pris PARTOUT, champs d'une ligne compris (c'est la convention
     des palettes), SAUF dans une zone de RÉDACTION — un <textarea> ou un
     contenu éditable : on y écrit une note, un message, et le raccourci
     reste au navigateur. Hors d'un champ, « / » reste celui de shell.js
     (le champ dans la barre, sans palette). */
  var ouvreur = null, observe = false;
  function SR(){ return window.SHELL && SHELL.recherche && SHELL.recherche.ouvrir ? SHELL.recherche : null; }
  function wrap(){ return document.getElementById('tbSearchWrap'); }
  function champ(){ return document.getElementById('tbSearch'); }
  function paletteOuverte(){ return html.classList.contains('lm-palette'); }
  function ouvrirPalette(){
    var s = SR(), w = wrap(), inp = champ(); if(!s || !w || !inp) return false;
    brancherPalette();
    if(paletteOuverte()){ inp.focus(); inp.select(); return true; }
    var a = document.activeElement;
    ouvreur = (a && a !== document.body && a !== inp && !w.contains(a)) ? a : null;
    html.classList.add('lm-palette');
    w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'Rechercher, ou lancer une action');
    var avant = document.activeElement;
    s.ouvrir();
    /* déjà focalisé : l'événement focus ne repart pas, on redemande l'état vide */
    if(avant === inp) inp.dispatchEvent(new Event('input'));
    return true;
  }
  /* replier : par le bouton ✕ du champ (shell.js le câble : il replie le
     champ ET ferme la liste), puis rendre le focus */
  function replierPalette(rendre){
    if(!paletteOuverte()) return;
    html.classList.remove('lm-palette');
    var w = wrap(); if(w){ w.removeAttribute('role'); w.removeAttribute('aria-label'); }
    if(document.body.classList.contains('tb-searching')){
      var R = window.SHELL && window.SHELL.recherche;
      if(R && R.fermer) R.fermer(); else { var x = document.getElementById('tbSearchClose'); if(x) x.click(); }
    }
    var o = ouvreur; ouvreur = null;
    if(rendre === false) return;
    if(rendre && rendre.focus){ rendre.focus({ preventScroll: true }); return; }
    var a = document.activeElement;
    if(o && o.isConnected && (!a || a === document.body || a === champ() || (w && w.contains(a)) || a.id === 'tbSearchOpen'))
      o.focus({ preventScroll: true });
  }
  function brancherPalette(){
    if(observe) return;
    var w = wrap(), inp = champ(), box = document.getElementById('tbResults');
    if(!w || !inp) return;
    observe = true;
    /* le champ s'est replié par shell.js (action lancée, clic au dehors) */
    new MutationObserver(function(){
      if(paletteOuverte() && !document.body.classList.contains('tb-searching')) replierPalette(true);
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    /* Échap : shell.js ferme la liste et replie le champ ; on rend le focus */
    w.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && paletteOuverte()){ setTimeout(function(){ replierPalette(true); }, 0); }
    });
    /* un clic dans la liste qui n'est pas sur une option ne doit pas faire
       perdre le focus au champ (il refermerait la palette) */
    w.addEventListener('pointerdown', function(e){
      if(!paletteOuverte() || e.target === w) return;
      if(!e.target.closest('input,button,a,[role="option"]')) e.preventDefault();
    });
    /* le voile (le pseudo-élément du conteneur) : un clic dessus a pour cible
       le conteneur lui-même */
    w.addEventListener('click', function(e){ if(paletteOuverte() && e.target === w) replierPalette(true); });
    /* le focus s'en va (Tab, clic ailleurs) : la palette se replie, et le
       focus reste là où on l'a mis */
    w.addEventListener('focusout', function(e){
      if(!paletteOuverte()) return;
      var vers = e.relatedTarget;
      setTimeout(function(){
        var a = document.activeElement;
        if(!paletteOuverte() || (a && w.contains(a))) return;
        replierPalette(vers && vers.isConnected ? vers : (a && a !== document.body ? a : true));
      }, 0);
    });
    /* un résultat qui mène ailleurs SUR la même page (un hash) : shell.js
       ferme la liste mais ne replie pas le champ au-dessus de 520 px ; un
       exemple, lui, réécrit la requête et garde la liste ouverte */
    if(box) box.addEventListener('click', function(){
      if(!paletteOuverte()) return;
      setTimeout(function(){ if(paletteOuverte() && box.hidden) replierPalette(true); }, 0);
    });
  }
  function zoneDeRedaction(t){ return !!(t && (t.isContentEditable || t.tagName === 'TEXTAREA')); }
  document.addEventListener('keydown', function(e){
    if(e.defaultPrevented || e.isComposing || e.altKey || e.shiftKey) return;
    if(!(e.metaKey || e.ctrlKey) || (e.key || '').toLowerCase() !== 'k') return;
    if(zoneDeRedaction(e.target)) return;
    if(paletteOuverte()){ e.preventDefault(); replierPalette(true); return; }
    if(ouvrirPalette()) e.preventDefault();
  });

  /* LES ACTIONS de la palette — SHELL.recherche.actions, des fournisseurs
     appelés à chaque rendu (le contrat posé par shell.js). Le mode et le fond
     y sont déjà ; on ajoute ce qui sert À LA PAGE OÙ L'ON EST. Une action
     n'est proposée que si elle a un sens ici (pas « haut de page » en haut de
     la page, pas « le carnet » sur le carnet). */
  function copier(texte, dit){
    var p = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(texte) : Promise.reject();
    return p.then(function(){ dire(dit); return true; }, function(){
      /* l'API refuse (page sans le focus, contexte non sûr) : l'ancienne
         voie, par une zone de texte hors champ, puis le focus rendu */
      var ok = false, a = document.activeElement, t = document.createElement('textarea');
      t.value = texte; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(t); t.select();
      try { ok = document.execCommand('copy'); } catch(e){}
      t.remove(); if(a && a.focus) a.focus({ preventScroll: true });
      dire(ok ? dit : 'L’adresse est dans la barre du navigateur.'); return ok;
    });
  }
  var toastT = 0;
  function dire(m){
    annoncer(m);
    var t = document.querySelector('.lm-toast');
    if(!t){ t = document.createElement('div'); t.className = 'lm-toast'; t.setAttribute('aria-hidden', 'true'); document.body.appendChild(t); }
    t.textContent = m; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function(){ t.classList.remove('on'); }, 2600);
  }
  function vuSurPage(el){ return !!(el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'); }
  /* la section qu'on lit : la dernière dont le titre a passé le tiers haut */
  function sectionCourante(){
    var l = ancresPosees, best = null;
    for(var i = 0; i < l.length; i++){
      var r = l[i].h.getBoundingClientRect();
      if(r.top < innerHeight * 0.33) best = l[i]; else break;
    }
    return best;
  }
  /* le titre tel qu'on le lit : sans le numéro de section (aria-hidden) ni
     l'ancre « # » */
  function titreDe(h){
    var c = h.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('[aria-hidden="true"],.lm-ancre'), function(x){ x.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function adresse(id){ return location.origin + location.pathname + location.search + (id ? '#' + id : ''); }
  function allerAuContenu(){
    var c = document.getElementById('contenu') || document.querySelector('main');
    if(c){ if(!c.hasAttribute('tabindex')) c.setAttribute('tabindex', '-1'); c.focus({ preventScroll: true }); }
  }
  function enHaut(){
    scrollTo({ top: 0, behavior: reduit() ? 'instant' : 'smooth' });
    allerAuContenu();
  }
  /* la palette rend le focus à l'ouvreur APRÈS l'action : une action qui
     déplace elle-même le focus doit passer après ce rendu */
  function apres(fn){ setTimeout(fn, 30); }
  function actionsPage(){
    var out = [], ici = location.pathname.replace(/\.html$/, '');
    if(scrollY > innerHeight * 0.6)
      out.push({ t: 'Revenir en haut de la page', s: 'et y poser le focus', mots: 'haut debut remonter sommet top', act: function(){ apres(enHaut); } });
    var sc = sectionCourante();
    if(sc) out.push({ t: 'Copier l’adresse de la section', s: '« ' + titreDe(sc.h).slice(0, 60) + ' »', mots: 'copier lien adresse url partager section ancre', act: function(){ copier(adresse(sc.id), 'Adresse de la section copiée.'); } });
    out.push({ t: 'Copier l’adresse de cette page', s: location.pathname, mots: 'copier lien adresse url partager page', act: function(){ copier(adresse(''), 'Adresse de la page copiée.'); } });
    var tg = document.getElementById('sbToggle');
    if(vuSurPage(tg)){
      var etroit = matchMedia('(max-width:860px)').matches;
      var ouverte = etroit ? document.body.classList.contains('sb-open') : !document.documentElement.classList.contains('sb-rail');
      out.push({ t: ouverte ? (etroit ? 'Fermer le menu' : 'Replier la barre latérale') : (etroit ? 'Ouvrir le menu' : 'Déplier la barre latérale'), s: 'la navigation du site', mots: 'barre laterale menu navigation sidebar replier ouvrir masquer', act: function(){ apres(function(){ tg.click(); }); } });
    }
    if(!/\/oeuvres\/carnet\/?$/.test(ici))
      out.push({ t: 'Ouvrir mon carnet', s: 'vos passages et vos notes', mots: 'carnet notes passages surlignages', act: function(){ location.href = '/oeuvres/carnet'; } });
    return out;
  }
  /* le plein écran de lecture : en tête des actions dans un atelier ouvert
     sur le texte, c'est la plus utile de toutes */
  function actionsAtelier(){
    var b = document.getElementById('atlFullBtn');
    if(!vuSurPage(b) && !document.body.classList.contains('at-plein')) return [];
    var plein = document.body.classList.contains('at-plein');
    return [{ t: plein ? 'Quitter la lecture plein écran' : 'Lecture plein écran', s: plein ? 'rendre la coquille' : 'le texte seul, sans la coquille', mots: 'plein ecran lecture focus texte seul quitter', act: function(){ apres(function(){ var x = document.getElementById('atlFullBtn'); if(x) x.click(); }); } }];
  }
  var actionsPosees = false;
  function poserActions(){
    var s = SR(); if(!s || !s.actions || actionsPosees) return !!actionsPosees;
    actionsPosees = true;
    s.actions.unshift(actionsAtelier);
    s.actions.push(actionsPage);
    var inp = champ();
    if(inp){
      var k = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? 'Meta+K' : 'Control+K';
      var ks = (inp.getAttribute('aria-keyshortcuts') || '').split(/\s+/).filter(Boolean);
      if(ks.indexOf(k) < 0){ ks.push(k); inp.setAttribute('aria-keyshortcuts', ks.join(' ')); }
    }
    return true;
  }

  /* ---------- 4. LA FLÈCHE D'UN RENVOI AVANCE ----------
     Les renvois du site finissent par une flèche écrite dans le texte
     (« Lire dans le texte → ») : pour qu'elle avance seule au survol, elle
     est sortie dans un <span>, qui la cache aussi aux lecteurs d'écran (qui
     disaient « flèche droite » à chaque renvoi). Une seule fois, au
     chargement : un renvoi que la page réécrit plus tard garde sa flèche
     dans le texte, et rien ne casse. Pas les ateliers : leur marge et leur
     sommaire se réécrivent sans cesse. */
  function fleches(){
    if(document.body.classList.contains('at-atelier')) return;
    var liens = document.querySelectorAll('main a, .lm-foot a, main button');
    for(var i = 0; i < liens.length; i++){
      var a = liens[i];
      if(a.querySelector('.lm-fl,.btn-ar,svg') || a.closest('.tb-results,.nt-fig,.gl-alpha')) continue;
      var n = a.lastChild;
      while(n && n.nodeType === 3 && !n.nodeValue.trim()) n = n.previousSibling;
      if(!n || n.nodeType !== 3) continue;
      var m = n.nodeValue.match(/^([\s\S]*?)(\s*)(→|←)(\s*)$/);
      if(!m) continue;
      n.nodeValue = m[1] + m[2];
      var s = document.createElement('span');
      s.className = 'lm-fl' + (m[3] === '←' ? ' lm-fl-r' : ''); s.setAttribute('aria-hidden', 'true'); s.textContent = m[3];
      n.parentNode.insertBefore(s, n.nextSibling);
      a.classList.add('lm-fl-a');
    }
  }

  /* ---------- 5. LE CONFORT DE LECTURE ---------- */
  /* Les pages LONGUES de lecture : l'essai d'une notion, d'un chapitre, d'un
     commentaire, le carrefour de l'agrégation, « À propos », les mentions.
     Pas les ateliers (leur suivi de lecture et leur sommaire disent déjà où
     l'on est), pas l'abécédaire (sa tranche a son fil), pas l'accueil ni la
     page Karl Marx (leurs scènes ont leur propre course). */
  function pageDeLecture(){
    if(document.body.classList.contains('at-atelier')) return false;
    return !!document.querySelector('main .nt-essai, main .ap-corps, main .ml-corps');
  }
  function progression(){
    if(!pageDeLecture()) return null;
    var barre = document.createElement('div');
    barre.className = 'lm-prog'; barre.setAttribute('aria-hidden', 'true'); barre.innerHTML = '<i></i>';
    document.body.appendChild(barre);
    var trait = barre.firstChild, dernier = -1;
    return function(){
      var H = document.documentElement.scrollHeight, long = H > innerHeight * 2.5;
      barre.hidden = !long; if(!long) return;
      var p = Math.min(1, Math.max(0, scrollY / Math.max(1, H - innerHeight)));
      var v = p.toFixed(4); if(v === dernier) return; dernier = v;
      trait.style.transform = 'scaleX(' + v + ')';
    };
  }
  /* le retour en haut : après deux écrans ; le focus passe au contenu */
  function haut(){
    if(!document.getElementById('contenu') || document.body.classList.contains('at-atelier') || /\/oeuvres\/messages\/?$/.test(location.pathname.replace(/\.html$/, ''))) return null;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'lm-haut'; b.setAttribute('aria-label', 'Revenir en haut de la page');
    b.innerHTML = '<svg viewBox="0 0 16 18" aria-hidden="true"><path d="M8 16V3M3 7.5L8 2.5l5 5"/></svg>';
    b.addEventListener('click', enHaut);
    document.body.appendChild(b);
    var on = null;
    return function(){
      var v = scrollY > innerHeight * 2;
      if(v === on) return; on = v;
      b.classList.toggle('on', v);
      /* invisible, il ne doit pas être atteint au clavier */
      if(v) b.removeAttribute('tabindex'); else b.setAttribute('tabindex', '-1');
    };
  }
  /* l'ancre « # » : elle copie l'adresse de la section. Elle vise le titre
     d'une section qui a une adresse — l'id du titre, ou celui de la section
     dont il est le premier titre. */
  var ancresPosees = [];
  function ancres(){
    if(!pageDeLecture() && !document.querySelector('main .km-h')) return;
    var hs = document.querySelectorAll('main h2');
    for(var i = 0; i < hs.length; i++){
      var h = hs[i];
      if(h.closest('nav,aside,dialog,summary,[aria-hidden="true"],.nt-tete,.nt-bref,.nt-retenir,.nt-quiz') || h.querySelector('a,button')) continue;
      var id = '', sec = h.parentElement;
      if(sec && sec.id && sec.querySelector('h2') === h) id = sec.id;
      else if(h.id) id = h.id;
      if(!id) continue;
      var a = document.createElement('a');
      a.className = 'lm-ancre'; a.href = '#' + id; a.textContent = '#';
      a.setAttribute('aria-label', 'Copier le lien de cette section');
      (function(id, a){
        a.addEventListener('click', function(e){
          if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
          e.preventDefault();
          try { history.replaceState(history.state, '', '#' + id); } catch(er){}
          copier(adresse(id), 'Adresse de la section copiée.').then(function(ok){
            if(!ok) return;
            a.classList.remove('lm-copie'); void a.offsetWidth; a.classList.add('lm-copie');
            setTimeout(function(){ a.classList.remove('lm-copie'); }, 1400);
          });
        });
      })(id, a);
      h.appendChild(a);
      ancresPosees.push({ h: h, id: id });
    }
  }

  function init(){
    fleches();
    ancres();
    var maj = [progression(), haut()].filter(Boolean);
    /* les actions : shell.js peut s'installer après nous (installShell à la
       fin du <body>, ou plus tard sur certaines pages) */
    if(!poserActions()){
      var essais = 0, t = setInterval(function(){ if(poserActions() || ++essais > 40) clearInterval(t); }, 250);
    }
    if(!maj.length) return;
    var tic = false;
    function tout(){ tic = false; for(var i = 0; i < maj.length; i++) maj[i](); }
    /* au plus une fois par image — et un filet si rAF ne tourne pas (onglet
       masqué) : la position, elle, ne ment pas */
    addEventListener('scroll', function(){ if(!tic){ tic = true; requestAnimationFrame(tout); setTimeout(function(){ if(tic) tout(); }, 160); } }, { passive: true });
    addEventListener('resize', tout);
    addEventListener('load', tout);
    tout();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
