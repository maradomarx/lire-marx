/* LE MONDE DU POUVOIR POLITIQUE — une balance qui paraît juste.

   L'État se présente comme l'arbitre au-dessus des classes ; la balance est
   la figure de cette prétention, et c'est en la regardant de près qu'on voit
   comment l'équilibre est obtenu.

     g 0-1  deux plateaux à niveau, sur un fût ;
     g 1-2  la caméra tourne : le fût est posé sur la dalle de GAUCHE ;
     g 2-3  une pile de lingots à gauche, un poids léger à droite — et le
            fléau reste horizontal, parce qu'il a COULISSÉ sur le couteau :
            le bras chargé est court, l'autre long ;
     g 3-4  des poids s'ajoutent à droite : le fléau s'incline, puis
            coulisse encore et retrouve le niveau (la concession) ;
     g 4-5  le fléau coulisse jusqu'à l'autre bout, puis il est déposé : les
            plateaux se posent sur les deux dalles, qui se rejoignent ;
     g 5-6  il reste le fût vide.

   LE COUTEAU NE BOUGE PAS, C'EST LE FLÉAU QUI COULISSE : un pivot qui
   glissait sur un rail se lisait comme une machine de plus, et sortait le
   fléau du cadre. L'équilibre est CALCULÉ (moments autour du couteau), non
   joué. Tout est fonction de g, donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; }
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x0b0806, 1);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b0806, 9, 20);
  var camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
  var aim = new THREE.Vector3();

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 5; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  var murTex = tex(512, 512, function (g, w, h) {
    var gr = g.createRadialGradient(w * 0.5, h * 0.52, 10, w * 0.5, h * 0.52, w * 0.62);
    gr.addColorStop(0, '#43301e'); gr.addColorStop(0.5, '#1d140c'); gr.addColorStop(1, '#0b0806');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  var fond = new THREE.Mesh(new THREE.PlaneGeometry(40, 22), new THREE.MeshBasicMaterial({ map: murTex, fog: false }));
  fond.position.set(0, 3.5, -8); scene.add(fond);
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x020101, roughness: 1 }));
  sol.rotation.x = -Math.PI / 2; sol.receiveShadow = true; scene.add(sol);

  var grainTex = tex(128, 128, function (g, w, h) {
    g.fillStyle = '#d8d2c8'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 700; i++) { var v = 150 + rnd() * 90 | 0; g.fillStyle = 'rgba(' + v + ',' + v + ',' + (v - 6) + ',' + (0.2 + rnd() * 0.3) + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  });
  /* un métal peu métallique : sans environnement, un metalness proche de 1
     rend noir */
  var laiton = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.30, 0.20, 0.07), metalness: 0.45, roughness: 0.42 });
  var fer = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.07, 0.065, 0.06), metalness: 0.35, roughness: 0.6 });
  var pierreG = new THREE.MeshStandardMaterial({ map: grainTex, color: new THREE.Color(0.11, 0.1, 0.085), roughness: 0.95 });
  var pierreD = new THREE.MeshStandardMaterial({ map: grainTex, color: new THREE.Color(0.075, 0.068, 0.06), roughness: 0.95 });
  var or = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.42, 0.27, 0.06), metalness: 0.5, roughness: 0.35 });

  function mesh(geo, mat, parent) { var m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; (parent || scene).add(m); return m; }

  /* ── les deux dalles ; le fût est fixé sur celle de gauche ── */
  var dalleG = mesh(new THREE.BoxGeometry(2.6, 0.22, 2.2), pierreG); dalleG.position.set(-1.1, 0.11, 0);
  var dalleD = mesh(new THREE.BoxGeometry(2.6, 0.22, 2.2), pierreD); dalleD.position.set(1.62, 0.11, 0);

  var HAUT = 2.55, FUT_X = -0.45;
  mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.14, 24), fer).position.set(FUT_X, 0.29, 0);
  var colonne = mesh(new THREE.CylinderGeometry(0.06, 0.085, HAUT - 0.36, 16), laiton); colonne.position.set(FUT_X, 0.36 + (HAUT - 0.36) / 2, 0);
  var couteau = mesh(new THREE.ConeGeometry(0.11, 0.22, 3), laiton); couteau.position.set(FUT_X, HAUT + 0.02, 0); couteau.rotation.z = Math.PI;

  /* ── le fléau, ses chaînes et ses plateaux ── */
  var LONG = 3.0;
  var fleau = mesh(new THREE.BoxGeometry(LONG, 0.07, 0.09), laiton);
  function plateau() {
    var gp = new THREE.Group(); scene.add(gp);
    mesh(new THREE.CylinderGeometry(0.5, 0.38, 0.08, 32), laiton, gp);
    var chaines = [];
    for (var i = 0; i < 3; i++) chaines.push(mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 6), fer));
    return { g: gp, chaines: chaines };
  }
  var PG = plateau(), PD = plateau();
  var lingots = [];
  for (var i = 0; i < 9; i++) {
    var l = mesh(new THREE.BoxGeometry(0.3, 0.09, 0.14), or, PG.g);
    l.position.set(((i % 3) - 1) * 0.16, 0.085 + Math.floor(i / 3) * 0.1, ((i % 3) - 1) * 0.05 + (Math.floor(i / 3) - 1) * 0.04);
    l.rotation.y = (i % 3) * 0.45; lingots.push(l);
  }
  var poids = [];
  for (i = 0; i < 5; i++) {
    var pw = mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.13, 20), fer, PD.g);
    pw.position.set(i === 0 ? 0 : Math.cos(i * 1.6) * 0.22, 0.105 + (i > 2 ? 0.13 : 0), i === 0 ? 0 : Math.sin(i * 1.6) * 0.22);
    poids.push(pw);
  }

  /* ── la lumière ── */
  scene.add(new THREE.HemisphereLight(0xd8b48a, 0x3a2a1c, 0.5));
  scene.add(new THREE.AmbientLight(0x3a2a1c, 0.5));
  var lampe = new THREE.DirectionalLight(0xffd6a0, 2.0);
  lampe.position.set(-4, 8, 6); lampe.castShadow = true; lampe.shadow.mapSize.set(2048, 2048);
  lampe.shadow.camera.left = -6; lampe.shadow.camera.right = 6; lampe.shadow.camera.top = 6; lampe.shadow.camera.bottom = -2;
  lampe.shadow.camera.near = 1; lampe.shadow.camera.far = 30; lampe.shadow.bias = -0.0008;
  scene.add(lampe);
  var appoint = new THREE.DirectionalLight(0xffe2bd, 0.45); appoint.position.set(4, 2.5, 7); scene.add(appoint);

  var G = 0, TT = 0;
  var st = { tour: 0, charge: 0, ajout: 0, reprise: 0, bascule: 0, depose: 0, vide: 0 };
  function set(g) { G = g; }
  function compute() {
    st.tour    = ss(0.9, 1.9, G);
    st.charge  = ss(2.0, 2.7, G);
    st.ajout   = ss(3.0, 3.45, G);
    st.reprise = ss(3.5, 3.95, G);
    st.bascule = ss(4.05, 4.5, G);
    st.depose  = ss(4.55, 5.0, G);
    st.vide    = ss(5.1, 5.8, G);
  }

  var CHAINE = 1.0;
  var UP = new THREE.Vector3(0, 1, 0);
  function frame(dt) {
    TT += dt; compute();

    /* les plateaux partent VIDES tous deux : un poids seul à droite au premier
       temps disait déjà un déséquilibre que la balance devait taire */
    var nL = Math.round(st.charge * 9), nP = (st.charge > 0.05 ? 1 : 0) + Math.round(st.ajout * 4);
    lingots.forEach(function (l, k) { l.visible = k < nL; });
    poids.forEach(function (p, k) { p.visible = k < nP; });
    var mG = 1 + nL, mD = 1 + nP;

    /* a = longueur du bras gauche, du couteau au plateau chargé.
       Équilibre : mG · a = mD · (LONG − a). Pendant l'ajout, le fléau reste
       où il était et penche ; il coulisse ensuite (la reprise). */
    var aEq = LONG * mD / (mG + mD);
    var aAvant = LONG * 2 / (mG + 2);
    var a = lerp(LONG / 2, aEq, st.charge);
    if (st.ajout > 0) a = lerp(lerp(a, aAvant, st.ajout), aEq, st.reprise);
    a = lerp(a, LONG - 0.55, st.bascule);                /* l'autre bout */
    var couple = mD * (LONG - a) - mG * a;
    var incl = Math.max(-0.3, Math.min(0.3, couple * 0.022)) * (1 - st.bascule);
    var rz = -incl;

    /* le fléau : centré à (LONG/2 − a) du couteau, le long de son axe */
    var c = Math.cos(rz), s = Math.sin(rz);
    var centre = LONG / 2 - a;
    var levee = 1.4 * st.depose;
    fleau.position.set(FUT_X + centre * c, HAUT + centre * s + levee, 0);
    fleau.rotation.set(0, 0, rz);
    var fs = Math.max(0.001, 1 - ss(0.3, 1, st.depose));
    fleau.scale.set(fs, fs, fs);
    fleau.visible = st.depose < 0.995;

    function bout(dx) { return new THREE.Vector3(FUT_X + dx * c, HAUT + dx * s, 0); }
    var eG = bout(-a), eD = bout(LONG - a);

    /* les dalles se rejoignent quand le fléau est déposé */
    dalleD.position.x = lerp(1.62, 1.5, st.depose);
    function place(P, e, xPose) {
      var pend = new THREE.Vector3(e.x, e.y - CHAINE, 0);
      var pose = new THREE.Vector3(xPose, 0.26, 0.2);
      P.g.position.copy(pend).lerp(pose, st.depose);
      for (var k = 0; k < 3; k++) {
        var ang = k / 3 * Math.PI * 2 + 0.3;
        var bas = new THREE.Vector3(P.g.position.x + Math.cos(ang) * 0.42, P.g.position.y + 0.04, P.g.position.z + Math.sin(ang) * 0.42);
        var hautP = e.clone(); hautP.y += levee;
        var ch = P.chaines[k], len = hautP.distanceTo(bas);
        ch.position.copy(hautP).add(bas).multiplyScalar(0.5);
        ch.scale.set(1, Math.max(0.001, len), 1);
        ch.quaternion.setFromUnitVectors(UP, bas.clone().sub(hautP).normalize());
        ch.visible = st.depose < 0.25;
      }
    }
    place(PG, eG, -1.35); place(PD, eD, 1.25);

    /* la caméra suit le fléau : elle vise son milieu, pas le fût */
    var milieu = FUT_X + centre * (1 - st.depose) + 0.2 * st.depose;
    var az = lerp(lerp(0.0, 0.7, st.tour), 0.12, st.charge);
    var dist = lerp(lerp(7.6, 6.9, st.tour), 8.2, st.charge);
    var cy = lerp(1.45, 1.1, st.depose), haut = lerp(0.9, 1.6, st.tour) * (1 - 0.35 * st.charge) + 0.5 * st.depose;
    var cible = new THREE.Vector3(lerp(FUT_X, milieu, 0.8), cy, 0);
    camera.position.set(cible.x + Math.sin(az) * dist + 0.03 * Math.sin(TT * 0.23), cy + haut + 0.02 * Math.sin(TT * 0.31), Math.cos(az) * dist);
    var large = (canvas.clientWidth || 0) >= 1100;
    var fwd = new THREE.Vector3().subVectors(cible, camera.position).normalize();
    var right = new THREE.Vector3().crossVectors(fwd, UP).normalize();
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
