(function(){
  if(window.Reading) return;
  var SKEY='liremarx.read.v1';
  var DEF={theme:'paper',fs:1.04,lh:1.72,width:760,align:'justify',font:'standard',focus:false,rate:1,voice:'',gloss:false};
  var S=loadS();
  function loadS(){try{var o=JSON.parse(localStorage.getItem(SKEY)||'{}');return Object.assign({},DEF,o);}catch(e){return Object.assign({},DEF);}}
  function saveS(){try{localStorage.setItem(SKEY,JSON.stringify(S));}catch(e){}}
  function esc(s){return (s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}


  var fontsLoaded={};
  function ensureFont(id){
    if(!id||id==='standard'||fontsLoaded[id])return; fontsLoaded[id]=true;
    var urls={
      atkinson:'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap',
      lexend:'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;700&display=swap',
      opendyslexic:'https://cdn.jsdelivr.net/npm/@fontsource/opendyslexic@5/400.css'
    };
    var href=urls[id]; if(!href)return;
    var l=document.createElement('link'); l.rel='stylesheet'; l.href=href; document.head.appendChild(l); }

  /* ---- état ---- */
  var cur=null;            // {readerEl, ws, num, n, title, paras:[]}
  var synth=('speechSynthesis' in window)?window.speechSynthesis:null;
  var voices=[];
  function loadVoices(){ if(!synth)return; try{voices=synth.getVoices()||[];}catch(e){voices=[];} }
  if(synth){ loadVoices(); try{ synth.onvoiceschanged=function(){ loadVoices(); if(cur)renderVoiceSelect(); }; }catch(e){} }
  function frVoices(){ return voices.filter(function(v){return /^fr/i.test(v.lang);}); }

  var A={playing:false,stopping:false,queue:null,qi:0,curpi:-1};

  /* ---- application des réglages ---- */
  function applyTo(r){
    if(!r)return;
    r.classList.add('rd-on');
    r.classList.remove('theme-paper','theme-sepia','theme-dark','align-left','font-atkinson','font-lexend','font-opendyslexic','focus-on');
    r.classList.add('theme-'+S.theme);
    if(S.align==='left') r.classList.add('align-left');
    if(S.font&&S.font!=='standard'){ ensureFont(S.font); r.classList.add('font-'+S.font); }
    if(S.focus) r.classList.add('focus-on');
    r.style.setProperty('--rd-fs', S.fs.toFixed(2)+'rem');
    r.style.setProperty('--rd-lh', S.lh.toFixed(2));
    r.style.maxWidth = S.width+'px';
  }

  /* ---- audio ---- */
  function clearSpeak(){ if(cur&&cur.ws) cur.ws.querySelectorAll('p.rd-speak').forEach(function(p){p.classList.remove('rd-speak');}); }
  function clearSent(){
    if(!cur||!cur.ws)return;
    cur.ws.querySelectorAll('span.rd-sent-on').forEach(function(s){
      var p=s.parentNode; if(!p)return; while(s.firstChild)p.insertBefore(s.firstChild,s); p.removeChild(s);
    });
    try{cur.ws.normalize();}catch(e){}
  }
  function wrapRangeIn(p,start,end,cls){
    var w=document.createTreeWalker(p,window.NodeFilter.SHOW_TEXT,null), n, pos=0, snap=[];
    while(n=w.nextNode()){ snap.push({node:n,pos:pos}); pos+=n.nodeValue.length; }
    var made=[];
    snap.forEach(function(it){
      var len=it.node.nodeValue.length, a=it.pos, b=it.pos+len;
      var s=Math.max(start,a)-a, e=Math.min(end,b)-a;
      if(e<=s)return;
      var node=it.node;
      if(s>0)node=node.splitText(s);
      if(e-s<node.nodeValue.length)node.splitText(e-s);
      var span=document.createElement('span'); span.className=cls;
      node.parentNode.insertBefore(span,node); span.appendChild(node);
      made.push(span);
    });
    return made;
  }
  function voiceScore(v){
    var n=(v.name||'').toLowerCase(), s=0;
    if(/google/.test(n)) s+=120;
    if(/siri/.test(n)) s+=95;
    if(/natural|neural|wavenet|studio|premium|enhanced|amélior/.test(n)) s+=80;
    if(v.localService===false) s+=60;            // voix « en ligne » = en général bien plus naturelles
    if(/thomas|aurélie|amélie|audrey|marie|julie|paul|hortense|chantal|nicolas/.test(n)) s+=25;
    if(/^fr-fr/i.test(v.lang||'')) s+=10;
    if(/compact|eloquence|espeak|pico|robot/.test(n)) s-=70;  // voix locales très synthétiques
    return s;
  }
  function bestVoice(){
    var fv=frVoices(); if(!fv.length)return null;
    return fv.slice().sort(function(a,b){return voiceScore(b)-voiceScore(a);})[0];
  }
  function pickVoice(){
    if(S.voice){ var m=voices.filter(function(v){return v.voiceURI===S.voice||v.name===S.voice;})[0]; if(m)return m; }
    return bestVoice();
  }
  function buildQueue(){
    var q=[];
    cur.paras.forEach(function(p,pi){
      var raw=p.textContent||''; if(!raw.trim())return;
      var re=/[^.!?…]+[.!?…]+|[^.!?…]+$/g, mm;
      while((mm=re.exec(raw))){
        var txt=mm[0].replace(/\s+/g,' ').trim();
        if(txt) q.push({pi:pi,start:mm.index,end:mm.index+mm[0].length,text:txt});
      }
    });
    return q;
  }
  function speakNext(){
    if(!A.playing) return;
    if(!synth||!cur||A.qi>=A.queue.length){ stopAudio(); return; }
    var item=A.queue[A.qi];
    var p=cur.paras[item.pi];
    if(item.pi!==A.curpi){ A.curpi=item.pi; clearSpeak(); if(p)p.classList.add('rd-speak'); }
    clearSent();
    var made = p ? wrapRangeIn(p,item.start,item.end,'rd-sent-on') : [];
    if(made[0]){ try{made[0].scrollIntoView({behavior:'smooth',block:'center'});}catch(e){} }
    var u=new window.SpeechSynthesisUtterance(item.text);
    u.lang='fr-FR'; var v=pickVoice(); if(v)u.voice=v; u.rate=S.rate;
    u.onend=function(){ if(A.stopping){A.stopping=false;return;} if(A.playing){ A.qi++; speakNext(); } };
    u.onerror=function(){ if(A.playing){ A.qi++; speakNext(); } };
    A.stopping=false; try{synth.speak(u);}catch(e){}
  }
  function playAudio(){
    if(!synth||!cur)return;
    if(A.playing)return;
    if(!A.queue||!A.queue.length){ A.queue=buildQueue(); A.qi=0; A.curpi=-1; }
    if(!A.queue.length)return;
    A.playing=true; speakNext(); setAudioBtn();
  }
  /* PICTOGRAMMES DESSINÉS (mission `mobile-lecture`). Sous 600 px la barre ne
     montre que des pictogrammes, et « Suivant » et « Écouter » portaient le
     MÊME glyphe ▶ : deux boutons voisins indiscernables. Suivant/Précédent
     sont des chevrons, Écouter un haut-parleur. Toujours aria-hidden : le
     nom accessible est le libellé du bouton. */
  var ICONS={
    prev:'<path d="M10 3 5 8l5 5"/>',
    next:'<path d="m6 3 5 5-5 5"/>',
    ecoute:'<path d="M2.5 6h2.5l3.5-3v10L5 10H2.5z"/><path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.5a6.3 6.3 0 0 1 0 9"/>',
    pause:'<path d="M5.5 3.5v9M10.5 3.5v9"/>',
    toc:'<path d="M5.5 4h8M5.5 8h8M5.5 12h8"/><path d="M2.5 4h.01M2.5 8h.01M2.5 12h.01" stroke-width="2.2"/>',
    notes:'<path d="M3.5 2.5h6l3 3v8h-9z"/><path d="M6 8h4.5M6 10.5h3"/>'
  };
  function IC(n,cls){ return '<span class="rd-ic'+(cls?' '+cls:'')+'" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+ICONS[n]+'</svg></span>'; }
  function pauseAudio(){ A.playing=false; A.stopping=true; try{if(synth)synth.cancel();}catch(e){} clearSent(); setAudioBtn(); }
  function stopAudio(){ A.playing=false; A.stopping=true; A.queue=null; A.qi=0; A.curpi=-1; try{if(synth)synth.cancel();}catch(e){} clearSent(); clearSpeak(); setAudioBtn(); }
  function setAudioBtn(){
    if(!cur)return; var b=cur.readerEl.querySelector('[data-rd="audio"]'); if(!b)return;
    /* Le libellé est enveloppé : sous 600 px l'atelier ne montre que le
       pictogramme, et le nom accessible doit rester « Pause » ou « Écouter ». */
    b.innerHTML = A.playing ? IC('pause')+'<span class="rd-lbl"> Pause</span>' : IC('ecoute')+'<span class="rd-lbl"> Écouter</span>';
    b.classList.toggle('on', A.playing);
  }

  /* ---- progression ---- */
  function updateProgress(){
    if(!cur||!cur.ws)return;
    var bar=cur.readerEl.querySelector('.rd-progress > i'); if(!bar)return;
    var rect=cur.ws.getBoundingClientRect();
    var vh=window.innerHeight||document.documentElement.clientHeight;
    var total=rect.height-vh;
    var done = total>0 ? (-rect.top)/total : (rect.bottom<=vh?1:0);
    done=Math.max(0,Math.min(1,done));
    bar.style.width=(done*100).toFixed(1)+'%';
    var pb=bar.parentNode;
    if(pb&&pb.setAttribute)pb.setAttribute('aria-valuenow',Math.round(done*100));
  }
  window.addEventListener('scroll',updateProgress,{passive:true});
  window.addEventListener('resize',updateProgress,{passive:true});

  /* ---- sommaire ---- */
  function ensureHeadingIds(ws){ var i=0; ws.querySelectorAll('h2,h3,h4').forEach(function(h){ if(!h.id) h.id='rdh-'+(i++); }); }
  function tocHtml(ws){
    var hs=ws.querySelectorAll('h2,h3,h4');
    if(!hs.length) return '<div class="rd-note">Pas de sous-parties détectées dans ce chapitre.</div>';
    var h='<div class="rd-toclist">';
    hs.forEach(function(x){ var txt=(x.textContent||'').trim(); if(!txt)return;
      h+='<button class="rd-tocitem rd-'+x.tagName.toLowerCase()+'" data-goto="'+x.id+'">'+esc(txt)+'</button>'; });
    return h+'</div>';
  }

  /* ---- popovers ---- */
  function togglePop(r,name){
    var opening=false;
    r.querySelectorAll('.rd-pop').forEach(function(p){
      if(p.getAttribute('data-pop')===name){ opening=p.hidden; p.hidden=!p.hidden; }
      else p.hidden=true;
    });
    r.querySelectorAll('.rd-row [data-rd]').forEach(function(b){
      var nm=b.getAttribute('data-rd');
      if(b.hasAttribute('aria-expanded')){
        var pop=r.querySelector('[data-pop="'+nm+'"]');
        b.setAttribute('aria-expanded', pop && !pop.hidden ? 'true' : 'false');
      }
      if(nm==='audio'||nm==='gloss')return; // états "on" persistants (lecture / glossaire actif)
      b.classList.toggle('on', nm===name && opening);
    });
  }

  /* ---- panneau Réglages (re-rendu à chaque changement) ---- */
  function renderSet(r){
    var box=r.querySelector('[data-pop="set"]'); if(!box)return;
    /* Les groupes segmentés portaient l'état par la SEULE classe .on :
       invisible pour une aide technique. aria-pressed l'expose, et
       role=group + aria-label rattachent le groupe à son intitulé, qui
       n'était qu'un <span> décoratif. WCAG 4.1.2. */
    function seg(name,opts){ // opts: [[val,label],...]
      return '<div class="rd-seg" role="group" aria-label="'+segLab(name)+'" data-seg="'+name+'">'+opts.map(function(o){
        var on = (''+stateVal(name))===(''+o[0]);
        return '<button type="button" data-set="'+name+'" data-v="'+o[0]+'" aria-pressed="'+(on?'true':'false')+'"'+(on?' class="on"':'')+'>'+o[1]+'</button>';
      }).join('')+'</div>';
    }
    function segLab(n){
      return n==='theme'?'Thème':n==='align'?'Alignement':n==='font'?'Police':n==='focus'?'Mode focus':n==='gloss'?'Mots du glossaire':n;
    }
    /* Les huit boutons − / + n'avaient pour nom accessible que « − » ou
       « + » : huit contrôles indiscernables. */
    function stepRow(lab,name,disp){
      return '<div class="rd-setrow"><span class="lab" id="rdlab-'+name+'">'+lab+'</span><span class="rd-step">'
        +'<button type="button" class="rd-mini" data-dec="'+name+'" aria-label="Diminuer : '+lab.toLowerCase()+'"><span aria-hidden="true">−</span></button>'
        +'<span class="rd-val" data-val="'+name+'" role="status" aria-live="polite" aria-atomic="true">'+disp+'</span>'
        +'<button type="button" class="rd-mini" data-inc="'+name+'" aria-label="Augmenter : '+lab.toLowerCase()+'"><span aria-hidden="true">+</span></button></span></div>';
    }
    function stateVal(n){ return n==='theme'?S.theme : n==='align'?S.align : n==='font'?S.font : n==='focus'?(S.focus?1:0) : n==='gloss'?(S.gloss?1:0) : ''; }
    var h='<h5>Réglages de lecture</h5>';
    h+='<div class="rd-setrow"><span class="lab">Thème</span>'+seg('theme',[['paper','Atelier'],['sepia','Papier'],['dark','Nuit']])+'</div>';
    h+=stepRow('Taille du texte','fs',Math.round(S.fs*100/1.04)+' %');
    h+=stepRow('Interligne','lh',S.lh.toFixed(2));
    h+=stepRow('Largeur','width',S.width+' px');
    h+='<div class="rd-setrow"><span class="lab">Alignement</span>'+seg('align',[['justify','Justifié'],['left','À gauche']])+'</div>';
    h+='<div class="rd-setrow"><span class="lab">Police</span>'+seg('font',[['standard','Standard'],['atkinson','Atkinson'],['lexend','Lexend'],['opendyslexic','Dyslexie']])+'</div>';
    h+='<div class="rd-setrow"><span class="lab">Mode focus</span>'+seg('focus',[['0','Off'],['1','On']])+'</div>';
    h+='<div class="rd-setrow"><span class="lab">Mots du glossaire</span>'+seg('gloss',[['0','Off'],['1','On']])+'</div>';
    h+='<div class="rd-note">Le mode focus estompe tout sauf le paragraphe survolé (ou lu à voix haute). Les mots du glossaire se soulignent dans le texte et s\'expliquent au survol. Réglages mémorisés sur cet appareil.</div>';
    if(synth){
      h+='<h5>Écoute</h5>';
      h+='<div class="rd-setrow"><span class="lab" id="rdlab-rate">Vitesse de lecture</span><span class="rd-step">'
        +'<button type="button" class="rd-mini" data-rate="dn" aria-label="Diminuer : vitesse de lecture"><span aria-hidden="true">−</span></button>'
        +'<span class="rd-val" data-ratev role="status" aria-live="polite" aria-atomic="true">'+S.rate.toFixed(1)+'×</span>'
        +'<button type="button" class="rd-mini" data-rate="up" aria-label="Augmenter : vitesse de lecture"><span aria-hidden="true">+</span></button></span></div>';
      h+='<div class="rd-vwrap"></div>';
      h+='<div class="rd-note">Le surlignage suit le paragraphe lu. La qualité dépend des voix installées sur votre appareil.</div>';
    }
    box.innerHTML=h;
    if(synth){
      renderVoiceSelect();
      box.querySelectorAll('[data-rate]').forEach(function(b){ b.onclick=function(){
        S.rate=clamp(+(S.rate+(b.getAttribute('data-rate')==='up'?0.1:-0.1)).toFixed(1),0.6,1.8);
        saveS(); var v=box.querySelector('[data-ratev]'); if(v)v.textContent=S.rate.toFixed(1)+'×';
      };});
    }
    /* CHAQUE réglage terminait par renderSet(r), qui réécrit box.innerHTML :
       le bouton qu'on venait d'activer disparaissait, et le focus retombait
       sur <body>. Impossible d'agrandir le texte deux fois de suite sans
       re-tabuler tout le panneau. WCAG 2.4.3. On met donc à jour SEULEMENT
       ce qui change : l'état pressé du groupe, ou la valeur affichée. */
    function syncSeg(n){
      var g=box.querySelector('[data-seg="'+n+'"]');
      if(!g)return;
      g.querySelectorAll('[data-set]').forEach(function(x){
        var on=(''+stateVal(n))===(''+x.getAttribute('data-v'));
        x.classList.toggle('on',on);
        x.setAttribute('aria-pressed',on?'true':'false');
      });
    }
    function syncVal(n){
      var v=box.querySelector('[data-val="'+n+'"]');
      if(!v)return;
      v.textContent = n==='fs' ? Math.round(S.fs*100/1.04)+' %'
                    : n==='lh' ? S.lh.toFixed(2)
                    : S.width+' px';
    }
    box.querySelectorAll('[data-set]').forEach(function(b){ b.onclick=function(){
      var n=b.getAttribute('data-set'), v=b.getAttribute('data-v');
      if(n==='theme')S.theme=v; else if(n==='align')S.align=v;
      else if(n==='font')S.font=v; else if(n==='focus')S.focus=(v==='1');
      else if(n==='gloss'){ S.gloss=(v==='1'); if(S.gloss)wrapGloss(); else unwrapGloss(); }
      saveS(); applyTo(r); syncSeg(n);
    };});
    box.querySelectorAll('[data-dec],[data-inc]').forEach(function(b){ b.onclick=function(){
      var inc=b.hasAttribute('data-inc'); var n=b.getAttribute(inc?'data-inc':'data-dec');
      if(n==='fs')   S.fs=clamp(+(S.fs+(inc?0.06:-0.06)).toFixed(2),0.85,1.6);
      if(n==='lh')   S.lh=clamp(+(S.lh+(inc?0.08:-0.08)).toFixed(2),1.3,2.2);
      if(n==='width')S.width=clamp(S.width+(inc?60:-60),560,1040);
      saveS(); applyTo(r); syncVal(n); updateProgress();
    };});
  }
  function clamp(x,a,b){ return Math.max(a,Math.min(b,x)); }

  /* ---- voix ---- */
  function renderVoiceSelect(){
    if(!cur)return; var box=cur.readerEl.querySelector('.rd-vwrap'); if(!box)return;
    if(!synth){ box.innerHTML='<div class="rd-note">La synthèse vocale n’est pas disponible dans ce navigateur.</div>'; return; }
    var fv=frVoices().slice().sort(function(a,b){return voiceScore(b)-voiceScore(a);});
    var best=fv[0];
    var auto = best ? ('Auto — la plus naturelle : '+best.name+(best.localService===false?' (en ligne)':'')) : 'Voix par défaut';
    var opts='<option value="">'+esc(auto)+'</option>';
    fv.forEach(function(v){ opts+='<option value="'+esc(v.voiceURI||v.name)+'"'+((S.voice===(v.voiceURI||v.name))?' selected':'')+'>'+esc(v.name)+(v.localService===false?' · en ligne':'')+'</option>'; });
    var warn = fv.length
      ? '<div class="rd-note">La voix la plus humaine est choisie automatiquement. Les voix « en ligne » (Google sur Chrome, Siri/améliorées sur Mac et iPhone) sont de loin les plus naturelles — c’est dans Chrome que le français sonne le mieux.</div>'
      : '<div class="rd-note">Aucune voix française détectée : ouvrez la page dans Chrome (voix Google en ligne) ou installez une voix française améliorée dans les réglages de votre système pour une lecture naturelle.</div>';
    box.innerHTML='<div class="rd-setrow"><span class="lab" id="rdlab-voice">Voix</span><select class="rd-vsel" data-rd-voice aria-labelledby="rdlab-voice">'+opts+'</select></div>'+warn;
    var sels=box.querySelector('[data-rd-voice]');
    if(sels)sels.onchange=function(){ S.voice=sels.value; saveS(); };
  }

  /* ---- LA MARGE EN FEUILLE (mission `marge-mobile`, sept. 2026) ----
     Sous 1240 px la marge « Dans ce chapitre » n'est plus une colonne. Posée
     en dépliant au-dessus du texte, elle était hors de l'écran dès qu'on
     ouvrait un chapitre — et à des dizaines de milliers de pixels au milieu
     d'une section. Elle s'ouvre désormais en FEUILLE depuis la barre de
     lecture, qui colle : l'appareil vient au texte, où qu'on lise.
     Le nœud de la marge est DÉPLACÉ dans la feuille et remis à sa place à la
     fermeture (le motif du tiroir) : la page continue de le réécrire par son
     id quand le chapitre change, rien n'est cloné. */
  /* Deux sources depuis `sommaire-refonte` : la marge (sous 1240 px) et le
     sommaire (sous 900 px, où la colonne de gauche disparaît). Une seule
     feuille, un seul contrôleur ; `SH.src` dit laquelle est dedans. */
  var SH={box:null,scrim:null,body:null,mark:null,btn:null,open:false,src:null};
  var SH_MQ=window.matchMedia?matchMedia('(max-width:1240px)'):{matches:false};
  var SH_MQ_TOC=window.matchMedia?matchMedia('(max-width:900px)'):{matches:false};
  function sheetSrc(id){ var el=document.getElementById(id||'atl3Marge'); return el&&el.hasAttribute('data-sheet-lbl')?el:null; }
  function sheetBtnFor(id){ return document.querySelector('.atl3-mid .rd-btn[data-rd="'+(id==='atl3Toc'?'toc':'clear')+'"]'); }
  function sheetBuild(){
    if(SH.box) return;
    SH.scrim=document.createElement('div'); SH.scrim.className='atl3-sheet-scrim'; SH.scrim.hidden=true;
    SH.box=document.createElement('div'); SH.box.className='atl3-sheet'; SH.box.id='atl3Sheet'; SH.box.hidden=true;
    SH.box.setAttribute('role','dialog'); SH.box.setAttribute('aria-modal','true');
    SH.box.innerHTML='<div class="atl3-sheet-bar"><span class="atl3-sheet-grip" aria-hidden="true"></span>'
      +'<button type="button" class="atl3-sheet-x">Fermer</button></div><div class="atl3-sheet-body"></div>';
    SH.body=SH.box.querySelector('.atl3-sheet-body');
    document.body.appendChild(SH.scrim); document.body.appendChild(SH.box);
    SH.scrim.addEventListener('click',function(){ closeSheet(true); });
    SH.box.querySelector('.atl3-sheet-x').addEventListener('click',function(){ closeSheet(true); });
    /* Ce qui mène AU texte ou à une autre couche referme la feuille : aller
       au passage, ouvrir l'instrument dans le tiroir, ouvrir un panneau de
       notes, suivre un lien. Déplier « Lire la suite » ou une date, non. */
    /* En CAPTURE : cliquer une entrée du sommaire fait reconstruire le
       sommaire par la page, et en phase de bulle la cible n'était déjà plus
       dans la feuille — qui restait ouverte (mesuré à 375 px). On referme
       avant ; le chemin de l'événement est fixé, le clic arrive quand même. */
    SH.body.addEventListener('click',function(e){
      var t=e.target.closest('[data-drawer],[data-anno],[data-go],.atl3-m-nb,.sm-it,a[href]');
      if(t && SH.body.contains(t)) closeSheet(false);
    },true);
    SH.box.addEventListener('keydown',function(e){
      if(e.key!=='Tab') return;
      var f=[].filter.call(SH.box.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'),function(n){ return !n.disabled && n.getClientRects().length; });
      if(!f.length) return;
      var a=f[0], z=f[f.length-1];
      if(e.shiftKey && document.activeElement===a){ e.preventDefault(); z.focus(); }
      else if(!e.shiftKey && document.activeElement===z){ e.preventDefault(); a.focus(); }
    });
    /* Échap : la feuille est la couche du dessus. Écouté en CAPTURE sur la
       fenêtre, pour passer avant la page qui, elle, quitterait le plein écran. */
    window.addEventListener('keydown',function(e){
      if(SH.open && e.key==='Escape'){ e.preventDefault(); e.stopImmediatePropagation(); closeSheet(true); }
    },true);
    var onMq=function(){ if(SH.open && !(SH.src==='atl3Toc'?SH_MQ_TOC:SH_MQ).matches) closeSheet(false); };
    if(SH_MQ.addEventListener){ SH_MQ.addEventListener('change',onMq); SH_MQ_TOC.addEventListener('change',onMq); }
  }
  function openSheet(btn,id){
    id=id||'atl3Marge';
    var el=sheetSrc(id); if(!el) return;
    sheetBuild();
    if(SH.open){ closeSheet(true); return; }
    stopAudio();
    SH.btn=btn||null; SH.src=id;
    SH.mark=document.createComment(id);
    el.parentNode.insertBefore(SH.mark, el);
    SH.body.appendChild(el);
    SH.box.setAttribute('aria-label', el.getAttribute('aria-label')||'Dans ce chapitre');
    SH.box.hidden=false; SH.scrim.hidden=false; SH.open=true;
    document.body.classList.add('at3-sheet-on');
    SH.body.scrollTop=0;
    if(btn) btn.setAttribute('aria-expanded','true');
    var x=SH.box.querySelector('.atl3-sheet-x'); if(x) x.focus({preventScroll:true});
  }
  function closeSheet(restore){
    if(!SH.open) return;
    var el=document.getElementById(SH.src||'atl3Marge');
    if(el && SH.mark && SH.mark.parentNode){ SH.mark.parentNode.insertBefore(el, SH.mark); }
    if(SH.mark && SH.mark.parentNode) SH.mark.parentNode.removeChild(SH.mark);
    SH.mark=null; SH.box.hidden=true; SH.scrim.hidden=true; SH.open=false;
    document.body.classList.remove('at3-sheet-on');
    /* la barre a pu être reconstruite pendant que la feuille était ouverte */
    var b=sheetBtnFor(SH.src)||SH.btn; SH.src=null;
    /* preventScroll : le bouton vit dans une barre COLLANTE, et le
       scroll-padding-top de la lecture fait croire au navigateur qu'il est
       masqué — sans cela, rendre le focus déplaçait le lecteur dans le texte. */
    if(b){ b.setAttribute('aria-expanded','false'); if(restore) b.focus({preventScroll:true}); }
  }

  /* ---- « Notes » (téléphone) : les deux panneaux du shell ----
     Le compte vient du module qui POSSÈDE les notes (SHELL.annotations),
     jamais du libellé d'une pastille : une interface ne lit pas une autre
     interface. On ouvre le panneau en cliquant la vraie pastille, qui en
     tient l'état — la marge de l'atelier fait déjà ainsi. */
  function renderNotesGo(r){
    var box=r.querySelector('.rd-notes-go'); if(!box)return;
    var An=window.SHELL&&SHELL.annotations; if(!An){ box.innerHTML=''; return; }
    var c=An.context?An.context():{}, mine=0, pub=0;
    try{ mine=(c.work&&An.notesFor)?An.notesFor(c.work,c.section).length:0; }catch(e){}
    try{ pub=An.publicCount?An.publicCount():0; }catch(e){}
    var hasPub=!!document.getElementById('pubFab');
    box.innerHTML='<button type="button" class="rd-note-go" data-go="notesFab"><b>Mes notes</b><span>'+(mine?mine+(mine>1?' passages':' passage'):'aucune sur cette section')+'</span></button>'
      +(hasPub?'<button type="button" class="rd-note-go" data-go="pubFab"><b>Notes partagées</b><span>'+(pub?pub+(pub>1?' fils':' fil'):'aucun fil sur cette section')+'</span></button>':'');
    box.querySelectorAll('[data-go]').forEach(function(b){ b.onclick=function(){
      var id=b.getAttribute('data-go'), fab=document.getElementById(id);
      togglePop(r,'notes');
      if(!fab)return;
      var panelId=fab.getAttribute('aria-controls'), p=panelId&&document.getElementById(panelId);
      if(!p||p.hidden) fab.click();
      /* le bouton qu'on vient de toucher disparaît avec le popover : le
         focus irait à <body>. On le pose dans le panneau ouvert. */
      setTimeout(function(){ var p2=panelId&&document.getElementById(panelId); var f=p2&&!p2.hidden&&p2.querySelector('button,[href],textarea'); if(f) f.focus(); },30);
    };});
  }

  /* ---- montage ---- */
  function mountReader(out,cfg){
    cfg=cfg||{};
    var ctx=cfg.ctx||{};
    stopAudio();
    var r=out.querySelector('.reader'); if(!r)return;
    var prevTb=r.querySelector('.rd-toolbar'); if(prevTb) prevTb.remove();
    var ws=r.querySelector(cfg.textSel||'.ws-text'); if(!ws)return;
    cur={readerEl:r,ws:ws,id:ctx.id,title:ctx.title,paras:[],glossary:cfg.glossary||[]};
    applyTo(r);
    cur.paras=Array.prototype.filter.call(ws.querySelectorAll('p'),function(p){return (p.textContent||'').trim().length>1;});
    ensureHeadingIds(ws);

    var clearHtml = cfg.summaryHtml || '<div class="rd-note">Pas de résumé disponible pour ce chapitre.</div>';

    var tb=document.createElement('div'); tb.className='rd-toolbar';
    tb.innerHTML=''
     /* La jauge n'avait ni rôle ni valeur ; les glyphes ◀ ▶ Aa entraient
        dans le nom accessible et étaient vocalisés tels quels ; aucun
        bouton à popover n'exposait aria-expanded. WCAG 4.1.2. */
     + '<div class="rd-progress" role="progressbar" aria-label="Progression dans le chapitre" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>'
     + '<div class="rd-row" role="toolbar" aria-label="Outils de lecture">'
     +   '<button type="button" class="rd-btn" data-rd="prev" aria-label="Chapitre précédent">'+IC('prev')+'<span class="rd-lbl"> Préc.</span></button>'
     +   '<button type="button" class="rd-btn" data-rd="next" aria-label="Chapitre suivant"><span class="rd-lbl">Suiv. </span>'+IC('next')+'</button>'
     +   '<button type="button" class="rd-btn" data-rd="toc" aria-expanded="false"'+(sheetSrc('atl3Toc')?' aria-haspopup="dialog" aria-controls="atl3Sheet"':' aria-controls="rdpop-toc"')+'>'+IC('toc','rd-mob')+'<span class="rd-lbl">Sommaire</span></button>'
     +   '<button type="button" class="rd-btn" data-rd="audio"'+(synth?'':' aria-expanded="false" aria-controls="rdpop-audio"')+'>'+IC('ecoute')+'<span class="rd-lbl"> Écouter</span></button>'
     +   (sheetSrc()
           ? '<button type="button" class="rd-btn" data-rd="clear" aria-haspopup="dialog" aria-expanded="false" aria-controls="atl3Sheet"><span class="rd-sh-l">'+esc(sheetSrc().getAttribute('data-sheet-lbl')||'Ce chapitre')+'</span><span class="rd-sh-s" aria-hidden="true">'+esc(sheetSrc().getAttribute('data-sheet-short')||'Chapitre')+'</span></button>'
           : '<button type="button" class="rd-btn" data-rd="clear" aria-expanded="false" aria-controls="rdpop-clear">En clair</button>')
     +   '<button type="button" class="rd-btn" data-rd="set" aria-expanded="false" aria-controls="rdpop-set"><span aria-hidden="true">Aa</span><span class="rd-lbl"> Réglages</span></button>'
     /* « Notes » n'existe que sous 600 px (CSS) : les deux pastilles
        flottantes y couvraient le bas du texte en permanence. Elles sont
        masquées là, et ce bouton ouvre les deux mêmes panneaux. */
     +   (window.SHELL&&SHELL.annotations ? '<button type="button" class="rd-btn" data-rd="notes" aria-expanded="false" aria-controls="rdpop-notes">'+IC('notes')+'<span class="rd-lbl"> Notes</span></button>' : '')
     + '</div>'
     + '<div class="rd-pop" id="rdpop-toc" data-pop="toc" role="group" aria-label="Sommaire" hidden></div>'
     /* Vitesse et voix vivaient dans ce popover — que le bouton « Écouter »
        n'ouvrait JAMAIS dès que la synthèse vocale existe (il lit ou met en
        pause) : les réglages d'écoute étaient inatteignables, et le bouton
        déclarait un aria-expanded qu'il ne tenait pas. Ils sont dans
        « Aa Réglages », section « Écoute ». Le popover ne reste que pour
        dire l'indisponibilité. Mission `atelier-a11y-2`. */
     + '<div class="rd-pop" id="rdpop-audio" data-pop="audio" role="group" aria-label="Écouter le texte" hidden><h5>Écouter le texte</h5>'
     +   '<div class="rd-note">La synthèse vocale n’est pas disponible dans ce navigateur.</div></div>'
     + '<div class="rd-pop" id="rdpop-clear" data-pop="clear" role="group" aria-label="En clair" hidden><h5>En clair</h5>'+clearHtml+'</div>'
     + '<div class="rd-pop" id="rdpop-set" data-pop="set" role="group" aria-label="Réglages de lecture" hidden></div>'
     + '<div class="rd-pop rd-pop-notes" id="rdpop-notes" data-pop="notes" role="group" aria-label="Notes" hidden><h5>Notes</h5><div class="rd-notes-go"></div></div>'
     + '<div class="rd-xref"></div>';
    r.insertBefore(tb, r.firstChild);
    /* Signale à la page qu'on est entré dans le texte : la coquille de
       l'œuvre se décolle au profit du bandeau de lecture. Seulement si la
       liseuse est RÉELLEMENT affichée — un montage dans un panneau masqué
       décollerait la coquille d'un panneau qu'on ne lit pas. */
    if(r.getClientRects().length) document.body.classList.add('at-reading');

    // bornes préc/suiv
    var navCfg=cfg.nav||{};
    var pv=tb.querySelector('[data-rd="prev"]'), nx=tb.querySelector('[data-rd="next"]');
    if(!navCfg.prev) pv.disabled=true;
    if(!navCfg.next) nx.disabled=true;

    // renvois
    var xref=tb.querySelector('.rd-xref');
    var xitems=cfg.xref||[];
    if(xitems.length){
      xref.hidden=false;
      xref.innerHTML=xitems.map(function(x,i){ return '<button class="rd-chip" data-xi="'+i+'">'+esc(x.label)+'</button>'; }).join('');
      xref.querySelectorAll('[data-xi]').forEach(function(b){
        b.onclick=function(){ stopAudio(); try{ xitems[+b.getAttribute('data-xi')].go(); }catch(e){} };
      });
    } else { xref.hidden=true; xref.innerHTML=''; }

    // câblage
    pv.onclick=function(){ if(navCfg.prev){ stopAudio(); navCfg.prev(); } };
    nx.onclick=function(){ if(navCfg.next){ stopAudio(); navCfg.next(); } };
    /* Dans un atelier, « Sommaire » ouvre LE sommaire du livre en feuille. La
       liste des titres de la section chargée (le popover) ne reste que pour
       une liseuse sans sommaire — elle collait les titres de Wikisource
       (« CHAPITRE XIILA PLUS-VALUE RELATIVE ») et ne donnait pas le plan. */
    tb.querySelector('[data-rd="toc"]').onclick=function(){ if(sheetSrc('atl3Toc')) openSheet(this,'atl3Toc'); else togglePop(r,'toc'); };
    if(sheetSrc()||sheetSrc('atl3Toc')) sheetBuild();   /* aria-controls doit désigner un nœud qui existe */
    tb.querySelector('[data-rd="clear"]').onclick=function(){ if(sheetSrc()) openSheet(this,'atl3Marge'); else togglePop(r,'clear'); };
    tb.querySelector('[data-rd="set"]').onclick=function(){ renderSet(r); togglePop(r,'set'); };
    var nb=tb.querySelector('[data-rd="notes"]');
    if(nb) nb.onclick=function(){ renderNotesGo(r); togglePop(r,'notes'); };
    /* Le surlignage des termes du glossaire n'est plus un bouton de la
       barre : c'est un réglage de lecture, dans « Aa Réglages » (segment
       « Mots du glossaire »). Il disait « Glossaire » comme l'entrée de
       sidebar qui mène à l'abécédaire — deux choses sous le même nom. */
    tb.querySelector('[data-rd="audio"]').onclick=function(){
      if(!synth){ togglePop(r,'audio'); return; }
      if(A.playing) pauseAudio(); else playAudio();
    };
    tb.querySelector('[data-pop="toc"]').innerHTML='<h5>Sous-parties</h5>'+tocHtml(ws);
    tb.querySelectorAll('[data-goto]').forEach(function(b){ b.onclick=function(){
      var el=document.getElementById(b.getAttribute('data-goto'));
      if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
    };});

    renderVoiceSelect();
    if(S.gloss) wrapGloss();
    updateProgress();
  }

  // stopper l'audio quand on change d'onglet
  document.querySelectorAll('nav.tabs .tab').forEach(function(t){ t.addEventListener('click',function(){ stopAudio(); }); });
  window.addEventListener('beforeunload',function(){ try{if(synth)synth.cancel();}catch(e){} });


  function glLetter(ch){ return !!ch && /[a-zàâäáéèêëíîïóôöùúûüçœæ]/i.test(ch); }
  function glNorm(s){ return s.toLowerCase().replace(/[\u2019\u2018\u02bc]/g,"'"); }
  function glEligible(node){
    var p=node.parentNode;
    while(p && p!==cur.ws){
      var tn=p.tagName;
      if(tn==='A'||tn==='MARK'||tn==='H2'||tn==='H3'||tn==='H4'||tn==='STYLE'||tn==='SCRIPT')return false;
      if(p.classList && p.classList.contains('gloss'))return false;
      p=p.parentNode;
    }
    return p===cur.ws;
  }
  function glFind(node,surf){
    var text=node.nodeValue, h=glNorm(text), t=glNorm(surf), from=0, i;
    while((i=h.indexOf(t,from))>=0){
      var endLen=t.length, before=text.charAt(i-1), after=text.charAt(i+endLen);
      if(glLetter(after)){
        var lo=after.toLowerCase();
        if((lo==='s'||lo==='x') && !glLetter(text.charAt(i+endLen+1))) endLen+=1;
        else { from=i+1; continue; }
      }
      if(i>0 && glLetter(before)){ from=i+1; continue; }
      return {index:i,len:endLen};
    }
    return null;
  }
  function glWrapAt(node,index,len,term){
    var mid=node.splitText(index);
    if(len<mid.nodeValue.length) mid.splitText(len);
    var span=document.createElement('span');
    span.className='gloss'; span.setAttribute('tabindex','0');
    /* Le span était focusable mais sans rôle ni description : arriver
       dessus au clavier ne montrait jamais la définition, puisque seuls
       click et mouseover étaient écoutés. WCAG 2.1.1 et 1.4.13. */
    span.setAttribute('role','button');
    span.setAttribute('aria-describedby','rdTip');
    span.setAttribute('data-de',term.de||''); span.setAttribute('data-def',term.def||'');
    mid.parentNode.insertBefore(span,mid); span.appendChild(mid);
  }
  function wrapGloss(){
    if(!cur||!cur.ws||!cur.glossary)return;
    var gl=cur.glossary.slice();
    gl.forEach(function(t){ if(!t.max) t.max=Math.max.apply(null,t.s.map(function(x){return x.length;})); });
    gl.sort(function(a,b){ return b.max-a.max; });
    gl.forEach(function(term){
      for(var k=0;k<term.s.length;k++){
        var w=document.createTreeWalker(cur.ws,window.NodeFilter.SHOW_TEXT,null), n, nodes=[];
        while(n=w.nextNode())nodes.push(n);
        var done=false;
        for(var j=0;j<nodes.length;j++){
          var nd=nodes[j]; if(!glEligible(nd))continue;
          var m=glFind(nd,term.s[k]);
          if(m){ try{glWrapAt(nd,m.index,m.len,term);}catch(e){} done=true; break; }
        }
        if(done)break;
      }
    });
  }
  function unwrapGloss(){
    if(!cur||!cur.ws)return;
    hideTip();
    cur.ws.querySelectorAll('span.gloss').forEach(function(s){
      var p=s.parentNode; if(!p)return;
      while(s.firstChild)p.insertBefore(s.firstChild,s);
      p.removeChild(s);
    });
    try{cur.ws.normalize();}catch(e){}
  }

  /* ---- infobulle ---- */
  var tip=null, tipSticky=false, tipAnchor=null;
  function ensureTip(){ if(tip)return tip; tip=document.createElement('div'); tip.className='rd-tip'; tip.id='rdTip'; tip.setAttribute('role','tooltip'); tip.hidden=true; document.body.appendChild(tip); return tip; }
  function showTip(span){
    ensureTip();
    /* lang="de" : sans lui, une synthèse vocale française prononce
       « Entäußerung » en français. WCAG 3.1.2. */
    tip.innerHTML='<span class="rd-tip-term">'+esc(span.textContent)+'</span>'
      +(span.getAttribute('data-de')?'<span class="rd-tip-de">allemand : <i lang="de">'+esc(span.getAttribute('data-de'))+'</i></span>':'')
      +'<span class="rd-tip-def">'+esc(span.getAttribute('data-def')||'')+'</span>';
    tip.hidden=false;
    tipAnchor=span;
    placeTip(span);
  }
  function placeTip(span){
    if(!tip||tip.hidden)return;
    var r=span.getBoundingClientRect();
    tip.style.top=(r.bottom+window.scrollY+6)+'px';
    var vw=document.documentElement.clientWidth;
    var left=r.left+window.scrollX;
    var maxL=window.scrollX+vw-tip.offsetWidth-10;
    tip.style.left=Math.max(window.scrollX+8,Math.min(left,maxL))+'px';
  }
  function hideTip(){ if(tip)tip.hidden=true; tipSticky=false; tipAnchor=null; }
  document.addEventListener('click',function(e){
    var g=e.target.closest && e.target.closest('span.gloss');
    if(g){ if(g.closest('mark.anno'))return; e.stopPropagation(); tipSticky=true; showTip(g); return; }
    if(!(e.target.closest && e.target.closest('.rd-tip'))) hideTip();
  });
  document.addEventListener('mouseover',function(e){
    if(tipSticky)return;
    var g=e.target.closest && e.target.closest('span.gloss');
    if(g && !g.closest('mark.anno')) showTip(g);
  });
  document.addEventListener('mouseout',function(e){
    if(tipSticky)return;
    var g=e.target.closest && e.target.closest('span.gloss');
    if(g){ var to=e.relatedTarget; if(to && to.closest && (to.closest('span.gloss')===g||to.closest('.rd-tip')))return; hideTip(); }
  });
  /* Au clavier : le focus ouvre l'infobulle, le blur la ferme, Échap aussi.
     Sans ces trois écouteurs, un terme de glossaire atteint au clavier
     restait muet. */
  document.addEventListener('focusin',function(e){
    var g=e.target.closest&&e.target.closest('span.gloss');
    if(g && !g.closest('mark.anno')) showTip(g);
  });
  document.addEventListener('focusout',function(e){
    var g=e.target.closest&&e.target.closest('span.gloss');
    if(g) hideTip();
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape' && tip && !tip.hidden) hideTip();
    if((e.key==='Enter'||e.key===' ')&&document.activeElement&&document.activeElement.classList&&document.activeElement.classList.contains('gloss')){
      e.preventDefault(); tipSticky=true; showTip(document.activeElement);
    }
  });
  /* La fermeture au défilement contrevenait à la persistance exigée par
     1.4.13 : on ne referme que si le terme est sorti de l'écran. */
  window.addEventListener('scroll',function(){
    if(!tip || tip.hidden || !tipAnchor) return;
    var r=tipAnchor.getBoundingClientRect();
    if(r.bottom<0 || r.top>(window.innerHeight||0)) hideTip();
    else placeTip(tipAnchor);
  },{passive:true});

  window.Reading={ mount:mountReader };
})();
