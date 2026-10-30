import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useTabletop } from "../hooks/useTabletop";
import {
  campaignFolderImages,
  characterSpawn,
  safeImageUrl,
  snapPosition,
  tokenIsVisible,
} from "../domain/tabletop";
import TabletopBoard from "./TabletopBoard";
import TabletopViewport from "./TabletopViewport";
import TabletopAssetThumbnail from "./TabletopAssetThumbnail";
import "./tabletop.css";

const initialScene = {
  name: "",
  map_path: "",
  map_url: "",
  columns: 24,
  rows: 18,
};
const initialToken = {
  name: "",
  kind: "enemy",
  image_path: "",
  size: 1,
  color: "#bb8bff",
  visible: false,
  owner_id: "",
};
export default function VirtualTabletop(props) {
  const table = useTabletop(props.missionId, props.userId, props.manager);
  const [roster, setRoster] = useState([]);
  useEffect(() => {
    if (!props.manager || !props.missionId) return;
    let alive = true;
    supabase
      .rpc("asa_mission_roster", { p_mission_id: props.missionId })
      .then(({ data }) => {
        if (alive) setRoster(data || []);
      });
    return () => {
      alive = false;
    };
  }, [props.missionId, props.manager]);
  return <TabletopView {...props} table={table} roster={roster} />;
}
export function TabletopView({
  table,
  roster = [],
  missionId,
  missionName,
  userId,
  manager,
  character,
  round = 1,
  currentTurn = "",
}) {
  const [selectedScene, setSelectedScene] = useState(""),
    [selectedId, setSelectedId] = useState(null);
  const [preview, setPreview] = useState(false),
    [zoom, setZoom] = useState(100),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [tool, setTool] = useState("move");
  const [sceneDraft, setSceneDraft] = useState(initialScene),
    [tokenDraft, setTokenDraft] = useState(initialToken);
  const [importProgress, setImportProgress] = useState(null),
    [localError, setLocalError] = useState("");
  const [notice, setNotice] = useState("");
  const importCancel = useRef(false);
  const stage = useRef(null),
    masterView = useRef(null),
    restoreView = useRef(false);
  useLayoutEffect(() => {
    if (preview || !restoreView.current || !masterView.current) return;
    restoreView.current = false;
    const saved = masterView.current;
    if (stage.current) {
      stage.current.scrollLeft = saved.left;
      stage.current.scrollTop = saved.top;
    }
    if (window.scrollX !== saved.windowX || window.scrollY !== saved.windowY)
      window.scrollTo({
        left: saved.windowX,
        top: saved.windowY,
        behavior: "instant",
      });
  }, [preview]);
  useEffect(
    () => () => {
      importCancel.current = true;
    },
    [],
  );
  const active = table.scenes.find((s) => s.id === table.room?.active_scene_id);
  const scene =
    manager && !preview
      ? table.scenes.find((s) => s.id === selectedScene) ||
        active ||
        table.scenes[0]
      : active;
  const tokens = table.tokens.filter((t) => t.scene_id === scene?.id);
  const selected = tokens.find(
    (t) =>
      t.id === selectedId &&
      ((manager && !preview) || tokenIsVisible(t, scene, tokens)),
  );
  const maps = table.assets.filter((a) => a.kind === "map"),
    art = table.assets.filter((a) => a.kind === "token");
  const disabled = table.busy || Boolean(importProgress);
  const imageKey = [scene?.map_path, ...tokens.map((t) => t.image_path)]
    .filter(Boolean)
    .sort()
    .join("|");
  useEffect(() => {
    void table.ensureImages?.(imageKey.split("|"));
  }, [imageKey, table.ensureImages]);
  function togglePreview(checked) {
    if (checked) {
      masterView.current = {
        sceneId: scene?.id || "",
        selectedId,
        zoom,
        pan,
        tool,
        left: stage.current?.scrollLeft || 0,
        top: stage.current?.scrollTop || 0,
        windowX: window.scrollX,
        windowY: window.scrollY,
      };
      // Pin the actual GM scene even if the active scene changes during preview.
      setSelectedScene(scene?.id || "");
      setTool("move");
      setSelectedId(null);
      setPan({ x: 0, y: 0 });
    } else if (masterView.current) {
      const saved = masterView.current;
      setSelectedScene(saved.sceneId);
      setSelectedId(saved.selectedId);
      setZoom(saved.zoom);
      setPan(saved.pan);
      setTool(saved.tool);
      restoreView.current = true;
    }
    setPreview(checked);
  }
  async function createScene(event) {
    event.preventDefault();
    setLocalError("");
    if (sceneDraft.map_url && !safeImageUrl(sceneDraft.map_url)) {
      setLocalError("Use um endereço HTTPS de imagem.");
      return;
    }
    const result = await table.createScene({
      ...sceneDraft,
      map_path: sceneDraft.map_path || null,
      map_url: sceneDraft.map_path
        ? null
        : safeImageUrl(sceneDraft.map_url) || null,
      columns: Number(sceneDraft.columns),
      rows: Number(sceneDraft.rows),
    });
    if (result?.id) {
      setSelectedScene(result.id);
      setSceneDraft(initialScene);
      setPreview(false);
    }
  }
  async function sendImage(event, kind) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const result = await table.upload(
      file,
      kind,
      file.name.replace(/\.[^.]+$/, "").replaceAll("_", " "),
    );
    if (result?.path) {
      if (kind === "map")
        setSceneDraft((d) => ({
          ...d,
          map_path: result.path,
          name: d.name || result.name,
        }));
      else
        setTokenDraft((d) => ({
          ...d,
          image_path: result.path,
          name: d.name || result.name,
        }));
    }
  }
  async function importFolder(event) {
    const queue = campaignFolderImages(event.target.files || []);
    event.target.value = "";
    if (!queue.length) {
      setLocalError("Escolha a pasta ASA_Tower_2077 descompactada.");
      return;
    }
    importCancel.current = false;
    setLocalError("");
    setImportProgress({ done: 0, total: queue.length });
    let failures = 0;
    for (let i = 0; i < queue.length && !importCancel.current; i++) {
      const { file, kind, name } = queue[i];
      if (
        !table.assets.some((a) => a.name === name && a.kind === kind) &&
        !(await table.upload(file, kind, name))
      )
        failures++;
      if (!importCancel.current)
        setImportProgress({ done: i + 1, total: queue.length });
    }
    if (failures)
      setLocalError(
        `${failures} imagem(ns) não foram importadas. Você pode tentar novamente; as imagens já enviadas serão preservadas.`,
      );
    setImportProgress(null);
  }
  async function addToken(event) {
    event.preventDefault();
    if (!scene) return;
    const result = await table.addToken({
      ...tokenDraft,
      scene_id: scene.id,
      owner_id: tokenDraft.owner_id || null,
      size: Number(tokenDraft.size),
      image_path: tokenDraft.image_path || null,
      ...snapPosition(
        scene.spawn_x || 0,
        scene.spawn_y || 0,
        scene,
        Number(tokenDraft.size),
      ),
    });
    if (result?.id) {
      setSelectedId(result.id);
      setTokenDraft(initialToken);
    }
  }
  async function addMyCharacter() {
    if (!scene || !character?.id) return;
    const spawn = characterSpawn(scene, tokens);
    if (!spawn) {
      setLocalError("Aguarde o mestre liberar uma área para seu personagem.");
      return;
    }
    const result = await table.addToken({
      scene_id: scene.id,
      character_id: character.id,
      owner_id: userId,
      name: character.name || "Agente",
      kind: "player",
      visible: true,
      ...spawn,
    });
    if (result?.id) setSelectedId(result.id);
  }
  if (!missionId)
    return (
      <section className="vt-shell">
        <div className="vt-empty">
          <h2>Escolha uma missão</h2>
          <p>A mesa virtual acompanha a missão e o personagem selecionados.</p>
        </div>
      </section>
    );
  return (
    <section className="vt-shell" aria-label="Mesa virtual">
      <header className="vt-header">
        <div>
          <p className="vt-eyebrow">A.S.A. / MESA VIRTUAL</p>
          <h2>{missionName || "Sua campanha"}</h2>
          <p className="vt-subtitle">
            Um cenário compartilhado. Cada escolha, na mesma mesa.
          </p>
        </div>
        <span className={`vt-live ${table.loading ? "pending" : ""}`}>
          <i />
          {table.loading
            ? "Conectando"
            : manager
              ? "Mestre conectado"
              : "Jogador conectado"}
        </span>
      </header>
      {(table.error || localError) && (
        <div role="alert" className="vt-alert">
          {localError || table.error}
          <button
            type="button"
            onClick={() => {
              setLocalError("");
              void table.refresh();
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}
      <div className="vt-layout">
        <div className="vt-map-panel">
          <div className="vt-toolbar">
            <div className="vt-scene-title">
              <span className="vt-dot" />
              {scene?.name || "Nenhuma cena liberada"}
              {scene && (
                <small>
                  {scene.id === active?.id ? "EM JOGO" : "PREPARAÇÃO"}
                </small>
              )}
            </div>
            <div className="vt-tools">
              <button
                type="button"
                aria-pressed={tool === "move"}
                onClick={() => setTool("move")}
              >
                Mover
              </button>
              <button
                type="button"
                aria-pressed={tool === "ruler"}
                onClick={() => setTool("ruler")}
              >
                Régua
              </button>
              {manager && !preview && (
                <button
                  type="button"
                  aria-pressed={tool === "spawn"}
                  onClick={() => setTool("spawn")}
                >
                  Marcar entrada
                </button>
              )}
              {manager && !preview && (
                <button
                  type="button"
                  aria-pressed={tool === "room"}
                  onClick={() => setTool("room")}
                >
                  Marcar sala
                </button>
              )}
              {manager && !preview && (
                <button
                  type="button"
                  aria-pressed={tool === "fog"}
                  onClick={() => setTool("fog")}
                >
                  Cobrir área
                </button>
              )}
              <label className="vt-zoom">
                Zoom
                <select
                  aria-label="Zoom do mapa"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                >
                  {[50, 75, 100, 125, 150, 200, 300, 400, zoom]
                    .filter((n, i, all) => all.indexOf(n) === i)
                    .sort((a, b) => a - b)
                    .map((n) => (
                      <option key={n} value={n}>
                        {n}%
                      </option>
                    ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setZoom(100);
                  setPan({ x: 0, y: 0 });
                }}
              >
                Centralizar
              </button>
            </div>
          </div>
          <TabletopViewport
            stageRef={stage}
            scene={scene}
            zoom={zoom}
            onZoom={setZoom}
            pan={pan}
            onPan={setPan}
            tool={tool}
            preview={preview}
            onBackgroundClick={() => setSelectedId(null)}
          >
            <TabletopBoard
              key={scene?.id || "empty"}
              scene={scene}
              tokens={tokens}
              images={table.images}
              userId={userId}
              manager={manager}
              preview={preview}
              busy={disabled}
              selectedId={selectedId}
              tool={tool}
              onSelect={setSelectedId}
              onMove={(token, pos) => table.updateToken(token, pos)}
              onFog={(rect) =>
                table.updateScene(scene, {
                  fog: [...(scene.fog || []), rect],
                })
              }
              onRoom={(rect) =>
                table.updateScene(scene, {
                  vision_mode: "rooms",
                  vision_areas: [...(scene.vision_areas || []), rect],
                })
              }
              onSpawn={(pos) =>
                table.updateScene(scene, { spawn_x: pos.x, spawn_y: pos.y })
              }
            />
            {table.loading && (
              <div className="vt-loading" role="status">
                Sincronizando a mesa…
              </div>
            )}
          </TabletopViewport>
          <div className="vt-map-footer">
            <span>▦ 1 quadrado = 1,5 m</span>
            <span>
              {tool === "spawn"
                ? "Clique no ponto por onde os personagens entram na cena."
                : tool === "room"
                  ? "Arraste sobre uma sala. Ela só aparece ao grupo enquanto houver um personagem dentro."
                  : tool === "fog"
                    ? "Arraste para cobrir uma área."
                    : tool === "ruler"
                      ? "Arraste entre dois pontos para medir."
                      : "Roda: zoom · Arraste o fundo: mover mapa · Arraste seu token: mover personagem."}
            </span>
            <span>
              {table.busy
                ? "Salvando…"
                : `Rodada ${round}${currentTurn ? " · " + currentTurn : ""}`}
            </span>
          </div>
        </div>
        <aside className="vt-sidebar">
          {manager && (
            <div className="vt-card">
              <h3>Direção da cena</h3>
              <label>
                Cenário
                <select
                  aria-label="Selecionar cenário"
                  value={scene?.id || ""}
                  disabled={preview || disabled}
                  onChange={(e) => {
                    setSelectedScene(e.target.value);
                    setSelectedId(null);
                    setPan({ x: 0, y: 0 });
                    setZoom(100);
                  }}
                >
                  <option value="" disabled>
                    Escolha uma cena
                  </option>
                  {table.scenes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.id === active?.id ? " · em jogo" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="vt-primary"
                type="button"
                disabled={!scene || disabled || preview}
                onClick={() => table.activate(scene)}
              >
                Exibir para os jogadores
              </button>
              <label className="vt-check">
                <input
                  type="checkbox"
                  checked={preview}
                  onChange={(e) => togglePreview(e.target.checked)}
                />
                Prévia dos jogadores
              </label>
              {scene && !preview && (
                <>
                  <label className="vt-check">
                    <input
                      type="checkbox"
                      checked={scene.vision_mode === "rooms"}
                      disabled={disabled}
                      onChange={(e) =>
                        table.updateScene(scene, {
                          vision_mode: e.target.checked ? "rooms" : "manual",
                        })
                      }
                    />
                    Visão automática por salas
                  </label>
                  {scene.vision_mode === "rooms" && (
                    <div className="vt-room-list">
                      <p className="vt-muted">
                        Marque os limites de cada sala com “Marcar sala”.
                        Corredores sem marcação permanecem visíveis. Um token de
                        Personagem, inclusive controlado pelo mestre, abre a
                        sala; o último a sair a cobre novamente.
                      </p>
                      {(scene.vision_areas || []).map((area, index) => (
                        <div className="vt-room-row" key={index}>
                          <span>
                            Sala {index + 1} · {area.w} × {area.h}
                          </span>
                          <button
                            type="button"
                            disabled={disabled}
                            aria-label={`Remover sala ${index + 1}`}
                            onClick={() =>
                              table.updateScene(scene, {
                                vision_areas: scene.vision_areas.filter(
                                  (_, i) => i !== index,
                                ),
                              })
                            }
                          >
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="vt-check">
                    <input
                      type="checkbox"
                      checked={scene.grid_visible}
                      disabled={disabled}
                      onChange={(e) =>
                        table.updateScene(scene, {
                          grid_visible: e.target.checked,
                        })
                      }
                    />
                    Mostrar grade
                  </label>
                  <label className="vt-check">
                    <input
                      type="checkbox"
                      checked={scene.allow_player_moves}
                      disabled={disabled}
                      onChange={(e) =>
                        table.updateScene(scene, {
                          allow_player_moves: e.target.checked,
                        })
                      }
                    />
                    Permitir movimento dos jogadores
                  </label>
                  <div className="vt-button-row">
                    <button
                      type="button"
                      disabled={disabled || !scene.fog?.length}
                      onClick={() =>
                        table.updateScene(scene, {
                          fog: scene.fog.slice(0, -1),
                        })
                      }
                    >
                      Revelar última área
                    </button>
                    <button
                      type="button"
                      disabled={disabled || !scene.fog?.length}
                      onClick={() => table.updateScene(scene, { fog: [] })}
                    >
                      Revelar tudo
                    </button>
                  </div>
                </>
              )}
              {active && (
                <button
                  className="vt-text-button"
                  type="button"
                  disabled={disabled}
                  onClick={table.hideScene}
                >
                  Encerrar exibição
                </button>
              )}
            </div>
          )}
          {!manager && (
            <div className="vt-card">
              <h3>Seu personagem</h3>
              <p>{character?.name || "Agente"}</p>
              <button
                className="vt-primary"
                type="button"
                disabled={
                  !scene ||
                  disabled ||
                  !scene.allow_player_moves ||
                  tokens.some((t) => t.character_id === character?.id)
                }
                onClick={addMyCharacter}
              >
                Colocar meu personagem
              </button>
              {scene && !scene.allow_player_moves && (
                <p className="vt-muted">O mestre pausou a movimentação.</p>
              )}
            </div>
          )}
          <div className="vt-card">
            <h3>
              Na cena{" "}
              <span className="vt-count">
                {
                  tokens.filter(
                    (t) =>
                      (manager && !preview) || tokenIsVisible(t, scene, tokens),
                  ).length
                }
              </span>
            </h3>
            <div className="vt-token-list">
              {tokens
                .filter(
                  (t) =>
                    (manager && !preview) || tokenIsVisible(t, scene, tokens),
                )
                .map((t) => (
                  <button
                    key={t.id}
                    className={selectedId === t.id ? "is-selected" : ""}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                  >
                    <span
                      className="vt-avatar"
                      style={{ borderColor: t.color }}
                    >
                      {table.images[t.image_path] || t.image_url ? (
                        <img
                          alt=""
                          src={table.images[t.image_path] || t.image_url}
                        />
                      ) : (
                        t.name[0]
                      )}
                    </span>
                    <span>
                      {t.name}
                      <small>
                        {t.visible ? "" : "Oculto · "}
                        {t.kind === "player"
                          ? "Personagem"
                          : t.kind === "enemy"
                            ? "Ameaça"
                            : "NPC"}
                      </small>
                    </span>
                  </button>
                ))}
              {!tokens.length && (
                <p className="vt-muted">Nenhum token nesta cena.</p>
              )}
            </div>
          </div>
          {selected && manager && !preview && (
            <div className="vt-card">
              <h3>{selected.name}</h3>
              <label>
                Tipo do token
                <select
                  value={selected.kind}
                  disabled={disabled}
                  onChange={(e) =>
                    table.updateToken(selected, { kind: e.target.value })
                  }
                >
                  <option value="player">Personagem</option>
                  <option value="npc">NPC</option>
                  <option value="enemy">Ameaça</option>
                </select>
              </label>
              <label className="vt-check">
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selected.visible}
                  onChange={(e) =>
                    table.updateToken(selected, { visible: e.target.checked })
                  }
                />
                Visível para jogadores
              </label>
              <label>
                Arte
                <select
                  aria-label="Arte do token selecionado"
                  value={selected.image_path || ""}
                  disabled={disabled}
                  onChange={(e) =>
                    table.updateToken(selected, {
                      image_path: e.target.value || null,
                      image_url: null,
                    })
                  }
                >
                  <option value="">Marcador com inicial</option>
                  {art.map((a) => (
                    <option key={a.id} value={a.path}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Controlado por
                <select
                  disabled={disabled}
                  value={selected.owner_id || ""}
                  onChange={(e) =>
                    table.updateToken(selected, {
                      owner_id: e.target.value || null,
                    })
                  }
                >
                  <option value="">Apenas mestre</option>
                  {roster.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome_personagem || "Participante"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tamanho
                <select
                  disabled={disabled}
                  value={selected.size}
                  onChange={(e) => {
                    const size = Number(e.target.value);
                    table.updateToken(selected, {
                      size,
                      ...snapPosition(selected.x, selected.y, scene, size),
                    });
                  }}
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} × {n} quadrado(s)
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="vt-danger"
                disabled={disabled}
                onClick={() => table.updateToken(selected, { deleted: true })}
              >
                Retirar da cena
              </button>
            </div>
          )}
        </aside>
      </div>
      {manager && (
        <div className="vt-preparation" hidden={preview}>
          <details className="vt-card">
            <summary>+ Novo cenário</summary>
            <form onSubmit={createScene} className="vt-form">
              <label>
                Nome da cena
                <input
                  required
                  maxLength={120}
                  value={sceneDraft.name}
                  onChange={(e) =>
                    setSceneDraft((d) => ({ ...d, name: e.target.value }))
                  }
                  placeholder="Ex.: Cozinha Comunitária"
                />
              </label>
              <label>
                Mapa da biblioteca
                <select
                  value={sceneDraft.map_path}
                  onChange={(e) =>
                    setSceneDraft((d) => ({ ...d, map_path: e.target.value }))
                  }
                >
                  <option value="">Sem mapa / usar URL</option>
                  {maps.map((a) => (
                    <option key={a.id} value={a.path}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Enviar mapa
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={disabled}
                  onChange={(e) => sendImage(e, "map")}
                />
              </label>
              <label>
                Ou endereço HTTPS da imagem
                <input
                  type="url"
                  value={sceneDraft.map_url}
                  disabled={Boolean(sceneDraft.map_path)}
                  onChange={(e) =>
                    setSceneDraft((d) => ({ ...d, map_url: e.target.value }))
                  }
                  placeholder="https://…"
                />
              </label>
              <div className="vt-button-row">
                <label>
                  Colunas
                  <input
                    required
                    type="number"
                    min={6}
                    max={80}
                    value={sceneDraft.columns}
                    onChange={(e) =>
                      setSceneDraft((d) => ({ ...d, columns: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Linhas
                  <input
                    required
                    type="number"
                    min={6}
                    max={80}
                    value={sceneDraft.rows}
                    onChange={(e) =>
                      setSceneDraft((d) => ({ ...d, rows: e.target.value }))
                    }
                  />
                </label>
              </div>
              <button className="vt-primary" disabled={disabled}>
                Criar cena em preparação
              </button>
            </form>
          </details>
          <details className="vt-card">
            <summary>+ Token de personagem, NPC ou ameaça</summary>
            <form onSubmit={addToken} className="vt-form">
              <label>
                Nome
                <input
                  required
                  maxLength={120}
                  value={tokenDraft.name}
                  onChange={(e) =>
                    setTokenDraft((d) => ({ ...d, name: e.target.value }))
                  }
                />
              </label>
              <label>
                Tipo
                <select
                  value={tokenDraft.kind}
                  onChange={(e) =>
                    setTokenDraft((d) => ({ ...d, kind: e.target.value }))
                  }
                >
                  <option value="enemy">Ameaça</option>
                  <option value="npc">NPC</option>
                  <option value="player">Personagem</option>
                </select>
              </label>
              <label>
                Arte da biblioteca
                <select
                  value={tokenDraft.image_path}
                  onChange={(e) => {
                    const asset = art.find((a) => a.path === e.target.value);
                    setTokenDraft((d) => ({
                      ...d,
                      image_path: e.target.value,
                      name: d.name || asset?.name || "",
                    }));
                  }}
                >
                  <option value="">Marcador com inicial</option>
                  {art.map((a) => (
                    <option key={a.id} value={a.path}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Enviar arte
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={disabled}
                  onChange={(e) => sendImage(e, "token")}
                />
              </label>
              <div className="vt-button-row">
                <label>
                  Tamanho
                  <select
                    value={tokenDraft.size}
                    onChange={(e) =>
                      setTokenDraft((d) => ({ ...d, size: e.target.value }))
                    }
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n} × {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Cor
                  <input
                    type="color"
                    value={tokenDraft.color}
                    onChange={(e) =>
                      setTokenDraft((d) => ({ ...d, color: e.target.value }))
                    }
                  />
                </label>
              </div>
              <label className="vt-check">
                <input
                  type="checkbox"
                  checked={tokenDraft.visible}
                  onChange={(e) =>
                    setTokenDraft((d) => ({ ...d, visible: e.target.checked }))
                  }
                />
                Já revelar aos jogadores
              </label>
              <button className="vt-primary" disabled={!scene || disabled}>
                Adicionar à cena
              </button>
            </form>
          </details>
          <details className="vt-card">
            <summary>
              Biblioteca da campanha{" "}
              <span className="vt-count">{table.assets.length}</span>
            </summary>
            <p className="vt-muted">
              A.S.A. Tower 2077: artes revisadas e cenários preparados para
              explorar.
            </p>
            <button
              type="button"
              className="vt-primary"
              disabled={disabled}
              onClick={async () => {
                setNotice("");
                const result = await table.installCampaignPack?.();
                if (result)
                  setNotice(
                    `${result.scenes} cenário(s) e ${result.assets} arte(s) adicionados; ${result.tokens} token(s) atualizado(s). Escolha uma cena em Direção da cena.`,
                  );
              }}
            >
              Adicionar mapas e tokens v6
            </button>
            {notice && (
              <p className="vt-muted" role="status">
                {notice}
              </p>
            )}
            <p className="vt-muted">
              Importe a pasta ASA_Tower_2077 descompactada para trazer os mapas
              e as artes, incluindo os novos Portadores.
            </p>
            <label className="vt-upload-label">
              Importar pasta da campanha
              <input
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                disabled={disabled}
                onChange={importFolder}
              />
            </label>
            {importProgress && (
              <div role="status">
                <p>
                  Importando {importProgress.done} de {importProgress.total}{" "}
                  imagens…
                </p>
                <progress
                  max={importProgress.total}
                  value={importProgress.done}
                />
                <button
                  type="button"
                  onClick={() => {
                    importCancel.current = true;
                  }}
                >
                  Parar após esta imagem
                </button>
              </div>
            )}
            <div className="vt-library">
              {table.assets.map((a) => (
                <TabletopAssetThumbnail
                  key={a.id}
                  asset={a}
                  url={table.images[a.path]}
                  ensureImages={table.ensureImages}
                />
              ))}
            </div>
          </details>
        </div>
      )}
    </section>
  );
}
