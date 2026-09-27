import type { RGB } from "./color";
import { distinct, lightColor, WARM_WHITE } from "./color";
import type { HassEntity, HomeAssistant, Room, RoomScene, SceneLight } from "./types";

const cache = new Map<string, Promise<Room>>();

/** The room's dimmer, scenes and lights (cached; `refresh` fetches again). */
export function fetchRoom(hass: HomeAssistant, areaId: string, refresh = false): Promise<Room> {
  let room = cache.get(areaId);
  if (!room || refresh) {
    room = hass.callWS<Room>({ type: "light_manager/room", area_id: areaId });
    room.catch(() => cache.delete(areaId));
    cache.set(areaId, room);
  }
  return room;
}

/** How long a tapped scene is shown before the lights have reported it. */
export const OPTIMISTIC_MS = 6000;

interface Optimistic {
  sceneId: string;
  lights: Record<string, SceneLight>;
  /** last_updated of each light at the tap: a change means it reported. */
  seen: Record<string, string | undefined>;
  until: number;
}

const optimistic = new Map<string, Optimistic>();

/** Apply a scene and show its result straight away (Hue lamps report 1-4 s later). */
export function applyScene(hass: HomeAssistant, room: Room, scene: RoomScene) {
  const lights = scene.lights ?? {};
  optimistic.set(room.area_id, {
    sceneId: scene.entity_id,
    lights,
    seen: Object.fromEntries(Object.keys(lights).map((id) => [id, hass.states[id]?.last_updated])),
    until: Date.now() + OPTIMISTIC_MS,
  });
  return hass.callService("scene", "turn_on", undefined, { entity_id: scene.entity_id });
}

/** The scene's target for a light, until the light has reported (or time is up). */
export function expected(hass: HomeAssistant, areaId: string, entityId: string): SceneLight | null {
  const o = optimistic.get(areaId);
  if (!o || Date.now() > o.until) return null;
  const target = o.lights[entityId];
  if (!target || hass.states[entityId]?.last_updated !== o.seen[entityId]) return null;
  return target;
}

function pending(areaId: string): Optimistic | null {
  const o = optimistic.get(areaId);
  return o && Date.now() <= o.until ? o : null;
}

/** A scene's own level 0..1: its brightest light (as the dimmer shows it). */
export function sceneLevel(lights: Record<string, SceneLight>): number {
  const on = Object.values(lights).filter((l) => l.on);
  return on.length ? Math.max(...on.map((l) => l.brightness)) / 255 : 1;
}

/** A light's state as shown: the scene's target while it hasn't reported yet. */
export function shownLight(
  hass: HomeAssistant,
  areaId: string,
  entityId: string,
): { color: RGB | null; brightness: number; on: boolean; state: HassEntity | undefined } {
  const s = hass.states[entityId];
  const target = s && s.state !== "unavailable" ? expected(hass, areaId, entityId) : null;
  if (target) {
    return {
      color: target.on ? ((target.rgb as RGB | null) ?? WARM_WHITE) : null,
      brightness: target.brightness,
      on: target.on,
      state: s,
    };
  }
  return {
    color: lightColor(s),
    brightness: s?.attributes.brightness ?? 255,
    on: s?.state === "on",
    state: s,
  };
}

/** Live state of a room, derived from hass.states. */
export interface RoomState {
  on: boolean;
  colors: RGB[];
  /** Dim level 0..1 of the scene dimmer, or of the lights without one. */
  level: number;
  dimmerAvailable: boolean;
  activeScene: string | null;
}

export function roomState(hass: HomeAssistant, room: Room): RoomState {
  const colors: RGB[] = [];
  let maxBrightness = 0;
  for (const id of room.lights) {
    const shown = shownLight(hass, room.area_id, id);
    if (!shown.color) continue;
    colors.push(shown.color);
    maxBrightness = Math.max(maxBrightness, shown.brightness);
  }
  const dimmer = room.dimmer ? hass.states[room.dimmer] : undefined;
  const dimmerAvailable = !!dimmer && dimmer.state !== "unavailable";
  const tapped = pending(room.area_id);
  // A newly applied scene starts at its brightest light's level.
  const level =
    tapped && dimmer?.attributes.active_scene !== tapped.sceneId
      ? sceneLevel(tapped.lights)
      : dimmerAvailable
        ? (dimmer!.attributes.brightness ?? 255) / 255
        : maxBrightness / 255;
  return {
    on: colors.length > 0,
    colors: distinct(colors),
    level: colors.length ? level : 0,
    dimmerAvailable,
    activeScene: tapped?.sceneId ?? (dimmerAvailable ? dimmer!.attributes.active_scene ?? null : null),
  };
}

/** Turn the room on/off: through the dimmer when it tracks a scene. */
export function toggleRoom(hass: HomeAssistant, room: Room, state: RoomState, on: boolean) {
  if (state.dimmerAvailable && room.dimmer) {
    return hass.callService("light", on ? "turn_on" : "turn_off", undefined, {
      entity_id: room.dimmer,
    });
  }
  return hass.callService("light", on ? "turn_on" : "turn_off", undefined, {
    entity_id: room.lights,
  });
}

/** Dim the room's scene (relative), or its lights when no scene is tracked. */
export function dimRoom(hass: HomeAssistant, room: Room, state: RoomState, value: number) {
  const pct = Math.max(1, Math.round(value * 100));
  const target = state.dimmerAvailable && room.dimmer ? room.dimmer : room.lights;
  return hass.callService("light", "turn_on", { brightness_pct: pct }, { entity_id: target });
}
