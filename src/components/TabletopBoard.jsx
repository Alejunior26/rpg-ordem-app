import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  canMoveToken,
  darkRooms,
  fogRectangle,
  snapPosition,
  tokenIsVisible,
} from "../domain/tabletop";

// Keep SVG text in normal pixel-sized units. Fractional font sizes in a
// one-unit-per-cell viewBox can be enlarged by the browser's minimum font size.
const CELL = 64;

function BoardContent({
  scene,
  tokens,
  images = {},
  userId,
  manager = false,
  preview = false,
  tool = "move",
  busy = false,
  selectedId,
  activeTokenId,
  tokenArtScale = 2.5,
  onSelect = () => {},
  onMove,
  onFog,
  onRoom,
  onSpawn,
}) {
  const svg = useRef(null),
    gesture = useRef(null);
  const [draft, setDraft] = useState(null),
    [ruler, setRuler] = useState(null);
  const gridId = useId().replaceAll(":", "");
  useEffect(() => {
    gesture.current = null;
    setDraft(null);
    setRuler(null);
  }, [scene?.id, tool, preview]);
  if (!scene)
    return (
      <div className="vt-empty">
        <span className="vt-empty-icon">◇</span>
        <h3>
          {manager && !preview
            ? "Prepare o próximo cenário"
            : "Aguardando o mestre"}
        </h3>
        <p>
          {manager && !preview
            ? "Escolha uma cena ou crie um cenário para começar."
            : "Quando o mestre liberar uma cena, o mapa aparecerá aqui."}
        </p>
      </div>
    );
  const position = (token) => draft?.id === token.id ? draft : token;
  const shown = tokens.filter(
    (t) =>
      !t.deleted && ((manager && !preview) || tokenIsVisible(t, scene, tokens)),
  ).sort((a, b) => position(a).y + a.size / 2 - position(b).y - b.size / 2);
  function point(event) {
    const rect = svg.current.getBoundingClientRect();
    if (
      !rect.width ||
      !rect.height ||
      !Number.isFinite(event.clientX) ||
      !Number.isFinite(event.clientY)
    )
      return null;
    return {
      x: ((event.clientX - rect.left) / rect.width) * scene.columns,
      y: ((event.clientY - rect.top) / rect.height) * scene.rows,
    };
  }
  function capture(event, type, token) {
    if (
      busy ||
      gesture.current ||
      event.button !== 0 ||
      event.isPrimary === false
    )
      return;
    const start = point(event);
    if (!start) return;
    // This is a pointer gesture, so suppress native image/text dragging and
    // automatic SVG focus scrolling while the token is under the pointer.
    event.preventDefault();
    gesture.current = {
      pointerId: event.pointerId,
      type,
      token,
      start,
      offset: token ? { x: start.x - token.x, y: start.y - token.y } : null,
    };
    svg.current.setPointerCapture?.(event.pointerId);
    if (type === "fog" || type === "room")
      setDraft({ fog: fogRectangle(start, start, scene) });
    if (type === "ruler") setRuler({ start, end: start });
  }
  function motion(event) {
    const g = gesture.current;
    if (!g || g.pointerId !== event.pointerId) return;
    const end = point(event);
    if (!end) return;
    if (g.type === "token")
      setDraft({
        id: g.token.id,
        ...snapPosition(
          end.x - g.offset.x + 0.5,
          end.y - g.offset.y + 0.5,
          scene,
          g.token.size,
        ),
      });
    if (g.type === "fog" || g.type === "room")
      setDraft({ fog: fogRectangle(g.start, end, scene) });
    if (g.type === "ruler") setRuler({ start: g.start, end });
  }
  async function finish(event) {
    const g = gesture.current;
    if (!g || g.pointerId !== event.pointerId) return;
    gesture.current = null;
    svg.current.releasePointerCapture?.(event.pointerId);
    const end = point(event);
    try {
      if (!end) return;
      if (g.type === "token") {
        const next = snapPosition(
          end.x - g.offset.x + 0.5,
          end.y - g.offset.y + 0.5,
          scene,
          g.token.size,
        );
        if (next.x !== g.token.x || next.y !== g.token.y)
          await onMove?.(g.token, next);
      }
      if (g.type === "fog") await onFog?.(fogRectangle(g.start, end, scene));
      if (g.type === "room") await onRoom?.(fogRectangle(g.start, end, scene));
    } finally {
      setDraft(null);
    }
  }
  function cancel(event) {
    if (gesture.current?.pointerId !== event.pointerId) return;
    gesture.current = null;
    setDraft(null);
  }
  function keyMove(event, token) {
    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(token.id);
      return;
    }
    if (
      !direction ||
      busy ||
      tool !== "move" ||
      !canMoveToken(token, scene, userId, manager, preview)
    )
      return;
    event.preventDefault();
    onSelect(token.id);
    void onMove?.(
      token,
      snapPosition(
        token.x + direction[0],
        token.y + direction[1],
        scene,
        token.size,
      ),
    );
  }
  return (
    <svg
      ref={svg}
      className={`vt-board vt-tool-${tool}`}
      viewBox={`0 0 ${scene.columns * CELL} ${scene.rows * CELL}`}
      role="application"
      aria-label={`Mapa: ${scene.name}. Selecione um token e use as setas para movê-lo.`}
      style={{ aspectRatio: `${scene.columns}/${scene.rows}` }}
      onPointerDown={(e) => {
        if (
          tool === "spawn" &&
          manager &&
          !preview &&
          !busy &&
          e.button === 0
        ) {
          const pos = point(e);
          if (pos) {
            e.preventDefault();
            void onSpawn?.(snapPosition(pos.x, pos.y, scene));
          }
        } else if (tool === "fog" && manager && !preview) capture(e, "fog");
        else if (tool === "room" && manager && !preview) capture(e, "room");
        else if (tool === "ruler") capture(e, "ruler");
        else onSelect(null);
      }}
      onPointerMove={motion}
      onPointerUp={finish}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
      onDragStart={(event) => event.preventDefault()}
    >
      <defs>
        <pattern
          id={gridId}
          width={CELL}
          height={CELL}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M${CELL} 0H0V${CELL}`}
            fill="none"
            stroke="#c5cced"
            strokeWidth={CELL * 0.018}
            opacity=".34"
          />
        </pattern>
      </defs>
      <rect
        width={scene.columns * CELL}
        height={scene.rows * CELL}
        fill="#111a2d"
      />
      {(images[scene.map_path] || scene.map_url) && (
        <image
          href={images[scene.map_path] || scene.map_url}
          width={scene.columns * CELL}
          height={scene.rows * CELL}
          preserveAspectRatio="none"
        />
      )}
      {scene.grid_visible && (
        <rect
          width={scene.columns * CELL}
          height={scene.rows * CELL}
          fill={`url(#${gridId})`}
          pointerEvents="none"
        />
      )}
      {darkRooms(scene, tokens).map((area, index) => (
        <rect
          key={`dark-${index}`}
          className="vt-room-cover"
          x={area.x * CELL}
          y={area.y * CELL}
          width={area.w * CELL}
          height={area.h * CELL}
          fill="#070914"
          opacity={manager && !preview ? 0.65 : 1}
          pointerEvents="none"
        />
      ))}
      {manager &&
        !preview &&
        (scene.vision_areas || []).map((area, index) => (
          <g key={`room-${index}`} pointerEvents="none">
            <rect
              x={area.x * CELL}
              y={area.y * CELL}
              width={area.w * CELL}
              height={area.h * CELL}
              fill="none"
              stroke="#8fe4dc"
              strokeWidth={2}
              strokeDasharray="8 6"
            />
            <text
              x={area.x * CELL + 8}
              y={area.y * CELL + 23}
              fontSize={16}
              fill="#c9fff7"
              stroke="#080a14"
              strokeWidth={3}
              paintOrder="stroke"
            >
              Sala {index + 1}
            </text>
          </g>
        ))}
      {manager && !preview && (
        <g
          pointerEvents="none"
          className="vt-entry"
          transform={`translate(${((scene.spawn_x || 0) + 0.5) * CELL} ${((scene.spawn_y || 0) + 0.5) * CELL})`}
        >
          <circle r="17" fill="#0c2929" stroke="#8fe4dc" strokeWidth="2" />
          <path
            d="M-8 0H8M2-6L8 0 2 6"
            fill="none"
            stroke="#baffef"
            strokeWidth="3"
          />
        </g>
      )}
      {shown.map((token) => {
        const p = draft?.id === token.id ? draft : token,
          movable = canMoveToken(token, scene, userId, manager, preview),
          image = images[token.image_path] || token.image_url;
        const foot = token.size * CELL / 2;
        const artHeight = token.size * CELL * Math.max(1, Math.min(4, Number(tokenArtScale) || 2.5));
        const artWidth = artHeight * 0.72;
        const Base = image ? "ellipse" : "circle";
        const baseShape = image
          ? { rx: token.size * CELL * 0.47, ry: token.size * CELL * 0.18 }
          : { r: token.size * CELL * 0.47 };
        return (
          <g
            key={token.id}
            transform={`translate(${p.x * CELL} ${p.y * CELL})`}
            tabIndex={0}
            role="button"
            aria-label={`${token.name}${token.visible ? "" : " (oculto)"}${movable ? ", movível" : ""}`}
            className={`vt-token ${image ? "vt-token-art" : ""} ${selectedId === token.id ? "selected" : ""}`}
            style={{
              cursor: movable ? "grab" : "pointer",
              opacity: token.visible ? 1 : 0.5,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(token.id);
            }}
            onPointerDown={(e) => {
              if (tool !== "move") return;
              e.stopPropagation();
              onSelect(token.id);
              if (movable) capture(e, "token", token);
            }}
            onKeyDown={(e) => keyMove(e, token)}
          >
            <title>{token.name}</title>
            {activeTokenId === token.id && <Base className="vt-turn-ring" aria-label="Turno atual" cx={foot} cy={foot} {...(image ? { rx: token.size * CELL * 0.55, ry: token.size * CELL * 0.25 } : { r: token.size * CELL * 0.55 })} fill="none" stroke="#8fe4dc" strokeWidth="3" strokeDasharray="6 5" pointerEvents="none" />}
            <Base
              className="vt-token-base"
              cx={(token.size * CELL) / 2}
              cy={(token.size * CELL) / 2}
              {...baseShape}
              fill="#111520"
              fillOpacity={image ? 0.25 : 1}
              stroke={selectedId === token.id ? "#ffffff" : token.color}
              strokeWidth={CELL * (selectedId === token.id ? 0.07 : 0.045)}
              strokeDasharray={
                token.visible ? undefined : `${CELL * 0.12} ${CELL * 0.08}`
              }
            />
            {image ? (
              <image
                className="vt-token-image"
                href={image}
                x={foot - artWidth / 2}
                y={foot - artHeight}
                width={artWidth}
                height={artHeight}
                preserveAspectRatio="xMidYMax meet"
                pointerEvents="visiblePainted"
              />
            ) : (
              <text
                x={(token.size * CELL) / 2}
                y={token.size * CELL * 0.65}
                textAnchor="middle"
                fill={token.color}
                fontSize={token.size * CELL * 0.48}
                fontWeight="bold"
                pointerEvents="none"
              >
                {token.name.trim().slice(0, 1).toUpperCase()}
              </text>
            )}
            <text
              className="vt-token-label"
              x={(token.size * CELL) / 2}
              y={CELL * (token.size + 0.25)}
              textAnchor="middle"
              fill="#fff"
              stroke="#080a14"
              strokeWidth={CELL * 0.055}
              paintOrder="stroke"
              fontSize={CELL * 0.25}
              pointerEvents="none"
            >
              {token.name.slice(0, 24)}
            </text>
          </g>
        );
      })}
      {(scene.fog || []).map((f, i) => (
        <rect
          key={i}
          x={f.x * CELL}
          y={f.y * CELL}
          width={f.w * CELL}
          height={f.h * CELL}
          fill="#080a14"
          opacity={manager && !preview ? 0.65 : 1}
          stroke={manager && !preview ? "#a58ad4" : undefined}
          strokeWidth={CELL * 0.035}
          pointerEvents="none"
        />
      ))}
      {draft?.fog && (
        <rect
          x={draft.fog.x * CELL}
          y={draft.fog.y * CELL}
          width={draft.fog.w * CELL}
          height={draft.fog.h * CELL}
          fill="#bc88ff"
          fillOpacity=".35"
          stroke="#e2c9ff"
          strokeWidth={CELL * 0.06}
          pointerEvents="none"
        />
      )}
      {ruler && (
        <g pointerEvents="none">
          <line
            x1={ruler.start.x * CELL}
            y1={ruler.start.y * CELL}
            x2={ruler.end.x * CELL}
            y2={ruler.end.y * CELL}
            stroke="#ffe08c"
            strokeWidth={CELL * 0.07}
          />
          <text
            x={ruler.end.x * CELL}
            y={Math.max(0.4, ruler.end.y - 0.3) * CELL}
            fill="#fff3c1"
            stroke="#080a14"
            strokeWidth={CELL * 0.04}
            paintOrder="stroke"
            fontSize={CELL * 0.4}
          >
            {(
              Math.hypot(
                ruler.end.x - ruler.start.x,
                ruler.end.y - ruler.start.y,
              ) * 1.5
            ).toFixed(1)}{" "}
            m
          </text>
        </g>
      )}
    </svg>
  );
}

const MemoBoard = React.memo(BoardContent);
export default function TabletopBoard(props) {
  const latest = useRef(props);
  latest.current = props;
  const handlers = useMemo(() => Object.fromEntries(
    ['onSelect', 'onMove', 'onFog', 'onRoom', 'onSpawn'].map((name) =>
      [name, (...args) => latest.current[name]?.(...args)]),
  ), []);
  return <MemoBoard {...props} {...handlers} />;
}
