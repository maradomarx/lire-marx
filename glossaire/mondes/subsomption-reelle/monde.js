/* LE MONDE DE LA SUBSOMPTION RÉELLE — l'espalier.

   La distinction est celle d'une forme qui ENTOURE et d'une forme qui
   FAÇONNE, et le jardinier la pratique depuis toujours. Un arbre pousse
   comme il veut ; un treillage se pose derrière lui, et rien de l'arbre
   n'en est changé — c'est la subsomption formelle : le cadre est là, le
   contenu lui reste étranger, et il n'y a qu'une variable, le temps. Puis
   on taille et on palisse : des branches tombent, les autres sont couchées
   sur les fils, et LA FORME DE L'ARBRE EST DEVENUE CELLE DU TREILLAGE. Il
   porte alors davantage, et seulement aux places que le cadre autorise.

   Au dernier temps le treillage s'efface et l'arbre garde la forme. C'est
   ce qui distingue une subsomption réelle d'un simple commandement : elle
   s'est inscrite dans la chose, et retirer le rapport ne rendrait pas le
   travail d'avant.

   Chaque branche existe en DEUX ÉTATS — libre et palissée — et ses nœuds
   sont interpolés entre les deux : tout est fonction de g, donc réversible.
   On remonte, l'arbre se défait. */
