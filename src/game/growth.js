import { MAX_STAT, STATS } from '../data/stats.js'
import { TURNS } from '../data/turns.js'
import { getNextCondition } from './condition.js'
import { weightedPick } from './random.js'
import { getElementaryEvent } from './eventScheduler.js'
import { applyEventOutcome, materializeOutcome, resolveEventChoice } from './eventResolver.js'
import { beginTurnHistory, finalizeTurnHistory } from './history.js'
import { isTransferOfferDue, markTransferOffered, resolveTransferDecision } from './transfer.js'
import { assignMiddleSchool } from './middleAdmission.js'
import { scheduleMiddleLegends } from './middleLegend.js'
import { applyMiddleNaturalCondition, chooseMiddleEvent } from './middleEvents.js'
import { beginMiddleDistanceChange, isMiddleDistanceChangeDue } from './middleDistanceChange.js'

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

export function applyBaseGrowth(career, rng) {
  const turn = TURNS[career.turnIndex]
  const growth = Object.fromEntries(STATS.map(({ id }) => [id, turn.baseGrowth]))

  for (let point = 0; point < turn.bonusPoints; point += 1) {
    growth[weightedPick(career.growthType.weights, rng)] += 1
  }

  const multiplier = getPotentialMultiplier(career.potential)
  const stats = Object.fromEntries(
    STATS.map(({ id }) => [id, Math.min(MAX_STAT, career.stats[id] + growth[id] * multiplier)]),
  )
  return { stats, expectedGrowth: (turn.baseGrowth * STATS.length + turn.bonusPoints) * multiplier }
}

function completeTurn(career, expectedGrowth, rng, eventDetails = {}) {
  const nextCondition = getNextCondition(career.condition, career.stability, rng)
  let next = { ...career, condition: nextCondition }
  next = finalizeTurnHistory(next, { ...eventDetails, expectedGrowth, rng })
  const isComplete = career.turnIndex === TURNS.length - 1
  let completed = {
    ...next,
    turnIndex: isComplete ? career.turnIndex : career.turnIndex + 1,
    notice: isComplete ? '' : getMilestone(career.turnIndex),
    complete: isComplete,
  }
  if (career.turnIndex === 5) {
    const admission = assignMiddleSchool(completed, rng)
    const middleState = {
      schoolId: admission.school.id,
      schoolName: admission.school.displayName,
      admissionScore: admission.admissionScore,
      centralAdmissionChance: admission.centralAdmissionChance,
      centralAdmissionPassed: admission.centralAdmissionPassed,
      admissionPending: true,
      completedEventIds: [],
      legendTargetCount: 0,
      legendScheduled: false,
      legendSchedule: [],
      completedLegendIds: [],
      pendingEvent: null,
      pendingOutcome: null,
      pendingLegend: null,
      pendingLegendOutcome: null,
      distanceChangePending: false,
      distanceChangeResolved: false,
    }
    completed = { ...completed, middleState }
    completed.middleState = { ...middleState, ...scheduleMiddleLegends(completed, rng) }
  }
  return completed
}

export function startElementaryTurn(career, rng = Math.random) {
  if (career.complete || career.elementaryEventState.pendingEvent) return career
  const turn = TURNS[career.turnIndex]
  if (turn.stage !== '초등부') return career
  const currentTurnHistory = beginTurnHistory(career, turn)
  const { stats, expectedGrowth } = applyBaseGrowth(career, rng)
  currentTurnHistory.statsAfterBase = { ...stats }
  currentTurnHistory.expectedGrowth = expectedGrowth
  const pendingEvent = getElementaryEvent(career, career.turnIndex + 1, rng)
  return {
    ...career,
    stats,
    currentTurnHistory,
    elementaryEventState: { ...career.elementaryEventState, pendingEvent, pendingOutcome: null },
  }
}

export function selectElementaryEventChoice(career, choiceId, rng = Math.random) {
  const { pendingEvent, pendingOutcome } = career.elementaryEventState
  if (!pendingEvent || pendingOutcome) return career
  const choice = pendingEvent.choices.find(({ id }) => id === choiceId)
  if (!choice) return career
  const resolved = resolveEventChoice(pendingEvent, choiceId, rng)
  return {
    ...career,
    elementaryEventState: {
      ...career.elementaryEventState,
      pendingOutcome: { choiceId, ...materializeOutcome(resolved, career.stats, rng, career.growthType) },
    },
  }
}

export function finishElementaryEvent(career, rng = Math.random) {
  const { pendingEvent, pendingOutcome } = career.elementaryEventState
  if (!pendingEvent || !pendingOutcome) return career
  const choice = pendingEvent.choices.find(({ id }) => id === pendingOutcome.choiceId)
  let next = applyEventOutcome(career, pendingEvent, pendingOutcome)
  next.currentTurnHistory.conditionAfterEvent = next.condition
  next.currentTurnHistory.eventConditionDelta = pendingOutcome.conditionDelta
  next = completeTurn(next, next.currentTurnHistory.expectedGrowth, rng, { event: pendingEvent, choice, outcome: pendingOutcome })
  return {
    ...next,
    elementaryEventState: { ...next.elementaryEventState, pendingEvent: null, pendingOutcome: null },
  }
}

export function advanceCareer(career, rng = Math.random) {
  if (!career.growthType) throw new Error('Growth type must be selected before advancing.')
  if (career.complete) return career
  if (TURNS[career.turnIndex].stage === '초등부') {
    if (career.transferState?.offered && !career.transferState.resolved) return career
    if (isTransferOfferDue(career)) return markTransferOffered(career)
    return startElementaryTurn(career, rng)
  }

  if (TURNS[career.turnIndex].stage === '중등부') {
    if (career.middleState?.admissionPending || career.middleState?.pendingEvent || career.middleState?.pendingLegend || career.middleState?.distanceChangePending) return career
    if (isMiddleDistanceChangeDue(career)) return beginMiddleDistanceChange(career)
    const turn = TURNS[career.turnIndex]
    const currentTurnHistory = beginTurnHistory(career, turn)
    const conditioned = applyMiddleNaturalCondition(career, rng)
    currentTurnHistory.naturalConditionDelta = conditioned.naturalConditionDelta
    const { stats, expectedGrowth } = applyBaseGrowth(conditioned, rng)
    currentTurnHistory.statsAfterBase = { ...stats }
    currentTurnHistory.expectedGrowth = expectedGrowth
    return {
      ...conditioned,
      stats,
      currentTurnHistory,
      middleState: {
        ...conditioned.middleState,
        pendingEvent: chooseMiddleEvent(conditioned, rng),
        pendingOutcome: null,
      },
    }
  }

  const turn = TURNS[career.turnIndex]
  const currentTurnHistory = beginTurnHistory(career, turn)
  const { stats, expectedGrowth } = applyBaseGrowth(career, rng)
  currentTurnHistory.statsAfterBase = { ...stats }
  return completeTurn({ ...career, stats, currentTurnHistory }, expectedGrowth, rng)
}

export function acknowledgeMiddleAdmission(career) {
  if (!career.middleState?.admissionPending) return career
  return { ...career, middleState: { ...career.middleState, admissionPending: false } }
}

export function resolveTransferAndStartElementaryTurn(career, accepted, rng = Math.random) {
  const resolved = resolveTransferDecision(career, accepted, rng)
  if (resolved === career) return career
  return startElementaryTurn(resolved, rng)
}

export function displayStat(value) {
  return Math.round(value)
}
