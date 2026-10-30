-- Version aligned with the migration applied through Supabase MCP.
begin;

-- GM-managed party markers are observers too; only kind=player reveals rooms.
drop index public.asa_tabletop_observers_idx;
create index asa_tabletop_observers_idx on public.asa_tabletop_tokens(scene_id)
  where kind='player' and visible and not deleted;

create or replace function asa_private.tabletop_visible_rooms(sid uuid) returns jsonb
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
      and pc.visible and not pc.deleted
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

commit;
