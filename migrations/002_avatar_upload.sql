-- Sets up photo-avatar support. Additive only — does not touch
-- existing babies/food_log rows or data.

-- 1. New column on babies (existing rows get NULL, fall back to no avatar)
alter table babies add column if not exists avatar_url text;

-- 2. Storage bucket for avatar photos (public so the app can just use
--    the public URL directly, no signed URLs needed)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 3. RLS policies: each user may only write into their own folder
--    (path convention: {user_id}/{baby_id}.ext), everyone may read
--    (bucket is public anyway, this policy just makes it explicit).
create policy "Users upload own avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own avatars"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own avatars"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');
