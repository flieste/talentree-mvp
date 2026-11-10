-- =========================================================
-- TalenTree — Auditoría de seguridad: cierre de agujeros de RLS
-- Ejecutar después de 0004_club_features.sql
--
-- Resumen de lo que arregla (ver el mensaje del chat para el detalle):
--   1) CRÍTICO: cualquier usuario podía convertirse en "club" y contactar
--      jugadores, sin pasar por la app, de dos formas distintas.
--   2) ALTO: los datos de los jugadores (nombre, fecha de nacimiento exacta,
--      foto, club) eran legibles por cualquiera en internet, sin sesión.
--   3) MEDIO: un video/link cargado con una URL "javascript:..." podía
--      ejecutar código en el navegador de quien lo mirara (XSS).
--   4) MEDIO: un mensaje de chat podía insertarse con un remitente falso.
-- =========================================================

-- ---------------------------------------------------------
-- 1a) handle_new_user: YA NO confía en el "role" que manda quien se registra.
-- Antes: alguien podía llamar directo a la API de Supabase Auth (con la
-- misma clave pública que usa la app) y registrarse con role:"club",
-- saltándose por completo nuestro formulario de registro.
-- Ahora: toda cuenta nueva se crea como jugador. Las cuentas de club las
-- crea el equipo de TalenTree a mano (Supabase Dashboard / service role).
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'player')
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

-- ---------------------------------------------------------
-- 1b) profiles.role ya no se puede cambiar desde la app ni por API directa.
-- Antes: la política "profiles_update_own" solo miraba que la fila fuera la
-- propia (auth.uid() = id), pero no impedía cambiar el valor de "role" en
-- esa misma fila. Cualquier jugador podía hacer, con su propia sesión:
--   supabase.from('profiles').update({ role: 'club' }).eq('id', miId)
-- y pasar a ser "club" para el resto de la app.
-- Ahora: un trigger fuerza a que "role" nunca cambie por una request de
-- usuario (mismo patrón que ya usábamos para proteger la calificación).
-- ---------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profiles_role on public.profiles;
create trigger protect_profiles_role
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

-- ---------------------------------------------------------
-- 1c) Nadie puede crearse una fila en "clubs" por su cuenta.
-- Este es el agujero más directo de los tres: la política "clubs_insert_own"
-- dejaba que CUALQUIER usuario autenticado (un jugador recién registrado,
-- sin ningún paso extra) insertara su propia fila en "clubs" con una sola
-- llamada a la API:
--   supabase.from('clubs').insert({ user_id: miId, club_name: 'Lo que sea' })
-- y con eso ya podía abrir chat con cualquier jugador y contactarlo
-- (la política que permite escribir en "conversations" solo mira si existe
-- una fila en "clubs" con tu user_id — no mira el rol del perfil).
-- Ahora: solo el equipo de TalenTree (con la service role, que no pasa por
-- estas políticas) puede crear una fila en "clubs".
-- ---------------------------------------------------------
drop policy if exists "clubs_insert_own" on public.clubs;

-- ---------------------------------------------------------
-- 2) Los datos de jugadores, clubes, noticias y videos dejan de ser legibles
-- por cualquiera en internet sin haber iniciado sesión.
-- Antes: "for select using (true)" se aplica también al rol "anon" (sin
-- sesión), porque Supabase siempre acepta la clave pública anon para
-- consultar la API directamente, sin pasar por el login de la app. Eso
-- significa que cualquiera podía leer nombre completo, fecha de nacimiento
-- exacta, club, nacionalidad y foto de cada jugador (muchos menores de
-- edad) sin ser un usuario de TalenTree.
-- Ahora: se sigue viendo igual DENTRO de la app (que ya exige sesión para
-- todo salvo /login y /register), pero deja de ser accesible desde afuera.
-- ---------------------------------------------------------
drop policy if exists "players_select_all" on public.players;
create policy "players_select_all" on public.players
  for select to authenticated using (true);

drop policy if exists "previous_clubs_select_all" on public.previous_clubs;
create policy "previous_clubs_select_all" on public.previous_clubs
  for select to authenticated using (true);

drop policy if exists "highlight_videos_select_all" on public.highlight_videos;
create policy "highlight_videos_select_all" on public.highlight_videos
  for select to authenticated using (true);

drop policy if exists "clubs_select_all" on public.clubs;
create policy "clubs_select_all" on public.clubs
  for select to authenticated using (true);

drop policy if exists "news_select_all" on public.news;
create policy "news_select_all" on public.news
  for select to authenticated using (true);

-- Nota: los buckets de Storage (fotos y videos) siguen siendo públicos a
-- propósito. Las imágenes y videos se muestran con <img>/<video src="...">,
-- que el navegador pide sin mandar la sesión — si el bucket no fuera
-- público, ninguna foto ni video se vería. La ruta de cada archivo lleva un
-- id al azar (no son adivinables ni están listados en ningún lado), así que
-- esto no expone nada que la persona no haya subido para mostrar.

-- ---------------------------------------------------------
-- 3) Un video o noticia con URL "javascript:..." ya no se puede guardar.
-- Antes: la validación de que el link sea http(s) vivía solo en el código
-- de la app (el server action). Alguien podía saltearla llamando directo a
-- la API y guardar, por ejemplo, url = 'javascript:fetch(...)' en su propio
-- video. Cuando otra persona (un club revisando perfiles) tocaba "Ver
-- video", ese código se ejecutaba en SU sesión.
-- Ahora: la base de datos exige que la URL empiece con http:// o https://,
-- pase lo que pase por la app.
-- ---------------------------------------------------------
alter table public.highlight_videos
  add constraint highlight_videos_url_is_http
  check (url ~* '^https?://');

alter table public.news
  add constraint news_link_url_is_http
  check (link_url is null or link_url ~* '^https?://');

-- ---------------------------------------------------------
-- 4) El remitente de un mensaje de chat ya no se puede falsificar.
-- Antes: "sender_type" lo mandaba quien insertaba el mensaje. Un
-- participante del chat podía guardar un mensaje propio marcado como si lo
-- hubiera mandado la otra parte. La app nunca lo hacía, pero la base de
-- datos lo permitía si alguien llamaba directo a la API.
-- Ahora: siempre se completa con el rol real del que envía, tomado de
-- "profiles", sin importar qué mande el cliente.
-- ---------------------------------------------------------
create or replace function public.set_message_sender_type()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  select role into new.sender_type from public.profiles where id = new.sender_id;
  return new;
end;
$$;

drop trigger if exists set_messages_sender_type on public.messages;
create trigger set_messages_sender_type
  before insert on public.messages
  for each row execute procedure public.set_message_sender_type();
