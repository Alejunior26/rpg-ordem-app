-- Apply before deploying version 1.1. Existing character sheets and legacy logs are preserved.
begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text default 'player',
  nome_personagem text
);
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text default 'player';
alter table public.profiles add column if not exists nome_personagem text;
update public.profiles set role = case when role = 'adm' then 'admin'
  when role = 'jogador' or role is null then 'player' else role end;
alter table public.profiles alter column role set default 'player';
alter table public.profiles alter column role set not null;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('player','dm','admin'));
insert into public.profiles(id,email) select id,email from auth.users on conflict (id) do nothing;

create or replace function public.asa_create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,email,role) values(new.id,new.email,'player') on conflict(id) do nothing;
  return new;
end; $$;
drop trigger if exists zz_asa_create_profile on auth.users;
create trigger zz_asa_create_profile after insert on auth.users for each row execute function public.asa_create_profile();

-- Older installations have a signup trigger that still inserts the obsolete role "jogador".
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,email,role) values(new.id,new.email,'player') on conflict(id) do nothing;
  return new;
end; $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
create or replace function public.is_dm_or_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role in ('dm','admin'));
$$;

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(), name text not null, description text,
  created_by uuid references auth.users(id) default auth.uid(), created_at timestamptz default now()
);
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) default auth.uid(),
  mission_id uuid references public.missions(id) on delete set null, name text not null,
  sheet_json jsonb not null default '{}'::jsonb, created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table public.characters add column if not exists revision bigint not null default 0;
create index if not exists characters_owner_updated_idx on public.characters(owner_id,updated_at desc);
create index if not exists characters_mission_idx on public.characters(mission_id);

create table if not exists public.asa_mission_members (
  mission_id uuid not null references public.missions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key(mission_id,user_id)
);
create index if not exists asa_mission_members_user_idx on public.asa_mission_members(user_id);
-- Preserve existing campaign affiliations, without enrolling unrelated users.
insert into public.asa_mission_members(mission_id,user_id)
  select distinct mission_id,owner_id from public.characters where mission_id is not null on conflict do nothing;
insert into public.asa_mission_members(mission_id,user_id)
  select id,created_by from public.missions where created_by is not null on conflict do nothing;

create or replace function public.asa_can_access_mission(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.missions m where m.id=target and
    (public.is_dm_or_admin() or m.created_by=auth.uid() or exists(
      select 1 from public.asa_mission_members mm where mm.mission_id=m.id and mm.user_id=auth.uid())));
$$;

create table if not exists public.asa_combat_state (
  mission_id uuid primary key references public.missions(id) on delete cascade,
  rodada integer not null default 1 check(rodada>0),
  participants jsonb not null default '[]', turn_order jsonb not null default '[]',
  turn_done_by jsonb not null default '[]', turn_index integer not null default 0,
  version bigint not null default 0, reset_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(jsonb_typeof(participants)='array' and jsonb_typeof(turn_order)='array' and jsonb_typeof(turn_done_by)='array')
);
create table if not exists public.asa_combat_log (
  id bigint generated always as identity primary key,
  mission_id uuid not null references public.missions(id) on delete cascade,
  author_id uuid references auth.users(id) default auth.uid(),
  legacy_id uuid unique,
  personagem text not null check(length(personagem) between 1 and 200),
  acao text not null check(length(acao) between 1 and 20000), rodada integer not null check(rodada>0),
  created_at timestamptz not null default now()
);
create index if not exists asa_combat_log_mission_id_idx on public.asa_combat_log(mission_id,id desc);

