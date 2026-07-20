-- Adds support for user-defined foods, in addition to the built-in 101.
-- Purely additive — new table, does not touch babies/food_log/storage.

create table if not exists custom_foods (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text not null,
  phase integer not null,
  prep text,
  tips text,
  is_allergen boolean default false,
  created_at timestamptz default now()
);

alter table custom_foods enable row level security;

create policy "Users manage own custom foods"
  on custom_foods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Base table grants (RLS above still restricts which rows are visible)
grant select, insert, update, delete on custom_foods to authenticated;
