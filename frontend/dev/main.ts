// Preview harness: fake hass + stand-ins for HA's own elements.
import * as mdi from "@mdi/js";
import "../src/light-manager-card";
import type { HassEntity, HomeAssistant, Room } from "../src/types";

const iconPath = (name: string) => {
  const key = "mdi" + name.replace("mdi:", "").split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");
  return (mdi as Record<string, string>)[key] ?? mdi.mdiHelpCircle;
};
class HaIcon extends HTMLElement {
  set icon(name: string) {
    this.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" style="display:block;fill:currentColor"><path d="${iconPath(name)}"/></svg>`;
  }
}
class HaStateIcon extends HTMLElement {
  set stateObj(s: HassEntity) {
    this.innerHTML = `<svg viewBox="0 0 24 24" width="30" height="30" style="display:block;fill:currentColor"><path d="${iconPath(s.attributes.icon ?? "mdi:lightbulb")}"/></svg>`;
  }
  set hass(_h: unknown) {}
}
class HaCard extends HTMLElement {}
customElements.define("ha-icon", HaIcon);
customElements.define("ha-state-icon", HaStateIcon);
customElements.define("ha-card", HaCard);

const light = (id: string, name: string, state: string, attrs: Record<string, unknown> = {}): HassEntity => ({
  entity_id: id, state, last_updated: "", attributes: { friendly_name: name, ...attrs },
});

const states: Record<string, HassEntity> = {};
const add = (e: HassEntity) => (states[e.entity_id] = e);
// Woonkamer: Savanna sunset-ish colors, dimmed to 58 %.
add(light("light.woonkamer_scene", "Woonkamer scene", "on", { brightness: 148, active_scene: "scene.woonkamer_savanna_sunset" }));
add(light("light.zolder_zo_rgb", "Plafond Woonkamer (rgb)", "on", { brightness: 200, rgb_color: [255, 70, 30] }));
add(light("light.hue_go_1", "Hue go 1", "on", { brightness: 150, rgb_color: [255, 150, 60] }));
add(light("light.hue_lightstrip_1", "Hue lightstrip 1", "on", { brightness: 150, rgb_color: [220, 210, 120] }));
add(light("light.hue_play_1", "Hue Play R", "unavailable"));
add(light("light.amazon_bol_rgb", "Amazon bol (RGB)", "unavailable"));
// Bios: warm white at full.
add(light("light.bios_scene", "Bios scene", "on", { brightness: 250, active_scene: "scene.bios_bright" }));
add(light("light.hue_white_lamp_3", "Hue white lamp 3", "on", { brightness: 250, color_temp_kelvin: 2900 }));
add(light("light.hue_white_lamp_4", "Hue white lamp 4", "on", { brightness: 250, color_temp_kelvin: 2900 }));
// Toilet: off, no scene tracked.
add(light("light.toilet_0_scene", "Toilet 0 scene", "unavailable"));
add(light("light.toilet_0_w", "Toilet 0 (w)", "off"));

const rooms: Record<string, Room> = {
  woonkamer: {
    area_id: "woonkamer", name: "Woonkamer", icon: "mdi:sofa", dimmer: "light.woonkamer_scene",
    lights: ["light.amazon_bol_rgb", "light.hue_go_1", "light.hue_lightstrip_1", "light.hue_play_1", "light.zolder_zo_rgb"],
    scenes: [
      { entity_id: "scene.woonkamer_arctic_aurora", name: "Arctic aurora", colors: [[40, 200, 170], [30, 90, 200], [120, 60, 200]] },
      { entity_id: "scene.woonkamer_was", name: "was", colors: [[255, 197, 143]] },
      { entity_id: "scene.woonkamer_tropical_twilight", name: "Tropical twilight", colors: [[120, 50, 160], [240, 90, 60], [255, 170, 60]] },
      { entity_id: "scene.woonkamer_savanna_sunset", name: "Savanna sunset", colors: [[255, 70, 30], [255, 150, 60], [220, 210, 120]] },
      { entity_id: "scene.woonkamer_tokyo", name: "Tokyo", colors: [[60, 40, 200], [220, 40, 160], [40, 180, 230]],
        lights: {
          "light.zolder_zo_rgb": { on: true, brightness: 230, rgb: [60, 40, 200] },
          "light.hue_go_1": { on: true, brightness: 230, rgb: [220, 40, 160] },
          "light.hue_lightstrip_1": { on: true, brightness: 230, rgb: [40, 180, 230] },
        } },
      { entity_id: "scene.woonkamer_bright_2", name: "Bright 2", colors: [[255, 205, 120]] },
      { entity_id: "scene.woonkamer_avond_2", name: "Avond", colors: [[255, 220, 150]] },
      { entity_id: "scene.woonkamer_spring_blossom", name: "Spring blossom", colors: [[250, 170, 200], [255, 220, 230], [200, 120, 170]] },
    ],
  },
  bios: { area_id: "bios", name: "Bios", icon: "mdi:television", dimmer: "light.bios_scene",
    lights: ["light.hue_white_lamp_3", "light.hue_white_lamp_4"], scenes: [] },
  toilet_0: { area_id: "toilet_0", name: "Toilet 0", icon: "mdi:toilet", dimmer: "light.toilet_0_scene",
    lights: ["light.toilet_0_w"], scenes: [] },
};

const hass: HomeAssistant = {
  states,
  async callService(domain, service, data, target) {
    console.log("callService", domain, service, data, target);
  },
  async callWS<T>(msg: Record<string, unknown>) {
    return rooms[msg.area_id as string] as T;
  },
};

const main = document.getElementById("cards")!;
for (const area of ["woonkamer", "bios", "toilet_0"]) {
  const card = document.createElement("light-manager-card");
  card.setConfig({ type: "custom:light-manager-card", area });
  card.hass = hass;
  main.appendChild(card);
}
if (location.hash === "#open") {
  setTimeout(() => (main.querySelector("light-manager-card")!.shadowRoot!.querySelector("ha-card") as HTMLElement).click(), 300);
}
