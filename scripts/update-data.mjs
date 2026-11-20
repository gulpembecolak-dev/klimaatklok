// Haalt de dagtemperaturen van Ukkel op bij Open-Meteo (ERA5) en schrijft
// de maandanomalieën (t.o.v. 1991–2020) in het HISTORISCH-blok van data.js.
// Alleen volledige maanden. Geen dependencies: node scripts/update-data.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const LAT = 50.79, LON = 4.36, VAN = 2015;
const NORM = [3.27, 3.72, 6.34, 9.51, 13.18, 16.10, 18.15, 17.96, 14.89, 11.19, 6.95, 3.94];
const dagen = (j, m) => new Date(Date.UTC(j, m + 1, 0)).getUTCDate();

const gisteren = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${LAT}&longitude=${LON}`
  + `&start_date=${VAN}-01-01&end_date=${gisteren}&daily=temperature_2m_mean&timezone=Europe%2FBrussels`;

const res = await fetch(url);
if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
const { daily } = await res.json();

const som = {}, n = {};
daily.time.forEach((t, i) => {
  const v = daily.temperature_2m_mean[i];
  if (v == null) return;
  const k = t.slice(0, 7);
  som[k] = (som[k] || 0) + v; n[k] = (n[k] || 0) + 1;
});

const rijen = {};
for (const k of Object.keys(n)) {
  const j = +k.slice(0, 4), m = +k.slice(5) - 1;
  if (n[k] < dagen(j, m)) continue;                  // maand nog niet volledig
  (rijen[j] ||= Array(12).fill(null))[m] = Math.round((som[k] / n[k] - NORM[m]) * 10) / 10;
}

const fmt = v => (v == null ? 'null' : v.toFixed(1)).padStart(5);
const blok = 'const HISTORISCH = {\n'
  + Object.keys(rijen).sort().map(j => `  ${j}: [${rijen[j].map(fmt).join(', ')}],`).join('\n')
  + '\n};';

const pad = new URL('../data.js', import.meta.url);
const bron = readFileSync(pad, 'utf8');
const nieuw = bron.replace(/(\/\/ @gemeten:start.*\n)[\s\S]*?(\n\/\/ @gemeten:end)/, `$1${blok}$2`);
if (nieuw === bron) { console.log('Geen wijzigingen.'); process.exit(0); }
writeFileSync(pad, nieuw);
const laatste = Object.keys(n).filter(k => n[k] >= dagen(+k.slice(0, 4), +k.slice(5) - 1)).sort().pop();
console.log(`data.js bijgewerkt — laatste volledige maand: ${laatste}`);
