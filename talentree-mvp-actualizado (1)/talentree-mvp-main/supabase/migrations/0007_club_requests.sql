-- =========================================================
-- TalenTree — Solicitudes de cuenta de club
-- Ejecutar después de 0006_waitlist.sql
--
-- Los clubes NO pueden registrarse solos (ver 0005). Piden una cuenta con el
-- formulario público /solicitar-club y el equipo de TalenTree la crea a mano.
--
-- Seguridad (mismo criterio que la waitlist):
--   * Cualquiera puede ENVIAR una solicitud (insert), pero nadie puede leerla
--     desde la app ni la API pública: no hay política de select.
--     Se ven desde el panel de Supabase (Table Editor / SQL Editor).
--   * Largos y formato de email se validan también acá.
--   * Un mismo email no puede tener dos solicitudes pendientes a la vez.
-- =========================================================

create table if not exists public.club_requests (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  club_name    text not null check (char_length(btrim(club_name)) between 1 and 100),
  city         text check (city is null or char_length(city) <= 80),
  contact_name text not null check (char_length(btrim(contact_name)) between 1 and 80),
  role_title   text check (role_title is null or char_length(role_title) <= 60),
  email        text not null check (
                 char_length(email) <= 254
                 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
               ),
  phone        text check (phone is null or char_length(phone) <= 40),
  message      text check (message is null or char_length(message) <= 1000),
  status       text not null default 'pendiente'
                 check (status in ('pendiente', 'aprobada', 'rechazada')),
  consent      boolean not null default false check (consent)
);

create unique index if not exists club_requests_pending_email_unique
  on public.club_requests (lower(email)) where status = 'pendiente';

alter table public.club_requests enable row level security;

drop policy if exists "club_requests: cualquiera puede solicitar" on public.club_requests;
create policy "club_requests: cualquiera puede solicitar"
  on public.club_requests
  for insert
  to anon, authenticated
  with check (status = 'pendiente');

revoke all on public.club_requests from anon, authenticated;
grant insert on public.club_requests to anon, authenticated;

-- Para revisar las solicitudes (SQL Editor de Supabase):
--   select created_at, club_name, city, contact_name, email, phone, message
--   from public.club_requests where status = 'pendiente' order by created_at;
-- Después de crear la cuenta del club, marcala:
--   update public.club_requests set status = 'aprobada' where id = '...';
