import { MAX_STAT, STATS } from '../data/stats.js'
import { CONDITIONS } from './condition.js'
import { randomChoice } from './eventScheduler.js'

export function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value))
}

export function moveCondition(current, delta) {
  const index = CONDITIONS.indexOf(current)
  return CONDITIONS[clamp(index + delta, 0, CONDITIONS.length - 1)]
}

export function weightedRandom(outcomes, rng = Math.random) {
  const total = outcomes.reduce((sum, item) => sum + item.weight, 0)
  let roll = rng() * total
  for (const item of outcomes) {
    roll -= item.weight
    if (roll < 0) return item
  }
  return outcomes.at(-1)
}

export function resolveEventChoice(event, choiceId, rng = Math.random) {
  const choice = event.choices.find(({ id }) => id === choiceId)
  if (!choice) throw new Error('Invalid event choice')
  const totalWeight = choice.outcomes.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight !== 100) throw new Error(`Invalid probability: ${event.id}/${choice.id}`)
  return weightedRandom(choice.outcomes, rng)
}

function growthStatIds(growthType, key) {
  const labels = growthType?.[key] ?? []
  return STATS.filter(({ label }) => labels.includes(label)).map(({ id }) => id)
}

function effectStats(stats, effect, rng, growthType) {
  if (!effect) return {}
  const candidates = STATS.map(({ id }) => id).filter((id) => !(effect.exclude ?? []).includes(id))
  if (effect.kind === 'HIGHEST' || effect.kind === 'LOWEST') {
    const targetValue = effect.kind === 'HIGHEST'
      ? Math.max(...candidates.map((id) => stats[id]))
      : Math.min(...candidates.map((id) => stats[id]))
    const tied = candidates.filter((id) => stats[id] === targetValue)
    return { [randomChoice(tied, rng)]: effect.amount }
  }
  if (effect.kind === 'RANDOM') return { [randomChoice(candidates, rng)]: effect.amount }
  if (effect.kind === 'RANDOM_DISTINCT') {
    const pool = [...candidates]
    const changes = {}
    for (let index = 0; index < effect.count && pool.length; index += 1) {
      const selected = randomChoice(pool, rng)
      pool.splice(pool.indexOf(selected), 1)
      changes[selected] = effect.amount
    }
    return changes
  }
  if (effect.kind === 'GROWTH_MAIN' || effect.kind === 'GROWTH_SUPPORT') {
    const key = effect.kind === 'GROWTH_MAIN' ? 'main' : 'support'
    const growthCandidates = growthStatIds(growthType, key)
    return growthCandidates.length ? { [randomChoice(growthCandidates, rng)]: effect.amount } : {}
  }
  return {}
}

export function materializeOutcome(outcome, stats, rng = Math.random, growthType = null) {
  const statChanges = { ...(outcome.statChanges ?? {}) }
  const effects = [...(outcome.effects ?? []), ...(outcome.effect ? [outcome.effect] : [])]
  for (const effect of effects) {
    for (const [stat, amount] of Object.entries(effectStats(stats, effect, rng, growthType))) {
      statChanges[stat] = (statChanges[stat] ?? 0) + amount
    }
  }
  return { type: outcome.type, text: outcome.text, statChanges, conditionDelta: outcome.conditionDelta ?? 0 }
}

export function applyEventOutcome(career, event, pendingOutcome) {
  const next = structuredClone(career)
  for (const [stat, delta] of Object.entries(pendingOutcome.statChanges ?? {})) {
    next.stats[stat] = clamp(next.stats[stat] + delta, 0, MAX_STAT)
  }
  next.condition = moveCondition(next.condition, pendingOutcome.conditionDelta ?? 0)
  if (event.type === 'SCHOOL' || event.type === 'SIGNATURE') next.elementaryEventState.schoolEventCount += 1
  if (event.type === 'SIGNATURE') next.elementaryEventState.signatureTriggered = true
  if (!next.elementaryEventState.completedEventIds.includes(event.id)) next.elementaryEventState.completedEventIds.push(event.id)
  return next
}
