-- =========================================================
-- TalenTree — datos demo
-- 10 jugadores completamente ficticios para que la pantalla
-- "Inicio" nunca se vea vacía durante una demostración.
-- Ejecutar después de 0001_init.sql
-- =========================================================

insert into public.players
  (id, user_id, first_name, last_name, birth_date, current_club, height_cm, weight_kg, position, is_demo)
values
  ('00000000-0000-0000-0000-000000000001', null, 'Juan', 'Pérez', '2004-03-12', 'Club Atlético Norte', 178, 72, 'mediocampista', true),
  ('00000000-0000-0000-0000-000000000002', null, 'Martín', 'González', '2006-07-25', 'Deportivo Flandria', 182, 76, 'defensor', true),
  ('00000000-0000-0000-0000-000000000003', null, 'Lucas', 'Fernández', '2005-01-04', 'Club Social Belgrano', 172, 68, 'delantero', true),
  ('00000000-0000-0000-0000-000000000004', null, 'Ignacio', 'Romero', '2003-11-19', 'Atlético Luján', 188, 84, 'arquero', true),
  ('00000000-0000-0000-0000-000000000005', null, 'Tomás', 'Sosa', '2007-02-08', 'Villa Deportiva FC', 169, 63, 'mediocampista', true),
  ('00000000-0000-0000-0000-000000000006', null, 'Agustín', 'Díaz', '2004-09-30', 'Club Independiente del Oeste', 180, 74, 'defensor', true),
  ('00000000-0000-0000-0000-000000000007', null, 'Franco', 'Molina', '2005-05-16', 'Racing del Sur', 175, 70, 'delantero', true),
  ('00000000-0000-0000-0000-000000000008', null, 'Nicolás', 'Torres', '2006-12-02', 'San Martín FC', 177, 71, 'mediocampista', true),
  ('00000000-0000-0000-0000-000000000009', null, 'Federico', 'Acosta', '2003-04-22', 'Unión Juvenil', 191, 87, 'arquero', true),
  ('00000000-0000-0000-0000-000000000010', null, 'Emiliano', 'Rojas', '2007-08-14', 'Estrella Roja FC', 174, 69, 'delantero', true)
on conflict (id) do nothing;

insert into public.previous_clubs (player_id, club_name, start_date, end_date) values
  ('00000000-0000-0000-0000-000000000001', 'Deportivo Juvenil', '2019-01-01', '2022-12-01'),
  ('00000000-0000-0000-0000-000000000002', 'Club Los Andes', '2020-01-01', '2023-06-01'),
  ('00000000-0000-0000-0000-000000000003', 'Sportivo Belgrano Infantil', '2018-01-01', '2021-01-01'),
  ('00000000-0000-0000-0000-000000000006', 'Atlético Provincial', '2019-06-01', '2022-06-01'),
  ('00000000-0000-0000-0000-000000000009', 'Newell''s Juveniles', '2017-01-01', '2021-01-01')
on conflict do nothing;

insert into public.highlight_videos (player_id, title, url) values
  ('00000000-0000-0000-0000-000000000001', 'Gol de tiro libre vs Club Sur', 'https://www.youtube.com/watch?v=demo_juan_1'),
  ('00000000-0000-0000-0000-000000000001', 'Mejores pases de la temporada', 'https://www.youtube.com/watch?v=demo_juan_2'),
  ('00000000-0000-0000-0000-000000000003', 'Doblete en la final juvenil', 'https://vimeo.com/000000001'),
  ('00000000-0000-0000-0000-000000000004', 'Atajadas destacadas — Torneo Apertura', 'https://www.youtube.com/watch?v=demo_ignacio_1'),
  ('00000000-0000-0000-0000-000000000007', 'Highlights delantero centro 2025', 'https://www.youtube.com/watch?v=demo_franco_1')
on conflict do nothing;

-- ---------------------------------------------------------
-- Noticias de ejemplo (opcional). Borralas cuando cargues las reales:
--   delete from public.news;
-- Si no hay ninguna noticia, el Inicio muestra "Próximamente...".
-- ---------------------------------------------------------
-- insert into public.news (title, description, category, event_date, location) values
--   ('Prueba abierta de jugadores', 'Categorías 2006 a 2008. Llevar DNI y apto médico.', 'prueba_club', current_date + 7, 'Club Atlético Norte'),
--   ('Prueba privada — mediocampistas', 'Solo con inscripción previa.', 'prueba_privada', current_date + 14, 'José C. Paz');

-- ---------------------------------------------------------
-- Nacionalidad y calificación de los jugadores demo (la calificación va de 0 a 10)
-- ---------------------------------------------------------
update public.players set nationality = 'Argentina', rating = 8.2 where id = '00000000-0000-0000-0000-000000000001';
update public.players set nationality = 'Argentina', rating = 7.4 where id = '00000000-0000-0000-0000-000000000002';
update public.players set nationality = 'Uruguay',   rating = 8.8 where id = '00000000-0000-0000-0000-000000000003';
update public.players set nationality = 'Argentina', rating = 7.9 where id = '00000000-0000-0000-0000-000000000004';
update public.players set nationality = 'Paraguay',  rating = 8.5 where id = '00000000-0000-0000-0000-000000000005';
update public.players set nationality = 'Argentina', rating = 7.1 where id = '00000000-0000-0000-0000-000000000006';
update public.players set nationality = 'Argentina', rating = 9.0 where id = '00000000-0000-0000-0000-000000000007';
update public.players set nationality = 'Chile',     rating = 7.6 where id = '00000000-0000-0000-0000-000000000008';
update public.players set nationality = 'Argentina', rating = 6.8 where id = '00000000-0000-0000-0000-000000000009';
update public.players set nationality = 'Bolivia',   rating = 8.0 where id = '00000000-0000-0000-0000-000000000010';
