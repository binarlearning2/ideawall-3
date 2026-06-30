-- IdeaWall — initial schema
-- Implements PRD §8 Data Model exactly (tables, fields, constraints) + RLS policies
-- matching the access model described in PRD §9 (API Design) and §12 (NFR / Security).
--
-- Run this in the Supabase SQL editor for your project, or via `supabase db push`
-- if you're using the Supabase CLI with this repo's `supabase/` folder.

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ============================================================================
-- 8.1 profiles
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth.users row is created (magic link signup).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- 8.2 boards
-- ============================================================================
create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) <= 100),
  description text,
  join_code text not null unique,
  is_anonymous boolean not null default true,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists boards_owner_id_idx on public.boards (owner_id);
create unique index if not exists boards_join_code_idx on public.boards (join_code);

alter table public.boards enable row level security;

-- Unlisted-link model (PRD §12): anyone who has the board id (only obtainable via the
-- service-role join-code lookup route, or as the owner) can read the board row.
-- Direct anon lookup BY join_code is intentionally not exposed here — see
-- /api/boards/by-code/[joinCode], which uses the service role key instead.
create policy "boards_select_any"
  on public.boards for select
  using (true);

create policy "boards_insert_owner"
  on public.boards for insert
  with check (auth.uid() = owner_id);

create policy "boards_update_owner"
  on public.boards for update
  using (auth.uid() = owner_id);

create policy "boards_delete_owner"
  on public.boards for delete
  using (auth.uid() = owner_id);

-- ============================================================================
-- 8.3 board_sections
-- ============================================================================
create table if not exists public.board_sections (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  type text not null check (type in ('wall', 'poll', 'matrix')),
  title text not null check (char_length(title) <= 100),
  order_index integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists board_sections_board_id_idx on public.board_sections (board_id);

alter table public.board_sections enable row level security;

create policy "board_sections_select_any"
  on public.board_sections for select
  using (true);

create policy "board_sections_insert_owner"
  on public.board_sections for insert
  with check (
    exists (select 1 from public.boards b where b.id = board_id and b.owner_id = auth.uid())
  );

create policy "board_sections_update_owner"
  on public.board_sections for update
  using (
    exists (select 1 from public.boards b where b.id = board_id and b.owner_id = auth.uid())
  );

create policy "board_sections_delete_owner"
  on public.board_sections for delete
  using (
    exists (select 1 from public.boards b where b.id = board_id and b.owner_id = auth.uid())
  );

-- ============================================================================
-- 8.4 sticky_notes
-- ============================================================================
create table if not exists public.sticky_notes (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  section_id uuid not null references public.board_sections (id) on delete cascade,
  content text not null check (char_length(content) <= 280),
  color text not null default '#FFF59D',
  author_name text not null check (char_length(author_name) <= 50),
  author_session_id text not null,
  position_x double precision,
  position_y double precision,
  quadrant_index smallint check (quadrant_index between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sticky_notes_board_id_idx on public.sticky_notes (board_id);
create index if not exists sticky_notes_section_id_idx on public.sticky_notes (section_id);

alter table public.sticky_notes enable row level security;

-- Reads are open (needed for realtime subscriptions from anonymous participants).
create policy "sticky_notes_select_any"
  on public.sticky_notes for select
  using (true);

-- No anon INSERT/UPDATE/DELETE policies on purpose: participants are never authenticated
-- via Supabase Auth (PRD §12), so "own note" checks can't be expressed in RLS. All writes
-- go through the server route handlers (using the service role key), which validate
-- author_session_id / owner_id in application code before writing.

-- ============================================================================
-- 8.5 poll_options
-- ============================================================================
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.board_sections (id) on delete cascade,
  label text not null check (char_length(label) <= 150),
  order_index integer not null default 0
);

create index if not exists poll_options_section_id_idx on public.poll_options (section_id);

alter table public.poll_options enable row level security;

create policy "poll_options_select_any"
  on public.poll_options for select
  using (true);

create policy "poll_options_write_owner"
  on public.poll_options for all
  using (
    exists (
      select 1 from public.board_sections s
      join public.boards b on b.id = s.board_id
      where s.id = section_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.board_sections s
      join public.boards b on b.id = s.board_id
      where s.id = section_id and b.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- 8.6 poll_votes
-- ============================================================================
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards (id) on delete cascade,
  section_id uuid not null references public.board_sections (id) on delete cascade,
  option_id uuid not null references public.poll_options (id) on delete cascade,
  voter_session_id text not null,
  created_at timestamptz not null default now(),
  unique (option_id, voter_session_id)
);

create index if not exists poll_votes_board_id_idx on public.poll_votes (board_id);
create index if not exists poll_votes_section_id_idx on public.poll_votes (section_id);

alter table public.poll_votes enable row level security;

create policy "poll_votes_select_any"
  on public.poll_votes for select
  using (true);

-- No anon INSERT/UPDATE/DELETE policies — same reasoning as sticky_notes. Voting goes
-- through POST /api/sections/[sectionId]/vote using the service role key.

-- ============================================================================
-- updated_at maintenance
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists boards_set_updated_at on public.boards;
create trigger boards_set_updated_at before update on public.boards
  for each row execute procedure public.set_updated_at();

drop trigger if exists sections_set_updated_at on public.board_sections;
create trigger sections_set_updated_at before update on public.board_sections
  for each row execute procedure public.set_updated_at();

drop trigger if exists sticky_notes_set_updated_at on public.sticky_notes;
create trigger sticky_notes_set_updated_at before update on public.sticky_notes
  for each row execute procedure public.set_updated_at();

-- ============================================================================
-- Realtime: add tables to the supabase_realtime publication
-- ============================================================================
alter publication supabase_realtime add table public.sticky_notes;
alter publication supabase_realtime add table public.poll_votes;
alter publication supabase_realtime add table public.board_sections;
alter publication supabase_realtime add table public.boards;
alter publication supabase_realtime add table public.poll_options;
