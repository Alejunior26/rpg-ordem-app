import React from "react";
import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import TabletopBoard from "./TabletopBoard";
import {
  campaignFolderImages,
  fogRectangle,
  snapPosition,
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
describe("shared map interaction", () => {
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
