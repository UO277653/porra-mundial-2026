-- ============================================================
-- PORRA MUNDIAL 2026 — Esquema de Supabase
-- Pega este archivo entero en el SQL Editor de tu proyecto
-- Supabase y pulsa RUN. Se puede ejecutar varias veces sin problema.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- ── Tablas ──────────────────────────────────────────────────

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pin_hash text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists players_name_unique on public.players (lower(name));

create table if not exists public.matches (
  id bigint primary key,          -- id del partido en football-data.org
  stage text not null,
  group_name text,
  matchday int,
  utc_date timestamptz not null,
  status text not null,
  home_team text,
  home_crest text,
  away_team text,
  away_crest text,
  home_score int,
  away_score int,
  winner text,
  updated_at timestamptz not null default now()
);

create table if not exists public.bets (
  id bigserial primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  match_id bigint not null references public.matches (id) on delete cascade,
  pick text not null check (pick in ('1', 'X', '2')),
  updated_at timestamptz not null default now(),
  unique (player_id, match_id)
);

-- ── Seguridad (RLS) ─────────────────────────────────────────

alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.bets enable row level security;

-- players: cualquiera puede leer id y nombre, pero NUNCA el pin
revoke all on table public.players from anon, authenticated;
grant select (id, name, created_at) on public.players to anon, authenticated;
drop policy if exists players_read on public.players;
create policy players_read on public.players for select using (true);

-- matches: lectura libre
drop policy if exists matches_read on public.matches;
create policy matches_read on public.matches for select using (true);

-- bets: las apuestas de los demás solo se ven cuando el partido ya ha empezado
drop policy if exists bets_read_started on public.bets;
create policy bets_read_started on public.bets for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and m.utc_date <= now()
    )
  );

-- ── Funciones (toda escritura pasa por aquí, validando el PIN) ──

create or replace function public.register_player(p_name text, p_pin text)
returns uuid
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if length(trim(p_name)) < 2 or length(trim(p_name)) > 20 then
    raise exception 'El nombre debe tener entre 2 y 20 caracteres';
  end if;
  if p_pin !~ '^\d{4,6}$' then
    raise exception 'El PIN deben ser 4 a 6 dígitos';
  end if;
  if exists (select 1 from players where lower(name) = lower(trim(p_name))) then
    raise exception 'Ese nombre ya existe';
  end if;
  insert into players (name, pin_hash)
  values (trim(p_name), crypt(p_pin, gen_salt('bf')))
  returning id into v_id;
  return v_id;
end
$$;

create or replace function public.login_player(p_name text, p_pin text)
returns uuid
language sql security definer set search_path = public, extensions
as $$
  select id from players
  where lower(name) = lower(trim(p_name))
    and pin_hash = crypt(p_pin, pin_hash);
$$;

create or replace function public.place_bet(
  p_player uuid, p_pin text, p_match bigint, p_pick text
)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_match matches%rowtype;
begin
  if not exists (
    select 1 from players
    where id = p_player and pin_hash = crypt(p_pin, pin_hash)
  ) then
    raise exception 'PIN incorrecto';
  end if;

  select * into v_match from matches where id = p_match;
  if not found then
    raise exception 'Partido no encontrado';
  end if;
  if v_match.utc_date <= now() or v_match.status not in ('SCHEDULED', 'TIMED') then
    raise exception 'Este partido ya ha empezado';
  end if;
  if p_pick not in ('1', 'X', '2') then
    raise exception 'Apuesta no válida';
  end if;
  -- En eliminatorias se apuesta quién pasa: no existe la X
  if v_match.stage <> 'GROUP_STAGE' and p_pick = 'X' then
    raise exception 'En eliminatorias no hay empate: elige quién pasa';
  end if;

  insert into bets (player_id, match_id, pick)
  values (p_player, p_match, p_pick)
  on conflict (player_id, match_id)
  do update set pick = excluded.pick, updated_at = now();
end
$$;

create or replace function public.my_bets(p_player uuid, p_pin text)
returns table (match_id bigint, pick text)
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not exists (
    select 1 from players
    where id = p_player and pin_hash = crypt(p_pin, pin_hash)
  ) then
    raise exception 'PIN incorrecto';
  end if;
  return query select b.match_id, b.pick from bets b where b.player_id = p_player;
end
$$;

grant execute on function
  public.register_player(text, text),
  public.login_player(text, text),
  public.place_bet(uuid, text, bigint, text),
  public.my_bets(uuid, text)
to anon, authenticated;

