-- supabase/schema.sql — schéma idempotent Lire Marx
-- À rejouer librement : chaque instruction est idempotente.

-- ── reading_progress ──────────────────────────────────────────────────────────
-- Suivi de progression de lecture par utilisateur et par œuvre.
-- user_id défini par défaut à auth.uid() — ne pas le poser explicitement à
-- l'INSERT (même règle que la table annotations existante).

create table if not exists public.reading_progress (
  user_id      uuid         not null default auth.uid(),
  work         text         not null,
  section      integer      not null,
  completed    boolean      not null default true,
  completed_at timestamptz  not null default now(),
  constraint reading_progress_pkey primary key (user_id, work, section)
);

alter table public.reading_progress enable row level security;

-- Policies RLS — lecture et écriture limitées à ses propres lignes
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'reading_progress'
      and policyname = 'rp_select_own'
  ) then
    execute '
      create policy rp_select_own on public.reading_progress
        for select using (user_id = auth.uid())
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'reading_progress'
      and policyname = 'rp_insert_own'
  ) then
    execute '
      create policy rp_insert_own on public.reading_progress
        for insert with check (user_id = auth.uid())
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'reading_progress'
      and policyname = 'rp_update_own'
  ) then
    execute '
      create policy rp_update_own on public.reading_progress
        for update
        using  (user_id = auth.uid())
        with check (user_id = auth.uid())
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'reading_progress'
      and policyname = 'rp_delete_own'
  ) then
    execute '
      create policy rp_delete_own on public.reading_progress
        for delete using (user_id = auth.uid())
    ';
  end if;
end $$;

-- ── modération (mission moderation-5c) ───────────────────────────────────────
-- Les tables `moderators` et `reports` EXISTAIENT déjà (créées à la main
-- au début du projet) : les blocs ci-dessous documentent leur structure
-- RÉELLE — `create if not exists` est un no-op sur la base en place mais
-- garde ce fichier comme référence — puis posent les défauts manquants
-- et les policies. `moderators` n'a qu'UNE colonne : id = user_id du
-- modérateur (table remplie à la main depuis le dashboard — pas d'UI
-- d'administration). `reports` suit le style de public_notes : id text
-- généré côté client, created en millisecondes (Date.now()),
-- reporter_id posé par défaut à auth.uid() — ne jamais l'écrire à
-- l'INSERT (règle maison).

create table if not exists public.moderators (
  id uuid primary key
);

create table if not exists public.reports (
  id          text    primary key,
  note_id     text    not null,
  reporter_id uuid,
  reason      text,
  created     bigint,
  resolved    boolean
);

alter table public.reports alter column reporter_id set default auth.uid();
alter table public.reports alter column resolved    set default false;

alter table public.moderators enable row level security;
alter table public.reports    enable row level security;

do $$ begin
  -- chacun ne peut lire QUE sa propre ligne : c'est le test « suis-je
  -- modérateur ? » du client, et rien d'autre ne sort de la table
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'moderators'
      and policyname = 'mod_select_self'
  ) then
    execute '
      create policy mod_select_self on public.moderators
        for select using (id = auth.uid())
    ';
  end if;

  -- tout connecté peut signaler (en son nom uniquement)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reports'
      and policyname = 'rep_insert_own'
  ) then
    execute '
      create policy rep_insert_own on public.reports
        for insert with check (reporter_id = auth.uid())
    ';
  end if;

  -- seuls les modérateurs lisent et classent les signalements
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reports'
      and policyname = 'rep_select_mod'
  ) then
    execute '
      create policy rep_select_mod on public.reports
        for select using (
          exists (select 1 from public.moderators m where m.id = auth.uid())
        )
    ';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'reports'
      and policyname = 'rep_update_mod'
  ) then
    execute '
      create policy rep_update_mod on public.reports
        for update
        using (
          exists (select 1 from public.moderators m where m.id = auth.uid())
        )
        with check (
          exists (select 1 from public.moderators m where m.id = auth.uid())
        )
    ';
  end if;

  -- les modérateurs peuvent basculer public_notes.hidden (policy
  -- PERMISSIVE : elle s'ajoute au droit de l'auteur sans le toucher)
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'public_notes'
      and policyname = 'pn_update_mod'
  ) then
    execute '
      create policy pn_update_mod on public.public_notes
        for update
        using (
          exists (select 1 from public.moderators m where m.id = auth.uid())
        )
        with check (
          exists (select 1 from public.moderators m where m.id = auth.uid())
        )
    ';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════
-- Soutiens (mission place-forum, août 2026) — le vote d'appui du forum
-- du forum. UN vote par lecteur et par note (racine ou
-- réponse), pas de vote négatif : on appuie une lecture, on n'enterre
-- personne. Style maison : note_id = id client de public_notes,
-- created en millisecondes, voter_id posé par DÉFAUT à auth.uid() —
-- jamais écrit à l'INSERT. Les comptes de soutien sont publics (select
-- ouvert) ; on n'insère et ne retire que son propre vote.
-- Table NOUVELLE : `create table if not exists` est sûr ici (le piège
-- des tables préexistantes ne concerne que moderators/reports).
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.note_votes (
  note_id  text   not null,
  voter_id uuid   not null default auth.uid(),
  created  bigint,
  primary key (note_id, voter_id)
);

