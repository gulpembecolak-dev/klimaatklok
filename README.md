# Klimaatklok

Monthly temperature anomalies for Uccle (Ukkel), Belgium, drawn as a ring of clocks: one clock per year from 2015 to 2040, one cone per month. A cone pointing outward means warmer than the 1991–2020 normal.

**Live:** https://gulpembecolak-dev.github.io/klimaatklok/

![Klimaatklok: the 2026 clock, with the hand on the current month](docs/screenshot.jpg)

## What it shows

Each cone is one month. It leans outward and toward you when the month was warmer than normal, and inward and away when it was colder. Its length is the anomaly in °C, and the small number under each month label gives the exact value.

- **Measured (2015 → last complete month):** ERA5 reanalysis via the [Open-Meteo Archive API](https://open-meteo.com/en/docs/historical-weather-api).
- **Current year:** only months that have ended are shown. The running month and the months after it stay empty until their anomaly is known.
- **Future years (projection):** one CMIP6 HighResMIP model run (EC-Earth3P-HR) via the [Open-Meteo Climate API](https://open-meteo.com/en/docs/climate-api), marked `≈`. A single model run gives a plausible path, not a forecast for a specific month.

The anomaly is the monthly mean minus the 1991–2020 normal of the same source. Measured months are compared with ERA5 1991–2020, and the projection with the model's own 1991–2020 climate, which removes the model's bias of up to 0.9 °C. Measured values use `models=era5` explicitly. Checked against the Uccle weather station (Meteostat 06447), they differ by 0.18 °C on average over 124 months.

## How it stays current

1. **Monthly.** On the 3rd of every month a GitHub Action (`.github/workflows/update-data.yml`) runs `scripts/update-data.mjs`. The script rewrites `data/klimaat.json` and commits only when something changed. GitHub Pages then redeploys.
2. **On load.** `data.js` fetches the JSON with `cache: 'no-cache'`, so visitors never see an old copy. If a month has just ended but isn't in the JSON yet, the browser fetches that complete month from Open-Meteo itself.
3. **New year.** On 1 January the hand moves to the new year's clock, which starts empty. January appears once it has ended, in early February, and the other months follow one by one.

To test another date, add `?nu=2027-01-02` to the URL.

To run the update by hand:

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
