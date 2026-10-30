import React, { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import TabletopViewport from "./TabletopViewport";
afterEach(cleanup);
const scene = { id: "scene", columns: 24, rows: 18 };
function Harness({ tool = "move", background = vi.fn(), token = vi.fn() }) {
  const stageRef = useRef(null),
    [zoom, setZoom] = useState(100),
    [pan, setPan] = useState({ x: 40, y: -20 });
  return (
    <>
      <output data-testid="view">{JSON.stringify({ zoom, pan })}</output>
      <TabletopViewport
        {...{ stageRef, scene, zoom, pan, tool }}
        onZoom={setZoom}
        onPan={setPan}
      >
        <svg role="application" onPointerDown={background}>
          <g
            role="button"
            aria-label="Agente"
            className="vt-token"
            onPointerDown={token}
          >
            <circle r="10" />
          </g>
        </svg>
      </TabletopViewport>
    </>
  );
}
function setup(props) {
  const result = render(<Harness {...props} />),
    stage = result.container.querySelector(".vt-stage");
  stage.getBoundingClientRect = () => ({
    left: 100,
    top: 50,
    width: 800,
    height: 600,
  });
  stage.setPointerCapture = vi.fn();
  stage.releasePointerCapture = vi.fn();
  return {
    ...result,
    stage,
    view: () => JSON.parse(screen.getByTestId("view").textContent),
  };
}
function pointer(target, type, x, y, button = 0) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    button,
  });
  Object.defineProperty(event, "pointerId", { value: 1 });
  fireEvent(target, event);
}
describe("map navigation", () => {
  it("zooms around the cursor and prevents wheel scrolling the page", () => {
    const { stage, view } = setup();
    const event = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      deltaY: -100,
      clientX: 400,
      clientY: 200,
    });
    fireEvent(stage, event);
    expect(event.defaultPrevented).toBe(true);
    expect(view().zoom).toBe(116);
    expect(view().pan.x).toBeCloseTo(62.4);
    expect(view().pan.y).toBeCloseTo(0.8);
    fireEvent.wheel(stage, { deltaY: -100000, clientX: 500, clientY: 350 });
    expect(view().zoom).toBe(400);
    fireEvent.wheel(stage, { deltaY: 100000, clientX: 500, clientY: 350 });
    expect(view().zoom).toBe(50);
  });
  it("pans the background even at fit zoom without moving a token or painting fog", () => {
    const background = vi.fn(),
      token = vi.fn(),
      { stage, view } = setup({ background, token });
    pointer(screen.getByRole("application"), "pointerdown", 400, 200);
    pointer(stage, "pointermove", 530, 270);
    pointer(stage, "pointerup", 530, 270);
    expect(view().pan).toEqual({ x: 170, y: 50 });
    expect(background).not.toHaveBeenCalled();
    expect(token).not.toHaveBeenCalled();
  });
  it("keeps primary token drag and drawing tools separate, and allows middle-button pan", () => {
    const background = vi.fn(),
      token = vi.fn(),
      { stage, view, rerender } = setup({ background, token });
    pointer(screen.getByRole("button"), "pointerdown", 400, 200);
    expect(token).toHaveBeenCalledOnce();
    expect(view().pan).toEqual({ x: 40, y: -20 });
    rerender(<Harness tool="fog" background={background} token={token} />);
    background.mockClear();
    pointer(screen.getByRole("application"), "pointerdown", 400, 200);
    expect(background).toHaveBeenCalledOnce();
    pointer(screen.getByRole("button"), "pointerdown", 400, 200, 1);
    pointer(stage, "pointermove", 420, 230, 1);
    pointer(stage, "pointerup", 420, 230, 1);
    expect(view().pan).toEqual({ x: 60, y: 10 });
  });
});
