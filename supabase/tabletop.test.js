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
  await db.exec(
    readFileSync(
      new URL(
        "./migrations/20261030031756_tabletop_room_vision.sql",
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
  it("installs the campaign pack once, preserves the active scene and rejects player imports or cross-mission replacements", async () => {
    const catalog = [
      { id: "A01", name: "Drone v6", kind: "token" },
      {
        id: "SI01",
        name: "Cozinha v6",
        kind: "map",
        columns: 24,
        rows: 18,
        areas: [{ x: 0, y: 0, w: 24, h: 18 }],
      },
    ];
    const before = (
      await as(
        admin,
        "select active_scene_id from asa_tabletop_rooms where mission_id=$1",
        [m1],
      )
    )[0].active_scene_id;
    const install = (uid, items = catalog, replacements = []) =>
      as(uid, "select asa_tabletop_install_catalog($1,$2,$3) as result", [
        m1,
        JSON.stringify(items),
        JSON.stringify(replacements),
      ]);
    await expect(install(a)).rejects.toThrow(/manager/);
    expect((await install(admin))[0].result).toEqual({
      assets: 2,
      scenes: 1,
      tokens: 0,
    });
    expect((await install(admin))[0].result).toEqual({
      assets: 0,
      scenes: 0,
      tokens: 0,
    });
    expect(
      (
        await as(
          admin,
          "select active_scene_id from asa_tabletop_rooms where mission_id=$1",
          [m1],
        )
      )[0].active_scene_id,
    ).toBe(before);
    expect(
      await as(
        a,
        "select id from asa_tabletop_scenes where catalog_key='v6/SI01'",
      ),
    ).toEqual([]);
    await expect(
      install(
        admin,
        [{ id: "A02", name: "Other", kind: "token" }],
        [{ old: `${m2}/private.png`, new: `${m1}/catalog/v6/A01.png` }],
      ),
    ).rejects.toThrow(/outside mission/);
    expect(
      await as(admin, "select id from asa_tabletop_assets where path=$1", [
        `${m1}/catalog/v6/A02.png`,
      ]),
    ).toEqual([]);
  });
  it("reveals occupied rooms, covers them again after the last observer leaves, and filters enemy assets under RLS", async () => {
    const sid = id(70),
      one = id(71),
      two = id(72),
      e1 = id(73),
      e2 = id(74);
    await as(
      admin,
      `insert into asa_tabletop_scenes(id,mission_id,name,vision_mode,vision_areas)
      values($1,$2,'Exploração','rooms',$3)`,
      [
        sid,
        m1,
        JSON.stringify([
          { x: 1, y: 1, w: 8, h: 8 },
          { x: 12, y: 1, w: 8, h: 8 },
        ]),
      ],
    );
    await as(admin, "select asa_tabletop_activate($1,null)", [sid]);
    for (const [tid, uid, cid, x] of [
      [one, a, id(20), 2],
      [two, b, id(21), 3],
    ])
      await as(
        uid,
        `insert into asa_tabletop_tokens(id,scene_id,mission_id,owner_id,character_id,kind,name,visible,x,y)
        values($1,$2,$3,$4,$5,'player','Agente',true,$6,2)`,
        [tid, sid, m1, uid, cid, x],
      );
    for (const [tid, x] of [
      [e1, 4],
      [e2, 15],
    ]) {
      await as(
        admin,
        `insert into asa_tabletop_tokens(id,scene_id,mission_id,kind,name,visible,x,y,image_path)
        values($1,$2,$3,'enemy','Ameaça',true,$4,4,$5)`,
        [tid, sid, m1, x, `${m1}/${tid}.png`],
      );
      await db.query(
        `insert into storage.objects(bucket_id,name) values('asa-tabletop',$1)`,
        [`${m1}/${tid}.png`],
      );
    }
    const visible = async () =>
      (
        await as(
          a,
          "select id from asa_tabletop_tokens where scene_id=$1 and kind='enemy' order by id",
          [sid],
        )
      ).map((r) => r.id);
    expect(await visible()).toEqual([e1]);
    expect(
      await as(a, "select name from storage.objects where name=$1", [
        `${m1}/${e2}.png`,
      ]),
    ).toEqual([]);
    // Entering a room must be possible even before its contents are revealed.
    await as(a, "update asa_tabletop_tokens set x=14,y=3 where id=$1", [one]);
    expect(await visible()).toEqual([e1, e2]);
    await as(b, "update asa_tabletop_tokens set x=0,y=0 where id=$1", [two]);
    expect(await visible()).toEqual([e2]);
    expect(
      await as(a, "select name from storage.objects where name=$1", [
        `${m1}/${e1}.png`,
      ]),
    ).toEqual([]);
    await as(a, "update asa_tabletop_tokens set x=0,y=1 where id=$1", [one]);
    expect(await visible()).toEqual([]);
    expect(
      (
        await as(
          outsider,
          "select asa_private.tabletop_visible_rooms($1) as rooms",
          [sid],
        )
      )[0].rooms,
    ).toEqual([]);
    await expect(
      as(null, "select asa_private.tabletop_visible_rooms($1)", [sid]),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(
        a,
        "update asa_tabletop_scenes set vision_mode='manual' where id=$1 returning id",
        [sid],
      ),
    ).resolves.toEqual([]);
    await expect(
      as(
        admin,
        `update asa_tabletop_scenes set vision_areas='[{"x":0,"y":0,"w":4,"h":4},{"x":2,"y":2,"w":4,"h":4}]' where id=$1`,
        [sid],
      ),
    ).rejects.toThrow(/overlap/);
  });
});
