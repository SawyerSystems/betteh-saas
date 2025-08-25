-- Skills relations tables: prerequisites and connected components
-- IMPORTANT: Run this in Supabase SQL editor. Do not run from app code.
-- Idempotent guards ensure safe re-run.

-- Create skills_prerequisites table
create table if not exists public.skills_prerequisites (
  id serial primary key,
  skill_id integer not null references public.skills(id) on delete cascade,
  prerequisite_skill_id integer not null references public.skills(id) on delete restrict,
  created_at timestamp with time zone default now() not null,
  constraint skills_prerequisites_unique unique (skill_id, prerequisite_skill_id),
  constraint skills_prerequisites_no_self check (skill_id <> prerequisite_skill_id)
);

-- Indexes
create index if not exists idx_skills_prerequisites_skill on public.skills_prerequisites(skill_id);
create index if not exists idx_skills_prerequisites_prereq on public.skills_prerequisites(prerequisite_skill_id);

-- Create skill_components table (ordered connected combo parts)
create table if not exists public.skill_components (
  id serial primary key,
  parent_skill_id integer not null references public.skills(id) on delete cascade,
  component_skill_id integer not null references public.skills(id) on delete restrict,
  position integer not null default 0,
  created_at timestamp with time zone default now() not null,
  constraint skill_components_unique unique (parent_skill_id, component_skill_id),
  constraint skill_components_no_self check (parent_skill_id <> component_skill_id)
);

-- Indexes
create index if not exists idx_skill_components_parent on public.skill_components(parent_skill_id);
create index if not exists idx_skill_components_component on public.skill_components(component_skill_id);

-- Optional derived flag on skills to quickly filter combos (safe if column already exists)
alter table public.skills
  add column if not exists is_connected_combo boolean default false;

-- Maintain is_connected_combo via trigger when components change
create or replace function public.update_is_connected_combo()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    update public.skills set is_connected_combo = true where id = new.parent_skill_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.skills s set is_connected_combo = exists (
      select 1 from public.skill_components sc where sc.parent_skill_id = s.id
    ) where s.id = old.parent_skill_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_update_is_connected_combo_ins on public.skill_components;
create trigger trg_update_is_connected_combo_ins
after insert on public.skill_components
for each row execute function public.update_is_connected_combo();

drop trigger if exists trg_update_is_connected_combo_del on public.skill_components;
create trigger trg_update_is_connected_combo_del
after delete on public.skill_components
for each row execute function public.update_is_connected_combo();
