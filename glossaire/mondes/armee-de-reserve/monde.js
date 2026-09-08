/* LE MONDE DE L'ARMÉE DE RÉSERVE — l'appareil : la colonne, la cuve,
   l'aiguille.

   Le vocabulaire hydraulique est celui de Marx lui-même : réservoir, canaux
   de décharge, forme flottante, attirer et repousser, engagée et dégagée,
   tendre et détendre. La figure le prend au mot, et c'est ce qui l'autorise :
   le capital traite bien la population ouvrière comme une masse qu'il engage
   et dégage à son gré.

   Une COLONNE de verre — l'armée active — et une CUVE large — la réserve —
   tiennent le même liquide. Une POMPE, l'accumulation, prend dans la cuve et
   verse dans la colonne. Tant que la composition ne change pas, la colonne
   monte et la cuve baisse. Puis le TROP-PLEIN s'ouvre au haut de la colonne :
   la pompe a beau battre plus fort, tout le surplus repart à la cuve — la
   demande de travail croît en masse et décroît en proportion. Un FLOTTEUR
   suit le niveau de la réserve, un FLÉAU renverse son mouvement, et
   l'AIGUILLE du prix du travail descend d'autant que la réserve monte.

   La figure devait rendre l'inversion MÉCANIQUE et non magique : c'est le
   fléau qui la fait, à la vue de tous, et la liaison est rigide.

   L'ORDRE DE GAUCHE À DROITE N'EST PAS INDIFFÉRENT. Sur une page « plein »,
   le voile du texte est opaque jusqu'à 43 % de la largeur et ne s'efface
   qu'au-delà de 75 % : ce qui est petit et décisif doit vivre À DROITE. La
   première version posait le cadran à gauche, où il disparaissait sous le
   voile — c'est-à-dire que la démonstration se jouait dans le noir. Le
   cadran est donc au bout, la cuve au milieu, la colonne à gauche : ce qui
   est grand supporte d'être assombri, ce qui est fin ne le supporte pas.

   Tout est fonction de g — donc réversible. Seuls le battement du piston et
   le vacillement de la lampe sont temporels, et l'amplitude du piston est
   commandée par g. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x0a0806, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 3.6, 9.5);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 733; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── matières ── */
  var laiton = std({ color: 0xa8842f, metalness: 0.86, roughness: 0.30 });
  var laitonMat = std({ color: 0x8b6d2c, metalness: 0.7, roughness: 0.48 });
  var verre = std({ color: 0xcfe0e6, metalness: 0, roughness: 0.06, transparent: true, opacity: 0.11, side: THREE.DoubleSide, depthWrite: false });
  /* le liquide est SOMBRE et mat : c'est le contraste avec le verre et le
     laiton qui rend le niveau lisible d'un coup d'œil */
  var eau = std({ color: 0x0c1520, metalness: 0.02, roughness: 0.50 });
  var eauCoule = std({ color: 0x24404e, metalness: 0.1, roughness: 0.3, transparent: true, opacity: 0.85 });

  /* ── le mur, la planche, la tablette ── */
  var platre = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#6a5c4c'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 4200; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '30,22,14' : '148,136,114') + ',' + (rnd() * 0.10) + ')'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 4, 2 + rnd() * 3); }
  });
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), std({ map: platre, roughness: 0.97, color: 0x6f6252 }));
  mur.position.set(0.1, 1.5, -0.72); mur.receiveShadow = true; scene.add(mur);

  var boisTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#3d2c1c'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 260; i++) { g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '22,14,8' : '92,70,44') + ',' + (0.06 + rnd() * 0.16) + ')'; g.lineWidth = 1 + rnd() * 3; g.beginPath(); var y = rnd() * h; g.moveTo(0, y); for (var x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.03 + i) * 5); g.stroke(); }
  });
  var planche = new THREE.Mesh(new THREE.BoxGeometry(2.10, 1.88, 0.05), std({ map: boisTex, roughness: 0.88, color: 0x6d5a44 }));
  planche.position.set(0.20, 0.94, -0.46); planche.receiveShadow = true; planche.castShadow = true; scene.add(planche);

  var tablette = new THREE.Mesh(new THREE.BoxGeometry(2.10, 0.20, 0.28), std({ map: boisTex, roughness: 0.86, color: 0x5e4d3a }));
  tablette.position.set(0.20, 0.00, -0.30); tablette.receiveShadow = true; tablette.castShadow = true; scene.add(tablette);

  /* ── les cartouches : la scène doit DIRE ce qu'elle est ── */
  function cartouche(x, w, mots) {
    var t = tex(512, 128, function (g, cw, ch) {
      g.fillStyle = '#9a7c33'; g.fillRect(0, 0, cw, ch);
      var lg = g.createLinearGradient(0, 0, 0, ch);
      lg.addColorStop(0, 'rgba(255,236,180,.42)'); lg.addColorStop(0.42, 'rgba(255,255,255,0)');
      lg.addColorStop(0.62, 'rgba(0,0,0,.20)'); lg.addColorStop(1, 'rgba(255,230,170,.24)');
      g.fillStyle = lg; g.fillRect(0, 0, cw, ch);
      g.fillStyle = '#2a1c06'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.letterSpacing = '6px';
      /* LE TEXTE DOIT TENIR DANS SA TEXTURE : à 62 px, « ARMÉE ACTIVE »
         débordait de quarante pixels et se lisait « RMÉE ACTIV ». */
      var taille = 66;
      do { g.font = '600 ' + (taille--) + 'px Georgia, serif'; } while (taille > 20 && g.measureText(mots).width > cw - 46);
      g.fillText(mots, cw / 2, ch / 2 + 3);
    });
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.115, 0.012), std({ map: t, metalness: 0.55, roughness: 0.42 }));
    m.position.set(x, 0.005, -0.155); m.castShadow = true; scene.add(m); return m;
  }

  /* ── LA COLONNE : l'armée active ─────────────────────────────────────
     Base intérieure 0,13 ; hauteur utile 0,95 ; le trop-plein perce à 0,98,
     soit 89,5 % — au-delà, la pompe ne fait plus monter le niveau. */
  var CX = -0.42, CZ = -0.30, CB = 0.13, CH = 0.95, CAP = (0.98 - CB) / CH;
  var colVerre = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 1.02, 26, 1, true), verre);
  colVerre.position.set(CX, 0.61, CZ); scene.add(colVerre);
  var colRim = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 8, 24), laiton);
  colRim.rotation.x = Math.PI / 2; colRim.position.set(CX, 1.12, CZ); colRim.castShadow = true; scene.add(colRim);
  var colPied = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.155, 0.09, 24), laitonMat);
  colPied.position.set(CX, 0.145, CZ); colPied.castShadow = true; scene.add(colPied);
  var colEau = new THREE.Mesh(new THREE.CylinderGeometry(0.100, 0.100, 1, 24), eau);
  colEau.position.set(CX, CB, CZ); scene.add(colEau);
  cartouche(CX, 0.52, 'ARMÉE ACTIVE');

  /* ── LA CUVE : la réserve ── */
  var TX = 0.34, TB = 0.13, TH = 0.52;
  var cuve = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.58, 0.24), verre);
  cuve.position.set(TX, 0.39, CZ); scene.add(cuve);
  var cuveCadre = new THREE.Group();
  [-0.39, 0.39].forEach(function (dx) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.60, 0.26), laitonMat); m.position.x = dx; m.castShadow = true; cuveCadre.add(m);
  });
  [0.29, -0.29].forEach(function (dy) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.024, 0.26), laitonMat); m.position.y = dy; m.castShadow = true; cuveCadre.add(m);
  });
  cuveCadre.position.set(TX, 0.39, CZ); scene.add(cuveCadre);
  var cuveEau = new THREE.Mesh(new THREE.BoxGeometry(0.74, 1, 0.20), eau);
  cuveEau.position.set(TX, TB, CZ); scene.add(cuveEau);
  cartouche(TX, 0.46, 'LA RÉSERVE');

  /* ── LA POMPE : l'accumulation ── */
  var PX = -0.10;
  var pompe = new THREE.Mesh(new THREE.CylinderGeometry(0.090, 0.090, 0.56, 20), laitonMat);
  pompe.position.set(PX, 0.54, -0.26); pompe.castShadow = true; scene.add(pompe);
  var pompeCol = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.055, 20), laiton);
  pompeCol.position.set(PX, 0.82, -0.26); pompeCol.castShadow = true; scene.add(pompeCol);
  var piston = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.24, 12), laiton);
  piston.position.set(PX, 0.98, -0.26); piston.castShadow = true; scene.add(piston);
  var traverse = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.030, 0.06), laiton);
  traverse.position.set(PX, 1.09, -0.26); traverse.castShadow = true; scene.add(traverse);

  /* ── la tuyauterie ──────────────────────────────────────────────────
     ELLE SE RANGE EN PROFONDEUR : à la même distance, les tubes se lisaient
     comme un enchevêtrement. Le refoulement passe DERRIÈRE, le trop-plein
     DEVANT, et chacun se suit du regard. */
  function tube(x1, y1, x2, y2, z, r) {
    var dx = x2 - x1, dy = y2 - y1, l = Math.sqrt(dx * dx + dy * dy);
    var m = new THREE.Mesh(new THREE.CylinderGeometry(r || 0.022, r || 0.022, l, 12), laitonMat);
    m.position.set((x1 + x2) / 2, (y1 + y2) / 2, z);
    m.rotation.z = Math.atan2(-dx, dy); m.castShadow = true; scene.add(m); return m;
  }
  tube(PX, 0.26, PX, 0.17, -0.38);            /* l'aspiration descend, derrière */
  tube(PX, 0.17, 0.20, 0.17, -0.38);          /* … et va prendre dans la cuve */
  tube(PX, 0.82, PX, 1.24, -0.42);            /* le refoulement monte */
  tube(PX, 1.24, CX, 1.24, -0.42);            /* … traverse */
  tube(CX, 1.24, CX, 1.06, -0.42);            /* … et verse dans la colonne */
  tube(CX + 0.09, 0.98, -0.24, 0.98, -0.12, 0.026);   /* le trop-plein, devant */
  tube(-0.24, 0.98, -0.24, 0.72, -0.12, 0.026);
  tube(-0.24, 0.72, 0.06, 0.72, -0.12, 0.026);
  var chute = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.024, 1, 10), eauCoule);
  chute.position.set(0.06, 0.7, -0.12); scene.add(chute);

  /* ── LE FLÉAU : l'inversion, faite mécaniquement ──────────────────────
     Le flotteur pend au bras GAUCHE, l'aiguille au bras DROIT : quand la
     réserve monte, le bras gauche monte, le droit descend, et le prix avec. */
  var PIV = V3(0.53, 1.52, -0.40), ARM = 0.28;
  var poteau = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.26, 0.055), std({ color: 0x4b3c2a, roughness: 0.85 }));
  poteau.position.set(PIV.x, 1.40, PIV.z); poteau.castShadow = true; scene.add(poteau);
  var fleau = new THREE.Group(); fleau.position.copy(PIV); scene.add(fleau);
  var fleauBras = new THREE.Mesh(new THREE.BoxGeometry(2 * ARM, 0.034, 0.034), laiton);
  fleauBras.castShadow = true; fleau.add(fleauBras);
  var pivotM = new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 12), laiton);
  pivotM.position.copy(PIV); pivotM.castShadow = true; scene.add(pivotM);

  function tringle() {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1, 10), laiton);
    m.castShadow = true; scene.add(m); return m;
  }
  var UP = V3(0, 1, 0);
  function poser(m, a, b) {
    var d = new THREE.Vector3().subVectors(b, a), l = d.length();
    m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(1, l, 1);
    m.quaternion.setFromUnitVectors(UP, d.normalize());
  }
  var tringleFlot = tringle(), tringleAig = tringle();

  /* ── LE FLOTTEUR ── */
  var FX = 0.25, ROD = 1.08;
  var flotteur = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.05, 20), std({ color: 0x9a5f2c, metalness: 0.3, roughness: 0.55 }));
  flotteur.position.set(FX, 0.20, CZ); flotteur.castShadow = true; scene.add(flotteur);

  /* ── LE CADRAN : PRIX DU TRAVAIL, au bout du bras droit ── */
  var GX = 0.95, GY0 = 0.51, GY1 = 1.03, AX = 0.81;
  var cadranTex = tex(256, 640, function (g, w, h) {
    g.fillStyle = '#cbb68d'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 900; i++) { g.fillStyle = 'rgba(108,86,52,' + (rnd() * 0.07) + ')'; g.fillRect(rnd() * w, rnd() * h, 2, 2); }
    g.strokeStyle = '#3a2a14'; g.fillStyle = '#3a2a14';
    for (var k = 0; k <= 10; k++) {
      var y = 34 + (h - 68) * k / 10, gros = k % 5 === 0;
      g.lineWidth = gros ? 5 : 2; g.beginPath(); g.moveTo(12, y); g.lineTo(gros ? 62 : 40, y); g.stroke();
    }
    g.save(); g.translate(w - 40, h / 2); g.rotate(-Math.PI / 2);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '600 40px Georgia, serif'; g.letterSpacing = '5px';
    g.fillText('PRIX DU TRAVAIL', 0, 0); g.restore();
  });
  var cadran = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.62, 0.03), std({ map: cadranTex, roughness: 0.82 }));
  cadran.position.set(GX, 0.72, -0.40); cadran.castShadow = true; cadran.receiveShadow = true; scene.add(cadran);
  var aiguille = new THREE.Group();
  var aigCorps = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.032, 0.026), laiton);
  aigCorps.position.x = 0.052; aigCorps.castShadow = true; aiguille.add(aigCorps);
  var aigPointe = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.10, 4), laiton);
  aigPointe.rotation.z = -Math.PI / 2; aigPointe.position.x = 0.155; aigPointe.castShadow = true; aiguille.add(aigPointe);
  aiguille.position.set(AX, 0.9, -0.33); scene.add(aiguille);

  /* ── LE FILET DU DEHORS : l'accroissement naturel de la population ──
     Sa MINCEUR, comparée au trop-plein, est la réponse à Malthus. */
  var FIX = 0.62;
  var filet = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.009, 0.62, 8), eauCoule.clone());
  filet.position.set(FIX, 0.98, -0.22); scene.add(filet);
  var goulot = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.24, 12), laitonMat);
  goulot.rotation.z = 0.62; goulot.castShadow = true;
  goulot.position.set(FIX + 0.070, 1.12, -0.22); scene.add(goulot);

  /* ── la lumière ── */
  scene.add(new THREE.AmbientLight(0x3a3026, 0.55));
  var lampe = new THREE.PointLight(0xffc286, 3.2, 8, 1.7); lampe.position.set(-0.95, 2.45, 1.75);
  lampe.castShadow = true; lampe.shadow.bias = -0.0012; lampe.shadow.mapSize.set(1024, 1024); scene.add(lampe);
  var ampoule = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffd79a }));
  ampoule.position.copy(lampe.position); scene.add(ampoule);
  var appoint = new THREE.PointLight(0xb69a78, 0.95, 7, 2); appoint.position.set(1.85, 1.05, 1.5); scene.add(appoint);

  /* ── chorégraphie ─────────────────────────────────────────────────── */
  var G = 0, T = 0;
  var st = { act: 0.55, res: 0.14, pompe: 0, deverse: 0, dehors: 0, aig: 0 };
  function set(g) { G = g; }
  function compute() {
    var s1 = ss(0.7, 1.9, G);    /* la pompe démarre */
    var s2 = ss(1.9, 3.0, G);    /* le trop-plein s'ouvre */
    var s3 = ss(3.0, 4.0, G);    /* la réserve monte, l'aiguille descend */
    var s4 = ss(4.0, 4.9, G);    /* le cycle */
    var s5 = ss(5.0, 5.9, G);    /* le filet du dehors */
    var s5b = ss(4.95, 5.3, G);  /* la pompe reprend AVANT lui : le dernier temps
                                    compare deux arrivées, il faut les deux */
    /* LE CYCLE S'ÉTEINT AVEC SA SECTION : laissé courir, il faisait encore
       osciller la cuve sous le dernier temps, où rien d'autre ne doit bouger. */
    var bat = s4 * (1 - ss(4.9, 5.35, G)) * Math.sin((G - 4.0) * Math.PI * 3);

    var a = lerp(0.55, 0.89, s1);
    a = lerp(a, 0.92, s2);      /* la pompe pousse plus fort : la colonne bute au trop-plein */
    a = lerp(a, 0.74, s3);      /* la machine repousse : la colonne redescend */
    a += 0.13 * bat;
    a = lerp(a, 1.00, s5b);
    /* le trop-plein coule de ce que la pompe délivre EN PLUS de ce que la
       colonne peut tenir — donc du niveau non plafonné, pas du niveau vu */
    st.deverse = cl((a - CAP) / 0.03) * Math.max(s2, s5b);
    st.act = cl(Math.min(a, lerp(1, CAP, s2)));

    var r = lerp(0.14, 0.06, s1);
    r = lerp(r, 0.46, s2);
    r = lerp(r, 0.80, s3);
    r = lerp(r, 0.86, s4);
    r -= 0.10 * bat;
    r += 0.05 * s5;
    st.res = cl(r);

    st.pompe = 0.10 + 1.5 * s1 + 0.7 * s3 + s4 * (0.8 + 0.8 * Math.max(0, bat)) + 0.9 * s5b;
    st.dehors = s5;
  }

  function frame(dt) {
    T += dt; compute();

    var hc = Math.max(0.006, st.act * CH);
    colEau.scale.y = hc; colEau.position.y = CB + hc / 2;
    var ht = Math.max(0.006, st.res * TH);
    cuveEau.scale.y = ht; cuveEau.position.y = TB + ht / 2;

    /* le piston bat : temporel, mais son amplitude vient de g */
    var course = 0.055 * cl(st.pompe / 2.2);
    var bob = Math.sin(T * (1.4 + 2.6 * cl(st.pompe / 3))) * course;
    piston.position.y = 0.98 + bob; traverse.position.y = 1.09 + bob;

    var surf = TB + ht;
    var lc = Math.max(0.02, 0.72 - surf);
    chute.visible = st.deverse > 0.04;
    chute.scale.y = lc; chute.position.y = surf + lc / 2;
    chute.material.opacity = 0.30 + 0.55 * st.deverse;
    var lf = Math.max(0.02, 1.02 - surf);
    filet.visible = st.dehors > 0.04; filet.scale.y = lf; filet.position.y = surf + lf / 2;
    /* le bec ne GLISSE pas : décalé pendant son arrivée, il paraissait
       détaché de son filet, et deux objets voisins mal joints se lisent
       comme une erreur plutôt que comme un mouvement. */
    goulot.visible = st.dehors > 0.02;

    /* LE FLÉAU : la liaison est rigide, et c'est le point */
    flotteur.position.y = surf + 0.025;
    var gaucheY = surf + 0.05 + ROD;
    var th = Math.asin(cl(((PIV.y - gaucheY) / ARM + 1) / 2) * 2 - 1);
    fleau.rotation.z = th;
    var pg = V3(PIV.x - ARM * Math.cos(th), PIV.y - ARM * Math.sin(th), PIV.z);
    var pd = V3(PIV.x + ARM * Math.cos(th), PIV.y + ARM * Math.sin(th), PIV.z);
    poser(tringleFlot, V3(FX, surf + 0.05, CZ), V3(pg.x, pg.y, CZ));
    var ay = pd.y - 0.75;
    aiguille.position.y = Math.max(GY0 - 0.06, Math.min(GY1 + 0.06, ay));
    /* la tringle tombe À CÔTÉ du cadran : en travers de sa face, elle en
       barrait la graduation ; derrière la planche, elle disparaissait — et
       c'est justement la liaison rigide qui fait la démonstration. */
    poser(tringleAig, V3(pd.x, pd.y, -0.33), V3(AX, aiguille.position.y, -0.33));
    st.aig = (aiguille.position.y - GY0) / (GY1 - GY0);

    lampe.intensity = 3.2 * (1 + 0.03 * Math.sin(T * 7.3) + 0.02 * Math.sin(T * 3.1));

    /* LE CADRAGE — la règle de la maison, appliquée en calculant.
       À 38° en paysage, la largeur vue vaut environ 1,06 × la distance ; la
       colonne de texte prend 43 % à gauche, l'appareil doit tenir dans les
       57 % restants. Il s'étend de −0,68 à +1,08, soit 1,76 : à 3,50 la
       largeur vue fait 3,70, et le décalage de visée (plafonné à 0,70) le
       pose entre 45 % et 93 % du cadre — le cadran, qui porte la
       démonstration, tombant au-delà de 85 %, où le voile est levé. */
    var q = ss(0, 1, Math.min(1, G / 2.2));
    var dz = lerp(3.72, 3.50, q);
    var camA = V3(0.20, lerp(0.92, 0.86, q), -0.34);
    camera.position.set(0.20 + 0.014 * Math.sin(T * 0.24), lerp(1.14, 1.04, q) + 0.010 * Math.sin(T * 0.31), camA.z + dz);
    var dist = camera.position.distanceTo(camA);
    var fwd = new THREE.Vector3().subVectors(camA, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, V3(0, 1, 0)).normalize();
    aim.copy(camA).addScaledVector(right, -Math.min(0.21 * dist, 0.70));
    camera.lookAt(aim);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w / h > 1.2 ? 38 : Math.min(70, 2 * Math.atan(Math.tan(50 * Math.PI / 360) / camera.aspect) * 180 / Math.PI);
    camera.updateProjectionMatrix();
  }
  function dispose() {
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    renderer.dispose();
  }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, camera: camera };
};
