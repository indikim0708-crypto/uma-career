import { MIDDLE_LEGEND_EVENTS } from '../data/middleLegendEvents.js'
import { randomChoice } from './eventScheduler.js'

export function getEligibleLegendEvents(career) {
  const schoolId = career.middleState?.schoolId
  return MIDDLE_LEGEND_EVENTS.filter((event) => (
    event.schoolId === schoolId
    && (!event.growthTypes.length || event.growthTypes.includes(career.growthType.id))
    && !(career.middleState?.completedLegendIds ?? []).includes(event.id)
  ))
}

export function rollLegendTargetCount(rng = Math.random) {
  const roll = rng()
  if (roll < 0.30) return 0
  if (roll < 0.80) return 1
  return 2
}

export function sampleWithoutReplacement(items, count, rng = Math.random) {
  const pool = [...items]
  const selected = []
  while (selected.length < count && pool.length) {
    const item = randomChoice(pool, rng)
    selected.push(item)
    pool.splice(pool.indexOf(item), 1)
  }
  return selected
}

export function scheduleMiddleLegends(career, rng = Math.random) {
  const legendTargetCount = rollLegendTargetCount(rng)
  const candidates = getEligibleLegendEvents(career)
  const actualCount = Math.min(legendTargetCount, candidates.length, 2)
  const legends = sampleWithoutReplacement(candidates, actualCount, rng)
  const turns = sampleWithoutReplacement([7, 8, 9, 10, 11, 12], actualCount, rng)
  return {
    legendTargetCount,
    legendScheduled: true,
    legendSchedule: legends.map((legend, index) => ({ eventId: legend.id, turn: turns[index], triggered: false })),
  }
}

export function getLegendById(eventId) {
  return MIDDLE_LEGEND_EVENTS.find(({ id }) => id === eventId) ?? null
}

export function getLegendDue(career, turnNumber = career.turnIndex + 1) {
  const scheduled = career.middleState?.legendSchedule.find(({ turn, triggered }) => turn === turnNumber && !triggered)
  return scheduled ? getLegendById(scheduled.eventId) : null
}
