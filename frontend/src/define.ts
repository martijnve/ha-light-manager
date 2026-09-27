// HA's start page imports this script in parallel with its own app.js, which swaps
// window.customElements for a scoped-registry polyfill when it boots. An element defined before
// the swap lands in the browser's registry, which HA no longer asks, so every card shows
// "Configuration error". On an HA page, wait until HA has defined its root element.
const ready = document.querySelector("home-assistant")
  ? customElements.whenDefined("home-assistant")
  : Promise.resolve();

/** Defines a custom element once, in the registry HA uses. */
export function define(name: string, element: CustomElementConstructor) {
  ready.then(() => customElements.get(name) || customElements.define(name, element));
}
