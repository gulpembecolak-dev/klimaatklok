/* ----- Klimaatklok 3D — data (Open-Meteo) -----
 * Maandelijkse temperatuuranomalieën Ukkel (50.79°N, 4.36°E)
 * Anomalie = maandgemiddelde − klimaatnorm 1991-2020.
 *
 * data/klimaat.json  — volledige gemeten maanden (ERA5) + projectie (CMIP6
 *                       EC-Earth3P-HR). Elke maand ververst door een GitHub
 *                       Action (scripts/update-data.mjs).
 * Live aanvulling    — maanden na de laatste in het JSON-bestand (o.a. de
 *                       lopende maand) haalt de browser zelf bij Open-Meteo.
 *
 * Elke cel krijgt een status:
 *   'gemeten'   volledige maand, ERA5
 *   'lopend'    huidige maand t/m gisteren, voorlopig
 *   'projectie' nog niet gemeten → modelwaarde
 */

const LAT = 50.79, LON = 4.36;
const JAAR_MIN = 2015;
const JAAR_MAX = 2040;

const MAANDEN = ["JAN","FEB","MAA","APR","MEI","JUN","JUL","AUG","SEP","OKT","NOV","DEC"];
const MAANDEN_VOL = ["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"];

// Huidige real-world moment voor de wijzer
// ?nu=2027-01-02 in de URL simuleert een andere datum (om de jaarwissel te testen)
const _nuParam = new URLSearchParams(location.search).get('nu');
const _now = _nuParam ? new Date(_nuParam + 'T12:00:00') : new Date();
const HUIDIGE_MAAND_INDEX = _now.getMonth();  // 0=Jan … 11=Dec
const HUIDIG_JAAR = _now.getFullYear();

// --- 1. Basisdata: altijd revalideren, nooit een oude versie uit de cache ---
const BRON = await fetch('data/klimaat.json', { cache: 'no-cache' }).then(r => r.json());
const KLIMAATNORM_1991_2020 = BRON.norm;

