import { MAX_STAT, STATS } from '../data/stats.js'
import { TURNS } from '../data/turns.js'
import { getNextCondition } from './condition.js'
import { weightedPick } from './random.js'

export function getPotentialMultiplier(potential) {
  if (potential < 20) return 0.9
  if (potential < 40) return 0.95
  if (potential < 60) return 1
  if (potential < 80) return 1.05
  if (potential < 95) return 1.1
  return 1.15
}

function getMilestone(completedTurnIndex) {
  if (completedTurnIndex === 5) return '초등부를 졸업했습니다. 중등부 생활이 시작됩니다.'
  if (completedTurnIndex === 11) return '중등부를 졸업했습니다. 본격적인 레이스 커리어가 시작됩니다.'
  return ''
}

export function advanceCareer(career, rng = Math.random) {
  if (!career.growthType) throw new Error('Growth type must be selected before advancing.')
  if (career.complete) return career

  const turn = TURNS[career.turnIndex]
  const growth = Object.fromEntries(STATS.map(({ id }) => [id, turn.baseGrowth]))

  for (let point = 0; point < turn.bonusPoints; point += 1) {
    growth[weightedPick(career.growthType.weights, rng)] += 1
  }

  const multiplier = getPotentialMultiplier(career.potential)
  const before = { ...career.stats }
  const stats = Object.fromEntries(
    STATS.map(({ id }) => [id, Math.min(MAX_STAT, before[id] + growth[id] * multiplier)]),
  )
  const nextCondition = getNextCondition(career.condition, career.stability, rng)
  const log = {
    turn: turn.number,
    label: turn.label,
    before,
    after: stats,
    conditionBefore: career.condition,
    conditionAfter: nextCondition,
  }
  const isComplete = career.turnIndex === TURNS.length - 1

  return {
    ...career,
    stats,
    condition: nextCondition,
    turnIndex: isComplete ? career.turnIndex : career.turnIndex + 1,
    logs: [log, ...career.logs].slice(0, 5),
    notice: isComplete ? '' : getMilestone(career.turnIndex),
    complete: isComplete,
  }
}

export function displayStat(value) {
  return Math.round(value)
}