alter table public.note_votes enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'note_votes' and policyname = 'nv_select_all') then
    execute 'create policy nv_select_all on public.note_votes for select using (true)';
  end if;
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'note_votes' and policyname = 'nv_insert_own') then
    execute 'create policy nv_insert_own on public.note_votes for insert
      with check (voter_id = auth.uid())';
  end if;
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'note_votes' and policyname = 'nv_delete_own') then
    execute 'create policy nv_delete_own on public.note_votes for delete
      using (voter_id = auth.uid())';
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════
-- Les cartes à collectionner (mission `cartes`, nov. 2026)
--
-- Le compte est OBLIGATOIRE et le tirage se fait ICI, jamais dans la page :
-- la page ne choisit pas ses cartes et ne peut pas ouvrir un quatrième
-- booster en changeant l'heure de l'appareil. Aucune policy d'écriture sur
-- les trois tables du joueur : tout passe par les fonctions ci-dessous
-- (security definer), qui ne touchent qu'aux lignes de auth.uid().
--
-- Le catalogue (6 000+ lignes) est rempli par supabase/cartes-catalogue.sql,
-- que tools/cartes.mjs écrit à partir de cartes/catalogue.json : la base ne
-- connaît que l'identifiant et le rang de chaque carte, le reste est servi
-- par le site.
-- ═══════════════════════════════════════════════════════════════════

create table if not exists public.cartes_catalogue (
  id    text     primary key,
  r     smallint not null check (r between 0 and 4),
  actif boolean  not null default true
);
create index if not exists cartes_catalogue_tirage on public.cartes_catalogue (r) where actif;

create table if not exists public.cartes_collection (
  user_id  uuid    not null default auth.uid() references auth.users(id) on delete cascade,
  carte    text    not null references public.cartes_catalogue(id),
  n        integer not null default 1 check (n > 0),
  premiere bigint  not null,
  primary key (user_id, carte)
);
-- Le tirage de tête (le « shiny ») : une carte sur cinquante sort sur papier
-- Japon nacré. On compte ces exemplaires à part.
alter table public.cartes_collection add column if not exists tetes integer not null default 0 check (tetes >= 0);

create table if not exists public.cartes_jours (
  user_id uuid     not null default auth.uid() references auth.users(id) on delete cascade,
  jour    date     not null,
  ouverts smallint not null default 0,
  bonus   smallint not null default 0,
  primary key (user_id, jour)
);

create table if not exists public.cartes_missions (
  user_id uuid   not null default auth.uid() references auth.users(id) on delete cascade,
  mission text   not null,
  jour    date   not null,
  created bigint not null,
  primary key (user_id, mission, jour)
);

alter table public.cartes_catalogue  enable row level security;
alter table public.cartes_collection enable row level security;
alter table public.cartes_jours      enable row level security;
alter table public.cartes_missions   enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
    and tablename = 'cartes_catalogue' and policyname = 'cc_select_all') then
    execute 'create policy cc_select_all on public.cartes_catalogue for select using (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
    and tablename = 'cartes_collection' and policyname = 'ccol_select_own') then
    execute 'create policy ccol_select_own on public.cartes_collection for select using (user_id = auth.uid())';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
    and tablename = 'cartes_jours' and policyname = 'cj_select_own') then
    execute 'create policy cj_select_own on public.cartes_jours for select using (user_id = auth.uid())';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public'
    and tablename = 'cartes_missions' and policyname = 'cm_select_own') then
    execute 'create policy cm_select_own on public.cartes_missions for select using (user_id = auth.uid())';
  end if;
end $$;

-- Le jour du jeu est celui de Paris : les boosters reviennent à minuit, heure
-- française, pour tout le monde.
create or replace function public.cartes_jour() returns date
  language sql stable as $$ select (now() at time zone 'Europe/Paris')::date $$;

-- LA RÉSERVE : des boosters qui ne périment pas (cadeaux, lancement,
-- compensation). Les boosters du jour s'ouvrent d'abord — ils expirent à
-- minuit —, la réserve ensuite. Créditée à la main, par SQL :
--   insert into cartes_reserve (user_id, boosters) values (…, 50)
--     on conflict (user_id) do update set boosters = cartes_reserve.boosters + 50;
create table if not exists public.cartes_reserve (
  user_id  uuid    primary key references auth.users(id) on delete cascade,
  boosters integer not null default 0 check (boosters >= 0),
  maj      bigint
);
alter table public.cartes_reserve enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
    and tablename = 'cartes_reserve' and policyname = 'cr_select_own') then
    execute 'create policy cr_select_own on public.cartes_reserve for select using (user_id = auth.uid())';
  end if;
end $$;

