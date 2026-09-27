import type { RGB } from "./color";
import { distinct, lightColor } from "./color";
import type { HomeAssistant, Room } from "./types";

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
    const s = hass.states[id];
    const c = lightColor(s);
    if (!c) continue;
    colors.push(c);
    maxBrightness = Math.max(maxBrightness, s.attributes.brightness ?? 255);
  }
  const dimmer = room.dimmer ? hass.states[room.dimmer] : undefined;
  const dimmerAvailable = !!dimmer && dimmer.state !== "unavailable";
  const level = dimmerAvailable
    ? (dimmer!.attributes.brightness ?? 255) / 255
    : maxBrightness / 255;
  return {
    on: colors.length > 0,
    colors: distinct(colors),
    level: colors.length ? level : 0,
    dimmerAvailable,
    activeScene: dimmerAvailable ? dimmer!.attributes.active_scene ?? null : null,
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
