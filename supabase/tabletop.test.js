// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const admin = id(1),
  a = id(2),
  b = id(3),
  outsider = id(4),
  m1 = id(10),
  m2 = id(11),
  s1 = id(30),
  s2 = id(31),
  secret = id(32),
  pa = id(40),
  pb = id(41),
  enemy = id(42);
let db;
async function as(user, sql, args = []) {
  await db.exec(`set role ${user ? "authenticated" : "anon"}`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    user || "",
  ]);
  try {
    return (await db.query(sql, args)).rows;
  } finally {
    await db.exec("reset role");
  }
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth,public to authenticated,anon;
    create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;grant usage on schema storage to authenticated,anon;grant select,insert,delete on storage.objects to authenticated;`);
  await db.exec(
    readFileSync(
      new URL(
        "./migrations/202610290001_reliable_campaigns.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(`insert into auth.users values('${admin}','gm@test.invalid'),('${a}','a@test.invalid'),('${b}','b@test.invalid'),('${outsider}','x@test.invalid');
    update profiles set role='admin' where id='${admin}';
    insert into missions(id,name,created_by) values('${m1}','A','${admin}'),('${m2}','B','${admin}');
    insert into asa_mission_members values('${m1}','${a}'),('${m1}','${b}'),('${m2}','${outsider}');
    insert into characters(id,owner_id,mission_id,name) values('${id(20)}','${a}','${m1}','Agente A'),('${id(21)}','${b}','${m1}','Agente B');`);
  await db.exec(
    readFileSync(
      new URL(
        "./migrations/20261029205625_virtual_tabletop.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await as(
    admin,
    `insert into asa_tabletop_scenes(id,mission_id,name,map_path) values($1,$2,'Cozinha',$3),($4,$2,'Laboratório',$5),($6,$7,'Outra campanha',null)`,
    [s1, m1, `${m1}/map.png`, secret, `${m1}/secret.png`, s2, m2],
  );
  await as(admin, "select asa_tabletop_activate($1,null)", [s1]);
  await as(
    a,
    `insert into asa_tabletop_tokens(id,scene_id,mission_id,kind,character_id,owner_id,name,visible,x,y) values($1,$2,$3,'player',$4,$5,'Nome forjado',true,1,1)`,
    [pa, s1, m1, id(20), a],
  );
  await as(
    b,
    `insert into asa_tabletop_tokens(id,scene_id,mission_id,kind,character_id,owner_id,name,visible,x,y) values($1,$2,$3,'player',$4,$5,'B',true,5,5)`,
    [pb, s1, m1, id(21), b],
  );
  await as(
    admin,
    `insert into asa_tabletop_tokens(id,scene_id,mission_id,name,kind,image_path,x,y) values($1,$2,$3,'Ruína','enemy',$4,10,10)`,
    [enemy, s1, m1, `${m1}/ruina.png`],
  );
  await db.exec(
    `insert into storage.objects(bucket_id,name) values('asa-tabletop','${m1}/map.png'),('asa-tabletop','${m1}/secret.png'),('asa-tabletop','${m1}/ruina.png');`,
  );
});
afterAll(async () => {
  await db?.close();
});
describe("private tabletop and movement authorization", () => {
  it("keeps prepared maps and hidden enemy names/positions out of player queries and storage", async () => {
    expect(
      (await as(a, "select id from asa_tabletop_scenes")).map((r) => r.id),
    ).toEqual([s1]);
    expect(
      (await as(a, "select name from asa_tabletop_tokens"))
        .map((r) => r.name)
        .sort(),
    ).toEqual(["Agente A", "Agente B"]);
    expect(
      (await as(a, "select name from storage.objects")).map((r) => r.name),
    ).toEqual([`${m1}/map.png`]);
    expect(await as(outsider, "select id from asa_tabletop_tokens")).toEqual(
      [],
    );
    await expect(as(null, "select * from asa_tabletop_scenes")).rejects.toThrow(
      /permission denied/,
    );
  });
  it("lets a player move their own token, but never another token or change ownership/visibility/art", async () => {
    expect(
      (
        await as(
          a,
          "update asa_tabletop_tokens set x=2 where id=$1 returning version",
          [pa],
        )
      )[0].version,
    ).toBe(1);
    expect(
      await as(
        a,
        "update asa_tabletop_tokens set x=3 where id=$1 returning id",
        [pb],
      ),
    ).toEqual([]);
    for (const patch of [
      "owner_id='" + b + "'",
      "visible=false",
      "name='forged'",
      "size=2",
      "image_url='https://example.test/evil.png'",
      "deleted=true",
    ]) {
      await expect(
        as(a, `update asa_tabletop_tokens set ${patch} where id=$1`, [pa]),
      ).rejects.toThrow(/only move/);
    }
    await expect(
      as(a, "update asa_tabletop_tokens set x=80 where id=$1", [pa]),
    ).rejects.toThrow(/outside scene/);
    expect(
      await as(
        a,
        "update asa_tabletop_tokens set x=3 where id=$1 and version=0 returning id",
        [pa],
      ),
    ).toEqual([]);
    await expect(
      as(a, "select asa_tabletop_activate($1,0)", [secret]),
    ).rejects.toThrow(/manager/);
  });
  it("reveals an enemy deliberately and removes covered tokens from player reads and asset access", async () => {
    await as(admin, "update asa_tabletop_tokens set visible=true where id=$1", [
      enemy,
    ]);
    expect(
      (await as(a, "select id from asa_tabletop_tokens")).map((r) => r.id),
    ).toContain(enemy);
    expect(
      await as(a, "select name from storage.objects where name=$1", [
        `${m1}/ruina.png`,
      ]),
    ).toHaveLength(1);
    await as(
      admin,
      `update asa_tabletop_scenes set fog='[{"x":9,"y":9,"w":4,"h":4}]' where id=$1`,
      [s1],
    );
    expect(
      (await as(a, "select id from asa_tabletop_tokens")).map((r) => r.id),
    ).not.toContain(enemy);
    expect(
      await as(a, "select name from storage.objects where name=$1", [
        `${m1}/ruina.png`,
      ]),
    ).toEqual([]);
    await expect(
      as(a, "update asa_tabletop_tokens set x=10,y=10 where id=$1", [pa]),
    ).rejects.toThrow();
    await expect(
      as(
        admin,
        `update asa_tabletop_scenes set fog='[{"x":0,"y":0,"w":100,"h":2}]' where id=$1`,
        [s1],
      ),
    ).rejects.toThrow(/fog/);
  });
  it("rejects cross-mission asset links and scene assignment, and pauses player moves", async () => {
    await expect(
      as(admin, "update asa_tabletop_tokens set image_path=$1 where id=$2", [
        `${m2}/private.png`,
        enemy,
      ]),
    ).rejects.toThrow(/outside mission/);
    await expect(
      as(
        admin,
        "update asa_tabletop_rooms set active_scene_id=$1 where mission_id=$2",
        [s2, m1],
      ),
    ).rejects.toThrow();
    await as(
      admin,
      "update asa_tabletop_scenes set allow_player_moves=false where id=$1",
      [s1],
    );
    await expect(
      as(a, "update asa_tabletop_tokens set x=3 where id=$1", [pa]),
    ).rejects.toThrow(/paused/);
    await as(admin, "update asa_tabletop_tokens set x=4 where id=$1", [pa]);
    await as(
      admin,
      "update asa_tabletop_scenes set allow_player_moves=true where id=$1",
      [s1],
    );
  });
  it("activates scenes atomically and rejects stale scene changes before publication", async () => {
    const room = (
      await as(admin, "select * from asa_tabletop_rooms where mission_id=$1", [
        m1,
      ])
    )[0];
    await expect(
      as(admin, "select asa_tabletop_activate($1,$2)", [
        secret,
        room.version - 1,
      ]),
    ).rejects.toThrow(/changed/);
    expect(
      (
        await as(
          admin,
          "select published from asa_tabletop_scenes where id=$1",
          [secret],
        )
      )[0].published,
    ).toBe(false);
    await as(admin, "select asa_tabletop_activate($1,$2)", [
      secret,
      room.version,
    ]);
    expect(
      (await as(a, "select id from asa_tabletop_scenes")).map((r) => r.id),
    ).toContain(secret);
    await expect(
      as(a, "update asa_tabletop_tokens set x=3 where id=$1", [pa]),
    ).rejects.toThrow(/paused/);
  });
  it("keeps the bucket private and restricts uploads to managers of that mission", async () => {
    expect(
      (
        await db.query(
          "select public from storage.buckets where id='asa-tabletop'",
        )
      ).rows[0].public,
    ).toBe(false);
    await expect(
      as(
        a,
        "insert into storage.objects(bucket_id,name) values('asa-tabletop',$1)",
        [`${m1}/forged.png`],
      ),
    ).rejects.toThrow();
    expect(
      await as(
        admin,
        "insert into storage.objects(bucket_id,name) values('asa-tabletop',$1) returning name",
        [`${m1}/own.png`],
      ),
    ).toHaveLength(1);
    expect(
      await as(a, "select asa_tabletop_asset_access($1,false) as allowed", [
        "invalid/path",
      ]),
    ).toEqual([{ allowed: false }]);
  });
});
