-- Quote requests: a visitor to a contractor's page sends their contact details
-- and the picture they made, and the contractor reads them in an inbox.
--
-- Rules this encodes:
--   * Anyone, signed in or not, can send a request to a contractor whose page
--     address they hold. They cannot read any request back, including their own.
--   * Only the contractor a request was sent to can read or delete it.
--   * A request's picture can be attached once, within ten minutes of sending.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  contractor_id uuid not null references public.contractors (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 80),
  email text check (length(email) <= 254),
  phone text check (length(phone) <= 40),
  message text check (length(message) <= 2000),
  -- The finish in the picture.
  template_id text references public.templates (id),
  created_at timestamptz not null default now(),
  -- The contractor needs some way to reply.
  check (email is not null or phone is not null)
);

create index leads_contractor_id_idx on public.leads (contractor_id, created_at desc);

alter table public.leads enable row level security;

create policy "Contractors read requests sent to them"
  on public.leads for select
  to authenticated
  using (
    exists (
      select 1 from public.contractors c
      where c.id = contractor_id and c.user_id = (select auth.uid())
    )
  );

create policy "Contractors delete requests sent to them"
  on public.leads for delete
  to authenticated
  using (
    exists (
      select 1 from public.contractors c
      where c.id = contractor_id and c.user_id = (select auth.uid())
    )
  );

-- Sends a quote request to the contractor at the given page address. Returns
-- where the sender may upload the picture, in the 'leads' bucket. Visitors have
-- no write access to the table, so this is the only way a request is created.
create function public.submit_lead(
  slug text,
  name text,
  email text,
  phone text,
  message text,
  template_id text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  contractor uuid;
  lead uuid;
begin
  select c.id into contractor from public.contractors c where c.slug = submit_lead.slug;
  if contractor is null then
    raise exception 'There is no business page at this address.';
  end if;

  insert into public.leads (contractor_id, name, email, phone, message, template_id)
  values (
    contractor,
    btrim(submit_lead.name),
    nullif(btrim(submit_lead.email), ''),
    nullif(btrim(submit_lead.phone), ''),
    nullif(btrim(submit_lead.message), ''),
    submit_lead.template_id
  )
  returning id into lead;

  return contractor::text || '/' || lead::text || '.jpg';
end;
$$;

revoke all on function public.submit_lead(text, text, text, text, text, text) from public;
grant execute on function public.submit_lead(text, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
-- leads  private  <contractor_id>/<lead_id>.jpg

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('leads', 'leads', false, 2097152, array['image/jpeg']);

-- True when the path is the picture of a request sent in the last ten minutes.
-- The sender cannot read the leads table, so the upload rule asks through this.
create function public.lead_awaits_picture(path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.leads l
    where lead_awaits_picture.path = l.contractor_id::text || '/' || l.id::text || '.jpg'
      and l.created_at > now() - interval '10 minutes'
  );
$$;

revoke all on function public.lead_awaits_picture(text) from public;
grant execute on function public.lead_awaits_picture(text) to anon, authenticated;

-- Insert only: an existing picture cannot be replaced.
create policy "Senders attach the picture to their quote request"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'leads' and public.lead_awaits_picture(name));

create policy "Contractors see pictures sent to them"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'leads'
    and (storage.foldername(name))[1] in (
      select c.id::text from public.contractors c where c.user_id = (select auth.uid())
    )
  );

create policy "Contractors remove pictures sent to them"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'leads'
    and (storage.foldername(name))[1] in (
      select c.id::text from public.contractors c where c.user_id = (select auth.uid())
    )
  );
