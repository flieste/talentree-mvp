-- =========================================================
-- TalenTree — Panel de administración (cuenta "TalenTree")
-- Ejecutar después de 0007_club_requests.sql
--
-- Qué hace:
--   1) Lista de mails autorizados (admin_emails). Solo se edita desde el SQL
--      Editor / Table Editor de Supabase: la app y la API pública no la ven.
--   2) is_talentree_admin(): true solo si la sesión es de un mail de esa lista
--      Y ese mail está confirmado en Supabase Auth.
--   3) Políticas RLS para que el admin gestione noticias, avisos de clubes y
--      solicitudes de cuenta de club. Un usuario común sigue sin poder nada de esto.
--   4) handle_new_user: (a) una cuenta de admin no se crea como jugador;
--      (b) las cuentas de club creadas desde el panel nacen como club. El rol
--      se lee de app_metadata, que SOLO puede escribir la service role
--      (a diferencia de user_metadata, que manda quien se registra).
--
-- IMPORTANTE: en producción dejá activa la confirmación de email en Supabase Auth.
-- Con la confirmación desactivada, quien se registre con un mail de esta lista
-- (si aún no tiene cuenta) quedaría autorizado.
--
-- Después de correrla, autorizá tu mail (reemplazá el ejemplo):
--   insert into public.admin_emails (email) values ('tu-mail@ejemplo.com');
-- =========================================================

create table if not exists public.admin_emails (
  email text primary key check (email = lower(btrim(email)))
);
alter table public.admin_emails enable row level security;
revoke all on public.admin_emails from anon, authenticated;

create or replace function public.is_talentree_admin()
returns boolean
language sql
stable
security definer set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    join public.admin_emails a on a.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_talentree_admin() from public, anon;
grant execute on function public.is_talentree_admin() to authenticated;

-- ---------------------------------------------------------
-- Noticias y eventos propios de TalenTree
-- ---------------------------------------------------------
drop policy if exists "news_admin_insert" on public.news;
create policy "news_admin_insert" on public.news
  for insert to authenticated with check (public.is_talentree_admin());

drop policy if exists "news_admin_update" on public.news;
create policy "news_admin_update" on public.news
  for update to authenticated
  using (public.is_talentree_admin()) with check (public.is_talentree_admin());

drop policy if exists "news_admin_delete" on public.news;
create policy "news_admin_delete" on public.news
  for delete to authenticated using (public.is_talentree_admin());

-- ---------------------------------------------------------
-- Avisos que mandan los clubes: el admin los ve todos y cambia su estado
-- ---------------------------------------------------------
drop policy if exists "club_announcements_admin_select" on public.club_announcements;
create policy "club_announcements_admin_select" on public.club_announcements
  for select to authenticated using (public.is_talentree_admin());

drop policy if exists "club_announcements_admin_update" on public.club_announcements;
create policy "club_announcements_admin_update" on public.club_announcements
  for update to authenticated
  using (public.is_talentree_admin()) with check (public.is_talentree_admin());

-- Para mostrar a quién contactar por cada aviso
drop policy if exists "club_managers_admin_select" on public.club_managers;
create policy "club_managers_admin_select" on public.club_managers
  for select to authenticated using (public.is_talentree_admin());

-- ---------------------------------------------------------
-- Solicitudes de cuenta de club: antes solo se podían insertar.
-- Ahora el admin las lee y cambia su estado.
-- ---------------------------------------------------------
grant select, update on public.club_requests to authenticated;

drop policy if exists "club_requests_admin_select" on public.club_requests;
create policy "club_requests_admin_select" on public.club_requests
  for select to authenticated using (public.is_talentree_admin());

drop policy if exists "club_requests_admin_update" on public.club_requests;
create policy "club_requests_admin_update" on public.club_requests
  for update to authenticated
  using (public.is_talentree_admin()) with check (public.is_talentree_admin());

-- ---------------------------------------------------------
-- handle_new_user
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Cuenta del equipo de TalenTree: perfil mínimo, sin ficha de jugador.
  if exists (select 1 from public.admin_emails where email = lower(new.email)) then
    insert into public.profiles (id, role) values (new.id, 'player')
    on conflict (id) do nothing;
    return new;
  end if;

  -- Cuenta de club creada desde el panel (service role escribe app_metadata).
  if new.raw_app_meta_data ->> 'role' = 'club' then
    insert into public.profiles (id, role) values (new.id, 'club')
    on conflict (id) do nothing;

    insert into public.clubs (user_id, club_name, city)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'club_name', ''),
      nullif(new.raw_user_meta_data ->> 'city', '')
    )
    on conflict (user_id) do nothing;
    return new;
  end if;

  -- Registro normal: siempre jugador (ver 0005).
  insert into public.profiles (id, role) values (new.id, 'player')
  on conflict (id) do nothing;

  insert into public.players (user_id, first_name, last_name, birth_date)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce((new.raw_user_meta_data ->> 'birth_date')::date, current_date)
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;
