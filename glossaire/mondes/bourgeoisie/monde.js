/* LE MONDE DE LA BOURGEOISIE — ce qui était solide et stable.

   La figure est prise au Manifeste, partie I : « Tout ce qui était solide et
   stable est ébranlé, tout ce qui était sacré est profané », puis le magicien
   « qui ne sait plus dominer les puissances infernales qu’il a évoquées ».

     g 0-1  une enceinte de pierre, fermée : l'ordre qui se conservait ;
     g 1-2  des marchandises y paraissent (la classe naît dans le sein de
            l'ordre féodal) ;
     g 2-3  les murs se défont en poussière qui monte ;
     g 3-4  les marchandises rayonnent en anneaux (le marché mondial) ;
     g 4-5  elles refluent et s'entassent en un monceau qui s'écroule, et la
            moitié est détruite sous une lueur rouge (la surproduction) ;
     g 5-6  ce qui reste recommence à rayonner.

   Deux InstancedMesh (les pierres, les marchandises) et un nuage de points.
   Tout est fonction de g, donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined' || !THREE.InstancedMesh) return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; }
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x0b0806, 1);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b0806, 10, 26);
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 160);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 23; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function bump(a, b, v) { var t = (v - a) / (b - a); return t <= 0 || t >= 1 ? 0 : Math.sin(Math.PI * t); }

  var murTex = tex(512, 512, function (g, w, h) {
    var gr = g.createRadialGradient(w * 0.5, h * 0.6, 10, w * 0.5, h * 0.6, w * 0.64);
    gr.addColorStop(0, '#43301e'); gr.addColorStop(0.5, '#1d140c'); gr.addColorStop(1, '#0b0806');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var fond = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshBasicMaterial({ map: murTex, fog: false }));
  fond.position.set(0, 5, -16); scene.add(fond);
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x030202, roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);

  var grainTex = tex(128, 128, function (g, w, h) {
    g.fillStyle = '#d8d2c8'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 700; i++) { var v = 150 + rnd() * 90 | 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + (v - 6) + ',' + (0.2 + rnd() * 0.3) + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  });

  var dummy = new THREE.Object3D();

  /* ── l'enceinte : quatre murs de trois assises ── */
  var MUR = [], PB = 0.5, HB = 0.42, EB = 0.36, HALF = 1.5;
  for (var cote = 0; cote < 4; cote++) for (var a = 0; a < 3; a++) for (var b = 0; b < 6; b++) {
    var off = -HALF + PB / 2 + b * PB + (a % 2 ? PB / 2 : 0) * (b < 5 ? 1 : 0);
    var x, z, ry;
    if (cote === 0) { x = off; z = -HALF; ry = 0; }
    else if (cote === 1) { x = HALF; z = off; ry = Math.PI / 2; }
    else if (cote === 2) { x = -off; z = HALF; ry = 0; }
    else { x = -HALF; z = -off; ry = Math.PI / 2; }
    MUR.push({ x: x, y: HB / 2 + a * HB, z: z, ry: ry, d: rnd() * 0.55, j: (rnd() - 0.5) * 0.04 });
  }
  var murs = new THREE.InstancedMesh(new THREE.BoxGeometry(PB - 0.02, HB - 0.02, EB), new THREE.MeshStandardMaterial({ map: grainTex, color: new THREE.Color(0.12, 0.108, 0.09), roughness: 0.95 }), MUR.length);
  murs.castShadow = true; murs.receiveShadow = true; scene.add(murs);

  /* la poussière qui monte des murs */
  var NP = MUR.length * 5, pPos = new Float32Array(NP * 3), pBase = [];
  for (var i = 0; i < NP; i++) { var m = MUR[i % MUR.length]; pBase.push([m.x + (rnd() - 0.5) * 0.5, m.y + (rnd() - 0.5) * 0.3, m.z + (rnd() - 0.5) * 0.5, 0.6 + rnd() * 1.4, (rnd() - 0.5) * 0.8, m.d]); }
  var pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  var dotTex = tex(32, 32, function (g) { var gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(230,210,180,1)'); gr.addColorStop(1, 'rgba(230,210,180,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); });
  var poussiere = new THREE.Points(pGeo, new THREE.PointsMaterial({ map: dotTex, size: 0.13, transparent: true, opacity: 0, depthWrite: false, color: 0x8a7458 }));
  scene.add(poussiere);

  /* ── les marchandises ── */
  var NM = 420, M = [];
  var PAL = [[0.20, 0.12, 0.05], [0.16, 0.06, 0.035], [0.13, 0.11, 0.07], [0.22, 0.16, 0.07], [0.11, 0.075, 0.05]];
  for (i = 0; i < NM; i++) {
    var s = 0.11 + rnd() * 0.05;
    /* A — dans l'enceinte, en piles serrées (les soixante premières) */
    var gi = i % 60, ax = -0.95 + (gi % 6) * 0.38, az = -0.95 + (Math.floor(gi / 6) % 6) * 0.38, ay = s / 2 + Math.floor(gi / 36) * 0.16;
    /* B — les anneaux du marché */
    var ring = Math.floor(i / 70), ang = rnd() * Math.PI * 2, r = 1.9 + ring * 0.95 + rnd() * 0.7;
    /* C — le monceau : un tas conique */
    var lay = 0, k = i, cap = 49; while (k >= cap && cap > 1) { k -= cap; lay++; cap = Math.max(1, (7 - Math.floor(lay / 3)) * (7 - Math.floor(lay / 3))); }
    var side = Math.max(1, 7 - Math.floor(lay / 3)), cx = (k % side - (side - 1) / 2) * 0.14, cz = (Math.floor(k / side) % side - (side - 1) / 2) * 0.14;
    /* D — détruites : projetées et englouties sous le sol */
    var da = Math.atan2(cz, cx) + (rnd() - 0.5), dr = 2.5 + rnd() * 3.5;
    /* E — ce qui reste, rayonnant de nouveau, plus serré */
    var ea = rnd() * Math.PI * 2, er = 1.2 + (i / 200) * 3.2 + rnd() * 0.5;
    M.push({ s: s, A: [ax + (rnd() - 0.5) * 0.06, ay, az + (rnd() - 0.5) * 0.06], B: [Math.cos(ang) * r, s / 2, Math.sin(ang) * r],
             C: [cx, s / 2 + lay * 0.135, cz], D: [Math.cos(da) * dr, -0.9, Math.sin(da) * dr],
             E: [Math.cos(ea) * er, s / 2, Math.sin(ea) * er], ry: rnd() * 3, detruite: i >= 200, ordre: i });
  }
  var marchandises = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ map: grainTex, roughness: 0.85 }), NM);
  marchandises.castShadow = true; marchandises.receiveShadow = true;
  var col = new THREE.Color();
  for (i = 0; i < NM; i++) { var p = PAL[i % PAL.length]; col.setRGB(p[0], p[1], p[2]); marchandises.setColorAt(i, col); }
  scene.add(marchandises);

  /* ── la lumière ── */
  var hemi = new THREE.HemisphereLight(0xd8b48a, 0x3a2a1c, 0.5); scene.add(hemi);
  scene.add(new THREE.AmbientLight(0x3a2a1c, 0.5));
  var lampe = new THREE.DirectionalLight(0xffd6a0, 2.0);
  lampe.position.set(-6, 10, 6); lampe.castShadow = true; lampe.shadow.mapSize.set(2048, 2048);
  lampe.shadow.camera.left = -9; lampe.shadow.camera.right = 9; lampe.shadow.camera.top = 9; lampe.shadow.camera.bottom = -9;
  lampe.shadow.camera.near = 1; lampe.shadow.camera.far = 40; lampe.shadow.bias = -0.0008;
  scene.add(lampe);
  var appoint = new THREE.DirectionalLight(0xffe2bd, 0.4); appoint.position.set(4, 3, 8); scene.add(appoint);
  var crise = new THREE.PointLight(0xff4a1e, 0, 9, 2); crise.position.set(0, 1.4, 0.6); scene.add(crise);

  var G = 0, TT = 0;
  var st = { apparait: 0, dissout: 0, marche: 0, monceau: 0, ecroule: 0, reprise: 0 };
  function set(g) { G = g; }
  function compute() {
    st.apparait = ss(1.0, 1.9, G);
    st.dissout  = ss(2.0, 3.0, G);
    st.marche   = ss(3.0, 3.95, G);
    st.monceau  = ss(4.0, 4.6, G);
    st.ecroule  = ss(4.65, 5.1, G);
    st.reprise  = ss(5.15, 5.9, G);
  }

  function frame(dt) {
    TT += dt; compute();

    /* les murs : chaque pierre se lève, tourne et se réduit à son tour */
    for (var i = 0; i < MUR.length; i++) {
      var w = MUR[i], f = cl((st.dissout * 1.55) - w.d);
      dummy.position.set(w.x + w.j, w.y + f * 1.6, w.z);
      dummy.rotation.set(f * 1.2, w.ry + f * 2.0, f * 0.8);
      var sc = Math.max(0.0001, 1 - f);
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix(); murs.setMatrixAt(i, dummy.matrix);
    }
    murs.instanceMatrix.needsUpdate = true;

    for (i = 0; i < NP; i++) {
      var pb = pBase[i], t = cl((st.dissout * 1.55) - pb[5]);
      pPos[i * 3] = pb[0] + pb[4] * t; pPos[i * 3 + 1] = pb[1] + t * pb[3] * 2.2; pPos[i * 3 + 2] = pb[2] + pb[4] * t * 0.6;
    }
    pGeo.attributes.position.needsUpdate = true;
    poussiere.material.opacity = 0.75 * bump(0, 1, st.dissout);

    /* les marchandises */
    var vA = [0, 0, 0];
    for (i = 0; i < NM; i++) {
      var q = M[i];
      /* apparition : les soixante premières dans l'enceinte, les autres avec le marché */
      var app = q.ordre < 60 ? cl(st.apparait * 60 - q.ordre) : cl(st.marche * (NM - 60) - (q.ordre - 60));
      var px = lerp(q.A[0], q.B[0], st.marche), py = lerp(q.A[1], q.B[1], st.marche), pz = lerp(q.A[2], q.B[2], st.marche);
      px = lerp(px, q.C[0], st.monceau); py = lerp(py, q.C[1], st.monceau); pz = lerp(pz, q.C[2], st.monceau);
      var sc2 = app;
      if (q.detruite) {
        var e = st.ecroule;
        px = lerp(px, q.D[0], e); pz = lerp(pz, q.D[2], e);
        py = lerp(py, q.D[1], e) + 1.4 * bump(0, 0.7, e);
        sc2 *= 1 - ss(0.55, 1, e);
      } else {
        /* le monceau s'affaisse de moitié quand le haut s'écroule */
        py = lerp(py, q.C[1] * 0.55 + q.s / 2 * 0.45, st.ecroule * st.monceau);
        px = lerp(px, q.E[0], st.reprise); py = lerp(py, q.E[1], st.reprise); pz = lerp(pz, q.E[2], st.reprise);
      }
      dummy.position.set(px, py, pz);
      dummy.rotation.set(0, q.ry * (1 - st.monceau * (1 - st.reprise)) + (q.detruite ? st.ecroule * 3 : 0), q.detruite ? st.ecroule * 2 : 0);
      var s3 = q.s * Math.max(0.0001, sc2);
      dummy.scale.set(s3, s3, s3);
      dummy.updateMatrix(); marchandises.setMatrixAt(i, dummy.matrix);
    }
    marchandises.instanceMatrix.needsUpdate = true;

    crise.intensity = 6 * bump(4.55, 5.2, G);

    /* la caméra : près de l'enceinte, puis haute et large sur le marché,
       puis au pied du monceau, puis large de nouveau */
    var wide = Math.max(st.marche * (1 - st.monceau), st.reprise);
    var dist = lerp(lerp(7.2, 7.8, st.dissout), 14.5, wide);
    dist = lerp(dist, 9.0, st.monceau * (1 - st.reprise));
    var cy = lerp(0.7, 0.4, wide) + 0.5 * st.monceau * (1 - st.reprise);
    var haut = lerp(lerp(2.2, 2.6, st.dissout), 6.5, wide);
    var az = lerp(-0.55, -0.2, ss(0, 3, G)) + 0.25 * st.reprise;
    var cible = new THREE.Vector3(0, cy, 0);
    camera.position.set(Math.sin(az) * dist + 0.03 * Math.sin(TT * 0.23), cy + haut + 0.02 * Math.sin(TT * 0.31), Math.cos(az) * dist);
    /* au large, la colonne de texte couvre la gauche : on vise à gauche du
       sujet. Sous 1100 px la scène est une bande au-dessus du texte. */
    var large = (canvas.clientWidth || 0) >= 1100;
    var fwd = new THREE.Vector3().subVectors(cible, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    aim.copy(cible).addScaledVector(right, large ? -0.2 * camera.position.distanceTo(cible) : 0);
    camera.lookAt(aim);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w / h > 1.2 ? 40 : Math.min(72, 2 * Math.atan(Math.tan(52 * Math.PI / 360) / camera.aspect) * 180 / Math.PI);
    camera.updateProjectionMatrix();
  }
  function dispose() {
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    renderer.dispose();
  }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, camera: camera };
};
