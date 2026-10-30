begin;

create table public.asa_tabletop_scenes (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  name text not null check(length(btrim(name)) between 1 and 120),
  map_path text, map_url text check(map_url is null or (map_url ~ '^https://' and length(map_url)<=2048)),
  columns integer not null default 24 check(columns between 6 and 80),
  rows integer not null default 18 check(rows between 6 and 80),
  grid_visible boolean not null default true,
  published boolean not null default false,
  allow_player_moves boolean not null default true,
  fog jsonb not null default '[]'::jsonb check(jsonb_typeof(fog)='array' and jsonb_array_length(fog)<=200),
  version bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique(id,mission_id)
);
create index asa_tabletop_scenes_mission_idx on public.asa_tabletop_scenes(mission_id);

create table public.asa_tabletop_rooms (
  mission_id uuid primary key references public.missions(id) on delete cascade,
  active_scene_id uuid,
  version bigint not null default 0,
  updated_at timestamptz not null default now(),
  foreign key(active_scene_id,mission_id) references public.asa_tabletop_scenes(id,mission_id)
);

create table public.asa_tabletop_tokens (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  scene_id uuid not null,
  name text not null check(length(btrim(name)) between 1 and 120),
  kind text not null default 'npc' check(kind in ('player','npc','enemy')),
  character_id uuid references public.characters(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  image_path text, image_url text check(image_url is null or (image_url ~ '^https://' and length(image_url)<=2048)),
  x integer not null default 0 check(x>=0), y integer not null default 0 check(y>=0),
  size integer not null default 1 check(size between 1 and 4),
  color text not null default '#ad83ff' check(color ~ '^#[0-9a-fA-F]{6}$'),
  visible boolean not null default false, deleted boolean not null default false,
  version bigint not null default 0,
  updated_at timestamptz not null default now(),
  foreign key(scene_id,mission_id) references public.asa_tabletop_scenes(id,mission_id)
);
create unique index asa_tabletop_tokens_character_idx on public.asa_tabletop_tokens(scene_id,character_id) where not deleted;
create index asa_tabletop_tokens_scene_idx on public.asa_tabletop_tokens(scene_id);
create index asa_tabletop_tokens_mission_idx on public.asa_tabletop_tokens(mission_id);
create index asa_tabletop_tokens_owner_idx on public.asa_tabletop_tokens(owner_id);

create table public.asa_tabletop_assets (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  name text not null check(length(btrim(name)) between 1 and 180),
  kind text not null check(kind in ('map','token')),
  path text not null unique,
  created_at timestamptz not null default now()
);
create index asa_tabletop_assets_mission_idx on public.asa_tabletop_assets(mission_id);

-- Invoker helpers retain RLS. Nothing in this feature grants access through JWT user_metadata.
create function public.asa_tabletop_revealed(sid uuid,px integer,py integer,ps integer) returns boolean
language sql stable security invoker set search_path='' as $$
  select exists(select 1 from public.asa_tabletop_scenes s where s.id=sid and s.published
    and not exists(select 1 from jsonb_array_elements(s.fog) f
      where px<(f->>'x')::integer+(f->>'w')::integer and px+ps>(f->>'x')::integer
        and py<(f->>'y')::integer+(f->>'h')::integer and py+ps>(f->>'y')::integer));
$$;

alter table public.asa_tabletop_scenes enable row level security;
alter table public.asa_tabletop_rooms enable row level security;
alter table public.asa_tabletop_tokens enable row level security;
alter table public.asa_tabletop_assets enable row level security;
revoke all on public.asa_tabletop_scenes,public.asa_tabletop_rooms,public.asa_tabletop_tokens,public.asa_tabletop_assets from public,anon,authenticated;
grant select,insert,update on public.asa_tabletop_scenes,public.asa_tabletop_rooms,public.asa_tabletop_tokens to authenticated;
grant select,insert,delete on public.asa_tabletop_assets to authenticated;

create policy tabletop_scenes_read on public.asa_tabletop_scenes for select to authenticated
  using(public.asa_can_access_mission(mission_id) and ((select public.is_dm_or_admin()) or published));
create policy tabletop_scenes_insert on public.asa_tabletop_scenes for insert to authenticated
  with check((select public.is_dm_or_admin()) and public.asa_can_access_mission(mission_id));
create policy tabletop_scenes_update on public.asa_tabletop_scenes for update to authenticated
  using((select public.is_dm_or_admin()) and public.asa_can_access_mission(mission_id))
  with check((select public.is_dm_or_admin()) and public.asa_can_access_mission(mission_id));
create policy tabletop_rooms_read on public.asa_tabletop_rooms for select to authenticated using(public.asa_can_access_mission(mission_id));
create policy tabletop_rooms_insert on public.asa_tabletop_rooms for insert to authenticated
  with check((select public.is_dm_or_admin()) and public.asa_can_access_mission(mission_id));
create policy tabletop_rooms_update on public.asa_tabletop_rooms for update to authenticated
  using((select public.is_dm_or_admin()) and public.asa_can_access_mission(mission_id))
  with check((select public.is_dm_or_admin()) and public.asa_can_access_mission(mission_id));
create policy tabletop_tokens_read on public.asa_tabletop_tokens for select to authenticated
  using(public.asa_can_access_mission(mission_id) and ((select public.is_dm_or_admin())
    or (visible and public.asa_tabletop_revealed(scene_id,x,y,size))));
create policy tabletop_tokens_insert on public.asa_tabletop_tokens for insert to authenticated
  with check(public.asa_can_access_mission(mission_id) and ((select public.is_dm_or_admin()) or (
    kind='player' and owner_id=(select auth.uid()) and visible and not deleted and public.asa_tabletop_revealed(scene_id,x,y,size)
    and exists(select 1 from public.characters c where c.id=character_id and c.owner_id=(select auth.uid()) and c.mission_id=asa_tabletop_tokens.mission_id)
    and exists(select 1 from public.asa_tabletop_rooms r where r.mission_id=asa_tabletop_tokens.mission_id and r.active_scene_id=scene_id))));
create policy tabletop_tokens_update on public.asa_tabletop_tokens for update to authenticated
  using(public.asa_can_access_mission(mission_id) and ((select public.is_dm_or_admin()) or
    (owner_id=(select auth.uid()) and not deleted and visible and public.asa_tabletop_revealed(scene_id,x,y,size))))
  with check(public.asa_can_access_mission(mission_id) and ((select public.is_dm_or_admin()) or
    (owner_id=(select auth.uid()) and not deleted and visible and public.asa_tabletop_revealed(scene_id,x,y,size))));
create policy tabletop_assets_read on public.asa_tabletop_assets for select to authenticated
  using(public.asa_can_access_mission(mission_id) and ((select public.is_dm_or_admin())
    or exists(select 1 from public.asa_tabletop_scenes s where s.map_path=path)
    or exists(select 1 from public.asa_tabletop_tokens t where t.image_path=path and not t.deleted)));
create policy tabletop_assets_insert on public.asa_tabletop_assets for insert to authenticated
  with check((select public.is_dm_or_admin()) and public.asa_can_access_mission(mission_id) and split_part(path,'/',1)=mission_id::text);
create policy tabletop_assets_delete on public.asa_tabletop_assets for delete to authenticated
  using((select public.is_dm_or_admin()) and public.asa_can_access_mission(mission_id));

create function public.asa_tabletop_validate() returns trigger language plpgsql security invoker set search_path='' as $$
declare s public.asa_tabletop_scenes; f jsonb; begin
  if tg_op='UPDATE' then
    if new.mission_id is distinct from old.mission_id then raise exception 'mission is immutable' using errcode='42501'; end if;
    new.version:=old.version+1;
  else new.version:=0; end if;
  new.updated_at:=clock_timestamp();
  if tg_table_name='asa_tabletop_tokens' then
    select * into s from public.asa_tabletop_scenes where id=new.scene_id and mission_id=new.mission_id;
    if not found or new.x+new.size>s.columns or new.y+new.size>s.rows then raise exception 'token outside scene'; end if;
    if new.image_path is not null and split_part(new.image_path,'/',1)<>new.mission_id::text then raise exception 'asset outside mission'; end if;
    if auth.uid() is not null and not public.is_dm_or_admin() then
      if not s.allow_player_moves or not exists(select 1 from public.asa_tabletop_rooms r where r.mission_id=new.mission_id and r.active_scene_id=new.scene_id) then
        raise exception 'player movement paused' using errcode='42501'; end if;
      if tg_op='UPDATE' and (to_jsonb(new)-array['x','y','version','updated_at']) is distinct from (to_jsonb(old)-array['x','y','version','updated_at']) then
        raise exception 'players can only move their own token' using errcode='42501'; end if;
      if tg_op='INSERT' then
        if new.size<>1 or new.image_path is not null or new.image_url is not null then raise exception 'invalid player token' using errcode='42501'; end if;
        select c.name into new.name from public.characters c where c.id=new.character_id and c.owner_id=auth.uid() and c.mission_id=new.mission_id;
        if not found then raise exception 'own character required' using errcode='42501'; end if;
      end if;
    end if;
  elsif tg_table_name='asa_tabletop_scenes' then
    if new.map_path is not null and split_part(new.map_path,'/',1)<>new.mission_id::text then raise exception 'asset outside mission'; end if;
    for f in select * from jsonb_array_elements(new.fog) loop
      if jsonb_typeof(f)<>'object' or (f->>'x') is null or (f->>'y') is null or (f->>'w') is null or (f->>'h') is null
        or (f->>'x')::integer<0 or (f->>'y')::integer<0 or (f->>'w')::integer<1 or (f->>'h')::integer<1
        or (f->>'x')::integer+(f->>'w')::integer>new.columns or (f->>'y')::integer+(f->>'h')::integer>new.rows then raise exception 'invalid fog area'; end if;
    end loop;
    if exists(select 1 from public.asa_tabletop_tokens t where t.scene_id=new.id and not t.deleted and (t.x+t.size>new.columns or t.y+t.size>new.rows)) then
      raise exception 'grid would strand a token'; end if;
  elsif tg_table_name='asa_tabletop_rooms' and new.active_scene_id is not null then
    if not exists(select 1 from public.asa_tabletop_scenes published_scene where published_scene.id=new.active_scene_id and published_scene.mission_id=new.mission_id and published_scene.published) then
      raise exception 'publish the scene before activating'; end if;
  end if;
  return new;
end; $$;
create trigger tabletop_scenes_validate before insert or update on public.asa_tabletop_scenes for each row execute function public.asa_tabletop_validate();
create trigger tabletop_rooms_validate before insert or update on public.asa_tabletop_rooms for each row execute function public.asa_tabletop_validate();
create trigger tabletop_tokens_validate before insert or update on public.asa_tabletop_tokens for each row execute function public.asa_tabletop_validate();
create function public.asa_tabletop_activate(p_scene_id uuid,p_expected_version bigint default null) returns public.asa_tabletop_rooms
language plpgsql security invoker set search_path='' as $$
declare s public.asa_tabletop_scenes; r public.asa_tabletop_rooms; begin
  if auth.uid() is null or not public.is_dm_or_admin() then raise exception 'manager required' using errcode='42501'; end if;
  select * into s from public.asa_tabletop_scenes where id=p_scene_id;
  if not found or not public.asa_can_access_mission(s.mission_id) then raise exception 'scene access denied' using errcode='42501'; end if;
  insert into public.asa_tabletop_rooms(mission_id) values(s.mission_id) on conflict do nothing;
  select * into r from public.asa_tabletop_rooms where mission_id=s.mission_id for update;
  if p_expected_version is not null and p_expected_version<>r.version then raise exception 'table changed' using errcode='40001'; end if;
  update public.asa_tabletop_scenes set published=true where id=s.id;
  update public.asa_tabletop_rooms set active_scene_id=s.id where mission_id=s.mission_id returning * into r;
  return r;
end; $$;
revoke all on function public.asa_tabletop_activate(uuid,bigint) from public,anon;
grant execute on function public.asa_tabletop_activate(uuid,bigint) to authenticated;
revoke all on function public.asa_tabletop_validate() from public,anon,authenticated;
revoke all on function public.asa_tabletop_revealed(uuid,integer,integer,integer) from public,anon;
grant execute on function public.asa_tabletop_revealed(uuid,integer,integer,integer) to authenticated;

-- Only private, per-mission image uploads. SVG and arbitrary file content are excluded.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('asa-tabletop','asa-tabletop',false,12582912,array['image/png','image/jpeg','image/webp']) on conflict(id) do nothing;
create function public.asa_tabletop_asset_access(object_name text,write_access boolean default false) returns boolean
language plpgsql stable security invoker set search_path='' as $$
declare mid uuid; begin
  if auth.uid() is null then return false; end if;
  begin mid:=split_part(object_name,'/',1)::uuid; exception when invalid_text_representation then return false; end;
  if not public.asa_can_access_mission(mid) then return false; end if;
  if public.is_dm_or_admin() then return true; end if;
  if write_access then return false; end if;
  return exists(select 1 from public.asa_tabletop_scenes s where s.mission_id=mid and s.map_path=object_name)
    or exists(select 1 from public.asa_tabletop_tokens t where t.mission_id=mid and t.image_path=object_name and not t.deleted);
end; $$;
revoke all on function public.asa_tabletop_asset_access(text,boolean) from public,anon;
grant execute on function public.asa_tabletop_asset_access(text,boolean) to authenticated;
create policy tabletop_images_read on storage.objects for select to authenticated using(bucket_id='asa-tabletop' and public.asa_tabletop_asset_access(name,false));
create policy tabletop_images_insert on storage.objects for insert to authenticated with check(bucket_id='asa-tabletop' and public.asa_tabletop_asset_access(name,true));
create policy tabletop_images_delete on storage.objects for delete to authenticated using(bucket_id='asa-tabletop' and public.asa_tabletop_asset_access(name,true));

do $$ declare t text; begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    foreach t in array array['asa_tabletop_scenes','asa_tabletop_rooms','asa_tabletop_tokens'] loop
      execute format('alter publication supabase_realtime add table public.%I',t);
    end loop;
  end if;
end $$;
commit;
