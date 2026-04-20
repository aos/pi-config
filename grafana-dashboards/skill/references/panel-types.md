# Panel Type Reference

Templates for common Grafana panel types. Replace `<placeholders>` with actual values.

**Shortcut:** Fetch an existing dashboard that has the panel type you need and use it as a template — often faster and more accurate than building from scratch.

## Grid Positioning

All panels use `gridPos` on a 24-column grid:

```json
{
  "gridPos": {
    "h": 8, // height in grid units
    "w": 12, // width (24 = full, 12 = half)
    "x": 0, // column (0-23)
    "y": 0 // row (auto-increments)
  }
}
```

## Row (Section Divider)

```json
{
  "id": <unique-int>,
  "type": "row",
  "title": "Section Name",
  "gridPos": { "h": 1, "w": 24, "x": 0, "y": <row> },
  "collapsed": false
}
```

## Stat Panel

Big single-value display with optional sparkline.

```json
{
  "id": <unique-int>,
  "type": "stat",
  "title": "Panel Title",
  "description": "Tooltip description",
  "datasource": { "type": "prometheus", "uid": "<datasource-uid>" },
  "gridPos": { "h": 6, "w": 6, "x": 0, "y": 0 },
  "fieldConfig": {
    "defaults": {
      "color": { "mode": "thresholds" },
      "unit": "s",
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "color": "green", "value": 0 },
          { "color": "yellow", "value": 60 },
          { "color": "red", "value": 120 }
        ]
      }
    }
  },
  "options": {
    "colorMode": "value",
    "graphMode": "area",
    "reduceOptions": { "calcs": ["lastNotNull"], "fields": "", "values": false }
  },
  "targets": [{
    "datasource": { "type": "prometheus", "uid": "<datasource-uid>" },
    "editorMode": "code",
    "expr": "<promql>",
    "instant": true,
    "range": false,
    "legendFormat": "Label",
    "refId": "A"
  }]
}
```

- For sparklines: set `"graphMode": "area"` and change target to `"instant": false, "range": true`
- For just the number: set `"graphMode": "none"`
- Common `calcs`: `lastNotNull`, `mean`, `max`, `min`, `sum`, `count`, `range`
- Common `unit` values: `s` (seconds), `percentunit` (0-1 as %), `bytes`, `short` (plain number), `none`

## Time Series Panel

Line/area chart over time.

```json
{
  "id": <unique-int>,
  "type": "timeseries",
  "title": "Panel Title",
  "datasource": { "type": "prometheus", "uid": "<datasource-uid>" },
  "gridPos": { "h": 10, "w": 12, "x": 0, "y": 0 },
  "fieldConfig": {
    "defaults": {
      "color": { "mode": "palette-classic" },
      "unit": "s",
      "custom": {
        "drawStyle": "line",
        "lineInterpolation": "stepAfter",
        "lineWidth": 2,
        "fillOpacity": 15,
        "gradientMode": "scheme",
        "showPoints": "never",
        "spanNulls": false,
        "thresholdsStyle": { "mode": "dashed" }
      },
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "color": "green", "value": 0 },
          { "color": "red", "value": 100 }
        ]
      }
    },
    "overrides": []
  },
  "options": {
    "legend": {
      "calcs": ["mean", "max"],
      "displayMode": "table",
      "placement": "right",
      "showLegend": true
    },
    "tooltip": { "mode": "multi", "sort": "desc" }
  },
  "targets": [{
    "datasource": { "type": "prometheus", "uid": "<datasource-uid>" },
    "editorMode": "code",
    "expr": "<promql>",
    "instant": false,
    "range": true,
    "legendFormat": "{{label}}",
    "refId": "A"
  }]
}
```

### Color overrides for specific series

Add to `fieldConfig.overrides`:

```json
{
  "matcher": { "id": "byName", "options": "Series Name" },
  "properties": [
    { "id": "color", "value": { "fixedColor": "red", "mode": "fixed" } }
  ]
}
```

## Bar Gauge Panel

Horizontal bars comparing values.

```json
{
  "id": <unique-int>,
  "type": "bargauge",
  "title": "Panel Title",
  "datasource": { "type": "prometheus", "uid": "<datasource-uid>" },
  "gridPos": { "h": 10, "w": 12, "x": 0, "y": 0 },
  "fieldConfig": {
    "defaults": {
      "color": { "mode": "thresholds" },
      "unit": "s",
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "color": "green", "value": 0 },
          { "color": "yellow", "value": 60 },
          { "color": "red", "value": 120 }
        ]
      }
    }
  },
  "options": {
    "displayMode": "gradient",
    "orientation": "horizontal",
    "reduceOptions": { "calcs": ["lastNotNull"], "fields": "", "values": false },
    "showUnfilled": true
  },
  "targets": [{
    "datasource": { "type": "prometheus", "uid": "<datasource-uid>" },
    "editorMode": "code",
    "expr": "<promql>",
    "instant": true,
    "range": false,
    "legendFormat": "{{pod}}",
    "refId": "A"
  }]
}
```

## Table Panel

```json
{
  "id": <unique-int>,
  "type": "table",
  "title": "Panel Title",
  "datasource": { "type": "prometheus", "uid": "<datasource-uid>" },
  "gridPos": { "h": 10, "w": 12, "x": 0, "y": 0 },
  "fieldConfig": {
    "defaults": { "unit": "s" },
    "overrides": []
  },
  "options": {
    "showHeader": true,
    "sortBy": [{ "displayName": "Value", "desc": true }]
  },
  "targets": [{
    "datasource": { "type": "prometheus", "uid": "<datasource-uid>" },
    "editorMode": "code",
    "expr": "<promql>",
    "instant": true,
    "range": false,
    "format": "table",
    "refId": "A"
  }]
}
```
