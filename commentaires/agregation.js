/* commentaires/agregation.js — le mouvement de /agregation-2027 et des
   commentaires guidés (mission agregation-2027, 2e passe).

   Tout est piloté par la POSITION de lecture, donc réversible, et RIEN n'est
   masqué par défaut : sans ce script la page est complète et finie. Deux
   gestes, et deux seulement :

   · LA FRISE DE L'ŒUVRE SE TRACE. Un filet d'or descend le long des textes
     à mesure qu'on lit, et chaque texte s'allume quand la ligne de lecture
     l'atteint : l'œuvre se parcourt dans l'ordre où elle s'écrit.
   · LA MARGE SUIT LA LECTURE. L'entrée du sommaire où l'on est prend l'or
     (aria-current="location") ; sur un commentaire, le moment de l'extrait
     qu'on est en train de lire s'éclaire dans la marge, là où le texte reste
     sous les yeux.

   Sous prefers-reduced-motion, la frise est posée tracée d'un coup ; le
   repère de lecture reste, parce que c'est de l'orientation et non du
   mouvement. La largeur ne se teste pas à innerWidth (piège documenté) :
   rien ici n'en dépend. */
(function () {
  var root = document.documentElement;
  var reduit = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.classList.add('js-ag');
  if (reduit) root.classList.add('ag-reduit');

  var READ = 0.58;
  var frise = document.querySelector('.ag-frise');
  var jalons = frise ? [].slice.call(frise.querySelectorAll(':scope > li')) : [];
  var secs = [].slice.call(document.querySelectorAll('.nt-essai .nt-sec[id]'));
  var liens = [].slice.call(document.querySelectorAll('[data-spy] a[href^="#"]'));
  var moments = [].slice.call(document.querySelectorAll('[data-moment]'));
  var enFile = false, dernier = null;

  function cadre() {
    enFile = false;
    var vh = window.innerHeight || root.clientHeight;
    if (!vh) return;
    var ligne = vh * READ;

    if (frise) {
      var r = frise.getBoundingClientRect();
      var d = reduit ? 1 : Math.max(0, Math.min(1, (ligne - r.top) / Math.max(1, r.height)));
      var v = d.toFixed(3);
      if (frise.style.getPropertyValue('--draw') !== v) frise.style.setProperty('--draw', v);
      for (var i = 0; i < jalons.length; i++) {
        var t = jalons[i].getBoundingClientRect().top + 12;
        jalons[i].classList.toggle('on', reduit || t <= ligne);
      }
    }

    var cur = '';
    for (var k = 0; k < secs.length; k++) if (secs[k].getBoundingClientRect().top <= ligne) cur = secs[k].id;
    if (cur !== dernier) {
      dernier = cur;
      liens.forEach(function (a) {
        var on = a.getAttribute('href') === '#' + cur;
        a.classList.toggle('on', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }
  }

  /* « Revoir ce moment dans l'extrait » : le lien remonte à l'extrait (son
     href y mène, sans script aussi) et éclaire les segments du moment qu'on
     lisait. L'éclairage suivait d'abord le défilement, mais l'extrait est
     hors de l'écran pendant qu'on lit un moment : le geste ne se voyait
     jamais (vu à la capture). Il répond maintenant à la demande du lecteur. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-voir]');
    if (!a) return;
    var id = a.getAttribute('data-voir');
    moments.forEach(function (el) { el.classList.toggle('on', el.getAttribute('data-moment') === id); });
  });
  function file() { if (!enFile) { enFile = true; window.requestAnimationFrame(cadre); } }

  window.addEventListener('scroll', file, { passive: true });
  window.addEventListener('resize', file);
  /* Un saut par ancre (sommaire, « Revoir ce moment ») peut rendre la mesure
     avant que le défilement ne soit posé : le sommaire restait une section en
     retard (vu à la capture). On remesure une fois le saut fait. */
  window.addEventListener('hashchange', function () { setTimeout(cadre, 60); });
  /* La mesure unique ne suffit pas : la coquille (shell.js) monte la topbar et
     la sidebar après ce script, puis les polices arrivent. */
  cadre();
  window.requestAnimationFrame(cadre);
  setTimeout(cadre, 400);
  window.addEventListener('load', cadre);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(cadre);
})();
