import { HIGH_SCHOOL_YEAR1_EVENTS } from '../data/highSchoolYear1Events.js'
import { MAX_STAT, STATS } from '../data/stats.js'
import { RACE_BALANCE } from '../data/raceBalance.js'
import { applyMiddleNaturalCondition } from './middleEvents.js'
import { materializeOutcome, moveCondition, resolveEventChoice } from './eventResolver.js'
import { randomChoice } from './eventScheduler.js'
import { finalizeTurnHistory } from './history.js'
import { beginTurnHistory } from './history.js'
import { TURNS } from '../data/turns.js'
import { getRunningStyle, RUNNING_STYLES } from '../data/runningStyles.js'
import { createRacePlan } from './racePlan.js'
import { HIGH_SCHOOL_YEAR2_EVENTS } from '../data/highSchoolYear2Events.js'
import { HIGH_YEAR2_RACES, TURN18_RACES, TURN20_RACES } from '../data/highSchoolYear2Races.js'

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value))
const chanceFor = (score, bands) => bands.find(({ below }) => score < below).chance

export function createHighSchoolState() {
  return { completedEventIds: [], pendingEvent: null, pendingOutcome: null, pendingRace: null, pendingRaceResult: null, racePlan: null, pendingRunningStyleDecision: null, runningStyleDecisionResolved: false, debutStatus: 'PENDING', debutAttempts: 0, achievements: [] }
}

export function createHighYear2State() {
  return { route: null, derbyDecisionResolved: false, enteredJapanDerby: false, pendingSpecial: null, pendingAchievement: null, raceQueue: [], racesCompletedThisTurn: 0, consecutivePenaltyApplied: false, raceResults: {}, achievements: [] }
}

