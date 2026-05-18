/* ----- Klimaatklok 3D — data (Open-Meteo) -----
 * Maandelijkse temperatuuranomalieën Ukkel (50.79°N, 4.36°E)
 * Anomalie = maandgemiddelde − klimaatnorm 1991-2020.
 *
 * Bronnen:
 *   • ERA5 reanalyse via Open-Meteo Archive API
 *   • CMIP6 HighResMIP (model EC_Earth3P_HR) via Open-Meteo Climate API
 *
 * Klimaatnorm 1991-2020 (Jan→Dec, °C): 3.27, 3.72, 6.34, 9.51, 13.18, 16.10, 18.15, 17.96, 14.89, 11.19, 6.95, 3.94
 */

const HISTORISCH = {
  2015: [ -0.3,  -0.9,  -0.5,  -0.5,  -0.9,  -0.0,   0.5,   1.1,  -1.5,  -1.0,   2.7,   5.1],
  2016: [  1.3,   0.5,  -1.4,  -1.1,   0.6,   0.3,   0.1,   0.4,   3.0,  -0.9,  -0.9,   0.3],
  2017: [ -2.5,   2.1,   2.5,  -1.3,   1.8,   2.8,   0.2,  -0.1,  -0.8,   2.1,  -0.4,   0.3],
  2018: [  2.4,  -3.3,  -1.3,   2.7,   2.3,   1.3,   3.5,   1.3,   0.2,   1.3,   0.4,   1.7],
  2019: [ -0.5,   2.5,   1.6,   0.7,  -1.6,   2.1,   1.1,   1.1,   0.2,   1.0,  -0.5,   1.7],
  2020: [  2.3,   3.1,   0.2,   2.4,   0.5,   1.1,  -0.9,   2.8,   1.4,   0.2,   2.1,   1.5],
  2021: [ -0.5,   1.2,   0.1,  -3.1,  -2.0,   1.9,  -0.6,  -1.4,   1.4,   0.2,  -1.0,   1.4],
  2022: [  0.5,   2.4,   1.3,   0.1,   1.6,   1.2,   0.9,   3.1,   0.1,   2.9,   2.0,  -0.3],
  2023: [  1.6,   1.4,   0.7,  -1.1,  -0.1,   3.8,   0.2,  -0.0,   3.8,   2.3,   0.6,   2.5],
  2024: [ -0.2,   4.2,   2.3,   1.0,   1.2,  -0.7,   0.1,   1.5,   0.6,   1.3,   0.3,   1.4],
  2025: [ -0.8,   0.4,   1.3,   2.7,   1.8,   3.1,   1.4,   1.6,   0.9,   0.9,   1.1,   2.0],
  2026: [  0.5,   3.5,   2.3,   2.0,  -1.2, null, null, null, null, null, null, null],
};

const VOORSPELLING = {
  2027: [  0.5,   1.2,  -0.8,  -1.5,   0.1,   0.7,  -0.7,   0.4,   5.1,   0.9,   1.4,   3.5],
  2028: [ -0.3,   2.2,   1.5,   0.3,  -0.2,   1.7,  -0.9,   1.3,   1.2,   0.9,  -1.3,   2.6],
  2029: [  0.2,   1.7,  -1.4,  -0.4,   0.7,  -0.0,   0.9,   0.4,   1.1,   1.0,   0.6,   2.8],
  2030: [  3.3,  -0.6,   2.1,  -0.3,   0.5,   3.9,   3.0,   2.7,   4.9,   2.5,  -0.3,   6.0],
  2031: [  1.6,   1.6,   2.0,   1.0,   1.9,   0.1,   2.9,   1.2,   1.5,   0.5,   2.3,   0.8],
  2032: [  4.6,   0.2,  -4.0,   0.4,   1.2,  -0.2,  -1.5,   1.9,   1.9,   0.5,   1.2,   0.2],
  2033: [ -1.1,  -0.6,  -0.7,   2.5,   2.6,   0.1,  -1.0,   0.9,   0.2,  -0.6,   2.0,  -2.5],
  2034: [  1.1,  -0.4,   0.8,   0.7,   0.7,   3.5,   0.5,   2.1,  -1.2,   2.3,  -2.5,   0.9],
  2035: [ -1.8,  -4.7,   2.1,   2.0,   0.3,   1.6,   0.5,   3.7,   0.7,   1.1,  -0.9,  -3.9],
  2036: [ -0.2,   3.5,   0.4,  -1.0,   2.2,   0.4,   0.6,   0.4,   1.6,  -0.4,  -1.1,   0.0],
  2037: [ -3.8,  -0.5,   0.6,   2.1,   2.7,   1.1,   2.7,   4.2,   5.5,  -0.7,   1.5,   0.0],
  2038: [  3.3,   0.1,   1.5,  -0.3,  -1.7,   1.3,   1.0,   0.1,   2.5,   0.4,   0.6,  -3.2],
  2039: [ -1.0,   2.1,  -0.3,   1.9,   1.5,  -1.5,  -1.1,   0.3,   0.9,   2.3,  -0.1,   1.9],
  2040: [  2.8,   3.2,  -1.0,   3.4,   0.2,   1.7,   2.0,   5.2,   4.4,  -1.0,   1.1,  -1.7],
};

const KLIMAATNORM_1991_2020 = [3.27, 3.72, 6.34, 9.51, 13.18, 16.10, 18.15, 17.96, 14.89, 11.19, 6.95, 3.94];  // Jan→Dec, °C

const DATA = { ...HISTORISCH, ...VOORSPELLING };
const JAAR_MIN = 2015;
const JAAR_MAX = 2040;
const LAATSTE_GEMETEN_JAAR = 2026;

const MAANDEN = ["JAN","FEB","MAA","APR","MEI","JUN","JUL","AUG","SEP","OKT","NOV","DEC"];
const MAANDEN_VOL = ["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"];

// Huidige real-world moment voor de wijzer (update als nodig)
const HUIDIGE_MAAND_INDEX = 4;  // Mei
const HUIDIG_JAAR = 2026;

function isVoorspelling(year) { return year > LAATSTE_GEMETEN_JAAR; }

function maandReeks(monthIdx) {
  const reeks = [];
  for (let y = JAAR_MIN; y <= JAAR_MAX; y++) {
    const row = DATA[y] || [];
    reeks.push({ year: y, anomaly: row[monthIdx], voorspelling: isVoorspelling(y) });
  }
  return reeks;
}

export {
  DATA, HISTORISCH, VOORSPELLING, KLIMAATNORM_1991_2020,
  JAAR_MIN, JAAR_MAX, LAATSTE_GEMETEN_JAAR,
  HUIDIGE_MAAND_INDEX, HUIDIG_JAAR,
  MAANDEN, MAANDEN_VOL,
  isVoorspelling, maandReeks
};

