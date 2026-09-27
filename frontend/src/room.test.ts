import { afterEach, describe, expect, it, vi } from "vitest";
import { applyScene, OPTIMISTIC_MS, roomState, shownLight } from "./room";
import type { HomeAssistant, Room } from "./types";

const room: Room = {
  area_id: "living",
  name: "Living",
  icon: null,
  dimmer: "light.living_scene",
  lights: ["light.a", "light.b"],
  scenes: [
    {
      entity_id: "scene.red",
      name: "Red",
      colors: [[255, 0, 0]],
      lights: {
        "light.a": { on: true, brightness: 200, rgb: [255, 0, 0] },
        "light.b": { on: false, brightness: 255, rgb: null },
      },
    },
  ],
};

function makeHass(): HomeAssistant {
  return {
    states: {
      "light.a": { entity_id: "light.a", state: "on", last_updated: "t0", attributes: { brightness: 50, rgb_color: [0, 0, 255] } },
      "light.b": { entity_id: "light.b", state: "on", last_updated: "t0", attributes: { brightness: 50, rgb_color: [0, 0, 255] } },
      "light.living_scene": { entity_id: "light.living_scene", state: "on", last_updated: "t0", attributes: { brightness: 64, active_scene: "scene.blue" } },
    },
    callService: vi.fn(async () => undefined),
    callWS: vi.fn(),
  };
}

afterEach(() => vi.useRealTimers());

describe("optimistic scene", () => {
  it("shows the scene's targets until each light reports", () => {
    const hass = makeHass();
    applyScene(hass, room, room.scenes[0]);
    expect(hass.callService).toHaveBeenCalledWith("scene", "turn_on", undefined, { entity_id: "scene.red" });

    expect(shownLight(hass, "living", "light.a")).toMatchObject({ color: [255, 0, 0], brightness: 200, on: true });
    expect(shownLight(hass, "living", "light.b")).toMatchObject({ color: null, on: false });
    const state = roomState(hass, room);
    expect(state.activeScene).toBe("scene.red");
    expect(state.level).toBe(200 / 255);

    // light.a reports: its real state wins again.
    hass.states["light.a"] = { ...hass.states["light.a"], last_updated: "t1", attributes: { brightness: 190, rgb_color: [250, 5, 5] } };
    expect(shownLight(hass, "living", "light.a")).toMatchObject({ color: [250, 5, 5], brightness: 190 });
    expect(shownLight(hass, "living", "light.b").on).toBe(false);
  });

  it("stops after the optimistic window", () => {
    vi.useFakeTimers();
    const hass = makeHass();
    applyScene(hass, room, room.scenes[0]);
    vi.advanceTimersByTime(OPTIMISTIC_MS + 1);
    expect(shownLight(hass, "living", "light.a")).toMatchObject({ color: [0, 0, 255], brightness: 50 });
    expect(roomState(hass, room).activeScene).toBe("scene.blue");
  });
});
