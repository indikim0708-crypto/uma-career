import { RACE_MESSAGES, RACE_PHASES } from '../data/raceMessages.js'
import {
  CONDITION_MODIFIERS,
  DEBUT_RETRY_FIELD_REDUCTION,
  DISTANCE_WEIGHTS,
  PHASE_WEIGHTS,
  POSITION_KEEP_RANGES,
  POSITION_KEEP_WEIGHTS,
  RACE_FIELD_STRENGTH,
  REQUIRED_STAMINA,
  RUNNING_STYLE_WEIGHTS,
  STYLE_BASE_SHIFTS,
} from '../data/raceBalance.js'

const HIGH_YEAR2_RACE_IDS = new Set(['nhk_mile_cup', 'satsuki_sho', 'japan_derby', 'oka_sho', 'oaks', 'sprinters_stakes', 'mile_championship', 'kikuka_sho', 'shuka_sho', 'takamatsunomiya_kinen', 'osaka_hai', 'tenno_sho_spring', 'victoria_mile', 'yasuda_kinen', 'takarazuka_kinen', 'tenno_sho_autumn', 'japan_cup', 'arima_kinen'])
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value))
const weightedScore = (stats, weights) => Object.entries(weights).reduce((sum, [id, weight]) => sum + stats[id] * weight, 0)