-- LA BIENVENUE : dix boosters dans la réserve de chaque NOUVEAU compte (l'alerte
-- des visiteurs le promet, oeuvres/shell.js). Un déclencheur à la création du
-- compte, à côté de on_auth_user_created ; les comptes antérieurs ne sont pas
-- touchés. Rejouable : create or replace + drop trigger if exists.
create or replace function public.cartes_bienvenue() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.cartes_reserve (user_id, boosters, maj)
    values (new.id, 10, (extract(epoch from now()) * 1000)::bigint)
    on conflict (user_id) do update set boosters = cartes_reserve.boosters + 10;
  return new;
end $$;
drop trigger if exists cartes_bienvenue on auth.users;
create trigger cartes_bienvenue after insert on auth.users
  for each row execute function public.cartes_bienvenue();

-- Trois boosters par jour, au plus trois de plus par les missions, et la réserve.
create or replace function public.cartes_etat() returns json
  language plpgsql security definer set search_path = public as $$
declare
  u uuid := auth.uid();
  o smallint := 0; b smallint := 0; res int := 0;
begin
  if u is null then raise exception 'connexion requise' using errcode = '28000'; end if;
  select ouverts, bonus into o, b from cartes_jours where user_id = u and jour = cartes_jour();
  select boosters into res from cartes_reserve where user_id = u;
  return json_build_object(
    'jour', cartes_jour(), 'parJour', 3, 'ouverts', coalesce(o, 0), 'bonus', coalesce(b, 0),
    'reserve', coalesce(res, 0),
    'restants', greatest(0, 3 + coalesce(b, 0) - coalesce(o, 0)) + coalesce(res, 0),
    'missions', (select coalesce(json_agg(mission), '[]'::json) from cartes_missions
                 where user_id = u and jour = cartes_jour()),
    'possedees', (select count(*) from cartes_collection where user_id = u));
end $$;

-- Ouvrir un booster : cinq cartes. Les quatre premières : tract 60 %,
-- brochure 26 %, reliure 10 %, originale 3,5 %, manuscrit 0,5 % ; la
-- cinquième est au moins une brochure (manuscrit 1,5 %, originale 6,5 %,
-- reliure 22 %). Chacune, quel que soit son rang, a une chance sur cinquante
-- de sortir en tirage de tête : environ un tous les trois jours.
create or replace function public.cartes_ouvrir() returns json
  language plpgsql security definer set search_path = public as $$
declare
  u uuid := auth.uid();
  jr date := cartes_jour();
  lig cartes_jours;
  res int := 0;
  du_jour boolean;
  tirage text[] := '{}';
  brill boolean[] := '{}';   -- pas « tetes » : ce serait le nom d'une colonne
  rang int; x float8; c text; i int;
  grand boolean := random() < 0.005;   -- le Grand Soir : un booster sur deux cents
  out_json json;
begin
  if u is null then raise exception 'connexion requise' using errcode = '28000'; end if;
  insert into cartes_jours (user_id, jour) values (u, jr) on conflict do nothing;
  select * into lig from cartes_jours where user_id = u and jour = jr for update;
  select boosters into res from cartes_reserve where user_id = u for update;
  res := coalesce(res, 0);
  du_jour := lig.ouverts < 3 + lig.bonus;
  if not du_jour and res <= 0 then
    raise exception 'plus de booster aujourd''hui' using errcode = 'P0001';
  end if;
  for i in 1..5 loop
    x := random() * 100;
    if grand then
      -- cinq rares, et la dernière est toujours un manuscrit
      rang := case when i = 5 or x < 25 then 4 else 3 end;
    elsif i < 5 then
      rang := case when x < 0.5 then 4 when x < 4 then 3 when x < 14 then 2 when x < 40 then 1 else 0 end;
    else
      rang := case when x < 1.5 then 4 when x < 8 then 3 when x < 30 then 2 else 1 end;
    end if;
    select id into c from cartes_catalogue where actif and r = rang order by random() limit 1;
    if c is null then
      select id into c from cartes_catalogue where actif order by random() limit 1;
    end if;
    tirage := tirage || c;
    brill := brill || (random() < case when grand then 0.2 else 0.02 end);
  end loop;

  -- « nouvelle » : absente de la collection avant ce booster, et seulement à
  -- sa première apparition dans le booster.
  select json_agg(json_build_object('id', t.id, 'tete', t.tete,
           'nouvelle', cc.carte is null and t.k = 1,
           'nouvelleTete', t.tete and coalesce(cc.tetes, 0) = 0 and t.kt = 1) order by t.o)
    into out_json
    from (select id, tete, o,
                 row_number() over (partition by id order by o) as k,
                 row_number() over (partition by id, tete order by o) as kt
          from unnest(tirage, brill) with ordinality as z(id, tete, o)) t
    left join cartes_collection cc on cc.user_id = u and cc.carte = t.id;

  insert into cartes_collection (user_id, carte, n, tetes, premiere)
    select u, id, count(*), count(*) filter (where tete), (extract(epoch from now()) * 1000)::bigint
      from unnest(tirage, brill) as z(id, tete) group by id
    on conflict (user_id, carte) do update
      set n = cartes_collection.n + excluded.n, tetes = cartes_collection.tetes + excluded.tetes;

  if du_jour then
    update cartes_jours set ouverts = ouverts + 1 where user_id = u and jour = jr;
    return json_build_object('cartes', out_json, 'grandSoir', grand, 'reserve', res,
      'restants', 3 + lig.bonus - lig.ouverts - 1 + res);
  else
    update cartes_reserve set boosters = boosters - 1,
      maj = (extract(epoch from now()) * 1000)::bigint where user_id = u;
    return json_build_object('cartes', out_json, 'grandSoir', grand, 'reserve', res - 1, 'restants', res - 1);
  end if;
