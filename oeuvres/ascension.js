/* ══════════════════════════════════════════════════════════════════════
   L'ASCENSION — le cheminement des trois ateliers (mission `cheminement-clair`).
   Une CHAÎNE : chaque marche (rang, nom, ce qu'elle pose ou d'où elle vient),
   puis son NŒUD — ce qui fait passer à la suivante. Rien n'est replié : le
   pli piloté au défilement faisait remonter de 120 à 255 px la marche qu'on
   allait lire. À côté, le PLAN collant des marches dit où l'on est.

   Le mouvement ne touche jamais la mise en page ni l'opacité d'un texte : le
   fil se trace jusqu'à la ligne de lecture, la pastille atteinte se remplit,
   le nœud traversé s'éclaire et ses marques se tracent. Tout est fonction de
   la POSITION, donc réversible ; sans `.js-asc` (reduced-motion), tout est à
   l'état fini. Le plan est de l'ORIENTATION : il marche partout.

   API
     AscensionAtelier.html(steps, {close})  → balisage de la chaîne
       step = {t, plan?, pose?, lieu?, motor?, contra?, pass, passLabel?,
               links?:[{k, t, label, drawer}], color}
     AscensionAtelier.mount(root, {offset(), onSee(k, t, label)})
       root = .asc (contient .asc-chain et nav.asc-plan) → {go(n, flash)}
   Chargé SANS defer dans le <head> : les pages l'appellent pendant leur
   propre exécution.
   ══════════════════════════════════════════════════════════════════════ */
