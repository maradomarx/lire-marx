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

-- Trois boosters par jour, et au plus trois de plus par les missions.
create or replace function public.cartes_etat() returns json
  language plpgsql security definer set search_path = public as $$
declare
  u uuid := auth.uid();
  o smallint := 0; b smallint := 0;
begin
  if u is null then raise exception 'connexion requise' using errcode = '28000'; end if;
  select ouverts, bonus into o, b from cartes_jours where user_id = u and jour = cartes_jour();
  return json_build_object(
    'jour', cartes_jour(), 'parJour', 3, 'ouverts', coalesce(o, 0), 'bonus', coalesce(b, 0),
    'restants', greatest(0, 3 + coalesce(b, 0) - coalesce(o, 0)),
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
  tirage text[] := '{}';
  brill boolean[] := '{}';   -- pas « tetes » : ce serait le nom d'une colonne
  rang int; x float8; c text; i int;
  res json;
begin
  if u is null then raise exception 'connexion requise' using errcode = '28000'; end if;
  insert into cartes_jours (user_id, jour) values (u, jr) on conflict do nothing;
  select * into lig from cartes_jours where user_id = u and jour = jr for update;
  if lig.ouverts >= 3 + lig.bonus then
    raise exception 'plus de booster aujourd''hui' using errcode = 'P0001';
  end if;
  for i in 1..5 loop
    x := random() * 100;
    if i < 5 then
      rang := case when x < 0.5 then 4 when x < 4 then 3 when x < 14 then 2 when x < 40 then 1 else 0 end;
    else
      rang := case when x < 1.5 then 4 when x < 8 then 3 when x < 30 then 2 else 1 end;
    end if;
    select id into c from cartes_catalogue where actif and r = rang order by random() limit 1;
    if c is null then
      select id into c from cartes_catalogue where actif order by random() limit 1;
    end if;
    tirage := tirage || c;
    brill := brill || (random() < 0.02);
  end loop;

  -- « nouvelle » : absente de la collection avant ce booster, et seulement à
  -- sa première apparition dans le booster.
  select json_agg(json_build_object('id', t.id, 'tete', t.tete,
           'nouvelle', cc.carte is null and t.k = 1,
           'nouvelleTete', t.tete and coalesce(cc.tetes, 0) = 0 and t.kt = 1) order by t.o)
    into res
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

  update cartes_jours set ouverts = ouverts + 1 where user_id = u and jour = jr;
  return json_build_object('cartes', res, 'restants', 3 + lig.bonus - lig.ouverts - 1);
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
begin
  if u is null then raise exception 'connexion requise' using errcode = '28000'; end if;
  if m not in ('lecture', 'notion', 'annotation', 'questions', 'circuit', 'forum', 'commentaire') then
    raise exception 'mission inconnue' using errcode = '22023';
  end if;
  insert into cartes_missions (user_id, mission, jour, created)
    values (u, m, jr, (extract(epoch from now()) * 1000)::bigint) on conflict do nothing;
  get diagnostics n = row_count;
  if n > 0 then
    insert into cartes_jours (user_id, jour, bonus) values (u, jr, 1)
      on conflict (user_id, jour) do update set bonus = least(3, cartes_jours.bonus + 1);
  end if;
  return cartes_etat();
end $$;

revoke all on function public.cartes_etat()        from public, anon;
revoke all on function public.cartes_ouvrir()      from public, anon;
revoke all on function public.cartes_mission(text) from public, anon;
grant execute on function public.cartes_etat()        to authenticated;
grant execute on function public.cartes_ouvrir()      to authenticated;
grant execute on function public.cartes_mission(text) to authenticated;
