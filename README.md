# Klimaatklok

Monthly temperature anomalies for Uccle (Ukkel), Belgium, drawn as a ring of clocks: one clock per year from 2015 to 2040, one cone per month. A cone pointing outward means warmer than the 1991–2020 normal.

**Live:** https://gulpembecolak-dev.github.io/klimaatklok/

![Klimaatklok: the 2026 clock, with the hand on the current month](docs/screenshot.jpg)

## What it shows

- **Measured (2015 → last full month):** ERA5 reanalysis via the [Open-Meteo Archive API](https://open-meteo.com/en/docs/historical-weather-api).
- **Projected (after that → 2040):** one CMIP6 HighResMIP model run (EC-Earth3P-HR) via the [Open-Meteo Climate API](https://open-meteo.com/en/docs/climate-api). A single model run gives a plausible path, not a forecast for any specific month.
- **Anomaly:** the monthly mean minus the KMI normal for 1991–2020.

## Updates

The measured data refreshes itself. On the 3rd of every month, a GitHub Action (`.github/workflows/update-data.yml`) runs `scripts/update-data.mjs`. The script fetches daily means from Open-Meteo, keeps only complete months, rewrites the measured block in `data.js` and commits the change. GitHub Pages then redeploys.

To run it by hand:

```sh
node scripts/update-data.mjs
```

The script needs Node 18 or newer and has no dependencies.

## Stack

Plain HTML, CSS and JavaScript with [Three.js](https://threejs.org) loaded through an import map. There is no build step. Any static server works:

```sh
python3 -m http.server
```

## Controls

- Drag to rotate.
- Scroll to move between years.
- Click a year to type one in.
- Click a month for its detail page.
- `S` stacks all the years.
- `I` opens background information.
