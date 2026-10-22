/* LE MONDE DES BESOINS — la fenêtre qui se resserre, le rebord qui se charge.

   Le fragment dit deux mouvements et affirme qu'ils n'en font qu'un : d'un
   côté on invente des jouissances, de l'autre on abaisse le seuil de ce qui
   compte comme besoin — la lumière, l'air, la propreté la plus élémentaire
   cessent d'en être. La scène montre donc LES DEUX EN MÊME TEMPS, dans une
   seule image : le rebord d'une fenêtre se charge d'objets pendant que
   l'ouverture se referme et que le jour baisse.

   ET LE DERNIER TEMPS NE VIDE PAS LE REBORD. Ce serait le contresens que
   l'essai écarte : Marx ne prêche pas la frugalité, c'est l'économie
   politique qui prêche le renoncement. La fenêtre se rouvre, et les mêmes
   objets, espacés et éclairés, deviennent distincts — ce qui sépare un
   besoin d'un autre n'est pas son objet, c'est son rapport.

   La fenêtre est UN VRAI TROU (quatre panneaux mobiles autour de
   l'ouverture) : la leçon de la force de travail. Tout est fonction de g. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x090705, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, 0.05, 40);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 37; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── la pièce : un plâtre sale, un plancher ── */
  var platreTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#8a7e6c'; g.fillRect(0, 0, w, h);
    /* des taches larges et douces (le plâtre sale), puis un grain fin */
    /* LA TEXTURE SE RACCORDE SUR SES BORDS : le plâtre est désormais
       continu d'un panneau à l'autre (voir pan()), donc le bord de la
       texture tombe au milieu du mur — tout motif est dessiné aussi à ses
       copies décalées d'une largeur et d'une hauteur. */
    function tuile(f) { for (var ox = -1; ox <= 1; ox++) for (var oy = -1; oy <= 1; oy++) f(ox * w, oy * h); }
    for (var i = 0; i < 60; i++) { (function (bx, by, br, dk) {
      tuile(function (ox, oy) { var bg = g.createRadialGradient(bx + ox, by + oy, 0, bx + ox, by + oy, br);
        bg.addColorStop(0, dk ? 'rgba(40,30,20,.10)' : 'rgba(170,158,136,.08)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = bg; g.fillRect(bx + ox - br, by + oy - br, br * 2, br * 2); });
    })(rnd() * w, rnd() * h, 30 + rnd() * 90, rnd() < 0.6); }
    for (i = 0; i < 14000; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '30,22,14' : '160,148,126') + ',' + (rnd() * 0.07) + ')'; g.fillRect(rnd() * w, rnd() * h, 1, 1); }
    for (i = 0; i < 9; i++) { var pts = [], x = rnd() * w, y = rnd() * h; pts.push([x, y]);
      for (var k = 0; k < 7; k++) { x += (rnd() - 0.5) * 70; y += 30 + rnd() * 40; pts.push([x, y]); }
      g.strokeStyle = 'rgba(24,16,8,.07)'; g.lineWidth = 1;
      tuile(function (ox, oy) { g.beginPath(); g.moveTo(pts[0][0] + ox, pts[0][1] + oy); for (var m = 1; m < pts.length; m++) g.lineTo(pts[m][0] + ox, pts[m][1] + oy); g.stroke(); }); }
  });
  platreTex.wrapS = platreTex.wrapT = THREE.RepeatWrapping;
  /* la texture porte la couleur du plâtre : le matériau n'en est qu'une
     teinte claire (octobre 2026 : le mur était un aplat presque noir) */
  var mur = std({ map: platreTex, roughness: 0.97, color: 0xc4bcae });
  var WZ = -1.65, OW = 1.30, OH = 1.62, OY = 1.28;   /* l'ouverture au repos */

  /* LES QUATRE PANNEAUX : ils bougent, et c'est eux qui referment le jour */
  /* chaque panneau a SA copie de la texture, recalée sur sa position à
     chaque image : le plâtre est continu d'un panneau à l'autre, on voit
     un mur et non quatre plaques (le défaut ne se voyait pas tant que la
     pièce était noire) */
  function pan(w0, h0) {
    var m = mur.clone(); m.map = platreTex.clone(); m.map.needsUpdate = true;
    m.map.repeat.set(w0 / 4, h0 / 4.4);
    var p = new THREE.Mesh(new THREE.BoxGeometry(w0, h0, 0.16), m); p.userData.w0 = w0; p.userData.h0 = h0; return p;
  }
  function cale(p) {
    var ww = p.userData.w0 * p.scale.x;
    p.material.map.repeat.set(ww / 4, p.userData.h0 / 4.4);
    p.material.map.offset.set((p.position.x - ww / 2) / 4, (p.position.y - p.userData.h0 / 2) / 4.4);
  }
  var panG = pan(4, 4.4), panD = pan(4, 4.4), panH = pan(3, 2.2), panB = pan(3, 2.2);
  [panG, panD, panH, panB].forEach(function (p) { p.receiveShadow = true; p.castShadow = true; scene.add(p); });

  var sol = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), std({ map: platreTex, roughness: 1, color: 0x8c7660 }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);
  var murL = new THREE.Mesh(new THREE.PlaneGeometry(5, 4.4), mur);
  murL.rotation.y = Math.PI / 2; murL.position.set(-1.65, 2.2, 0.6); murL.receiveShadow = true; scene.add(murL);

  /* le rebord */
  var rebord = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.09, 0.34), std({ color: 0x3a2e20, roughness: 0.86 }));
  rebord.position.set(0.55, OY - OH / 2 - 0.04, WZ + 0.16); rebord.castShadow = rebord.receiveShadow = true; scene.add(rebord);

  /* ── LE JOUR : un plan derrière l'ouverture ── */
  /* UN VRAI DEHORS (octobre 2026) : un ciel, des toits, des cheminées —
     le Londres des arrière-cours que la page nomme. Peint au canevas et
     tenu sous le blanc (le plus clair est à 0xdcd9cb) ; le matériau n'est
     pas soumis au tone mapping, c'est son multiplicateur qui fait le jour. */
  var cielTex = tex(1024, 1024, function (g, w, h) {
    var gr = g.createLinearGradient(0, 0, 0, h * 0.62);
    gr.addColorStop(0, '#7f9ab4'); gr.addColorStop(0.55, '#b4c2cc'); gr.addColorStop(1, '#dcd9cb');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 26; i++) {           /* nuages bas, pâles */
      var cx = rnd() * w, cy = h * (0.18 + rnd() * 0.36), r = 30 + rnd() * 80;
      g.save(); g.translate(cx, cy); g.scale(1, 0.4);
      var rg = g.createRadialGradient(0, 0, 0, 0, 0, r);
      rg.addColorStop(0, 'rgba(226,224,214,.40)'); rg.addColorStop(1, 'rgba(226,224,214,0)');
      g.fillStyle = rg; g.fillRect(-r, -r, r * 2, r * 2); g.restore();
    }
    /* la ligne des toits : deux plans, le plus lointain plus clair */
    function toits(base, amp, col, seed) {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, h);
      var x = 0;
      while (x < w) {
        var lw = 40 + rnd() * 90, y = base - rnd() * amp;
        g.lineTo(x, y);
        if (rnd() < 0.7) { var cxm = x + lw * (0.2 + rnd() * 0.5), ch = 18 + rnd() * 40, cw = 8 + rnd() * 12;
          g.lineTo(cxm, y); g.lineTo(cxm, y - ch); g.lineTo(cxm + cw, y - ch); g.lineTo(cxm + cw, y); }
        if (rnd() < 0.5) { g.lineTo(x + lw * 0.5, y - 14 - rnd() * 18); }
        g.lineTo(x + lw, y); x += lw;
      }
      g.lineTo(w, h); g.closePath(); g.fill();
    }
    toits(h * 0.585, h * 0.04, '#8b8a86', 1);
    toits(h * 0.625, h * 0.05, '#5d5249', 2);
    /* fenêtres éclairées des façades voisines, quelques-unes */
    for (i = 0; i < 40; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.3 ? '190,170,120' : '70,62,56') + ',.8)'; g.fillRect(rnd() * w, h * (0.66 + rnd() * 0.3), 7, 11); }
    /* une fumée qui monte des cheminées */
    for (i = 0; i < 14; i++) { var sx = rnd() * w, sy = h * 0.55; for (var k = 0; k < 6; k++) { var sr = 12 + k * 9;
      var sg = g.createRadialGradient(sx + k * 10, sy - k * 22, 0, sx + k * 10, sy - k * 22, sr);
      sg.addColorStop(0, 'rgba(150,146,140,.16)'); sg.addColorStop(1, 'rgba(150,146,140,0)');
      g.fillStyle = sg; g.fillRect(sx + k * 10 - sr, sy - k * 22 - sr, sr * 2, sr * 2); } }
  });
  var jourMat = new THREE.MeshBasicMaterial({ map: cielTex, color: 0xffffff, fog: false, toneMapped: false });
  var jour = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), jourMat);
  jour.position.set(0.55, OY, WZ - 0.6); scene.add(jour);

  /* le châssis : un dormant et une croisée de bois sombre, qui suivent
     l'ouverture. Contre le ciel ils se lisent en silhouette, et c'est ce
     qui dit « fenêtre » plutôt que « trou dans le mur ». */
  var boisMat = std({ color: 0x1c140c, roughness: 0.8 });
  var chassis = [];
  for (var cb = 0; cb < 6; cb++) { var bar = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), boisMat); bar.castShadow = true; scene.add(bar); chassis.push(bar); }

  /* ── LES OBJETS DU REBORD : ils s'entassent, puis s'espacent ── */
  var objets = [];
  function petit(kind, col) {
    var g;
    if (kind === 0) g = new THREE.CylinderGeometry(0.045, 0.06, 0.20, 12);
    else if (kind === 1) g = new THREE.BoxGeometry(0.13, 0.10, 0.09);
    else if (kind === 2) g = new THREE.SphereGeometry(0.062, 12, 10);
    else if (kind === 3) g = new THREE.CylinderGeometry(0.075, 0.075, 0.018, 18);
    else g = new THREE.ConeGeometry(0.06, 0.17, 10);
    var m = new THREE.Mesh(g, std({ color: col, roughness: 0.34, metalness: 0.35 }));
    m.castShadow = m.receiveShadow = true; m.visible = false; scene.add(m); return m;
  }
  var COULS = [0xc9a86a, 0xa8b6c4, 0xb98f8f, 0xc8c0a4, 0x9aa88f, 0xc4a4c0, 0xb0a070];
  for (var i = 0; i < 7; i++) objets.push(petit(i % 5, COULS[i]));

  /* ── la lumière : elle vient de l'ouverture, et d'elle seule ── */
  var amb = new THREE.AmbientLight(0x4a4238, 0.4); scene.add(amb);
  /* LE JOUR RENVOYÉ : la lumière qui entre par la fenêtre éclaire la pièce
     et revient sur le mur de la fenêtre — sans elle ce mur, à contre-jour,
     était un vide noir. Elle suit le jour : elle baisse quand la fenêtre se
     referme, si bien que la pièce s'assombrit avec elle (l'argument). */
  var renvoi = new THREE.PointLight(0xe9e4da, 1.0, 5.2, 1); renvoi.position.set(0.45, 1.5, 0.9); scene.add(renvoi);
  var hemi = new THREE.HemisphereLight(0xcdd5dc, 0x6a5440, 0.5); scene.add(hemi);
  /* un appoint très faible, chaud, qui ne vient de nulle part : sans lui
     la pièce refermée tombe au noir absolu et l'image ne dit plus rien —
     or ce qu'on doit voir, c'est le rebord qui se charge PENDANT que le
     jour baisse, donc les deux à la fois */
  var veilleuse = new THREE.PointLight(0xffb877, 0.9, 4.2, 1.7); veilleuse.position.set(-0.35, 1.5, 0.9); scene.add(veilleuse);
  var dehors = new THREE.DirectionalLight(0xdfe8f2, 2.5);
  dehors.position.set(0.9, 3.2, WZ - 3.4); dehors.target.position.set(0.4, 0.9, 0.4);
  dehors.castShadow = true; dehors.shadow.mapSize.set(2048, 2048);
  dehors.shadow.camera.left = -3; dehors.shadow.camera.right = 3;
  dehors.shadow.camera.top = 3.4; dehors.shadow.camera.bottom = -1;
  dehors.shadow.camera.near = 0.5; dehors.shadow.camera.far = 12; dehors.shadow.bias = -0.0011;
  scene.add(dehors); scene.add(dehors.target);

  /* ── chorégraphie ── */
  var G = 0, T = 0;
  var st = { charge: 0, ferme: 0, nuit: 0, rouvre: 0, espace: 0, recul: 0 };
  function set(g) { G = g; }
  function compute() {
    st.charge = ss(1.05, 3.6, G);     /* le rebord se charge */
    st.ferme  = ss(2.4, 4.35, G);     /* l'ouverture se referme */
    st.nuit   = ss(2.6, 4.35, G);
    st.rouvre = ss(4.55, 5.4, G);     /* elle se rouvre */
    st.espace = ss(4.85, 5.75, G);    /* les objets s'espacent et se distinguent */
    st.recul  = ss(5.0, 5.8, G);
  }

  function frame(dt) {
    T += dt; compute();

    /* l'ouverture : les quatre panneaux se resserrent, puis se rouvrent —
       et elle se rouvre PLUS GRANDE qu'au départ */
    var f = st.ferme * (1 - st.rouvre);
    var w = lerp(OW, 0.30, f) * lerp(1, 1.22, st.rouvre);
    var h = lerp(OH, 0.52, f) * lerp(1, 1.16, st.rouvre);
    panG.position.set(0.55 - w / 2 - 2, OY, WZ);
    panD.position.set(0.55 + w / 2 + 2, OY, WZ);
    /* haut et bas ont JUSTE la largeur de l'ouverture, un rien en retrait :
       sinon, là où ils recouvraient les panneaux latéraux, les faces
       coplanaires se disputaient le pixel et le mur se couvrait de damiers */
    panH.position.set(0.55, OY + h / 2 + 1.1, WZ - 0.002);
    panB.position.set(0.55, OY - h / 2 - 1.1, WZ - 0.002);
    panH.scale.x = panB.scale.x = (w + 0.01) / 3;   /* juste la largeur de l'ouverture */
    cale(panG); cale(panD); cale(panH); cale(panB);

    /* le jour : il baisse et se refroidit, puis revient plus clair */
    var n = st.nuit * (1 - st.rouvre), r = st.rouvre;
    var k = lerp(lerp(1, 0.17, n), 1.32, r) * 0.75;   /* le ciel ne passe jamais au blanc */
    jourMat.color.setRGB(0.875 * k, lerp(lerp(0.91, 0.72, n), 0.94, r) * k, lerp(lerp(0.95, 0.62, n), 0.98, r) * k);
    dehors.intensity = lerp(lerp(2.5, 0.55, n), 3.4, r);
    amb.intensity = lerp(lerp(0.40, 0.15, n), 0.46, r);
    renvoi.intensity = lerp(lerp(1.05, 0.13, n), 1.30, r);
    hemi.intensity = lerp(lerp(0.34, 0.07, n), 0.42, r);
    /* le châssis : dormant sur les quatre bords, croisée au milieu */
    var e = 0.045, zc = WZ + 0.02;
    chassis[0].position.set(0.55 - w / 2 + e / 2, OY, zc); chassis[0].scale.set(e, h, 0.07);
    chassis[1].position.set(0.55 + w / 2 - e / 2, OY, zc); chassis[1].scale.set(e, h, 0.07);
    chassis[2].position.set(0.55, OY + h / 2 - e / 2, zc); chassis[2].scale.set(w, e, 0.07);
    chassis[3].position.set(0.55, OY - h / 2 + e / 2, zc); chassis[3].scale.set(w, e, 0.07);
    chassis[4].position.set(0.55, OY, zc); chassis[4].scale.set(e * 0.7, h, 0.05);
    chassis[5].position.set(0.55, OY + h * 0.12, zc); chassis[5].scale.set(w, e * 0.7, 0.05);
    veilleuse.intensity = 0.35 + 0.95 * n * (1 - r);

    /* le rebord : ils arrivent l'un après l'autre, serrés ; puis ils
       s'espacent et chacun redevient distinct */
    objets.forEach(function (m, j) {
      var a = cl(st.charge * objets.length - j);
      m.visible = a > 0.03;
      var serre = 0.55 - 0.26 + j * 0.088;                 /* entassés */
      var large = 0.55 - 0.78 + j * 0.26;                  /* espacés */
      var x = lerp(serre, large, st.espace);
      m.position.set(x, OY - OH / 2 + 0.10 + (j % 2) * 0.012, WZ + 0.17 + ((j % 3) - 1) * 0.045 * (1 - st.espace));
      m.scale.setScalar(0.35 + 0.65 * a);
      m.rotation.y = j * 0.9 + T * 0.05 * st.espace;
      m.material.roughness = lerp(0.34, 0.20, st.espace);
    });

    /* la caméra : on est DEDANS, et l'on recule un peu à la fin */
    var q = ss(0, 1, Math.min(1, G / 2.2));
    /* octobre 2026 : la caméra s'approche du rebord. Elle descend vers
       les objets pendant qu'ils s'entassent (le sujet n'est plus un rebord
       minuscule au bas d'un grand mur), puis recule juste assez pour voir
       la fenêtre rouverte en entier. */
    var cx = lerp(-0.22, -0.40, q), cy = lerp(1.30, 1.12, q), cz = lerp(0.75, 0.55, q);
    cz = lerp(cz, 1.15, st.recul); cy = lerp(cy, 1.22, st.recul);
    var camA = V3(lerp(0.55, 0.50, q), lerp(1.24, 0.98, q), WZ);
    camA.y = lerp(camA.y, 1.20, st.recul);
    camera.position.set(cx + 0.012 * Math.sin(T * 0.25), cy + 0.009 * Math.sin(T * 0.33), cz);
    /* la scène est une figure en bas de page (octobre 2026) : la fenêtre
       est visée au centre du cadre. La visée décalée de l'architecture
       « plein », qui laissait la gauche à la colonne de texte, est retirée. */
    aim.copy(camA);
    camera.lookAt(aim);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() {
    var w2 = canvas.clientWidth, h2 = canvas.clientHeight; if (!w2 || !h2) return;
    renderer.setSize(w2, h2, false); camera.aspect = w2 / h2;
    camera.fov = w2 / h2 > 1.2 ? 40 : Math.min(72, 2 * Math.atan(Math.tan(52 * Math.PI / 360) / camera.aspect) * 180 / Math.PI);
    camera.updateProjectionMatrix();
  }
  function dispose() {
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    renderer.dispose();
  }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, camera: camera };
};