end $$;

-- Une mission accomplie rapporte un booster, une fois par jour et par mission,
-- trois au plus par jour. La page déclare la mission (elle est seule à savoir
-- qu'on a fini un chapitre) : la borne de trois est ce qui la rend sans enjeu.
create or replace function public.cartes_mission(m text) returns json
  language plpgsql security definer set search_path = public as $$
declare
  u uuid := auth.uid();
  jr date := cartes_jour();
  n int;
  avant smallint;
begin
  if u is null then raise exception 'connexion requise' using errcode = '28000'; end if;
  if m not in ('lecture', 'notion', 'annotation', 'questions', 'circuit', 'forum', 'commentaire') then
    raise exception 'mission inconnue' using errcode = '22023';
  end if;
  insert into cartes_missions (user_id, mission, jour, created)
    values (u, m, jr, (extract(epoch from now()) * 1000)::bigint) on conflict do nothing;
  get diagnostics n = row_count;
  select coalesce(bonus, 0) into avant from cartes_jours where user_id = u and jour = jr;
  if n > 0 then
    insert into cartes_jours (user_id, jour, bonus) values (u, jr, 1)
      on conflict (user_id, jour) do update set bonus = least(3, cartes_jours.bonus + 1);
  end if;
  -- « gagne » : la mission a-t-elle vraiment rapporté un booster ? (non si
  -- elle était déjà faite aujourd'hui, ou si les trois bonus sont pris)
  return (cartes_etat()::jsonb || jsonb_build_object('gagne',
    n > 0 and coalesce(avant, 0) < 3))::json;
end $$;

revoke all on function public.cartes_etat()        from public, anon;
revoke all on function public.cartes_ouvrir()      from public, anon;
revoke all on function public.cartes_mission(text) from public, anon;
grant execute on function public.cartes_etat()        to authenticated;
grant execute on function public.cartes_ouvrir()      to authenticated;
grant execute on function public.cartes_mission(text) to authenticated;

-- ============================================================================
-- La vitrine et les échanges (mission `cartes-echanges`, nov. 2026)
-- ============================================================================
-- La vitrine : dix emplacements au plus, publics, montrés sur le profil du
-- forum. Un emplacement dit une carte ET son état (irisée ou non). On ne la
-- remplit que par cartes_vitrine_poser, qui vérifie qu'on possède bien ce
-- qu'on expose ; cartes_profil ne montre que ce qui est encore possédé (une
-- carte cédée depuis disparaît d'elle-même de la vitrine).
--
-- Les échanges : une proposition DIRECTE (a = le destinataire) ou une offre à
-- la BOURSE (a null, visible de tous). On répond à une offre de la bourse par
-- une contre-proposition (parent = l'offre, a = son auteur), ou on l'accepte
-- telle quelle si elle demande quelque chose. Toutes les cartes s'échangent ;
-- une irisée s'échange comme irisée. Rien ne bouge avant l'acceptation, et
-- tout est REVÉRIFIÉ au moment d'accepter, sous verrou : ce qui a été cédé
-- entre-temps fait échouer l'échange (statut « caduc »).
-- Un élément : {"c": "<id de carte>", "t": true|false}. Une carte en double se
-- met deux fois dans la liste.

create table if not exists public.cartes_vitrine (
  user_id uuid     not null references auth.users(id) on delete cascade,
  pos     smallint not null check (pos between 0 and 9),
  carte   text     not null references public.cartes_catalogue(id),
  tete    boolean  not null default false,
  primary key (user_id, pos)
);
alter table public.cartes_vitrine enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
    and tablename = 'cartes_vitrine' and policyname = 'cv_select_all') then
    execute 'create policy cv_select_all on public.cartes_vitrine for select using (true)';
  end if;
end $$;

create table if not exists public.cartes_echanges (
  id      uuid    primary key default gen_random_uuid(),
  de      uuid    not null references auth.users(id) on delete cascade,
  a       uuid             references auth.users(id) on delete cascade,
  parent  uuid             references public.cartes_echanges(id) on delete cascade,
  donne   jsonb   not null default '[]'::jsonb,
  demande jsonb   not null default '[]'::jsonb,
  statut  text    not null default 'ouvert'
          check (statut in ('ouvert', 'accepte', 'refuse', 'annule', 'caduc')),
  created bigint  not null,
  maj     bigint  not null
);
create index if not exists cartes_echanges_de on public.cartes_echanges (de, statut);
create index if not exists cartes_echanges_a on public.cartes_echanges (a, statut);
create index if not exists cartes_echanges_bourse on public.cartes_echanges (statut) where a is null;
alter table public.cartes_echanges enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
    and tablename = 'cartes_echanges' and policyname = 'ce_select') then
    execute 'create policy ce_select on public.cartes_echanges for select using (
      de = auth.uid() or a = auth.uid() or (a is null and statut = ''ouvert''))';
  end if;
