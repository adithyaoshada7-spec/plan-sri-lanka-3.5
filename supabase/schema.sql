-- Run once in Supabase → SQL Editor.
-- Create an admin: Authentication → Users → Add user (email + password).
--
-- If you already created `site_content` with `id` as GENERATED ALWAYS AS IDENTITY
-- and see "cannot insert a non-DEFAULT value into column 'id'", either:
--   (a) rely on the app (saveSiteContent uses update / insert without `id`), or
--   (b) run: alter table public.site_content alter column id drop identity if exists;

create table if not exists public.site_content (
  id integer primary key default 1,
  properties jsonb not null default '[]'::jsonb,
  room_options_by_property jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_content_singleton check (id = 1)
);

create or replace function public.set_site_content_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at
before update on public.site_content
for each row execute function public.set_site_content_updated_at();

alter table public.site_content enable row level security;

drop policy if exists "site_content_select_public" on public.site_content;
create policy "site_content_select_public"
on public.site_content
for select
to anon, authenticated
using (true);

drop policy if exists "site_content_insert_authenticated" on public.site_content;
create policy "site_content_insert_authenticated"
on public.site_content
for insert
to authenticated
with check (true);

drop policy if exists "site_content_update_authenticated" on public.site_content;
create policy "site_content_update_authenticated"
on public.site_content
for update
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

drop policy if exists "property_images_public_read" on storage.objects;
create policy "property_images_public_read"
on storage.objects
for select
using (bucket_id = 'property-images');

drop policy if exists "property_images_authenticated_insert" on storage.objects;
create policy "property_images_authenticated_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'property-images');

drop policy if exists "property_images_authenticated_update" on storage.objects;
create policy "property_images_authenticated_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'property-images')
with check (bucket_id = 'property-images');

drop policy if exists "property_images_authenticated_delete" on storage.objects;
create policy "property_images_authenticated_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'property-images');
