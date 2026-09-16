/* ══════════════════════════════════════════════════════════════════════
   LE DOSSIER EN CINQ SALLES (mission `dossier-salles`)

   Un seul gabarit pour les trois ateliers, comme marge.js et sommaire.js :
   la page donne l'ORDRE et le nom de ses salles, ce fichier tient la
   barre, l'affichage d'une salle à la fois, l'adresse, le pied de
   passage, le repère de lecture et le fond propre à chaque salle.

   Mesuré avant (Capital, 1440 × 900) : le Dossier était un couloir de
   7 655 px — 12 051 px sur téléphone — où se suivaient cinq mondes sans
   rapport de forme (une ascension qui se déduit, une frise qu'on joue, un
   laboratoire à neuf stations, trois pièces, une bibliographie), avec
   102 éléments focalisables d'affilée et rien qui dise, avant d'entrer,
   ce qu'on va y faire ni combien il reste.

   Chaque salle a maintenant l'écran pour elle. La barre d'ancres devient
   la NAVIGATION (motif ARIA des onglets : une seule tabulation, on
   circule aux flèches), et chaque salle dit sa nature — à lire, à
   manipuler, à jouer, à voir, à consulter.

   Chargé SANS `defer`, dans le <head> : les pages l'appellent pendant
   leur propre exécution.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  if(window.DossierAtelier) return;
  var ROM=['I','II','III','IV','V','VI','VII','VIII'];
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function rm(){ return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches); }

  /* Les natures sont DESSINÉES, jamais des glyphes : même trait, même
     graisse que le reste des marques du site. */
  var ICO={
    lire:'<path d="M3 5.5h6a2.5 2.5 0 0 1 2.5 2.5v9a2 2 0 0 0-2-2H3z"/><path d="M21 5.5h-6A2.5 2.5 0 0 0 12.5 8v9a2 2 0 0 1 2-2H21z"/>',
    manipuler:'<path d="M4 8h10"/><path d="M18 8h2"/><circle cx="16" cy="8" r="2"/><path d="M4 16h4"/><path d="M12 16h8"/><circle cx="10" cy="16" r="2"/>',
    jouer:'<path d="M3 12h18"/><path d="M7 9.5v5"/><path d="M13 9.5v5"/><path d="M19 9.5v5"/>',
    voir:'<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/>',
    consulter:'<path d="M5 5.5h14"/><path d="M5 12h14"/><path d="M5 18.5h9"/>'
  };
  function icone(n){
    var k=String(n||'').replace(/^à\s+/,'').split(' ')[0];
    var d=ICO[k]||ICO.lire;
    return '<svg class="ds-nat-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
      +'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
  }

  var D=null;          /* un seul dossier par page */
  function byId(id){ return document.getElementById(id); }
  function salle(id){ return byId(id); }

  /* o = {box, nav, ordre:[{id, label, nature}], offset(), onShow(id), announce} */
  function install(o){
    if(!o||!o.box||!o.nav||!o.ordre||!o.ordre.length) return null;
    D={box:o.box, nav:o.nav, ordre:o.ordre, offset:o.offset||function(){return 140;},
       onShow:o.onShow||null, cur:null};

    D.nav.innerHTML='<div class="dos-pills">'
      +D.ordre.map(function(s,i){
        return '<button type="button" class="atl-dnav" data-go="'+esc(s.id)+'">'
          +'<b class="dos-pn">'+ROM[i]+'</b> <span class="dos-lb">'+esc(s.label)+'</span></button>';
      }).join('')
      +'</div>'
      /* « III / V » : dans un couloir, on ne savait jamais combien il
         restait. Ici le compte est vrai, et il tient en trois signes. */
      +'<p class="dos-count" aria-hidden="true"><b id="dosCountN">1</b> / '+D.ordre.length+'</p>'
      +'<span class="dos-rail"><i class="dos-rail-fill" id="dosRail"></i></span>';

    D.pills=[].slice.call(D.nav.querySelectorAll('[data-go]'));
    D.pills.forEach(function(b){ b.addEventListener('click',function(){ show(b.dataset.go); }); });

    D.ordre.forEach(function(s,i){
      var sec=salle(s.id); if(!sec) return;
      /* Le fond de la salle : une matière, pilotée par la POSITION de
         lecture (`--sp`) — jamais une boucle, donc aucun contrôle de
         pause à prévoir (WCAG 2.2.2), et rien du tout sous
         reduced-motion. */
      if(!sec.querySelector(':scope > .ds-bg')){
        var bg=document.createElement('div');
        bg.className='ds-bg'; bg.setAttribute('data-bg',s.id); bg.setAttribute('aria-hidden','true');
        sec.insertBefore(bg,sec.firstChild);
      }
      /* Le numéro entre DANS le titre : il porte l'ordre, qui est
         l'argument du dossier (on part de la déduction, on finit aux
         références). Une rubrique posée au-dessus du titre ne disait rien
         que le titre ne dise déjà. */
      var h2=sec.querySelector('.panel-head h2.sec');
      if(h2&&!h2.querySelector('.ds-no')){
        if(!h2.id) h2.id='dos-h-'+s.id;
        h2.insertAdjacentHTML('afterbegin','<span class="ds-no">'+ROM[i]+'</span> ');
      }
      /* La nature : ce qu'on fait ici. C'est la seule chose qui manquait
         avant d'entrer — « à manipuler » n'est pas « à lire ». */
      var head=sec.querySelector('.panel-head');
      if(head&&s.nature&&!sec.querySelector(':scope > .ds-nat')){
        var n=document.createElement('p');
        n.className='ds-nat';
        n.innerHTML=icone(s.nature)+'<span>'+esc(s.nature)+'</span>';
        head.insertAdjacentElement('afterend',n);
      }
      /* Le pied : la salle d'avant, la salle d'après. On sort d'une salle
         par où l'on est entré, ou par la suivante — jamais dans le vide. */
      if(!sec.querySelector(':scope > .ds-foot')){
        var f=document.createElement('nav');
        f.className='ds-foot'; f.setAttribute('aria-label','Salles voisines du dossier');
        var prev=D.ordre[i-1], next=D.ordre[i+1];
        f.innerHTML=(prev?'<button type="button" class="ds-go ds-prev" data-goto="'+esc(prev.id)+'">'
            +'<span class="ds-go-k">'+ROM[i-1]+' · précédente</span>'
            +'<span class="ds-go-t">'+esc(prev.label)+'</span></button>':'<span></span>')
          +(next?'<button type="button" class="ds-go ds-next" data-goto="'+esc(next.id)+'">'
            +'<span class="ds-go-k">'+ROM[i+1]+' · suivante</span>'
            +'<span class="ds-go-t">'+esc(next.label)+'</span></button>':'<span></span>');
        sec.appendChild(f);
        f.querySelectorAll('[data-goto]').forEach(function(b){
          b.addEventListener('click',function(){ show(b.dataset.goto,{focus:true}); });
        });
      }
    });

    /* Le repère de lecture DANS la salle, et le fond qui la suit : un
       seul passage par image, gardé par comparaison. */
    var q=false;
    function paint(){
      q=false;
      if(!D||D.box.hidden||!D.cur) return;
      var sec=salle(D.cur); if(!sec) return;
      var r=sec.getBoundingClientRect(), vh=window.innerHeight||0;
      var run=r.height-vh;
      var f=run>8?Math.min(1,Math.max(0,(D.offset()-r.top)/run)):1;
      var rail=byId('dosRail');
      if(rail){ var v='scaleX('+f.toFixed(4)+')'; if(rail.style.transform!==v) rail.style.transform=v; }
      var sp=(f).toFixed(3);
      if(sec.dataset.sp!==sp){ sec.dataset.sp=sp; sec.style.setProperty('--sp',sp); }
    }
    function ping(){ if(q)return; q=true; requestAnimationFrame(paint); }
    document.addEventListener('scroll',ping,{passive:true,capture:true});
    window.addEventListener('resize',ping);
    D.paint=paint;

    /* Le conteneur s'ouvre sans qu'aucun défilement n'ait lieu : on
       remesure à ce moment-là (« le piège de la mesure unique »). */
    if(window.MutationObserver)
      new MutationObserver(function(){ paint(); }).observe(D.box,{attributes:true,attributeFilter:['hidden']});

    show(D.ordre[0].id,{silencieux:true,noScroll:true});
    requestAnimationFrame(centrePastille);
    setTimeout(centrePastille,400);
    window.addEventListener('load',centrePastille);
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(centrePastille);
    return D;
  }

  /* Afficher une salle. C'est l'entrée unique : la barre, le pied, les
     liens croisés et les liens profonds passent tous par là. */
  function show(id,opt){
    if(!D) return;
    opt=opt||{};
    var trouve=null;
    for(var i=0;i<D.ordre.length;i++) if(D.ordre[i].id===id){ trouve=D.ordre[i]; break; }
    if(!trouve) return;
    var neuve=(D.cur!==id);
    D.cur=id;

    D.ordre.forEach(function(s){
      var el=salle(s.id); if(!el) return;
      el.hidden=(s.id!==id);
      if(s.id!==id) el.style.removeProperty('--sp');
    });
    D.pills.forEach(function(b){ b.classList.toggle('active',b.dataset.go===id); });
    centrePastille();
    var n=byId('dosCountN');
    if(n) n.textContent=String(D.ordre.indexOf(trouve)+1);

    /* Le motif ARIA des onglets : la barre est UN arrêt de tabulation, on
       circule aux flèches, et chaque salle est le panneau de sa pilule. */
    tabsA11y();

    if(D.onShow) { try{ D.onShow(id); }catch(e){} }

    if(!opt.noScroll){
      var y=D.box.getBoundingClientRect().top+window.scrollY-D.offset();
      window.scrollTo({top:Math.max(0,y),behavior:(opt.smooth&&!rm())?'smooth':'instant'});
    }
    if(opt.focus){
      var sec=salle(id);
      if(sec){ if(!sec.hasAttribute('tabindex')) sec.tabIndex=-1; sec.focus({preventScroll:true}); }
    }
    /* L'adresse suit la salle : un dossier ouvert se partage. Les hash du
       contrat (#labo, #chrono…) sont exactement ceux-là. */
    if(neuve&&!opt.silencieux){
      try{ history.replaceState(null,'','#'+id); }catch(e){}
      if(window.SHELL&&SHELL.announce) SHELL.announce(trouve.label+' — salle '
        +(D.ordre.indexOf(trouve)+1)+' sur '+D.ordre.length+'.');
    }
    if(D.paint){ D.paint(); requestAnimationFrame(D.paint); }
    requestAnimationFrame(centrePastille);
    setTimeout(centrePastille,400);
  }

  /* Le motif ARIA des onglets vient de shell.js, qui peut n'être pas
     encore chargé quand la page construit son dossier : on repose les
     rôles dès qu'il arrive, sans quoi les salles restaient des <section>
     anonymes pour un lecteur d'écran. */
  function tabsA11y(){
    if(!D) return;
    if(window.SHELL&&SHELL.tabs){ SHELL.tabs(D.nav,function(b){ return b.dataset.go; }); return; }
    if(D.attente) return;
    D.attente=true;
    var n=0,t=setInterval(function(){
      if(window.SHELL&&SHELL.tabs){ clearInterval(t); D.attente=false; tabsA11y(); }
      else if(++n>40){ clearInterval(t); D.attente=false; }
    },100);
  }

  /* La barre défile horizontalement dès qu'elle ne tient plus (390 px) :
     la pilule active doit être RAMENÉE dans le champ, sinon on ne voit pas
     où l'on est. Et elle se remesure APRÈS COUP — au premier rendu la barre
     ne déborde pas encore (les polices ne sont pas arrivées) et le calcul
     rendait zéro : c'est le piège de la mesure unique, déjà payé sur le
     catalogue de l'accueil et sur la tranche de l'abécédaire. */
  function centrePastille(){
    if(!D) return;
    var b=D.nav.querySelector('.atl-dnav.active'); if(!b) return;
    var p=b.parentNode;
    if(!p||p.scrollWidth<=p.clientWidth+2) return;
    var l=b.offsetLeft, r=l+b.offsetWidth;
    if(l<p.scrollLeft+8) p.scrollLeft=l-8;
    else if(r>p.scrollLeft+p.clientWidth-8) p.scrollLeft=r-p.clientWidth+8;
  }

  function current(){ return D?D.cur:null; }

  window.DossierAtelier={install:install, show:show, current:current};
})();