window.LM_MONDE = function (canvas) {
  'use strict';
  if (typeof THREE === 'undefined') return null;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setClearColor(0x0a0806, 1);
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  if (THREE.ACESFilmicToneMapping) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a0806, 2.4, 6.0);
  var camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);

  function tex(w, h, draw) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); var t = new THREE.CanvasTexture(cv); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; return t; }
  var rnd = (function () { var s = 1279; return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
  function std(o) { return new THREE.MeshStandardMaterial(o); }
  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function V3(x, y, z) { return new THREE.Vector3(x, y, z); }

  /* ── matières ─────────────────────────────────────────────────────────
     UNE TEXTURE QUI PORTE SA COULEUR NE SE MULTIPLIE PAS PAR UN SECOND
     BRUN : le piège payé sur le râtelier. */
  var platre = tex(512, 512, function (g, w, h) {
    g.fillStyle = '#8f8271'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 11000; i++) { g.fillStyle = 'rgba(' + (rnd() < 0.5 ? '48,34,20' : '198,186,164') + ',' + (rnd() * 0.11) + ')'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2); }
  });
  var ecorce = std({ color: 0x33281a, roughness: 0.95 });
  var feuille = std({ color: 0x3b4a22, roughness: 0.88, side: THREE.DoubleSide });
  var fruit = std({ color: 0x6e3210, roughness: 0.6 });
  var filMat = std({ color: 0x322c26, metalness: 0.45, roughness: 0.55, transparent: true, opacity: 1 });
  var boisMat = std({ color: 0x3a2f20, roughness: 0.92, transparent: true, opacity: 1 });

  /* ── le mur, la terre ── */
  var mur = new THREE.Mesh(new THREE.PlaneGeometry(6, 5), std({ map: platre, roughness: 0.97, color: 0x5f574b }));
  mur.position.set(0, 1.4, -0.44); mur.receiveShadow = true; scene.add(mur);
  var terre = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), std({ color: 0x3a2f22, roughness: 1 }));
  terre.rotation.x = -Math.PI / 2; terre.position.set(0, 0, 0.6); terre.receiveShadow = true; scene.add(terre);

  /* ── LE TREILLAGE : trois fils, deux montants ── */
  var TIERS = [0.45, 0.80, 1.15], WZ = -0.40;
  var treillage = new THREE.Group();
  TIERS.forEach(function (y) {
    var f = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 1.38, 8), filMat);
    f.rotation.z = Math.PI / 2; f.position.set(0, y, WZ); f.castShadow = true; treillage.add(f);
  });
  [-0.66, 0.66].forEach(function (x) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.30, 0.035), boisMat);
    m.position.set(x, 0.65, WZ); m.castShadow = true; treillage.add(m);
  });
  treillage.visible = false; scene.add(treillage);

  /* ── L'ARBRE ──────────────────────────────────────────────────────────
     Chaque branche est une liste de nœuds donnée DEUX FOIS : libre, et
     palissée. Un cylindre par segment, reposé à chaque image entre deux
     nœuds interpolés. */
  var TZ = -0.30;
  var branches = [];
  function poser(m, a, b, r) {
    var d = new THREE.Vector3().subVectors(b, a), l = d.length() || 0.0001;
    m.position.copy(a).addScaledVector(d, 0.5);
    m.scale.set(r, l, r);
    m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
  }
  function faire(pLibre, pTraine, rBase, rBout, coupee, retard) {
    var n = pLibre.length - 1, segs = [], i;
    for (i = 0; i < n; i++) {
      var r = lerp(rBase, rBout, i / n);
      var m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 7), ecorce);
      m.scale.set(r, 0.01, r); m.castShadow = true; m.receiveShadow = true;
      scene.add(m); segs.push([m, r]);
    }
    var b = { libre: pLibre, traine: pTraine, segs: segs, coupee: !!coupee, retard: retard || 0, feuilles: [], fruits: [] };
    branches.push(b); return b;
  }
  function feuilles(b, k, ou) {
    for (var i = 0; i < k; i++) {
      var f = new THREE.Mesh(new THREE.SphereGeometry(0.017 + rnd() * 0.009, 7, 5), feuille);
      f.scale.set(1, 0.30, 1.7); f.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
      f.castShadow = true; scene.add(f);
      b.feuilles.push([f, ou[i % ou.length], (rnd() - 0.5) * 0.075, (rnd() - 0.5) * 0.075, (rnd() - 0.5) * 0.075]);
    }
  }

  /* le tronc : il ne change pas */
  var tronc = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.032, TIERS[0] + 0.03, 10), ecorce);
  tronc.position.set(0, (TIERS[0] + 0.03) / 2, TZ); tronc.castShadow = tronc.receiveShadow = true; scene.add(tronc);

  /* six branches maîtresses : trois étages, deux côtés */
  var NSEG = 5;
  TIERS.forEach(function (Y, k) {
    [-1, 1].forEach(function (cote) {
      var libre = [V3(0, TIERS[0], TZ)], traine = [V3(0, TIERS[0], TZ)];
      var dl = V3(cote * (0.58 + rnd() * 0.22), 0.68 + rnd() * 0.20, 0.24 + rnd() * 0.22).normalize();
      var dt = V3(cote * 0.99, 0.02, -0.05).normalize();
      var pl = libre[0].clone(), pt = traine[0].clone();
      /* la branche palissée part du tronc, monte à son étage, puis suit le fil */
      var montee = Y - TIERS[0];
      for (var i = 1; i <= NSEG; i++) {
        var u = i / NSEG;
        var L = (0.195 + rnd() * 0.045);
        dl.x += (rnd() - 0.5) * 0.34; dl.y += 0.03 - rnd() * 0.30; dl.z += (rnd() - 0.5) * 0.24;
        dl.normalize();
        pl = pl.clone().addScaledVector(dl, L); libre.push(pl);
        /* palissée : x s'étire, y rejoint l'étage tôt, z se colle au fil */
        pt = V3(cote * 0.62 * Math.pow(u, 0.86),
          TIERS[0] + montee * ss(0, 0.42, u) + 0.012 * Math.sin(u * 7),
          lerp(TZ, WZ + 0.035, ss(0, 0.5, u)));
        traine.push(pt);
      }
      var b = faire(libre, traine, 0.017, 0.0075, false, k * 0.06 + (cote > 0 ? 0.03 : 0));
      feuilles(b, 7, [1, 2, 3, 4, 5]);
      /* trois rameaux par branche maîtresse ; certains seront TAILLÉS */
      for (var j = 0; j < 3; j++) {
        var iOr = 2 + j;
        var oL = libre[iOr].clone(), oT = traine[iOr].clone();
        var rl = [oL], rt = [oT];
        var dl2 = V3((rnd() - 0.5) * 1.3, 0.42 + rnd() * 0.5, 0.30 + rnd() * 0.5).normalize();
        var p2 = oL.clone(), q2 = oT.clone();
        for (var s2 = 1; s2 <= 3; s2++) {
          dl2.x += (rnd() - 0.5) * 0.4; dl2.y += 0.05 - rnd() * 0.2; dl2.z += (rnd() - 0.5) * 0.3; dl2.normalize();
          p2 = p2.clone().addScaledVector(dl2, 0.085 + rnd() * 0.035); rl.push(p2);
          /* palissé : un cordon vertical, court, plaqué au fil */
          q2 = V3(oT.x + cote * 0.012 * s2, oT.y + 0.062 * s2, WZ + 0.045);
          rt.push(q2);
        }
        var coupe = (j === 1 && k !== 1) || (j === 2 && cote < 0);
        var r = faire(rl, rt, 0.0075, 0.0045, coupe, k * 0.06 + 0.10 + j * 0.03);
        if (!coupe) {
          feuilles(r, 4, [1, 2, 3]);
          /* un fruit au bout des rameaux conservés : il ne paraît qu'au bon temps */
          var fr = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), fruit);
          fr.castShadow = true; fr.visible = false; scene.add(fr);
          r.fruits.push([fr, 3]);
        }
      }
    });
  });

  /* ── la lumière : hors champ, de loin et de haut ── */
  /* les ombres portées de l'arbre doublaient l'arbre en noir sur le mur :
     l'ambiante les relève juste assez pour qu'on lise les branches */
  var ambiante = new THREE.AmbientLight(0x3a3026, 0.44); scene.add(ambiante);
  var lampe = new THREE.PointLight(0xffc286, 1.42, 6, 1.7); lampe.position.set(-0.85, 1.95, 1.15);
  lampe.castShadow = true; lampe.shadow.bias = -0.0011; lampe.shadow.mapSize.set(1024, 1024); scene.add(lampe);
  var appoint = new THREE.PointLight(0xb69a78, 0.38, 5, 2); appoint.position.set(1.25, 0.95, 1.05); scene.add(appoint);

  /* ── chorégraphie ─────────────────────────────────────────────────── */
  var G = 0, T = 0;
  var st = { cadre: 0, taille: 0, palisse: 0, porte: 0, retire: 0 };
  function set(g) { G = g; }
  function compute() {
    st.cadre = ss(0.75, 1.85, G);     /* le treillage se pose */
    st.taille = ss(2.95, 3.55, G);    /* on taille */
    st.palisse = ss(3.10, 4.35, G);   /* on palisse */
    st.porte = ss(4.15, 5.05, G);     /* il porte */
    st.retire = ss(5.15, 5.75, G);    /* le treillage s'efface */
  }

  function frame(dt) {
    T += dt; compute();

    treillage.visible = st.cadre > 0.02;
    var opa = (0.15 + 0.85 * st.cadre) * (1 - 0.92 * st.retire);
    filMat.opacity = opa; boisMat.opacity = opa;
    treillage.children.forEach(function (m, i) { m.scale.y = i < 3 ? 0.12 + 0.88 * st.cadre : 1; });

    var P = V3(), Q = V3();
    for (var b = 0; b < branches.length; b++) {
      var br = branches[b];
      var t = cl((st.palisse - br.retard) / (1 - br.retard * 0.5));
      t = t * t * (3 - 2 * t);
      var vie = br.coupee ? 1 - cl((st.taille - br.retard * 0.4) / 0.35) : 1;
      var i, n = br.segs.length;
      for (i = 0; i < n; i++) {
        var m = br.segs[i][0], r = br.segs[i][1];
        m.visible = vie > 0.02;
        if (!m.visible) continue;
        P.copy(br.libre[i]).lerp(br.traine[i], t);
        Q.copy(br.libre[i + 1]).lerp(br.traine[i + 1], t);
        poser(m, P, Q, r * vie);
      }
      for (i = 0; i < br.feuilles.length; i++) {
        var fl = br.feuilles[i], j = Math.min(fl[1], br.libre.length - 1);
        fl[0].visible = vie > 0.4;
        if (!fl[0].visible) continue;
        P.copy(br.libre[j]).lerp(br.traine[j], t);
        fl[0].position.set(P.x + fl[2], P.y + fl[3], P.z + fl[4]);
      }
      for (i = 0; i < br.fruits.length; i++) {
        var fu = br.fruits[i], k = Math.min(fu[1], br.libre.length - 1);
        fu[0].visible = st.porte > 0.05;
        if (!fu[0].visible) continue;
        P.copy(br.libre[k]).lerp(br.traine[k], t);
        fu[0].position.set(P.x + 0.012, P.y - 0.045, P.z + 0.045);
        fu[0].scale.setScalar(0.25 + 0.75 * ss(0.05, 0.9, st.porte));
      }
    }

    lampe.intensity = 1.42 * (1 + 0.025 * Math.sin(T * 6.7) + 0.02 * Math.sin(T * 3.1));

    /* LE CADRAGE — l'essentiel (le treillage et l'arbre) tient dans la bande
       que voit le cadre en paysage ; la colonne collante, plus haute,
       reçoit la terre en bas et le mur en haut. Et elle est plus ÉTROITE :
       les branches palissées s'arrêtent à ±0,62, rien ne va plus loin. */
    var q = ss(0, 1, Math.min(1, G / 2.4));
    var dz = lerp(2.18, 2.02, q);
    var camA = V3(0, lerp(0.72, 0.68, q), -0.34);
    camera.position.set(camA.x + 0.014 * Math.sin(T * 0.21), camA.y + 0.13 + 0.009 * Math.sin(T * 0.26), camA.z + dz);
    camera.lookAt(camA);
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
