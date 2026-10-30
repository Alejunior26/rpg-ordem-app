-- Applied via Supabase MCP; filename aligned with the returned migration version.
begin;

alter table public.asa_tabletop_scenes
  add column spawn_x integer not null default 0 check (spawn_x>=0),
  add column spawn_y integer not null default 0 check (spawn_y>=0),
  add column catalog_key text check (catalog_key is null or catalog_key ~ '^v6/[A-Z0-9_]{1,20}$'),
  add column vision_mode text not null default 'manual' check (vision_mode in ('manual','rooms')),
  add column vision_areas jsonb not null default '[]'::jsonb
    check (jsonb_typeof(vision_areas)='array' and jsonb_array_length(vision_areas)<=100);
create unique index asa_tabletop_catalog_scene_idx on public.asa_tabletop_scenes(mission_id,catalog_key);

create index asa_tabletop_observers_idx on public.asa_tabletop_tokens(scene_id)
  where kind='player' and visible and not deleted and owner_id is not null;

create schema if not exists asa_private;
revoke all on schema asa_private from public,anon;
grant usage on schema asa_private to authenticated;

-- RLS on tokens cannot query itself recursively. This narrow private lookup
-- reads only observer positions after checking the caller's mission access.
create function asa_private.tabletop_visible_rooms(sid uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare s public.asa_tabletop_scenes; result jsonb; begin
  if auth.uid() is null then return '[]'::jsonb; end if;
  select * into s from public.asa_tabletop_scenes where id=sid;
  if not found or not s.published or not public.asa_can_access_mission(s.mission_id)
    or not exists(select 1 from public.asa_tabletop_rooms r where r.mission_id=s.mission_id and r.active_scene_id=sid) then
    return '[]'::jsonb;
  end if;
  select coalesce(jsonb_agg(area),'[]'::jsonb) into result
  from jsonb_array_elements(s.vision_areas) area
  where exists (
    select 1 from public.asa_tabletop_tokens pc
    where pc.scene_id=sid and pc.mission_id=s.mission_id and pc.kind='player'
      and pc.visible and not pc.deleted and pc.owner_id is not null
      and pc.x+pc.size/2.0 >= (area->>'x')::integer
      and pc.x+pc.size/2.0 < (area->>'x')::integer+(area->>'w')::integer
      and pc.y+pc.size/2.0 >= (area->>'y')::integer
      and pc.y+pc.size/2.0 < (area->>'y')::integer+(area->>'h')::integer
      and not exists(select 1 from jsonb_array_elements(s.fog) f
        where pc.x<(f->>'x')::integer+(f->>'w')::integer and pc.x+pc.size>(f->>'x')::integer
          and pc.y<(f->>'y')::integer+(f->>'h')::integer and pc.y+pc.size>(f->>'y')::integer)
  );
  return result;
end; $$;
revoke all on function asa_private.tabletop_visible_rooms(uuid) from public,anon;
grant execute on function asa_private.tabletop_visible_rooms(uuid) to authenticated;

-- Movement can enter a dark room; this check deliberately ignores automatic
-- room darkness but still enforces the GM's manually covered areas and RLS.
create function public.asa_tabletop_position_allowed(sid uuid,px integer,py integer,ps integer) returns boolean
language sql stable security invoker set search_path='' as $$
  select exists(select 1 from public.asa_tabletop_scenes s where s.id=sid and s.published
    and px>=0 and py>=0 and ps between 1 and 4 and px+ps<=s.columns and py+ps<=s.rows
    and not exists(select 1 from jsonb_array_elements(s.fog) f
      where px<(f->>'x')::integer+(f->>'w')::integer and px+ps>(f->>'x')::integer
        and py<(f->>'y')::integer+(f->>'h')::integer and py+ps>(f->>'y')::integer));
$$;
revoke all on function public.asa_tabletop_position_allowed(uuid,integer,integer,integer) from public,anon;
grant execute on function public.asa_tabletop_position_allowed(uuid,integer,integer,integer) to authenticated;

create or replace function public.asa_tabletop_revealed(sid uuid,px integer,py integer,ps integer) returns boolean
language sql stable security invoker set search_path='' as $$
  select exists(select 1 from public.asa_tabletop_scenes s where s.id=sid and s.published
    and public.asa_tabletop_position_allowed(sid,px,py,ps)
    and (s.vision_mode='manual' or not exists (
      select 1 from jsonb_array_elements(s.vision_areas) area
      where px<(area->>'x')::integer+(area->>'w')::integer and px+ps>(area->>'x')::integer
        and py<(area->>'y')::integer+(area->>'h')::integer and py+ps>(area->>'y')::integer
        and not asa_private.tabletop_visible_rooms(sid) @> jsonb_build_array(area)
    )));
$$;

drop policy tabletop_tokens_read on public.asa_tabletop_tokens;
create policy tabletop_tokens_read on public.asa_tabletop_tokens for select to authenticated
  using(public.asa_can_access_mission(mission_id) and ((select public.is_dm_or_admin())
    or (visible and not deleted and (public.asa_tabletop_revealed(scene_id,x,y,size)
      or (owner_id=(select auth.uid()) and public.asa_tabletop_position_allowed(scene_id,x,y,size))))));

drop policy tabletop_tokens_insert on public.asa_tabletop_tokens;
create policy tabletop_tokens_insert on public.asa_tabletop_tokens for insert to authenticated
  with check(public.asa_can_access_mission(mission_id) and ((select public.is_dm_or_admin()) or (
    kind='player' and owner_id=(select auth.uid()) and visible and not deleted
    and public.asa_tabletop_position_allowed(scene_id,x,y,size)
    and exists(select 1 from public.characters c where c.id=character_id and c.owner_id=(select auth.uid()) and c.mission_id=asa_tabletop_tokens.mission_id)
    and exists(select 1 from public.asa_tabletop_rooms r where r.mission_id=asa_tabletop_tokens.mission_id and r.active_scene_id=scene_id))));

drop policy tabletop_tokens_update on public.asa_tabletop_tokens;
create policy tabletop_tokens_update on public.asa_tabletop_tokens for update to authenticated
  using(public.asa_can_access_mission(mission_id) and ((select public.is_dm_or_admin()) or
    (owner_id=(select auth.uid()) and not deleted and visible and public.asa_tabletop_position_allowed(scene_id,x,y,size))))
  with check(public.asa_can_access_mission(mission_id) and ((select public.is_dm_or_admin()) or
    (owner_id=(select auth.uid()) and not deleted and visible and public.asa_tabletop_position_allowed(scene_id,x,y,size))));

create function public.asa_tabletop_validate_rooms() returns trigger
language plpgsql security invoker set search_path='' as $$
declare area jsonb; part text; begin
  if new.spawn_x>=new.columns or new.spawn_y>=new.rows then raise exception 'entry outside scene'; end if;
  for area in select * from jsonb_array_elements(new.vision_areas) loop
    if jsonb_typeof(area)<>'object' or area-array['x','y','w','h']<>'{}'::jsonb then
      raise exception 'invalid room area'; end if;
    foreach part in array array['x','y','w','h'] loop
      if jsonb_typeof(area->part) is distinct from 'number' or (area->>part)!~'^[0-9]{1,2}$' then
        raise exception 'invalid room area'; end if;
    end loop;
    if (area->>'w')::integer<1 or (area->>'h')::integer<1
      or (area->>'x')::integer+(area->>'w')::integer>new.columns
      or (area->>'y')::integer+(area->>'h')::integer>new.rows then
      raise exception 'room outside scene'; end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(new.vision_areas) with ordinality a(area,n)
    join jsonb_array_elements(new.vision_areas) with ordinality b(area,n) on a.n<b.n
    where (a.area->>'x')::integer<(b.area->>'x')::integer+(b.area->>'w')::integer
      and (a.area->>'x')::integer+(a.area->>'w')::integer>(b.area->>'x')::integer
      and (a.area->>'y')::integer<(b.area->>'y')::integer+(b.area->>'h')::integer
      and (a.area->>'y')::integer+(a.area->>'h')::integer>(b.area->>'y')::integer) then
    raise exception 'room areas overlap'; end if;
  return new;
