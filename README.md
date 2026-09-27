# Light Manager

A Home Assistant integration that remembers which scene was last applied to each area. It adds one dimmable light per area. Dimming that light dims all of the scene's lights **relative to their brightness in the scene**: with lamp A at 200 and lamp B at 100 in the scene, 50 % gives A=100 and B=50.

## How it works

- **Scenes:** only Home Assistant scenes (created in the scene editor or `scenes.yaml`). Scenes from other integrations (Hue, …) and `scene.create` snapshots are ignored.
- **Area:** the scene entity's area, or else the area most of the scene's lights are in.
- **Dimmer:** `light.<area>_scene`, e.g. `light.living_room_scene`. Brightness = the dim factor. Activating a scene resets it to 100 %. `brightness_step_pct` works, so dimmer-switch blueprints can drive it. Off turns the scene's lights off; on brings them back at the current factor. Colour and colour temperature are left alone.
- **Manual changes:** a scene light changed outside the dimmer gets that brightness (÷ the current factor) as its new scene value. A light turned off stays out until the scene is applied again. The dimmer's `modified` attribute shows this.
- **Attributes:** `active_scene`, `scene_activated_at`, `modified`, `baseline` (per light, 0 = off).
- The dimmer is not assigned to the area on purpose. Otherwise `light.turn_on` with an `area_id` target would set both the real lights and the dimmer.

## Install

In HACS add this repository as a custom repository (type *Integration*), install **Light Manager** and restart. Then go to *Settings → Devices & services → Add integration → Light Manager*.

## Limitations

- Reads the scene's stored target states from Home Assistant internals (there is no public API for them). `tests/test_ha_internals.py` catches changes to those internals.
- State reports from a light during a scene's own slow transition (> 5 s) can be taken as manual changes.

## Development

`devbox shell` (direnv loads it), then `devbox run test` and `devbox run lint`.
