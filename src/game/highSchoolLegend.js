import { HIGH_SCHOOL_LEGEND_BY_ID, HIGH_SCHOOL_LEGEND_EVENTS } from '../data/highSchoolLegendEvents.js'

export const HIGH_LEGEND_TURNS = [16, 19, 23]

export function getHighLegendTurns(potential) {
  if (potential <= 50) return [19]
  if (potential <= 70) return [16, 23]
  return HIGH_LEGEND_TURNS
}

const GROWTH_BONUSES = {
  sprinter: { SAKURA_BAKUSHIN_O: 18, SILENCE_SUZUKA: 8, TAIKI_SHUTTLE: 6 },
  miler: { TAIKI_SHUTTLE: 18, SILENCE_SUZUKA: 5, ALMOND_EYE: 6 },
  router: { GENTILDONNA: 16, ALMOND_EYE: 14, OGURI_CAP: 6, ORFEVRE: 4 },
  stayer: { MEJIRO_MCQUEEN: 18, SUPER_CREEK: 15, ORFEVRE: 6, OGURI_CAP: 4 },
}

const STYLE_BONUSES = {
  NIGE: { SILENCE_SUZUKA: 20, SAKURA_BAKUSHIN_O: 6 },
  SENKO: { TAIKI_SHUTTLE: 14, GENTILDONNA: 8, ALMOND_EYE: 5 },
  SASHI: { GENTILDONNA: 12, ALMOND_EYE: 10, OGURI_CAP: 8 },
  OIKOMI: { ORFEVRE: 20, OGURI_CAP: 8, ALMOND_EYE: 4 },
}

const ROUTE_BONUSES = {
  SPRINT: { SAKURA_BAKUSHIN_O: 18, SILENCE_SUZUKA: 8, TAIKI_SHUTTLE: 4 },
  MILE: { TAIKI_SHUTTLE: 18, ALMOND_EYE: 8, SILENCE_SUZUKA: 4 },
  CLASSIC_TRIPLE: { GENTILDONNA: 12, ORFEVRE: 10, OGURI_CAP: 8, ALMOND_EYE: 6 },
  TRIPLE_TIARA: { GENTILDONNA: 18, ALMOND_EYE: 15, TAIKI_SHUTTLE: 3 },
  LONG: { MEJIRO_MCQUEEN: 18, SUPER_CREEK: 15, ORFEVRE: 8, OGURI_CAP: 4 },
}

const MIDDLE_LEGEND_CHARACTER_IDS = {
  legend_bakushin: 'SAKURA_BAKUSHIN_O', legend_taiki: 'TAIKI_SHUTTLE', legend_gentildonna: 'GENTILDONNA', legend_almond: 'ALMOND_EYE', legend_creek: 'SUPER_CREEK', legend_mcqueen: 'MEJIRO_MCQUEEN', legend_oguri: 'OGURI_CAP',
}

export function createHighSchoolLegendState() {
  return { plans: {}, completedLegendIds: [], pendingLegend: null, pendingOutcome: null }
}

export function getSeenHighLegendIds(career) {
  const seen = new Set(career.highSchoolLegend?.completedLegendIds ?? [])
  for (const eventId of career.middleState?.completedLegendIds ?? []) {
    const legendId = MIDDLE_LEGEND_CHARACTER_IDS[eventId]
    if (legendId) seen.add(legendId)
  }
  return seen
}

function addBonuses(weights, bonuses = {}) {
  for (const [id, bonus] of Object.entries(bonuses)) if (id in weights) weights[id] += bonus
}

export function getHighLegendWeights(career, turnNumber = career.turnIndex + 1) {
  const seen = getSeenHighLegendIds(career)
  const weights = Object.fromEntries(HIGH_SCHOOL_LEGEND_EVENTS.filter(({ legendId }) => legendId !== 'SYMBOLI_RUDOLF' && !seen.has(legendId)).map(({ legendId }) => [legendId, 10]))
  addBonuses(weights, GROWTH_BONUSES[career.growthType.id])
  addBonuses(weights, STYLE_BONUSES[career.runningStyle])
  if (turnNumber === 19) addBonuses(weights, ROUTE_BONUSES[career.highYear2?.route])
  if (turnNumber === 23) {
    const achievements = new Set(career.highYear2?.achievements?.map(({ id }) => id))
    if (achievements.has('CLASSIC_TRIPLE_CROWN')) addBonuses(weights, { GENTILDONNA: 12, ORFEVRE: 12, OGURI_CAP: 6 })
    if (achievements.has('TRIPLE_TIARA')) addBonuses(weights, { GENTILDONNA: 12, ALMOND_EYE: 12 })
    const results = career.highYear3?.raceResults ?? {}
    if (results.takamatsunomiya_kinen?.won) addBonuses(weights, { SAKURA_BAKUSHIN_O: 12 })
    if (results.victoria_mile?.won || results.yasuda_kinen?.won) addBonuses(weights, { TAIKI_SHUTTLE: 10, ALMOND_EYE: 6 })
    if (results.tenno_sho_spring?.won) addBonuses(weights, { MEJIRO_MCQUEEN: 12, SUPER_CREEK: 8 })
    if (results.osaka_hai?.won || results.takarazuka_kinen?.won) addBonuses(weights, { GENTILDONNA: 8, OGURI_CAP: 6, ALMOND_EYE: 5 })
  }
  return weights
}

export function selectHighSchoolLegend(career, turnNumber = career.turnIndex + 1, rng = Math.random) {
  const seen = getSeenHighLegendIds(career)
  if (!seen.has('SYMBOLI_RUDOLF') && rng() < 0.05) return HIGH_SCHOOL_LEGEND_BY_ID.SYMBOLI_RUDOLF
  const weights = getHighLegendWeights(career, turnNumber)
  const entries = Object.entries(weights)
  const total = entries.reduce((sum, [, weight]) => sum + Math.max(1, weight), 0)
  let roll = rng() * total
  for (const [legendId, weight] of entries) {
    roll -= Math.max(1, weight)
    if (roll < 0) return HIGH_SCHOOL_LEGEND_BY_ID[legendId]
  }
  return HIGH_SCHOOL_LEGEND_BY_ID[entries.at(-1)?.[0]] ?? null
}

export function ensureHighSchoolLegendPlan(career, turnNumber, rng = Math.random) {
  if (!getHighLegendTurns(career.potential).includes(turnNumber)) return career
  const state = career.highSchoolLegend ?? createHighSchoolLegendState()
  if (state.plans[turnNumber]) return career.highSchoolLegend ? career : { ...career, highSchoolLegend: state }
  const selected = selectHighSchoolLegend({ ...career, highSchoolLegend: state }, turnNumber, rng)
  if (!selected) return { ...career, highSchoolLegend: state }
  return { ...career, highSchoolLegend: { ...state, plans: { ...state.plans, [turnNumber]: { turn: turnNumber, legendId: selected.legendId, eventId: selected.id, resolved: false } } } }
}

export function getHighSchoolLegendDue(career, turnNumber = career.turnIndex + 1) {
  const plan = career.highSchoolLegend?.plans?.[turnNumber]
  return plan && !plan.resolved ? HIGH_SCHOOL_LEGEND_BY_ID[plan.legendId] : null
}
