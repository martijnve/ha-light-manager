import { css, html, LitElement } from "lit";
import { define } from "./define";
import "./controls";
import "./room-dialog";
import type { LightManagerRoomDialog } from "./room-dialog";
import "./fade";
import { icon, roomBackground, roomStyle, sharedStyles, slider, toggle } from "./header";
import { dimRoom, fetchRoom, roomState, toggleRoom } from "./room";
import type { CardConfig, HomeAssistant, Room } from "./types";

/** One room: colored by its lights, with an on/off switch and the scene dimmer. */
export class LightManagerCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _room: { state: true },
    _error: { state: true },
  };
  declare hass: HomeAssistant;
  declare _config: CardConfig;
  declare _room: Room | undefined;
  declare _error: string | undefined;

  static getStubConfig() {
    return { area: "" };
  }

  setConfig(config: CardConfig) {
    if (!config.area) throw new Error("Set 'area' to the area id of a room");
    if (this._config?.area !== config.area) this._room = undefined;
    this._config = config;
  }

  getCardSize() {
    return 2;
  }

  getGridOptions() {
    // Height from the content (~84 px, like hue-like-light-card), not grid rows.
    return { columns: 12, rows: "auto", min_columns: 6 };
  }

  protected updated() {
    if (this.hass && this._config && !this._room && !this._error) this._load();
  }

  private async _load() {
    try {
      this._room = await fetchRoom(this.hass, this._config.area);
    } catch (err) {
      this._error = (err as { message?: string }).message ?? String(err);
    }
  }

  render() {
    if (this._error) return html`<ha-card class="error">Light Manager: ${this._error}</ha-card>`;
    if (!this._room || !this.hass) return html`<ha-card class="loading"></ha-card>`;
    const room = this._room;
    const state = roomState(this.hass, room);
    return html`<ha-card style=${roomStyle(state)} @click=${this._open}>
      <lm-fade .background=${roomBackground(state)}></lm-fade>
      <div class="row">
        <span class="icon">${icon(this._config.icon ?? room.icon ?? "mdi:sofa")}</span>
        <span class="name">${this._config.name ?? room.name}</span>
        ${toggle(state, (ev) => toggleRoom(this.hass, room, state, ev.detail.on))}
      </div>
      ${slider(state, (ev) => dimRoom(this.hass, room, state, ev.detail.value))}
    </ha-card>`;
  }

  private _dialog: LightManagerRoomDialog | undefined;

  protected willUpdate(changed: Map<string, unknown>) {
    // Keep an open dialog live.
    if (changed.has("hass") && this._dialog) this._dialog.hass = this.hass;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._dialog?.close();
  }

  private _open() {
    if (!this._room || this._dialog) return;
    const dialog = document.createElement("light-manager-room-dialog");
    dialog.hass = this.hass;
    dialog.areaId = this._room.area_id;
    dialog.room = this._room;
    dialog.card = this;
    dialog.addEventListener("closed", () => (this._dialog = undefined));
    this._dialog = dialog;
    document.body.appendChild(dialog);
  }

  static styles = [
    sharedStyles,
    css`
      ha-card {
        background: none;
        color: var(--lm-fg);
        border-radius: 16px;
        position: relative;
        overflow: hidden;
        padding: 12px 14px 4px;
        box-sizing: border-box;
        height: 100%;
        min-height: 80px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 4px;
        cursor: pointer;
        border: none;
        transition: color 0.8s;
      }
      .row,
      lm-slider {
        position: relative;
      }
      .row {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .name {
        flex: 1;
        font-size: 18px;
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .icon {
        width: 32px;
        display: flex;
        justify-content: center;
      }
      .error {
        padding: 16px;
        color: var(--error-color, #db4437);
      }
      .loading {
        height: 84px;
        background: #3a3a3a;
      }
    `,
  ];
}

define("light-manager-card", LightManagerCard);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: "light-manager-card",
  name: "Light Manager room",
  description: "A room colored by its lights, with the Light Manager scene dimmer",
});

declare global {
  interface HTMLElementTagNameMap {
    "light-manager-card": LightManagerCard;
  }
}