end; $$;
revoke all on function public.asa_tabletop_validate_rooms() from public,anon,authenticated;
create trigger tabletop_room_vision_validate before insert or update on public.asa_tabletop_scenes
  for each row execute function public.asa_tabletop_validate_rooms();

create function public.asa_tabletop_install_catalog(p_mission_id uuid,p_catalog jsonb,p_replacements jsonb default '[]'::jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare item jsonb; asset_path text; asset_count integer:=0; scene_count integer:=0; token_count integer:=0; affected integer; begin
  if auth.uid() is null or not public.is_dm_or_admin() or not public.asa_can_access_mission(p_mission_id) then
    raise exception 'manager required' using errcode='42501'; end if;
  if jsonb_typeof(p_catalog) is distinct from 'array' or jsonb_array_length(p_catalog)>64
    or jsonb_typeof(p_replacements) is distinct from 'array' or jsonb_array_length(p_replacements)>200 then
    raise exception 'invalid catalog'; end if;
  for item in select * from jsonb_array_elements(p_catalog) loop
    if (item->>'id') is null or (item->>'id')!~'^[A-Z0-9_]{1,20}$'
      or (item->>'kind') is null or (item->>'kind') not in ('map','token') then
      raise exception 'invalid catalog item'; end if;
    asset_path:=p_mission_id::text||'/catalog/v6/'||(item->>'id')||'.png';
    insert into public.asa_tabletop_assets(mission_id,name,kind,path)
      values(p_mission_id,item->>'name',item->>'kind',asset_path) on conflict(path) do nothing;
    get diagnostics affected=row_count; asset_count:=asset_count+affected;
    if item->>'kind'='map' then
      insert into public.asa_tabletop_scenes(mission_id,name,map_path,columns,rows,grid_visible,vision_mode,vision_areas,catalog_key,spawn_x,spawn_y)
        values(p_mission_id,(item->>'id')||' · '||(item->>'name'),asset_path,
          (item->>'columns')::integer,(item->>'rows')::integer,false,'rooms',item->'areas','v6/'||(item->>'id'),coalesce((item->>'spawn_x')::integer,0),coalesce((item->>'spawn_y')::integer,0))
        on conflict(mission_id,catalog_key) do nothing;
      get diagnostics affected=row_count; scene_count:=scene_count+affected;
    end if;
  end loop;
  for item in select * from jsonb_array_elements(p_replacements) loop
    if not exists(select 1 from public.asa_tabletop_assets a where a.mission_id=p_mission_id
      and a.kind='token' and a.path=item->>'old') or not exists(
      select 1 from public.asa_tabletop_assets a where a.mission_id=p_mission_id and a.kind='token'
      and a.path=item->>'new' and a.path like p_mission_id::text||'/catalog/v6/%') then
      raise exception 'asset outside mission' using errcode='42501'; end if;
    update public.asa_tabletop_tokens set image_path=item->>'new',image_url=null
      where mission_id=p_mission_id and image_path=item->>'old' and not deleted;
    get diagnostics affected=row_count; token_count:=token_count+affected;
  end loop;
  return jsonb_build_object('assets',asset_count,'scenes',scene_count,'tokens',token_count);
end; $$;
revoke all on function public.asa_tabletop_install_catalog(uuid,jsonb,jsonb) from public,anon;
grant execute on function public.asa_tabletop_install_catalog(uuid,jsonb,jsonb) to authenticated;

commit;
