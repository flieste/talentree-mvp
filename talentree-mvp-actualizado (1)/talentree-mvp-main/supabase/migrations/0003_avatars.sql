-- =========================================================
-- TalenTree — Foto de perfil
-- Ejecutar después de 0002_news_and_video_upload.sql
-- (players.avatar_url ya existe desde 0001_init.sql)
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Cada jugador solo sube/borra dentro de su propia carpeta: <user_id>/...
create policy "avatars_storage_select" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_storage_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
