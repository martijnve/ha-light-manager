// The parts of Home Assistant's frontend objects the card uses.

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_updated: string;
}

export interface HomeAssistant {
  states: Record<string, HassEntity>;
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
    target?: Record<string, unknown>,
  ): Promise<unknown>;
  callWS<T>(msg: Record<string, unknown>): Promise<T>;
  themes?: { darkMode?: boolean };
}

/** What a scene sets on one light. */
export interface SceneLight {
  on: boolean;
  brightness: number;
  rgb: [number, number, number] | null;
}

export interface RoomScene {
  entity_id: string;
  name: string;
  colors: [number, number, number][];
  lights?: Record<string, SceneLight>;
}

/** Result of the light_manager/room websocket command. */
export interface Room {
  area_id: string;
  name: string;
  icon: string | null;
  dimmer: string | null;
  scenes: RoomScene[];
  lights: string[];
}

export interface CardConfig {
  type: string;
  area: string;
  name?: string;
  icon?: string;
}