// --- 2. Live aanvulling: van de maand na BRON.laatsteMaand t/m gisteren ---
const LIVE = {};        // 'YYYY-MM' → { anomalie, dagen, volledig }
await (async () => {
  const [lj, lm] = BRON.laatsteMaand.split('-').map(Number);
  const start = new Date(Date.UTC(lj, lm, 1));                 // eerste dag ná laatsteMaand
  const eind = new Date(Date.UTC(_now.getFullYear(), _now.getMonth(), _now.getDate() - 1));
  if (start > eind) return;
  const iso = d => d.toISOString().slice(0, 10);
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${LAT}&longitude=${LON}`
    + `&start_date=${iso(start)}&end_date=${iso(eind)}&daily=temperature_2m_mean&timezone=Europe%2FBrussels`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const { daily } = await fetch(url, { signal: ctrl.signal }).then(r => r.json());
    clearTimeout(t);
    const som = {}, n = {};
    daily.time.forEach((d, i) => {
      const v = daily.temperature_2m_mean[i];
      if (v == null) return;
      const k = d.slice(0, 7);
      som[k] = (som[k] || 0) + v; n[k] = (n[k] || 0) + 1;
    });
    for (const k of Object.keys(n)) {
      const j = +k.slice(0, 4), m = +k.slice(5) - 1;
      LIVE[k] = {
        anomalie: Math.round((som[k] / n[k] - KLIMAATNORM_1991_2020[m]) * 10) / 10,
        dagen: n[k],
        volledig: n[k] >= new Date(Date.UTC(j, m + 1, 0)).getUTCDate()
      };
    }
  } catch (e) { /* offline of API traag: dan alleen de basisdata */ }
})();

// --- 3. Raster opbouwen: DATA[jaar][maand] + STATUS[jaar][maand] ---
const DATA = {}, STATUS = {};
const isVerleden = (y, m) => y < HUIDIG_JAAR || (y === HUIDIG_JAAR && m < HUIDIGE_MAAND_INDEX);
const isNu = (y, m) => y === HUIDIG_JAAR && m === HUIDIGE_MAAND_INDEX;
for (let y = JAAR_MIN; y <= JAAR_MAX; y++) {
  DATA[y] = Array(12).fill(null);
  STATUS[y] = Array(12).fill(null);
  for (let m = 0; m < 12; m++) {
    const g = BRON.gemeten[y]?.[m];
    const live = LIVE[`${y}-${String(m + 1).padStart(2, '0')}`];
    const p = BRON.projectie[y]?.[m];
    if (g != null)                          { DATA[y][m] = g; STATUS[y][m] = 'gemeten'; }
    else if (live?.volledig)                { DATA[y][m] = live.anomalie; STATUS[y][m] = 'gemeten'; }
    else if (live && (isNu(y, m) || isVerleden(y, m))) { DATA[y][m] = live.anomalie; STATUS[y][m] = 'lopend'; }
    else if (!isVerleden(y, m) && p != null) { DATA[y][m] = p; STATUS[y][m] = 'projectie'; }
  }
}
// Dagen in de lopende maand (voor het label "t/m 19/11")
const LOPEND_DAGEN = LIVE[`${HUIDIG_JAAR}-${String(HUIDIGE_MAAND_INDEX + 1).padStart(2, '0')}`]?.dagen || 0;

const celStatus = (y, m) => STATUS[y]?.[m] ?? null;
const isGemeten = (y, m) => celStatus(y, m) === 'gemeten';

// Laatste jaar met minstens één volledig gemeten maand
let LAATSTE_GEMETEN_JAAR = JAAR_MIN;
for (let y = JAAR_MIN; y <= JAAR_MAX; y++) if (STATUS[y].includes('gemeten')) LAATSTE_GEMETEN_JAAR = y;

// Een heel jaar is "voorspelling" als het na het huidige jaar ligt
function isVoorspelling(year) { return year > HUIDIG_JAAR; }

function maandReeks(monthIdx) {
  const reeks = [];
  for (let y = JAAR_MIN; y <= JAAR_MAX; y++) {
    const st = celStatus(y, monthIdx);
    reeks.push({ year: y, anomaly: DATA[y][monthIdx], voorspelling: st === 'projectie', voorlopig: st === 'lopend' });
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
  const status = celStatus(year, monthIdx);
  const isVoorsp = status === 'projectie';

  let intensiteit;
  if (absAnom >= 3) intensiteit = 'uitzonderlijk ' + (sign ? 'warm' : 'koud');
  else if (absAnom >= 1.5) intensiteit = 'duidelijk ' + (sign ? 'warmer' : 'kouder') + ' dan normaal';
  else if (absAnom >= 0.5) intensiteit = (sign ? 'iets warmer' : 'iets kouder') + ' dan de norm';
  else intensiteit = 'dicht bij de klimaatnorm';

  let zin1;
  if (isVoorsp) {
    zin1 = `De CMIP6-projectie (EC-Earth3P-HR, SSP5-8.5) suggereert dat ${maand.toLowerCase()} ${year} ${intensiteit} zou zijn in Ukkel, met een anomalie van ${anomaly >= 0 ? '+' : ''}${anomaly.toFixed(1).replace('.', ',')} °C ten opzichte van de klimaatnorm 1991–2020.`;
  } else if (status === 'lopend') {
    zin1 = `${maand} ${year} is nog bezig. Over de eerste ${LOPEND_DAGEN} dagen lag de temperatuur in Ukkel ${absAnom.toFixed(1).replace('.', ',')} °C ${sign ? 'boven' : 'onder'} de klimaatnorm van ${mc.norm.toFixed(1).replace('.', ',')} °C — een voorlopig cijfer.`;
  } else {
    zin1 = `${maand} ${year} was ${intensiteit} in Ukkel — de maandgemiddelde temperatuur lag ${absAnom.toFixed(1).replace('.', ',')} °C ${sign ? 'boven' : 'onder'} de klimaatnorm van ${mc.norm.toFixed(1).replace('.', ',')} °C (1991–2020).`;
  }

  return `${zin1} ${mc.context}`;
}

export {
  DATA, STATUS, celStatus, isGemeten, LOPEND_DAGEN, KLIMAATNORM_1991_2020,
  JAAR_MIN, JAAR_MAX, LAATSTE_GEMETEN_JAAR,
  HUIDIGE_MAAND_INDEX, HUIDIG_JAAR,
  MAANDEN, MAANDEN_VOL, MAAND_CONTEXT,
  isVoorspelling, maandReeks, generateVerhaal
};

