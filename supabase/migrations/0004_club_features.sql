-- =========================================================
-- TalenTree — Funciones del perfil CLUB
--   · Jugadores: nacionalidad y calificación (la asigna el equipo)
--   · Responsables de la cuenta del club (varios mails)
--   · Avisos del club hacia TalenTree (pruebas, eventos)
--   · Chat club <-> jugador: permisos para abrir conversaciones
-- Ejecutar después de 0003_avatars.sql
-- =========================================================

-- ---------------------------------------------------------
-- players: nacionalidad + calificación
-- ---------------------------------------------------------
alter table public.players
  add column if not exists nationality text,
  add column if not exists rating numeric(3,1)
    check (rating is null or (rating >= 0 and rating <= 10));

create index if not exists players_nationality_idx on public.players (nationality);
create index if not exists players_rating_idx on public.players (rating);

-- La calificación la asigna el equipo de TalenTree (SQL Editor / Table Editor /
-- service role). Si un usuario de la app intenta cambiarla, se ignora.
create or replace function public.protect_player_rating()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.rating := null;
    else
      new.rating := old.rating;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_players_rating on public.players;
create trigger protect_players_rating
  before insert or update on public.players
  for each row execute procedure public.protect_player_rating();

-- ---------------------------------------------------------
-- handle_new_user: ahora también crea la fila en `clubs` para el rol club
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
  elsif new_role = 'club' then
    insert into public.clubs (user_id, club_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'club_name', ''))
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------
-- clubs: el nombre del club es información pública (lo ve el jugador en el chat)
-- ---------------------------------------------------------
drop policy if exists "clubs_select_own" on public.clubs;
create policy "clubs_select_all" on public.clubs
  for select using (true);

-- ---------------------------------------------------------
-- club_managers: responsables de manejar la cuenta del club
-- ---------------------------------------------------------
create table if not exists public.club_managers (
  id uuid primary key default uuid_generate_v4(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  full_name text not null,
  role_title text,
  email text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists club_managers_email_unique
  on public.club_managers (club_id, lower(email));

alter table public.club_managers enable row level security;

create policy "club_managers_select_own" on public.club_managers
  for select using (
    exists (select 1 from public.clubs c where c.id = club_id and c.user_id = auth.uid())
  );
create policy "club_managers_insert_own" on public.club_managers
  for insert with check (
    exists (select 1 from public.clubs c where c.id = club_id and c.user_id = auth.uid())
  );
create policy "club_managers_delete_own" on public.club_managers
  for delete using (
    exists (select 1 from public.clubs c where c.id = club_id and c.user_id = auth.uid())
  );

-- ---------------------------------------------------------
-- club_announcements: avisos del club para el equipo de TalenTree.
-- El club los envía; el equipo los revisa y, si corresponde, los publica en
-- `news` y cambia el estado a 'publicado' (o 'rechazado' + team_note).
-- ---------------------------------------------------------
do $$ begin
  create type public.announcement_status as enum ('pendiente', 'publicado', 'rechazado');
exception when duplicate_object then null; end $$;

create table if not exists public.club_announcements (
  id uuid primary key default uuid_generate_v4(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  title text not null,
  description text,
  category public.news_category not null default 'prueba_club',
  proposed_date date,
  location text,
  status public.announcement_status not null default 'pendiente',
  team_note text,
  created_at timestamptz not null default now()
);

create index if not exists club_announcements_club_idx on public.club_announcements (club_id);
create index if not exists club_announcements_status_idx on public.club_announcements (status);

alter table public.club_announcements enable row level security;

create policy "club_announcements_select_own" on public.club_announcements
  for select using (
    exists (select 1 from public.clubs c where c.id = club_id and c.user_id = auth.uid())
  );
create policy "club_announcements_insert_own" on public.club_announcements
  for insert with check (
    status = 'pendiente'
    and exists (select 1 from public.clubs c where c.id = club_id and c.user_id = auth.uid())
  );
-- El club solo puede retirar un aviso mientras sigue pendiente.
create policy "club_announcements_delete_pending" on public.club_announcements
  for delete using (
    status = 'pendiente'
    and exists (select 1 from public.clubs c where c.id = club_id and c.user_id = auth.uid())
  );

-- ---------------------------------------------------------
-- Chat: el club puede abrir una conversación con un jugador
-- ---------------------------------------------------------
create policy "conversations_insert_club" on public.conversations
  for insert with check (
    exists (select 1 from public.clubs c where c.id = club_id and c.user_id = auth.uid())
  );

-- Cada mensaje nuevo "sube" la conversación en la lista de chats.
create or replace function public.touch_conversation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row execute procedure public.touch_conversation();

-- Mensajes en tiempo real (Supabase Realtime respeta las políticas RLS).
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
