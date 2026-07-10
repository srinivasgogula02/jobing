-- Account ownership for notes created through MCP and future connected tools.
alter table public.copies
  add column if not exists user_id text references public.users(id) on delete set null;

create index if not exists copies_user_id_idx on public.copies(user_id);
