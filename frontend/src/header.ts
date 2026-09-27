import { css, html, nothing } from "lit";
import { gradient, textColor } from "./color";
import type { RoomState } from "./room";

/** Background and text colors for a room in its current state. */
export function roomStyle(state: RoomState): string {
  const bg = state.on ? gradient(state.colors, state.level) : undefined;
  const fg = state.on ? textColor(state.colors, state.level) : "#ffffff";
  const dark = fg !== "#ffffff";
  return [
    bg ? `--lm-bg: ${bg}` : "",
    `--lm-fg: ${fg}`,
    `--lm-track: ${dark ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.18)"}`,
    `--lm-fill: ${dark ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.45)"}`,
  ]
    .filter(Boolean)
    .join("; ");
}

export function slider(state: RoomState, onDim: (ev: CustomEvent) => void) {
  return html`<lm-slider
    .value=${state.level}
    ?disabled=${!state.on}
    @change=${onDim}
  ></lm-slider>`;
}

export function toggle(state: RoomState, onToggle: (ev: CustomEvent) => void) {
  return html`<lm-toggle .on=${state.on} @change=${onToggle}></lm-toggle>`;
}

export const icon = (name: string | null | undefined) =>
  name ? html`<ha-icon .icon=${name}></ha-icon>` : nothing;

export const sharedStyles = css`
  :host {
    --lm-bg: linear-gradient(135deg, #454545, #333333);
    --lm-fg: #ffffff;
  }
  ha-icon {
    --mdc-icon-size: 28px;
    display: flex;
  }
`;
