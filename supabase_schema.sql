-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

-- Babies table: each user can have multiple babies
create table babies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  birth_date date,
  created_at timestamptz default now()
);

-- Food log: tracks which foods have been introduced per baby
create table food_log (
  id uuid default gen_random_uuid() primary key,
  baby_id uuid references babies(id) on delete cascade not null,
  food_name text not null,
  introduced_at date not null,
  reaction text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(baby_id, food_name)
);

-- Row Level Security: users can only see/edit their own data
alter table babies enable row level security;
alter table food_log enable row level security;

create policy "Users manage own babies"
  on babies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage food log for own babies"
  on food_log for all
  using (
    exists (
      select 1 from babies
      where babies.id = food_log.baby_id
      and babies.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from babies
      where babies.id = food_log.baby_id
      and babies.user_id = auth.uid()
    )
  );

-- Auto-update updated_at on food_log changes
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger food_log_updated_at
  before update on food_log
  for each row execute function update_updated_at();
