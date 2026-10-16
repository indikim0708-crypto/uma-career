import { HIGH_SCHOOL_YEAR1_EVENTS } from '../data/highSchoolYear1Events.js'
import { MAX_STAT, STATS } from '../data/stats.js'
import { RACE_BALANCE } from '../data/raceBalance.js'
import { applyMiddleNaturalCondition } from './middleEvents.js'
import { materializeOutcome, moveCondition, resolveEventChoice } from './eventResolver.js'
import { randomChoice } from './eventScheduler.js'
import { finalizeTurnHistory } from './history.js'
import { beginTurnHistory } from './history.js'
import { TURNS } from '../data/turns.js'

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value))
const chanceFor = (score, bands) => bands.find(({ below }) => score < below).chance

export function createHighSchoolState() {
  return { completedEventIds: [], pendingEvent: null, pendingOutcome: null, pendingRace: null, pendingRaceResult: null, debutStatus: 'PENDING', debutAttempts: 0, achievements: [] }
}

export function getHighSchoolRaceScore(career, raceId = 'debut') {
  const { speed, stamina, power, grit, intelligence } = career.stats
  const id = career.growthType.id
  if (raceId === 'g1_hopeful') return id === 'stayer'
    ? stamina * .25 + speed * .20 + grit * .20 + intelligence * .20 + power * .15
    : speed * .25 + power * .20 + stamina * .20 + intelligence * .20 + grit * .15
  if (id === 'sprinter') return speed * .30 + power * .30 + intelligence * .20 + grit * .10 + stamina * .10
  if (id === 'miler') return speed * .30 + power * .25 + intelligence * .20 + stamina * .15 + grit * .10
  if (id === 'router') return speed * .25 + power * .20 + intelligence * .20 + stamina * .20 + grit * .15
  return stamina * .30 + grit * .20 + speed * .20 + intelligence * .20 + power * .10
}

function createDebutRace(career, retry, rng) {
  const raceScore = getHighSchoolRaceScore(career)
  const chance = clamp(chanceFor(raceScore, RACE_BALANCE.debutChanceBands) + (retry ? .10 : 0), 0, .93)
  const won = rng() < chance
  return { id: retry ? 'debut_retry' : 'debut', raceId: retry ? 'debut_retry' : 'debut', raceName: retry ? '데뷔 재도전' : '첫 데뷔전', raceType: 'DEBUT', distance: '데뷔전', attempt: retry ? 2 : 1, raceScore, chance, result: won ? 'SUCCESS' : 'FAILURE', finishPosition: won ? 1 : null, won, choices: [{ id: 'run', text: '데뷔전에 출전한다' }] }
}

function createG1Race(career) {
  const miler = career.growthType.id === 'miler'
  const raceId = miler ? 'g1_asahi' : 'g1_hopeful'
  return { id: raceId, raceId, raceName: miler ? '아사히배 퓨처러티 스테이크스' : '호프풀 스테이크스', raceType: 'G1', distance: miler ? '1600m' : '2000m', attempt: 1, raceScore: getHighSchoolRaceScore(career, raceId), choices: [{ id: 'enter', text: 'G1에 도전한다' }, { id: 'decline', text: '올해는 경험을 쌓는 데 집중한다' }] }
}

function resolveG1Race(race, rng) {
  const chance = chanceFor(race.raceScore, RACE_BALANCE.g1WinChanceBands)
  if (rng() < chance) return { ...race, chance, result: 'WIN', finishPosition: 1, won: true }
  const roll = rng()
  const finishPosition = roll < .46 ? (rng() < .5 ? 2 : 3) : roll < .80 ? 4 + Math.floor(rng() * 3) : 7 + Math.floor(rng() * 6)
  return { ...race, chance, result: finishPosition <= 3 ? 'PLACE' : finishPosition <= 6 ? 'MIDFIELD' : 'LOW', finishPosition, won: false }
}

