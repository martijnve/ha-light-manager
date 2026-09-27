import { css, html, LitElement, nothing } from "lit";
import { define } from "./define";
import type { RGB } from "./color";
import { dim, gradient, mix, textColor } from "./color";
import "./fade";
import { icon, roomBackground, roomStyle, sharedStyles, slider, toggle } from "./header";
import { applyScene, dimRoom, fetchRoom, OPTIMISTIC_MS, roomState, shownLight, toggleRoom } from "./room";
import type { HomeAssistant, Room, RoomScene } from "./types";

/** Full-screen room view: header, scenes and lights (appended to <body>). */
export class LightManagerRoomDialog extends LitElement {
  static properties = {
    hass: { attribute: false },
    room: { attribute: false },
    areaId: { type: String },
  };
  declare hass: HomeAssistant;
  declare room: Room;
  declare areaId: string;
  /** The card that opened the dialog: forwards hass updates, hosts more-info. */
  card: HTMLElement | undefined;
  private _onPop = () => this.close(false);
  private _onKey = (ev: KeyboardEvent) => ev.key === "Escape" && this.close();

  connectedCallback() {
    super.connectedCallback();
    // The phone's back button closes the dialog.
    history.pushState({ lightManagerDialog: true }, "");
    window.addEventListener("popstate", this._onPop);
    window.addEventListener("keydown", this._onKey);
    fetchRoom(this.hass, this.areaId, true).then((room) => (this.room = room), () => {});
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("popstate", this._onPop);
    window.removeEventListener("keydown", this._onKey);
  }

  close(popHistory = true) {
    if (!this.isConnected) return;
    this.remove();
    if (popHistory && history.state?.lightManagerDialog) history.back();
    this.dispatchEvent(new CustomEvent("closed"));
  }

  render() {
    const room = this.room;
    const state = roomState(this.hass, room);
    return html`<div class="backdrop" @click=${() => this.close()}></div>
      <div class="panel" role="dialog" aria-label=${room.name}>
        <header style=${roomStyle(state)}>
          <lm-fade .background=${roomBackground(state)}></lm-fade>
          <div class="row">
            <button class="round" aria-label="Back" @click=${() => this.close()}>
              ${icon("mdi:arrow-left")}
            </button>
            <span class="title">${room.name}</span>
            ${toggle(state, (ev) => toggleRoom(this.hass, room, state, ev.detail.on))}
          </div>
          ${slider(state, (ev) => dimRoom(this.hass, room, state, ev.detail.value))}
        </header>
        <div class="body">
          ${room.scenes.length
            ? html`<h3>Scenes</h3>
                <div class="tiles">
                  ${room.scenes.map((scene) => this._scene(scene, scene.entity_id === state.activeScene))}
                </div>`
            : nothing}
          ${reachable(this.hass, room.lights).length
            ? html`<h3>Lights</h3>
                <div class="tiles">
                  ${reachable(this.hass, room.lights).map((id) => this._light(id))}
                </div>`
            : nothing}
        </div>
      </div>`;
  }

  private _scene(scene: RoomScene, active: boolean) {
    const colors = scene.colors.length ? (scene.colors as RGB[]) : [[255, 197, 143] as RGB];
    const circle =
      colors.length === 1
        ? `radial-gradient(circle at 32% 28%, rgb(${mix(colors[0], 0.45).join(",")}), rgb(${colors[0].join(",")}) 65%)`
        : `linear-gradient(135deg, ${colors.map((c) => `rgb(${c.join(",")})`).join(", ")})`;
    const name = shortName(scene.name, this.room.name);
    return html`<button
      class="scene ${active ? "active" : ""}"
      style=${active ? `background: ${gradient(colors)}; color: ${textColor(colors)}` : ""}
      @click=${() => this._apply(scene)}
    >
      <span class="circle" style="background: ${circle}">
        ${active ? html`<span class="playing">${icon("mdi:check")}</span>` : nothing}
      </span>
      <span class="label">${name}</span>
    </button>`;
  }

  private _apply(scene: RoomScene) {
    applyScene(this.hass, this.room, scene);
    this._refreshAll();
    // Show the real states again once the optimistic window is over.
    window.clearTimeout(this._optimisticTimer);
    this._optimisticTimer = window.setTimeout(() => this._refreshAll(), OPTIMISTIC_MS + 50);
  }

  private _optimisticTimer: number | undefined;

  private _refreshAll() {
    this.requestUpdate();
    (this.card as LitElement | undefined)?.requestUpdate();
  }