end $$;

-- Une liste d'éléments, contrôlée et regroupée : (carte, irisée, combien).
create or replace function public._cartes_lot(l jsonb) returns table (carte text, tete boolean, k int)
  language plpgsql stable set search_path = public as $$
begin
  if l is null or jsonb_typeof(l) <> 'array' then raise exception 'liste invalide' using errcode = '22023'; end if;
  if jsonb_array_length(l) > 10 then raise exception 'dix cartes au plus' using errcode = '22023'; end if;
  if exists (select 1 from jsonb_array_elements(l) e
             where jsonb_typeof(e) <> 'object' or not (e ? 'c')
               or not exists (select 1 from cartes_catalogue cc where cc.id = e->>'c')) then
    raise exception 'carte inconnue' using errcode = '22023';
  end if;
  return query select e->>'c', coalesce((e->>'t')::boolean, false), count(*)::int
    from jsonb_array_elements(l) e group by 1, 2;
end $$;

-- u possède-t-il tout le lot ? Une irisée se compte dans les irisées, une
-- carte ordinaire dans les exemplaires qui ne le sont pas.
create or replace function public._cartes_possede(u uuid, l jsonb) returns boolean
  language sql stable set search_path = public as $$
  select not exists (
    select 1 from (select carte, sum(k) filter (where tete) as kt, sum(k) filter (where not tete) as ko
                   from _cartes_lot(l) group by carte) x
    left join cartes_collection cc on cc.user_id = u and cc.carte = x.carte
    where coalesce(cc.tetes, 0) < coalesce(x.kt, 0)
       or coalesce(cc.n - cc.tetes, 0) < coalesce(x.ko, 0));
$$;

-- Déplace un lot de src vers dst. Suppose les vérifications faites et les
-- lignes verrouillées.
create or replace function public._cartes_bouger(src uuid, dst uuid, l jsonb) returns void
  language plpgsql set search_path = public as $$
declare x record; t bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  for x in select * from _cartes_lot(l) loop
    -- le dernier exemplaire part : on supprime la ligne (n > 0 interdit de la mettre à zéro)
    delete from cartes_collection where user_id = src and carte = x.carte and n <= x.k;
    update cartes_collection set n = n - x.k, tetes = tetes - (case when x.tete then x.k else 0 end)
      where user_id = src and carte = x.carte;
    insert into cartes_collection (user_id, carte, n, tetes, premiere)
      values (dst, x.carte, x.k, case when x.tete then x.k else 0 end, t)
      on conflict (user_id, carte) do update
        set n = cartes_collection.n + excluded.n, tetes = cartes_collection.tetes + excluded.tetes;
  end loop;
end $$;

create or replace function public.cartes_vitrine_poser(l jsonb) returns json
  language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'connexion requise' using errcode = '28000'; end if;
  perform 1 from _cartes_lot(l);
  if not _cartes_possede(u, l) then raise exception 'carte absente de votre collection' using errcode = '22023'; end if;
  delete from cartes_vitrine where user_id = u;
  insert into cartes_vitrine (user_id, pos, carte, tete)
    select u, (o - 1)::smallint, e->>'c', coalesce((e->>'t')::boolean, false)
      from jsonb_array_elements(l) with ordinality z(e, o);
  return cartes_profil(u);
end $$;

-- Le profil public d'un collectionneur : sa vitrine (ce qui est encore à lui)
-- et trois chiffres. Lisible sans compte.
create or replace function public.cartes_profil(u uuid) returns json
  language sql stable security definer set search_path = public as $$
  select json_build_object(
    'possedees', (select count(*) from cartes_collection where user_id = u),
    'manuscrits', (select count(*) from cartes_collection cc join cartes_catalogue k on k.id = cc.carte
                   where cc.user_id = u and k.r = 4),
    'irisees', (select count(*) from cartes_collection where user_id = u and tetes > 0),
    'vitrine', (select coalesce(json_agg(json_build_object('c', v.carte, 't', v.tete) order by v.pos), '[]'::json)
                from cartes_vitrine v join cartes_collection cc on cc.user_id = v.user_id and cc.carte = v.carte
                where v.user_id = u and (not v.tete or cc.tetes > 0)));
$$;

-- La collection d'un autre lecteur, pour composer une proposition.
create or replace function public.cartes_collection_de(u uuid) returns json
  language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('c', carte, 'n', n, 't', tetes)), '[]'::json)
    from cartes_collection where user_id = u and auth.uid() is not null;
$$;

-- les paramètres portent le nom des colonnes (c'est l'API de la page) : on les fait gagner
create or replace function public.cartes_proposer(dest uuid, donne jsonb, demande jsonb, parent uuid default null) returns uuid
  language plpgsql security definer set search_path = public as $$
