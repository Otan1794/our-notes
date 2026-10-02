-- ============================================================
-- Shared Workspace — schema + RLS
-- Run this in the Supabase SQL editor on a fresh project.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ---------- profiles (extends auth.users) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ---------- workspaces ----------
create table workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  -- 'shared'   -> both members see and edit ONE dashboard layout
  -- 'per_user' -> each member has their own layout
  layout_mode text not null default 'shared' check (layout_mode in ('shared', 'per_user')),
  created_at timestamptz not null default now()
);

create table workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- ---------- categories ----------
create table categories (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  icon text not null default 'folder',
  color text not null default '#2C5C5F',
  layout_x int not null default 0,
  layout_y int not null default 0,
  layout_w int not null default 4,
  layout_h int not null default 4,
  is_hidden boolean not null default false,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- items ----------
create table items (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  type text not null check (type in ('note', 'link', 'image', 'video', 'todo', 'document')),
  title text not null,
  description text,
  content text,
  url text,
  image_path text,
  metadata jsonb not null default '{}'::jsonb,
  is_archived boolean not null default false,
  is_favorite boolean not null default false,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index items_workspace_idx on items(workspace_id);
create index items_category_idx on items(category_id);
create index items_search_idx on items
  using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(content,'') || ' ' || coalesce(url,'')));

-- ---------- tags ----------
create table tags (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  unique (workspace_id, name)
);

create table item_tags (
  item_id uuid not null references items(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (item_id, tag_id)
);

-- ---------- layouts ----------
-- One row per (workspace) when layout_mode = 'shared' (user_id is null),
-- one row per (workspace, user) when layout_mode = 'per_user'.
create table layouts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  layout_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- ============================================================
-- Row Level Security
-- Every policy keys off workspace membership only — type-specific
-- logic (item types, metadata shape) stays in the application layer.
-- ============================================================

alter table profiles enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table categories enable row level security;
alter table items enable row level security;
alter table tags enable row level security;
alter table item_tags enable row level security;
alter table layouts enable row level security;

-- helper: is the current user a member of a given workspace?
create or replace function is_workspace_member(ws_id uuid)
returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

create policy "profiles: read own" on profiles
  for select using (id = auth.uid());
create policy "profiles: update own" on profiles
  for update using (id = auth.uid());

create policy "workspaces: members can read" on workspaces
  for select using (is_workspace_member(id));

create policy "workspace_members: members can read roster" on workspace_members
  for select using (is_workspace_member(workspace_id));

create policy "categories: members can read" on categories
  for select using (is_workspace_member(workspace_id));
create policy "categories: members can write" on categories
  for insert with check (is_workspace_member(workspace_id));
create policy "categories: members can update" on categories
  for update using (is_workspace_member(workspace_id));
create policy "categories: members can delete" on categories
  for delete using (is_workspace_member(workspace_id));

create policy "items: members can read" on items
  for select using (is_workspace_member(workspace_id));
create policy "items: members can write" on items
  for insert with check (is_workspace_member(workspace_id));
create policy "items: members can update" on items
  for update using (is_workspace_member(workspace_id));
create policy "items: members can delete" on items
  for delete using (is_workspace_member(workspace_id));

create policy "tags: members can read" on tags
  for select using (is_workspace_member(workspace_id));
create policy "tags: members can write" on tags
  for insert with check (is_workspace_member(workspace_id));

create policy "item_tags: members can read" on item_tags
  for select using (
    exists (select 1 from items where items.id = item_id and is_workspace_member(items.workspace_id))
  );
create policy "item_tags: members can write" on item_tags
  for insert with check (
    exists (select 1 from items where items.id = item_id and is_workspace_member(items.workspace_id))
  );
create policy "item_tags: members can delete" on item_tags
  for delete using (
    exists (select 1 from items where items.id = item_id and is_workspace_member(items.workspace_id))
  );

-- layouts: a member can read/write a row if it's the shared row (user_id is null)
-- OR it's their own per-user row. This is what makes shared-vs-per-user configurable
-- per workspace without separate tables.
create policy "layouts: members can read" on layouts
  for select using (
    is_workspace_member(workspace_id)
    and (user_id is null or user_id = auth.uid())
  );
create policy "layouts: members can upsert" on layouts
  for insert with check (
    is_workspace_member(workspace_id)
    and (user_id is null or user_id = auth.uid())
  );
create policy "layouts: members can update" on layouts
  for update using (
    is_workspace_member(workspace_id)
    and (user_id is null or user_id = auth.uid())
  );

-- ---------- storage ----------
-- Run once, after creating a bucket named 'item-images' in the Supabase dashboard:
--
-- create policy "item-images: members can read"
--   on storage.objects for select
--   using (bucket_id = 'item-images' and is_workspace_member((storage.foldername(name))[1]::uuid));
--
-- create policy "item-images: members can upload"
--   on storage.objects for insert
--   with check (bucket_id = 'item-images' and is_workspace_member((storage.foldername(name))[1]::uuid));
--
-- Convention: upload paths as `{workspace_id}/{item_id}/{filename}` so the
-- policy above can check membership from the first path segment.