function seededRandom(seed) {
  let value = seed >>> 0
  return () => {
    value += 0x6D2B79F5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function noise(rng) {
  return rng() * 6 - 3
}

export function getPositionKeepRange(runningStyle, fieldSize = 12) {
  if (fieldSize === 12) return [...POSITION_KEEP_RANGES[runningStyle]]
  const nigeEnd = Math.max(1, Math.round(fieldSize * .17))
  const senkoEnd = Math.max(nigeEnd + 1, Math.round(fieldSize * .42))
  const sashiEnd = Math.max(senkoEnd + 1, Math.round(fieldSize * .75))
  const ranges = {
    NIGE: [1, nigeEnd],
    SENKO: [Math.min(fieldSize, nigeEnd + 1), Math.min(fieldSize, senkoEnd)],
    SASHI: [Math.min(fieldSize, senkoEnd + 1), Math.min(fieldSize, sashiEnd)],
    OIKOMI: [Math.min(fieldSize, sashiEnd + 1), fieldSize],
  }
  const [minimum, maximum] = ranges[runningStyle]
  return [Math.min(minimum, maximum), Math.max(minimum, maximum)]
}

export function calculatePositionKeepScore(stats) {
  return weightedScore(stats, POSITION_KEEP_WEIGHTS)
}

export function calculateStyleFitScore(stats, runningStyle) {
  return weightedScore(stats, RUNNING_STYLE_WEIGHTS[runningStyle])
}

export function getRaceDistance(distance) {
  const parsed = Number.parseInt(String(distance), 10)
  if (DISTANCE_WEIGHTS[parsed]) return parsed
  if (parsed === 2200 || parsed === 2500) return 2400
  if (parsed === 3200) return 3000
  return 1600
}

export function calculateDistanceScore(stats, distance) {
  return weightedScore(stats, DISTANCE_WEIGHTS[getRaceDistance(distance)])
}

export function calculateStaminaPenalty(stats, distance, phase) {
  const shortfall = Math.max(0, REQUIRED_STAMINA[getRaceDistance(distance)] - stats.stamina)
  if (phase === 'FINAL_CORNER') return shortfall * .15
  if (phase === 'FINAL_STRAIGHT') return shortfall * .35
  return 0
}

export function calculatePhaseScore({ stats, runningStyle, distance, condition, phase, phaseNoise = 0 }) {
  const phaseRawScore = weightedScore(stats, PHASE_WEIGHTS[phase])
  const styleFitScore = calculateStyleFitScore(stats, runningStyle)
  const distanceScore = calculateDistanceScore(stats, distance)
  return phaseRawScore * .50 + styleFitScore * .30 + distanceScore * .20 + (CONDITION_MODIFIERS[condition] ?? 0) + phaseNoise - calculateStaminaPenalty(stats, distance, phase)
}

export function getPerformanceRankModifier(performanceDelta, phase = 'FINAL_STRAIGHT') {
  const modifier = performanceDelta >= 10 ? -2 : performanceDelta >= 3 ? -1 : performanceDelta >= -2 ? 0 : performanceDelta >= -9 ? 1 : 2
  return phase === 'MIDDLE' ? clamp(modifier, -1, 1) : modifier
}

export function getRaceFieldStrength(race) {
  if (Number.isFinite(race.fieldStrength)) return race.fieldStrength
  if (race.raceType === 'DEBUT') return RACE_FIELD_STRENGTH.DEBUT - (race.attempt === 2 ? DEBUT_RETRY_FIELD_REDUCTION : 0)
  return HIGH_YEAR2_RACE_IDS.has(race.raceId) ? RACE_FIELD_STRENGTH.HIGH_YEAR2_G1 : RACE_FIELD_STRENGTH.HIGH_YEAR1_G1
}

function trendFor(previousPosition, position) {
  if (previousPosition > position) return 'ADVANCING'
  if (position > previousPosition) return 'LOSING_GROUND'
  return 'STEADY'
}

function phaseMessage(trend, runningStyle, phaseIndex) {
  return RACE_MESSAGES[trend][runningStyle][phaseIndex]
}

export function simulateRace({ race, stats, condition = '보통', runningStyle = 'SENKO', fieldSize = 12, rng = Math.random }) {
  const raceSeed = Math.floor(rng() * 4294967296) >>> 0
  const raceRng = seededRandom(raceSeed)
  const phaseNoise = {
    START: noise(raceRng),
    EARLY: noise(raceRng),
    MIDDLE: noise(raceRng),
    FINAL_CORNER: noise(raceRng),
    FINAL_STRAIGHT: noise(raceRng),
  }
  const fieldStrength = getRaceFieldStrength(race)
  const positionKeepRange = getPositionKeepRange(runningStyle, fieldSize)
  const positionKeepScore = calculatePositionKeepScore(stats)
  const styleFitScore = calculateStyleFitScore(stats, runningStyle)
  const distanceScore = calculateDistanceScore(stats, race.distance)
  const [keepMinimum, keepMaximum] = positionKeepRange
  const keepWidth = keepMaximum - keepMinimum
  const startQuality = clamp((positionKeepScore + phaseNoise.START - 55) / 45, 0, 1)
  let position = clamp(Math.round(keepMaximum - startQuality * keepWidth), keepMinimum, keepMaximum)
  const positions = { START: position }
  const earlyControl = (positionKeepScore - fieldStrength) * .15 + phaseNoise.EARLY
  const earlyShift = earlyControl >= 1.5 ? -1 : earlyControl <= -1.5 ? 1 : 0
  position = clamp(position + earlyShift, keepMinimum, keepMaximum)
  positions.EARLY = position

  const phaseScores = {}
  for (const phase of ['MIDDLE', 'FINAL_CORNER', 'FINAL_STRAIGHT']) {
    const phaseScore = calculatePhaseScore({ stats, runningStyle, distance: race.distance, condition, phase, phaseNoise: phaseNoise[phase] })
    const performanceModifier = getPerformanceRankModifier(phaseScore - fieldStrength, phase)
    const actualRankShift = STYLE_BASE_SHIFTS[phase][runningStyle] + performanceModifier
    phaseScores[phase] = { score: phaseScore, performanceDelta: phaseScore - fieldStrength, performanceModifier, styleBaseShift: STYLE_BASE_SHIFTS[phase][runningStyle], actualRankShift }
    position = clamp(position + actualRankShift, 1, fieldSize)
    positions[phase] = position
  }

  let previousPosition = null
  const checkpoints = RACE_PHASES.map((phase, index) => {
    const checkpointPosition = positions[phase.id]
    const trend = previousPosition === null ? 'STEADY' : trendFor(previousPosition, checkpointPosition)
    previousPosition = checkpointPosition
    return {
      phase: phase.id,
      phaseLabel: phase.label,
      at: phase.at,
      position: checkpointPosition,
      positionKeep: phase.id === 'START' || phase.id === 'EARLY',
      positionKeepReleased: phase.id === 'MIDDLE',
      trend,
      message: phaseMessage(trend, runningStyle, index),
    }
  })

  return {
    raceId: race.raceId,
    raceName: race.raceName,
    distance: race.distance,
    raceSeed,
    runningStyle,
    fieldSize,
    fieldStrength,
    positionKeepRange,
    positionKeepScore,
    styleFitScore,
    distanceScore,
    phaseNoise,
    phaseScores,
    checkpoints,
    finalPosition: positions.FINAL_STRAIGHT,
    completed: false,
  }
}