#variable_conflict use_variable
declare u uuid := auth.uid(); p cartes_echanges; nid uuid; t bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  if u is null then raise exception 'connexion requise' using errcode = '28000'; end if;
  donne := coalesce(donne, '[]'::jsonb); demande := coalesce(demande, '[]'::jsonb);
  perform 1 from _cartes_lot(donne); perform 1 from _cartes_lot(demande);
  if jsonb_array_length(donne) + jsonb_array_length(demande) = 0 then
    raise exception 'proposition vide' using errcode = '22023'; end if;
  if dest = u then raise exception 'pas d''échange avec soi-même' using errcode = '22023'; end if;
  if parent is not null then
    select * into p from cartes_echanges where id = parent;
    if p.id is null or p.a is not null or p.statut <> 'ouvert' then
      raise exception 'cette offre n''est plus ouverte' using errcode = 'P0001'; end if;
    if p.de = u then raise exception 'pas d''échange avec soi-même' using errcode = '22023'; end if;
    dest := p.de;
  end if;
  if dest is null and jsonb_array_length(donne) = 0 then
    raise exception 'une offre à la bourse donne au moins une carte' using errcode = '22023'; end if;
  if dest is not null and not exists (select 1 from auth.users where id = dest) then
    raise exception 'lecteur introuvable' using errcode = '22023'; end if;
  if (select count(*) from cartes_echanges where de = u and statut = 'ouvert') >= 30 then
    raise exception 'trente propositions ouvertes au plus' using errcode = 'P0001'; end if;
  if not _cartes_possede(u, donne) then
    raise exception 'carte absente de votre collection' using errcode = '22023'; end if;
  if dest is not null and not _cartes_possede(dest, demande) then
    raise exception 'carte absente de sa collection' using errcode = '22023'; end if;
  insert into cartes_echanges (de, a, parent, donne, demande, created, maj)
    values (u, dest, parent, donne, demande, t, t) returning id into nid;
  return nid;
end $$;

-- Accepter : le destinataire d'une proposition, ou n'importe qui (sauf
-- l'auteur) pour une offre de la bourse qui demande quelque chose.
create or replace function public.cartes_accepter(eid uuid) returns json
  language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); e cartes_echanges; autre uuid; t bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  if u is null then raise exception 'connexion requise' using errcode = '28000'; end if;
  select * into e from cartes_echanges where id = eid for update;
  if e.id is null or e.statut <> 'ouvert' then raise exception 'cette proposition n''est plus ouverte' using errcode = 'P0001'; end if;
  if e.a is not null and e.a <> u then raise exception 'cette proposition ne vous est pas adressée' using errcode = '42501'; end if;
  if e.a is null and (e.de = u or jsonb_array_length(e.demande) = 0) then
    raise exception 'répondez à cette offre par une proposition' using errcode = 'P0001'; end if;
  autre := e.de;
  -- verrou sur les deux collections, toujours dans le même ordre
  perform 1 from cartes_collection where user_id in (u, autre) order by user_id, carte for update;
  if not _cartes_possede(autre, e.donne) or not _cartes_possede(u, e.demande) then
    update cartes_echanges set statut = 'caduc', maj = t where id = eid;
    raise exception 'une des cartes n''est plus disponible' using errcode = 'P0001';
  end if;
  perform _cartes_bouger(autre, u, e.donne);
  perform _cartes_bouger(u, autre, e.demande);
  update cartes_echanges set statut = 'accepte', a = coalesce(a, u), maj = t where id = eid;
  -- une offre de la bourse se referme, avec toutes les réponses qu'elle avait
  if e.parent is not null then
    update cartes_echanges set statut = 'accepte', maj = t where id = e.parent and statut = 'ouvert';
    update cartes_echanges set statut = 'caduc', maj = t where parent = e.parent and id <> eid and statut = 'ouvert';
  elsif e.a is null then
    update cartes_echanges set statut = 'caduc', maj = t where parent = eid and statut = 'ouvert';
  end if;
  return json_build_object('ok', true);
end $$;

create or replace function public.cartes_refuser(eid uuid) returns json
  language plpgsql security definer set search_path = public as $$
declare u uuid := auth.uid(); n int;
begin
  if u is null then raise exception 'connexion requise' using errcode = '28000'; end if;
  update cartes_echanges set statut = case when de = u then 'annule' else 'refuse' end,
    maj = (extract(epoch from now()) * 1000)::bigint
    where id = eid and statut = 'ouvert' and (de = u or a = u);
  get diagnostics n = row_count;
  if n = 0 then raise exception 'cette proposition n''est plus ouverte' using errcode = 'P0001'; end if;
  -- retirer une offre de la bourse rend caduques les réponses qu'elle avait
  update cartes_echanges set statut = 'caduc', maj = (extract(epoch from now()) * 1000)::bigint
    where parent = eid and statut = 'ouvert';
  return json_build_object('ok', true);
end $$;

