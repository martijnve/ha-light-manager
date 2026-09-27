import { describe, expect, it } from "vitest";
import { reachable, shortName } from "./room-dialog";

const hass = {
  states: {
    "light.a": { state: "unavailable" },
    "light.b": { state: "on" },
    "light.c": { state: "off" },
  },
} as any;

describe("room dialog helpers", () => {
  it("leaves out unreachable and unknown lights, keeping the order", () => {
    expect(reachable(hass, ["light.a", "light.b", "light.missing", "light.c"])).toEqual([
      "light.b",
      "light.c",
    ]);
  });

  it("strips the room name from scene and light names", () => {
    expect(shortName("Woonkamer Tokyo", "Woonkamer")).toBe("Tokyo");
    expect(shortName("Hue go 1", "Woonkamer")).toBe("Hue go 1");
  });
});
