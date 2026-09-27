import { css, html, LitElement } from "lit";

/** Hue-style pill switch. Fires `change` with detail { on }. */
export class LmToggle extends LitElement {
  static properties = { on: { type: Boolean, reflect: true }, disabled: { type: Boolean } };
  declare on: boolean;
  declare disabled: boolean;

  constructor() {
    super();
    this.on = false;
    this.disabled = false;
  }

  static styles = css`
    :host {
      display: inline-block;
      --lm-track: rgba(0, 0, 0, 0.22);
    }
    button {
      all: unset;
      box-sizing: border-box;
      display: block;
      width: 52px;
      height: 32px;
      border-radius: 16px;
      background: var(--lm-track);
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }
    .knob {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
      transition: transform 0.2s;
    }
    :host([on]) .knob {
      transform: translateX(20px);
    }
    button[disabled] {
      opacity: 0.5;
      cursor: default;
    }
  `;

  render() {
    return html`<button
      role="switch"
      aria-checked=${this.on ? "true" : "false"}
      ?disabled=${this.disabled}
      @click=${this._click}
    >
      <span class="knob"></span>
    </button>`;
  }

  private _click(ev: Event) {
    ev.stopPropagation();
    if (this.disabled) return;
    this.dispatchEvent(new CustomEvent("change", { detail: { on: !this.on } }));
  }
}

/**
 * Hue-style brightness slider (value 0..1). Fires `change` with detail { value }
 * while dragging (at most every 400 ms) and on release.
 */
export class LmSlider extends LitElement {
  static properties = {
    value: { type: Number },
    disabled: { type: Boolean, reflect: true },
    _dragValue: { state: true },
  };
  declare value: number;
  declare disabled: boolean;
  declare _dragValue: number | null;
  private _lastSent = 0;
  private _pending: number | null = null;
  private _timer: number | undefined;

  constructor() {
    super();
    this.value = 0;
    this.disabled = false;
    this._dragValue = null;
  }

  static styles = css`
    :host {
      display: block;
      touch-action: none;
      --lm-track: rgba(0, 0, 0, 0.18);
      --lm-fill: rgba(255, 255, 255, 0.45);
    }
    .hit {
      position: relative;
      height: 32px;
      cursor: pointer;
    }
    .track,
    .fill {
      position: absolute;
      left: 0;
      top: 50%;
      height: 12px;
      margin-top: -6px;
      border-radius: 6px;
    }
    .track {
      right: 0;
      background: var(--lm-track);
    }
    .fill {
      background: var(--lm-fill);
    }
    .thumb {
      position: absolute;
      top: 50%;
      width: 26px;
      height: 26px;
      margin: -13px 0 0 -13px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    }
    :host([disabled]) .fill,
    :host([disabled]) .thumb {
      display: none;
    }
  `;

  render() {
    const v = this._dragValue ?? this.value;
    const pct = `${Math.round(v * 1000) / 10}%`;
    return html`<div
      class="hit"
      role="slider"
      aria-valuemin="1"
      aria-valuemax="100"
      aria-valuenow=${Math.round(v * 100)}
      aria-disabled=${this.disabled ? "true" : "false"}
      tabindex=${this.disabled ? "-1" : "0"}
      @pointerdown=${this._down}
      @pointermove=${this._move}
      @pointerup=${this._up}
      @pointercancel=${this._up}
      @keydown=${this._key}
      @click=${(ev: Event) => ev.stopPropagation()}
    >
      <div class="track"></div>
      <div class="fill" style="width:${pct}"></div>
      <div class="thumb" style="left:${pct}"></div>
    </div>`;
  }

  private _valueAt(ev: PointerEvent): number {
    const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const v = (ev.clientX - rect.left) / rect.width;
    return Math.max(0.01, Math.min(1, v));
  }

  private _down(ev: PointerEvent) {
    if (this.disabled) return;
    ev.stopPropagation();
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    this._dragValue = this._valueAt(ev);
    this._send(this._dragValue, false);
  }

  private _move(ev: PointerEvent) {
    if (this._dragValue === null) return;
    this._dragValue = this._valueAt(ev);
    this._send(this._dragValue, false);
  }

  private _up(ev: PointerEvent) {
    if (this._dragValue === null) return;
    const v = this._valueAt(ev);
    this._dragValue = null;
    this.value = v;
    this._send(v, true);
  }

  private _key(ev: KeyboardEvent) {
    if (this.disabled) return;
    const step = ev.key === "ArrowRight" || ev.key === "ArrowUp" ? 0.05 : ev.key === "ArrowLeft" || ev.key === "ArrowDown" ? -0.05 : 0;
    if (!step) return;
    ev.preventDefault();
    this.value = Math.max(0.01, Math.min(1, this.value + step));
    this._send(this.value, true);
  }

  private _send(value: number, final: boolean) {
    window.clearTimeout(this._timer);
    const now = Date.now();
    if (final || now - this._lastSent >= 400) {
      this._lastSent = now;
      this._pending = null;
      this.dispatchEvent(new CustomEvent("change", { detail: { value } }));
      return;
    }
    this._pending = value;
    this._timer = window.setTimeout(() => {
      if (this._pending !== null) this._send(this._pending, true);
    }, 400 - (now - this._lastSent));
  }
}

customElements.get("lm-toggle") || customElements.define("lm-toggle", LmToggle);
customElements.get("lm-slider") || customElements.define("lm-slider", LmSlider);
