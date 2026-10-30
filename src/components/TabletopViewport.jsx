import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

export const clampZoom = (value) =>
  Math.max(50, Math.min(400, Math.round(value)));

export default function TabletopViewport({
  stageRef,
  scene,
  zoom,
  onZoom,
  pan,
  onPan,
  tool,
  preview,
  onBackgroundClick,
  children,
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [dragging, setDragging] = useState(false);
  const gesture = useRef(null),
    latest = useRef(null);
  latest.current = { zoom, onZoom, pan, onPan, scene };
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const measure = () => {
      const { width, height } = stage.getBoundingClientRect();
      setSize({ width, height });
    };
    measure();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    observer?.observe(stage);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [stageRef]);
  useEffect(() => {
    const stage = stageRef.current;
    const wheel = (event) => {
      const current = latest.current;
      if (
        !current.scene ||
        !Number.isFinite(event.deltaY) ||
        event.deltaY === 0
      )
        return;
      event.preventDefault();
      const delta =
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? stage.clientHeight
            : 1);
      const next = clampZoom(current.zoom * Math.exp(-delta * 0.0015));
      const rect = stage.getBoundingClientRect(),
        ratio = next / current.zoom;
      // Preserve the world point under the cursor, including an existing pan.
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      const nextPan = {
        x: x - (x - current.pan.x) * ratio,
        y: y - (y - current.pan.y) * ratio,
      };
      latest.current = { ...current, zoom: next, pan: nextPan };
      current.onZoom(next);
      current.onPan(nextPan);
    };
    stage.addEventListener("wheel", wheel, { passive: false });
    return () => stage.removeEventListener("wheel", wheel);
  }, [stageRef]);
  useEffect(() => {
    gesture.current = null;
    setDragging(false);
  }, [scene?.id, tool, preview]);
  function cancel(event) {
    if (gesture.current?.id !== event.pointerId) return;
    gesture.current = null;
    setDragging(false);
  }
  const fit =
    scene && size.width && size.height
      ? Math.min(size.width, (size.height * scene.columns) / scene.rows)
      : null;
  return (
    <div
      className={`vt-stage ${dragging ? "vt-panning" : ""}`}
      ref={stageRef}
      onPointerDownCapture={(event) => {
        if (!scene || gesture.current || event.isPrimary === false) return;
        const token = event.target.closest?.(".vt-token");
        if (
          event.button !== 1 &&
          (event.button !== 0 || tool !== "move" || token)
        )
          return;
        event.preventDefault();
        event.stopPropagation();
        gesture.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          pan,
          button: event.button,
        };
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setDragging(true);
      }}
      onPointerMove={(event) => {
        const g = gesture.current;
        if (!g || g.id !== event.pointerId) return;
        event.preventDefault();
        onPan({
          x: g.pan.x + event.clientX - g.x,
          y: g.pan.y + event.clientY - g.y,
        });
      }}
      onPointerUp={(event) => {
        const g = gesture.current;
        if (g?.id !== event.pointerId) return;
        cancel(event);
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        if (
          g.button === 0 &&
          Math.abs(event.clientX - g.x) < 3 &&
          Math.abs(event.clientY - g.y) < 3
        )
          onBackgroundClick?.();
      }}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
      onAuxClick={(event) => {
        if (event.button === 1) event.preventDefault();
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      {scene ? (
        <div
          className="vt-map-size"
          style={{
            width: fit ? `${(fit * zoom) / 100}px` : `${zoom}%`,
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
          }}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