-- The old combat had no mission key. Import it only when there is exactly one possible mission.
-- This stays inside the database; no player content is exported.
do $$
declare mid uuid; s public.asa_combat_state; log record; ev jsonb; actor text; begin
  if (select count(*) from public.missions)=1 and to_regclass('public.combat_state') is not null and to_regclass('public.combat_log') is not null then
    select id into mid from public.missions limit 1;
    if not exists(select 1 from public.asa_combat_state where mission_id=mid) then
      insert into public.asa_combat_state(mission_id,rodada,reset_at)
        values(mid,coalesce((select rodada from public.combat_state where id=1),1),coalesce((select min(created_at) from public.combat_log),now())) returning * into s;
      for log in select acao,created_at from public.combat_log where acao like '[FLOW]%' order by created_at,id loop
        begin ev:=substring(log.acao from 7)::jsonb; exception when invalid_text_representation then continue; end;
        actor:=ev->'payload'->>'userId';
        if ev->>'event'='RESET' then
          s.participants:='[]'; s.turn_order:='[]'; s.turn_done_by:='[]'; s.turn_index:=0; s.reset_at:=log.created_at;
        elsif ev->>'event'='JOIN' and actor is not null then
          s.participants:=(select coalesce(jsonb_agg(x),'[]') from jsonb_array_elements(s.participants) x where x->>'userId'<>actor)||jsonb_build_array(ev->'payload');
        elsif ev->>'event'='SET_ORDER' and jsonb_typeof(ev->'payload'->'order')='array' then
          s.turn_order:=ev->'payload'->'order'; s.turn_done_by:='[]'; s.turn_index:=0;
        elsif ev->>'event'='ROUND_RESET' and ev->'payload'->>'round'=s.rodada::text then
          s.turn_done_by:='[]'; s.turn_index:=0;
        elsif ev->>'event'='TURN_DONE' and ev->'payload'->>'round'=s.rodada::text and actor is not null then
          if not s.turn_done_by ? actor then s.turn_done_by:=s.turn_done_by||jsonb_build_array(actor); end if;
          if s.turn_order->>s.turn_index=actor then s.turn_index:=least(s.turn_index+1,greatest(jsonb_array_length(s.turn_order)-1,0)); end if;
        end if;
      end loop;
      update public.asa_combat_state set participants=s.participants,turn_order=s.turn_order,turn_done_by=s.turn_done_by,turn_index=s.turn_index,reset_at=s.reset_at where mission_id=mid;
    end if;
    insert into public.asa_combat_log(mission_id,legacy_id,author_id,personagem,acao,rodada,created_at)
      select mid,id,null,left(coalesce(nullif(personagem,''),'Sistema'),200),left(acao,20000),greatest(coalesce(rodada,1),1),coalesce(created_at,now())
      from public.combat_log where acao is not null and length(acao)>0 and acao not like '[FLOW]%'
      order by created_at,id on conflict(legacy_id) do nothing;
  end if;
end $$;

-- Replace all policies on the tables managed by this migration: permissive policies otherwise combine with OR.
do $$ declare r record; begin
  for r in select schemaname,tablename,policyname from pg_policies
    where schemaname='public' and tablename in ('profiles','missions','characters','asa_mission_members','asa_combat_state','asa_combat_log')
  loop execute format('drop policy %I on %I.%I',r.policyname,r.schemaname,r.tablename); end loop;
end $$;
alter table public.profiles enable row level security;
alter table public.missions enable row level security;
alter table public.characters enable row level security;
alter table public.asa_mission_members enable row level security;
alter table public.asa_combat_state enable row level security;
alter table public.asa_combat_log enable row level security;
revoke all on public.profiles,public.missions,public.characters,public.asa_mission_members,public.asa_combat_state,public.asa_combat_log from public,anon,authenticated;
grant select on public.profiles,public.missions,public.characters,public.asa_mission_members,public.asa_combat_state,public.asa_combat_log to authenticated;
grant insert,delete on public.characters to authenticated;
grant insert on public.missions,public.asa_combat_log to authenticated;
grant usage,select on sequence public.asa_combat_log_id_seq to authenticated;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_dm_or_admin());
create policy missions_read on public.missions for select to authenticated using(public.asa_can_access_mission(id));
create policy missions_create on public.missions for insert to authenticated with check(public.is_dm_or_admin() and created_by=auth.uid());
create policy characters_read on public.characters for select to authenticated using(owner_id=auth.uid() or public.is_dm_or_admin());
create policy characters_create on public.characters for insert to authenticated with check(owner_id=auth.uid() and (mission_id is null or public.asa_can_access_mission(mission_id)));
create policy characters_delete on public.characters for delete to authenticated using(owner_id=auth.uid());
create policy members_read on public.asa_mission_members for select to authenticated using(user_id=auth.uid() or public.is_dm_or_admin());
create policy combat_read on public.asa_combat_state for select to authenticated using(public.asa_can_access_mission(mission_id));
create policy combat_log_read on public.asa_combat_log for select to authenticated using(public.asa_can_access_mission(mission_id));
create policy combat_log_create on public.asa_combat_log for insert to authenticated
  with check(author_id=auth.uid() and public.asa_can_access_mission(mission_id) and acao not like '[FLOW]%');

create or replace function public.update_my_profile_name(next_name text) returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare result public.profiles; begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  if length(btrim(next_name))>120 then raise exception 'name too long'; end if;
  update public.profiles set nome_personagem=nullif(btrim(next_name),'') where id=auth.uid() returning * into result;
  return result;
end; $$;

create or replace function public.admin_update_profile_role(target_profile_id uuid,next_role text) returns public.profiles
language plpgsql security definer set search_path = '' as $$
declare result public.profiles; begin
  perform pg_advisory_xact_lock(910290001);
  if not public.is_admin() then raise exception 'admin role required' using errcode='42501'; end if;
  if next_role is null or next_role not in ('player','dm','admin') then raise exception 'invalid role'; end if;
  if next_role<>'admin' and exists(select 1 from public.profiles where id=target_profile_id and role='admin')
    and (select count(*) from public.profiles where role='admin')<=1 then raise exception 'cannot remove the last admin'; end if;
  update public.profiles set role=next_role where id=target_profile_id returning * into result;
  if not found then raise exception 'profile not found'; end if;
  return result;
