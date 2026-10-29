// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { it,expect } from 'vitest';
const migration=readFileSync(new URL('./migrations/202610290001_reliable_campaigns.sql',import.meta.url),'utf8');
const bootstrap=`create role anon; create role authenticated; create schema auth;
  create table auth.users(id uuid primary key,email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  grant usage on schema auth,public to anon,authenticated;`;
it('supports an empty database and creates new signup profiles with the canonical role',async()=>{
  const db=new PGlite();
  try {
    await db.exec(bootstrap); await db.exec(migration);
    await db.exec("insert into auth.users values('00000000-0000-4000-8000-000000000001','new@example.test')");
    expect((await db.query('select role from profiles')).rows).toEqual([{role:'player'}]);
  } finally { await db.close(); }
});
it('imports the full single-mission legacy combat once, preserves sheets, and repairs the existing signup trigger',async()=>{
  const db=new PGlite();
  try {
    await db.exec(bootstrap);
    await db.exec(`create table public.profiles(id uuid primary key references auth.users(id),email text,role text,nome_personagem text);
      create function public.handle_new_user() returns trigger language plpgsql as $$ begin insert into public.profiles values(new.id,new.email,'jogador',null);return new;end;$$;
      create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
      insert into auth.users values('00000000-0000-4000-8000-000000000001','legacy@example.test');
      create table missions(id uuid primary key,name text,created_by uuid,created_at timestamptz default now(),description text);
      insert into missions(id,name) values('00000000-0000-4000-8000-000000000010','Legacy mission');
      create table combat_state(id integer primary key,rodada integer); insert into combat_state values(1,3);
      create table combat_log(id uuid primary key default gen_random_uuid(),personagem text,acao text,rodada integer,created_at timestamptz);
      insert into combat_log(personagem,acao,rodada,created_at) values
        ('system','[FLOW]{"event":"JOIN","payload":{"userId":"player-a","nome":"Agent A"}}',3,'2026-01-01T00:00:00Z'),
        ('system','[FLOW]{"event":"SET_ORDER","payload":{"order":["player-a"]}}',3,'2026-01-01T00:00:01Z'),
        ('system','[FLOW]{"event":"TURN_DONE","payload":{"userId":"player-a","round":3}}',3,'2026-01-01T00:00:02Z');
      insert into combat_log(personagem,acao,rodada,created_at) select 'Agent A','Message '||i,3,'2026-01-02T00:00:00Z'::timestamptz+(i||' seconds')::interval from generate_series(1,100) i;`);
    await db.exec(migration); await db.exec(migration);
    const state=(await db.query('select * from asa_combat_state')).rows[0];
    expect(state.rodada).toBe(3); expect(state.participants).toHaveLength(1);expect(state.turn_order).toEqual(['player-a']);expect(state.turn_done_by).toEqual(['player-a']);
    expect((await db.query('select count(*)::int as count from asa_combat_log')).rows[0].count).toBe(100);
    expect((await db.query('select count(*)::int as count from combat_log')).rows[0].count).toBe(103);
    await db.exec("insert into auth.users values('00000000-0000-4000-8000-000000000002','next@example.test')");
    expect((await db.query('select role from profiles')).rows).toEqual([{role:'player'},{role:'player'}]);
  } finally { await db.close(); }
});
