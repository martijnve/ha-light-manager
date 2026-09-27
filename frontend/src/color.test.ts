import { describe, expect, it } from "vitest";
import { dim, distinct, gradient, kelvinToRgb, lightColor, textColor, WARM_WHITE } from "./color";

const state = (s: string, attributes: Record<string, unknown> = {}) => ({
  entity_id: "light.x",
  state: s,
  attributes,
  last_updated: "",
});

describe("lightColor", () => {
  it("uses rgb_color, then color temperature, then warm white", () => {
    expect(lightColor(state("on", { rgb_color: [255, 0, 0] }))).toEqual([255, 0, 0]);
    const warm = lightColor(state("on", { color_temp_kelvin: 2700 }))!;
    expect(warm[0]).toBe(255);
    expect(warm[2]).toBeLessThan(warm[1]);
    expect(lightColor(state("on"))).toEqual(WARM_WHITE);
  });

  it("is null for lights that are off or unavailable", () => {
    expect(lightColor(state("off"))).toBeNull();
    expect(lightColor(state("unavailable"))).toBeNull();
    expect(lightColor(undefined)).toBeNull();
  });
});

describe("colors", () => {
  it("kelvinToRgb is warm at 2000 K and near white at 6500 K", () => {
    expect(kelvinToRgb(2000)[2]).toBeLessThan(80);
    const daylight = kelvinToRgb(6500);
    expect(Math.min(...daylight)).toBeGreaterThan(240);
  });

  it("dim keeps some color at the lowest level", () => {
    expect(dim([200, 100, 0], 0)).toEqual([60, 30, 0]);
    expect(dim([200, 100, 0], 1)).toEqual([200, 100, 0]);
  });

  it("gradient falls back to grey when nothing is on", () => {
    expect(gradient([])).toContain("#454545");
    expect(gradient([[255, 0, 0], [0, 0, 255]])).toContain("rgb(255, 0, 0), rgb(0, 0, 255)");
  });

  it("textColor is dark on pale yellow and white on deep red", () => {
    expect(textColor([[255, 230, 160]])).toBe("#2b2b2b");
    expect(textColor([[180, 30, 20]])).toBe("#ffffff");
    expect(textColor([[255, 230, 160]], 0.1)).toBe("#ffffff");
  });

  it("distinct drops near-duplicates", () => {
    expect(distinct([[255, 0, 0], [250, 5, 3], [0, 0, 255]])).toEqual([[255, 0, 0], [0, 0, 255]]);
  });
});
