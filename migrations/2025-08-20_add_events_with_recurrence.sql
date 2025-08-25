-- Run this SQL in Supabase BEFORE pulling the app changes.
-- Events table for recurring series and overrides. Timezone uses IANA zone id, and timestamps are stored as UTC (timestamptz).

create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null default gen_random_uuid(),
  parent_event_id uuid references public.events(id) on delete set null,
  title text not null default '',
  notes text,
  location text,
  is_all_day boolean not null default false,
  timezone text not null default 'America/Los_Angeles',
  start_at timestamptz not null,
  end_at timestamptz not null,
  recurrence_rule text,
  recurrence_end_at timestamptz,
  recurrence_exceptions jsonb not null default '[]'::jsonb,
  created_by integer references public.admins(id),
  updated_by integer references public.admins(id),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_series_id_idx on public.events (series_id);
create index if not exists events_start_at_idx on public.events (start_at);
create index if not exists events_end_at_idx on public.events (end_at);
create index if not exists events_parent_event_id_idx on public.events (parent_event_id);
create index if not exists events_recurrence_exceptions_gin on public.events using gin (recurrence_exceptions);

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
before update on public.events
for each row execute procedure public.set_updated_at();
