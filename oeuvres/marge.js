/* ══════════════════════════════════════════════════════════════════════
   LA MARGE « DANS CE CHAPITRE » — trois gestes (mission `marge-trois-gestes`)

   Un seul gabarit pour les trois ateliers. Chaque page RASSEMBLE ses
   données (résumé, notions, instrument, marche, dates, passages) et les
   passe ici ; ce fichier seul écrit le balisage. Les trois `renderMarge`
   avaient divergé — c'est ce qui arrive à trois copies d'un composant.

   L'ordre n'est plus celui des TYPES de contenu mais celui de ce que le
   lecteur veut faire :
   - COMPRENDRE — le résumé, la page qui explique, les notions, les dates.
     On lit, ou l'on sort vers une page (→).
   - MANIPULER — instrument, marche du cheminement, exploration. Tous
     s'ouvrent dans le tiroir, sans quitter la page (icône de panneau).
   - VOS NOTES — un pied collant, toujours visible : les passages, les deux
     panneaux de notes, le carnet.

   Chargé SANS `defer`, dans le <head> : les pages appellent renderMarge
   pendant leur propre exécution, le gabarit doit déjà exister.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  if(window.MargeAtelier) return;
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  /* Première lettre en capitale : les libellés du laboratoire sont écrits
     pour suivre « Modèle » (« Modèle journée de travail ») ; seuls, ils
     sortaient en minuscule. */
  function cap(s){ s=String(s||''); return s.charAt(0).toUpperCase()+s.slice(1); }

  /* Deux icônes, et deux seulement : elles disent ce que fait le clic
     AVANT qu'on clique. La flèche : on va sur une autre page. Le panneau :
     cela s'ouvre à côté du texte. */
  var IC_PAGE='<svg class="mg-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var IC_TIROIR='<svg class="mg-ic" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9.5 3v10" stroke="currentColor" stroke-width="1.4"/><path d="M11 6.5h1.6M11 9h1.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';

  function row(tag,attrs,k,t,ic,extra){
    return '<'+tag+' class="mg-row'+(extra?' '+extra:'')+'" '+attrs+'>'
      +'<span class="mg-row-txt">'+(k?'<span class="mg-row-k">'+esc(k)+'</span>':'')
      +'<span class="mg-row-t">'+esc(t)+'</span></span>'+ic+'</'+tag+'>';
  }

  /* d = {
       label, rn, title,
       sum (HTML de confiance, écrit par le site), explain:{href,title},
       notions:[{h,n}], dates:[{year,title,desc}],
       tools:[{kind,target,k,t}],
       notes:{list:[annotation], where, pub}
     }
     on = {anno(a), drawer(kind,target), fab(id)} */
  function render(el,d,on){
    if(!el) return;
    on=on||{};
    var h='<div class="mg-head"><h2 class="atl3-lab">'+esc(d.label)
      +(d.rn?' <em>'+esc(d.rn)+'</em>':'')+'</h2>'
      +(d.title?'<p class="mg-title">'+esc(d.title)+'</p>':'')+'</div>';

    h+='<div class="mg-flow">';

    /* ── COMPRENDRE ── */
    var c='';
    if(d.sum) c+='<div class="atl3-m-sum" id="atl3Sum">'+d.sum+'</div>'
      +'<button type="button" class="atl3-m-more" data-more="atl3Sum" aria-expanded="false">Lire la suite</button>';
    if(d.explain) c+=row('a','href="'+esc(d.explain.href)+'"','Une page pour ce chapitre',
      d.explain.title,IC_PAGE,'mg-lead');
    if(d.notions&&d.notions.length)
      c+='<p class="mg-sub">Les notions</p><ul class="mg-chips">'
        +d.notions.map(function(e){return '<li><a href="'+esc(e.h)+'">'+esc(e.n)+'</a></li>';}).join('')
        +'</ul>';
    if(d.dates&&d.dates.length)
      c+='<p class="mg-sub">Ce qui s\'est passé</p><ul class="atl3-m-dates">'+d.dates.map(function(e,i){
        return '<li><button type="button" class="atl3-m-date" data-ev="'+i+'" aria-expanded="false">'
          +'<span class="atl3-m-y">'+esc(e.year)+'</span>'
          +'<span class="atl3-m-evt">'+esc(e.title)+'</span></button>'
          +'<p class="atl3-m-desc" hidden>'+e.desc+'</p></li>';}).join('')+'</ul>';
    if(c) h+='<section class="atl3-m-sec mg-grp"><h3 class="mg-grp-h">Comprendre</h3>'+c+'</section>';

    /* ── MANIPULER ── */
    if(d.tools&&d.tools.length)
      h+='<section class="atl3-m-sec mg-grp"><h3 class="mg-grp-h">Manipuler'
        +'<span class="mg-grp-hint">sans quitter la page</span></h3>'
        +d.tools.map(function(t){
          return row('button','type="button" data-drawer="'+esc(t.target)+'" data-kind="'+esc(t.kind)+'"',
            t.k,cap(t.t),IC_TIROIR);}).join('')
        +'</section>';

    h+='<div class="atl3-marge-fade" aria-hidden="true"><span>Défiler</span></div></div>';

    /* ── VOS NOTES — le pied collant ── */
    var n=d.notes||{}, list=n.list||[], nn=list.length;
    var withNote=list.filter(function(a){return a.note;}).length;
    h+='<section class="mg-notes'+(nn?' has-pass':'')+'" aria-labelledby="mgNotesH">'
      +'<div class="mg-notes-top"><h3 class="mg-grp-h" id="mgNotesH">Vos notes'
      +(nn?'<span class="mg-notes-n">'+nn+' passage'+(nn>1?'s':'')+'</span>':'')+'</h3>'
      +'<a class="mg-carnet" href="carnet">Carnet'+IC_PAGE+'</a></div>';
    /* UN passage, le dernier : le pied est toujours à l'écran, il ne doit
       pas manger la colonne. Mesuré avec deux passages, il faisait 250 px et
       ne laissait voir de « Manipuler » que son titre. Les autres sont à un
       clic, dans « Mes notes ». */
    if(nn){
      h+='<ul class="mg-pass">'+list.slice(0,1).map(function(a,i){
        return '<li><button type="button" class="mg-pass-item" data-anno="'+i+'">'
          +'<span class="atl3-pass-bar c-'+esc(a.color)+'"></span>'
          +'<span class="mg-pass-q">'+esc(String(a.quote||'').slice(0,110))+'</span>'
          +(a.note?'<span class="mg-pass-note">'+esc(String(a.note).slice(0,60))+'</span>':'')
          +'</button></li>';}).join('')+'</ul>'
        +'<p class="mg-pass-sub">'+esc(n.where||'')
        +(withNote?' · '+withNote+' avec note':'')+(nn>1?' · '+(nn-1)+' autre'+(nn>2?'s':''):'')+'</p>';
    }else{
      h+='<p class="mg-pass-empty">Sélectionnez une phrase du texte pour la surligner.</p>';
    }
    h+='<div class="mg-notes-acts">'
      +'<button type="button" class="atl3-m-nb" data-fab="notesFab">Mes notes</button>'
      +'<button type="button" class="atl3-m-nb" data-fab="pubFab">Partagées'
      +(n.pub?' <span class="mg-nb-n">'+esc(n.pub)+'</span>':'')+'</button></div></section>';

    el.innerHTML=h;

    el.querySelectorAll('[data-more]').forEach(function(b){b.addEventListener('click',function(){
      var t=document.getElementById(b.dataset.more); if(!t)return;
      var open=t.classList.toggle('is-open');
      b.textContent=open?'Replier':'Lire la suite';
      b.setAttribute('aria-expanded',open?'true':'false');
    });});
    el.querySelectorAll('[data-ev]').forEach(function(b){b.addEventListener('click',function(){
      var p=b.parentNode.querySelector('.atl3-m-desc'); if(!p)return;
      p.hidden=!p.hidden; b.classList.toggle('is-open',!p.hidden);
      b.setAttribute('aria-expanded',p.hidden?'false':'true');
    });});
    el.querySelectorAll('[data-drawer]').forEach(function(b){b.addEventListener('click',function(){
      if(on.drawer) on.drawer(b.dataset.kind,b.dataset.drawer);});});
    el.querySelectorAll('[data-anno]').forEach(function(b){b.addEventListener('click',function(){
      var a=list[+b.dataset.anno]; if(a&&on.anno) on.anno(a);});});
    el.querySelectorAll('[data-fab]').forEach(function(b){b.addEventListener('click',function(){
      if(on.fab) on.fab(b.dataset.fab);});});
    fade(el);
  }

  /* La partie qui défile est `.mg-flow`, plus la colonne entière : le pied
     de notes reste en place. Les classes vivent toujours sur la marge. */
  function fade(el){
    el=el||document.getElementById('atl3Marge'); if(!el)return;
    var f=el.querySelector('.mg-flow'); if(!f)return;
    var peut=f.scrollHeight>f.clientHeight+4;
    el.classList.toggle('is-scrollable',peut);
    el.classList.toggle('is-end',peut&&f.scrollTop+f.clientHeight>=f.scrollHeight-6);
  }
  /* `scroll` ne remonte pas : on l'écoute en CAPTURE sur le document, ce qui
     survit aux réécritures de la marge. */
  document.addEventListener('scroll',function(e){
    var t=e.target; if(t&&t.classList&&t.classList.contains('mg-flow')) fade();
  },true);
  window.addEventListener('resize',function(){ fade(); });

  window.MargeAtelier={render:render,fade:fade};
})();
