-- GainTrack: geplande meldingen na de rusttijd (web push). Uitvoeren in de Supabase SQL-editor (of via de
-- Management API). Alleen de edge function rest-push (service role) leest en schrijft deze tabel: geen
-- policies voor de anon-sleutel, dus de app kan er rechtstreeks niets mee.

create table if not exists public.push_jobs (
  endpoint text primary key,          -- één geplande melding per toestel (inschrijving)
  subscription jsonb not null,        -- web push-inschrijving (endpoint + sleutels)
  payload jsonb not null,             -- titel, tekst, link
  send_at timestamptz not null,
  version text not null,              -- nieuwe planning = nieuwe versie; een oude wachtende taak stopt dan vanzelf
  created_at timestamptz not null default now()
);

alter table public.push_jobs enable row level security;