  private _light(entityId: string) {
    const shown = shownLight(this.hass, this.room.area_id, entityId);
    const s = shown.state;
    const name = shortName(s?.attributes.friendly_name ?? entityId, this.room.name);
    const color = shown.color;
    const level = shown.brightness / 255;
    const background = color
      ? `linear-gradient(to bottom, rgb(${dim(color, level).join(",")}), rgb(${dim(color, level * 0.7).join(",")}))`
      : "#3a3a3a";
    const style = color ? `color: ${textColor([color], level)}` : "";
    return html`<div class="light ${color ? "on" : ""}" style=${style} @click=${() => this._moreInfo(entityId)}>
      <lm-fade .background=${background}></lm-fade>
      <div class="top">
        ${s
          ? html`<ha-state-icon .hass=${this.hass} .stateObj=${s}></ha-state-icon>`
          : icon("mdi:lightbulb")}
        <span class="lname">${name}</span>
      </div>
      <div class="bottom">
        <lm-toggle
          .on=${shown.on}
          @change=${(ev: CustomEvent) =>
            this.hass.callService("light", ev.detail.on ? "turn_on" : "turn_off", undefined, {
              entity_id: entityId,
            })}
        ></lm-toggle>
      </div>
    </div>`;
  }

  private _moreInfo(entityId: string) {
    // HA listens for this inside its own element tree, so fire it from the card.
    (this.card ?? this).dispatchEvent(
      new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }),
    );
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        position: fixed;
        inset: 0;
        z-index: 7;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        font-family: var(--ha-font-family-body, Roboto, sans-serif);
      }
      .backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.55);
      }
      .panel {
        position: relative;
        width: 100%;
        max-width: 560px;
        height: 100%;
        overflow-y: auto;
        background: #1f1f1f;
        color: #fff;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      }
      @media (min-width: 600px) {
        :host {
          align-items: center;
        }
        .panel {
          height: auto;
          max-height: 90vh;
          border-radius: 20px;
        }
      }
      header {
        color: var(--lm-fg);
        border-radius: 0 0 20px 20px;
        padding: 14px 16px 12px;
        position: sticky;
        top: 0;
        z-index: 1;
        transition: color 0.8s;
      }
      header > .row,
      header > lm-slider,
      .light > .top,
      .light > .bottom {
        position: relative;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 8px;
      }
      .title {
        flex: 1;
        font-size: 1.3rem;
        font-weight: 600;
      }
      button {
        font: inherit;
        color: inherit;
        border: none;
        cursor: pointer;
      }
      .round {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .round ha-icon {
        --mdc-icon-size: 24px;
      }
      .body {
        padding: 8px 16px 24px;
      }
      h3 {
        font-size: 0.8rem;
        font-weight: 500;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #a8a8a8;
        margin: 22px 4px 12px;
      }
      /* Scenes and lights: the same grid and tile size. */
      .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
        gap: 8px;
      }
      .scene {
        background: #3a3a3a;
        border-radius: 12px;
        padding: 10px 4px 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 120px;
        box-sizing: border-box;
        color: #fff;
      }
      .circle {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      }
      .playing {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
      }
      .label {
        font-size: 0.85rem;
        line-height: 1.2;
        text-align: center;
        overflow-wrap: anywhere;
      }
      .light {
        height: 120px;
        border-radius: 12px;
        background: #3a3a3a;
        color: #fff;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        cursor: pointer;
        position: relative;
        transition: color 0.8s;
      }
      .top {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 8px 4px 2px;
        text-align: center;
      }
      .lname {
        font-size: 0.85rem;
        line-height: 1.2;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        overflow-wrap: anywhere;
      }
      .bottom {
        background: rgba(0, 0, 0, 0.12);
        display: flex;
        justify-content: center;
        padding: 5px 0;
      }
      ha-state-icon {
        --mdc-icon-size: 24px;
      }
    `,
  ];
}

/** Only the lights that are reachable (order kept). */
export function reachable(hass: HomeAssistant, ids: string[]): string[] {
  return ids.filter((id) => {
    const s = hass.states[id];
    return !!s && s.state !== "unavailable";
  });
}

/** "Woonkamer Tokyo" in room "Woonkamer" -> "Tokyo". */
export function shortName(name: string, roomName: string): string {
  const prefix = `${roomName} `;
  return name.toLowerCase().startsWith(prefix.toLowerCase()) ? name.slice(prefix.length) : name;
}

define("light-manager-room-dialog", LightManagerRoomDialog);

declare global {
  interface HTMLElementTagNameMap {
    "light-manager-room-dialog": LightManagerRoomDialog;
  }
}