export function getRecommendedRunningStyle(stats) {
  const scores = {
    NIGE: stats.speed * .35 + stats.stamina * .25 + stats.intelligence * .25 + stats.power * .10 + stats.grit * .05,
    SENKO: stats.speed * .30 + stats.power * .25 + stats.intelligence * .25 + stats.stamina * .15 + stats.grit * .05,
    SASHI: stats.power * .30 + stats.intelligence * .30 + stats.speed * .20 + stats.grit * .15 + stats.stamina * .05,
    OIKOMI: stats.power * .25 + stats.grit * .25 + stats.intelligence * .30 + stats.speed * .15 + stats.stamina * .05,
  }
  return RUNNING_STYLES.reduce((recommended, style) => scores[style.id] > scores[recommended] ? style.id : recommended, 'NIGE')
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

function createYear2Race(career, raceId) {
  const race = HIGH_YEAR2_RACES[raceId]
  return { ...race, id: race.raceId, raceType: 'G1', attempt: 1, raceScore: getHighSchoolRaceScore(career, raceId), choices: [{ id: 'enter', text: `${race.raceName}에 출전한다` }] }
}

function scheduleNextYear2Race(career) {
  const [raceId, ...raceQueue] = career.highYear2.raceQueue
  if (!raceId) return career
  return {
    ...career,
    highYear2: { ...career.highYear2, raceQueue },
    highSchoolState: { ...career.highSchoolState, pendingRace: createYear2Race(career, raceId), pendingRaceResult: null, racePlan: null },
  }
}

function queueYear2Races(career, raceIds, resetTurnCount = true) {
  const next = { ...career, highYear2: { ...career.highYear2, raceQueue: [...raceIds], racesCompletedThisTurn: resetTurnCount ? 0 : career.highYear2.racesCompletedThisTurn, consecutivePenaltyApplied: resetTurnCount ? false : career.highYear2.consecutivePenaltyApplied } }
  return scheduleNextYear2Race(next)
}

function classicSeasonSpecial(career) {
  const automaticRoute = { sprinter: 'SPRINT', miler: 'MILE', stayer: 'LONG' }[career.growthType.id]
  const choices = automaticRoute
    ? [{ id: automaticRoute, text: `${automaticRoute === 'SPRINT' ? '스프린트' : automaticRoute === 'MILE' ? '마일' : '장거리'} 노선으로 나아간다` }]
    : [{ id: 'CLASSIC_TRIPLE', text: '클래식 삼관에 도전한다' }, { id: 'TRIPLE_TIARA', text: '트리플 티아라에 도전한다' }]
  return { id: 'high2_classic_season', title: '클래식 시즌', description: '본격적인 클래식 시즌이 시작됩니다. 앞으로의 목표 레이스와 시즌 노선을 결정할 때입니다.', choices }
}

function derbyDreamSpecial(route) {
  const long = route === 'LONG'
  return {
    id: 'high2_derby_dream',
    title: '더비라는 꿈',
    description: long
      ? '코치가 일본 더비 출전표를 바라보고 있습니다. 당신의 진짜 무대는 더 긴 거리일지도 모릅니다. 하지만 일본 더비는 이번 한 번뿐입니다. 도전하시겠습니까?'
      : '코치가 일본 더비 출전표를 바라보고 있습니다. 2400m는 주력 거리보다 훨씬 깁니다. 하지만 일본 더비는 평생 한 번뿐인 무대입니다. 도전하시겠습니까?',
    choices: [{ id: 'ENTER_DERBY', text: '일본 더비에 도전한다' }, { id: 'SKIP_DERBY', text: long ? '가을 장거리 시즌을 준비한다' : '마일 노선에 집중한다' }],
  }
}

function routeForGrowthType(growthTypeId) {
  return { sprinter: 'SPRINT', miler: 'MILE', stayer: 'LONG' }[growthTypeId] ?? null
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
  const entry = { raceId: race.raceId, raceName: race.raceName, raceType: race.raceType, grade: race.grade ?? race.raceType, turn: career.turnIndex + 1, periodLabel: career.currentTurnHistory.periodLabel, distance: race.distance, attempt: race.attempt, result: race.result, finishPosition: race.finishPosition, runningStyle: career.runningStyle, won: Boolean(race.won) }
  career.currentTurnHistory.race = entry
  career.currentTurnHistory.races = [...(career.currentTurnHistory.races ?? []), entry]
}

function finalizeHighTurn(career, rng) {
  const next = finalizeTurnHistory(career, { expectedGrowth: career.currentTurnHistory.expectedGrowth, rng, preserveNaturalCondition: true })
  const failedDebut = next.highSchoolState.pendingRaceResult?.raceType === 'DEBUT' && next.highSchoolState.pendingRaceResult.result === 'FAILURE' && next.highSchoolState.pendingRaceResult.attempt === 2
  if (failedDebut) return { ...next, complete: true, badEnding: { id: 'failed_debut_bad_end', title: '끝내 넘지 못한 데뷔의 벽', body: '두 번째 데뷔전도 끝났다.\n\n마지막까지 최선을 다했지만 공식 레이서로 인정받기 위한 기록에는 도달하지 못했다.\n\n중앙 트레센 고등부까지 올라왔지만, 결국 공식 레이스의 출발선에는 서지 못했다.\n\n오랫동안 바라보았던 트랙을 뒤로하고 그녀의 선수 생활은 여기서 끝을 맺었다.' } }
  return { ...next, turnIndex: career.turnIndex + 1, highSchoolState: { ...next.highSchoolState, pendingEvent: null, pendingOutcome: null, pendingRace: null, pendingRaceResult: null, racePlan: null } }
}

export function startHighSchoolTurn(career, rng = Math.random) {
  if (career.highSchoolState?.pendingEvent || career.highSchoolState?.pendingRace || career.highSchoolState?.pendingRunningStyleDecision || career.highYear2?.pendingSpecial) return career
  if (career.turnIndex === 13 && !career.runningStyle) return career
  const withYear2 = career.turnIndex >= 16 && !career.highYear2 ? { ...career, highYear2: createHighYear2State() } : career
  const conditioned = applyMiddleNaturalCondition(withYear2, rng)
  const { stats, expectedGrowth } = (awaitableApplyBaseGrowth(conditioned, rng))
  const currentTurnHistory = beginTurnHistory(withYear2, TURNS[career.turnIndex])
  currentTurnHistory.naturalConditionDelta = conditioned.naturalConditionDelta
  if (career.turnIndex >= 16) currentTurnHistory.seasonRoute = withYear2.highYear2?.route ?? null
  const eventPool = career.turnIndex >= 16 ? HIGH_SCHOOL_YEAR2_EVENTS : HIGH_SCHOOL_YEAR1_EVENTS
  return { ...conditioned, stats, currentTurnHistory: { ...currentTurnHistory, statsAfterBase: { ...stats }, expectedGrowth }, highSchoolState: { ...conditioned.highSchoolState, pendingEvent: randomChoice(eventPool.filter(({ id }) => !conditioned.highSchoolState.completedEventIds.includes(id)), rng), pendingOutcome: null } }
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

function beginYear2PostEvent(career, turn, rng) {
  if (turn === 17) {
    const route = routeForGrowthType(career.growthType.id)
    return { ...career, highYear2: { ...career.highYear2, route, pendingSpecial: classicSeasonSpecial(career) } }
  }
  if (turn === 18) {
    const route = career.highYear2.route
    if (route === 'SPRINT') return finalizeHighTurn(career, rng)
    if (route === 'LONG') return { ...career, highYear2: { ...career.highYear2, pendingSpecial: derbyDreamSpecial(route), racesCompletedThisTurn: 0, consecutivePenaltyApplied: false } }
    return queueYear2Races(career, TURN18_RACES[route])
  }
  if (turn === 19) return finalizeHighTurn(career, rng)
  if (turn === 20) return queueYear2Races(career, TURN20_RACES[career.highYear2.route])
  return finalizeHighTurn(career, rng)
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
  if (turn >= 17 && turn <= 20) return beginYear2PostEvent(next, turn, rng)
  if (turn === 13 && !next.highSchoolState.runningStyleDecisionResolved) {
    return { ...next, highSchoolState: { ...next.highSchoolState, pendingRunningStyleDecision: { recommendedStyle: getRecommendedRunningStyle(next.stats), selectedStyle: null } } }
  }
  return race ? next : finalizeHighTurn(next, rng)
}

export function resolveHighYear2Special(career, choiceId, rng = Math.random) {
  const special = career.highYear2?.pendingSpecial
  if (!special || !special.choices.some(({ id }) => id === choiceId)) return career
  if (special.id === 'high2_classic_season') {
    const allowedRoutes = career.growthType.id === 'router' ? ['CLASSIC_TRIPLE', 'TRIPLE_TIARA'] : [routeForGrowthType(career.growthType.id)]
    if (!allowedRoutes.includes(choiceId)) return career
    const next = {
      ...career,
      highYear2: { ...career.highYear2, route: choiceId, pendingSpecial: null },
    }
    next.currentTurnHistory.special = { id: special.id, title: special.title, selectedRoute: choiceId, selectedChoiceText: special.choices.find(({ id }) => id === choiceId).text }
    next.currentTurnHistory.seasonRoute = choiceId
    return finalizeHighTurn(next, rng)
  }
  if (special.id === 'high2_derby_dream') {
    const entered = choiceId === 'ENTER_DERBY'
    const next = { ...career, highYear2: { ...career.highYear2, derbyDecisionResolved: true, enteredJapanDerby: entered, pendingSpecial: null } }
    next.currentTurnHistory.special = { id: special.id, title: special.title, enteredJapanDerby: entered, selectedChoiceText: special.choices.find(({ id }) => id === choiceId).text }
    return entered ? queueYear2Races(next, ['japan_derby'], false) : finalizeHighTurn(next, rng)
  }
  return career
}

export function selectHighSchoolRunningStyle(career, styleId) {
  const decision = career.highSchoolState?.pendingRunningStyleDecision
  if (!decision || decision.selectedStyle || !getRunningStyle(styleId)) return career
  return { ...career, highSchoolState: { ...career.highSchoolState, pendingRunningStyleDecision: { ...decision, selectedStyle: styleId } } }
}

export function finishHighSchoolRunningStyle(career, rng = Math.random) {
  const decision = career.highSchoolState?.pendingRunningStyleDecision
  const selectedStyle = getRunningStyle(decision?.selectedStyle)
  const recommendedStyle = getRunningStyle(decision?.recommendedStyle)
  if (!selectedStyle || !recommendedStyle || career.highSchoolState.runningStyleDecisionResolved) return career
  const specialHistory = {
    kind: 'SPECIAL',
    type: 'SPECIAL',
    id: 'high_running_style_decision',
    title: '주행 스타일 결정',
    turn: 13,
    periodLabel: '고등부 1학년 1분기',
    selectedRunningStyle: selectedStyle.id,
    selectedRunningStyleLabel: selectedStyle.label,
    recommendedRunningStyle: recommendedStyle.id,
    recommendedRunningStyleLabel: recommendedStyle.label,
    resultText: selectedStyle.resultText,
  }
  const next = {
    ...career,
    runningStyle: selectedStyle.id,
    history: [specialHistory, ...(career.history ?? [])],
    logs: [specialHistory, ...(career.logs ?? [])].slice(0, 5),
    highSchoolState: { ...career.highSchoolState, pendingRunningStyleDecision: null, runningStyleDecisionResolved: true },
  }
  return finalizeHighTurn(next, rng)
}

export function resolveHighSchoolRace(career, choiceId = 'run', rng = Math.random) {
  const race = career.highSchoolState?.pendingRace
  if (!race || career.highSchoolState.pendingRaceResult) return career
  if (race.raceType === 'G1' && choiceId === 'decline') return { ...career, highSchoolState: { ...career.highSchoolState, pendingRaceResult: { ...race, result: 'DECLINED', finishPosition: null, won: false } } }
  let result = race.raceType === 'G1' ? resolveG1Race(race, rng) : race
  if (result.raceType === 'DEBUT') {
    const minimumPosition = result.result === 'SUCCESS' ? 1 : 6
    const maximumPosition = result.result === 'SUCCESS' ? 5 : 12
    result = { ...result, finishPosition: minimumPosition + Math.floor(rng() * (maximumPosition - minimumPosition + 1)) }
  }
  const racePlan = createRacePlan({ race: result, runningStyle: career.runningStyle ?? 'SENKO', rng })
  return { ...career, highSchoolState: { ...career.highSchoolState, pendingRaceResult: result, racePlan } }
}

export function completeHighSchoolRaceSequence(career) {
  const racePlan = career.highSchoolState?.racePlan
  if (!racePlan || racePlan.completed) return career
  return { ...career, highSchoolState: { ...career.highSchoolState, racePlan: { ...racePlan, completed: true } } }
}

const ACHIEVEMENT_RULES = [
  { id: 'CLASSIC_TRIPLE_CROWN', name: '클래식 삼관', route: 'CLASSIC_TRIPLE', races: ['satsuki_sho', 'japan_derby', 'kikuka_sho'] },
  { id: 'TRIPLE_TIARA', name: '트리플 티아라', route: 'TRIPLE_TIARA', races: ['oka_sho', 'oaks', 'shuka_sho'] },
  { id: 'MILE_STAR', name: '마일의 신성', route: 'MILE', races: ['nhk_mile_cup', 'mile_championship'] },
]

function unlockYear2Achievements(career) {
  const achievements = [...career.highYear2.achievements]
  const unlocked = []
  for (const rule of ACHIEVEMENT_RULES) {
    if (career.highYear2.route !== rule.route || achievements.some(({ id }) => id === rule.id)) continue
    if (rule.races.every((raceId) => career.highYear2.raceResults[raceId]?.won)) {
      const achievement = { id: rule.id, name: rule.name }
      achievements.push(achievement)
      unlocked.push(achievement)
    }
  }
  if (!unlocked.length) return career
  career.currentTurnHistory.achievements = [...(career.currentTurnHistory.achievements ?? []), ...unlocked]
  return { ...career, highYear2: { ...career.highYear2, achievements, pendingAchievement: unlocked[0] } }
}

export function dismissHighYear2Achievement(career) {
  if (!career.highYear2?.pendingAchievement) return career
  return { ...career, highYear2: { ...career.highYear2, pendingAchievement: null } }
}

function finishYear2Race(career, race, rng) {
  let next = applyRaceRewards(career, race)
  next.currentTurnHistory = structuredClone(career.currentTurnHistory)
  writeRaceHistory(next, race)
  const result = { raceId: race.raceId, raceName: race.raceName, turn: career.turnIndex + 1, distance: race.distance, grade: race.grade ?? 'G1', runningStyle: career.runningStyle, finishPosition: race.finishPosition, won: Boolean(race.won) }
  next = {
    ...next,
    highYear2: { ...next.highYear2, raceResults: { ...next.highYear2.raceResults, [race.raceId]: result }, racesCompletedThisTurn: next.highYear2.racesCompletedThisTurn + 1 },
    highSchoolState: { ...next.highSchoolState, pendingRace: null, pendingRaceResult: null, racePlan: null },
  }
  next = unlockYear2Achievements(next)
  if (next.highYear2.raceQueue.length) return scheduleNextYear2Race(next)
  if (career.turnIndex + 1 === 18 && next.highYear2.route === 'MILE' && race.raceId === 'nhk_mile_cup' && !next.highYear2.derbyDecisionResolved) {
    return { ...next, highYear2: { ...next.highYear2, pendingSpecial: derbyDreamSpecial('MILE') } }
  }
  if (next.highYear2.racesCompletedThisTurn >= 2 && !next.highYear2.consecutivePenaltyApplied) {
    next = { ...next, condition: moveCondition(next.condition, -1), highYear2: { ...next.highYear2, consecutivePenaltyApplied: true } }
  }
  return finalizeHighTurn(next, rng)
}

export function finishHighSchoolRace(career, rng = Math.random) {
  const race = career.highSchoolState?.pendingRaceResult
  if (!race) return career
  if (race.result !== 'DECLINED' && !career.highSchoolState?.racePlan?.completed) return career
  if (career.turnIndex >= 16 && career.turnIndex <= 19) return finishYear2Race(career, race, rng)
  let next = race.result === 'DECLINED' ? career : applyRaceRewards(career, race)
  next.currentTurnHistory = structuredClone(career.currentTurnHistory)
  writeRaceHistory(next, race)
  const highSchoolState = { ...next.highSchoolState, pendingRaceResult: race, debutStatus: race.raceType === 'DEBUT' ? (race.result === 'SUCCESS' ? 'SUCCESS' : 'FAILED_ONCE') : next.highSchoolState.debutStatus, debutAttempts: race.raceType === 'DEBUT' ? race.attempt : next.highSchoolState.debutAttempts, achievements: race.raceType === 'G1' && race.won ? [...next.highSchoolState.achievements, race] : next.highSchoolState.achievements }
  return finalizeHighTurn({ ...next, highSchoolState }, rng)
}
