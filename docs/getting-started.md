# Getting Started with HAven

HAven is a browser-based Home Assistant dashboard. Static files dropped into your HA `www/` folder, no addons, no server-side code, no build process.

---

## Contents

- [Installation](#installation)
- [Getting a Long-Lived Access Token](#getting-a-long-lived-access-token)
- [First Run](#first-run)
- [How It Works](#how-it-works)
- [Your First Device Config](#your-first-device-config)
- [Adding Pages](#adding-pages)
- [Credentials & Security](#credentials--security)
- [Connection Status](#connection-status)
- [Browser Compatibility](#browser-compatibility)
- [Troubleshooting](#troubleshooting)

---

## Installation

1. Copy the `haven/` folder into your Home Assistant `config/www/` directory.
2. Open `http://your-ha-ip:8123/local/haven/index.html?device=example` in a browser.
3. On first load, enter your Long-Lived Access Token when prompted.
4. Edit `devices/example.json` or create your own device config files.

The resulting folder structure on your HA server:

```
config/
  www/
    haven/
      index.html
      app.js
      style.css
      fonts/
      devices/
        example.json      <- sample config, start here
        my-tablet.json    <- your own device configs
```

---

## Getting a Long-Lived Access Token

1. In Home Assistant, open your **Profile** (click your avatar in the bottom-left).
2. Scroll down to **Long-Lived Access Tokens**.
3. Click **Create Token** and give it a name (e.g. "Kitchen Tablet").
4. Copy the token immediately. It is only shown once.

---

## First Run

When you first open HAven on a device, a setup screen appears asking for:

- **Home Assistant URL**: defaults to the same origin HAven is served from (no entry needed when hosted inside HA's `www/` folder). Only change this for non-standard deployments.
- **Long-Lived Access Token**: paste the token you created above.

These credentials are saved in the browser's `localStorage` for that device and persist across reloads. You won't be prompted again unless you clear browser storage or open a different browser.

### URL parameter

Use `?device=name` to load `devices/name.json`:

```
http://your-ha-ip:8123/local/haven/index.html?device=ipad-air
```

The parameter is normally the filename **without** the `.json` extension. HAven also accepts `?device=ipad-air.json` and strips the extension for compatibility with copied filenames.

Omit the parameter entirely to load `devices/default.json`. If that file is missing, HAven shows a help/landing page.

---

## How It Works

- Each tablet or screen has its own JSON config file in `devices/`.
- The config defines a fixed canvas size (e.g. 1024x768) and widgets are placed at absolute pixel positions within that canvas.
- The canvas scales uniformly to fill whatever screen is displaying it, like a retro game emulator stretching to fill a TV.
- On load, HAven connects to HA via WebSocket, fetches current entity states, then subscribes to `state_changed` events.
- When an entity changes, only the DOM elements bound to that entity update. No page re-renders.

---

## Your First Device Config

The minimal structure for a device config:

```json
{
  "version": "1.0",
  "device": {
    "name": "Kitchen Tablet",
    "canvas": { "width": 1024, "height": 768 },
    "default_page": 1,
    "return_to_default": 60
  },
  "theme": {
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
  },
  "pages": [
    {
      "id": 1,
      "label": "Home",
      "widgets": []
    }
  ]
}
```

Save this as `devices/my-tablet.json` and open it at `?device=my-tablet`.

### Choosing a canvas size

HAven scales your fixed design to fill the screen, so you generally do **not** need to design at the device's native resolution.

| Preset | Good for |
|--------|----------|
| `1024x768` | iPad (non-retina), budget Android tablets |
| `1280x800` | 10" Android tablets |
| `1920x1080` | Full HD wall-mounted screens |
| `800x480` | Small 7" panels |
| `480x320` | Compact portrait panels |

Lower design resolutions are easier to build and maintain and tend to produce better touch ergonomics (larger tap targets).

### Using the Visual Designer

Rather than hand-editing JSON, use the drag-and-drop designer at `designer.html`:

```
http://your-ha-ip:8123/local/haven/designer.html
```

The designer lets you place and resize widgets visually, edit all properties through a sidebar panel, manage pages, and preview the result live. See the [Designer Reference](../DESIGNER.md) for full details.

---

## Adding Pages

Add more pages to the `pages` array. Users navigate between them by swiping left/right or tapping the dot indicators at the bottom of the screen:

```json
"pages": [
  { "id": 1, "label": "Energy",  "widgets": [] },
  { "id": 2, "label": "Lights",  "widgets": [] },
  { "id": 3, "label": "Cameras", "widgets": [] }
]
```

### Overlay page (page 0)

A page with `"id": 0` renders as a persistent overlay on top of all other pages. It does not appear in the navigation dots. Use it for always-on elements like clocks, connection status indicators, or navigation sidebars.

### Return to default

`return_to_default` (in the `device` block) sets how many seconds of inactivity before automatically returning to `default_page`. The timer resets on any touch, tap, or swipe. Set to `0` or omit to disable.

---

## Credentials & Security

HAven uses credentials in this order:

1. **Device config file**: `device.ha_token` (and optionally `device.ha_url`) in the device JSON. If present, this overrides anything previously saved on the device.
2. **URL parameter**: `ha_token` or `token`, optionally paired with `ha_url`.
3. **localStorage** (per device): set via the setup screen on first run, persists across reloads.
4. **Setup screen**: shown if no token is found anywhere.

The HA URL defaults to the page origin (`protocol + host`). No configuration needed when HAven is hosted inside HA's `www/` folder.

### What is and is not protected

Files in HA's `www/` folder (`/local/...`) are served **without authentication**. This is how all `www/` resources work in Home Assistant, not something specific to HAven. It means:

- The app files (`index.html`, `app.js`, `style.css`) are publicly readable. They contain no secrets and no credentials.
- Device config files (`devices/xxx.json`) are also publicly readable. By default they contain entity IDs and dashboard layout, but **no credentials**. Entity IDs are not secret in the same way passwords are, but they do reveal the structure of your home setup to anyone who can read the file.

This is acceptable on a local network where you trust everyone who can reach HA. For remote access, see below.

### Remote access (Nabu Casa, reverse proxy)

If your HA instance is accessible from the internet, the `www/` folder is too. Anyone with your HA URL can fetch your device JSON files. This has two practical implications:

- **Never leave a token embedded in a device JSON file** if your HA instance is remotely accessible. The token grants API-level access to Home Assistant. Once saved to localStorage on the device, remove it from the JSON immediately.
- **Entity IDs in your config will be visible** to anyone who finds the URL. This is generally low-risk but worth knowing.

The dashboard itself still requires a valid Long-Lived Access Token to connect to the WebSocket and do anything useful, so a public config file alone does not give an attacker control of your home. The token is the thing to protect.

### Use a restricted HA user for HAven

By default, Long-Lived Access Tokens inherit the permissions of the account that created them. If you create the token from an admin account, a leaked token has full HA access.

The recommended approach for any always-on dashboard is to create a dedicated HA user:

1. In Home Assistant, go to **Settings > People > Add Person**.
2. Create a new user (e.g. "HAven Dashboard") and set it to **non-admin**.
3. Log in as that user (or use the HA API) to generate the Long-Lived Access Token.
4. Use that token in HAven.

If that token is ever compromised, the blast radius is limited to whatever that non-admin user can control. You can revoke and reissue the token without affecting anything else.

### Embedding a token in the config (provisioning only)

Embedding a token is optional and intended only for provisioning a new tablet without physically touching it:

```json
{
  "device": {
    "ha_token": "your-long-lived-access-token",
    "ha_url":   "http://192.168.1.100:8123"
  }
}
```

Once the device has saved the token to localStorage, **remove it from the JSON file**. If your HA instance is accessible remotely, treat any window where the token is in the file as a potential exposure.

### Resetting credentials

Open the browser console on the device and run:

```javascript
localStorage.removeItem('haven_url');
localStorage.removeItem('haven_token');
location.reload();
```

---

## Connection Status

A small dot in the bottom-right corner shows WebSocket state:

- **Green**: connected and receiving live data
- **Amber**: connecting or reconnecting
- **Red**: disconnected (auto-retries every 5 seconds)

---

## Browser Compatibility

### Runtime (`index.html`)

HAven targets any browser that can reach your HA instance, including old tablets and budget devices. It is written in vanilla ES5 JavaScript with no framework dependencies and has been tested on ancient iPad Safaris, budget Android WebViews, and smart TV browsers.

### Designer (`designer.html`)

The designer is a desktop tool and has two requirements beyond a modern browser:

**Chrome or Edge recommended.** The File System Access API (used to save changes directly back to the config file on disk) requires Chrome or Edge 86+. Firefox can open and download files but cannot save directly back to disk. Use the **Download** button instead.

**HTTPS required.** Browsers restrict the File System Access API and certain other features to secure contexts. The designer must be opened over HTTPS. The simplest way to achieve this is via your Nabu Casa remote URL, which is always HTTPS:

```
https://your-instance.ui.nabu.casa/local/haven/designer.html
```

If you don't use Nabu Casa, your HA instance needs to be accessible over HTTPS, either through a reverse proxy or a self-signed certificate. Setting that up is outside the scope of HAven; the Home Assistant documentation covers the available options.

---

## Troubleshooting

### Connection indicator stays red

**Check the basics first:**
- Open the HA URL directly in the same browser tab. If it does not load, the problem is network or URL, not HAven.
- Confirm the long-lived access token was copied in full with no extra spaces.

**HTTP/HTTPS mismatch (most common cause):**
Browsers silently block WebSocket connections from an HTTPS page to an HTTP HA instance. If your dashboard is served over HTTPS (e.g. via Nabu Casa or a reverse proxy) but your HA URL is `http://192.168.x.x:8123`, the connection will fail silently.

Fix: use the same protocol for both, or access the dashboard over HTTP when connecting to a local HTTP HA instance.

**Check the browser console:**
Open developer tools (`F12`) then the Console tab. The failure reason will be there:

- `ERR_CONNECTION_REFUSED`: wrong IP or port
- `401`: token invalid or expired
- `Mixed Content`: HTTP/HTTPS mismatch (see above)

### Error overlay says AUTH ERROR or HTTP 401

Home Assistant is reachable, but it rejected the Long-Lived Access Token. Create a new token in your HA profile and save it through the setup screen.

If the overlay says **Credential source: device config**, update or remove `device.ha_token` in the device JSON because it overrides the token saved on the Kindle. If it says **Credential source: localStorage**, save the new token on the setup screen or clear the stored credentials and reload.

If the overlay says **REST AUTH WARNING**, HAven saw a `401` or `403` from a REST request and is waiting for the WebSocket login to confirm whether the token is actually bad. If the dashboard connects, the warning can be ignored; if WebSocket returns `auth_invalid`, issue a new token.

If Home Assistant denies the optional `haven_command` event listener, HAven silently disables remote dashboard commands and keeps the main dashboard running. Normal state updates can still work.

### Setup screen appears on every load

The setup screen saves credentials to `localStorage` for the specific page URL. If you access HAven from a different URL (e.g. IP vs hostname, or HTTP vs HTTPS), the browser treats it as a different origin and won't find the stored credentials.

### Fonts look wrong on first load

HAven bundles Material Design Icons locally in the `fonts/` folder and they work offline. If icons appear as squares or question marks, check that the `fonts/` folder was copied correctly alongside `index.html`.
