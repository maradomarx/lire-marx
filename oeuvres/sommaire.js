/* ══════════════════════════════════════════════════════════════════════
   LE SOMMAIRE — sections repliables (mission `sommaire-refonte`)

   Un seul gabarit pour les trois ateliers, comme la marge (marge.js) :
   chaque page RASSEMBLE ses sections, ce fichier écrit le balisage, tient
   l'état des sections ouvertes et du filtre, et déplace la marque de
   lecture sans rien reconstruire.

   Mesuré avant : les 33 chapitres du Capital tous déployés dans une liste
   de 2 345 px, huit visibles ; la colonne s'ouvrait au milieu, sur une
   ligne coupée ; 107 px de tête (libellé, pilule « Suivre ma progression »,
   filtre) avant la première ligne ; des titres de section en capitales sur
   deux lignes qui pesaient plus que les chapitres ; et sur les Manuscrits
   et le Manifeste une colonne de numéros qui répétait le numéro du GROUPE
   à chaque ligne (« I I I I »).

   Désormais chaque section tient sur une ligne ; seule celle qu'on lit est
   dépliée, et le plan entier tient dans la colonne. Une section qui ne
   contient qu'une entrée n'est pas un dépliant : c'est l'entrée.

   Chargé SANS `defer`, dans le <head> : les pages l'appellent pendant leur
   propre exécution.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  if(window.SommaireAtelier) return;
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  /* Le filtre ignore les accents et la casse : on tape « alienation ». */
  function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  var CHK='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CHEV='<svg class="sm-chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* L'état vit sur le nœud : la page réécrit le sommaire à chaque changement
     de session ou de progression, les sections qu'on a ouvertes à la main
     et le filtre en cours de frappe doivent y survivre. */
  function state(root){ return root._sm||(root._sm={open:{},closed:{},q:'',curSec:null}); }
  function keyOf(s,i){ return String(s.key!=null?s.key:i); }
  function secOf(d,g){
    for(var i=0;i<d.sections.length;i++){
      var s=d.sections[i];
      for(var j=0;j<s.items.length;j++) if(s.items[j].g===g) return keyOf(s,i);
    }
    return null;
  }
  /* Ouverte : la section qu'on lit (sauf si on l'a refermée), plus celles
     qu'on a ouvertes à la main. Pendant un filtrage, toutes. */
  function isOpen(st,key){
    if(st.q) return true;
    if(key===st.curSec) return !st.closed[key];
    return !!st.open[key];
  }

  /* Le nom du groupe REDIT-il le titre ? Oui si les mots qui portent le sens
     (plus de trois lettres) s'y retrouvent aux deux tiers : « Les communistes
     et les partis d'opposition » au-dessus de « Position des communistes
     vis-à-vis des partis d'opposition » ne disait rien de plus. */
  function redit(groupe,titre){
    if(!groupe) return true;
    var t=' '+norm(titre).replace(/[^a-z0-9]+/g,' ')+' ';
    var mots=norm(groupe).replace(/[^a-z0-9]+/g,' ').split(' ').filter(function(w){return w.length>3;});
    if(!mots.length) return norm(groupe)===norm(titre);
    var dedans=mots.filter(function(w){return t.indexOf(' '+w+' ')>=0;}).length;
    return dedans/mots.length>=0.66;
  }
  /* `kicker` : le nom du groupe d'une section à entrée unique, quand il ne
     redit pas le titre de l'entrée — sans lui, « II Le rapport de la
     propriété privée » perdait « Deuxième manuscrit ». */
  function item(it,cur,num,solo,kicker){
    var on=(it.g===cur);
    return '<button type="button" class="sm-it'+(it.done?' is-done':'')+(on?' is-cur':'')+'"'
      +' data-g="'+esc(it.g)+'" data-text="'+esc(norm(it.text||it.t))+'"'
      +(on?' aria-current="true"':'')+'>'
      +'<span class="sm-it-n">'+esc(num)+'</span>'
      +'<span class="sm-it-t">'+(kicker?'<span class="sm-it-k">'+esc(kicker)+'</span>':'')+esc(it.t)+'</span>'
      +'<span class="sm-it-st">'+(it.done?CHK:'')+'</span></button>';
  }

  /* d = {label, cur, sections:[{key, rn, t, items:[{g, n, t, done, text}]}],
          progress:{logged, n, total, word}, filter:{placeholder, none, found}|null}
     on = {open(g), login()} */
  function render(root,d,on){
    if(!root||!d) return;
    on=on||{};
    var st=state(root);
    root._smD=d; root._smOn=on;
    var cs=secOf(d,d.cur);
    if(cs!==st.curSec){ st.closed={}; st.curSec=cs; }
    var p=d.progress||{};
    var h='<div class="sm-head"><h2 class="atl3-lab">'+esc(d.label||'Le sommaire')+'</h2>'
      +(p.logged?'<span class="sm-prog">'+esc(p.n)+' / '+esc(p.total)+' '+esc(p.word||'lus')+'</span>':'')
      +'</div>';
    if(p.logged) h+='<span class="sm-bar" aria-hidden="true"><i style="width:'
      +Math.round(p.total?p.n/p.total*100:0)+'%"></i></span>';

    h+='<div class="sm-list" id="atl3TocList">';
    d.sections.forEach(function(s,si){
      var key=keyOf(s,si);
      if(s.items.length===1){
        h+='<div class="sm-sec sm-solo'+(key===st.curSec?' has-cur':'')+'" data-sec="'+esc(key)+'">'
          +item(s.items[0],d.cur,s.rn||'',true,redit(s.t,s.items[0].t)?'':s.t)+'</div>';
        return;
      }
      var open=isOpen(st,key);
      var nd=s.items.filter(function(x){return x.done;}).length;
      var hasN=s.items.some(function(x){return x.n;});
      var id='smS'+si;
      h+='<section class="sm-sec'+(open?' is-open':'')+(key===st.curSec?' has-cur':'')+'" data-sec="'+esc(key)+'">'
        +'<h3 class="sm-sec-h"><button type="button" class="sm-sec-b" aria-expanded="'+open+'" aria-controls="'+id+'">'
        +'<span class="sm-sec-rn">'+esc(s.rn||'')+'</span>'
        +'<span class="sm-sec-t"'+(String(s.t).length>44?' title="'+esc(s.t)+'"':'')+'>'+esc(s.t)+'</span>'
        +'<span class="sm-sec-c">'+(p.logged?nd+'/':'')+s.items.length+'</span>'+CHEV+'</button></h3>'
        +'<ul class="sm-items'+(hasN?'':' no-n')+'" id="'+id+'"'+(open?'':' hidden')+'>'
        +s.items.map(function(it){return '<li>'+item(it,d.cur,it.n||'',false)+'</li>';}).join('')
        +'</ul></section>';
    });
    h+='<p class="sm-none" hidden>'+esc((d.filter&&d.filter.none)||'Rien ne correspond.')+'</p></div>';

    /* Le pied : le filtre (seulement là où la liste est longue) et, sans
       session, l'invitation à suivre sa progression — un lien discret, plus
       une pilule en tête de colonne pour tout visiteur. */
    var foot='';
    if(d.filter) foot+='<input class="sm-filter" type="search" placeholder="'+esc(d.filter.placeholder)
      +'" aria-label="'+esc(String(d.filter.placeholder).replace(/…$/,''))+'">';
    if(!p.logged && on.login) foot+='<button type="button" class="sm-login">Suivre ma progression</button>';
    if(foot) h+='<div class="sm-foot">'+foot+'</div>';

    root.innerHTML=h;

    root.querySelectorAll('.sm-sec-b').forEach(function(b){b.addEventListener('click',function(){
      var key=b.closest('.sm-sec').getAttribute('data-sec');
      if(key===st.curSec) st.closed[key]=!st.closed[key]; else st.open[key]=!st.open[key];
      apply(root);
    });});
    root.querySelectorAll('.sm-it').forEach(function(b){b.addEventListener('click',function(){
      if(on.open) on.open(+b.getAttribute('data-g'));
    });});
    var lg=root.querySelector('.sm-login');
    if(lg) lg.addEventListener('click',function(){ if(on.login) on.login(); });
    var f=root.querySelector('.sm-filter');
    if(f){
      f.value=st.q;
      f.addEventListener('input',function(){ filter(root,f.value,true); });
      f.addEventListener('keydown',function(e){ if(e.key==='Escape'&&f.value){ e.stopPropagation(); f.value=''; filter(root,'',true); } });
      if(st.q) filter(root,st.q,false);
    }
    scrollCur(root);
  }

  function apply(root){
    var st=state(root);
    root.querySelectorAll('section.sm-sec').forEach(function(s){
      var key=s.getAttribute('data-sec'), open=isOpen(st,key);
      s.classList.toggle('is-open',open);
      s.classList.toggle('has-cur',key===st.curSec);
      var u=s.querySelector('.sm-items'); if(u) u.hidden=!open;
      var b=s.querySelector('.sm-sec-b'); if(b) b.setAttribute('aria-expanded',open?'true':'false');
    });
    root.querySelectorAll('.sm-solo').forEach(function(s){
      s.classList.toggle('has-cur',s.getAttribute('data-sec')===st.curSec);
    });
  }

  function filter(root,q,announce){
    var st=state(root), d=root._smD||{};
    st.q=norm(q).trim();
    var any=false;
    root.querySelectorAll('.sm-sec').forEach(function(s){
      var hit=false;
      s.querySelectorAll('.sm-it').forEach(function(b){
        var m=!st.q||b.getAttribute('data-text').indexOf(st.q)>=0;
        var li=b.parentNode.tagName==='LI'?b.parentNode:b;
        li.hidden=!m; if(m) hit=true;
      });
      s.hidden=!hit; if(hit) any=true;
    });
    var none=root.querySelector('.sm-none'); if(none) none.hidden=any;
    apply(root);
    if(announce && st.q && window.SHELL && SHELL.announce && d.filter)
      SHELL.announce(any?(d.filter.found||'Liste filtrée.'):(d.filter.none||'Rien ne correspond.'));
  }

  /* Le suivi de lecture change de chapitre : on déplace la marque et l'on
     déplie la section qu'on vient d'atteindre. RIEN n'est reconstruit — le
     filtre en cours de frappe et la position de la colonne survivent. */
  function setCurrent(root,g){
    if(!root||!root._smD) return;
    var st=state(root), d=root._smD;
    d.cur=g;
    root.querySelectorAll('.sm-it').forEach(function(b){
      var on=(+b.getAttribute('data-g')===g);
      b.classList.toggle('is-cur',on);
      if(on) b.setAttribute('aria-current','true'); else b.removeAttribute('aria-current');
    });
    var cs=secOf(d,g);
    if(cs!==st.curSec){ st.closed={}; st.curSec=cs; }
    apply(root);
    scrollCur(root);
  }

  /* Dans une colonne qui défile seule, on ramène la ligne courante dans le
     champ — sans jamais emporter la page. Dans la feuille, la liste ne
     défile pas pour son compte : rien à faire. */
  function scrollCur(root){
    var l=root.querySelector('.sm-list'), c=root.querySelector('.sm-it.is-cur');
    if(!l||!c||!l.getClientRects().length||l.scrollHeight<=l.clientHeight+4) return;
    var lr=l.getBoundingClientRect(), cr=c.getBoundingClientRect();
    if(cr.top>=lr.top&&cr.bottom<=lr.bottom) return;
    l.scrollTop=Math.max(0,l.scrollTop+(cr.top-lr.top)-l.clientHeight/2+c.offsetHeight/2);
  }

  window.SommaireAtelier={render:render,setCurrent:setCurrent};
})();
