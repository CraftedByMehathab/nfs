-- Contractor pages: a contractor gets the visualizer under their own name at
-- /c/<slug>.
--
-- Rules this encodes:
--   * An account has at most one contractor page.
--   * Only its owner can create or change it.
--   * Anyone holding the address can read what the page shows (name, colour,
--     contact details), but signed-out visitors cannot list every contractor.

create table public.contractors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid() references auth.users (id) on delete cascade,
  -- The page address: lower-case words joined by single hyphens.
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 40),
  name text not null check (length(btrim(name)) between 1 and 80),
  -- Background colour of the page header, as '#rrggbb'.
  accent text not null default '#18181b' check (accent ~ '^#[0-9a-f]{6}$'),
  -- Contact details shown on the page. Both are optional.
  email text check (length(email) <= 254),
  phone text check (length(phone) <= 40),
  created_at timestamptz not null default now()
);

alter table public.contractors enable row level security;

create policy "Users manage their own contractor page"
  on public.contractors for all
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Looks up one contractor page by its address, without exposing the owner's
-- account id or letting visitors list the table.
create function public.get_contractor(slug text)
returns table (name text, accent text, email text, phone text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.name, c.accent, c.email, c.phone
  from public.contractors c
  where c.slug = get_contractor.slug;
$$;

revoke all on function public.get_contractor(text) from public;
grant execute on function public.get_contractor(text) to anon, authenticated;
