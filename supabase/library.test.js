// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { beforeAll, afterAll, it, expect } from 'vitest';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const gm=id(1),a=id(2),b=id(3),m1=id(10),m2=id(11),hidden=id(20),book=id(21),file=id(30);
const path=`${m1}/${file}/${id(40)}/0`;
let db;
async function as(user,sql,args=[]) {
  await db.exec(`set role ${user?'authenticated':'anon'}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user||'']);
  try{return (await db.query(sql,args)).rows;}finally{await db.exec('reset role');}
}
beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,public to authenticated,anon;
    create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;grant usage on schema storage to authenticated,anon;grant select,insert,delete on storage.objects to authenticated;`);
  const names=readdirSync(new URL('./migrations/',import.meta.url)).sort();
  for(const name of names) await db.exec(readFileSync(new URL(`./migrations/${name}`,import.meta.url),'utf8'));
  if(!names.some(n=>n.endsWith('_mission_library.sql'))) await db.exec(readFileSync(new URL('./mission-library.pending.sql',import.meta.url),'utf8'));
  await db.exec(`insert into auth.users values('${gm}','gm@test.invalid'),('${a}','a@test.invalid'),('${b}','b@test.invalid');
    update profiles set role='admin' where id='${gm}';
    insert into missions(id,name,created_by,content_pack) values('${m1}','Story','${gm}','asa_tower_2077'),('${m2}','Test','${gm}','generic');
    insert into asa_mission_members values('${m1}','${a}'),('${m2}','${b}');
    insert into asa_mission_materials(id,mission_id,code,title,gm_only) values('${hidden}','${m1}','D01','Hidden clue',false),('${book}','${m1}','L01','Full GM book',true);
    insert into asa_mission_material_notes values('${hidden}','${m1}','Final scene','Secret room','Secret explanation');
    insert into asa_mission_bestiary values('${m1}','boss','{"id":"boss","name":"Hidden boss"}');
    insert into asa_mission_material_files(id,material_id,mission_id,file_key,file_name,mime_type,parts,available) values('${file}','${hidden}','${m1}','image','clue.png','image/png',array['${path}'],true);
    insert into storage.objects(bucket_id,name) values('asa-materials','${path}');`);
},30000);
afterAll(async()=>{await db?.close();});
it('starts new missions without a story pack or inherited materials',async()=>{
  const row=(await as(gm,"insert into missions(name) values('New neutral test') returning id,content_pack"))[0];
  expect(row.content_pack).toBe('generic');
  expect(await as(gm,'select * from asa_mission_materials where mission_id=$1',[row.id])).toEqual([]);
  await expect(as(gm,"select asa_tabletop_install_catalog($1,'[]','[]')",[m2])).rejects.toThrow(/pack not enabled/);
});
it('hides titles, bestiary, GM notes and file paths from players',async()=>{
  for(const table of ['asa_mission_materials','asa_mission_bestiary','asa_mission_material_notes','asa_mission_material_files']) expect(await as(a,`select * from ${table}`)).toEqual([]);
  expect(await as(a,"select name from storage.objects where bucket_id='asa-materials'")).toEqual([]);
  expect(await as(gm,'select * from asa_mission_material_notes')).toHaveLength(1);
  await expect(as(null,'select * from asa_mission_materials')).rejects.toThrow();
});
it('delivers only the chosen item to that mission, never notes or GM books',async()=>{
  await as(gm,'update asa_mission_materials set released=true where id=$1',[hidden]);
  expect((await as(a,'select code from asa_mission_materials')).map(r=>r.code)).toEqual(['D01']);
  expect(await as(a,'select * from asa_mission_material_notes')).toEqual([]);
  expect(await as(b,'select * from asa_mission_materials')).toEqual([]);
  expect(await as(a,'select * from asa_mission_material_files')).toHaveLength(1);
  expect((await as(a,"select name from storage.objects where bucket_id='asa-materials'")).map(r=>r.name)).toEqual([path]);
  expect(await as(b,"select name from storage.objects where bucket_id='asa-materials'")).toEqual([]);
  await expect(as(gm,'update asa_mission_materials set released=true where id=$1',[book])).rejects.toThrow(/check constraint/);
  expect(await as(a,'update asa_mission_materials set released=false returning id')).toEqual([]);
});
it('revokes new file reads and rejects forged upload paths',async()=>{
  await as(gm,'update asa_mission_materials set released=false where id=$1',[hidden]);
  expect(await as(a,'select * from asa_mission_material_files')).toEqual([]);
  expect(await as(a,"select * from storage.objects where bucket_id='asa-materials'")).toEqual([]);
  await expect(as(gm,'update asa_mission_material_files set parts=$1 where id=$2',[[`${m2}/${file}/${id(40)}/0`],file])).rejects.toThrow(/invalid material path/);
  await expect(as(a,"insert into storage.objects(bucket_id,name) values('asa-materials',$1)",[path])).rejects.toThrow(/row-level security/);
});
