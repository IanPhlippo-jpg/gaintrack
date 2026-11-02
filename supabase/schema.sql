-- GainTrack: tabellen voor het gedeelde weekklassement.
-- Uitvoeren in de Supabase SQL-editor (of via de CLI). De app gebruikt de anon-sleutel; iedereen met de app
-- mag spelers en scores lezen en zijn eigen rij bijwerken (vriendenklassement, geen gevoelige gegevens).

create table if not exists public.players (
  id text primary key,
  name text not null,
  photo text,
  updated_at timestamptz not null default now()
);

create table if not exists public.scores (
  account_id text not null references public.players(id) on delete cascade,
  week date not null,
  xp integer not null default 0,
  workouts integer not null default 0,
  sets integer not null default 0,
  perfect_days integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (account_id, week)
);

alter table public.players enable row level security;
alter table public.scores enable row level security;

drop policy if exists "players lezen" on public.players;
drop policy if exists "players schrijven" on public.players;
drop policy if exists "scores lezen" on public.scores;
drop policy if exists "scores schrijven" on public.scores;

create policy "players lezen" on public.players for select to anon using (true);
create policy "players schrijven" on public.players for all to anon using (true) with check (true);
create policy "scores lezen" on public.scores for select to anon using (true);
create policy "scores schrijven" on public.scores for all to anon using (true) with check (true);

-- Foto's blijven klein (data-URL van 256 px): begrens de kolom zodat niemand de tabel volpompt.
alter table public.players drop constraint if exists players_photo_size;
alter table public.players add constraint players_photo_size check (photo is null or length(photo) < 120000);
