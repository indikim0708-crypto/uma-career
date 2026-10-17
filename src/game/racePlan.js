import { RACE_MESSAGES, RACE_PHASES } from '../data/raceMessages.js'

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value))
const anchorByStyle = { NIGE: [2, 2, 3, 4, 4], SENKO: [4, 4, 4, 3, 3], SASHI: [7, 7, 6, 4, 3], OIKOMI: [10, 10, 9, 7, 4] }
const convergence = [0.06, 0.10, 0.24, 0.50, 0.82]

function randomIndex(items, rng) {
  return Math.min(items.length - 1, Math.floor(rng() * items.length))
}

function trendFor(previousPosition, position) {
  if (previousPosition - position >= 2) return 'ADVANCING'
  if (position - previousPosition >= 2) return 'LOSING_GROUND'
  return 'STEADY'
}

function checkpointPosition(style, phaseIndex, finalPosition, fieldSize, rng) {
  const anchor = anchorByStyle[style][phaseIndex]
  const jitter = Math.floor(rng() * 3) - 1
  let position = Math.round(anchor + jitter + (finalPosition - anchor) * convergence[phaseIndex])
  if (phaseIndex === RACE_PHASES.length - 1 && position === finalPosition && finalPosition > 1) position -= 1
  return clamp(position, 1, fieldSize)
}

export function createRacePlan({ race, runningStyle = 'SENKO', fieldSize = 12, rng = Math.random }) {
  const finalPosition = clamp(race.finishPosition, 1, fieldSize)
  let previousPosition = null
  const checkpoints = RACE_PHASES.map((phase, index) => {
    const position = checkpointPosition(runningStyle, index, finalPosition, fieldSize, rng)
    const trend = previousPosition === null ? 'STEADY' : trendFor(previousPosition, position)
    const messages = RACE_MESSAGES[trend][runningStyle]
    previousPosition = position
    return { phase: phase.id, phaseLabel: phase.label, at: phase.at, position, trend, message: messages[randomIndex(messages, rng)] }
  })
  return { raceId: race.raceId, raceName: race.raceName, distance: race.distance, fieldSize, runningStyle, finalPosition, checkpoints, completed: false }
}
