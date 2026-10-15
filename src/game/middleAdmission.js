import { ADMISSION_BALANCE } from '../data/admissionBalance.js'
import { getMiddleSchoolById } from '../data/middleSchools.js'
import { SCHOOL_TIERS } from '../data/schools.js'

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value))

export function calculateAbilityScore(stats) {
  const values = Object.values(stats)
  const totalStats = values.reduce((sum, value) => sum + value, 0)
  const top2Average = [...values].sort((a, b) => b - a).slice(0, 2).reduce((sum, value) => sum + value, 0) / 2
  const { overall, specialty } = ADMISSION_BALANCE.ability
  const overallScore = clamp((totalStats - overall.minimumTotal) / overall.range, 0, 1) * overall.maximum
  const specialtyScore = clamp((top2Average - specialty.minimumTopTwoAverage) / specialty.range, 0, 1) * specialty.maximum
  return overallScore + specialtyScore
}

function tierKey(tier) {
  if (tier === SCHOOL_TIERS.CENTRAL_TRACEN) return 'CENTRAL_TRACEN'
  if (tier === SCHOOL_TIERS.TOP) return 'TOP'
  if (tier === SCHOOL_TIERS.ELITE) return 'ELITE'
  return 'GENERAL'
}

export function calculateSchoolHistoryScore(career) {
  let score = ADMISSION_BALANCE.schoolHistoryBase[tierKey(career.school.tier)]
  for (const entry of career.history ?? []) {
    if (entry.kind !== 'TURN' || !entry.event) continue
    const event = entry.event
    const resultScore = event.outcomeType === 'GREAT_SUCCESS' ? 2 : event.outcomeType === 'SUCCESS' ? 1 : 0
    if (event.schoolEvent || event.signatureEvent) score += resultScore
  }
  const acceptedTransfers = (career.history ?? []).filter((entry) => entry.kind === 'TRANSFER' && entry.accepted)
  if (acceptedTransfers.some(({ specialTransfer }) => specialTransfer)) score += 2
  else if (acceptedTransfers.length) score += 1
  return clamp(score, 0, 20)
}

export function calculateMiddleAdmissionScore(career) {
  return clamp(calculateAbilityScore(career.stats) + career.potential * ADMISSION_BALANCE.potentialMultiplier + calculateSchoolHistoryScore(career), 0, 100)
}

export function getCentralAdmissionChance(score, elementarySchoolId = null) {
  const normalChance = ADMISSION_BALANCE.centralChanceBands.find(({ below }) => score < below).chance
  return elementarySchoolId === 'central_tracen'
    ? Math.max(normalChance, ADMISSION_BALANCE.centralElementaryMinimumChance)
    : normalChance
}

export function chooseFallbackMiddleSchool(score, elementarySchoolId = null, rng = Math.random) {
  if (elementarySchoolId === 'central_tracen') {
    return getMiddleSchoolById(rng() < 0.5 ? 'nakayama_tracen_middle' : 'hanshin_tracen_middle')
  }
  const middleChance = ADMISSION_BALANCE.fallbackMiddleChanceBands.find(({ below }) => score < below).middle
  const middleTier = rng() < middleChance
  if (middleTier) return getMiddleSchoolById(rng() < 0.5 ? 'nakayama_tracen_middle' : 'hanshin_tracen_middle')
  return getMiddleSchoolById(rng() < 0.5 ? 'kasamatsu_tracen_middle' : 'kochi_tracen_middle')
}

export function assignMiddleSchool(career, rng = Math.random) {
  const admissionScore = calculateMiddleAdmissionScore(career)
  const centralAdmissionChance = getCentralAdmissionChance(admissionScore, career.school.id)
  const centralAdmissionPassed = rng() < centralAdmissionChance
  const school = centralAdmissionPassed
    ? getMiddleSchoolById('central_tracen_middle')
    : chooseFallbackMiddleSchool(admissionScore, career.school.id, rng)
  return { school, admissionScore, centralAdmissionChance, centralAdmissionPassed }
}
