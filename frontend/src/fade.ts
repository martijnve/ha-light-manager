import { css, html, LitElement } from "lit";
import { repeat } from "lit/directives/repeat.js";

interface Layer {
  key: number;
  background: string;
}

/**
 * Background that cross-fades when `background` changes (CSS can't transition
 * between gradients). Place it first inside a positioned container.
 */
export class LmFade extends LitElement {
  static properties = { background: { type: String }, _layers: { state: true } };
  declare background: string;
  declare _layers: Layer[];
  private _key = 0;

  constructor() {
    super();
    this.background = "";
    this._layers = [];
  }

  protected willUpdate(changed: Map<string, unknown>) {
    if (!changed.has("background")) return;
    const top = this._layers[this._layers.length - 1];
    if (top?.background === this.background) return;
    // Keep the layer that is showing now underneath the new one.
    this._layers = [...this._layers.slice(-1), { key: ++this._key, background: this.background }];
  }

  render() {
    return repeat(
      this._layers,
      (layer) => layer.key,
      (layer, i) =>
        html`<div
          class=${i === this._layers.length - 1 && this._layers.length > 1 ? "in" : ""}
          style="background: ${layer.background}"
          @animationend=${this._settled}
        ></div>`,
    );
  }

  private _settled() {
    this._layers = this._layers.slice(-1);
  }

  static styles = css`
    :host {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }
    div {
      position: absolute;
      inset: 0;
    }
    .in {
      animation: fade-in var(--lm-fade-duration, 0.8s) ease forwards;
    }
    @keyframes fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `;
}

customElements.get("lm-fade") || customElements.define("lm-fade", LmFade);
