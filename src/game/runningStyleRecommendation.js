import { RUNNING_STYLE_RECOMMENDATION_BALANCE, TURN13_STAT_NORMS } from '../data/runningStyleRecommendationBalance.js'

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value))

export function safeZScore(value, mean, sd) {
  if (sd <= 1e-9) return 0
  const limit = RUNNING_STYLE_RECOMMENDATION_BALANCE.zScoreClamp
  return clamp((value - mean) / sd, -limit, limit)
}

export function normalizeTurn13Stats(stats) {
  return Object.fromEntries(Object.entries(TURN13_STAT_NORMS).map(([id, norm]) => [id, safeZScore(stats[id], norm.mean, norm.sd)]))
}

function weightedScore(zScores, weights) {
  return Object.entries(weights).reduce((sum, [id, weight]) => sum + zScores[id] * weight, 0)
}

export function calculateFrontBackScores(zScores) {
  const weights = RUNNING_STYLE_RECOMMENDATION_BALANCE.frontBackWeights
  return { front: weightedScore(zScores, weights.front), back: weightedScore(zScores, weights.back) }
}

export function resolveFrontOrBack(scores, growthTypeId, tieRoll) {
  const balance = RUNNING_STYLE_RECOMMENDATION_BALANCE
  const difference = scores.front - scores.back
  if (difference > balance.frontBackDeadZone) return { group: 'FRONT', difference, adjustedDifference: difference, tied: false }
  if (difference < -balance.frontBackDeadZone) return { group: 'BACK', difference, adjustedDifference: difference, tied: false }
  const adjustedDifference = difference + (balance.growthTypeGroupBias[growthTypeId] ?? 0)
  if (adjustedDifference > balance.neutralRandomThreshold) return { group: 'FRONT', difference, adjustedDifference, tied: false }
  if (adjustedDifference < -balance.neutralRandomThreshold) return { group: 'BACK', difference, adjustedDifference, tied: false }
  return { group: tieRoll < .5 ? 'FRONT' : 'BACK', difference, adjustedDifference, tied: true }
}

export function calculateFrontStyleScores(zScores) {
  const weights = RUNNING_STYLE_RECOMMENDATION_BALANCE.detailWeights
  return { NIGE: weightedScore(zScores, weights.NIGE), SENKO: weightedScore(zScores, weights.SENKO) }
}

export function calculateBackStyleScores(zScores) {
  const weights = RUNNING_STYLE_RECOMMENDATION_BALANCE.detailWeights
  return { SASHI: weightedScore(zScores, weights.SASHI), OIKOMI: weightedScore(zScores, weights.OIKOMI) }
}

function resolveDetailStyle(scores, firstId, secondId, tieRoll) {
  const difference = scores[firstId] - scores[secondId]
  const deadZone = RUNNING_STYLE_RECOMMENDATION_BALANCE.detailDeadZone
  if (difference > deadZone) return { recommendation: firstId, difference, tied: false }
  if (difference < -deadZone) return { recommendation: secondId, difference, tied: false }
  return { recommendation: tieRoll < .5 ? firstId : secondId, difference, tied: true }
}

export function recommendRunningStyle(stats, growthTypeId, rng = Math.random) {
  const frontBackTieRoll = rng()
  const detailTieRoll = rng()
  const zScores = normalizeTurn13Stats(stats)
  const frontBackScores = calculateFrontBackScores(zScores)
  const groupResult = resolveFrontOrBack(frontBackScores, growthTypeId, frontBackTieRoll)
  const detailScores = groupResult.group === 'FRONT' ? calculateFrontStyleScores(zScores) : calculateBackStyleScores(zScores)
  const detailResult = groupResult.group === 'FRONT'
    ? resolveDetailStyle(detailScores, 'NIGE', 'SENKO', detailTieRoll)
    : resolveDetailStyle(detailScores, 'SASHI', 'OIKOMI', detailTieRoll)
  return {
    stats: { ...stats },
    zScores,
    frontScore: frontBackScores.front,
    backScore: frontBackScores.back,
    group: groupResult.group,
    groupDifference: groupResult.difference,
    adjustedGroupDifference: groupResult.adjustedDifference,
    groupTieResolved: groupResult.tied,
    detailScores,
    detailDifference: detailResult.difference,
    detailTieResolved: detailResult.tied,
    frontBackTieRoll,
    detailTieRoll,
    recommendation: detailResult.recommendation,
  }
}
