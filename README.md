# Light Manager

A Home Assistant integration that remembers which scene was last applied to each area. It adds one dimmable light per area. Dimming that light dims all of the scene's lights **relative to their brightness in the scene**: with lamp A at 200 and lamp B at 100 in the scene, 50 % gives A=100 and B=50.

## How it works

- **Scenes:** Home Assistant scenes (scene editor or `scenes.yaml`) and Hue scenes. For a Hue scene the per-light targets come from the scene on the bridge, and a scene recalled from the Hue app or a Hue switch is picked up too. Other integrations' scenes, Hue smart scenes and `scene.create` snapshots are ignored.
- **Area:** the scene entity's area, or else the area most of the scene's lights are in.
- **Dimmer:** `light.<area>_scene`, e.g. `light.living_room_scene`. Brightness = the dim factor. Activating a scene resets it to 100 %. `brightness_step_pct` works, so dimmer-switch blueprints can drive it. Off turns the scene's lights off; on brings them back at the current factor. Colour and colour temperature are left alone.
- **Manual changes:** a scene light changed outside the dimmer gets that brightness (÷ the current factor) as its new scene value. A light turned off stays out until the scene is applied again. The dimmer's `modified` attribute shows this.
- **Attributes:** `active_scene`, `scene_activated_at`, `modified`, `baseline` (per light, 0 = off).
- The dimmer is not assigned to the area on purpose. Otherwise `light.turn_on` with an `area_id` target would set both the real lights and the dimmer.

## Dashboard card

Light Manager ships a card in the style of the Hue app: one card per room, colored by its lights, with an on/off switch and the scene dimmer as slider. Tapping it opens the room: its scenes (a circle in each scene's colors; tap to apply) and its lights (tile per light, colored by its current color, with a switch; tap for details).

```yaml
type: custom:light-manager-card
area: woonkamer   # area id
# name: Living room   (optional)
# icon: mdi:sofa      (optional, default: the area's icon)
```

The integration serves and registers the card itself; no separate resource is needed. Lights labelled `light-manager-excluded` (on the entity or its device) are left out of the card's rooms, e.g. status LEDs that sit in the area. Hue scene pictures aren't available to Home Assistant, so scenes show their colors instead.

## Install

In HACS add this repository as a custom repository (type *Integration*), install **Light Manager** and restart. Then go to *Settings → Devices & services → Add integration → Light Manager*.

## Limitations

- Reads scene targets from internals: Home Assistant's scene platform config and the Hue integration's aiohue scene resource (there is no public API for either). `tests/test_ha_internals.py` catches changes to those internals.
- A Hue scene action without a brightness starts at 255; the light's first report corrects it (and marks the scene `modified`).
- State reports from a light during a scene's own slow transition (> 5 s) can be taken as manual changes.

## Development

`devbox shell` (direnv loads it), then `devbox run test` and `devbox run lint`. The card lives in `frontend/` (Lit + TypeScript): `devbox run build` writes `custom_components/light_manager/frontend/light-manager-card.js` (committed, HACS installs it from the repo); `devbox run preview` serves a preview with fake data on http://127.0.0.1:5173/.