end; $$;

create or replace function public.asa_set_mission_member(p_mission_id uuid,p_user_id uuid,p_allowed boolean) returns void
language plpgsql security definer set search_path = '' as $$ begin
  if not public.is_dm_or_admin() then raise exception 'manager required' using errcode='42501'; end if;
  if p_allowed then insert into public.asa_mission_members values(p_mission_id,p_user_id) on conflict do nothing;
  else delete from public.asa_mission_members where mission_id=p_mission_id and user_id=p_user_id; end if;
end; $$;

create or replace function public.asa_save_character(p_character_id uuid,p_expected_revision bigint,p_name text,p_sheet jsonb)
returns public.characters language plpgsql security definer set search_path = '' as $$
declare result public.characters; begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  if p_name is null or length(btrim(p_name)) not between 1 and 120 or jsonb_typeof(p_sheet)<>'object' or p_sheet is null
    or octet_length(p_sheet::text)>1000000 then raise exception 'invalid character sheet'; end if;
  select * into result from public.characters where id=p_character_id and owner_id=auth.uid() for update;
  if not found then raise exception 'character not owned by current user' using errcode='42501'; end if;
  if result.revision<>p_expected_revision or p_expected_revision is null then raise exception 'sheet conflict: reload required' using errcode='40001'; end if;
  update public.characters set name=btrim(p_name),sheet_json=p_sheet,revision=revision+1,updated_at=now()
    where id=p_character_id returning * into result;
  return result;
end; $$;

create or replace function public.asa_mission_roster(p_mission_id uuid) returns table(id uuid,nome_personagem text)
language plpgsql stable security definer set search_path = '' as $$ begin
  if not public.asa_can_access_mission(p_mission_id) then raise exception 'mission access denied' using errcode='42501'; end if;
  return query select mm.user_id,coalesce(nullif(p.nome_personagem,''),'Agente') from public.asa_mission_members mm
    join public.profiles p on p.id=mm.user_id where mm.mission_id=p_mission_id;
end; $$;

create or replace function public.asa_assign_character_mission(p_character_id uuid,p_mission_id uuid,p_expected_revision bigint)
returns public.characters language plpgsql security definer set search_path = '' as $$
declare result public.characters; begin
  if not public.asa_can_access_mission(p_mission_id) then raise exception 'mission access denied' using errcode='42501'; end if;
  select * into result from public.characters where id=p_character_id and owner_id=auth.uid() for update;
  if not found then raise exception 'character not owned by current user' using errcode='42501'; end if;
  if p_expected_revision is null or result.revision<>p_expected_revision then raise exception 'sheet conflict: reload required' using errcode='40001'; end if;
  update public.characters set mission_id=p_mission_id,revision=revision+1,updated_at=now()
    where id=p_character_id and owner_id=auth.uid() returning * into result;
  if not found then raise exception 'character not owned by current user' using errcode='42501'; end if;
  return result;
end; $$;

