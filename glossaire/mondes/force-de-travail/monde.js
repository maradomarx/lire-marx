/* LE MONDE DE LA FORCE DE TRAVAIL — la photographie, et le regard qui s'y déplace.
   Lewis W. Hine, « The Mule Room in the New Bedford Cotton Mill », 1912
   (Library of Congress, collection National Child Labor Committee,
   nclc.02476, domaine public).

   Il n'y a plus de décor. Le chapitre VI finit par « quitter cette sphère
   bruyante où tout se passe à la surface » pour « le laboratoire secret de
   la production » : on y est d'emblée, et la page n'est que ce que le
   défilement y fait REGARDER. C'est le mouvement de Marx lui-même — de la
   salle et de ses machines aux quatre hommes qui s'y tiennent, puis retour,
   la salle n'étant plus la même une fois qu'on sait ce qu'on y voit.

   Le troisième temps est un cadeau du tirage : les quatre hommes sont
   DEBOUT, bras croisés, ILS NE TRAVAILLENT PAS. La distinction qui fait le
   concept — ce qui s'achète est une puissance, le travail n'existe pas
   encore — est là, littéralement, dans l'image.

   PAS DE WEBGL : un contexte 2D suffit à recadrer une image, et il est plus
   net qu'un plan texturé. La scène déclare "moteur": "2d" dans meta.json,
   le gabarit n'émet alors pas data-three et le pilote ne charge pas la
   bibliothèque — cent quarante-huit kilo-octets qui ne serviraient à rien.
   Tout est fonction de g, donc réversible. */
window.LM_MONDE = function (canvas) {
  'use strict';
  var ctx = canvas.getContext('2d');
  if (!ctx) return null;

  var host = document.querySelector('.nt-monde');
  var dir = (host && host.dataset.scene ? host.dataset.scene : '/glossaire/mondes/force-de-travail/monde.js').replace(/monde\.js.*$/, '');

  var img = new Image();
  var loaded = false;
  var ready = new Promise(function (res) {
    img.onload = function () { loaded = true; res(img); };
    img.onerror = function () { res(null); };
    img.src = dir + 'atelier-1912.webp';
  });

  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ss(a, b, v) { var t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Les stations du regard. `s` est le SUJET dans l'image (fractions de sa
     largeur et de sa hauteur), `w` la part de largeur que le cadre embrasse.
     Le sujet n'est pas centré : la colonne de texte occupe la gauche de
     l'écran, on décale donc le cadre pour qu'il vive dans la moitié droite
     — le même parti que la visée décalée des scènes en trois dimensions. */
  var KEY = [
    { sx: 0.50,  sy: 0.500, w: 1.00 },  /* 0 la salle entière : d'où vient le plus ? */
    { sx: 0.53,  sy: 0.545, w: 0.80 },  /* 1 on entre dans la salle */
    { sx: 0.557, sy: 0.565, w: 0.44 },  /* 2 les quatre hommes, debout, bras croisés */
    { sx: 0.557, sy: 0.605, w: 0.28 },  /* 3 les corps, les pieds nus : les subsistances */
    { sx: 0.50,  sy: 0.560, w: 0.66 },  /* 4 les hommes DANS la salle : le rapport */
    { sx: 0.50,  sy: 0.520, w: 0.88 },  /* 5 on se retire */
    { sx: 0.50,  sy: 0.500, w: 1.00 }   /* 6 la salle entière — elle n'est plus la même */
  ];
  var BIAIS = 0.20;   /* le sujet se pose aux sept dixièmes de la largeur */

  var G = 0, T = 0, cw = 0, ch = 0, dpr = 1;
  function set(g) { G = g; }

  function frame(dt) {
    T += dt || 0;
    render();
  }

  function render() {
    if (!cw || !ch) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0906';
    ctx.fillRect(0, 0, cw, ch);
    if (!loaded) return;

    var seg = Math.max(0, Math.min(KEY.length - 2, Math.floor(G)));
    var t = ss(0, 1, G - seg);
    var a = KEY[seg], b = KEY[seg + 1];
    var w = lerp(a.w, b.w, t);
    var sx = lerp(a.sx, b.sx, t), sy = lerp(a.sy, b.sy, t);

    /* la respiration : deux périodes non multiples, sinon l'œil les
       resynchronise et l'image se met à battre la mesure */
    sx += 0.0045 * Math.sin(T * 0.11);
    sy += 0.0035 * Math.sin(T * 0.077);

    var IW = img.naturalWidth, IH = img.naturalHeight, A = cw / ch;
    var W = w * IW, H = W / A;
    if (H > IH) { H = IH; W = H * A; }
    if (W > IW) { W = IW; H = W / A; }
    /* le décalage vaut la part de cadre disponible : à pleine largeur il
       n'y a plus de place, et l'image se recentre d'elle-même */
    var cx = sx - BIAIS * (W / IW);
    var x = cl2(cx * IW - W / 2, 0, IW - W);
    var y = cl2(sy * IH - H / 2, 0, IH - H);
    ctx.drawImage(img, x, y, W, H, 0, 0, cw, ch);

    /* elle prend la lumière : la salle arrive sous-exposée, et s'éclaire à
       mesure qu'on y entre. Un voile sombre plutôt qu'un filtre — ctx.filter
       n'a longtemps pas existé sur Safari. */
    var e = 0.44 + 0.56 * ss(0.05, 1.35, G);
    if (e < 0.999) { ctx.fillStyle = 'rgba(10,7,4,' + (1 - e).toFixed(3) + ')'; ctx.fillRect(0, 0, cw, ch); }

    /* un vignettage discret : le tirage est vu à la lampe, et les bords
       rendus au fond de la page laissent respirer le texte */
    var vg = ctx.createRadialGradient(cw * 0.62, ch * 0.5, Math.min(cw, ch) * 0.22, cw * 0.62, ch * 0.5, Math.max(cw, ch) * 0.78);
    vg.addColorStop(0, 'rgba(12,9,6,0)');
    vg.addColorStop(1, 'rgba(12,9,6,.62)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, cw, ch);
  }
  function cl2(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    cw = w; ch = h;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    render();
  }
  function dispose() { img.src = ''; }

  return { set: set, frame: frame, resize: resize, render: render, dispose: dispose, ready: ready };
};