revoke all on function public._cartes_lot(jsonb)                  from public, anon, authenticated;
revoke all on function public._cartes_possede(uuid, jsonb)        from public, anon, authenticated;
revoke all on function public._cartes_bouger(uuid, uuid, jsonb)   from public, anon, authenticated;
revoke all on function public.cartes_vitrine_poser(jsonb)         from public, anon;
revoke all on function public.cartes_collection_de(uuid)          from public, anon;
revoke all on function public.cartes_proposer(uuid, jsonb, jsonb, uuid) from public, anon;
revoke all on function public.cartes_accepter(uuid)               from public, anon;
revoke all on function public.cartes_refuser(uuid)                from public, anon;
grant execute on function public.cartes_profil(uuid)              to anon, authenticated;
grant execute on function public.cartes_vitrine_poser(jsonb)      to authenticated;
grant execute on function public.cartes_collection_de(uuid)       to authenticated;
grant execute on function public.cartes_proposer(uuid, jsonb, jsonb, uuid) to authenticated;
grant execute on function public.cartes_accepter(uuid)            to authenticated;
grant execute on function public.cartes_refuser(uuid)             to authenticated;

-- ---------------------------------------------------------------------------
-- Les favoris : une collection dans la collection. Une ligne par carte marquée,
-- lisible et modifiable par son seul propriétaire. (Appliqué le 11 nov. 2026.)
create table if not exists public.cartes_favoris (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  carte   text not null references public.cartes_catalogue(id),
  created timestamptz not null default now(),
  primary key (user_id, carte)
);
alter table public.cartes_favoris enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cartes_favoris' and policyname = 'cf_select_own') then
    execute 'create policy cf_select_own on public.cartes_favoris for select using (user_id = auth.uid())';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cartes_favoris' and policyname = 'cf_insert_own') then
    execute 'create policy cf_insert_own on public.cartes_favoris for insert with check (user_id = auth.uid())';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'cartes_favoris' and policyname = 'cf_delete_own') then
    execute 'create policy cf_delete_own on public.cartes_favoris for delete using (user_id = auth.uid())';
  end if;
end $$;
grant select, insert, delete on public.cartes_favoris to authenticated;

-- ============================================================ LA JAUGE (nov. 2026)
-- Trois boosters par HEURE, plus par jour : un booster revient toutes les
-- vingt minutes, et l'on en garde vingt au plus en attente. La jauge se
-- calcule à la lecture (n, et l'instant d'où l'on compte) : rien ne tourne en
-- tâche de fond. Pleine, elle ne compte plus ; on recommence à compter quand
-- on en ouvre une. Les missions ne passent plus par la journée : elles mettent
-- leur booster dans la RÉSERVE (qui ne périme pas), trois par jour au plus.
-- On ouvre la jauge d'abord, la réserve ensuite.
create table if not exists public.cartes_jauge (
  user_id uuid    primary key references auth.users(id) on delete cascade,
  n       integer not null default 3 check (n >= 0),
  depuis  bigint  not null
);
alter table public.cartes_jauge enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
    and tablename = 'cartes_jauge' and policyname = 'cjg_select_own') then
    execute 'create policy cjg_select_own on public.cartes_jauge for select using (user_id = auth.uid())';
  end if;
end $$;

-- La jauge à cet instant : la lit, la recharge, l'écrit (verrouillée).
create or replace function public.cartes_jauge_lire(u uuid) returns public.cartes_jauge
  language plpgsql security definer set search_path = public as $$
declare
  pas constant bigint := 1200000;   -- vingt minutes : trois par heure
  maxi constant int := 20;
  maintenant bigint := (extract(epoch from now()) * 1000)::bigint;
  j cartes_jauge; gagne bigint;
begin
  insert into cartes_jauge (user_id, n, depuis) values (u, 3, maintenant) on conflict do nothing;
  select * into j from cartes_jauge where user_id = u for update;
  if j.n >= maxi then
    j.n := maxi; j.depuis := maintenant;
  else
    gagne := (maintenant - j.depuis) / pas;
    if gagne > 0 then
      j.n := least(maxi, j.n + gagne);
      j.depuis := case when j.n >= maxi then maintenant else j.depuis + gagne * pas end;
    end if;
  end if;
  update cartes_jauge set n = j.n, depuis = j.depuis where user_id = u;
  return j;
end $$;
revoke all on function public.cartes_jauge_lire(uuid) from public, anon, authenticated;

create or replace function public.cartes_etat() returns json
  language plpgsql security definer set search_path = public as $$
declare
  u uuid := auth.uid();
  b smallint := 0; res int := 0; j cartes_jauge;
  maintenant bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  if u is null then raise exception 'connexion requise' using errcode = '28000'; end if;
  j := cartes_jauge_lire(u);
  select bonus into b from cartes_jours where user_id = u and jour = cartes_jour();
  select boosters into res from cartes_reserve where user_id = u;
  return json_build_object(
    'jour', cartes_jour(), 'maintenant', maintenant,
    'jauge', j.n, 'jaugeMax', 20, 'pas', 1200000,
    'prochain', case when j.n >= 20 then null else j.depuis + 1200000 end,
    'bonus', coalesce(b, 0), 'reserve', coalesce(res, 0),
    'restants', j.n + coalesce(res, 0),
    'missions', (select coalesce(json_agg(mission), '[]'::json) from cartes_missions
                 where user_id = u and jour = cartes_jour()),
    'possedees', (select count(*) from cartes_collection where user_id = u));
