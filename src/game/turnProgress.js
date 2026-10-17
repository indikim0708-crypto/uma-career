import { PROGRESS_MESSAGES } from '../data/progressMessages.js'
import { TURNS } from '../data/turns.js'

export const TURN_PROGRESS_DURATION_MS = 8000
export const PROGRESS_SPEEDS = [1, 2]

const randomIndex = (length, rng) => Math.min(length - 1, Math.floor(rng() * length))

export function getProgressDurationMs(speed = 1) {
  return TURN_PROGRESS_DURATION_MS / (PROGRESS_SPEEDS.includes(speed) ? speed : 1)
}

export function getEligibleProgressMessages({ stage, growthTypeId, schoolId, conditionDelta = 0 }) {
  return PROGRESS_MESSAGES.filter((message) => {
    if (message.stage !== stage) return false
    if (message.growthTypes && !message.growthTypes.includes(growthTypeId)) return false
    if (message.schools && !message.schools.includes(schoolId)) return false
    if (message.category === 'CONDITION_UP' && conditionDelta <= 0) return false
    if (message.category === 'CONDITION_DOWN' && conditionDelta >= 0) return false
    return true
  })
}

function oldestFirst(messages, recentIds) {
  return [...messages].sort((a, b) => recentIds.indexOf(b.id) - recentIds.indexOf(a.id))
}

function pickUniqueMessage(pool, selected, rng) {
  const selectedIds = new Set(selected.map(({ id }) => id))
  let candidates = pool.filter(({ id }) => !selectedIds.has(id))
  const lastTwo = selected.slice(-2)
  if (lastTwo.length === 2 && lastTwo[0].category === lastTwo[1].category) {
    const diverse = candidates.filter(({ category }) => category !== lastTwo[0].category)
    if (diverse.length) candidates = diverse
  }
  return candidates.length ? candidates[randomIndex(candidates.length, rng)] : null
}

export function selectTurnProgressMessages(context, recentIds = [], rng = Math.random, count = null) {
  const messageCount = count ?? 4 + Math.floor(rng() * 3)
  const eligible = getEligibleProgressMessages(context)
  const recentSet = new Set(recentIds.slice(0, 25))
  const fresh = eligible.filter(({ id }) => !recentSet.has(id))
  const fallback = oldestFirst(eligible.filter(({ id }) => recentSet.has(id)), recentIds)
  const selected = []

  if (context.conditionDelta !== 0) {
    const conditionCategory = context.conditionDelta > 0 ? 'CONDITION_UP' : 'CONDITION_DOWN'
    const freshConditionPool = fresh.filter(({ category }) => category === conditionCategory)
    const conditionPool = freshConditionPool.length
      ? freshConditionPool
      : fallback.filter(({ category }) => category === conditionCategory)
    if (conditionPool.length) selected.push(conditionPool[randomIndex(conditionPool.length, rng)])
  }

  const preferredFresh = fresh.filter(({ category }) => !['CONDITION_UP', 'CONDITION_DOWN'].includes(category))
  const preferredFallback = fallback.filter(({ category }) => !['CONDITION_UP', 'CONDITION_DOWN'].includes(category))
  while (selected.length < messageCount) {
    const next = pickUniqueMessage(preferredFresh, selected, rng) ?? pickUniqueMessage(preferredFallback, selected, rng)
    if (!next) break
    selected.push(next)
  }
  return selected
}

function scheduleMessages(messages, rng) {
  const maximumInterval = Math.min(1.8, 7.2 / Math.max(1, messages.length - 1))
  const intervals = messages.slice(1).map(() => 1.1 + rng() * (maximumInterval - 1.1))
  let elapsed = 0
  return messages.map((message, index) => {
    if (index > 0) elapsed += intervals[index - 1]
    return { ...message, at: elapsed * 1000 / TURN_PROGRESS_DURATION_MS }
  })
}

function hasLegendThisTurn(career, turnNumber) {
  return Boolean(career.middleState?.legendSchedule?.some(({ turn, triggered }) => turn === turnNumber && !triggered))
}

function hasHighSpecialThisTurn(career, turnNumber) {
  if ([16, 19, 23].includes(turnNumber)) return true
  if (turnNumber >= 21 && turnNumber <= 24) return true
  if (turnNumber === 17) return true
  if (turnNumber === 18) return career.highYear2?.route !== 'SPRINT'
  if (turnNumber === 20) return true
  return turnNumber === 14 || (turnNumber === 15 && career.highSchoolState?.debutStatus === 'FAILED_ONCE') || (turnNumber === 16 && career.highSchoolState?.debutStatus === 'SUCCESS' && career.growthType.id !== 'sprinter')
}

export function createTurnProgressPlan(career, rng = Math.random) {
  const turn = TURNS[career.turnIndex]
  if (!turn || !['초등부', '중등부', '고등부'].includes(turn.stage)) return null
  const stage = turn.stage === '초등부' ? 'ELEMENTARY' : turn.stage === '중등부' ? 'MIDDLE' : 'HIGH'
  const conditionDelta = career.currentTurnHistory?.naturalConditionDelta ?? 0
  const context = {
    stage,
    growthTypeId: career.growthType.id,
    schoolId: stage === 'MIDDLE' ? career.middleState?.schoolId : career.school.id,
    conditionDelta,
  }
  const messages = selectTurnProgressMessages(context, career.recentProgressMessageIds ?? [], rng)
  const eventProgressPoint = 0.35 + rng() * 0.35
  const legendRequired = stage === 'MIDDLE' ? hasLegendThisTurn(career, turn.number) : stage === 'HIGH' && hasHighSpecialThisTurn(career, turn.number)
  const legendProgressPoint = legendRequired
    ? Math.max(0.70 + rng() * 0.15, Math.min(0.85, eventProgressPoint + 0.12))
    : null
  const recentProgressMessageIds = [
    ...messages.map(({ id }) => id).reverse(),
    ...(career.recentProgressMessageIds ?? []).filter((id) => !messages.some((message) => message.id === id)),
  ].slice(0, 25)

  return {
    career: { ...career, recentProgressMessageIds },
    plan: {
      turn: turn.number,
      periodLabel: turn.label,
      stage,
      durationMs: TURN_PROGRESS_DURATION_MS,
      messages: scheduleMessages(messages, rng),
      naturalConditionDelta: conditionDelta,
      eventProgressPoint,
      legendProgressPoint,
      eventRequired: true,
      legendRequired,
      eventTriggered: false,
      eventResolved: false,
      legendTriggered: false,
      legendResolved: !legendRequired,
    },
  }
}
