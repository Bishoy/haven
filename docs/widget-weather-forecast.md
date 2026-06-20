# Widget: weather_forecast

The weather_forecast widget displays a multi-slot forecast strip from a Home Assistant weather entity. Each slot shows a condition icon and day/time label. An optional chart area can display one or more data series (temperature lines, precipitation bars, etc.) with a configurable legend. An optional extra row shows per-slot metric values below the chart.

---

## Contents

- [Minimal Example](#minimal-example)
- [Properties](#properties)
- [Slots and Layout](#slots-and-layout)
- [Label Format](#label-format)
- [Icons](#icons)
- [Chart and Series](#chart-and-series)
- [Series Scale: min and max](#series-scale-min-and-max)
- [Legend](#legend)
- [Extra Row](#extra-row)
- [Dividers](#dividers)
- [Colors](#colors)
- [Examples](#examples)

---

## Minimal Example

```json
{
  "id": "forecast",
  "type": "weather_forecast",
  "x": 10, "y": 10, "w": 1004, "h": 200,
  "entity": "weather.forecast_home"
}
```

With no further config this renders 6 daily slots, each showing a condition icon and day label. No chart or extra row.

---

## Properties

| Property | Default | Description |
|----------|---------|-------------|
| `entity` | required | HA weather entity ID |
| `forecast_type` | `daily` | `daily` or `hourly` |
| `slots` | `6` | Number of forecast periods to show |
| `background` | `surface` | Widget background color (theme token or hex) |
| `radius` | `8` | Corner radius in px |
| `show_labels` | `true` | Show day/time labels at the top of each slot |
| `show_icons` | `true` | Show condition icons below labels |
| `show_chart` | `true` | Show the chart area |
| `show_legend` | `false` | Show an interactive legend below the chart |
| `label_format` | `day` | Format for slot header labels (see [Label Format](#label-format)) |
| `label_color` | `text_muted` | Color for slot header labels |
| `icon_color` | `text` | Color for condition icons |
| `condition_images` | none | Optional map of HA condition strings to bitmap image paths. When a condition has a matching image, that image is used instead of the MDI icon. Add a `default` key for unknown conditions. |
| `condition_image_scale` | `0.72` | Image size multiplier relative to the icon row height. |
| `dividers` | `true` | Show vertical dividers between slots |
| `divider_color` | `surface2` | Divider color |
| `extra_row` | `[]` | Array of metric keys to display below the chart (see [Extra Row](#extra-row)) |
| `extra_row_icons` | `true` | Set to `false` to hide the small MDI prefixes in extra metric rows. The `condition` extra row still renders the condition icon/image. |
| `extra_row_color` | `text_muted` | Color for extra row values |
| `series` | `[]` | Array of chart series (see [Chart and Series](#chart-and-series)) |
| `refresh_interval` | `1800` | How often to re-fetch forecast data in seconds |
| `forecast_scale` | `1` | Scales all internal sizing (font sizes, row heights, icon sizes). Use values above `1` to make the widget larger on high-resolution screens, below `1` to compact it. |

---

## Slots and Layout

The widget divides its full width evenly into `slots` columns. Each slot corresponds to one forecast period. The layout stacks vertically:

```
┌─────────────────────────────┐
│  Labels row  (show_labels)  │
│  Icons row   (show_icons)   │
│  Chart area  (show_chart)   │
│  Legend row  (show_legend)  │
│  Extra row   (extra_row)    │
└─────────────────────────────┘
```

The chart takes all remaining height after labels, icons, legend, and extra row are allocated. If all rows are enabled and the widget is too short, the chart shrinks first.

---

## Label Format

The `label_format` property controls the slot header text:

| Value | Example | Notes |
|-------|---------|-------|
| `day` | Monday | Full day name. Default for daily forecasts. |
| `day_short` | Mon | Abbreviated day name. |
| `date` | 2 Apr | Day number and short month name. |
| `time` | 14:00 | 24-hour time. Default for hourly forecasts. |

For hourly forecasts set `forecast_type: "hourly"` and `label_format: "time"`.

---

## Icons

Condition icons use MDI weather icons mapped from HA condition strings (`sunny`, `rainy`, `cloudy`, etc.). Unknown conditions fall back to `mdi:weather-<condition>`. The `icon_color` property controls all MDI condition icons.

For browsers that struggle with icon fonts or SVG, provide bitmap image paths with `condition_images`:

```json
"condition_images": {
  "sunny": "images/weather/clear-day.png",
  "clear-night": "images/weather/clear-night.png",
  "cloudy": "images/weather/cloudy.png",
  "partlycloudy": "images/weather/partly-cloudy-day.png",
  "rainy": "images/weather/rain.png",
  "default": "images/weather/cloudy.png"
}
```

Only conditions listed in the map use images. Conditions not listed continue to use MDI unless `default` is set.

---

## Chart and Series

The chart is configured via the `series` array. Each entry defines one data series:

```json
"series": [
  { "metric": "precipitation", "style": "bar",        "color": "#5B9BD5", "label": "Rain" },
  { "metric": "templow",       "style": "line_dashed", "color": "primary", "label": "Low" },
  { "metric": "temperature",   "style": "line",        "color": "warning", "label": "High" }
]
```

### Series properties

| Property | Default | Description |
|----------|---------|-------------|
| `metric` | required | Forecast attribute key (see supported metrics below) |
| `style` | `line` | `line`, `line_dashed`, or `bar` |
| `color` | `primary` | Series color as a theme token or hex value |
| `label` | auto | Legend label. If omitted, auto-generated from the metric key. |
| `min` | auto | Pin the bottom of the Y axis to this value |
| `max` | auto | Pin the top of the Y axis to this value |
| `hidden` | `false` | Start hidden (can be toggled via legend) |

### Supported metrics

| Metric | Description |
|--------|-------------|
| `temperature` | High temperature |
| `templow` | Low temperature |
| `precipitation` | Precipitation amount (mm) |
| `wind_speed` | Wind speed (km/h) |
| `wind_bearing` | Wind direction (degrees) |
| `humidity` | Relative humidity (%) |
| `uv_index` | UV index |

### Y axis scaling

`temperature` and `templow` always share the same Y axis scale so their lines are positioned correctly relative to each other. All other metrics scale independently to fill the chart height.

Bars are always rendered behind line series regardless of array order.

---

## Series Scale: min and max

By default, all series auto-scale to fit their data. Use `min` and `max` to pin the axis range:

```json
{ "metric": "humidity", "style": "line", "color": "primary", "min": 0, "max": 100 }
```

Humidity will always show 0-100% on the Y axis regardless of the actual values.

```json
{ "metric": "uv_index", "style": "line", "color": "warning", "max": 11 }
```

UV index is pinned at a maximum of 11 (the WHO scale), bottom auto-scales.

For **temperature and templow** the shared scale auto-scaling works well year-round since the meaningful information is the relative change between days, not absolute position. Setting `min`/`max` on temperature flattens the line in seasons where temps stay in a narrow part of the fixed range.

Values that exceed a specified `max` are clamped to the chart top edge. Values below a specified `min` are clamped to the bottom edge.

---

## Legend

Set `show_legend: true` to display a legend row below the chart. Each series entry appears as a colored indicator matching its style, plus its label.

Tapping a legend item hides that series from the chart and dims the legend item to 35% opacity. Tapping again restores it. Hidden state is in-memory only and resets on page navigation.

Use `"hidden": true` on a series entry to start it hidden by default:

```json
{ "metric": "wind_speed", "style": "line", "color": "text_muted", "label": "Wind", "hidden": true }
```

This is useful for a chart with many series where only the most important ones should show initially.

---

## Extra Row

The `extra_row` array adds one or more metric rows below the chart, showing a per-slot value with an icon:

```json
"extra_row": ["precipitation", "wind_speed", "uv_index", "humidity"]
```

Each metric in the array becomes one row. Supported metrics:

| Metric | Icon | Format |
|--------|------|--------|
| `precipitation` | water drop | `4.6mm` |
| `wind_speed` | windy | `13km/h` |
| `wind_bearing` | compass | `247°` |
| `humidity` | water percent | `73%` |
| `uv_index` | sun | `5` |
| `temperature` | thermometer up | `19°` |
| `templow` | thermometer down | `14°` |
| `condition` | condition icon | MDI icon |

Row height auto-scales based on how many items are in the array: fewer items get more space each.

---

## Dividers

`dividers: true` (default) draws a vertical line between each slot. The line runs from the top of the widget through the chart and continues between extra row cells. Set `divider_color` to control the color.

Set `dividers: false` to remove all dividers.

---

## Colors

All color properties accept theme tokens or hex strings:

| Property | Default | What it colors |
|----------|---------|----------------|
| `background` | `surface` | Widget background |
| `label_color` | `text_muted` | Slot header labels |
| `icon_color` | `text` | Condition icons |
| `divider_color` | `surface2` | Slot dividers |
| `extra_row_color` | `text_muted` | Extra row values and icons |

Series colors are set per-series in the `series` array.

---

## Examples

### Temperature and precipitation

```json
{
  "id": "forecast",
  "type": "weather_forecast",
  "x": 10, "y": 10, "w": 1004, "h": 400,
  "entity": "weather.forecast_home",
  "forecast_type": "daily",
  "slots": 6,
  "background": "surface",
  "radius": 10,
  "series": [
    { "metric": "precipitation", "style": "bar",        "color": "#5B9BD5", "label": "Rain" },
    { "metric": "templow",       "style": "line_dashed", "color": "primary", "label": "Low" },
    { "metric": "temperature",   "style": "line",        "color": "warning", "label": "High" }
  ],
  "show_legend": true,
  "extra_row": ["precipitation", "wind_speed", "humidity"],
  "label_format": "day",
  "dividers": true
}
```

### Busy chart with hidden series

```json
{
  "id": "forecast_full",
  "type": "weather_forecast",
  "x": 10, "y": 10, "w": 1004, "h": 500,
  "entity": "weather.forecast_home",
  "slots": 7,
  "series": [
    { "metric": "precipitation", "style": "bar",        "color": "#5B9BD5", "label": "Rain",     "max": 50 },
    { "metric": "humidity",      "style": "line",        "color": "text_muted", "label": "Humidity", "min": 0, "max": 100, "hidden": true },
    { "metric": "uv_index",      "style": "line",        "color": "warning",  "label": "UV",       "max": 11, "hidden": true },
    { "metric": "templow",       "style": "line_dashed", "color": "primary",  "label": "Low" },
    { "metric": "temperature",   "style": "line",        "color": "warning",  "label": "High" }
  ],
  "show_legend": true,
  "extra_row": ["precipitation", "wind_speed", "uv_index", "humidity"],
  "label_format": "day_short"
}
```

### Icons and extra row only (no chart)

```json
{
  "id": "forecast_simple",
  "type": "weather_forecast",
  "x": 10, "y": 10, "w": 1004, "h": 160,
  "entity": "weather.forecast_home",
  "slots": 6,
  "show_chart": false,
  "extra_row": ["temperature", "templow", "precipitation"],
  "label_format": "day_short",
  "dividers": true
}
```
