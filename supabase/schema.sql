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

-- ── Tiempo real ─────────────────────────────────────────────
-- (players se queda fuera a propósito para no emitir nunca el pin_hash)

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
