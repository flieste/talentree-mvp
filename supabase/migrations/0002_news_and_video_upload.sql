-- =========================================================
-- TalenTree — Noticias/eventos + videos subidos como archivo
-- Ejecutar después de 0001_init.sql
-- =========================================================

-- ---------------------------------------------------------
-- news: noticias y eventos (pruebas en clubes, pruebas privadas, etc.)
-- Se cargan desde el panel de Supabase (Table Editor) o con SQL.
-- ---------------------------------------------------------
do $$ begin
  create type public.news_category as enum
    ('prueba_club', 'prueba_privada', 'torneo', 'evento', 'noticia');
exception when duplicate_object then null; end $$;

create table if not exists public.news (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  category public.news_category not null default 'noticia',
  event_date date,
  location text,
  link_url text,
  created_at timestamptz not null default now()
);

create index if not exists news_event_date_idx on public.news (event_date);

alter table public.news enable row level security;

-- Lectura pública. No hay políticas de insert/update/delete: solo el equipo
-- (Table Editor / service role) puede publicar noticias.
create policy "news_select_all" on public.news
  for select using (true);

-- ---------------------------------------------------------
-- highlight_videos: ahora admite archivo además de URL
-- ---------------------------------------------------------
alter table public.highlight_videos
  add column if not exists source text not null default 'url'
    check (source in ('url', 'file')),
  add column if not exists storage_path text;

-- ---------------------------------------------------------
-- Storage: bucket público para los videos subidos (50 MB máx. por archivo,
-- que es el tope del plan gratuito de Supabase; se puede subir en planes pagos)
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'highlight-videos',
  'highlight-videos',
  true,
  52428800,
  array['video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do nothing;

-- Cada jugador solo puede subir/borrar dentro de su propia carpeta: <user_id>/...
create policy "highlight_videos_storage_select" on storage.objects
  for select using (bucket_id = 'highlight-videos');

create policy "highlight_videos_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'highlight-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "highlight_videos_storage_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'highlight-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
