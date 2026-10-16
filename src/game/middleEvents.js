import { MIDDLE_COMMON_EVENTS } from '../data/middleEvents.js'
import { MAX_STAT } from '../data/stats.js'
import { TURNS } from '../data/turns.js'
import { rollNaturalConditionChange } from './condition.js'
import { materializeOutcome, moveCondition, resolveEventChoice } from './eventResolver.js'
import { randomChoice } from './eventScheduler.js'
import { finalizeTurnHistory } from './history.js'
import { getLegendDue } from './middleLegend.js'
import { beginHighSchoolAdmission } from './highSchoolAdmission.js'

export function getEligibleMiddleEvents(career) {
  const completed = career.middleState?.completedEventIds ?? []
  return MIDDLE_COMMON_EVENTS.filter(({ id }) => !completed.includes(id))
}

export function chooseMiddleEvent(career, rng = Math.random) {
  const eligible = getEligibleMiddleEvents(career)
  return randomChoice(eligible.length ? eligible : MIDDLE_COMMON_EVENTS, rng)
}

function applyMiddleOutcome(career, outcome) {
  const next = structuredClone(career)
  for (const [stat, delta] of Object.entries(outcome.statChanges ?? {})) {
    next.stats[stat] = Math.max(0, Math.min(MAX_STAT, next.stats[stat] + delta))
  }
  next.condition = moveCondition(next.condition, outcome.conditionDelta ?? 0)
  return next
}

export function applyMiddleNaturalCondition(career, rng = Math.random) {
  const delta = rollNaturalConditionChange(career.stability, rng)
  return { ...career, condition: moveCondition(career.condition, delta), naturalConditionDelta: delta }
}

export function selectMiddleEventChoice(career, choiceId, rng = Math.random) {
  const { pendingEvent, pendingOutcome } = career.middleState
  if (!pendingEvent || pendingOutcome || pendingEvent.type !== 'MIDDLE_COMMON') return career
  const choice = pendingEvent.choices.find(({ id }) => id === choiceId)
  if (!choice) return career
  const resolved = resolveEventChoice(pendingEvent, choiceId, rng)
  return {
    ...career,
    middleState: {
      ...career.middleState,
      pendingOutcome: { choiceId, ...materializeOutcome(resolved, career.stats, rng, career.growthType) },
    },
  }
}

function writeCommonEventHistory(history, event, choice, outcome) {
  history.conditionAfterEvent = null
  history.eventConditionDelta = outcome.conditionDelta
  history.event = {
    eventId: event.id,
    eventName: event.name,
    eventType: event.type,
    situation: event.situation,
    selectedChoiceId: choice.id,
    selectedChoiceText: choice.text,
    outcomeType: outcome.type,
    outcomeText: outcome.text,
    statChanges: { ...outcome.statChanges },
    conditionDelta: outcome.conditionDelta,
  }
}

function finalizeMiddleTurn(career, rng) {
  const expectedGrowth = career.currentTurnHistory.expectedGrowth
  const next = finalizeTurnHistory(career, { expectedGrowth, rng, preserveNaturalCondition: true })
  const finalized = {
    ...next,
    turnIndex: career.turnIndex === 11 ? career.turnIndex : career.turnIndex + 1,
    notice: career.turnIndex === 11 ? '중등부를 졸업했습니다. 고등부 진학 준비가 시작됩니다.' : '',
    middleState: {
      ...next.middleState,
      pendingEvent: null,
      pendingOutcome: null,
      pendingLegend: null,
      pendingLegendOutcome: null,
    },
  }
  return career.turnIndex === 11 ? beginHighSchoolAdmission(finalized, rng) : finalized
}

export function finishMiddleEvent(career, rng = Math.random) {
  const { pendingEvent, pendingOutcome } = career.middleState
  if (!pendingEvent || !pendingOutcome || pendingEvent.type !== 'MIDDLE_COMMON') return career
  const choice = pendingEvent.choices.find(({ id }) => id === pendingOutcome.choiceId)
  let next = applyMiddleOutcome(career, pendingOutcome)
  next.currentTurnHistory = structuredClone(career.currentTurnHistory)
  writeCommonEventHistory(next.currentTurnHistory, pendingEvent, choice, pendingOutcome)
  next.currentTurnHistory.conditionAfterEvent = next.condition
  next.currentTurnHistory.statsAfterEvent = { ...next.stats }
  next.middleState = {
    ...next.middleState,
    completedEventIds: [...next.middleState.completedEventIds, pendingEvent.id],
    pendingEvent: null,
    pendingOutcome: null,
  }
  const legend = getLegendDue(next)
  if (legend) return { ...next, middleState: { ...next.middleState, pendingLegend: legend, pendingLegendOutcome: null } }
  return finalizeMiddleTurn(next, rng)
}

export function selectMiddleLegend(career, rng = Math.random) {
  const { pendingLegend, pendingLegendOutcome } = career.middleState
  if (!pendingLegend || pendingLegendOutcome) return career
  const choice = pendingLegend.choices[0]
  const resolved = resolveEventChoice(pendingLegend, choice.id, rng)
  return {
    ...career,
    middleState: {
      ...career.middleState,
      pendingLegendOutcome: { choiceId: choice.id, ...materializeOutcome(resolved, career.stats, rng, career.growthType) },
    },
  }
}

export function finishMiddleLegend(career, rng = Math.random) {
  const { pendingLegend, pendingLegendOutcome } = career.middleState
  if (!pendingLegend || !pendingLegendOutcome) return career
  let next = applyMiddleOutcome(career, pendingLegendOutcome)
  const choice = pendingLegend.choices[0]
  next.currentTurnHistory = structuredClone(career.currentTurnHistory)
  next.currentTurnHistory.legendEvent = {
    eventId: pendingLegend.id,
    characterName: pendingLegend.characterName,
    title: pendingLegend.title,
    portrait: pendingLegend.portrait,
    selectedChoiceText: choice.text,
    outcomeType: pendingLegendOutcome.type,
    outcomeText: pendingLegendOutcome.text,
    statChanges: { ...pendingLegendOutcome.statChanges },
    conditionDelta: pendingLegendOutcome.conditionDelta,
  }
  next.currentTurnHistory.legendConditionDelta = pendingLegendOutcome.conditionDelta
  next.middleState = {
    ...next.middleState,
    completedLegendIds: [...next.middleState.completedLegendIds, pendingLegend.id],
    legendSchedule: next.middleState.legendSchedule.map((entry) => entry.eventId === pendingLegend.id ? { ...entry, triggered: true } : entry),
    pendingLegend: null,
    pendingLegendOutcome: null,
  }
  return finalizeMiddleTurn(next, rng)
}

export function getMiddleTurn(career) {
  return TURNS[career.turnIndex]
}