function applyChanges(career, changes, conditionDelta = 0) {
  const stats = { ...career.stats }
  for (const [id, amount] of Object.entries(changes)) stats[id] = clamp(stats[id] + amount, 0, MAX_STAT)
  return { ...career, stats, condition: moveCondition(career.condition, conditionDelta) }
}

function applyRaceRewards(career, race) {
  if (race.raceType === 'DEBUT') return career
  const primary = Object.entries(career.growthType.weights).sort((a, b) => b[1] - a[1])[0][0]
  if (race.won) return applyChanges(career, { intelligence: 5, [primary]: 5, grit: 3 }, 1)
  if (race.finishPosition <= 3) return applyChanges(career, { intelligence: 4, [primary]: 3, grit: 2 })
  if (race.finishPosition <= 6) return applyChanges(career, { intelligence: 3, [primary]: 2 })
  return applyChanges(career, { intelligence: 2 })
}

function writeRaceHistory(career, race) {
  career.currentTurnHistory.race = { raceId: race.raceId, raceName: race.raceName, raceType: race.raceType, turn: career.turnIndex + 1, periodLabel: career.currentTurnHistory.periodLabel, distance: race.distance, attempt: race.attempt, result: race.result, finishPosition: race.finishPosition, won: Boolean(race.won) }
}

function finalizeHighTurn(career, rng) {
  const next = finalizeTurnHistory(career, { expectedGrowth: career.currentTurnHistory.expectedGrowth, rng, preserveNaturalCondition: true })
  const failedDebut = next.highSchoolState.pendingRaceResult?.raceType === 'DEBUT' && next.highSchoolState.pendingRaceResult.result === 'FAILURE' && next.highSchoolState.pendingRaceResult.attempt === 2
  if (failedDebut) return { ...next, complete: true, badEnding: { id: 'failed_debut_bad_end', title: '끝내 넘지 못한 데뷔의 벽', body: '두 번째 데뷔전도 끝났다.\n\n마지막까지 최선을 다했지만 공식 레이서로 인정받기 위한 기록에는 도달하지 못했다.\n\n중앙 트레센 고등부까지 올라왔지만, 결국 공식 레이스의 출발선에는 서지 못했다.\n\n오랫동안 바라보았던 트랙을 뒤로하고 그녀의 선수 생활은 여기서 끝을 맺었다.' } }
  return { ...next, turnIndex: career.turnIndex + 1, highSchoolState: { ...next.highSchoolState, pendingEvent: null, pendingOutcome: null, pendingRace: null, pendingRaceResult: null } }
}

export function startHighSchoolTurn(career, rng = Math.random) {
  if (career.highSchoolState?.pendingEvent || career.highSchoolState?.pendingRace) return career
  const conditioned = applyMiddleNaturalCondition(career, rng)
  const { stats, expectedGrowth } = (awaitableApplyBaseGrowth(conditioned, rng))
  const currentTurnHistory = beginTurnHistory(career, TURNS[career.turnIndex])
  currentTurnHistory.naturalConditionDelta = conditioned.naturalConditionDelta
  return { ...conditioned, stats, currentTurnHistory: { ...currentTurnHistory, statsAfterBase: { ...stats }, expectedGrowth }, highSchoolState: { ...conditioned.highSchoolState, pendingEvent: randomChoice(HIGH_SCHOOL_YEAR1_EVENTS.filter(({ id }) => !conditioned.highSchoolState.completedEventIds.includes(id)), rng), pendingOutcome: null } }
}

// Avoid a circular import while sharing the existing base-growth rule.
function awaitableApplyBaseGrowth(career, rng) {
  const turn = { baseGrowth: 2, bonusPoints: 4 }
  const growth = Object.fromEntries(STATS.map(({ id }) => [id, turn.baseGrowth]))
  for (let index = 0; index < turn.bonusPoints; index += 1) {
    const entries = Object.entries(career.growthType.weights); let roll = rng(); let chosen = entries.at(-1)[0]
    for (const [id, weight] of entries) { roll -= weight; if (roll < 0) { chosen = id; break } }
    growth[chosen] += 1
  }
  const multiplier = career.potential < 20 ? .9 : career.potential < 40 ? .95 : career.potential < 60 ? 1 : career.potential < 80 ? 1.05 : career.potential < 95 ? 1.1 : 1.15
  return { stats: Object.fromEntries(STATS.map(({ id }) => [id, Math.min(MAX_STAT, career.stats[id] + growth[id] * multiplier)])), expectedGrowth: (turn.baseGrowth * STATS.length + turn.bonusPoints) * multiplier }
}

