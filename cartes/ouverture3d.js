/* L'ouverture d'un booster en trois dimensions.
 *
 * Un fond sobre : un noir chaud, un halo discret derrière le paquet, rien
 * d'autre. Devant, le paquet, en vraie feuille métallisée : un trait de lumière
 * droit suit le doigt le long du sertissage, puis la bande se détache d'un bloc
 * et s'envole. Les cartes sont dedans.
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
        img('dos', '/assets/img/cartes/dos.webp?v=4b83d5d4'), img('logo', '/assets/img/logo/icon-512.png'), 
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
  function halo(c1) {
    return toile(256, 256, function (g, w) { var d = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); d.addColorStop(0, c1); d.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = d; g.fillRect(0, 0, w, w); });
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

    var scene = new THREE.Scene(), NUIT = new THREE.Color(0x0b0705); scene.background = NUIT.clone();
    var D = 12, FOV = 30, cam = new THREE.PerspectiveCamera(FOV, 1, .1, 60); cam.position.set(0, 1.5, D);
    var decor = new THREE.Group(); scene.add(decor);
    var aJeter = [];
    function geo(g) { aJeter.push(g); return g; }
    function mat(m) { aJeter.push(m); if (m.map) aJeter.push(m.map); return m; }
    function mesh(g, m, ombre) { var o = new THREE.Mesh(geo(g), mat(m)); if (ombre !== false) { o.castShadow = true; o.receiveShadow = true; } return o; }

    // le halo derrière le paquet
    var hl = new THREE.Sprite(mat(new THREE.SpriteMaterial({ map: tex(halo('rgba(150,84,36,.5)')), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
    hl.scale.set(9, 9, 1); hl.position.set(0, 1.5, -2); hl.renderOrder = -10; hl.material.transparent = false; scene.add(hl);
    var HC = new THREE.Color(0xffffff), HR = new THREE.Color(0xff5030);

    // les lumières : celles qui font vivre la feuille du sachet
    var amb = new THREE.HemisphereLight(0xc69a6a, 0x1a0e07, .34); scene.add(amb);
    var cle = new THREE.PointLight(0xffe2bd, 2.6, 26, 1.7); cle.position.set(.5, 3.4, 9); scene.add(cle);
    var cote = new THREE.PointLight(0xff9a50, 2, 16, 1.6); cote.position.set(-5, .5, 3.5); scene.add(cote);
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
      aligner();
    }

    function creerPaquet() {
      retirerPaquet();
      aligner();
      W = CW * 1.06; H = CH * 1.06;
      var yb = H / 2 - H * .0838, g = new THREE.Group();
      var tArt = tex(sachet()), tBump = tex(froisse(), false);
      var mFace = new THREE.MeshStandardMaterial({ map: tArt, bumpMap: tBump, bumpScale: .0035, metalness: .42, roughness: .46, envMap: env.texture, envMapIntensity: .9 });
      var mArgent = new THREE.MeshStandardMaterial({ color: 0xd8d4c8, metalness: .95, roughness: .24, bumpMap: tBump, bumpScale: .02, envMap: env.texture, envMapIntensity: 1.5, side: THREE.DoubleSide });
      // le corps, dont le haut suit le bord déchiré
      var cols = 40, rows = 46, gb = new THREE.BufferGeometry(), pos = [], uv = [], idx = [], i, j;
      for (j = 0; j <= rows; j++) for (i = 0; i <= cols; i++) {
        var u = i / cols, x = -W / 2 + u * W, top = yb + 0, y = -H / 2 + (top + H / 2) * (j / rows);
        pos.push(x, y, j === rows ? bombe(x, y) * .3 : bombe(x, y)); uv.push(u, (y + H / 2) / H);
      }
      for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) { var a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
      gb.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gb.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gb.setIndex(idx); gb.computeVertexNormals();
      var corps = new THREE.Mesh(gb, mFace); corps.castShadow = true; g.add(corps);
      // le fond argenté, qu'on voit dans la bouche
      var fond = new THREE.Mesh(new THREE.PlaneGeometry(W, H), mArgent); fond.position.z = -.09; g.add(fond);
      // la lumière qui sort par la coupe
      var lueur = new THREE.Mesh(new THREE.PlaneGeometry(1, .34), new THREE.MeshBasicMaterial({ map: tex(toile(8, 64, function (c, w, h) { var d = c.createLinearGradient(0, 0, 0, h); d.addColorStop(0, 'rgba(255,222,160,0)'); d.addColorStop(.5, 'rgba(255,214,150,.6)'); d.addColorStop(1, 'rgba(255,222,160,0)'); c.fillStyle = d; c.fillRect(0, 0, w, h); })), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, toneMapped: false }));
      lueur.position.set(0, yb, .05); g.add(lueur);
      // le trait, net, au ras de la coupe
      var trait = new THREE.Mesh(new THREE.PlaneGeometry(1, .026), new THREE.MeshBasicMaterial({ color: 0xfff6e0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      trait.position.set(0, yb, .06); g.add(trait);
      // la bande : une seule géométrie, vue de face (l'imprimé) et de dos (l'argent)
      var cs = 72, rs = 2, gs = new THREE.BufferGeometry(), base = [], uvs = [], ids = [];
      for (j = 0; j <= rs; j++) for (i = 0; i <= cs; i++) {
        var us = i / cs, xs = -W / 2 + us * W, b0 = yb + 0, ys = b0 + (H / 2 - b0) * (j / rs);
        base.push(xs, ys, 0); uvs.push(us, (ys + H / 2) / H);
      }
      for (j = 0; j < rs; j++) for (i = 0; i < cs; i++) { var a2 = j * (cs + 1) + i, b2 = a2 + 1, c2 = a2 + cs + 1, d2 = c2 + 1; ids.push(a2, b2, d2, a2, d2, c2); }
      gs.setAttribute('position', new THREE.Float32BufferAttribute(base.slice(), 3)); gs.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); gs.setIndex(ids); gs.computeVertexNormals();
      var mBande = mFace.clone(); mBande.side = THREE.FrontSide;
      var mDos = mArgent.clone(); mDos.side = THREE.BackSide;
      var bande = new THREE.Group(), b1 = new THREE.Mesh(gs, mBande), b3 = new THREE.Mesh(gs, mDos); b1.castShadow = true; bande.add(b1, b3); g.add(bande);
      g.position.set(PX, PY - 8, .02); g.rotation.set(.5, -.5, -.3); scene.add(g);
      P = { g: g, corps: corps, fond: fond, lueur: lueur, trait: trait, bande: bande, gs: gs, base: base, cs: cs, rs: rs, yb: yb, tear: 0, sens: 1, baseY: PY, vivant: true, entree: 0,
        mats: [mFace, mArgent, mBande, mDos], geos: [gb, gs, fond.geometry, lueur.geometry, trait.geometry], texs: [tArt, tBump, lueur.material.map], extra: [lueur.material, trait.material] };
      majBande();
      var p = P;
      anim(900, function (t) { p.entree = t; }, EOUT);
    }
    // La coupe est droite. La bande reste en place et se soulève à peine là où
    // elle est déjà coupée : ce mince jour laisse passer la lumière.
    function majBande() {
      if (!P) return;
      var a = P.gs.attributes.position.array, b = P.base, p = P.tear, s = P.sens, xp = s > 0 ? -W / 2 + p * W : W / 2 - p * W;
      for (var i = 0; i < b.length; i += 3) {
        var x = b[i], y = b[i + 1], z = bombe(x, y) * .22, dt = s > 0 ? xp - x : x - xp;
        if (p > 0 && dt > 0) { var k = lisse(0, W * .22, dt); y += k * .05; z += k * .025; }
        a[i] = x; a[i + 1] = y; a[i + 2] = z;
      }
      P.gs.attributes.position.needsUpdate = true; P.gs.computeVertexNormals();
      var l = Math.max(.0001, p * W), cx = s > 0 ? -W / 2 + l / 2 : W / 2 - l / 2, v = lisse(0, .06, p);
      P.trait.scale.x = l; P.trait.position.x = cx; P.trait.material.opacity = v;
      P.lueur.scale.x = l; P.lueur.position.x = cx; P.lueur.material.opacity = v * .85;
      mouth.intensity = v * 1.5;
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
      // Les cartes sont dessinées AVANT le sachet et n'écrivent pas leur profondeur :
      // le sachet, qui penche et pivote, passe toujours devant elles au lieu de les
      // couper en biais là où les deux plans se croisent.
      var m = new THREE.MeshBasicMaterial({ map: t, alphaTest: .5, depthWrite: false, toneMapped: false }), g = new THREE.PlaneGeometry(CW, CH);
      cartes = new THREE.Group(); cartes.userData = { t: t, m: m, g: g };
      for (var i = n - 1; i >= 0; i--) { var o = new THREE.Mesh(g, m), d = DECAL[i] || DECAL[0]; o.renderOrder = -1 - i; o.position.set(d[0] * CW / 100, -d[1] * CH / 100, -i * .004 - .01); o.rotation.z = -d[2] * Math.PI / 180; cartes.add(o); }
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
      if (P && P.vivant) {
        var e = P.entree, s = t / 1000;
        P.g.position.y = melange(P.baseY - 8, P.baseY, e) + Math.sin(s * 1.5) * .035 * e;
        P.g.rotation.x = melange(.5, -regard.y * .24, e) + Math.sin(s * 1.1) * .012;
        P.g.rotation.y = melange(-.5, regard.x * .36, e) + Math.sin(s * .8) * .016;
        P.g.rotation.z = melange(-.3, 0, e);
        mouth.position.set(P.g.position.x, P.g.position.y + P.yb, .8);
      }
      hl.material.opacity = .86 + .1 * Math.sin(t * .0012);
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
        P.fond.visible = false;   // la paroi du fond passerait devant les cartes
        var p = P, ban = p.bande, s = p.sens; p.tear = 1; majBande();
        // la lumière s'élargit, la bande se détache d'un bloc, puis elle tombe
        anim(320, function (q) { p.lueur.scale.y = 1 + q * 1.1; p.lueur.material.opacity = .85 - q * .25; mouth.intensity = 1.5 + q * 1.5; }, EOUT);
        await anim(200, function (q) { ban.position.y = q * .26; ban.rotation.z = -s * q * .05; }, EOUT);
        anim(520, function (q) { ban.position.set(s * q * 8, .26 + q * 2.6, q * .4); ban.rotation.z = -s * (.05 + q * .75); ban.rotation.x = q * .5; }, EIN);
        await anim(120, function () {});
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
        var b0 = scene.background.clone(), b1 = new THREE.Color(on ? 0x220806 : 0x0b0705), i0 = amb.intensity, h0 = hl.material.color.clone(), h1 = on ? HR : HC;
        anim(on ? 1100 : 300, function (q) { scene.background.copy(b0).lerp(b1, q); amb.intensity = melange(i0, on ? .5 : .34, q); hl.material.color.copy(h0).lerp(h1, q); }, EIO);
      },
      taille: taille,
      demonter: function () {
        morte = true; cancelAnimationFrame(raf); removeEventListener('resize', taille);
        retirerPaquet(); retirerCartes(); env.dispose();
        aJeter.forEach(function (x) { if (x && x.dispose) x.dispose(); });
        renderer.dispose();
      }
    };
  }

  window.Ouverture3D = { pret: pret, monter: monter };
})();
