import React, { useId, useRef, useState } from "react";
import {
  canMoveToken,
  fogRectangle,
  snapPosition,
  tokenInFog,
} from "../domain/tabletop";

export default function TabletopBoard({
  scene,
  tokens,
  images = {},
  userId,
  manager = false,
  preview = false,
  tool = "move",
  busy = false,
  selectedId,
  onSelect = () => {},
  onMove,
  onFog,
}) {
  const svg = useRef(null),
    gesture = useRef(null);
  const [draft, setDraft] = useState(null),
    [ruler, setRuler] = useState(null);
  const gridId = useId().replaceAll(":", "");
  if (!scene)
    return (
      <div className="vt-empty">
        <span className="vt-empty-icon">◇</span>
        <h3>{manager ? "Prepare o próximo cenário" : "Aguardando o mestre"}</h3>
        <p>
          {manager
            ? "Escolha uma cena ou crie um cenário para começar."
            : "Quando o mestre liberar uma cena, o mapa aparecerá aqui."}
        </p>
      </div>
    );
  const shown = tokens.filter(
    (t) =>
      !t.deleted &&
      ((manager && !preview) || (t.visible && !tokenInFog(t, scene.fog))),
  );
  function point(event) {
    const rect = svg.current.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * scene.columns,
      y: ((event.clientY - rect.top) / rect.height) * scene.rows,
    };
  }
  function capture(event, type, token) {
    if (busy) return;
    const start = point(event);
    gesture.current = {
      type,
      token,
      start,
      offset: token ? { x: start.x - token.x, y: start.y - token.y } : null,
    };
    svg.current.setPointerCapture?.(event.pointerId);
    if (type === "fog") setDraft({ fog: fogRectangle(start, start, scene) });
    if (type === "ruler") setRuler({ start, end: start });
  }
  function motion(event) {
    const g = gesture.current;
    if (!g) return;
    const end = point(event);
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
    if (g.type === "fog") setDraft({ fog: fogRectangle(g.start, end, scene) });
    if (g.type === "ruler") setRuler({ start: g.start, end });
  }
  async function finish(event) {
    const g = gesture.current;
    if (!g) return;
    gesture.current = null;
    svg.current.releasePointerCapture?.(event.pointerId);
    const end = point(event);
    try {
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
    } finally {
      setDraft(null);
    }
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
      viewBox={`0 0 ${scene.columns} ${scene.rows}`}
      role="application"
      aria-label={`Mapa: ${scene.name}. Selecione um token e use as setas para movê-lo.`}
      style={{ aspectRatio: `${scene.columns}/${scene.rows}` }}
      onPointerDown={(e) => {
        if (tool === "fog" && manager && !preview) capture(e, "fog");
        else if (tool === "ruler") capture(e, "ruler");
        else onSelect(null);
      }}
      onPointerMove={motion}
      onPointerUp={finish}
      onPointerCancel={() => {
        gesture.current = null;
        setDraft(null);
      }}
    >
      <defs>
        <pattern id={gridId} width="1" height="1" patternUnits="userSpaceOnUse">
          <path
            d="M1 0H0V1"
            fill="none"
            stroke="#c5cced"
            strokeWidth=".018"
            opacity=".34"
          />
        </pattern>
      </defs>
      <rect width={scene.columns} height={scene.rows} fill="#111a2d" />
      {(images[scene.map_path] || scene.map_url) && (
        <image
          href={images[scene.map_path] || scene.map_url}
          width={scene.columns}
          height={scene.rows}
          preserveAspectRatio="none"
        />
      )}
      {scene.grid_visible && (
        <rect
          width={scene.columns}
          height={scene.rows}
          fill={`url(#${gridId})`}
          pointerEvents="none"
        />
      )}
      {shown.map((token) => {
        const p = draft?.id === token.id ? draft : token,
          movable = canMoveToken(token, scene, userId, manager, preview),
          image = images[token.image_path] || token.image_url;
        return (
          <g
            key={token.id}
            transform={`translate(${p.x} ${p.y})`}
            tabIndex={0}
            role="button"
            aria-label={`${token.name}${token.visible ? "" : " (oculto)"}${movable ? ", movível" : ""}`}
            className={`vt-token ${selectedId === token.id ? "selected" : ""}`}
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
            <circle
              cx={token.size / 2}
              cy={token.size / 2}
              r={token.size * 0.47}
              fill="#111520"
              stroke={selectedId === token.id ? "#ffffff" : token.color}
              strokeWidth={selectedId === token.id ? 0.07 : 0.045}
              strokeDasharray={token.visible ? undefined : ".12 .08"}
            />
            {image ? (
              <image
                href={image}
                x={0.06}
                y={0.02}
                width={token.size - 0.12}
                height={token.size - 0.08}
                preserveAspectRatio="xMidYMid meet"
                pointerEvents="none"
              />
            ) : (
              <text
                x={token.size / 2}
                y={token.size * 0.65}
                textAnchor="middle"
                fill={token.color}
                fontSize={token.size * 0.48}
                fontWeight="bold"
                pointerEvents="none"
              >
                {token.name.trim().slice(0, 1).toUpperCase()}
              </text>
            )}
            <text
              x={token.size / 2}
              y={token.size + 0.25}
              textAnchor="middle"
              fill="#fff"
              stroke="#080a14"
              strokeWidth=".055"
              paintOrder="stroke"
              fontSize=".25"
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
          {...{ x: f.x, y: f.y, width: f.w, height: f.h }}
          fill="#080a14"
          opacity={manager && !preview ? 0.65 : 1}
          stroke={manager && !preview ? "#a58ad4" : undefined}
          strokeWidth=".035"
          pointerEvents="none"
        />
      ))}
      {draft?.fog && (
        <rect
          x={draft.fog.x}
          y={draft.fog.y}
          width={draft.fog.w}
          height={draft.fog.h}
          fill="#bc88ff"
          fillOpacity=".35"
          stroke="#e2c9ff"
          strokeWidth=".06"
          pointerEvents="none"
        />
      )}
      {ruler && (
        <g pointerEvents="none">
          <line
            x1={ruler.start.x}
            y1={ruler.start.y}
            x2={ruler.end.x}
            y2={ruler.end.y}
            stroke="#ffe08c"
            strokeWidth=".07"
          />
          <text
            x={ruler.end.x}
            y={Math.max(0.4, ruler.end.y - 0.3)}
            fill="#fff3c1"
            stroke="#080a14"
            strokeWidth=".04"
            paintOrder="stroke"
            fontSize=".4"
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