-- ── El trono: dos campeonatos independientes ────────────────
-- Hay dos campeonatos (fase de grupos y eliminatoria), cada uno
-- con su propio campeón. El nº 1 de CADA fase puede poner un
-- bocadillo (texto/GIF/foto) sobre su nombre en el podio de esa
-- fase, y cualquiera de los dos reyes puede renombrar la porra.
-- El servidor recalcula quién lidera cada fase antes de aceptar.

create table if not exists public.app_settings (
  id int primary key default 1 check (id = 1),
  title text,
  title_by uuid references public.players (id) on delete set null,
  -- Bocadillo del campeón de la fase de grupos
  crown_message text,
  crown_gif text,
  crown_message_by uuid references public.players (id) on delete set null,
  -- Bocadillo del campeón de la eliminatoria
  ko_message text,
  ko_gif text,
  ko_message_by uuid references public.players (id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (1) on conflict do nothing;
-- Columnas nuevas para despliegues que ya tenían la tabla
alter table public.app_settings add column if not exists ko_message text;
alter table public.app_settings add column if not exists ko_gif text;
alter table public.app_settings add column if not exists ko_message_by uuid references public.players (id) on delete set null;

alter table public.app_settings enable row level security;
drop policy if exists settings_read on public.app_settings;
create policy settings_read on public.app_settings for select using (true);

-- Campeón de una fase (p_knockout = false → grupos, true → eliminatoria).
-- Misma lógica de puntos que el frontend (1 grupos / 2 eliminatoria).
-- Devuelve NULL si nadie ha puntuado aún en esa fase (no hay rey todavía).
create or replace function public.phase_leader(p_knockout boolean)
returns uuid
language sql stable security definer set search_path = public
as $$
  with points as (
    select
      b.player_id,
      case
        when b.pick = case
          when p_knockout then
            case m.winner when 'HOME_TEAM' then '1' when 'AWAY_TEAM' then '2' else null end
          when m.home_score > m.away_score then '1'
          when m.home_score < m.away_score then '2'
          else 'X'
        end
        then case when p_knockout then 2 else 1 end
        else 0
      end as pts
    from bets b
    join matches m on m.id = b.match_id
      and m.status = 'FINISHED'
      and (m.stage <> 'GROUP_STAGE') = p_knockout
  ),
  totals as (
    select player_id, sum(pts) as total, count(*) filter (where pts > 0) as hits
    from points group by player_id
  )
  select t.player_id
  from totals t
  join players p on p.id = t.player_id
  where t.total > 0
  order by t.total desc, t.hits desc, lower(p.name) asc
  limit 1;
$$;

-- ¿Es este jugador uno de los campeones de la fase? (true si empata en el
-- máximo de puntos, >0). Permite que VARIOS empatados compartan el trono.
create or replace function public.is_phase_leader(p_player uuid, p_knockout boolean)
returns boolean
language sql stable security definer set search_path = public
as $$
  with points as (
    select
      b.player_id,
      case
        when b.pick = case
          when p_knockout then
            case m.winner when 'HOME_TEAM' then '1' when 'AWAY_TEAM' then '2' else null end
          when m.home_score > m.away_score then '1'
          when m.home_score < m.away_score then '2'
          else 'X'
        end
        then case when p_knockout then 2 else 1 end
        else 0
      end as pts
    from bets b
    join matches m on m.id = b.match_id
      and m.status = 'FINISHED'
      and (m.stage <> 'GROUP_STAGE') = p_knockout
  ),
  totals as (select player_id, sum(pts) as total from points group by player_id)
  select coalesce((
    select t.total > 0 and t.total = (select max(total) from totals)
    from totals t where t.player_id = p_player
  ), false);
$$;

-- Bocadillo por persona y fase: cada co-campeón guarda el suyo (con tamaño).
create table if not exists public.throne_bubbles (
  player_id uuid not null references public.players (id) on delete cascade,
  phase text not null check (phase in ('GROUP', 'KNOCKOUT')),
  message text,
  gif text,
  size int not null default 1 check (size between 1 and 4),
  updated_at timestamptz not null default now(),
  primary key (player_id, phase)
);

alter table public.throne_bubbles enable row level security;
drop policy if exists bubbles_read on public.throne_bubbles;
create policy bubbles_read on public.throne_bubbles for select using (true);

-- Migración: traer los bocadillos antiguos (hueco único en app_settings)
-- a la nueva tabla por persona, si existían.
insert into public.throne_bubbles (player_id, phase, message, gif, size)
select crown_message_by, 'GROUP', crown_message, crown_gif, 1
from public.app_settings where id = 1 and crown_message_by is not null
on conflict (player_id, phase) do nothing;
insert into public.throne_bubbles (player_id, phase, message, gif, size)
select ko_message_by, 'KNOCKOUT', ko_message, ko_gif, 1
from public.app_settings where id = 1 and ko_message_by is not null
on conflict (player_id, phase) do nothing;

-- Compat: drop de firmas antiguas del trono antes de recrear
drop function if exists public.set_throne(uuid, text, text, text, text);
drop function if exists public.set_throne(uuid, text, text, text, text, text);
drop function if exists public.current_leader();

create or replace function public.set_throne(
  p_player uuid, p_pin text, p_phase text, p_message text, p_gif text, p_title text, p_size int
)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  v_knockout boolean;
  v_title text := nullif(trim(p_title), '');
  v_size int := greatest(1, least(4, coalesce(p_size, 1)));
begin
  if not exists (
    select 1 from players
    where id = p_player and pin_hash = crypt(p_pin, pin_hash)
  ) then
    raise exception 'PIN incorrecto';
  end if;
  if p_phase not in ('GROUP', 'KNOCKOUT') then
    raise exception 'Fase no válida';
  end if;
  v_knockout := (p_phase = 'KNOCKOUT');
  if not is_phase_leader(p_player, v_knockout) then
    raise exception 'Solo el campeón de esta fase puede hacer esto. ¡Gana partidos!';
  end if;
  if length(coalesce(p_message, '')) > 80 then
    raise exception 'El mensaje no puede pasar de 80 caracteres';
  end if;
  if length(coalesce(p_title, '')) > 40 then
    raise exception 'El nombre de la porra no puede pasar de 40 caracteres';
  end if;
  if coalesce(p_gif, '') <> '' and p_gif !~ '^https://\S+$' then
    raise exception 'El GIF debe ser un enlace https válido';
  end if;
  if length(coalesce(p_gif, '')) > 300 then
    raise exception 'El enlace del GIF es demasiado largo';
  end if;

  -- Tu bocadillo de esta fase (upsert por persona)
  insert into throne_bubbles (player_id, phase, message, gif, size)
  values (p_player, p_phase, nullif(trim(p_message), ''), nullif(trim(p_gif), ''), v_size)
  on conflict (player_id, phase)
  do update set message = excluded.message, gif = excluded.gif, size = excluded.size, updated_at = now();

  -- El nombre de la porra sigue siendo global (una conquista compartida)
  update app_settings set
    title = v_title,
    title_by = case when v_title is null then null else p_player end,
    updated_at = now()
  where id = 1;
end
$$;

grant execute on function
  public.phase_leader(boolean),
  public.is_phase_leader(uuid, boolean),
  public.set_throne(uuid, text, text, text, text, text, int)
to anon, authenticated;

-- Fotos del bocadillo: bucket público con límite de 2 MB por archivo
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('porra', 'porra', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists porra_media_read on storage.objects;
create policy porra_media_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'porra');
drop policy if exists porra_media_upload on storage.objects;
create policy porra_media_upload on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'porra');

-- ── Reacciones a la actividad (partidos acabados) ───────────

create table if not exists public.reactions (
  id bigserial primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  match_id bigint not null references public.matches (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (player_id, match_id)
);

alter table public.reactions enable row level security;
drop policy if exists reactions_read on public.reactions;
create policy reactions_read on public.reactions for select using (true);

create or replace function public.react(
  p_player uuid, p_pin text, p_match bigint, p_emoji text
)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not exists (
    select 1 from players
    where id = p_player and pin_hash = crypt(p_pin, pin_hash)
  ) then
    raise exception 'PIN incorrecto';
  end if;

  -- Emoji vacío = quitar tu reacción
  if coalesce(p_emoji, '') = '' then
    delete from reactions where player_id = p_player and match_id = p_match;
    return;
  end if;

  if p_emoji not in ('😂', '😭', '🔥', '👏', '💀', '🤡', '😱', '❤️') then
    raise exception 'Reacción no válida';
  end if;
  if not exists (select 1 from matches where id = p_match and status = 'FINISHED') then
    raise exception 'Solo se puede reaccionar a partidos acabados';
  end if;

  insert into reactions (player_id, match_id, emoji)
  values (p_player, p_match, p_emoji)
  on conflict (player_id, match_id)
  do update set emoji = excluded.emoji, created_at = now();
end
$$;

grant execute on function public.react(uuid, text, bigint, text) to anon, authenticated;

-- ── Tiempo real ─────────────────────────────────────────────
-- (players se queda fuera a propósito para no emitir nunca el pin_hash)

do $$
begin
  alter publication supabase_realtime add table public.app_settings;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.reactions;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.throne_bubbles;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.matches;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.bets;
exception when duplicate_object then null;
end $$;
