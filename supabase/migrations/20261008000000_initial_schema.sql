-- NextFloor initial schema: finish catalogue, saved projects, renders, storage.
--
-- Rules this encodes:
--   * You need an account to save or share. Signed-out visitors can only read
--     the finish catalogue and view a render they were sent a share link for.
--   * A user can only see and change their own projects, renders and files.

-- ---------------------------------------------------------------------------
-- Finish catalogue
-- ---------------------------------------------------------------------------

create table public.templates (
  -- Matches the ids in src/lib/templates, e.g. 'granite-flake'.
  id text primary key,
  name text not null,
  category text not null check (category in ('flake', 'metallic', 'quartz', 'solid')),
  -- Null while the texture is generated in code rather than loaded from a file.
  texture_url text,
  -- How many times the texture repeats across the perspective corners at normal size.
  scale real not null check (scale > 0),
  gloss real check (gloss between 0 and 1)
);

alter table public.templates enable row level security;

create policy "Anyone can read the finish catalogue"
  on public.templates for select
  to anon, authenticated
  using (true);

insert into public.templates (id, name, category, scale) values
  ('granite-flake', 'Granite Flake', 'flake', 3),
  ('pewter-metallic', 'Pewter Metallic', 'metallic', 1.5),
  ('sand-quartz', 'Sand Quartz', 'quartz', 4);

-- ---------------------------------------------------------------------------
-- Projects: one uploaded photo and where its floor is
-- ---------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text,
  -- Size of the working photo in pixels.
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  -- Paths in the private 'photos' bucket.
  original_path text not null,
  -- Set when the floor area is a detected or painted mask image.
  mask_path text,
  -- Set when the floor area is a hand-drawn polygon: [{"x": 0.1, "y": 0.2}, ...]
  -- in normalised image coordinates. Null means the area is the perspective corners.
  outline jsonb,
  -- Four perspective corners, same format, ordered top-left, top-right,
  -- bottom-right, bottom-left.
  corners jsonb not null check (jsonb_array_length(corners) = 4),
  created_at timestamptz not null default now(),
  -- The floor area is a mask or a polygon, never both.
  check (mask_path is null or outline is null)
);

create index projects_user_id_idx on public.projects (user_id, created_at desc);

alter table public.projects enable row level security;

create policy "Users manage their own projects"
  on public.projects for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Renders: one finished picture of a project
-- ---------------------------------------------------------------------------

create table public.renders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  template_id text not null references public.templates (id),
  pattern_size real not null default 1 check (pattern_size > 0),
  shading real not null default 0.8 check (shading between 0 and 1),
  photoreal boolean not null default false,
  -- Path in the private 'renders' bucket.
  image_path text not null,
  -- Set while the render is shared. The public copy of the picture is then at
  -- '<share_slug>.jpg' in the public 'shared' bucket.
  share_slug text unique check (share_slug is null or length(share_slug) >= 16),
  created_at timestamptz not null default now()
);

create index renders_project_id_idx on public.renders (project_id, created_at desc);

alter table public.renders enable row level security;

create policy "Users manage renders of their own projects"
  on public.renders for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = (select auth.uid())
    )
  );

-- Looks up one shared render by its slug. Signed-out visitors have no read
-- access to the renders table, so they cannot list what has been shared; they
-- can only fetch a render whose slug they already hold.
create function public.get_shared_render(slug text)
returns table (id uuid, template_id text, share_slug text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.template_id, r.share_slug, r.created_at
  from public.renders r
  where r.share_slug = slug;
$$;

revoke all on function public.get_shared_render(text) from public;
grant execute on function public.get_shared_render(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
-- photos   private  <user_id>/<project_id>/original.jpg, mask.png
-- renders  private  <user_id>/<project_id>/<render_id>.jpg
-- shared   public   <share_slug>.jpg

insert into storage.buckets (id, name, public) values
  ('photos', 'photos', false),
  ('renders', 'renders', false),
  ('shared', 'shared', true);

create policy "Users manage files in their own folder"
  on storage.objects for all
  to authenticated
  using (
    bucket_id in ('photos', 'renders')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('photos', 'renders')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- The 'shared' bucket is public, so reading needs no policy. Paths there carry
-- no user id, so ownership is tracked by the uploader recorded on each object.
create policy "Signed-in users can publish shared pictures"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'shared');

create policy "Users can see their own shared pictures"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'shared' and owner_id = (select auth.uid())::text);

create policy "Users can remove their own shared pictures"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'shared' and owner_id = (select auth.uid())::text);
