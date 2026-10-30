import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { TabletopView } from "./VirtualTabletop";

vi.mock("../lib/supabase", () => ({ supabase: {} }));
afterEach(cleanup);

const live = {
  id: "live",
  name: "Em jogo",
  columns: 24,
  rows: 18,
  fog: [],
  grid_visible: true,
  allow_player_moves: true,
};
const prepared = { ...live, id: "prepared", name: "Bastidores" };
const secret = {
  id: "secret",
  scene_id: prepared.id,
  name: "Portador oculto",
  size: 1,
  x: 2,
  y: 2,
  visible: false,
  kind: "enemy",
  color: "#bb8bff",
};
function view(table) {
  return <TabletopView missionId="mission" userId="gm" manager table={table} />;
}
function fixture(overrides = {}) {
  return {
    scenes: [prepared, live],
    tokens: [secret],
    assets: [],
    images: {},
    room: { active_scene_id: live.id },
    loading: false,
    busy: false,
    updateToken: vi.fn(),
    updateScene: vi.fn(),
    ...overrides,
  };
}

describe("player preview round trip", () => {
  it("restores the GM scene, token, tool, zoom, scroll and open preparation forms", () => {
    const table = fixture();
    const { container, rerender } = render(view(table));
    fireEvent.change(screen.getByLabelText("Selecionar cenário"), {
      target: { value: prepared.id },
    });
    fireEvent.click(
      within(screen.getByRole("application")).getByRole("button", {
        name: /Portador oculto/,
      }),
    );
    fireEvent.change(screen.getByLabelText("Zoom do mapa"), {
      target: { value: "200" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cobrir área" }));
    const details = screen.getByText("+ Novo cenário").closest("details");
    details.open = true;
    fireEvent.change(screen.getByLabelText("Nome da cena"), {
      target: { value: "Próximo andar" },
    });
    const stage = container.querySelector(".vt-stage");
    stage.scrollLeft = 190;
    stage.scrollTop = 260;
    stage.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 1000,
      height: 600,
    });
    fireEvent.wheel(stage, { deltaY: -100, clientX: 100, clientY: 100 });
    fireEvent.change(screen.getByLabelText("Zoom do mapa"), {
      target: { value: "200" },
    });
    const camera = container.querySelector(".vt-map-size").style.transform;

    fireEvent.click(screen.getByLabelText("Prévia dos jogadores"));
    expect(
      screen.getByRole("application").getAttribute("aria-label"),
    ).toContain(live.name);
    expect(
      screen.queryByRole("button", { name: /Portador oculto/ }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Cobrir área" })).toBeNull();
    expect(container.querySelector(".vt-preparation").hidden).toBe(true);
    fireEvent.change(screen.getByLabelText("Zoom do mapa"), {
      target: { value: "75" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Régua" }));
    stage.scrollLeft = 0;
    stage.scrollTop = 0;
    rerender(view({ ...table, scenes: [live, prepared] }));
    fireEvent.click(screen.getByLabelText("Prévia dos jogadores"));

    expect(screen.getByLabelText("Selecionar cenário").value).toBe(prepared.id);
    expect(screen.getByLabelText("Zoom do mapa").value).toBe("200");
    expect(
      screen
        .getByRole("button", { name: "Cobrir área" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      within(screen.getByRole("application"))
        .getByRole("button", { name: /Portador oculto/ })
        .classList.contains("selected"),
    ).toBe(true);
    expect(screen.getByLabelText("Arte do token selecionado")).toBeTruthy();
    expect(stage.scrollLeft).toBe(190);
    expect(stage.scrollTop).toBe(260);
    expect(container.querySelector(".vt-map-size").style.transform).toBe(
      camera,
    );
    expect(screen.getByText("+ Novo cenário").closest("details")).toBe(details);
    expect(details.open).toBe(true);
    expect(screen.getByLabelText("Nome da cena").value).toBe("Próximo andar");
    expect(table.updateScene).not.toHaveBeenCalled();
    expect(table.updateToken).not.toHaveBeenCalled();
  });

  it("keeps the implicit GM scene when preview has no scene and a different scene becomes active", () => {
    const table = fixture({ room: null });
    const { rerender } = render(view(table));
    expect(screen.getByLabelText("Selecionar cenário").value).toBe(prepared.id);
    fireEvent.click(screen.getByLabelText("Prévia dos jogadores"));
    expect(
      screen.getByRole("heading", { name: "Aguardando o mestre" }),
    ).toBeTruthy();
    rerender(
      view({
        ...table,
        scenes: [live, prepared],
        room: { active_scene_id: live.id },
      }),
    );
    expect(
      screen.getByRole("application").getAttribute("aria-label"),
    ).toContain(live.name);
    fireEvent.click(screen.getByLabelText("Prévia dos jogadores"));
    expect(screen.getByLabelText("Selecionar cenário").value).toBe(prepared.id);
  });
});
