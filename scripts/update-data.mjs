// Schrijft data/klimaat.json voor Ukkel (50.79°N, 4.36°E):
//   gemeten   — maandanomalieën uit ERA5 (Open-Meteo Archive), alleen volledige maanden
//   projectie — maandanomalieën uit CMIP6 EC-Earth3P-HR (Open-Meteo Climate API)
// Anomalie = maandgemiddelde − KMI-klimaatnorm 1991–2020.
// De lopende maand haalt de browser zelf live op (zie data.js).
// Geen dependencies: node scripts/update-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const LAT = 50.79, LON = 4.36, VAN = 2015, TOT = 2040;
const NORM = [3.27, 3.72, 6.34, 9.51, 13.18, 16.10, 18.15, 17.96, 14.89, 11.19, 6.95, 3.94];
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

// Daggemiddelden → { jaar: [12 anomalieën] }; onvolledige maanden blijven null
function perMaand(daily, sleutel, volledigVereist) {
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
    if (volledigVereist && n[k] < dagenIn(j, m)) continue;
    (rijen[j] ||= Array(12).fill(null))[m] = rond(som[k] / n[k] - NORM[m]);
  }
  return rijen;
}

const gisteren = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const basis = `latitude=${LAT}&longitude=${LON}&daily=temperature_2m_mean&timezone=Europe%2FBrussels`;

const gemeten = perMaand(await haal(
  `https://archive-api.open-meteo.com/v1/archive?${basis}&start_date=${VAN}-01-01&end_date=${gisteren}`
), 'temperature_2m_mean', true);

const projectie = perMaand(await haal(
  `https://climate-api.open-meteo.com/v1/climate?${basis}&models=EC_Earth3P_HR&start_date=${VAN}-01-01&end_date=${TOT}-12-31`
), 'temperature_2m_mean', false);

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
  + `  "norm": ${rij(NORM)},\n`
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
