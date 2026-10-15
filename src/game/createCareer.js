import { GROWTH_TYPES } from '../data/growthTypes.js'
import { REGIONS } from '../data/regions.js'
import { ELEMENTARY_SCHOOLS } from '../data/schools.js'
import { STATS } from '../data/stats.js'
import { bellCurveScore, randomIndex, weightedPick } from './random.js'

const INITIAL_STAT_WEIGHTS = { 8: 0.1, 9: 0.2, 10: 0.4, 11: 0.2, 12: 0.1 }

export function assignElementarySchool(regionId, rng = Math.random) {
  const candidates = ELEMENTARY_SCHOOLS[regionId]
  return candidates[randomIndex(candidates.length, rng)]
}

export function createInitialStats(rng = Math.random) {
  return Object.fromEntries(
    STATS.map(({ id }) => [id, Number(weightedPick(INITIAL_STAT_WEIGHTS, rng))]),
  )
}

export function createCareer(names = {}, rng = Math.random) {
  if (typeof names === 'function') {
    rng = names
    names = {}
  }

  const lastName = names.lastName?.trim().slice(0, 5) ?? ''
  const firstName = names.firstName?.trim().slice(0, 5) ?? ''
  const region = REGIONS[randomIndex(REGIONS.length, rng)]
  const initialStats = createInitialStats(rng)

  return {
    lastName,
    firstName,
    fullName: [lastName, firstName].filter(Boolean).join(' '),
    region,
    school: assignElementarySchool(region.id, rng),
    stats: { ...initialStats },
    initialStats,
    potential: bellCurveScore(rng),
    stability: bellCurveScore(rng),
    growthType: null,
    condition: '보통',
    turnIndex: 0,
    logs: [],
    notice: '',
    complete: false,
  }
}

export function rerollCareer(career, rng = Math.random) {
  return createCareer({ lastName: career.lastName, firstName: career.firstName }, rng)
}

export function chooseGrowthType(career, growthTypeId) {
  const growthType = GROWTH_TYPES.find((type) => type.id === growthTypeId)
  if (!growthType) throw new Error(`Unknown growth type: ${growthTypeId}`)
  return { ...career, growthType }
}
