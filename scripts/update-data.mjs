// Schrijft data/klimaat.json voor Ukkel (50.79°N, 4.36°E):
//   gemeten   — maandanomalieën uit ERA5 (Open-Meteo Archive), alleen volledige maanden
//   projectie — maandanomalieën uit CMIP6 EC-Earth3P-HR (Open-Meteo Climate API)
// Anomalie = maandgemiddelde − normaal 1991–2020 van DEZELFDE bron:
//   gemeten   t.o.v. ERA5 1991–2020 (zelfde rastercel)
//   projectie t.o.v. het eigen 1991–2020-klimaat van het model (haalt de modelbias weg)
// Bewust models=era5: de standaardmix (best_match) wisselt voor recente maanden
// van model, wat tot 0,8 °C verschil gaf met weerstation Ukkel.
// De lopende maand haalt de browser zelf live op (zie data.js).
// Geen dependencies: node scripts/update-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const LAT = 50.79, LON = 4.36, VAN = 2015, TOT = 2040;
const dagenIn = (j, m) => new Date(Date.UTC(j, m + 1, 0)).getUTCDate();
const rond = v => Math.round(v * 10) / 10;

async function haal(url) {
  for (let poging = 1; poging <= 3; poging++) {
    const res = await fetch(url);
    if (res.ok) return (await res.json()).daily;
    if (poging === 3) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
    await new Promise(r => setTimeout(r, 5000 * poging));
  }
}

// Normaal 1991–2020 per kalendermaand (°C, 2 decimalen)
function normaal(daily, sleutel) {
  const som = Array(12).fill(0), n = Array(12).fill(0);
  daily.time.forEach((t, i) => {
    const v = daily[sleutel][i];
    if (v == null || t < '1991' || t >= '2021') return;
    const m = +t.slice(5, 7) - 1; som[m] += v; n[m]++;
  });
  return som.map((x, m) => Math.round(x / n[m] * 100) / 100);
}

// Daggemiddelden → { jaar: [12 anomalieën] }; onvolledige maanden blijven null
function perMaand(daily, sleutel, volledigVereist, NORM, vanJaar) {
  const som = {}, n = {};
  daily.time.forEach((t, i) => {
    const v = daily[sleutel][i];
    if (v == null) return;
    const k = t.slice(0, 7);
    som[k] = (som[k] || 0) + v; n[k] = (n[k] || 0) + 1;
  });
  const rijen = {};
  for (const k of Object.keys(n).sort()) {
    const j = +k.slice(0, 4), m = +k.slice(5) - 1;
    if (j < vanJaar) continue;
    if (volledigVereist && n[k] < dagenIn(j, m)) continue;
    (rijen[j] ||= Array(12).fill(null))[m] = rond(som[k] / n[k] - NORM[m]);
  }
  return rijen;
}

const gisteren = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const basis = `latitude=${LAT}&longitude=${LON}&daily=temperature_2m_mean&timezone=Europe%2FBrussels`;

const K = 'temperature_2m_mean';
const era5 = await haal(
  `https://archive-api.open-meteo.com/v1/archive?${basis}&models=era5&start_date=1991-01-01&end_date=${gisteren}`);
const model = await haal(
  `https://climate-api.open-meteo.com/v1/climate?${basis}&models=EC_Earth3P_HR&start_date=1991-01-01&end_date=${TOT}-12-31`);

const NORM = normaal(era5, K);
const NORM_MODEL = normaal(model, K);
const gemeten = perMaand(era5, K, true, NORM, VAN);
const projectie = perMaand(model, K, false, NORM_MODEL, VAN);

let laatsteMaand = null;
for (const j of Object.keys(gemeten)) gemeten[j].forEach((v, m) => {
  if (v != null) laatsteMaand = `${j}-${String(m + 1).padStart(2, '0')}`;
});

const rij = r => '[' + r.map(v => v == null ? 'null' : v).join(', ') + ']';
const blok = naam => obj => `  "${naam}": {\n` + Object.keys(obj).sort()
  .map(j => `    "${j}": ${rij(obj[j])}`).join(',\n') + '\n  }';

const inhoud = (bijgewerkt) => '{\n'
  + `  "bijgewerkt": "${bijgewerkt}",\n`
  + `  "plaats": "Ukkel, 50.79°N 4.36°E",\n`
  + `  "bron": "ERA5 (Open-Meteo, models=era5) · CMIP6 EC-Earth3P-HR",\n`
  + `  "norm": ${rij(NORM)},\n`
  + `  "normModel": ${rij(NORM_MODEL)},\n`
  + `  "laatsteMaand": "${laatsteMaand}",\n`
  + blok('gemeten')(gemeten) + ',\n'
  + blok('projectie')(projectie) + '\n}\n';

const pad = new URL('../data/klimaat.json', import.meta.url);
let oud = ''; try { oud = readFileSync(pad, 'utf8'); } catch {}
// Alleen de datum veranderd? Dan niets schrijven (geen lege commits).
const zonderDatum = s => s.replace(/"bijgewerkt": "[^"]*"/, '');
if (oud && zonderDatum(oud) === zonderDatum(inhoud(''))) { console.log('Geen wijzigingen.'); process.exit(0); }
writeFileSync(pad, inhoud(new Date().toISOString().slice(0, 10)));
console.log(`data/klimaat.json bijgewerkt — laatste volledige maand: ${laatsteMaand}`);
