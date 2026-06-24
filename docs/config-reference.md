# Config Reference

HAven device configs are JSON files stored in the `devices/` folder. Each file defines a single device: its canvas size, theme colors, pages, and all widgets. This page covers everything except individual widget types, which are documented in [Widget Reference](widgets.md).

---

## Contents

- [Top-Level Structure](#top-level-structure)
- [device block](#device-block)
- [theme block](#theme-block)
- [Visual Themes](#visual-themes)
- [pages array](#pages-array)
- [Page 0 - Persistent Overlay](#page-0---persistent-overlay)
- [Page Background Images](#page-background-images)
- [Widgets](widgets.md)
- [Icons](#icons)
- [Actions](actions.md)
- [Conditional Overrides](overrides.md)
- [Internal Entities](#internal-entities)
- [Performance Notes](#performance-notes)

---

## Top-Level Structure

```json
{
  "version": "1.0",
  "device": { ... },
  "theme": { ... },
  "pages": [ ... ]
}
```

| Field     | Description                                            |
| --------- | ------------------------------------------------------ |
| `version` | Config format version. Currently `"1.0"`.              |
| `device`  | Device settings: canvas size, screensaver, navigation. |
| `theme`   | Color tokens and base font size.                       |
| `pages`   | Array of page objects, each containing widgets.        |

---

## device block

```json
"device": {
  "name": "Kitchen Tablet",
  "canvas": { "width": 1024, "height": 768 },
  "default_page": 1,
  "return_to_default": 60,
  "connection_mode": "websocket",
  "screensaver": {
    "timeout": 300,
    "opacity": 0.95,
    "text": "HAven"
  },
  "page_nav": {
    "show": true,
    "background_color": "rgba(0,0,0,0.20)",
    "primary_color": "text",
    "secondary_color": "#6f7781",
    "size": "medium"
  }
}
```

| Field               | Description                                                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`              | Human-readable label for this device.                                                                                                                                                                                                             |
| `canvas.width`      | Design width in pixels.                                                                                                                                                                                                                           |
| `canvas.height`     | Design height in pixels.                                                                                                                                                                                                                          |
| `default_page`      | Page ID to load on startup and return to after inactivity.                                                                                                                                                                                        |
| `return_to_default` | Seconds of inactivity before returning to `default_page`. Set to `0` or omit to disable.                                                                                                                                                          |
| `connection_mode`   | Optional connection strategy. Omit or set `"websocket"` for live WebSocket updates. Set `"rest"` for older browsers that cannot keep the Home Assistant WebSocket open; HAven will poll REST state and call supported services over REST instead. |
| `rest_poll_interval` | Seconds between periodic `/api/states` refreshes when REST polling is active. Default: `60`. Values below `5` are treated as `5`.                                                                                                                |
| `rest_interaction_refresh` | Set to `false` to stop touch/mouse interactions from triggering an extra all-states REST refresh. Default: `true`.                                                                                                                         |
| `screensaver`       | Optional screensaver config (see below). Omit to disable.                                                                                                                                                                                         |
| `page_nav`          | Optional navigation dot styling (see below).                                                                                                                                                                                                      |
| `page_navigation`   | Alias for `page_nav`. Same fields.                                                                                                                                                                                                                |
| `icon_mode`         | Optional icon rendering mode for `[mdi:...]` tokens. Omit or set `font` for MDI webfont rendering (default). Set `raster` to load local image files instead (recommended for older browsers/devices).                                             |
| `icon_base_path`    | Base path for raster icons when `icon_mode: "raster"` (default: `images/mdi`).                                                                                                                                                                    |
| `icon_extension`    | Raster icon file extension when `icon_mode: "raster"` (default: `svg`, can be `png`).                                                                                                                                                             |
| `icon_size`         | Default raster icon size in pixels for `[mdi:...]` tokens when `icon_mode: "raster"` (default: `18`).                                                                                                                                             |
| `ha_token`          | Optional Long-Lived Access Token embedded in the config file (see below).                                                                                                                                                                         |
| `ha_url`            | Optional HA URL override. Defaults to `window.location.origin` when HAven is hosted inside HA's `www/` folder.                                                                                                                                    |

### Screensaver

When configured, HAven dims the screen after a period of inactivity. Any touch, tap, swipe, or `haven_command` event dismisses it.

| Field     | Default    | Description                                                                                                                                 |
| --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `timeout` | (required) | Seconds of inactivity before activating.                                                                                                    |
| `opacity` | `0.2`      | Overlay darkness: `0.0` = transparent, `1.0` = fully black.                                                                                 |
| `text`    | (none)     | Optional text shown on the screensaver overlay. Bounces around DVD-logo style; colour cycles on each bounce. Omit for a plain dark overlay. |

```json
"screensaver": {
  "timeout": 300,
  "opacity": 0.95,
  "text": "HAven Dashboard"
}
```

### Page navigation dots

| Field              | Default          | Description                                                   |
| ------------------ | ---------------- | ------------------------------------------------------------- |
| `show`             | `true`           | Show or hide the navigation dot bar.                          |
| `background_color` | semi-transparent | Background pill color. Accepts theme tokens or any CSS color. |
| `primary_color`    | `text`           | Color of the active/current page dot.                         |
| `secondary_color`  | muted grey       | Color of inactive dots.                                       |
| `size`             | `medium`         | Dot size: `small`, `medium`, or `large`.                      |

Set `"show": false` to hide the built-in dots entirely, for example when using custom navigation buttons.

### HA credentials in config

By default HAven prompts for a Long-Lived Access Token on first run and stores it in the browser's `localStorage`. The `ha_token` and `ha_url` fields let you embed credentials directly in the device JSON instead, which is useful for provisioning a new device without touching it.

**Token only** (most common). Use this when HAven is hosted inside HA's `www/` folder. The URL is inferred from the browser automatically:

```json
"device": {
  "name": "Kitchen Tablet",
  "canvas": { "width": 1024, "height": 768 },
  "ha_token": "your-long-lived-access-token"
}
```

**Token and URL**. Use this when HAven is hosted outside HA or you want to point at a specific HA instance regardless of where the dashboard is served from:

```json
"device": {
  "name": "Kitchen Tablet",
  "canvas": { "width": 1024, "height": 768 },
  "ha_token": "your-long-lived-access-token",
  "ha_url":   "http://192.168.1.100:8123"
}
```

Once the device has opened the dashboard for the first time, the token is saved to `localStorage` and the fields can be removed from the JSON. They will not be needed again unless the browser storage is cleared.

> **Security note:** `devices/` JSON files are served by HA without authentication. Anyone on your local network who knows the URL can read the file. Remove `ha_token` from production configs once the device is provisioned, or accept that it is readable on the local network.

---

## theme block

Color tokens are named values referenced throughout widget configs. Any widget property that accepts a color can use either a token name (`"primary"`) or a literal hex/rgb value (`"#8ADF45"`).

```json
"theme": {
  "style": "fallout",
  "colors": {
    "background":    "#161C23",
    "surface":       "#272E36",
    "surface2":      "#363f4a",
    "primary":       "#8ADF45",
    "warning":       "#F0AD4E",
    "danger":        "#D9534F",
    "text":          "#FFFFFF",
    "text_dim":      "#e6e6e6",
    "text_muted":    "#9fa5ad",
    "icon_inactive": "#464c53"
  },
  "font_size": 16
}
```

| Field       | Description                                                                                                                              |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `style`     | Optional visual theme name. Loads `themes/{name}.css` and applies a scoped CSS class to the canvas. See [Visual Themes](#visual-themes). |
| `colors`    | Named color tokens referenced by widgets. See standard tokens below.                                                                     |
| `font_size` | Base font size in pixels. Individual widgets can override with their own `font_size`.                                                    |

### Standard tokens

These ten tokens are used internally by HAven as widget defaults. They must be present in the `colors` block. You can change their hex values freely, but do not rename or remove them.

| Token           | Default   | Typical use                                  |
| --------------- | --------- | -------------------------------------------- |
| `background`    | `#161C23` | Canvas/page background                       |
| `surface`       | `#272E36` | Card and panel backgrounds                   |
| `surface2`      | `#363f4a` | Elevated surfaces, active button backgrounds |
| `primary`       | `#8ADF45` | Active states and highlights                 |
| `warning`       | `#F0AD4E` | Warning-level values                         |
| `danger`        | `#D9534F` | Error and alert values                       |
| `text`          | `#FFFFFF` | Primary text                                 |
| `text_dim`      | `#e6e6e6` | Secondary text                               |
| `text_muted`    | `#9fa5ad` | Inactive and hint text                       |
| `icon_inactive` | `#464c53` | Icons in off/inactive state                  |

### Custom tokens

Add any extra tokens to the `colors` block and reference them anywhere a color is accepted:

```json
"colors": {
  "background": "#161C23",
  ...
  "solar":  "#FFD700",
  "grid":   "#4488FF",
  "export": "#FF8844"
}
```

### font_size

`theme.font_size` sets the base font size in pixels. Individual widgets can override this with their own `font_size` property.

---

## Visual Themes

Visual themes add CSS effects on top of the standard color palette: custom fonts, scanlines, glow, animations, and other purely decorative styles. They are completely optional and have zero effect on any dashboard that does not opt in.

Set `theme.style` to the name of a theme to activate it:

```json
"theme": {
  "style": "fallout",
  "colors": { ... }
}
```

When HAven loads, it adds the class `theme-{name}` to the canvas element and injects `themes/{name}.css` into the page. All CSS rules in a theme file must be scoped under `.theme-{name}` so they only apply to that canvas and cannot affect other dashboards open in the same browser.

### Built-in themes

| Name        | Description                                                                                                                                                                                                                                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fallout`   | Pip-Boy terminal aesthetic. Phosphor green on near-black, CRT scanlines, vignette, monospace font, subtle screen flicker.                                                                                                                                                        |
| `cyberpunk` | Cyberpunk 2077 aesthetic. Neon yellow on dark blue-black, chromatic aberration on text, diagonal corner cuts on buttons, rolling CRT band effect.                                                                                                                                |
| `scada`     | Industrial HMI aesthetic. Amber on dark charcoal, monospace font, engineering grid background, square corners, no glow or animation. Cameras rendered in grayscale with an amber border frame.                                                                                   |
| `brutalist` | High-contrast light-mode aesthetic. Black on white, heavy 3px borders, bold sans-serif, zero decoration. The only light-mode theme. Active buttons invert completely (white becomes black). Cameras rendered in harsh high-contrast black and white.                             |
| `glass`     | Glassmorphism aesthetic. Frosted semi-transparent panels floating over a colourful radial gradient background. Requires rgba() surface colors (e.g. rgba(255,255,255,0.10)) to enable the backdrop blur. Cameras rendered with slight desaturation and a white inset rim.        |
| `vaporwave` | Retro 80s synthwave aesthetic. Deep purple sky fading through violet, pink, and coral at the horizon. Hot pink neon glow on panels, cyan neon on buttons. Italic wide sans-serif text with a bloom effect. Cameras tinted toward the purple-pink spectrum.                       |
| `luxury`    | High-end residential aesthetic. Near-black surfaces with antique gold (#c9a84c) accents. Thin 1px gold borders on every panel and button. Palatino serif typography with spaced uppercase headers. No animations. Cameras warmed with subtle sepia and a thin gold inset border. |

Demo configs are included in `devices/fallout-demo.json`, `devices/cyberpunk-demo.json`, `devices/scada-demo.json`, `devices/brutalist-demo.json`, `devices/glass-demo.json`, `devices/vaporwave-demo.json`, and `devices/luxury-demo.json`.

### Creating a custom theme

1. Create `themes/mytheme.css` in the `haven/` folder
2. Scope every rule under `.theme-mytheme`
3. Set `"style": "mytheme"` in your device config's `theme` block

```css
/* themes/mytheme.css */

.theme-mytheme {
  font-family: 'Your Font', monospace;
}

.theme-mytheme .widget-label {
  text-shadow: 0 0 6px currentColor;
}

.theme-mytheme .widget-button {
  border-radius: 0 !important;
}
```

### Animation notes

Animations in theme CSS files must not apply `transform` or `background` to the `#canvas` element (the element that receives the `.theme-{name}` class). HAven sets `transform: scale()` on the canvas element inline for screen scaling, and animating those properties on the element itself will cause scaling to break.

Safe approaches:

- Animate `opacity` on the canvas element (subtle only, keep the dip under 5%)
- Animate `transform`, `opacity`, or any property on `::before` or `::after` pseudo-elements
- Animate any property on widget child elements

---

## pages array

Pages are the screens users navigate between. Each page is an object with an `id`, optional metadata, and a `widgets` array.

```json
"pages": [
  { "id": 1, "label": "Energy",  "widgets": [ ... ] },
  { "id": 2, "label": "Lights",  "widgets": [ ... ] },
  { "id": 3, "label": "Cameras", "widgets": [ ... ] }
]
```

Users navigate between pages by swiping left/right or tapping the navigation dots.

### Page properties

| Property                   | Description                                                          |
| -------------------------- | -------------------------------------------------------------------- |
| `id`                       | Unique integer. Referenced by navigation actions and `default_page`. |
| `label`                    | Display name shown in the navigation dot tooltip.                    |
| `background_image`         | Path or URL to a background image (see below).                       |
| `background_image_opacity` | Image brightness: `0.0` to `1.0`.                                    |
| `background_image_fit`     | `cover` (default, may crop) or `contain` (letterbox).                |
| `widgets`                  | Array of widget objects on this page.                                |

---

## Page 0 - Persistent Overlay

A page with `"id": 0` is treated as a persistent overlay. Its widgets render on top of every other page at all times. Page 0 does not appear in the navigation dots and cannot be navigated to directly.

Use it for always-on elements: clocks, connection indicators, navigation buttons, or status bars.

```json
{ "id": 0, "widgets": [ ... ] }
```

Background image, opacity, and fit are not applicable to page 0 (it renders transparently over the current page).

---

## Page Background Images

Pages can display a background image beneath their widgets.

```json
{
  "id": 1,
  "label": "Home",
  "background_image": "images/wallpaper.jpg",
  "background_image_opacity": 0.3,
  "background_image_fit": "cover",
  "widgets": []
}
```

| Property                   | Values                       | Description                                      |
| -------------------------- | ---------------------------- | ------------------------------------------------ |
| `background_image`         | path or URL                  | Relative paths resolve from the `haven/` folder. |
| `background_image_opacity` | `0.0` to `1.0`               | `1.0` = full brightness, `0.1` = very subtle.    |
| `background_image_fit`     | `cover` (default), `contain` | How the image fills the canvas.                  |

---

## Widgets

Widgets are the objects placed on each page. Every widget has a `type`, a position (`x`, `y`), a size (`w`, `h`), and type-specific properties. They live in the `widgets` array of each page object.

See the [Widget Reference](widgets.md) for the full list of widget types, shared base properties, and links to the detail page for each type.

---

## Icons

HAven bundles [Material Design Icons](https://pictogrammers.com/library/mdi/) (MDI) locally. No internet connection is required to display icons. MDI is the same icon set used by Home Assistant's own UI.

Use `[mdi:icon-name]` syntax in any label `text` or button `icon` field:

```json
"text": "[mdi:fire] Heating"
"text": "[mdi:lightbulb-outline] Living Room"
"icon": "[mdi:lightbulb]"
```

Icons and text can be freely mixed in a single string. The icon name matches the MDI name exactly, the same name you would use in a HA `icon:` field.

Full icon library: https://pictogrammers.com/library/mdi/

### Raster icon mode (global)

If a device has trouble rendering the MDI font (for example older Kindle browsers), you can switch all `[mdi:...]` token icons to local image files by setting raster mode in the `device` block.

```json
"device": {
  "icon_mode": "raster",
  "icon_base_path": "images/mdi",
  "icon_extension": "svg",
  "icon_size": 20
}
```

Mode behavior:

- `icon_mode: "font"` (or omitted): current default MDI font behavior.
- `icon_mode: "raster"`: loads icons from `icon_base_path/icon-name.icon_extension`.
- If a raster icon file is missing, HAven falls back to the MDI font icon for that token.

This is a global device setting and applies to icon tokens in all widgets, not only weather widgets.

### Spacing around icons

Regular spaces work fine in plain text, but flex rendering collapses spaces directly adjacent to icon spans. Use `&nbsp;` when you need a guaranteed gap next to an icon:

```json
"text": "[mdi:home]&nbsp;Living Room"
"text": "Solar&nbsp;[mdi:weather-sunny]"
```

`&amp;`, `&lt;`, `&gt;`, and `&quot;` are also supported.

---

## Actions

See the dedicated [Actions](actions.md) reference for all action types, directional navigation, service calls, value tokens, and `haven_command` events fired from HA automations.

---

## Conditional Overrides

See the dedicated [Conditional Overrides](overrides.md) reference for full syntax, condition sources, visibility control, template expressions, and worked examples.

---

## Internal Entities

HAven provides a small set of built-in entity IDs that work exactly like HA entities in widget bindings:

| Entity ID                   | State                                        | Updates                   |
| --------------------------- | -------------------------------------------- | ------------------------- |
| `internal.connectionstatus` | `connected`, `connecting`, or `disconnected` | On WebSocket state change |
| `internal.currentdtm`       | ISO datetime string                          | Once per minute           |

Example: clock label using the internal datetime entity:

```json
{
  "type": "label",
  "entity": "internal.currentdtm",
  "prefix": "[mdi:clock-outline]&nbsp;",
  "format": "time_24",
  "x": 20,
  "y": 10,
  "w": 200,
  "h": 40,
  "font_size": 24,
  "color": "text"
}
```

Example: connection indicator dot using overrides:

```json
{
  "type": "rectangle",
  "entity": "internal.connectionstatus",
  "x": 1004,
  "y": 748,
  "w": 12,
  "h": 12,
  "radius": 6,
  "background": "danger",
  "overrides": [
    {
      "when": {
        "logic": "all",
        "conditions": [{ "type": "equals", "value": "connected" }]
      },
      "set": { "background": "primary" }
    },
    {
      "when": {
        "logic": "all",
        "conditions": [{ "type": "equals", "value": "connecting" }]
      },
      "set": { "background": "warning" }
    }
  ]
}
```

---

## Performance Notes

HAven is lightweight, but a few patterns can add overhead on a busy HA instance.

**Override rules:** every `state_changed` event for a registered entity re-evaluates all of that widget's override rules. A page with 50 widgets each having 5 rules runs 250 condition checks per event. Keep override lists short and use `logic: "any"` where possible to short-circuit early.

**`entity2` bindings:** each `entity2` registers an additional callback independently of `entity`. Use it only where a second entity genuinely drives the widget's appearance.

**REST polling:** with `connection_mode: "rest"`, HAven refreshes all HA states on a timer. Use `rest_poll_interval` to lengthen that timer on battery devices. Set `rest_interaction_refresh: false` when taps should rely on optimistic widget updates and the next scheduled poll.

**`history_chart` widgets:** each chart makes a `recorder/statistics_during_period` WebSocket request on page load and again on its `refresh_interval` timer. The default interval is 3600 seconds (1 hour). Only lower it when you need near-real-time charting.

**Camera snapshot/poster intervals:** each camera in `snapshot` or `poster` mode polls HA at `refresh_interval`. Prefer `mjpeg` for live feeds (one persistent connection). Use `poster` with a longer interval (60 s or more) for off-screen or secondary cameras.

**Console diagnostic:** when a page loads, HAven logs a summary to the browser console:

```
HAven page 1: 24 widgets, 18 entity, 3 entity2, 41 override rules
```

Use this to spot pages that have grown unexpectedly large.
