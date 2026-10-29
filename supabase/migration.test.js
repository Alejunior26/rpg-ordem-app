// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { describe,it,expect,beforeAll,afterAll } from 'vitest';

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const admin=id(1), a=id(2), b=id(3), m1=id(10), m2=id(11), ca=id(20), cb=id(21);
let db;
async function as(user,sql,params=[]) {
  await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user||'']);
  try { return (await db.query(sql,params)).rows; }
  finally { await db.exec('reset role'); }
}
async function action(user,event,payload={},version=null,mission=m1) {
  return (await as(user,'select * from public.asa_combat_action($1,$2,$3,$4)',[mission,event,JSON.stringify(payload),version]))[0];
}
beforeAll(async () => {
  db=new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select current_user::text $$;
    grant usage on schema public,auth to anon,authenticated;
    insert into auth.users values('${admin}','admin@example.test'),('${a}','a@example.test'),('${b}','b@example.test');
    create table public.profiles(id uuid primary key references auth.users(id),email text,role text,nome_personagem text);
    insert into public.profiles select id,email,case when id='${admin}' then 'adm' else 'jogador' end,null from auth.users;`);
  await db.exec(readFileSync(new URL('./fixtures/legacy-schema.sql',import.meta.url),'utf8'));
  await db.query('insert into missions(id,name,created_by) values($1,$2,$3),($4,$5,$3)',[m1,'Campaign A',admin,m2,'Campaign B']);
  await db.query('insert into characters(id,owner_id,mission_id,name,sheet_json) values($1,$2,$3,$4,$5),($6,$7,$8,$9,$5)',[ca,a,m1,'Agent A','{}',cb,b,m2,'Agent B']);
  const migration=readFileSync(new URL('./migrations/202610290001_reliable_campaigns.sql',import.meta.url),'utf8');
  await db.exec(migration);
  // A second application must be safe and preserve existing records.
  await db.exec(migration);
});
afterAll(async()=>{await db?.close();});
describe('campaign migration and authorization',()=>{
  it('allows a player to read only their campaign, profile and character',async()=>{
    expect((await as(a,'select id from missions')).map(x=>x.id)).toEqual([m1]);
    expect((await as(a,'select id from profiles')).map(x=>x.id)).toEqual([a]);
    expect((await as(a,'select id from characters')).map(x=>x.id)).toEqual([ca]);
    await expect(as(null,'select id from characters')).rejects.toThrow(/permission denied/);
  });
  it('denies anonymous RPCs, self promotion, direct updates and forged membership',async()=>{
    await expect(action(null,'READ')).rejects.toThrow();
    await expect(as(a,'select admin_update_profile_role($1,$2)',[a,'admin'])).rejects.toThrow();
    await expect(as(a,"update profiles set role='admin' where id=$1",[a])).rejects.toThrow();
    await expect(as(a,'select asa_set_mission_member($1,$2,true)',[m2,a])).rejects.toThrow();
  });
  it('preserves the last administrator',async()=>{
    await expect(as(admin,'select admin_update_profile_role($1,$2)',[admin,'player'])).rejects.toThrow(/last admin/);
  });
  it('saves sheets with a version check and rejects stale or foreign writes',async()=>{
    const result=await as(a,'select * from asa_save_character($1,0,$2,$3)',[ca,'Agent A','{"pv":18}']);
    expect(result[0].revision).toBe(1);
    await expect(as(a,'select * from asa_save_character($1,0,$2,$3)',[ca,'Agent A','{"pv":1}'])).rejects.toThrow(/conflict/);
    await expect(as(a,'select * from asa_save_character($1,0,$2,$3)',[cb,'forged','{}'])).rejects.toThrow(/not owned/);
    await expect(as(admin,"update characters set name='forged' where id=$1",[ca])).rejects.toThrow();
  });
  it('joins only an owned character in the correct campaign',async()=>{
    const state=await action(a,'READ'); expect(state.version).toBe(0);
    await expect(action(a,'JOIN',{userId:b,characterId:cb},0)).rejects.toThrow();
    await expect(action(a,'JOIN',{userId:a,characterId:cb},0)).rejects.toThrow();
    const joined=await action(a,'JOIN',{userId:a,characterId:ca},0);
    expect(joined.participants).toEqual([{userId:a,nome:'Agent A',kind:'player'}]);
    await expect(action(a,'SET_ORDER',{order:[a]},1)).rejects.toThrow(/manager/);
    await expect(action(b,'READ')).rejects.toThrow(/access denied/);
  });
  it('keeps state after 100 timeline messages and rejects stale concurrent actions',async()=>{
    const ordered=await action(admin,'SET_ORDER',{order:[a]},1); expect(ordered.version).toBe(2);
    await expect(action(admin,'RESET',{},1)).rejects.toThrow(/changed/);
    for(let i=0;i<100;i++) await as(a,'insert into asa_combat_log(mission_id,personagem,acao,rodada) values($1,$2,$3,1)',[m1,'Agent A','Action '+i]);
    const reloaded=await action(a,'READ'); expect(reloaded.participants).toHaveLength(1); expect(reloaded.turn_order).toEqual([a]);
    await expect(action(admin,'ROUND_RESET',{},2)).rejects.toThrow(/finish all turns/);
    const finished=await action(a,'TURN_DONE',{userId:a,round:1},2); expect(finished.turn_done_by).toEqual([a]);
    const advanced=await action(admin,'ROUND_RESET',{},3); expect(advanced.rodada).toBe(2);
    const other=await action(b,'READ',{},null,m2); expect(other.rodada).toBe(1); expect(other.participants).toEqual([]);
  });
  it('denies cross-campaign timeline reads and writes',async()=>{
    expect(await as(b,'select id from asa_combat_log where mission_id=$1',[m1])).toEqual([]);
    await expect(as(b,'insert into asa_combat_log(mission_id,personagem,acao,rodada) values($1,$2,$3,1)',[m1,'forged','test'])).rejects.toThrow();
  });
  it('scopes the ally roster to the campaign and checks revisions when moving a character',async()=>{
    expect((await as(a,'select * from asa_mission_roster($1)',[m1])).map(x=>x.id).sort()).toEqual([admin,a].sort());
    await expect(as(b,'select * from asa_mission_roster($1)',[m1])).rejects.toThrow(/access denied/);
    await expect(as(a,'select * from asa_assign_character_mission($1,$2,0)',[ca,m1])).rejects.toThrow(/conflict/);
  });
});
