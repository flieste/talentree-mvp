-- =========================================================
-- TalenTree — esquema inicial (Etapa 1: MVP jugador)
-- Preparado desde el inicio para incorporar el rol CLUB.
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('player', 'club');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.player_position as enum ('arquero', 'defensor', 'mediocampista', 'delantero');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------
-- profiles: extiende auth.users con el rol (player | club)
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'player',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- players: perfil deportivo del jugador
-- ---------------------------------------------------------
create table if not exists public.players (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  birth_date date not null,
  current_club text,
  height_cm numeric check (height_cm is null or height_cm > 0),
  weight_kg numeric check (weight_kg is null or weight_kg > 0),
  position public.player_position,
  avatar_url text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_user_id_unique unique (user_id)
);

create index if not exists players_position_idx on public.players (position);

-- ---------------------------------------------------------
-- previous_clubs: clubes anteriores del jugador (1 a muchos)
-- ---------------------------------------------------------
create table if not exists public.previous_clubs (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references public.players (id) on delete cascade,
  club_name text not null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create index if not exists previous_clubs_player_id_idx on public.previous_clubs (player_id);

-- ---------------------------------------------------------
-- highlight_videos: videos de highlights (por URL, sin upload)
-- ---------------------------------------------------------
create table if not exists public.highlight_videos (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references public.players (id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create index if not exists highlight_videos_player_id_idx on public.highlight_videos (player_id);

-- ---------------------------------------------------------
-- clubs: preparado para Fase 2 (perfil institucional del club)
-- ---------------------------------------------------------
create table if not exists public.clubs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users (id) on delete cascade,
  club_name text not null,
  logo_url text,
  city text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clubs_user_id_unique unique (user_id)
);

-- ---------------------------------------------------------
-- conversations / messages: preparado para Fase 3 (chat club <-> jugador)
-- ---------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references public.players (id) on delete cascade,
  club_id uuid not null references public.clubs (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_unique_pair unique (player_id, club_id)
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null,
  sender_type public.user_role not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id);

-- ---------------------------------------------------------
-- Trigger: crea profile (+ player si corresponde) al registrarse
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_role public.user_role;
begin
  new_role := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'player');

  insert into public.profiles (id, role)
  values (new.id, new_role)
  on conflict (id) do nothing;

  if new_role = 'player' then
    insert into public.players (user_id, first_name, last_name, birth_date)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'first_name', ''),
      coalesce(new.raw_user_meta_data ->> 'last_name', ''),
      coalesce((new.raw_user_meta_data ->> 'birth_date')::date, current_date)
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_players_updated_at on public.players;
create trigger set_players_updated_at
  before update on public.players
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_clubs_updated_at on public.clubs;
create trigger set_clubs_updated_at
  before update on public.clubs
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.previous_clubs enable row level security;
alter table public.highlight_videos enable row level security;
alter table public.clubs enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- profiles: cada usuario ve y actualiza únicamente su propio registro
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- players: la visibilidad es pública (scouting), pero solo el dueño edita
create policy "players_select_all" on public.players
  for select using (true);

create policy "players_insert_own" on public.players
  for insert with check (auth.uid() = user_id);

create policy "players_update_own" on public.players
  for update using (auth.uid() = user_id);

create policy "players_delete_own" on public.players
  for delete using (auth.uid() = user_id);

-- previous_clubs: lectura pública, escritura solo del dueño del player
create policy "previous_clubs_select_all" on public.previous_clubs
  for select using (true);

create policy "previous_clubs_insert_own" on public.previous_clubs
  for insert with check (
    exists (
      select 1 from public.players p
      where p.id = player_id and p.user_id = auth.uid()
    )
  );

create policy "previous_clubs_update_own" on public.previous_clubs
  for update using (
    exists (
      select 1 from public.players p
      where p.id = player_id and p.user_id = auth.uid()
    )
  );

create policy "previous_clubs_delete_own" on public.previous_clubs
  for delete using (
    exists (
      select 1 from public.players p
      where p.id = player_id and p.user_id = auth.uid()
    )
  );

-- highlight_videos: lectura pública, escritura solo del dueño del player
create policy "highlight_videos_select_all" on public.highlight_videos
  for select using (true);

create policy "highlight_videos_insert_own" on public.highlight_videos
  for insert with check (
    exists (
      select 1 from public.players p
      where p.id = player_id and p.user_id = auth.uid()
    )
  );

create policy "highlight_videos_delete_own" on public.highlight_videos
  for delete using (
    exists (
      select 1 from public.players p
      where p.id = player_id and p.user_id = auth.uid()
    )
  );

-- clubs (Fase 2): cada club solo ve/edita su propio perfil institucional por ahora
create policy "clubs_select_own" on public.clubs
  for select using (auth.uid() = user_id);

create policy "clubs_insert_own" on public.clubs
  for insert with check (auth.uid() = user_id);

create policy "clubs_update_own" on public.clubs
  for update using (auth.uid() = user_id);

-- conversations (Fase 3): visibles solo para el jugador o club participante
create policy "conversations_select_participant" on public.conversations
  for select using (
    exists (select 1 from public.players p where p.id = player_id and p.user_id = auth.uid())
    or exists (select 1 from public.clubs c where c.id = club_id and c.user_id = auth.uid())
  );

-- messages (Fase 3): visibles solo para participantes de la conversación
create policy "messages_select_participant" on public.messages
  for select using (
    exists (
      select 1 from public.conversations conv
      where conv.id = conversation_id
        and (
          exists (select 1 from public.players p where p.id = conv.player_id and p.user_id = auth.uid())
          or exists (select 1 from public.clubs c where c.id = conv.club_id and c.user_id = auth.uid())
        )
    )
  );

create policy "messages_insert_participant" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations conv
      where conv.id = conversation_id
        and (
          exists (select 1 from public.players p where p.id = conv.player_id and p.user_id = auth.uid())
          or exists (select 1 from public.clubs c where c.id = conv.club_id and c.user_id = auth.uid())
        )
    )
  );
