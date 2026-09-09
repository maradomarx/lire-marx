/* LE MONDE DE LA LÉGISLATION SANGLANTE — la forge qui s'éteint.

   Le chapitre XXVIII ne s'achève pas sur les statuts mais sur leur RELÈVE :
   « la sourde pression des rapports économiques achève le despotisme du
   capitaliste sur le travailleur », et le fer rouge devient une pièce
   d'arsenal qu'on garde sans s'en servir. La figure devait donc montrer un
   appareil de contrainte qu'on MONTE, puis qu'on démonte, et le fait que
   rien ne le remplace visiblement.

   Un coin de forge. Le brasier est allumé, un fer chauffe, la planche
   d'essai est vierge. Puis les fers se multiplient et la planche prend, une
   à une, les trois lettres que Marx nomme — S, V, R — pendant que l'anneau
   de fer paraît à son crochet. Puis un tableau se cloue au mur : le tarif
   des salaires, avec son trait de plafond en haut et RIEN en dessous, parce
   que la loi fixe un maximum et se garde de prescrire un minimum.

   Alors le brasier tombe. Les fers se refroidissent et rouillent, le tableau
   est décroché — il ne reste qu'un rectangle pâle sur la suie et un clou
   vide —, et rien ne vient à la place : c'est le mécanisme qui fait le
   travail. Un seul fer reste pendu au râtelier, car on fut « bien aise
   d'avoir sous la main, pour des cas imprévus, le vieil arsenal d'oukases ».

   LA LUMIÈRE CHANGE DE SOURCE, et c'est le geste de la page : au premier
   temps la scène est éclairée d'en bas par les braises, au dernier par la
   seule lampe de l'atelier. Rien n'a été ajouté, et tout est tenu.

   Tout est fonction de g, donc réversible. Seuls le tremblement des braises
   et le vacillement de la lampe sont temporels. */
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

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 1.9, 5.0);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.02, 18);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 60013; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── LE MUR ENFUMÉ ET LE SOL ─────────────────────────────────────────
     La suie est une TEXTURE et non une teinte : c'est elle qui permettra au
     rectangle pâle de se lire quand le tableau sera décroché. */
  var murTex = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#2c2118'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 1400; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '10,7,4' : '104,84,58') + ',' + (rnd() * 0.15) + ')'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 2 + rnd() * 10, 2 + rnd() * 6, 0, 0, 6.3); g.fill(); }
    for (var k = 0; k < 260; k++) { g.fillStyle = 'rgba(6,4,2,' + (0.05 + rnd() * 0.22) + ')'; g.beginPath(); g.ellipse(rnd() * w, h * (0.55 + rnd() * 0.45), 12 + rnd() * 46, 8 + rnd() * 30, 0, 0, 6.3); g.fill(); }
  });
  murTex.wrapS = murTex.wrapT = THREE.RepeatWrapping; murTex.repeat.set(2, 2);
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.8), std({ map: murTex, roughness: 1, color: 0x8e7a5a }));
  mur.position.set(0, 0.60, -0.34); mur.receiveShadow = true; scene.add(mur);
  var solTex = tex(256, 256, function (g, w, h) {
    g.fillStyle = '#221a12'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 700; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '8,6,3' : '96,78,54') + ',' + (rnd() * 0.16) + ')'; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, 3 + rnd() * 12, 2 + rnd() * 7, 0, 0, 6.3); g.fill(); }
  });
  solTex.wrapS = solTex.wrapT = THREE.RepeatWrapping; solTex.repeat.set(4, 4);
  var sol = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), std({ map: solTex, roughness: 1, color: 0x7e6a4c }));
  sol.rotation.x = -Math.PI / 2; sol.position.y = -0.42; sol.receiveShadow = true; scene.add(sol);

  /* ── LES MATIÈRES ── */
  var boisTex = tex(256, 256, function (g, w, h) {
    g.fillStyle = '#4a3623'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 120; i++) {
      g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '24,16,8' : '124,100,66') + ',' + (0.06 + rnd() * 0.17) + ')';
      g.lineWidth = 0.6 + rnd() * 2.2; g.beginPath(); var y = rnd() * h; g.moveTo(0, y);
      for (var x = 0; x <= w; x += 26) g.lineTo(x, y + Math.sin((x + i * 33) / 62) * 4); g.stroke();
    }
  });
  var bois   = std({ map: boisTex, color: 0x9d8157, roughness: 0.9 });
  var ferMat = std({ color: 0x1b1915, metalness: 0.30, roughness: 0.52 });
  var rouille = std({ color: 0x0e0805, metalness: 0.16, roughness: 0.9 });
  var braiseMat = std({ color: 0x120a04, roughness: 0.9, emissive: new THREE.Color(0xd82e08), emissiveIntensity: 1 });
  var laiton = std({ color: 0x4e3a12, metalness: 0.46, roughness: 0.32 });

  /* ── LE BRASIER ── */
  var BX = -0.10, BY = -0.10;
  var cuve = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.145, 0.10, 24, 1, true), std({ color: 0x191712, metalness: 0.28, roughness: 0.6, side: THREE.DoubleSide }));
  cuve.position.set(BX, BY, 0.06); cuve.castShadow = cuve.receiveShadow = true; scene.add(cuve);
  var fondCuve = new THREE.Mesh(new THREE.CylinderGeometry(0.148, 0.148, 0.010, 24), std({ color: 0x151310, roughness: 0.8 }));
  fondCuve.position.set(BX, BY - 0.045, 0.06); scene.add(fondCuve);
  for (var p0 = 0; p0 < 3; p0++) {
    var a0 = p0 * 2.094 + 0.5;
    var pd = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.016, 0.32, 8), ferMat);
    pd.position.set(BX + Math.cos(a0) * 0.135, BY - 0.21, 0.06 + Math.sin(a0) * 0.135);
    pd.rotation.z = -Math.cos(a0) * 0.16; pd.rotation.x = Math.sin(a0) * 0.16;
    pd.castShadow = true; scene.add(pd);
  }
  var braises = [];
  for (var b0 = 0; b0 < 26; b0++) {
    var r0 = 0.135 * Math.sqrt(rnd()), a1 = rnd() * 6.283;
    var br = new THREE.Mesh(new THREE.SphereGeometry(0.016 + rnd() * 0.014, 7, 5), braiseMat.clone());
    br.position.set(BX + Math.cos(a1) * r0, BY - 0.020 + rnd() * 0.014, 0.06 + Math.sin(a1) * r0 * 0.92);
    br.scale.y = 0.6; scene.add(br); braises.push(br);
  }

  /* ── L'ENCLUME ── */
  var enclume = new THREE.Group(); enclume.position.set(0.52, -0.42, 0.10); scene.add(enclume);
  var billot = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.128, 0.24, 14), bois);
  billot.position.y = 0.12; billot.castShadow = billot.receiveShadow = true; enclume.add(billot);
  var tas = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.070, 0.115), ferMat);
  tas.position.y = 0.275; tas.castShadow = tas.receiveShadow = true; enclume.add(tas);
  var corne = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.13, 12), ferMat);
  corne.position.set(0.20, 0.275, 0); corne.rotation.z = -Math.PI / 2; corne.castShadow = true; enclume.add(corne);

  /* ── LE RÂTELIER ET LES QUATRE FERS ─────────────────────────────────
     Les fers sont des tiges NUES : une tête de lettre de deux centimètres ne
     se lit pas, et c'est la planche d'essai qui porte les lettres. */
  var rat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.030, 0.048), bois);
  rat.position.set(-0.46, 0.42, -0.28); rat.castShadow = rat.receiveShadow = true; scene.add(rat);
  var NF = 4, fers = [], pointes = [];
  for (var f0 = 0; f0 < NF; f0++) {
    var g0 = new THREE.Group();
    var tige = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.40, 8), ferMat);
    tige.position.y = -0.20; tige.castShadow = true; g0.add(tige);
    var manch = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.014, 0.10, 10), bois);
    manch.position.y = 0.03; manch.castShadow = true; g0.add(manch);
    var tete = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.030, 0.014), braiseMat.clone());
    tete.position.y = -0.408; tete.castShadow = true; g0.add(tete); pointes.push(tete);
    g0.position.set(-0.46 - 0.150 + f0 * 0.100, 0.40, -0.26);
    g0.visible = false; scene.add(g0); fers.push(g0);
  }
  /* le fer qui chauffe DANS les braises, au premier temps */
  var ferChaud = new THREE.Group(); scene.add(ferChaud);
  var tigeC = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.44, 8), ferMat);
  tigeC.position.y = 0.16; tigeC.rotation.z = 0.62; tigeC.position.x = -0.11; tigeC.castShadow = true; ferChaud.add(tigeC);
  var teteC = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.032, 0.016), braiseMat.clone());
  teteC.position.set(0.015, -0.02, 0); teteC.castShadow = true; ferChaud.add(teteC);
  ferChaud.position.set(BX + 0.03, BY, 0.06);

  /* ── LA PLANCHE D'ESSAI : les trois lettres, une par statut ── */
  function plancheTex(n) {
    return tex(512, 256, function (g, w, h) {
      g.fillStyle = '#5b452b'; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 90; i++) { g.strokeStyle = 'rgba(' + (rnd() < 0.5 ? '30,20,10' : '138,112,74') + ',' + (0.05 + rnd() * 0.14) + ')'; g.lineWidth = 0.7 + rnd() * 2; g.beginPath(); var y = rnd() * h; g.moveTo(0, y); for (var x = 0; x <= w; x += 30) g.lineTo(x, y + Math.sin((x + i * 29) / 58) * 3); g.stroke(); }
      var L = ['S', 'V', 'R'];
      for (var k = 0; k < n; k++) {
        var cx = w * (0.24 + k * 0.26), cy = h * 0.52;
        var rg = g.createRadialGradient(cx, cy, 4, cx, cy, w * 0.10);
        rg.addColorStop(0, 'rgba(18,10,4,0.92)'); rg.addColorStop(1, 'rgba(18,10,4,0)');
        g.fillStyle = rg; g.beginPath(); g.arc(cx, cy, w * 0.10, 0, 6.3); g.fill();
        g.fillStyle = 'rgba(10,6,2,0.95)'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '700 ' + (h * 0.46) + 'px Georgia, serif';
        g.fillText(L[k], cx, cy);
      }
    });
  }
  var planches = [];
  for (var n0 = 0; n0 <= 3; n0++) planches.push(plancheTex(n0));
  var planche = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.21, 0.016), std({ map: planches[0], roughness: 0.92, color: 0xb09472 }));
  planche.position.set(0.00, 0.46, -0.30); planche.castShadow = planche.receiveShadow = true; scene.add(planche);
  var nPl = 0;

  /* ── L'ANNEAU DE FER, à son crochet ── */
  var anneau = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.011, 8, 26), ferMat);
  anneau.position.set(-0.24, 0.16, -0.28); anneau.castShadow = true; anneau.visible = false; scene.add(anneau);
  var crochet = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 6), ferMat);
  crochet.rotation.x = Math.PI / 2; crochet.position.set(-0.24, 0.235, -0.30); crochet.visible = false; scene.add(crochet);

  /* ── LE TABLEAU DU TARIF : un plafond, et rien en dessous ── */
  var tarifTex = tex(384, 512, function (g, w, h) {
    g.fillStyle = '#c8bb9d'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 500; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '104,88,62' : '226,214,188') + ',' + (rnd() * 0.13) + ')'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 6, 1 + rnd() * 3); }
    /* la graduation, et le SEUL trait qui compte : celui d'en haut */
    g.strokeStyle = 'rgba(46,34,20,0.55)'; g.lineWidth = 2;
    for (var k = 0; k < 14; k++) { var y = h * (0.20 + k * 0.055); g.beginPath(); g.moveTo(w * 0.16, y); g.lineTo(w * (k % 3 === 0 ? 0.44 : 0.32), y); g.stroke(); }
    g.strokeStyle = 'rgba(122,32,18,0.92)'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(w * 0.10, h * 0.20); g.lineTo(w * 0.90, h * 0.20); g.stroke();
    g.fillStyle = 'rgba(46,34,20,0.8)'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = '600 ' + (w * 0.074) + 'px Georgia, serif';
    g.textAlign = 'center'; g.fillText('MAXIMUM', w * 0.50, h * 0.145);
  });
  var tarif = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.40, 0.014), std({ map: tarifTex, roughness: 0.9, color: 0x8d8168 }));
  tarif.position.set(0.38, 0.34, -0.30); tarif.castShadow = tarif.receiveShadow = true; tarif.visible = false; scene.add(tarif);
  /* LE RECTANGLE PÂLE : la suie n'a pas pris derrière le tableau. C'est lui
     qui dit, une fois le tableau ôté, que rien ne l'a remplacé. */
  var trace = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.40),
    new THREE.MeshBasicMaterial({ color: 0x33261a, transparent: true, opacity: 0 }));
  trace.position.set(0.38, 0.34, -0.335); scene.add(trace);
  var clou = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.004, 0.030, 6), ferMat);
  clou.rotation.x = Math.PI / 2; clou.position.set(0.38, 0.51, -0.322); clou.visible = false; scene.add(clou);
  var cadenas = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.008, 7, 18, Math.PI), laiton);
  var corps = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.044, 0.016), laiton);
  corps.position.y = -0.026; cadenas.add(corps);
  cadenas.position.set(0.38, 0.06, -0.29); cadenas.castShadow = true; cadenas.visible = false; scene.add(cadenas);

  /* ── LA LUMIÈRE : elle CHANGE DE SOURCE ── */
  scene.add(new THREE.AmbientLight(0x30271b, 0.44));
  var feu = new THREE.PointLight(0xff7a20, 2.55, 3.3, 1.6);
  feu.position.set(BX, BY + 0.06, 0.08);
  feu.castShadow = true; feu.shadow.bias = -0.0012; feu.shadow.mapSize.set(1024, 1024); scene.add(feu);
  var lampe = new THREE.PointLight(0xffc287, 0.42, 4.0, 1.5);
  lampe.position.set(-0.46, 1.32, 1.00);
  lampe.castShadow = true; lampe.shadow.bias = -0.0011; lampe.shadow.mapSize.set(2048, 2048); scene.add(lampe);
  var froide = new THREE.DirectionalLight(0x92a8c4, 0.20); froide.position.set(1.4, 0.9, 1.2); scene.add(froide);

  /* ── CHORÉGRAPHIE ── */
  var G = 0, T = 0;
  var st = { lettres: 0, tarif: 0, froid: 0, decroche: 0, reserve: 0 };
  function set(g) { G = g; }
  function compute() {
    st.lettres  = ss(1.05, 2.00, G);   /* les fers, les lettres, l'anneau */
    st.tarif    = ss(2.10, 2.90, G);   /* le tableau se cloue */
    st.froid    = ss(3.15, 4.05, G);   /* le brasier tombe, les fers rouillent */
    st.decroche = ss(4.25, 5.00, G);   /* le tableau est ôté : le rectangle pâle */
    st.reserve  = ss(5.20, 5.85, G);   /* un seul fer reste, l'arsenal conservé */
  }

  function frame(dt) {
    T += dt; compute();
    var chaud = 1 - st.froid;

    /* LES BRAISES tombent : c'est le même mouvement que la relève */
    braises.forEach(function (b, k) {
      var vac = 0.55 + 0.45 * Math.sin(T * (2.1 + (k % 5) * 0.6) + k);
      b.material.emissiveIntensity = chaud * chaud * (0.16 + 0.42 * vac);
      b.material.color.setRGB(0.07 * chaud, 0.035 * chaud, 0.014 * chaud);
    });
    feu.intensity = 2.55 * chaud * chaud * (1 + 0.10 * Math.sin(T * 3.7) + 0.06 * Math.sin(T * 9.1));
    lampe.intensity = (0.42 + 1.34 * st.froid) * (1 + 0.022 * Math.sin(T * 6.2));

    /* LE FER QUI CHAUFFE, puis les quatre du râtelier */
    var fc = 1 - ss(1.10, 1.70, G);
    ferChaud.visible = fc > 0.03;
    ferChaud.scale.setScalar(0.55 + 0.45 * fc);
    teteC.material.emissiveIntensity = 0.62 * fc * chaud;
    teteC.material.color.setRGB(0.09 * fc, 0.045 * fc, 0.018 * fc);

    for (var i = 0; i < NF; i++) {
      var seuil = i / NF * 0.78;
      var f = cl((st.lettres - seuil) / 0.26);
      /* AU DERNIER TEMPS un seul reste pendu : l'arsenal est conservé, non
         détruit — et c'est la phrase de Marx, pas une licence. */
      var reste = (i === 1) ? 1 : (1 - st.reserve);
      fers[i].visible = f > 0.04 && reste > 0.05;
      fers[i].scale.setScalar((0.4 + 0.6 * f) * (i === 1 ? 1 : lerp(1, 0.001, st.reserve)));
      pointes[i].material.emissiveIntensity = 0.52 * f * chaud;
      pointes[i].material.color.setRGB(0.075 * f * chaud, 0.038 * f * chaud, 0.015 * f * chaud);
      fers[i].children[0].material = st.froid > 0.55 ? rouille : ferMat;
    }

    /* LES TROIS LETTRES sur la planche d'essai */
    var nv = Math.min(3, Math.floor(st.lettres * 3.6));
    if (nv !== nPl) { nPl = nv; planche.material.map = planches[nv]; planche.material.needsUpdate = true; }

    anneau.visible = st.lettres > 0.55; crochet.visible = st.lettres > 0.55;
    anneau.scale.setScalar(0.4 + 0.6 * cl((st.lettres - 0.55) / 0.35));
    anneau.material = st.froid > 0.55 ? rouille : ferMat;

    /* LE TABLEAU DU TARIF, puis le rectangle pâle et le clou vide */
    tarif.visible = st.tarif > 0.04 && st.decroche < 0.97;
    tarif.position.set(0.38, 0.34 + (1 - st.tarif) * 0.60 - st.decroche * 0.86, -0.30);
    tarif.material.opacity = 1;
    cadenas.visible = st.tarif > 0.6 && st.decroche < 0.5;
    cadenas.scale.setScalar(0.4 + 0.6 * cl((st.tarif - 0.6) / 0.3));
    trace.material.opacity = 0.66 * st.decroche;
    clou.visible = st.decroche > 0.35;


    /* LA CAMÉRA. L'ensemble fait environ 1,35 unité de large pour 1,15 de
       haut : en PAYSAGE la hauteur vue vaut 0,69 fois la distance, en
       PORTRAIT la largeur en vaut 0,82, et c'est la première qui commande —
       il faut 1,70. La caméra recule un peu quand le mur se vide, pour que
       le rectangle pâle et le clou soient dans le cadre avec le râtelier. */
    var q = ss(0, 1, Math.min(1, G / 2.6));
    var d = lerp(1.50, 1.58, q) + st.decroche * 0.08;
    var camA = V3(lerp(-0.10, -0.05, q), lerp(0.10, 0.18, q), -0.06);
    camera.position.set(camA.x + 0.008 * Math.sin(T * 0.25), camA.y + 0.10 + 0.006 * Math.sin(T * 0.31), camA.z + d);
    camera.lookAt(camA);
    render();
  }
  function render() { renderer.render(scene, camera); }
  function resize() {
    var w = canvas.clientWidth, h2 = canvas.clientHeight; if (!w || !h2) return;
    renderer.setSize(w, h2, false); camera.aspect = w / h2;
    camera.fov = w / h2 > 1.2 ? 38 : Math.min(70, 2 * Math.atan(Math.tan(50 * Math.PI / 360) / camera.aspect) * 180 / Math.PI);
    camera.updateProjectionMatrix();
  }
  function dispose() {
    scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    renderer.dispose();
  }
  compute();
  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, state: st, camera: camera };
};