create or replace function public.asa_combat_action(p_mission_id uuid,p_event text,p_payload jsonb default '{}',p_expected_version bigint default null)
returns public.asa_combat_state language plpgsql security definer set search_path = '' as $$
declare s public.asa_combat_state; manager boolean; actor text; participant jsonb; next_order jsonb; actor_name text; begin
  if not public.asa_can_access_mission(p_mission_id) then raise exception 'mission access denied' using errcode='42501'; end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' then raise exception 'invalid payload'; end if;
  insert into public.asa_combat_state(mission_id) values(p_mission_id) on conflict do nothing;
  select * into s from public.asa_combat_state where mission_id=p_mission_id for update;
  if p_event='READ' then return s; end if;
  if p_expected_version is null or p_expected_version<>s.version then raise exception 'combat changed: refresh and try again' using errcode='40001'; end if;
  manager:=public.is_dm_or_admin() or exists(select 1 from public.missions where id=p_mission_id and created_by=auth.uid());
  if p_event='JOIN' then
    actor:=p_payload->>'userId';
    if actor=auth.uid()::text then
      select name into actor_name from public.characters where id=(p_payload->>'characterId')::uuid
        and owner_id=auth.uid() and mission_id=p_mission_id;
      if not found then raise exception 'select your character for this mission' using errcode='42501'; end if;
      participant:=jsonb_build_object('userId',actor,'nome',actor_name,'kind','player');
    else
      if not manager or actor is null or actor not similar to '(npc|monster):%' then raise exception 'cannot join for another user' using errcode='42501'; end if;
      if length(coalesce(p_payload->>'nome','')) not between 1 and 200 then raise exception 'invalid participant name'; end if;
      participant:=p_payload;
    end if;
    if not exists(select 1 from jsonb_array_elements(s.participants) x where x->>'userId'=actor) then
      if jsonb_array_length(s.participants)>=100 then raise exception 'participant limit reached'; end if;
      s.participants:=s.participants||jsonb_build_array(participant);
    end if;
  elsif p_event='SET_ORDER' then
    if not manager then raise exception 'manager required' using errcode='42501'; end if;
    next_order:=p_payload->'order';
    if next_order is null or jsonb_typeof(next_order)<>'array' then raise exception 'invalid order'; end if;
    if jsonb_array_length(next_order)=0 or jsonb_array_length(next_order)>100
      or (select count(distinct x) from jsonb_array_elements_text(next_order) x)<>jsonb_array_length(next_order)
      or exists(select 1 from jsonb_array_elements_text(next_order) a where not exists(
        select 1 from jsonb_array_elements(s.participants) b where b->>'userId'=a)) then raise exception 'invalid order'; end if;
    s.turn_order:=next_order; s.turn_done_by:='[]'; s.turn_index:=0;
  elsif p_event='TURN_DONE' then
    actor:=p_payload->>'userId';
    if actor is null or (not manager and actor<>auth.uid()::text) then raise exception 'cannot finish another turn' using errcode='42501'; end if;
    if (p_payload->>'round')::integer is distinct from s.rodada then raise exception 'round changed' using errcode='40001'; end if;
    if s.turn_order->>s.turn_index is distinct from actor or s.turn_done_by ? actor then raise exception 'not current turn'; end if;
    s.turn_done_by:=s.turn_done_by||jsonb_build_array(actor);
    s.turn_index:=least(s.turn_index+1,greatest(jsonb_array_length(s.turn_order)-1,0));
  elsif p_event='ROUND_RESET' then
    if not manager then raise exception 'manager required' using errcode='42501'; end if;
    if jsonb_array_length(s.turn_order)=0 or exists(select 1 from jsonb_array_elements_text(s.turn_order) a where not s.turn_done_by ? a)
      then raise exception 'finish all turns before advancing'; end if;
    s.rodada:=s.rodada+1; s.turn_index:=0; s.turn_done_by:='[]';
  elsif p_event='RESET' then
    if not manager then raise exception 'manager required' using errcode='42501'; end if;
    s.rodada:=1; s.participants:='[]'; s.turn_order:='[]'; s.turn_done_by:='[]'; s.turn_index:=0; s.reset_at:=clock_timestamp();
  else raise exception 'unsupported combat event'; end if;
  update public.asa_combat_state set rodada=s.rodada,participants=s.participants,turn_order=s.turn_order,
    turn_done_by=s.turn_done_by,turn_index=s.turn_index,reset_at=s.reset_at,version=version+1,updated_at=clock_timestamp()
    where mission_id=p_mission_id returning * into s;
  return s;
end; $$;

revoke all on function public.asa_create_profile() from public,anon,authenticated;
revoke all on function public.handle_new_user() from public,anon,authenticated;
revoke all on function public.is_admin(),public.is_dm_or_admin(),public.asa_can_access_mission(uuid),
  public.update_my_profile_name(text),public.admin_update_profile_role(uuid,text),
  public.asa_set_mission_member(uuid,uuid,boolean),public.asa_save_character(uuid,bigint,text,jsonb),public.asa_assign_character_mission(uuid,uuid,bigint),public.asa_mission_roster(uuid),
  public.asa_combat_action(uuid,text,jsonb,bigint) from public,anon;
grant execute on function public.is_admin(),public.is_dm_or_admin(),public.asa_can_access_mission(uuid),
  public.update_my_profile_name(text),public.admin_update_profile_role(uuid,text),
  public.asa_set_mission_member(uuid,uuid,boolean),public.asa_save_character(uuid,bigint,text,jsonb),public.asa_assign_character_mission(uuid,uuid,bigint),public.asa_mission_roster(uuid),
  public.asa_combat_action(uuid,text,jsonb,bigint) to authenticated;

-- Retire legacy global combat writes without deleting its data. Only the new APIs are used by 1.1.
do $$ declare t text; begin
  foreach t in array array['combat_state','combat_log','combat_sessions','combat_participants','combat_turns'] loop
    if to_regclass('public.'||t) is not null then
      execute format('alter table public.%I enable row level security',t);
      execute format('revoke all on public.%I from public, anon, authenticated',t);
    end if;
  end loop;
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    foreach t in array array['asa_combat_state','asa_combat_log'] loop
      if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
        execute format('alter publication supabase_realtime add table public.%I',t);
      end if;
    end loop;
  end if;
end $$;
commit;
