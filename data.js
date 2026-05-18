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

// =====================================================
//  VERHALEN — month-specific narrative templates (NL)
// =====================================================
const MAAND_CONTEXT = [
  // JAN
  { seizoen: 'winter', norm: 3.27, context: 'Januari zet de toon voor het winterseizoen. In Ukkel bepaalt deze maand vaak of het jaar mild of streng begint. Zachte januari\'s worden steeds gebruikelijker — het KMI meet sinds 1954 een opwarming van +0,3 °C per decennium.' },
  // FEB
  { seizoen: 'winter', norm: 3.72, context: 'Februari is traditioneel de koudste maand in België, maar de winters worden merkbaar milder. De sneeuwdagen in Ukkel zijn gedaald van gemiddeld 18 per jaar (1961–1990) naar minder dan 10.' },
  // MAA
  { seizoen: 'lente', norm: 6.34, context: 'Maart markeert het begin van de lente. De fenologische lente — het moment waarop bomen uitlopen — verschuift in België gemiddeld 2,5 dag per decennium naar voren.' },
  // APR
  { seizoen: 'lente', norm: 9.51, context: 'April is een overgangsmaand met sterk wisselend weer. De nachtvorst in april wordt zeldzamer, wat gevolgen heeft voor de fruitteelt in Haspengouw en de Ardennen.' },
  // MEI
  { seizoen: 'lente', norm: 13.18, context: 'Mei is de maand waarin de natuur volop ontwaakt. De gemiddelde temperatuur in Ukkel kruipt steeds dichter naar het niveau dat vroeger bij juni hoorde.' },
  // JUN
  { seizoen: 'zomer', norm: 16.10, context: 'Juni luidt het zomerseizoen in. Het aantal zomerdagen (≥25 °C) neemt toe in Ukkel — van gemiddeld 3 per maand naar bijna 6 in recente decennia.' },
  // JUL
  { seizoen: 'zomer', norm: 18.15, context: 'Juli is doorgaans de warmste maand in Ukkel. Het KMI registreert een toename van hittegolven: +0,3 per decennium sinds 1981, met langere duur en hogere intensiteit.' },
  // AUG
  { seizoen: 'zomer', norm: 17.96, context: 'Augustus sluit de zomer af. Stedelijk hitte-eilandeffect maakt Brussel tot 3 °C warmer dan het omliggende platteland — een groeiend gezondheidsrisico.' },
  // SEP
  { seizoen: 'herfst', norm: 14.89, context: 'September is een herfstmaand die steeds vaker zomers aanvoelt. De Indiaanse zomer wordt frequenter, en de eerste herfstvorst komt later dan ooit.' },
  // OKT
  { seizoen: 'herfst', norm: 11.19, context: 'Oktober brengt de herfst volop. De bladverkleuring verschuift: bomen houden hun bladeren langer vast, wat wijst op een verlengd groeiseizoen.' },
  // NOV
  { seizoen: 'herfst', norm: 6.95, context: 'November wordt gekenmerkt door toenemende neerslag. Het KMI noteert een stijging van 7% in de jaarlijkse neerslag in Ukkel over de laatste 120 jaar.' },
  // DEC
  { seizoen: 'winter', norm: 3.94, context: 'December sluit het jaar af. Een witte kerst in Ukkel is steeds zeldzamer — de kans is gedaald van 15% naar minder dan 5% in de afgelopen 30 jaar.' }
];

function generateVerhaal(monthIdx, year, anomaly) {
  const mc = MAAND_CONTEXT[monthIdx];
  const maand = MAANDEN_VOL[monthIdx];
  const absAnom = Math.abs(anomaly);
  const sign = anomaly >= 0;
  const isVoorsp = isVoorspelling(year);

  let intensiteit;
  if (absAnom >= 3) intensiteit = 'uitzonderlijk ' + (sign ? 'warm' : 'koud');
  else if (absAnom >= 1.5) intensiteit = 'duidelijk ' + (sign ? 'warmer' : 'kouder') + ' dan normaal';
  else if (absAnom >= 0.5) intensiteit = (sign ? 'iets warmer' : 'iets kouder') + ' dan de norm';
  else intensiteit = 'dicht bij de klimaatnorm';

  let zin1;
  if (isVoorsp) {
    zin1 = `De CMIP6-projectie (EC-Earth3P-HR, SSP5-8.5) suggereert dat ${maand.toLowerCase()} ${year} ${intensiteit} zou zijn in Ukkel, met een anomalie van ${anomaly >= 0 ? '+' : ''}${anomaly.toFixed(1).replace('.', ',')} °C ten opzichte van de klimaatnorm 1991–2020.`;
  } else {
    zin1 = `${maand} ${year} was ${intensiteit} in Ukkel — de maandgemiddelde temperatuur lag ${absAnom.toFixed(1).replace('.', ',')} °C ${sign ? 'boven' : 'onder'} de klimaatnorm van ${mc.norm.toFixed(1).replace('.', ',')} °C (1991–2020).`;
  }

  return `${zin1} ${mc.context}`;
}

export {
  DATA, HISTORISCH, VOORSPELLING, KLIMAATNORM_1991_2020,
  JAAR_MIN, JAAR_MAX, LAATSTE_GEMETEN_JAAR,
  HUIDIGE_MAAND_INDEX, HUIDIG_JAAR,
  MAANDEN, MAANDEN_VOL, MAAND_CONTEXT,
  isVoorspelling, maandReeks, generateVerhaal
};

