"""Constants for Light Manager."""

from typing import Final

DOMAIN: Final = "light_manager"

# Lights with this label (on the entity or its device) are left out of the
# card's rooms, e.g. status LEDs that happen to be in the area.
EXCLUDE_LABEL_NAME: Final = "light-manager-excluded"
EXCLUDE_LABEL_ID: Final = "light_manager_excluded"

# The dashboard card, served by the integration.
CARD_URL: Final = "/light_manager/light-manager-card.js"

STORAGE_KEY: Final = DOMAIN
STORAGE_VERSION: Final = 1
SAVE_DELAY: Final = 5

# Internal names of the homeassistant scene platform (homeassistant/components/
# homeassistant/scene.py). Not public API; tests/test_ha_internals.py pins them.
HA_SCENE_PLATFORM_DATA: Final = "homeassistant_scene"
EVENT_SCENE_RELOADED: Final = "scene_reloaded"

# A light reporting a brightness within this distance of what we expect is not
# considered changed by hand (devices round, groups average).
BRIGHTNESS_TOLERANCE: Final = 3

# After our own command with a transition, state changes of the light are
# ignored for the transition plus this long: reports during a slow transition
# arrive after HA's 5 s context window and would look like manual changes.
COMMAND_GRACE_SECONDS: Final = 2.0

ATTR_ACTIVE_SCENE: Final = "active_scene"
ATTR_SCENE_ACTIVATED_AT: Final = "scene_activated_at"
ATTR_MODIFIED: Final = "modified"
ATTR_BASELINE: Final = "baseline"
