-- =========================================================
-- TalenTree — Lista de espera de la landing
-- Ejecutar después de 0005_security_hardening.sql
--
-- Guarda los datos que dejan los jugadores en el formulario de la landing
-- ("Sumate a la lista"), para medir cuántas personas quieren una cuenta.
--
-- Seguridad:
--   * Cualquiera puede ANOTARSE (insert), pero nadie puede LEER la tabla
--     desde la app ni desde la API pública: no hay política de select.
--     Los datos se ven solo desde el panel de Supabase (Table Editor / SQL
--     Editor) o con la service role.
--   * Los límites de largo y el formato de email se validan acá también,
--     no solo en el formulario.
--   * Un email no se puede anotar dos veces (índice único, sin importar
--     mayúsculas).
-- =========================================================

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null check (char_length(btrim(name)) between 1 and 80),
  email      text not null check (
               char_length(email) <= 254
               and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
             ),
  contact    text not null check (char_length(btrim(contact)) between 3 and 80),
  -- Canal de origen opcional (landing con ?src=instagram, ?src=club-x, etc.)
  source     text check (source is null or char_length(source) <= 40),
  -- Solo se guarda la fila si la persona aceptó que la contactemos.
  consent    boolean not null default false check (consent)
);

create unique index if not exists waitlist_email_unique
  on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

drop policy if exists "waitlist: cualquiera puede anotarse" on public.waitlist;
create policy "waitlist: cualquiera puede anotarse"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

-- Solo insert: sin select, update ni delete para la API pública.
revoke all on public.waitlist from anon, authenticated;
grant insert on public.waitlist to anon, authenticated;

-- Para ver cuántas personas se anotaron (SQL Editor de Supabase):
--   select count(*) from public.waitlist;
--   select source, count(*) from public.waitlist group by source order by 2 desc;
