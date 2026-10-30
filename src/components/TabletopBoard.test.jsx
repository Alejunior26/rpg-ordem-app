import React from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import TabletopBoard from "./TabletopBoard";
import {
  campaignFolderImages,
  fogRectangle,
  snapPosition,
  characterSpawn,
} from "../domain/tabletop";
afterEach(cleanup);
const scene = {
  id: "s",
  name: "Cozinha",
  columns: 24,
  rows: 18,
  fog: [],
  grid_visible: true,
  allow_player_moves: true,
};
const token = {
  id: "p",
  scene_id: "s",
  name: "Agente",
  x: 2,
  y: 2,
  size: 1,
  owner_id: "a",
  visible: true,
  color: "#aa00ff",
};
function pointer(target, type, x, y, pointerId = 1) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    button: 0,
  });
  Object.defineProperty(event, "pointerId", { value: pointerId });
  fireEvent(target, event);
  return event;
}
function mapBounds(board, scale = 1) {
  board.getBoundingClientRect = () => ({
    left: 100,
    top: 50,
    width: 1200 * scale,
    height: 900 * scale,
  });
  board.setPointerCapture = vi.fn();
  board.releasePointerCapture = vi.fn();
}
describe("shared map interaction", () => {
  it("anchors full-height artwork at the feet while visual scale leaves the occupied cell unchanged", () => {
    const props = { scene, tokens: [{ ...token, image_url: "https://example.com/agent.png" }] };
    const { rerender } = render(<TabletopBoard {...props} />);
    const piece = screen.getByRole("button"), art = piece.querySelector("image"), base = piece.querySelector(".vt-token-base");
    const feet = () => Number(art.getAttribute("y")) + Number(art.getAttribute("height"));
    expect(Number(art.getAttribute("height"))).toBeGreaterThan(64 * 2);
    expect(feet()).toBe(32);
    expect(Number(art.getAttribute("x")) + Number(art.getAttribute("width")) / 2).toBe(32);
    expect(art.getAttribute("preserveAspectRatio")).toBe("xMidYMax meet");
    const footprint = base.outerHTML;
    rerender(<TabletopBoard {...props} tokenArtScale={4} />);
    expect(feet()).toBe(32);
    expect(Number(art.getAttribute("height"))).toBe(256);
    expect(base.outerHTML).toBe(footprint);
    expect(piece.getAttribute("transform")).toBe("translate(128 128)");
  });
  it("drags by the body above its grid cell without making the feet jump to the cursor", () => {
    const move = vi.fn();
    render(<TabletopBoard scene={scene} userId="a" tokens={[{ ...token, image_url: "https://example.com/agent.png" }]} onMove={move} />);
    const board = screen.getByRole("application"), piece = screen.getByRole("button");
    mapBounds(board);
    pointer(piece.querySelector("image"), "pointerdown", 225, 100);
    pointer(board, "pointermove", 325, 250);
    expect(piece.getAttribute("transform")).toBe("translate(256 320)");
    pointer(board, "pointerup", 325, 250);
    expect(move).toHaveBeenCalledWith(expect.objectContaining({ id: token.id }), { x: 4, y: 5 });
  });
  it("draws the miniature with lower feet in front when artwork overlaps", () => {
    const { container } = render(<TabletopBoard scene={scene} tokens={[
      { ...token, id: "front", name: "Frente", y: 4 },
      { ...token, id: "back", name: "Fundo", y: 2 },
    ]} />);
    expect([...container.querySelectorAll(".vt-token")].map((piece) => piece.getAttribute("aria-label"))).toEqual(["Fundo", "Frente"]);
  });
  it("reveals only occupied rooms and covers them when the last character leaves, including GM preview", () => {
    const explored = {
      ...scene,
      vision_mode: "rooms",
      vision_areas: [
        { x: 0, y: 0, w: 8, h: 8 },
        { x: 10, y: 0, w: 8, h: 8 },
      ],
    };
    const people = [
      { ...token, kind: "player" },
      { ...token, id: "friend", kind: "player", owner_id: "b", x: 3 },
    ];
    const enemies = [
      {
        ...token,
        id: "e1",
        kind: "enemy",
        name: "Ameaça oeste",
        x: 4,
        y: 4,
        owner_id: null,
      },
      {
        ...token,
        id: "e2",
        kind: "enemy",
        name: "Ameaça leste",
        x: 12,
        y: 4,
        owner_id: null,
      },
    ];
    const { rerender, container } = render(
      <TabletopBoard
        scene={explored}
        tokens={[...people, ...enemies]}
        manager
        preview
      />,
    );
    expect(screen.queryByRole("button", { name: /Ameaça oeste/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Ameaça leste/ })).toBeNull();
    expect(container.querySelectorAll(".vt-room-cover")).toHaveLength(1);
    people[0] = { ...people[0], x: 11 };
    rerender(
      <TabletopBoard
        scene={explored}
        tokens={[...people, ...enemies]}
        manager
        preview
      />,
    );
    expect(container.querySelectorAll(".vt-room-cover")).toHaveLength(0);
    people[1] = { ...people[1], y: 10 };
    rerender(
      <TabletopBoard
        scene={explored}
        tokens={[...people, ...enemies]}
        manager
        preview
      />,
    );
    expect(screen.queryByRole("button", { name: /Ameaça oeste/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Ameaça leste/ })).toBeTruthy();
    rerender(
      <TabletopBoard
        scene={explored}
        tokens={[...people, ...enemies]}
        manager
      />,
    );
    expect(screen.queryByRole("button", { name: /Ameaça oeste/ })).toBeTruthy();
  });
  it("marks a room and an entry only in the GM view and keeps spawn clear of larger tokens", () => {
    const room = vi.fn(),
      entry = vi.fn();
    const { rerender } = render(
      <TabletopBoard
        scene={scene}
        tokens={[]}
        manager
        tool="room"
        onRoom={room}
      />,
    );
    const board = screen.getByRole("application");
    mapBounds(board);
    pointer(board, "pointerdown", 225, 175);
    pointer(board, "pointermove", 325, 275);
    pointer(board, "pointerup", 325, 275);
    expect(room).toHaveBeenCalledWith({ x: 2, y: 2, w: 3, h: 3 });
    rerender(
      <TabletopBoard
        scene={scene}
        tokens={[]}
        manager
        tool="spawn"
        onSpawn={entry}
      />,
    );
    pointer(board, "pointerdown", 325, 275);
    expect(entry).toHaveBeenCalledWith({ x: 4, y: 4 });
    rerender(
      <TabletopBoard
        scene={scene}
        tokens={[]}
        manager
        preview
        tool="spawn"
        onSpawn={entry}
      />,
    );
    pointer(board, "pointerdown", 425, 375);
    expect(entry).toHaveBeenCalledTimes(1);
    const spawn = characterSpawn({ ...scene, spawn_x: 2, spawn_y: 2 }, [
      { ...token, size: 2 },
    ]);
    expect(spawn).not.toEqual({ x: 2, y: 2 });
    expect(spawn.x < 2 || spawn.y < 2 || spawn.x >= 4 || spawn.y >= 4).toBe(
      true,
    );
  });
  it.each([1, 2])(
    "drags on the grid at scale %s without native image dragging",
    (scale) => {
      const move = vi.fn();
      render(
        <TabletopBoard
          scene={scene}
          userId="a"
          tokens={[{ ...token, image_url: "https://example.com/token.png" }]}
          onMove={move}
        />,
      );
      const board = screen.getByRole("application"),
        piece = screen.getByRole("button");
      mapBounds(board, scale);
      const start = pointer(
        piece,
        "pointerdown",
        100 + 125 * scale,
        50 + 125 * scale,
      );
      expect(start.defaultPrevented).toBe(true);
      pointer(board, "pointermove", 100 + 225 * scale, 50 + 275 * scale);
      expect(piece.getAttribute("transform")).toBe("translate(256 320)");
      expect(fireEvent.dragStart(piece.querySelector("image"))).toBe(false);
      pointer(board, "pointerup", 100 + 225 * scale, 50 + 275 * scale);
      expect(move).toHaveBeenCalledWith(
        expect.objectContaining({ id: token.id }),
        { x: 4, y: 5 },
      );
      expect(board.setPointerCapture).toHaveBeenCalledWith(1);
      expect(board.releasePointerCapture).toHaveBeenCalledWith(1);
      // Labels must stay above browser minimum font sizes while retaining their
      // size relative to a cell, rather than becoming giant black/white glyphs.
      const label = piece.querySelector("text");
      expect(Number(label.getAttribute("font-size"))).toBeGreaterThanOrEqual(
        16,
      );
      expect(
        Number(label.getAttribute("font-size")) /
          Number(board.querySelector("pattern").getAttribute("width")),
      ).toBe(0.25);
    },
  );
  it("cancels an interrupted drag and ignores another pointer", () => {
    const move = vi.fn();
    render(
      <TabletopBoard scene={scene} userId="a" tokens={[token]} onMove={move} />,
    );
    const board = screen.getByRole("application"),
      piece = screen.getByRole("button");
    mapBounds(board);
    pointer(piece, "pointerdown", 225, 175);
    pointer(board, "pointermove", 425, 375, 2);
    expect(piece.getAttribute("transform")).toBe("translate(128 128)");
    pointer(board, "pointermove", 325, 325);
    pointer(board, "lostpointercapture", 325, 325);
    expect(piece.getAttribute("transform")).toBe("translate(128 128)");
    pointer(board, "pointerup", 325, 325);
    expect(move).not.toHaveBeenCalled();
  });
  it("does not save invalid positions when the map is hidden during a gesture", () => {
    const move = vi.fn();
    render(
      <TabletopBoard scene={scene} userId="a" tokens={[token]} onMove={move} />,
    );
    const board = screen.getByRole("application"),
      piece = screen.getByRole("button");
    mapBounds(board);
    pointer(piece, "pointerdown", 225, 175);
    board.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    });
    pointer(board, "pointermove", 325, 325);
    pointer(board, "pointerup", 325, 325);
    expect(move).not.toHaveBeenCalled();
    expect(piece.getAttribute("transform")).not.toMatch(/NaN|Infinity/);
  });
  it("cancels a GM drag when entering player preview", () => {
    const move = vi.fn();
    const { rerender } = render(
      <TabletopBoard scene={scene} tokens={[token]} manager onMove={move} />,
    );
    const board = screen.getByRole("application"),
      piece = screen.getByRole("button");
    mapBounds(board);
    pointer(piece, "pointerdown", 225, 175);
    pointer(board, "pointermove", 325, 325);
    rerender(
      <TabletopBoard
        scene={scene}
        tokens={[token]}
        manager
        preview
        onMove={move}
      />,
    );
    pointer(board, "pointerup", 325, 325);
    expect(move).not.toHaveBeenCalled();
    expect(piece.getAttribute("transform")).toBe("translate(128 128)");
  });
  it("keeps fog and ruler coordinates aligned with the pixel-scaled map", () => {
    const fog = vi.fn();
    const { rerender } = render(
      <TabletopBoard
        scene={scene}
        tokens={[]}
        manager
        tool="fog"
        onFog={fog}
      />,
    );
    const board = screen.getByRole("application");
    mapBounds(board);
    pointer(board, "pointerdown", 225, 175);
    pointer(board, "pointermove", 325, 175);
    const cover = board.querySelector('rect[fill="#bc88ff"]');
    expect(cover.getAttribute("x")).toBe("128");
    expect(cover.getAttribute("width")).toBe("192");
    pointer(board, "pointerup", 325, 175);
    expect(fog).toHaveBeenCalledWith({ x: 2, y: 2, w: 3, h: 1 });
    rerender(<TabletopBoard scene={scene} tokens={[]} manager tool="ruler" />);
    pointer(board, "pointerdown", 225, 175);
    pointer(board, "pointermove", 325, 175);
    expect(screen.getByText("3.0 m")).toBeTruthy();
    expect(board.querySelector("line").getAttribute("x2")).toBe("288");
  });
  it("never puts hidden or covered enemies in the player board DOM", () => {
    render(
      <TabletopBoard
        scene={{ ...scene, fog: [{ x: 5, y: 5, w: 2, h: 2 }] }}
        userId="a"
        tokens={[
          token,
          { ...token, id: "e", name: "Segredo", visible: false },
          { ...token, id: "f", name: "Coberto", x: 5, y: 5 },
        ]}
      />,
    );
    expect(screen.queryByRole("button", { name: /Segredo|Coberto/ })).toBe(
      null,
    );
    expect(screen.getByRole("button", { name: /Agente/ })).toBeTruthy();
  });
  it("supports keyboard movement only on owned tokens and respects movement pause and map boundaries", () => {
    const move = vi.fn();
    const { rerender } = render(
      <TabletopBoard scene={scene} userId="a" tokens={[token]} onMove={move} />,
    );
    fireEvent.keyDown(screen.getByRole("button"), { key: "ArrowRight" });
    expect(move).toHaveBeenCalledWith(token, { x: 3, y: 2 });
    rerender(
      <TabletopBoard
        scene={{ ...scene, allow_player_moves: false }}
        userId="a"
        tokens={[token]}
        onMove={move}
      />,
    );
    fireEvent.keyDown(screen.getByRole("button"), { key: "ArrowRight" });
    expect(move).toHaveBeenCalledTimes(1);
    rerender(
      <TabletopBoard scene={scene} userId="b" tokens={[token]} onMove={move} />,
    );
    fireEvent.keyDown(screen.getByRole("button"), { key: "ArrowRight" });
    expect(move).toHaveBeenCalledTimes(1);
    expect(snapPosition(500, -10, scene, 2)).toEqual({ x: 22, y: 0 });
    expect(fogRectangle({ x: 7, y: 6 }, { x: 4, y: 3 }, scene)).toEqual({
      x: 4,
      y: 3,
      w: 4,
      h: 4,
    });
  });
  it("selects the preferred no-grid maps and revised art from the existing campaign folder", () => {
    const files = [
      "MAPAS/Santa_Iris/SI01_sem_grid.png",
      "MAPAS/Santa_Iris/SI01_grid.png",
      "BESTIARIO/Imagens_Inimigos/Revisao_5_1/A04_v5_1.png",
      "BESTIARIO/Imagens_Inimigos/portador_do_chiado_com_fundo.png",
    ].map((path) => ({
      name: path.split("/").at(-1),
      webkitRelativePath: "ASA_Tower_2077/" + path,
    }));
    const chosen = campaignFolderImages(files);
    expect(chosen).toHaveLength(2);
    expect(chosen.map((x) => x.kind)).toEqual(["map", "token"]);
  });
});
