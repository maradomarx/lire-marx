/* sw.js — le service worker de Lire Marx (mission `application-mobile`,
   septembre 2026). C'est lui qui fait du site une APPLICATION installable :
   sans service worker, Chrome ne propose pas l'installation et rien ne
   s'affiche hors connexion.

   Il vit à la RACINE parce que sa portée est celle de son URL : posé sous
   /oeuvres/, il ne verrait ni l'accueil, ni le glossaire, ni /a-propos.

   TROIS RÈGLES, et elles commandent tout ce qui suit :

   1. LE HTML EST TOUJOURS DEMANDÉ AU RÉSEAU D'ABORD. Le site n'a pas de
      build : un commit sur main redéploie, et Cloudflare sert le HTML en
      `max-age=0`. Un HTML servi depuis le cache d'abord ferait revivre en
      silence le piège déjà payé trois fois (nouveau balisage + ancienne
      feuille). Le cache n'est que le REPLI quand le réseau manque.

   2. LES ACTIFS SONT SERVIS DU CACHE, PUIS RAFRAÎCHIS (stale-while-
      revalidate). C'est sûr parce que tout actif qui change avec un
      balisage porte déjà une version dans son URL (`shell.css?v=8`) : une
      URL neuve est une entrée neuve. Aucune liste d'actifs à tenir ici, donc
      rien à oublier de bumper — le service worker ne connaît que ce que le
      lecteur a visité.

   3. ON NE TOUCHE PAS À CE QUI N'EST PAS À NOUS. Supabase (compte, notes,
      forum), l'API de Wikisource (le texte du Capital), les CDN : passés
      tels quels, jamais mis en cache. Et le jeu (/jeu/) non plus — six
      mégaoctets d'actifs pour une partie qui exige un clavier.

   Le PRÉCACHE ne contient que ce qu'il faut pour que la page hors-ligne
   s'affiche bien : elle-même, le manifeste, les icônes et les polices
   maîtresses. Le reste vient au fil des visites. */
'use strict';

var VERSION = 'lm-1';
var SOCLE   = VERSION + '-socle';    /* précache, remplacé à chaque VERSION */
var VISITES = VERSION + '-visites';  /* ce que le lecteur a ouvert */
/* L'URL PROPRE, sans extension — et ce n'est pas une coquetterie : Cloudflare
   répond 308 de /hors-ligne.html vers /hors-ligne, la réponse mise en cache
   serait donc `redirected`, et Chrome REFUSE une réponse redirigée pour une
   navigation (mode de redirection « manual ») : net::ERR_FAILED au lieu de
   la page de secours. Mesuré sur le serveur de test qui imite Cloudflare. */
var HORS_LIGNE = '/hors-ligne';

var PRECACHE = [
  HORS_LIGNE,
  '/manifest.webmanifest',
  '/assets/img/logo/icon-192.png',
  '/assets/img/logo/icon-512.png',
  '/oeuvres/fonts/fonts.css'
];
/* Les polices : chargées en tolérance — une qui manque ne doit pas empêcher
   l'installation du service worker (addAll échouerait en bloc). */
var POLICES = [
  'fraunces-900-normal-latin', 'fraunces-500-italic-latin',
  'inter-400-normal-latin', 'inter-500-normal-latin', 'inter-600-normal-latin',
  'spectral-400-normal-latin', 'spectral-400-italic-latin', 'spectral-500-normal-latin',
  'caveat-500-normal-latin'
].map(function(n){ return '/oeuvres/fonts/' + n + '.woff2'; });

var MAX_VISITES = 400;  /* entrées gardées dans le cache des visites */

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(SOCLE).then(function(c){
      return c.addAll(PRECACHE).then(function(){
        return Promise.all(POLICES.map(function(u){
          return c.add(u).catch(function(){ /* tolérée */ });
        }));
      });
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        /* Tout cache d'une autre VERSION est le nôtre et périmé. */
        if(k.indexOf('lm-') === 0 && k !== SOCLE && k !== VISITES) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch(_) { return; }
  /* Règle 3 : rien d'externe, rien du jeu, et jamais le service worker
     lui-même (le navigateur tient sa propre logique de mise à jour). */
  if(url.origin !== self.location.origin) return;
  if(url.pathname.indexOf('/jeu/') === 0) return;
  if(url.pathname === '/sw.js') return;

  if(req.mode === 'navigate'){
    e.respondWith(pageReseauDabord(req));
    return;
  }
  e.respondWith(actifCachePuisReseau(req));
});

/* Règle 1. On garde une copie de chaque page servie — c'est ce qui permet
   de rouvrir hors ligne un chapitre déjà lu ou son carnet. */
function pageReseauDabord(req){
  return fetch(req).then(function(res){
    if(res && res.ok){
      var copie = res.clone();
      caches.open(VISITES).then(function(c){ c.put(req, copie); tailler(c); });
    }
    return res;
  }).catch(function(){
    return caches.match(req, { ignoreSearch: true }).then(function(hit){
      return hit || caches.match(HORS_LIGNE);
    });
  });
}

/* Règle 2. Le cache répond tout de suite ; le réseau rafraîchit derrière
   pour la fois suivante. Une réponse d'erreur n'est jamais mise en cache. */
function actifCachePuisReseau(req){
  return caches.match(req).then(function(hit){
    var reseau = fetch(req).then(function(res){
      if(res && res.ok){
        var copie = res.clone();
        caches.open(VISITES).then(function(c){ c.put(req, copie); tailler(c); });
      }
      return res;
    }).catch(function(){ return hit; });
    return hit || reseau;
  });
}

/* Le cache des visites ne doit pas enfler sans fin : au-delà du plafond, on
   retire les entrées les plus anciennes (l'ordre des clés suit l'insertion).
   Appelé sans être attendu — ce n'est pas sur le chemin de la réponse. */
var enTaille = false;
function tailler(c){
  if(enTaille) return;
  enTaille = true;
  c.keys().then(function(keys){
    var trop = keys.length - MAX_VISITES;
    if(trop <= 0) return;
    return Promise.all(keys.slice(0, trop).map(function(k){ return c.delete(k); }));
  }).then(function(){ enTaille = false; }, function(){ enTaille = false; });
}
