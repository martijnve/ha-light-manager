import type { HassEntity } from "./types";

export type RGB = [number, number, number];

// Pale warm white, as the Hue app shows white and warm-white lamps.
export const WARM_WHITE: RGB = [252, 214, 140];
export const OFF_BACKGROUND = "linear-gradient(135deg, #454545, #333333)";

/** Color temperature (Kelvin) to RGB, the approximation HA's frontend uses. */
export function kelvinToRgb(kelvin: number): RGB {
  const t = kelvin / 100;
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(255, v)));
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g =
    t <= 66
      ? 99.4708025861 * Math.log(t) - 161.1195681661
      : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  return [clamp(r), clamp(g), clamp(b)];
}

/** The color a light shows, or null when it is off or unavailable. */
export function lightColor(state: HassEntity | undefined): RGB | null {
  if (!state || state.state !== "on") return null;
  const a = state.attributes;
  if (Array.isArray(a.rgb_color)) return a.rgb_color.slice(0, 3) as RGB;
  if (typeof a.color_temp_kelvin === "number") return mix(kelvinToRgb(a.color_temp_kelvin), 0.3);
  return WARM_WHITE;
}

/** Mix toward white by `amount` (0..1). */
export function mix([r, g, b]: RGB, amount: number): RGB {
  const m = (v: number) => Math.round(v + (255 - v) * amount);
  return [m(r), m(g), m(b)];
}

/** Darken toward black for low brightness, like the Hue app (0..1). */
export function dim([r, g, b]: RGB, level: number): RGB {
  const f = 0.3 + 0.7 * Math.max(0, Math.min(1, level));
  return [Math.round(r * f), Math.round(g * f), Math.round(b * f)];
}

const css = ([r, g, b]: RGB) => `rgb(${r}, ${g}, ${b})`;

/** A left-to-right gradient of the colors, with a darker bottom edge. */
export function gradient(colors: RGB[], level = 1): string {
  if (colors.length === 0) return OFF_BACKGROUND;
  const shown = colors.map((c) => dim(c, level));
  const stops =
    shown.length === 1
      ? [css(shown[0]), css(dim(shown[0], 0.75))]
      : shown.map(css);
  return (
    "linear-gradient(to bottom, rgba(0,0,0,0) 45%, rgba(0,0,0,0.28) 100%), " +
    `linear-gradient(100deg, ${stops.join(", ")})`
  );
}

/** Relative luminance 0..1 (sRGB). */
export function luminance([r, g, b]: RGB): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Dark text on light backgrounds, white otherwise. */
export function textColor(colors: RGB[], level = 1): string {
  if (colors.length === 0) return "#ffffff";
  const shown = colors.map((c) => dim(c, level));
  const avg = shown.reduce((sum, c) => sum + luminance(c), 0) / shown.length;
  return avg > 0.45 ? "#2b2b2b" : "#ffffff";
}

/** Distinct colors, in order (so similar lamps don't flatten the gradient). */
export function distinct(colors: RGB[], max = 5): RGB[] {
  const out: RGB[] = [];
  for (const c of colors) {
    if (!out.some((o) => Math.abs(o[0] - c[0]) + Math.abs(o[1] - c[1]) + Math.abs(o[2] - c[2]) < 24)) {
      out.push(c);
    }
    if (out.length >= max) break;
  }
  return out;
}
