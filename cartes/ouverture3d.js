/* L'ouverture d'un booster en trois dimensions.
 *
 * Le bureau à la bougie : une table de travail, des feuillets, un encrier, des
 * livres, une bougie qui porte de vraies ombres, une fenêtre au fond. Devant,
 * le paquet, en vraie feuille métallisée : sa bande se déchire le long d'un bord
 * irrégulier et se soulève autour du point de déchirure, les cartes sont dedans.
 *
 * Le plan z = 0 est parallèle à l'écran : un rectangle de la page s'y
 * transpose au pixel près, ce qui permet de passer la main aux cartes HTML (la
 * pile) sans saut visible. La page garde le geste, l'accessibilité et le repli
 * sans WebGL ; ce module ne fait que dessiner. Chargé à la demande.
 */
(function () {
  'use strict';
  var prom = null, IM = {};
  function img(k, src) { return new Promise(function (ok, ko) { var i = new Image(); i.onload = function () { IM[k] = i; ok(); }; i.onerror = ko; i.src = src; }); }
  function webgl() { try { return !!document.createElement('canvas').getContext('webgl'); } catch (e) { return false; } }
  function pret() {
    if (prom) return prom;
    if (!webgl()) return (prom = Promise.reject(new Error('webgl')));
    prom = new Promise(function (ok, ko) {
      if (window.THREE) return ok();
      var s = document.createElement('script'); s.src = '/vendor/three.min.js'; s.onload = ok; s.onerror = ko; document.head.appendChild(s);
    }).then(function () {
      return Promise.all([
        img('dos', '/assets/img/cartes/dos.webp'), img('logo', '/assets/img/logo/icon-512.png'), img('ms', '/assets/img/archive/manuscrit-ideologie-1846.webp'),
        document.fonts ? Promise.all([document.fonts.load("900 120px Fraunces"), document.fonts.load("600 40px Inter"), document.fonts.load("italic 500 40px Fraunces")]) : null
      ]);
    });
    prom.catch(function () {});
    return prom;
  }

  function toile(w, h, fn) { var c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
  function tex(c, srgb) { var t = new THREE.CanvasTexture(c); if (srgb !== false) t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t; }
  function hasard(g) { return function () { g = (g * 16807) % 2147483647; return g / 2147483647; }; }
  function lisse(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function melange(a, b, t) { return a + (b - a) * t; }

  // ---------------------------------------------------------- les matières
  function bois() {
    var R = hasard(77);
    return toile(1024, 1024, function (g, w, h) {
      g.fillStyle = '#3a2413'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 900; i++) {
        var y = R() * h, l = 200 + R() * 800, x = R() * w - 200;
        g.strokeStyle = 'rgba(' + (R() < .5 ? '16,9,4' : '112,70,34') + ',' + (.05 + R() * .14) + ')'; g.lineWidth = .5 + R() * 2.2;
        g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + l * .3, y + R() * 10 - 5, x + l * .6, y + R() * 10 - 5, x + l, y); g.stroke();
      }
      // les planches
      g.strokeStyle = 'rgba(8,4,2,.75)'; g.lineWidth = 3;
      for (var k = 1; k < 4; k++) { g.beginPath(); g.moveTo(0, k * h / 4); g.lineTo(w, k * h / 4); g.stroke(); }
    });
  }
  function platre() {
    var R = hasard(31);
    return toile(512, 512, function (g, w, h) {
      g.fillStyle = '#2a2018'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 2600; i++) { g.fillStyle = 'rgba(' + (R() < .5 ? '0,0,0' : '120,96,70') + ',' + R() * .07 + ')'; g.fillRect(R() * w, R() * h, 1 + R() * 3, 1 + R() * 3); }
    });
  }
  function ciel() {
    var R = hasard(9);
    return toile(256, 256, function (g, w, h) {
      var d = g.createLinearGradient(0, 0, 0, h); d.addColorStop(0, '#fff'); d.addColorStop(.72, '#8a8a8a'); d.addColorStop(1, '#4a4a4a'); g.fillStyle = d; g.fillRect(0, 0, w, h);
      g.fillStyle = '#111';
      var x = 0; while (x < w) { var l = 18 + R() * 34, t = 40 + R() * 36; g.fillRect(x, h - t, l, t); x += l; }
    });
  }
  function flamme() {
    return toile(128, 256, function (g, w, h) {
      function blob(cy, rx, ry, st) { g.save(); g.translate(w / 2, cy); g.scale(rx / 64, ry / 64); var d = g.createRadialGradient(0, 0, 0, 0, 0, 64); st.forEach(function (s) { d.addColorStop(s[0], s[1]); }); g.fillStyle = d; g.beginPath(); g.arc(0, 0, 64, 0, 7); g.fill(); g.restore(); }
      g.globalCompositeOperation = 'lighter';
      blob(140, 42, 112, [[0, 'rgba(255,140,40,.8)'], [1, 'rgba(255,90,10,0)']]);
      blob(158, 28, 78, [[0, 'rgba(255,214,120,.95)'], [1, 'rgba(255,170,60,0)']]);
      blob(186, 15, 40, [[0, 'rgba(255,250,225,1)'], [1, 'rgba(255,230,170,0)']]);
      blob(226, 12, 16, [[0, 'rgba(90,130,255,.65)'], [1, 'rgba(60,90,255,0)']]);
    });
  }
  function halo(c1) {
    return toile(256, 256, function (g, w) { var d = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); d.addColorStop(0, c1); d.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = d; g.fillRect(0, 0, w, w); });
  }
  function plume() {
    var R = hasard(5);
    return toile(128, 512, function (g, w, h) {
      g.translate(w / 2, h); g.strokeStyle = '#e9dfc9'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(6, -h * .5, -6, -h); g.stroke();
      for (var i = 0; i < 150; i++) {
        var t = .18 + i / 150 * .8, y = -h * t, m = Math.sin((t - .18) / .82 * 3.1) * 50 + 6, s = i % 2 ? 1 : -1;
        g.strokeStyle = 'rgba(' + (200 + R() * 45 | 0) + ',' + (190 + R() * 45 | 0) + ',170,.7)'; g.lineWidth = 1.5;
        g.beginPath(); g.moveTo(s * 1, y); g.quadraticCurveTo(s * m * .7, y - 8, s * m, y - 24); g.stroke();
      }
    });
  }
  // la feuille du sachet : le même dessin que le paquet de la page
  function sachet() {
    return toile(1024, 1432, function (g, w, h) {
      var d = g.createLinearGradient(0, 0, w * .25, h); d.addColorStop(0, '#2a2018'); d.addColorStop(1, '#0c0907'); g.fillStyle = d; g.fillRect(0, 0, w, h);
      var r = g.createRadialGradient(w * .6, h * .3, 0, w * .6, h * .3, h * .46); r.addColorStop(0, '#5a1a11'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h);
      g.save(); g.globalCompositeOperation = 'screen'; g.drawImage(IM.logo, -30, 90, 1060, 1060); g.restore();
      var v = g.createLinearGradient(0, h * .5, 0, h * .86); v.addColorStop(0, 'rgba(10,7,5,0)'); v.addColorStop(1, 'rgba(10,7,5,.96)'); g.fillStyle = v; g.fillRect(0, h * .4, w, h * .6);
      // le filet rouge
      var f = g.createLinearGradient(0, 180, 0, h - 180); f.addColorStop(0, '#d5402f'); f.addColorStop(1, '#8e1b12'); g.fillStyle = f; g.fillRect(84, 186, 10, h - 372);
      // les sertissages
      [[0, 120], [h - 120, 120]].forEach(function (b) {
        g.fillStyle = '#2b221a'; g.fillRect(0, b[0], w, b[1]);
        for (var x = 0; x < w; x += 16) { g.fillStyle = x % 32 ? 'rgba(255,255,255,.17)' : 'rgba(0,0,0,.42)'; g.fillRect(x, b[0], 8, b[1]); }
      });
      // la pastille
      g.fillStyle = '#d5402f'; g.beginPath(); g.arc(w - 196, 276, 104, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '900 104px Fraunces, Georgia, serif'; g.fillText('5', w - 196, 298);
      g.font = '600 26px Inter, sans-serif'; g.fillText('C A R T E S', w - 196, 340);
      g.textAlign = 'left';
      g.fillStyle = '#e8735f'; g.font = '600 36px Inter, sans-serif'; g.fillText('B  O  O  S  T  E  R', 132, 960);
      g.fillStyle = '#f6ecd6'; g.font = '900 218px Fraunces, Georgia, serif'; g.fillText('Lire', 124, 1140); g.fillText('Marx', 124, 1300);
    });
  }
  function froisse() {
    var R = hasard(13);
    return toile(512, 716, function (g, w, h) {
      g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 90; i++) {
        var x = R() * w, y = R() * h, a = R() * 6.3, l = 40 + R() * 200;
        g.strokeStyle = 'rgba(' + (R() < .5 ? '255,255,255' : '0,0,0') + ',' + (.03 + R() * .08) + ')'; g.lineWidth = 3 + R() * 9;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + .6) * l * .5, y + Math.sin(a + .6) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
    });
  }

  // ---------------------------------------------------------- la scène
  function monter(canvas, tableEl) {
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    var scene = new THREE.Scene(), NUIT = new THREE.Color(0x0b0705); scene.background = NUIT.clone();
    var D = 12, FOV = 30, cam = new THREE.PerspectiveCamera(FOV, 1, .1, 60); cam.position.set(0, 1.5, D);
    var TABLE = -2.15, decor = new THREE.Group(); scene.add(decor);
    var aJeter = [];
    function geo(g) { aJeter.push(g); return g; }
    function mat(m) { aJeter.push(m); if (m.map) aJeter.push(m.map); return m; }
    function mesh(g, m, ombre) { var o = new THREE.Mesh(geo(g), mat(m)); if (ombre !== false) { o.castShadow = true; o.receiveShadow = true; } return o; }

    // la table et le mur
    var tb = tex(bois()); tb.wrapS = tb.wrapT = THREE.RepeatWrapping; tb.repeat.set(2.2, 1.6);
    var table = mesh(new THREE.PlaneGeometry(40, 24), new THREE.MeshStandardMaterial({ map: tb, roughness: .62, metalness: .04 }));
    table.rotation.x = -Math.PI / 2; table.position.set(0, TABLE, -4); table.castShadow = false; decor.add(table);
    var tm = tex(platre()); tm.wrapS = tm.wrapT = THREE.RepeatWrapping; tm.repeat.set(6, 3);
    var mur = mesh(new THREE.PlaneGeometry(50, 22), new THREE.MeshStandardMaterial({ map: tm, roughness: .95 }));
    mur.position.set(0, 6, -11); mur.castShadow = false; decor.add(mur);

    // tout ce qui est posé s'écarte du centre selon la largeur de l'écran
    var pose = new THREE.Group(); decor.add(pose);
    function feuille(x, z, rz, s) {
      var tx = new THREE.Texture(IM.ms); tx.encoding = THREE.sRGBEncoding; tx.needsUpdate = true; tx.anisotropy = 4;
      var o = mesh(new THREE.PlaneGeometry(1.9 * s, 2.7 * s), new THREE.MeshStandardMaterial({ map: tx, roughness: .9, color: 0xcfbf9f }));
      o.rotation.set(-Math.PI / 2, 0, rz); o.position.set(x, TABLE + .012 + Math.abs(x) * .002, z); o.castShadow = false; pose.add(o); return o;
    }
    var feuilles = [feuille(-2.9, -.9, .35, 1), feuille(-1.6, .9, -.24, 1), feuille(2.6, .3, .18, 1.04), feuille(3.5, -1.8, -.42, .94), feuille(.3, -4.4, .1, 1.1)];

    // la bougie
    var laiton = new THREE.MeshStandardMaterial({ color: 0x9a7b30, metalness: .85, roughness: .34 });
    aJeter.push(laiton);
    var bg = new THREE.Group();
    var coupe = mesh(new THREE.CylinderGeometry(.62, .7, .08, 40), laiton); coupe.position.y = .05; bg.add(coupe);
    var fut = mesh(new THREE.CylinderGeometry(.09, .13, .5, 24), laiton); fut.position.y = .32; bg.add(fut);
    var dou = mesh(new THREE.CylinderGeometry(.21, .16, .14, 24), laiton); dou.position.y = .62; bg.add(dou);
    var cire = mesh(new THREE.CylinderGeometry(.15, .16, 1.15, 24), new THREE.MeshStandardMaterial({ color: 0xe9ddc2, roughness: .55, emissive: 0x6a3a10, emissiveIntensity: .55 })); cire.position.y = 1.25; bg.add(cire);
    var meche = mesh(new THREE.CylinderGeometry(.012, .012, .12, 6), new THREE.MeshBasicMaterial({ color: 0x1a1008 }), false); meche.position.y = 1.87; bg.add(meche);
    var tf = tex(flamme()), fl = new THREE.Sprite(mat(new THREE.SpriteMaterial({ map: tf, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
    fl.scale.set(.42, .84, 1); fl.position.y = 2.2; bg.add(fl);
    var hl = new THREE.Sprite(mat(new THREE.SpriteMaterial({ map: tex(halo('rgba(255,170,90,.5)')), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
    hl.scale.set(4.4, 4.4, 1); hl.position.y = 2.1; bg.add(hl);
    pose.add(bg); bg.position.set(-3.7, TABLE, -3.2);

    // les livres, l'encrier, la plume
    function livre(w, h, d, c, y, r) {
      var g = new THREE.Group(), b = mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: c, roughness: .7 })); g.add(b);
      var p = mesh(new THREE.BoxGeometry(w * .96, h * .78, d * 1.012), new THREE.MeshStandardMaterial({ color: 0xcfc2a3, roughness: .9 })); p.position.x = .02; g.add(p);
      var mb = new THREE.MeshStandardMaterial({ color: c, roughness: .7 }); aJeter.push(mb);
      var dessus = mesh(new THREE.BoxGeometry(w, h * .12, d * 1.02), mb); dessus.position.y = h * .44; g.add(dessus);
      var dessous = mesh(new THREE.BoxGeometry(w, h * .12, d * 1.02), mb); dessous.position.y = -h * .44; g.add(dessous);
      var or = mesh(new THREE.BoxGeometry(w * 1.004, h * 1.02, .05), laiton); or.position.z = d * .28; g.add(or);
      g.position.y = y; g.rotation.y = r; return g;
    }
    var pile = new THREE.Group();
    pile.add(livre(2.5, .46, 1.75, 0x5d140f, .23, .08), livre(2.25, .4, 1.6, 0x1c2c38, .66, -.14), livre(1.95, .36, 1.42, 0x3b2a18, 1.04, .2));
    pile.position.set(3.7, TABLE, -3.4); pose.add(pile);
    var enc = new THREE.Group();
    var verre = new THREE.MeshStandardMaterial({ color: 0x0a0c10, metalness: .3, roughness: .08 }); aJeter.push(verre);
    var cor = mesh(new THREE.CylinderGeometry(.34, .4, .42, 8), verre); cor.position.y = .21; enc.add(cor);
    var col = mesh(new THREE.CylinderGeometry(.15, .19, .16, 20), verre); col.position.y = .5; enc.add(col);
    var bec = mesh(new THREE.TorusGeometry(.16, .03, 8, 24), laiton); bec.rotation.x = Math.PI / 2; bec.position.y = .59; enc.add(bec);
    var pl = new THREE.Mesh(geo(new THREE.PlaneGeometry(.62, 2.5)), mat(new THREE.MeshStandardMaterial({ map: tex(plume()), transparent: true, alphaTest: .25, side: THREE.DoubleSide, roughness: .8 })));
    pl.castShadow = true; pl.position.set(.32, 1.45, 0); pl.rotation.set(0, -.4, -.34); enc.add(pl);
    enc.position.set(2.3, TABLE, -1.9); pose.add(enc);

    // la fenêtre, au fond à droite : c'est par elle que vient le Grand Soir
    var fen = new THREE.Group(), sky = new THREE.MeshBasicMaterial({ map: tex(ciel()), color: 0x1c2a3e, toneMapped: false }); aJeter.push(sky, sky.map);
    var vitre = new THREE.Mesh(geo(new THREE.PlaneGeometry(3.6, 4.6)), sky); fen.add(vitre);
    var bm = new THREE.MeshStandardMaterial({ color: 0x20150c, roughness: .8 }); aJeter.push(bm);
    [[0, 2.36, 3.9, .14], [0, -2.36, 3.9, .14], [-1.86, 0, .14, 4.8], [1.86, 0, .14, 4.8], [0, 0, .09, 4.6], [0, .8, 3.6, .08], [0, -.8, 3.6, .08]].forEach(function (b) { var m = mesh(new THREE.BoxGeometry(b[2], b[3], .14), bm, false); m.position.set(b[0], b[1], .05); fen.add(m); });
    fen.position.set(6.2, 4.7, -10.9); decor.add(fen);

    // les lumières
    var amb = new THREE.HemisphereLight(0xc69a6a, 0x1a0e07, .16); scene.add(amb);
    var ptf = new THREE.PointLight(0xffa657, 3.4, 16, 1.8); bg.add(ptf); ptf.position.y = 2.4;
    var spot = new THREE.SpotLight(0xffb36b, 4.2, 22, 1.2, 1, 1.6); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -.002; spot.shadow.radius = 6;
    spot.position.set(-3.7, TABLE + 2.5, -3.2); spot.target.position.set(1.2, TABLE, -.4); pose.add(spot, spot.target);
    var face = new THREE.PointLight(0xffe2bd, 2.6, 26, 1.7); face.position.set(.5, 3.4, 9); scene.add(face);
    var soirL = new THREE.DirectionalLight(0xff3a1c, 0); soirL.position.set(6, 5, -9); scene.add(soirL);
    var mouth = new THREE.PointLight(0xffd690, 0, 6, 1.5); scene.add(mouth);

    // un reflet pour la feuille métallisée
    var envS = new THREE.Scene(); envS.background = new THREE.Color(0x120b06);
    [[0xffc27a, 1, 3, 4, 3], [0xff7a40, -5, 1, 2, 4], [0xfff0d0, 3, -4, 5, 2], [0x402018, 0, 0, -6, 8]].forEach(function (e) { var m = new THREE.Mesh(new THREE.BoxGeometry(e[4], e[4], e[4]), new THREE.MeshBasicMaterial({ color: e[0] })); m.position.set(e[1] * 2, e[2] * 2, e[3] * 2); envS.add(m); });
    var pm = new THREE.PMREMGenerator(renderer), env = pm.fromScene(envS, .04); pm.dispose();

    // ---------------------------------------------------------- le paquet
    var P = null, W = 1, H = 1, CW = 1, CH = 1, PX = 0, PY = 0, parPx = 1, cartes = null;
    var regard = { x: 0, y: 0, tx: 0, ty: 0 }, anims = [], morte = false, tPrec = 0, raf = 0, vitesse = 1;

    function anim(ms, fn, ease) {
      return new Promise(function (ok) { anims.push({ t: 0, d: ms / 1000, fn: fn, e: ease || function (x) { return x; }, ok: ok }); });
    }
    var EIN = function (x) { return x * x * x; }, EOUT = function (x) { return 1 - Math.pow(1 - x, 3); }, EIO = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
    function bord(x) { return .12 * Math.sin(x * 9.1) * .22 + .028 * Math.sin(x * 37.3 + 1) + .016 * Math.sin(x * 81 + 2) + .01 * Math.sin(x * 143); }
    function bombe(x, y) { var a = 1 - Math.pow(Math.abs(2 * x / W), 3), b = lisse(H / 2, H / 2 - .32, Math.abs(y)); return Math.max(0, a) * b * W * .055; }

    function aligner() {
      var r = tableEl().getBoundingClientRect(), vh = canvas.clientHeight, vw = canvas.clientWidth;
      if (!vh || !r.width) return;
      parPx = 2 * D * Math.tan(FOV * Math.PI / 360) / vh;
      CW = r.width * parPx; CH = r.height * parPx;
      PX = (r.left + r.width / 2 - vw / 2) * parPx; PY = cam.position.y - (r.top + r.height / 2 - vh / 2) * parPx;
      if (P && P.vivant) { P.g.position.x = PX; P.baseY = PY; }
      if (cartes) cartes.position.set(PX, PY, 0);
    }
    function taille() {
      var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
      // En portrait, les objets s'écartent moins et rapetissent : ils restent au
      // pied de l'image, sous les cartes, sans empiéter sur les boutons.
      var k = Math.min(1, cam.aspect / 1.45), m = melange(.5, 1, lisse(.5, 1.3, cam.aspect));
      pose.scale.set(k, 1, 1);
      pose.children.forEach(function (o) { if (o !== spot && o !== spot.target) o.scale.set(m / k, m, m); });
      var dm = Math.tan(FOV * Math.PI / 360) * (D + 10.9) * cam.aspect;
      fen.scale.setScalar(Math.min(1, dm / 6)); fen.position.x = Math.min(6.2, dm * .58);
      aligner();
    }

    function creerPaquet() {
      retirerPaquet();
      aligner();
      W = CW * 1.06; H = CH * 1.06;
      var yb = H / 2 - .34, g = new THREE.Group();
      var tArt = tex(sachet()), tBump = tex(froisse(), false);
      var mFace = new THREE.MeshStandardMaterial({ map: tArt, bumpMap: tBump, bumpScale: .0035, metalness: .42, roughness: .46, envMap: env.texture, envMapIntensity: .9 });
      var mArgent = new THREE.MeshStandardMaterial({ color: 0xd8d4c8, metalness: .95, roughness: .24, bumpMap: tBump, bumpScale: .02, envMap: env.texture, envMapIntensity: 1.5, side: THREE.DoubleSide });
      // le corps, dont le haut suit le bord déchiré
      var cols = 40, rows = 46, gb = new THREE.BufferGeometry(), pos = [], uv = [], idx = [], i, j;
      for (j = 0; j <= rows; j++) for (i = 0; i <= cols; i++) {
        var u = i / cols, x = -W / 2 + u * W, top = yb + bord(x), y = -H / 2 + (top + H / 2) * (j / rows);
        pos.push(x, y, j === rows ? bombe(x, y) * .3 : bombe(x, y)); uv.push(u, (y + H / 2) / H);
      }
      for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) { var a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
      gb.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gb.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gb.setIndex(idx); gb.computeVertexNormals();
      var corps = new THREE.Mesh(gb, mFace); corps.castShadow = true; g.add(corps);
      // le fond argenté, qu'on voit dans la bouche
      var fond = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mArgent); fond.position.z = -.09; g.add(fond);
      // la lumière des cartes dans la bouche
      var lueur = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.02, .9), new THREE.MeshBasicMaterial({ map: tex(toile(64, 64, function (c, w, h) { var d = c.createLinearGradient(0, h, 0, 0); d.addColorStop(0, 'rgba(255,214,140,0)'); d.addColorStop(.72, 'rgba(255,214,140,.9)'); d.addColorStop(1, 'rgba(255,240,205,.2)'); c.fillStyle = d; c.fillRect(0, 0, w, h); })), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, toneMapped: false }));
      lueur.position.set(0, yb - .08, -.04); g.add(lueur);
      // la bande : une seule géométrie, vue de face (l'imprimé) et de dos (l'argent)
      var cs = 72, rs = 3, gs = new THREE.BufferGeometry(), base = [], uvs = [], ids = [];
      for (j = 0; j <= rs; j++) for (i = 0; i <= cs; i++) {
        var us = i / cs, xs = -W / 2 + us * W, b0 = yb + bord(xs), ys = b0 + (H / 2 - b0) * (j / rs);
        base.push(xs, ys, 0); uvs.push(us, (ys + H / 2) / H);
      }
      for (j = 0; j < rs; j++) for (i = 0; i < cs; i++) { var a2 = j * (cs + 1) + i, b2 = a2 + 1, c2 = a2 + cs + 1, d2 = c2 + 1; ids.push(a2, b2, d2, a2, d2, c2); }
      gs.setAttribute('position', new THREE.Float32BufferAttribute(base.slice(), 3)); gs.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); gs.setIndex(ids); gs.computeVertexNormals();
      var mBande = mFace.clone(); mBande.side = THREE.FrontSide;
      var mDos = mArgent.clone(); mDos.side = THREE.BackSide;
      var bande = new THREE.Group(), b1 = new THREE.Mesh(gs, mBande), b3 = new THREE.Mesh(gs, mDos); b1.castShadow = true; bande.add(b1, b3); g.add(bande);
      g.position.set(PX, PY - 8, .02); g.rotation.set(.5, -.5, -.3); scene.add(g);
      P = { g: g, corps: corps, fond: fond, lueur: lueur, bande: bande, gs: gs, base: base, cs: cs, rs: rs, yb: yb, tear: 0, sens: 1, baseY: PY, vivant: true, entree: 0,
        mats: [mFace, mArgent, mBande, mDos], geos: [gb, gs, fond.geometry, lueur.geometry], texs: [tArt, tBump, lueur.material.map], extra: [lueur.material] };
      majBande();
      var p = P;
      anim(900, function (t) { p.entree = t; }, EOUT);
    }
    function majBande() {
      if (!P) return;
      var a = P.gs.attributes.position.array, b = P.base, p = P.tear, s = P.sens, xp = s > 0 ? -W / 2 + p * W : W / 2 - p * W, y0 = P.yb;
      for (var n = 0, i = 0; i < b.length; i += 3, n += 3) {
        var x = b[i], y = b[i + 1], z = bombe(x, y) * .22, dt = s > 0 ? xp - x : x - xp;
        if (p > 0 && dt > 0) {
          var k = Math.min(1, dt / (W * .62)), th = lisse(0, 1, k) * .95, c = Math.cos(th), si = Math.sin(th), rx = x - xp, ry = y - y0;
          // la bande pivote autour du front de déchirure et s'enroule vers nous
          var dir = s > 0 ? -1 : 1;
          x = xp + rx * c - dir * ry * si; y = y0 + dir * rx * si + ry * c;
          z += k * k * W * .3 + (y - y0) * .06;
        }
        a[n] = x; a[n + 1] = y; a[n + 2] = z;
      }
      P.gs.attributes.position.needsUpdate = true; P.gs.computeVertexNormals();
      var v = lisse(0, .4, p);
      P.lueur.material.opacity = v;
      P.lueur.scale.x = 1; mouth.intensity = v * 1.6;
    }
    function retirerPaquet() {
      if (!P) return;
      scene.remove(P.g); P.geos.forEach(function (g) { g.dispose(); }); P.mats.forEach(function (m) { m.dispose(); }); P.texs.forEach(function (t) { t.dispose(); }); P.extra.forEach(function (m) { m.dispose(); });
      mouth.intensity = 0; P = null;
    }

    // les cinq dos, dans le sachet : ils prendront la place de la pile HTML
    var DECAL = [[0, 0, 0], [.35, .5, 1.4], [-.6, 1, -1.8], [.8, 1.5, 2.4], [-.9, 2, -2.8]];
    function creerCartes(n) {
      retirerCartes();
      var t = new THREE.Texture(IM.dos); t.encoding = THREE.sRGBEncoding; t.needsUpdate = true; t.anisotropy = 8;
      var m = new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: .5, toneMapped: false }), g = new THREE.PlaneGeometry(CW, CH);
      cartes = new THREE.Group(); cartes.userData = { t: t, m: m, g: g };
      for (var i = n - 1; i >= 0; i--) { var o = new THREE.Mesh(g, m), d = DECAL[i] || DECAL[0]; o.position.set(d[0] * CW / 100, -d[1] * CH / 100, -i * .004 - .01); o.rotation.z = -d[2] * Math.PI / 180; cartes.add(o); }
      cartes.position.set(PX, PY, -.03); scene.add(cartes);
    }
    function retirerCartes() { if (!cartes) return; scene.remove(cartes); cartes.userData.t.dispose(); cartes.userData.m.dispose(); cartes.userData.g.dispose(); cartes = null; }

    function image(t) {
      if (morte) return;
      raf = requestAnimationFrame(image);
      var dt = Math.min((t - tPrec) / 1000, .05); tPrec = t;
      for (var i = anims.length - 1; i >= 0; i--) {
        var a = anims[i]; a.t += dt; var q = Math.min(1, a.t / a.d); a.fn(a.e(q));
        if (q >= 1) { anims.splice(i, 1); a.ok(); }
      }
      regard.x += (regard.tx - regard.x) * Math.min(1, dt * 7); regard.y += (regard.ty - regard.y) * Math.min(1, dt * 7);
      decor.position.x = -regard.x * .16; decor.position.y = regard.y * .08;
      if (P && P.vivant) {
        var e = P.entree, s = t / 1000;
        P.g.position.y = melange(P.baseY - 8, P.baseY, e) + Math.sin(s * 1.5) * .035 * e;
        P.g.rotation.x = melange(.5, -regard.y * .24, e) + Math.sin(s * 1.1) * .012;
        P.g.rotation.y = melange(-.5, regard.x * .36, e) + Math.sin(s * .8) * .016;
        P.g.rotation.z = melange(-.3, 0, e);
        mouth.position.set(P.g.position.x, P.g.position.y + P.yb, .8);
      }
      // la flamme vacille : des périodes qui ne se recoupent pas
      var f = .86 + .08 * Math.sin(t * .0071) + .05 * Math.sin(t * .0173 + 1) + .03 * Math.sin(t * .0391 + 2);
      ptf.intensity = 3.4 * f; spot.intensity = 4.2 * f; fl.scale.set(.42 * (.94 + f * .08), .84 * f, 1); fl.material.rotation = Math.sin(t * .0023) * .05; hl.material.opacity = f;
      renderer.render(scene, cam);
    }

    taille();
    addEventListener('resize', taille);
    tPrec = performance.now(); raf = requestAnimationFrame(image);

    return {
      paquet: creerPaquet,
      dechire: function (v, s) { if (!P) return; P.tear = v; P.sens = s || 1; majBande(); },
      regard: function (x, y) { regard.tx = x; regard.ty = y; },
      // la bande s'envole, le sachet tombe, les cartes restent en place
      ouvrir: async function (n) {
        creerCartes(n);
        var p = P, ban = p.bande, s = p.sens; p.tear = 1; majBande();
        var bx = ban.position.x, by = ban.position.y;
        anim(760, function (q) { ban.position.set(bx + s * q * 7, by + q * 6.6, q * 2.5); ban.rotation.set(q * 1.2, q * 1.5, s * q * -1.9); }, EIN);
        await anim(240, function () {});
        p.vivant = false;
        var yd = p.g.position.y, rx = p.g.rotation.x, ry = p.g.rotation.y;
        var c = cartes, y0 = PY;
        anim(720, function (q) { c.position.z = -.03 * (1 - q); c.position.y = y0 + Math.sin(q * Math.PI) * .13; }, EIO);
        await anim(760, function (q) { p.g.position.y = yd - q * 11; p.g.rotation.set(rx + q * .5, ry, q * .42); }, EIN);
        retirerPaquet();
      },
      cacherCartes: retirerCartes,
      // Le Grand Soir : l'aube rouge entre par la fenêtre
      soir: function (on) {
        var a0 = sky.color.clone(), a1 = new THREE.Color(on ? 0xff5a2a : 0x1c2a3e), l0 = soirL.intensity, b0 = scene.background.clone(), b1 = new THREE.Color(on ? 0x2a0a06 : 0x0b0705), h0 = amb.color.clone(), h1 = new THREE.Color(on ? 0xff6a40 : 0xc69a6a), i0 = amb.intensity;
        anim(on ? 1100 : 300, function (q) { sky.color.copy(a0).lerp(a1, q); soirL.intensity = melange(l0, on ? 1.4 : 0, q); scene.background.copy(b0).lerp(b1, q); amb.color.copy(h0).lerp(h1, q); amb.intensity = melange(i0, on ? .42 : .16, q); }, EIO);
      },
      taille: taille,
      demonter: function () {
        morte = true; cancelAnimationFrame(raf); removeEventListener('resize', taille);
        retirerPaquet(); retirerCartes(); env.dispose();
        aJeter.forEach(function (x) { if (x && x.dispose) x.dispose(); });
        feuilles.forEach(function (o) { if (o.material.map) o.material.map.dispose(); });
        renderer.dispose();
      }
    };
  }

  window.Ouverture3D = { pret: pret, monter: monter };
})();
