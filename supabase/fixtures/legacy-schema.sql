-- A.S.A. Supabase schema
-- Rode este arquivo no SQL Editor do Supabase.

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now()
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) default auth.uid(),
  mission_id uuid references public.missions(id) on delete set null,
  name text not null,
  sheet_json jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.combat_sessions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid references public.missions(id) on delete cascade,
  rodada integer not null default 1,
  turn_order jsonb not null default '[]'::jsonb,
  current_turn_index integer not null default 0,
  status text not null default 'active',
  created_by uuid references auth.users(id) default auth.uid(),
  updated_at timestamptz default now()
);

create table if not exists public.combat_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.combat_sessions(id) on delete cascade,
  user_id uuid references auth.users(id),
  character_id uuid references public.characters(id) on delete set null,
  name text not null,
  kind text not null default 'player',
  joined_at timestamptz default now()
);

create table if not exists public.combat_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.combat_sessions(id) on delete cascade,
  participant_id uuid not null references public.combat_participants(id) on delete cascade,
  rodada integer not null,
  acted_at timestamptz default now(),
  unique (session_id, participant_id, rodada)
);

alter table public.missions enable row level security;
alter table public.characters enable row level security;
alter table public.combat_sessions enable row level security;
alter table public.combat_participants enable row level security;
alter table public.combat_turns enable row level security;

drop policy if exists "missions read" on public.missions;
create policy "missions read" on public.missions
for select using (auth.role() = 'authenticated');

drop policy if exists "missions insert" on public.missions;
create policy "missions insert" on public.missions
for insert with check (auth.uid() = created_by);

drop policy if exists "characters owner read" on public.characters;
create policy "characters owner read" on public.characters
for select using (owner_id = auth.uid());

drop policy if exists "characters owner insert" on public.characters;
create policy "characters owner insert" on public.characters
for insert with check (owner_id = auth.uid());

drop policy if exists "characters owner update" on public.characters;
create policy "characters owner update" on public.characters
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "characters owner delete" on public.characters;
create policy "characters owner delete" on public.characters
for delete using (owner_id = auth.uid());

drop policy if exists "combat sessions read" on public.combat_sessions;
create policy "combat sessions read" on public.combat_sessions
for select using (auth.role() = 'authenticated');

drop policy if exists "combat sessions insert" on public.combat_sessions;
create policy "combat sessions insert" on public.combat_sessions
for insert with check (auth.uid() = created_by);

drop policy if exists "combat sessions creator update" on public.combat_sessions;
create policy "combat sessions creator update" on public.combat_sessions
for update using (auth.uid() = created_by) with check (auth.uid() = created_by);

drop policy if exists "participants read" on public.combat_participants;
create policy "participants read" on public.combat_participants
for select using (auth.role() = 'authenticated');

drop policy if exists "participants authenticated insert" on public.combat_participants;
create policy "participants authenticated insert" on public.combat_participants
for insert with check (auth.role() = 'authenticated');

drop policy if exists "turns read" on public.combat_turns;
create policy "turns read" on public.combat_turns
for select using (auth.role() = 'authenticated');

drop policy if exists "turns authenticated insert" on public.combat_turns;
create policy "turns authenticated insert" on public.combat_turns
for insert with check (auth.role() = 'authenticated');

insert into public.missions (name, description)
select 'Operação Aurora', 'Missão inicial da campanha A.S.A.'
where not exists (select 1 from public.missions where name = 'Operação Aurora');
