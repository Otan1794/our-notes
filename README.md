# Our Space

A private, shared dashboard for two people to save links, notes, images, videos, and ideas
into customizable, drag-and-drop categories — instead of losing them in a chat thread.

## What this is (MVP scope)

- Magic-link login for exactly two invited people, sharing one private workspace
- Customizable dashboard: categories as draggable, resizable cards
- A generic Item model (note, link, image, video, todo, document) that new types
  can be added to without restructuring the app
- Tags + full-text-ish search across everything you've saved
- "Added by X, 2h ago" attribution on every item
- Configurable dashboard layout: shared between both of you, or separate per person
- Light/dark mode, responsive down to mobile

See the original product spec for the full feature roadmap (comments, reactions,
notifications, reminders, maps, AI features) — none of that is in this MVP by design.

## Tech stack

- **Next.js 14 (App Router) + TypeScript** — server components + server actions, no separate API layer
- **Tailwind CSS** — utility styling, theme tokens in `tailwind.config.ts` / `globals.css`
- **Supabase** — Postgres database, Auth (magic link), and Storage in one service
- **react-grid-layout** — drag/resize dashboard grid with persisted positions
- **Vercel** — hosting

## Architecture

```
Browser (client components: dialogs, grid, forms)
   ↓
Next.js Server Components + Server Actions   (src/services/*)
   ↓
Supabase client (anon key + user session — RLS enforces access)
   ↓
Postgres (Row Level Security keyed on workspace membership)
   ↓
Supabase Storage (item images)
```

Data flows through `src/services/*.ts` server actions only. Components never call
Supabase directly — this is what keeps the UI layer swappable and the data-access
logic in one place.

## Project structure

```
src/
├── app/
│   ├── (auth)/login/          Magic-link sign-in
│   ├── (workspace)/dashboard  Main dashboard
│   ├── (workspace)/search     Search results
│   └── auth/callback          Exchanges magic-link code for a session
├── components/
│   ├── dashboard/             Grid + category card
│   ├── items/                 Item card, add-item dialog, type registry
│   ├── search/                Search bar
│   └── ui/                    Small reusable primitives (Dialog, etc.)
├── lib/supabase/              Browser + server Supabase clients
├── services/                  All CRUD as server actions (categories, items, layouts, search)
└── types/                     Item, Category, and (generated) Database types
supabase/
└── schema.sql                 Full DDL + Row Level Security policies
```

## Local setup

1. **Create a Supabase project** at supabase.com (free tier).
2. **Run the schema**: open the SQL editor in your Supabase dashboard and run the
   entire contents of `supabase/schema.sql`.
3. **Create a storage bucket** named `item-images`, then uncomment and run the
   storage policies at the bottom of `schema.sql`.
4. **Create your two user accounts**: Supabase Dashboard → Authentication → Users
   → Add User, for you and your partner. Then insert matching rows into `profiles`
   and `workspace_members` (create one `workspaces` row first) via the SQL editor:
   ```sql
   insert into workspaces (name) values ('Our Space') returning id;
   insert into profiles (id, display_name) values ('<auth-user-id>', 'Jonathan');
   insert into workspace_members (workspace_id, user_id, role) values ('<workspace-id>', '<auth-user-id>', 'owner');
   -- repeat profiles + workspace_members for your partner
   ```
5. **Copy environment variables**: `cp .env.example .env.local` and fill in your
   Supabase project URL and anon key (Project Settings → API).
6. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```
7. Visit `localhost:3000`, sign in with either account's email via the magic link.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Add the same environment variables from `.env.local` in Vercel's project settings
   (Environment Variables tab). Do **not** add `SUPABASE_SERVICE_ROLE_KEY` unless a
   future feature genuinely needs it server-side — it isn't used anywhere in this MVP.
4. Deploy. Every push to `main` redeploys automatically.
5. In Supabase Auth settings, add your Vercel production URL to the allowed redirect
   URLs (`https://your-app.vercel.app/auth/callback`).

### Free-tier notes

- Supabase free tier: 500MB database, 1GB file storage, pauses after 7 days of
  no activity (auto-wakes on next request with a few seconds of cold start).
- Vercel free tier: fine for a 2-user app indefinitely.
- The first thing likely to push you toward a paid tier is image storage if you
  save a lot of screenshots — worth watching if that becomes a habit.

## How authentication works

Supabase Auth issues a magic link; `src/app/auth/callback/route.ts` exchanges the
code for a session cookie. `src/middleware.ts` refreshes that session on every
request and redirects unauthenticated visitors to `/login`. There's no self-serve
sign-up — accounts are created manually for exactly the two of you (see setup step 4).

## How to extend the application

### Add a new item type (e.g. "restaurant")

1. Add `'restaurant'` to `ItemType` in `src/types/item.ts`, and a `RestaurantMetadata`
   interface if it needs fields beyond title/description/url.
2. Add the `'restaurant'` value to the `type` check constraint on the `items` table
   in `supabase/schema.sql` (or a migration).
3. Add an entry to `ITEM_TYPE_REGISTRY` in `src/components/items/registry.tsx` with
   its icon and label.
4. If it needs a custom form (not just title/description/url), add a case to
   `AddItemDialog`'s full-form branch.

Nothing in the dashboard grid, search, or Supabase query layer needs to change —
`items.metadata` is a `jsonb` column specifically so new types don't need migrations
for their extra fields.

### Add a new widget/module type

Currently every dashboard module is a `Category`. To add a genuinely different
widget (e.g. a calendar widget, not just another category of items), add a
`widget_type` column to `categories`, branch on it inside `CategoryCard.tsx`, and
register the new widget's renderer the same way item types are registered.

### Add a new category feature

Category-level settings (color, icon, hidden/shown) live directly on the
`categories` table. Add a column, expose it in `src/services/categories.ts`, and
surface it in a category settings UI (not built in the MVP — currently create/rename/
delete only).

### Add a new integration (e.g. real-time sync, notifications)

Supabase Realtime can subscribe to `items`/`categories` table changes directly —
wrap `DashboardGrid` in a `useEffect` that subscribes via the browser Supabase
client and refetches or patches state on change. This wasn't added to the MVP to
keep the first version's failure surface small, but the schema and RLS already
support it with no changes.

## Layout mode: shared vs. per-user

`workspaces.layout_mode` is `'shared'` by default — one dashboard arrangement for
both of you. Set it to `'per_user'` (via `setLayoutMode` in `src/services/layouts.ts`,
or directly in SQL) if you'd rather each arrange your own dashboard independently.
The `layouts` table already has a `(workspace_id, user_id)` unique constraint that
supports both modes without a schema change.