export function selectHighSchoolEventChoice(career, choiceId, rng = Math.random) {
  const event = career.highSchoolState?.pendingEvent
  if (!event || career.highSchoolState.pendingOutcome) return career
  return { ...career, highSchoolState: { ...career.highSchoolState, pendingOutcome: { choiceId, ...materializeOutcome(resolveEventChoice(event, choiceId, rng), career.stats, rng, career.growthType) } } }
}

export function finishHighSchoolEvent(career, rng = Math.random) {
  const { pendingEvent: event, pendingOutcome: outcome } = career.highSchoolState
  if (!event || !outcome) return career
  let next = applyChanges(career, outcome.statChanges, outcome.conditionDelta)
  next.currentTurnHistory = structuredClone(career.currentTurnHistory)
  next.currentTurnHistory.event = { eventId: event.id, eventName: event.name, eventType: event.type, situation: event.situation, selectedChoiceId: outcome.choiceId, selectedChoiceText: event.choices.find(({ id }) => id === outcome.choiceId).text, outcomeType: outcome.type, outcomeText: outcome.text, statChanges: outcome.statChanges, conditionDelta: outcome.conditionDelta }
  next.currentTurnHistory.statsAfterEvent = { ...next.stats }
  const turn = next.turnIndex + 1
  const retry = turn === 15 && next.highSchoolState.debutStatus === 'FAILED_ONCE'
  const race = turn === 14 ? createDebutRace(next, false, rng) : retry ? createDebutRace(next, true, rng) : turn === 16 && next.highSchoolState.debutStatus === 'SUCCESS' && next.growthType.id !== 'sprinter' ? createG1Race(next) : null
  next = { ...next, highSchoolState: { ...next.highSchoolState, completedEventIds: [...next.highSchoolState.completedEventIds, event.id], pendingEvent: null, pendingOutcome: null, pendingRace: race } }
  return race ? next : finalizeHighTurn(next, rng)
}

export function resolveHighSchoolRace(career, choiceId = 'run', rng = Math.random) {
  const race = career.highSchoolState?.pendingRace
  if (!race || career.highSchoolState.pendingRaceResult) return career
  if (race.raceType === 'G1' && choiceId === 'decline') return { ...career, highSchoolState: { ...career.highSchoolState, pendingRaceResult: { ...race, result: 'DECLINED', finishPosition: null, won: false } } }
  const result = race.raceType === 'G1' ? resolveG1Race(race, rng) : race
  return { ...career, highSchoolState: { ...career.highSchoolState, pendingRaceResult: result } }
}

export function finishHighSchoolRace(career, rng = Math.random) {
  const race = career.highSchoolState?.pendingRaceResult
  if (!race) return career
  let next = race.result === 'DECLINED' ? career : applyRaceRewards(career, race)
  next.currentTurnHistory = structuredClone(career.currentTurnHistory)
  writeRaceHistory(next, race)
  const highSchoolState = { ...next.highSchoolState, pendingRaceResult: race, debutStatus: race.raceType === 'DEBUT' ? (race.result === 'SUCCESS' ? 'SUCCESS' : 'FAILED_ONCE') : next.highSchoolState.debutStatus, debutAttempts: race.raceType === 'DEBUT' ? race.attempt : next.highSchoolState.debutAttempts, achievements: race.raceType === 'G1' && race.won ? [...next.highSchoolState.achievements, race] : next.highSchoolState.achievements }
  return finalizeHighTurn({ ...next, highSchoolState }, rng)
}
