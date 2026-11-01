alter table public.missions add column if not exists content_pack text not null default 'generic';
alter table public.missions add constraint missions_content_pack_check check(content_pack in ('generic','asa_tower_2077'));
-- INSERT ... RETURNING must see the newly created mission, before a helper's
-- table lookup can see it in the command snapshot.
drop policy missions_read on public.missions;
create policy missions_read on public.missions for select to authenticated
using(public.is_dm_or_admin() or created_by=auth.uid() or public.asa_can_access_mission(id));

create function public.asa_can_manage_library(target uuid) returns boolean
language sql stable security invoker set search_path='' as $$
  select public.is_dm_or_admin() and public.asa_can_access_mission(target);
$$;
revoke all on function public.asa_can_manage_library(uuid) from public,anon;
grant execute on function public.asa_can_manage_library(uuid) to authenticated;

create table public.asa_mission_bestiary (
  mission_id uuid not null references public.missions(id) on delete cascade,
  catalog_id text not null, data jsonb not null check(jsonb_typeof(data)='object'),
  primary key(mission_id,catalog_id)
);
create table public.asa_mission_materials (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  code text not null, title text not null, kind text not null default 'document',
  body text not null default '', sort_order integer not null default 0,
  gm_only boolean not null default true, released boolean not null default false,
  unique(mission_id,code), unique(id,mission_id), check(not(gm_only and released))
);
create table public.asa_mission_material_notes (
  material_id uuid primary key, mission_id uuid not null,
  scene text not null default '', place text not null default '', note text not null default '',
  foreign key(material_id,mission_id) references public.asa_mission_materials(id,mission_id) on delete cascade
);
create table public.asa_mission_material_files (
  id uuid primary key default gen_random_uuid(), material_id uuid not null, mission_id uuid not null,
  file_key text not null, file_name text not null, mime_type text not null,
  parts text[] not null default '{}', total_size bigint not null default 0 check(total_size>=0 and total_size<=150000000),
  available boolean not null default false,
  unique(material_id,file_key),
  foreign key(material_id,mission_id) references public.asa_mission_materials(id,mission_id) on delete cascade,
  check(mime_type in ('application/pdf','image/png','image/jpeg','image/webp')),
  check(not available or cardinality(parts)>0)
);
create index on public.asa_mission_materials(mission_id,sort_order);
create index on public.asa_mission_material_notes(mission_id);
create index on public.asa_mission_material_files(mission_id);

-- Paths are server-validated before a manager registers an upload. No public URLs.
create function public.asa_validate_material_parts() returns trigger
language plpgsql security invoker set search_path='' as $$
declare p text;
begin
  if cardinality(new.parts)>40 then raise exception 'too many parts'; end if;
  foreach p in array new.parts loop
    if p is null or p !~ ('^'||new.mission_id::text||'/'||new.id::text||'/[0-9a-f-]{36}/[0-9]{1,2}$') then
      raise exception 'invalid material path';
    end if;
  end loop;
  return new;
end $$;
create trigger asa_material_parts_check before insert or update on public.asa_mission_material_files
for each row execute function public.asa_validate_material_parts();
revoke all on function public.asa_validate_material_parts() from public,anon;

alter table public.asa_mission_bestiary enable row level security;
alter table public.asa_mission_materials enable row level security;
alter table public.asa_mission_material_notes enable row level security;
alter table public.asa_mission_material_files enable row level security;
revoke all on public.asa_mission_bestiary,public.asa_mission_materials,public.asa_mission_material_notes,public.asa_mission_material_files from public,anon;
grant select,insert,update,delete on public.asa_mission_bestiary,public.asa_mission_materials,public.asa_mission_material_notes,public.asa_mission_material_files to authenticated;

create policy library_bestiary_manager on public.asa_mission_bestiary for all to authenticated
using(public.asa_can_manage_library(mission_id)) with check(public.asa_can_manage_library(mission_id));
create policy library_material_manager on public.asa_mission_materials for all to authenticated
using(public.asa_can_manage_library(mission_id)) with check(public.asa_can_manage_library(mission_id));
create policy library_material_player on public.asa_mission_materials for select to authenticated
using(released and not gm_only and public.asa_can_access_mission(mission_id));
create policy library_notes_manager on public.asa_mission_material_notes for all to authenticated
using(public.asa_can_manage_library(mission_id)) with check(public.asa_can_manage_library(mission_id));
create policy library_files_manager on public.asa_mission_material_files for all to authenticated
using(public.asa_can_manage_library(mission_id)) with check(public.asa_can_manage_library(mission_id));
create policy library_files_player on public.asa_mission_material_files for select to authenticated
using(available and exists(select 1 from public.asa_mission_materials m where m.id=material_id and m.mission_id=asa_mission_material_files.mission_id
  and m.released and not m.gm_only and public.asa_can_access_mission(m.mission_id)));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('asa-materials','asa-materials',false,6291456,array['application/octet-stream'])
on conflict(id) do nothing;
create policy library_storage_read on storage.objects for select to authenticated using(
  bucket_id='asa-materials' and (
    public.asa_can_manage_library(case when split_part(name,'/',1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then split_part(name,'/',1)::uuid else null end)
    or exists(select 1 from public.asa_mission_material_files f where name=any(f.parts) and f.available))
);
create policy library_storage_upload on storage.objects for insert to authenticated with check(
  bucket_id='asa-materials' and exists(select 1 from public.asa_mission_material_files f where name=any(f.parts) and public.asa_can_manage_library(f.mission_id))
);
create policy library_storage_delete on storage.objects for delete to authenticated using(
  bucket_id='asa-materials' and public.asa_can_manage_library(case when split_part(name,'/',1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then split_part(name,'/',1)::uuid else null end)
);

-- Catalogue content is opt-in per mission, including calls that bypass the UI.
create function public.asa_has_campaign_pack(target uuid) returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(select 1 from public.missions where id=target and content_pack='asa_tower_2077');
$$;
revoke all on function public.asa_has_campaign_pack(uuid) from public,anon;
grant execute on function public.asa_has_campaign_pack(uuid) to authenticated;

create or replace function public.asa_tabletop_install_catalog(p_mission_id uuid,p_catalog jsonb,p_replacements jsonb default '[]'::jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare item jsonb; asset_path text; asset_count integer:=0; scene_count integer:=0; token_count integer:=0; affected integer; begin
  if auth.uid() is null or not public.is_dm_or_admin() or not public.asa_can_access_mission(p_mission_id) then
    raise exception 'manager required' using errcode='42501'; end if;
  if not public.asa_has_campaign_pack(p_mission_id) then raise exception 'campaign pack not enabled' using errcode='42501'; end if;
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