(function(){
  function mk(d){
    var p=d.map(function(x){return '<path pathLength="1" d="'+x+'"/>';}).join('');
    return '<svg class="asc-mk" viewBox="0 0 24 24" aria-hidden="true"><g class="asc-mk-b">'+p+'</g><g class="asc-mk-f">'+p+'</g></svg>';
  }
  var MK_CONTRA=mk(['M2.5 12h6.5','M6 8.5L9.5 12 6 15.5','M21.5 12H15','M18 8.5L14.5 12 18 15.5']);
  var MK_PASS=mk(['M5 3.5v9.5a4 4 0 0 0 4 4h9.5','M14.5 13l4 4-4 4']);
  var IC_TIROIR='<svg class="asc-ic" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3" width="12" height="10" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9.5 3v10" stroke="currentColor" stroke-width="1.4"/><path d="M11 6.5h1.6M11 9h1.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
  var IC_PAGE='<svg class="asc-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function attr(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');}

  function html(steps,o){
    o=o||{};
    var n=steps.length, out='<span class="asc-thread" aria-hidden="true"><span class="asc-head"></span></span>';
    steps.forEach(function(s,i){
      var k=i+1, last=k===n, one=!s.contra;
      var see=(s.links||[]).map(function(l){
        return '<button type="button" class="asc-go" data-k="'+attr(l.k)+'" data-t="'+attr(l.t||'')+'">'+(l.drawer?IC_TIROIR:IC_PAGE)+'<span>'+l.label+'</span></button>';
      }).join('');
      out+='<article class="asc-step" id="asc-'+k+'" data-step="'+k+'" data-plan="'+attr(s.plan||s.t)+'" style="--rung:'+s.color+'" aria-labelledby="asc-t'+k+'">'
        +'<span class="asc-num" aria-hidden="true">'+k+'</span>'
        +'<h3 class="asc-t" id="asc-t'+k+'" tabindex="-1"><span class="sr-only">Marche '+k+' : </span>'+s.t+'</h3>'
        +(s.lieu?'<p class="asc-lieu">'+s.lieu+'</p>':'')
        +(s.pose?'<p class="asc-pose">'+s.pose+'</p>':'')
        +(see?'<div class="asc-see"><span class="asc-see-lab">Voir à l\'œuvre</span>'+see+'</div>':'')
        +'<div class="asc-knot'+(one?' asc-knot--one':'')+'">'
          +(s.motor?'<p class="asc-motor">'+s.motor+(last?'':' <span aria-hidden="true">↓</span>')+'</p>':'')
          +(s.contra?'<p class="asc-f asc-contra">'+MK_CONTRA+'<span><span class="sr-only">La contradiction : </span>'+s.contra+'</span></p>':'')
          +'<p class="asc-f asc-pass">'+MK_PASS+'<span><span class="sr-only">'+(s.passLabel||'Ce qu\'elle force : ')+'</span>'+s.pass+'</span></p>'
        +'</div></article>';
    });
    if(o.close) out+='<p class="asc-close">'+MK_PASS+'<span>'+o.close+'</span></p>';
    return out;
  }

  function mount(root,o){
    o=o||{};
    var chain=root.querySelector('.asc-chain'), plan=root.querySelector('.asc-plan');
    if(!chain) return null;
    var steps=[].slice.call(chain.querySelectorAll('.asc-step'));
    var knots=steps.map(function(s){return s.querySelector('.asc-knot');});
    var N=steps.length;
    var offset=o.offset||function(){return 140;};

    if(plan&&!plan.querySelector('.asc-pl')){
      plan.innerHTML='<p class="asc-end">abstrait</p><ol class="asc-plan-list">'+steps.map(function(s){
        return '<li><button type="button" class="asc-pl" data-step="'+s.dataset.step+'" style="--rung:'+s.style.getPropertyValue('--rung')+'"><span class="asc-pl-dot" aria-hidden="true"></span><span class="asc-pl-t">'+attr(s.dataset.plan||'')+'</span></button></li>';
      }).join('')+'</ol><p class="asc-end">concret</p>';
    }
    if(plan&&o.ends){ var e=plan.querySelectorAll('.asc-end'); if(e[0])e[0].textContent=o.ends[0]; if(e[1])e[1].textContent=o.ends[1]; }
    var pls=plan?[].slice.call(plan.querySelectorAll('.asc-pl')):[];

    var motion=!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
    if(motion) root.classList.add('js-asc');

    function set(el,k,v){var x=v.toFixed(3);if(el.style.getPropertyValue(k)!==x)el.style.setProperty(k,x);}
    var cur0=0;
    function follow(){
      var r=chain.getBoundingClientRect(); if(!r.height||!N) return;
      var vh=window.innerHeight||document.documentElement.clientHeight, read=vh*0.46;
      var d0=steps[0].querySelector('.asc-num').getBoundingClientRect();
      var start=d0.top+d0.height/2-r.top;
      var draw=Math.max(start,Math.min(r.height,read-r.top));
      var cur=1;
      steps.forEach(function(st,i){
        var d=st.querySelector('.asc-num').getBoundingClientRect();
        var on=d.top+d.height/2<=read+1;
        if(on)cur=i+1;
        st.classList.toggle('is-on',on||i===0);
        if(motion&&knots[i]){
          var k=knots[i].getBoundingClientRect();
          set(knots[i],'--lit',Math.max(0,Math.min(1,(read-k.top)/Math.min(k.height,150))));
          set(knots[i],'--pass',Math.max(0,1-Math.abs(read-(k.top+k.height/2))/(k.height/2+70)));
        }
      });
      if(motion){
        chain.style.setProperty('--draw',Math.round(draw)+'px');
        chain.style.setProperty('--head',draw>start+2&&draw<r.height-2?'1':'0');
      }
      if(plan) plan.style.setProperty('--plan',(N>1?(cur-1)/(N-1):0).toFixed(3));
      if(cur!==cur0){ cur0=cur;
        pls.forEach(function(b,i){ var here=i+1===cur;
          b.classList.toggle('is-here',here); b.classList.toggle('is-past',i+1<cur);
          if(here)b.setAttribute('aria-current','step'); else b.removeAttribute('aria-current'); });
      }
    }
    var queued=false;
    function queue(){ if(queued)return; queued=true; requestAnimationFrame(function(){queued=false;follow();}); }
    window.addEventListener('scroll',queue,{passive:true});
    window.addEventListener('resize',queue);
    /* la salle s'affiche par son attribut `hidden` : on remesure à
       l'ouverture, puis après coup (la mesure unique est un piège déjà payé) */
    var mo=new MutationObserver(function(){queue();setTimeout(follow,400);});
    for(var a=root.parentElement;a;a=a.parentElement){
      if(a.id==='deriv'||a.id==='dossier') mo.observe(a,{attributes:true,attributeFilter:['hidden']});
    }
    window.addEventListener('load',function(){setTimeout(follow,0);});
    if(document.fonts&&document.fonts.ready) document.fonts.ready.then(follow);

    function go(n,flash){
      var st=chain.querySelector('#asc-'+n)||steps[n-1];
      if(!st||!st.getClientRects().length) return;
      var y=st.getBoundingClientRect().top+window.scrollY-offset()-18;
      window.scrollTo({top:Math.max(0,y),behavior:'instant'});
      var h=st.querySelector('.asc-t'); if(h) h.focus({preventScroll:true});
      if(flash){ st.classList.add('flash'); setTimeout(function(){st.classList.remove('flash');},1600); }
      follow();
    }
    if(plan) plan.addEventListener('click',function(e){ var b=e.target.closest('.asc-pl'); if(b) go(+b.dataset.step); });
    chain.addEventListener('click',function(e){
      var b=e.target.closest('.asc-go'); if(!b||!o.onSee) return;
      o.onSee(b.dataset.k,b.dataset.t,b.textContent.trim());
    });
    follow();
    return {go:go, follow:follow};
  }

  function color(t){ var a=[57,89,107],b=[213,64,47];
    return 'rgb('+a.map(function(v,k){return Math.round(v+(b[k]-v)*t);}).join(',')+')'; }

  window.AscensionAtelier={html:html, mount:mount, color:color};
})();