end $$;

create or replace function public.cartes_ouvrir() returns json
  language plpgsql security definer set search_path = public as $$
declare
  u uuid := auth.uid();
  res int := 0;
  j cartes_jauge;
  tirage text[] := '{}';
  brill boolean[] := '{}';
  rang int; x float8; c text; i int;
  grand boolean := random() < 0.005;   -- le Grand Soir : un booster sur deux cents
  out_json json;
begin
  if u is null then raise exception 'connexion requise' using errcode = '28000'; end if;
  j := cartes_jauge_lire(u);
  select boosters into res from cartes_reserve where user_id = u for update;
  res := coalesce(res, 0);
  if j.n <= 0 and res <= 0 then
    raise exception 'plus de booster pour l''instant' using errcode = 'P0001';
  end if;
  for i in 1..5 loop
    x := random() * 100;
    if grand then
      rang := case when i = 5 or x < 25 then 4 else 3 end;
    elsif i < 5 then
      rang := case when x < 0.5 then 4 when x < 4 then 3 when x < 14 then 2 when x < 40 then 1 else 0 end;
    else
      rang := case when x < 1.5 then 4 when x < 8 then 3 when x < 30 then 2 else 1 end;
    end if;
    select id into c from cartes_catalogue where actif and r = rang order by random() limit 1;
    if c is null then
      select id into c from cartes_catalogue where actif order by random() limit 1;
    end if;
    tirage := tirage || c;
    brill := brill || (random() < case when grand then 0.2 else 0.02 end);
  end loop;

  select json_agg(json_build_object('id', t.id, 'tete', t.tete,
           'nouvelle', cc.carte is null and t.k = 1,
           'nouvelleTete', t.tete and coalesce(cc.tetes, 0) = 0 and t.kt = 1) order by t.o)
    into out_json
    from (select id, tete, o,
                 row_number() over (partition by id order by o) as k,
                 row_number() over (partition by id, tete order by o) as kt
          from unnest(tirage, brill) with ordinality as z(id, tete, o)) t
    left join cartes_collection cc on cc.user_id = u and cc.carte = t.id;

  insert into cartes_collection (user_id, carte, n, tetes, premiere)
    select u, id, count(*), count(*) filter (where tete), (extract(epoch from now()) * 1000)::bigint
      from unnest(tirage, brill) as z(id, tete) group by id
    on conflict (user_id, carte) do update
      set n = cartes_collection.n + excluded.n, tetes = cartes_collection.tetes + excluded.tetes;

  if j.n > 0 then
    -- pleine, la jauge ne comptait plus : elle recommence à compter maintenant
    update cartes_jauge set n = n - 1,
      depuis = case when j.n >= 20 then (extract(epoch from now()) * 1000)::bigint else depuis end
      where user_id = u;
  else
    update cartes_reserve set boosters = boosters - 1,
      maj = (extract(epoch from now()) * 1000)::bigint where user_id = u;
    res := res - 1;
  end if;
  return (cartes_etat()::jsonb || jsonb_build_object('cartes', out_json, 'grandSoir', grand))::json;
end $$;

-- Une mission : un booster dans la réserve, une fois par jour et par mission,
-- trois au plus par jour.
create or replace function public.cartes_mission(m text) returns json
  language plpgsql security definer set search_path = public as $$
declare
  u uuid := auth.uid();
  jr date := cartes_jour();
  n int;
  avant smallint;
begin
  if u is null then raise exception 'connexion requise' using errcode = '28000'; end if;
  if m not in ('lecture', 'notion', 'annotation', 'questions', 'circuit', 'forum', 'commentaire') then
    raise exception 'mission inconnue' using errcode = '22023';
  end if;
  insert into cartes_missions (user_id, mission, jour, created)
    values (u, m, jr, (extract(epoch from now()) * 1000)::bigint) on conflict do nothing;
  get diagnostics n = row_count;
  select coalesce(bonus, 0) into avant from cartes_jours where user_id = u and jour = jr;
  avant := coalesce(avant, 0);
  if n > 0 and avant < 3 then
    insert into cartes_jours (user_id, jour, bonus) values (u, jr, 1)
      on conflict (user_id, jour) do update set bonus = cartes_jours.bonus + 1;
    insert into cartes_reserve (user_id, boosters, maj)
      values (u, 1, (extract(epoch from now()) * 1000)::bigint)
      on conflict (user_id) do update set boosters = cartes_reserve.boosters + 1, maj = excluded.maj;
  end if;
  return (cartes_etat()::jsonb || jsonb_build_object('gagne', n > 0 and avant < 3))::json;
end $$;

revoke all on function public.cartes_etat()        from public, anon;
revoke all on function public.cartes_ouvrir()      from public, anon;
revoke all on function public.cartes_mission(text) from public, anon;
grant execute on function public.cartes_etat()        to authenticated;
grant execute on function public.cartes_ouvrir()      to authenticated;
grant execute on function public.cartes_mission(text) to authenticated;
