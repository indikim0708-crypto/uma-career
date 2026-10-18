import { HIGH_SCHOOL_YEAR1_EVENTS } from '../data/highSchoolYear1Events.js'
import { MAX_STAT, STATS } from '../data/stats.js'
import { FIELD_STRENGTH_RANGES } from '../data/raceBalance.js'
import { applyMiddleNaturalCondition } from './middleEvents.js'
import { materializeOutcome, moveCondition, resolveEventChoice } from './eventResolver.js'
import { randomChoice } from './eventScheduler.js'
import { finalizeTurnHistory } from './history.js'
import { beginTurnHistory } from './history.js'
import { TURNS } from '../data/turns.js'
import { getRunningStyle } from '../data/runningStyles.js'
import { createRacePlan } from './racePlan.js'
import { HIGH_SCHOOL_YEAR2_EVENTS } from '../data/highSchoolYear2Events.js'
import { HIGH_YEAR2_G2_BY_GROWTH, HIGH_YEAR2_RACES, TURN18_RACES, TURN20_RACES } from '../data/highSchoolYear2Races.js'
import { HIGH_YEAR3_RACES } from '../data/highSchoolYear3Races.js'
import { pickHighYear3Event } from '../data/highSchoolYear3Events.js'
import { ensureHighSchoolLegendPlan, getHighSchoolLegendDue } from './highSchoolLegend.js'
import { applyTeamTurnPlan, createInitialTeamOffers, resolveInitialTeamOffer } from './highSchoolTeam.js'
import { RUNNING_STYLE_RECOMMENDATION_REASONS } from '../data/runningStyleRecommendationBalance.js'
import { recommendRunningStyle } from './runningStyleRecommendation.js'
import { getHighSchoolPotentialMultiplier, scaleHighSchoolStatChanges } from './highSchoolGrowth.js'

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value))
const TOP_G1_RACE_IDS = new Set(['tenno_sho_spring', 'tenno_sho_autumn', 'japan_cup', 'arima_kinen'])

export function createHighSchoolState() {
  return { completedEventIds: [], pendingEvent: null, pendingOutcome: null, pendingRace: null, pendingRaceResult: null, racePlan: null, pendingRunningStyleDecision: null, runningStyleDecisionResolved: false, debutStatus: 'PENDING', debutAttempts: 0, achievements: [] }
}

export function createHighYear2State() {
  return { route: null, derbyDecisionResolved: false, enteredJapanDerby: false, pendingSpecial: null, pendingAchievement: null, raceQueue: [], racesCompletedThisTurn: 0, consecutivePenaltyApplied: false, raceResults: {}, achievements: [] }
}

export function createHighYear3State() {
  return { started: false, pendingSpecial: null, actionQueue: [], raceResults: {}, decisions: {}, achievements: [], pendingAchievements: [], racesCompletedThisTurn: 0, penaltiesAppliedThisTurn: 0 }
}

export function getRecommendedRunningStyle(stats, growthTypeId, rng = Math.random) {
  return recommendRunningStyle(stats, growthTypeId, rng).recommendation
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

export function isSuccessfulDebutPosition(finalPosition) {
  return finalPosition === 1
}

function createDebutRace(career, retry) {
  const raceScore = getHighSchoolRaceScore(career)
  return { id: retry ? 'debut_retry' : 'debut', raceId: retry ? 'debut_retry' : 'debut', raceName: retry ? '데뷔 재도전' : '첫 데뷔전', raceType: 'DEBUT', distance: '데뷔전', attempt: retry ? 2 : 1, raceScore, fieldStrengthRange: FIELD_STRENGTH_RANGES.DEBUT, choices: [{ id: 'run', text: '데뷔전에 출전한다' }] }
}

function createG1Race(career) {
  const miler = career.growthType.id === 'miler'
  const raceId = miler ? 'g1_asahi' : 'g1_hopeful'
  return { id: raceId, raceId, raceName: miler ? '아사히배 퓨처러티 스테이크스' : '호프풀 스테이크스', raceType: 'G1', distance: miler ? '1600m' : '2000m', attempt: 1, raceScore: getHighSchoolRaceScore(career, raceId), fieldStrengthRange: FIELD_STRENGTH_RANGES.HIGH_YEAR1_G1, choices: [{ id: 'enter', text: 'G1에 도전한다' }, { id: 'decline', text: '올해는 경험을 쌓는 데 집중한다' }] }
}

function createYear2Race(career, raceId) {
  const race = HIGH_YEAR2_RACES[raceId]
  const fieldStrengthRange = race.grade === 'G2' ? (raceId === HIGH_YEAR2_G2_BY_GROWTH.early[career.growthType.id] ? FIELD_STRENGTH_RANGES.EARLY_G2 : FIELD_STRENGTH_RANGES.LATE_G2) : FIELD_STRENGTH_RANGES.HIGH_YEAR2_G1
  const minimumStamina = raceId === 'kikuka_sho' ? 80 : null
  return { ...race, id: race.raceId, raceType: race.grade, attempt: 1, raceScore: getHighSchoolRaceScore(career, raceId), fieldStrengthRange, minimumStamina, choices: [{ id: 'enter', text: `${race.raceName}에 출전한다` }] }
}

function createYear3Race(career, raceId) {
  const race = HIGH_YEAR3_RACES[raceId]
  const fieldStrengthRange = race.grade === 'G2' ? FIELD_STRENGTH_RANGES.STAYER_PREP_G2 : TOP_G1_RACE_IDS.has(raceId) ? FIELD_STRENGTH_RANGES.TOP_G1 : FIELD_STRENGTH_RANGES.HIGH_YEAR3_G1
  const minimumStamina = raceId === 'tenno_sho_spring' ? 100 : null
  return { ...race, id: race.raceId, raceType: race.grade, attempt: 1, raceScore: getHighSchoolRaceScore(career, raceId), fieldStrengthRange, minimumStamina, choices: [{ id: 'enter', text: `${race.raceName}에 출전한다` }] }
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

function applyChanges(career, changes, conditionDelta = 0, scaleForPotential = true) {
  const appliedChanges = scaleForPotential ? scaleHighSchoolStatChanges(changes, career.potential) : changes
  const stats = { ...career.stats }
  for (const [id, amount] of Object.entries(appliedChanges)) stats[id] = clamp(stats[id] + amount, 0, MAX_STAT)
  return { ...career, stats, condition: moveCondition(career.condition, conditionDelta) }
}

function applyRaceRewards(career, race) {
  if (race.raceType === 'DEBUT') return career
  const primary = Object.entries(career.growthType.weights).sort((a, b) => b[1] - a[1])[0][0]
  if (race.raceType === 'G2') {
    if (race.won) return applyChanges(career, { [primary]: 3, intelligence: 2, grit: 1 })
    if (race.finishPosition <= 3) return applyChanges(career, { [primary]: 2, intelligence: 1 })
    if (race.finishPosition <= 6) return applyChanges(career, { intelligence: 1 })
    return career
  }
  if (race.won) return applyChanges(career, { intelligence: 5, [primary]: 5, grit: 3 }, 1)
  if (race.finishPosition <= 3) return applyChanges(career, { intelligence: 4, [primary]: 3, grit: 2 })
  if (race.finishPosition <= 6) return applyChanges(career, { intelligence: 3, [primary]: 2 })
  return applyChanges(career, { intelligence: 2 })
}

function writeRaceHistory(career, race) {
  const entry = { raceId: race.raceId, raceName: race.raceName, raceType: race.raceType, grade: race.grade ?? race.raceType, turn: career.turnIndex + 1, periodLabel: career.currentTurnHistory.periodLabel, distance: race.distance, attempt: race.attempt, result: race.result, finishPosition: race.finishPosition, finalPosition: race.finishPosition, runningStyle: career.runningStyle, raceSeed: race.raceSeed, fieldStrength: race.fieldStrength, startPosition: race.startPosition, earlyPosition: race.earlyPosition, middlePosition: race.middlePosition, finalCornerPosition: race.finalCornerPosition, finalStraightPosition: race.finalStraightPosition, won: Boolean(race.won) }
  career.currentTurnHistory.race = entry
  career.currentTurnHistory.races = [...(career.currentTurnHistory.races ?? []), entry]
}

function finalizeHighTurn(career, rng) {
  const next = finalizeTurnHistory(career, { expectedGrowth: career.currentTurnHistory.expectedGrowth, rng, preserveNaturalCondition: true })
  const failedDebut = next.highSchoolState.pendingRaceResult?.raceType === 'DEBUT' && next.highSchoolState.pendingRaceResult.result === 'FAILURE' && next.highSchoolState.pendingRaceResult.attempt === 2
  if (failedDebut) return { ...next, complete: true, badEnding: { id: 'failed_debut_bad_end', title: '끝내 넘지 못한 데뷔의 벽', body: '두 번째 데뷔전도 끝났다.\n\n마지막까지 최선을 다했지만 공식 레이서로 인정받기 위한 기록에는 도달하지 못했다.\n\n중앙 트레센 고등부까지 올라왔지만, 결국 공식 레이스의 출발선에는 서지 못했다.\n\n오랫동안 바라보았던 트랙을 뒤로하고 그녀의 선수 생활은 여기서 끝을 맺었다.' } }
  const finishedCareer = career.turnIndex === TURNS.length - 1
  return { ...next, turnIndex: finishedCareer ? career.turnIndex : career.turnIndex + 1, complete: finishedCareer, notice: finishedCareer ? '중앙 트레센 학원 고등부를 졸업했습니다.' : next.notice, highSchoolState: { ...next.highSchoolState, pendingEvent: null, pendingOutcome: null, pendingRace: null, pendingRaceResult: null, racePlan: null } }
}

export function startHighSchoolTurn(career, rng = Math.random) {
  if (career.highSchoolState?.pendingEvent || career.highSchoolState?.pendingRace || career.highSchoolState?.pendingRunningStyleDecision || career.highSchoolLegend?.pendingLegend || (career.teamState?.initialOfferTeamIds.length && !career.teamState.initialOffersResolved) || career.highYear2?.pendingSpecial || career.highYear3?.pendingSpecial) return career
  if (career.turnIndex === 13 && !career.runningStyle) return career
  const withYear2 = career.turnIndex >= 16 && !career.highYear2 ? { ...career, highYear2: createHighYear2State() } : career
  const initialized = career.turnIndex >= 20 && !withYear2.highYear3 ? { ...withYear2, highYear3: createHighYear3State() } : withYear2
  const conditioned = applyMiddleNaturalCondition(initialized, rng)
  const { stats, expectedGrowth } = (awaitableApplyBaseGrowth(conditioned, rng))
  const currentTurnHistory = beginTurnHistory(initialized, TURNS[career.turnIndex])
  currentTurnHistory.naturalConditionDelta = conditioned.naturalConditionDelta
  if (career.turnIndex >= 16) currentTurnHistory.seasonRoute = withYear2.highYear2?.route ?? null
  const event = career.turnIndex >= 20
    ? pickHighYear3Event(conditioned, career.turnIndex + 1, rng)
    : randomChoice((career.turnIndex >= 16 ? HIGH_SCHOOL_YEAR2_EVENTS : HIGH_SCHOOL_YEAR1_EVENTS).filter(({ id }) => !conditioned.highSchoolState.completedEventIds.includes(id)), rng)
  const highYear3 = initialized.highYear3 ? { ...initialized.highYear3, racesCompletedThisTurn: 0, penaltiesAppliedThisTurn: 0, actionQueue: [], pendingSpecial: null, pendingAchievements: [] } : initialized.highYear3
  const prepared = { ...conditioned, highYear3, stats, currentTurnHistory: { ...currentTurnHistory, statsAfterBase: { ...stats }, expectedGrowth }, highSchoolState: { ...conditioned.highSchoolState, pendingEvent: event, pendingOutcome: null } }
  return ensureHighSchoolLegendPlan(prepared, career.turnIndex + 1, rng)
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
  const multiplier = getHighSchoolPotentialMultiplier(career.potential)
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
  if (turn === 19) return { ...career, highYear2: { ...career.highYear2, pendingSpecial: year2G2Offer(career, 'late') } }
  if (turn === 20) return queueYear2Races(career, TURN20_RACES[career.highYear2.route])
  return finalizeHighTurn(career, rng)
}

const special = (id, title, description, choices) => ({ id, title, description, choices: choices.map(([choiceId, text]) => ({ id: choiceId, text })) })
const year2G2Offer = (career, phase) => {
  const raceId = HIGH_YEAR2_G2_BY_GROWTH[phase][career.growthType.id]
  const race = HIGH_YEAR2_RACES[raceId]
  return special(`high2_g2_${phase}`, `${race.raceName} 출전 제안`, `${race.distance} G2 무대가 열립니다. 성장 흐름을 점검하기 위해 출전하시겠습니까?`, [['ENTER', 'G2에 출전한다'], ['SKIP', '훈련에 집중한다']])
}
const YEAR3_SPECIALS = {
  stayer_prep: () => special('high3_stayer_prep', '장거리 조정전', '천황상(봄)을 앞두고 한신대상전에 출전하시겠습니까?', [['ENTER', 'G2에 출전한다'], ['SKIP', '훈련에 집중한다']]),
  spring_first_g1: () => special('high3_spring_first_g1', '봄 첫 G1', '시니어 시즌의 첫 목표를 결정할 시간입니다.', [['OSAKA', '오사카배에 도전한다'], ['PREPARE', '천황상(봄)을 준비한다']]),
  sprint_mile: () => special('high3_sprint_mile', '1600m까지 영역을 넓힐 것인가?', '봄의 마일 G1에 도전할지 결정합니다.', [['YES', '야스다 기념에 도전한다'], ['NO', '단거리 노선에 집중한다']]),
  spring_mile: () => special('high3_spring_mile', '봄 마일 왕좌', '봄의 두 마일 G1 중 목표를 선택합니다.', [['VICTORIA', '빅토리아 마일에 출전한다'], ['YASUDA', '야스다 기념에 출전한다'], ['BOTH', '두 경기 모두 도전한다']]),
  spring_grand_prix: () => special('high3_spring_grand_prix', '봄의 그랑프리', '천황상(봄)을 마친 뒤 타카라즈카 기념까지 달릴 수 있습니다.', [['YES', '타카라즈카 기념까지 도전한다'], ['NO', '가을 시즌을 준비한다']]),
  autumn_2000: () => special('high3_autumn_2000', '가을의 2000m', '마일 챔피언십 전에 천황상(가을)에 도전할지 결정합니다.', [['YES', '천황상(가을)에 도전한다'], ['NO', '마일 챔피언십에 집중한다']]),
  mile_wall: () => special('high3_mile_wall', '마일의 벽을 넘어', '단거리에서 쌓은 속도로 마일의 왕좌에 도전할 수 있습니다.', [['YES', '마일 챔피언십에 도전한다'], ['NO', '단거리 선수로 시즌을 마무리한다']]),
  longer_stage: () => special('high3_longer_stage', '더 긴 무대로', '마일 왕좌를 지나 더 긴 무대에 도전할지 결정합니다.', [['JAPAN_CUP', '재팬 컵에 도전한다'], ['SAVE_ARIMA', '아리마 기념까지 힘을 아낀다'], ['END', '올해는 여기까지 달린다']]),
  autumn_tenno: (career) => special('high3_autumn_tenno', career.growthType.id === 'stayer' ? '가을의 천황상' : '천황상(가을)', '가을 왕도의 첫 무대에 출전할지 결정합니다.', [['YES', '천황상(가을)에 출전한다'], ['NO', career.growthType.id === 'stayer' ? '더 긴 무대를 준비한다' : '재팬 컵을 준비한다']]),
  world_stage: (career) => special('high3_world_stage', career.growthType.id === 'stayer' ? '재팬 컵' : '세계가 기다리는 무대', '세계의 강자들이 모이는 2400m 무대입니다.', [['YES', '재팬 컵에 출전한다'], ['NO', '아리마 기념을 준비한다']]),
  final_stage: () => special('high3_final_stage', '마지막 무대', '학생으로서 달릴 수 있는 마지막 G1, 아리마 기념에 도전하시겠습니까?', [['YES', '아리마 기념에 도전한다'], ['NO', '여기서 시즌을 마친다']]),
}

function lastSeasonSpecial(career) {
  const recommendations = {
    sprinter: '다카마쓰노미야 기념 · 스프린터즈 스테이크스',
    miler: '빅토리아 마일 / 야스다 기념 · 마일 챔피언십',
    router: '오사카배 · 타카라즈카 기념 · 가을 왕도 G1',
    stayer: '천황상(봄) · 재팬 컵 · 아리마 기념',
  }
  return special('high3_last_season_guide', '마지막 시즌', `졸업까지 앞으로 1년. 코치가 시니어 시즌의 G1 일정을 펼쳤습니다. 추천 목표: ${recommendations[career.growthType.id]}`, [['START', '시니어 시즌을 시작한다']])
}

function queueYear3Actions(career, actions) {
  return { ...career, highYear3: { ...career.highYear3, actionQueue: [...career.highYear3.actionQueue, ...actions] } }
}

function scheduleNextYear3Action(career, rng) {
  if (career.highYear3.pendingAchievements.length) return career
  const [action, ...actionQueue] = career.highYear3.actionQueue
  if (!action) return finalizeHighTurn(career, rng)
  const base = { ...career, highYear3: { ...career.highYear3, actionQueue } }
  if (action.type === 'RACE') return { ...base, highSchoolState: { ...base.highSchoolState, pendingRace: createYear3Race(base, action.raceId), pendingRaceResult: null, racePlan: null } }
  return { ...base, highYear3: { ...base.highYear3, pendingSpecial: YEAR3_SPECIALS[action.specialId](base) } }
}

function beginYear3PostEvent(career, turn, rng) {
  const type = career.growthType.id
  let actions = []
  if (turn === 21) actions = [{ type: 'GUIDE' }]
  if (turn === 22) actions = type === 'sprinter' ? [{ type: 'SPECIAL', specialId: 'sprint_mile' }] : type === 'miler' ? [{ type: 'SPECIAL', specialId: 'spring_mile' }] : type === 'router' ? [{ type: 'RACE', raceId: 'takarazuka_kinen' }] : [{ type: 'RACE', raceId: 'tenno_sho_spring' }, { type: 'SPECIAL', specialId: 'spring_grand_prix' }]
  if (turn === 23 && type === 'sprinter') actions = [{ type: 'RACE', raceId: 'sprinters_stakes' }]
  if (turn === 24) actions = type === 'sprinter' ? [{ type: 'SPECIAL', specialId: 'mile_wall' }] : type === 'miler' ? [{ type: 'SPECIAL', specialId: 'autumn_2000' }] : [{ type: 'SPECIAL', specialId: 'autumn_tenno' }]
  if (actions[0]?.type === 'GUIDE') return { ...career, highYear3: { ...career.highYear3, started: false, pendingSpecial: lastSeasonSpecial(career) } }
  return scheduleNextYear3Action(queueYear3Actions(career, actions), rng)
}

export function finishHighSchoolEvent(career, rng = Math.random) {
  const { pendingEvent: event, pendingOutcome: outcome } = career.highSchoolState
  if (!event || !outcome) return career
  const statChanges = scaleHighSchoolStatChanges(outcome.statChanges, career.potential)
  let next = applyChanges(career, outcome.statChanges, outcome.conditionDelta)
  next.currentTurnHistory = structuredClone(career.currentTurnHistory)
  next.currentTurnHistory.event = { eventId: event.id, eventName: event.name, eventType: event.type, situation: event.situation, selectedChoiceId: outcome.choiceId, selectedChoiceText: event.choices.find(({ id }) => id === outcome.choiceId).text, outcomeType: outcome.type, outcomeText: outcome.text, statChanges, conditionDelta: outcome.conditionDelta }
  next.currentTurnHistory.statsAfterEvent = { ...next.stats }
  const turn = next.turnIndex + 1
  const retry = turn === 15 && next.highSchoolState.debutStatus === 'FAILED_ONCE'
  const race = turn === 14 ? createDebutRace(next, false, rng) : retry ? createDebutRace(next, true, rng) : turn === 16 && next.highSchoolState.debutStatus === 'SUCCESS' && next.growthType.id !== 'sprinter' ? createG1Race(next) : null
  next = { ...next, highSchoolState: { ...next.highSchoolState, completedEventIds: [...next.highSchoolState.completedEventIds, event.id], pendingEvent: null, pendingOutcome: null, pendingRace: race } }
  if (turn !== 13) next = applyTeamTurnPlan(next, rng)
  const highLegend = getHighSchoolLegendDue(next, turn)
  if (highLegend) return { ...next, highSchoolState: { ...next.highSchoolState, pendingRace: null }, highSchoolLegend: { ...next.highSchoolLegend, pendingLegend: highLegend, pendingOutcome: null } }
  if (turn >= 21 && turn <= 24) return beginYear3PostEvent(next, turn, rng)
  if (turn >= 17 && turn <= 20) return beginYear2PostEvent(next, turn, rng)
  if (turn === 13 && !next.highSchoolState.runningStyleDecisionResolved) {
    const recommendation = recommendRunningStyle(next.stats, next.growthType.id, rng)
    return { ...next, highSchoolState: { ...next.highSchoolState, pendingRunningStyleDecision: { recommendedStyle: recommendation.recommendation, recommendationReason: RUNNING_STYLE_RECOMMENDATION_REASONS[recommendation.recommendation], recommendationDebug: recommendation, selectedStyle: null } } }
  }
  return race ? next : finalizeHighTurn(next, rng)
}

export function selectHighSchoolLegendChoice(career) {
  const event = career.highSchoolLegend?.pendingLegend
  if (!event || career.highSchoolLegend.pendingOutcome) return career
  return { ...career, highSchoolLegend: { ...career.highSchoolLegend, pendingOutcome: { choiceId: event.choices[0].id, statChanges: { ...event.statChanges } } } }
}

export function finishHighSchoolLegend(career, rng = Math.random) {
  const event = career.highSchoolLegend?.pendingLegend
  const outcome = career.highSchoolLegend?.pendingOutcome
  if (!event || !outcome) return career
  let next = applyChanges(career, outcome.statChanges, 0, false)
  next.currentTurnHistory = structuredClone(career.currentTurnHistory)
  next.currentTurnHistory.legendEvent = {
    type: 'LEGEND', eventId: event.id, legendId: event.legendId, legendName: event.characterName, characterName: event.characterName, title: event.title, portrait: event.portrait, quote: event.quote, selectedChoiceText: event.choices[0].text, outcomeText: '전설의 조언을 마음에 새겼습니다.', statChanges: { ...outcome.statChanges }, conditionDelta: 0,
  }
  const turn = next.turnIndex + 1
  next.highSchoolLegend = {
    ...next.highSchoolLegend,
    completedLegendIds: [...next.highSchoolLegend.completedLegendIds, event.legendId],
    plans: { ...next.highSchoolLegend.plans, [turn]: { ...next.highSchoolLegend.plans[turn], resolved: true } },
    pendingLegend: null,
    pendingOutcome: null,
  }
  if (turn === 16) {
    const race = next.highSchoolState.debutStatus === 'SUCCESS' && next.growthType.id !== 'sprinter' ? createG1Race(next) : null
    return race ? { ...next, highSchoolState: { ...next.highSchoolState, pendingRace: race } } : finalizeHighTurn(next, rng)
  }
  if (turn === 19) return beginYear2PostEvent(next, turn, rng)
  if (turn === 23) return beginYear3PostEvent(next, turn, rng)
  return finalizeHighTurn(next, rng)
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
    return { ...next, highYear2: { ...next.highYear2, pendingSpecial: year2G2Offer(next, 'early') } }
  }
  if (special.id === 'high2_g2_early' || special.id === 'high2_g2_late') {
    const phase = special.id.endsWith('early') ? 'early' : 'late'
    const next = { ...career, highYear2: { ...career.highYear2, pendingSpecial: null } }
    next.currentTurnHistory.special = { id: special.id, title: special.title, selectedChoiceText: special.choices.find(({ id }) => id === choiceId).text }
    if (choiceId === 'ENTER') return queueYear2Races(next, [HIGH_YEAR2_G2_BY_GROWTH[phase][career.growthType.id]])
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

export function resolveHighYear3Special(career, choiceId, rng = Math.random) {
  const pending = career.highYear3?.pendingSpecial
  const choice = pending?.choices.find(({ id }) => id === choiceId)
  if (!pending || !choice) return career
  let next = structuredClone(career)
  next.highYear3.pendingSpecial = null
  next.highYear3.decisions[pending.id] = choiceId
  const entry = { id: pending.id, title: pending.title, selectedChoiceId: choiceId, selectedChoiceText: choice.text }
  next.currentTurnHistory.special = entry
  next.currentTurnHistory.specials = [...(next.currentTurnHistory.specials ?? []), entry]
  const append = (actions) => { next = queueYear3Actions(next, actions) }

  if (pending.id === 'high3_last_season_guide') {
    next.highYear3.started = true
    const type = next.growthType.id
    if (type === 'sprinter') append([{ type: 'RACE', raceId: 'takamatsunomiya_kinen' }])
    if (type === 'router') append([{ type: 'RACE', raceId: 'osaka_hai' }])
    if (type === 'stayer') append([{ type: 'SPECIAL', specialId: 'stayer_prep' }])
  }
  if (pending.id === 'high3_stayer_prep') append([...(choiceId === 'ENTER' ? [{ type: 'RACE', raceId: 'hanshin_daishoten' }] : []), { type: 'SPECIAL', specialId: 'spring_first_g1' }])
  if (pending.id === 'high3_spring_first_g1' && choiceId === 'OSAKA') append([{ type: 'RACE', raceId: 'osaka_hai' }])
  if (pending.id === 'high3_sprint_mile' && choiceId === 'YES') append([{ type: 'RACE', raceId: 'yasuda_kinen' }])
  if (pending.id === 'high3_spring_mile') {
    if (choiceId === 'VICTORIA' || choiceId === 'BOTH') append([{ type: 'RACE', raceId: 'victoria_mile' }])
    if (choiceId === 'YASUDA' || choiceId === 'BOTH') append([{ type: 'RACE', raceId: 'yasuda_kinen' }])
  }
  if (pending.id === 'high3_spring_grand_prix' && choiceId === 'YES') append([{ type: 'RACE', raceId: 'takarazuka_kinen' }])
  if (pending.id === 'high3_mile_wall') append([...(choiceId === 'YES' ? [{ type: 'RACE', raceId: 'mile_championship' }] : []), { type: 'SPECIAL', specialId: 'final_stage' }])
  if (pending.id === 'high3_autumn_2000') append([...(choiceId === 'YES' ? [{ type: 'RACE', raceId: 'tenno_sho_autumn' }] : []), { type: 'RACE', raceId: 'mile_championship' }, { type: 'SPECIAL', specialId: 'longer_stage' }])
  if (pending.id === 'high3_longer_stage') {
    if (choiceId === 'JAPAN_CUP') append([{ type: 'RACE', raceId: 'japan_cup' }, { type: 'SPECIAL', specialId: 'final_stage' }])
    if (choiceId === 'SAVE_ARIMA') append([{ type: 'SPECIAL', specialId: 'final_stage' }])
  }
  if (pending.id === 'high3_autumn_tenno') append([...(choiceId === 'YES' ? [{ type: 'RACE', raceId: 'tenno_sho_autumn' }] : []), { type: 'SPECIAL', specialId: 'world_stage' }])
  if (pending.id === 'high3_world_stage') append([...(choiceId === 'YES' ? [{ type: 'RACE', raceId: 'japan_cup' }] : []), { type: 'SPECIAL', specialId: 'final_stage' }])
  if (pending.id === 'high3_final_stage' && choiceId === 'YES') append([{ type: 'RACE', raceId: 'arima_kinen' }])
  return scheduleNextYear3Action(next, rng)
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
  return createInitialTeamOffers(next, rng)
}

export function resolveInitialTeamSelection(career, teamId, rng = Math.random) {
  if (!career.teamState?.initialOfferTeamIds.length || career.teamState.initialOffersResolved) return career
  const resolved = resolveInitialTeamOffer(career, teamId)
  if (resolved === career) return career
  return finalizeHighTurn(applyTeamTurnPlan(resolved, rng), rng)
}

export function resolveHighSchoolRace(career, choiceId = 'run', rng = Math.random) {
  const race = career.highSchoolState?.pendingRace
  if (!race || career.highSchoolState.pendingRaceResult) return career
  if (choiceId === 'ineligible' && race.minimumStamina && career.stats.stamina < race.minimumStamina) return { ...career, highSchoolState: { ...career.highSchoolState, pendingRaceResult: { ...race, result: 'INELIGIBLE', finishPosition: null, won: false } } }
  if (race.raceType === 'G1' && choiceId === 'decline') return { ...career, highSchoolState: { ...career.highSchoolState, pendingRaceResult: { ...race, result: 'DECLINED', finishPosition: null, won: false } } }
  const racePlan = createRacePlan({ race, stats: career.stats, condition: career.condition, runningStyle: career.runningStyle ?? 'SENKO', rng })
  const finishPosition = racePlan.finalPosition
  const isDebut = race.raceType === 'DEBUT'
  const won = !isDebut && finishPosition === 1
  const result = {
    ...race,
    raceSeed: racePlan.raceSeed,
    fieldStrength: racePlan.fieldStrength,
    finishPosition,
    won,
    result: isDebut ? (isSuccessfulDebutPosition(finishPosition) ? 'SUCCESS' : 'FAILURE') : won ? 'WIN' : finishPosition <= 3 ? 'PLACE' : finishPosition <= 6 ? 'MIDFIELD' : 'LOW',
    startPosition: racePlan.checkpoints[0].position,
    earlyPosition: racePlan.checkpoints[1].position,
    middlePosition: racePlan.checkpoints[2].position,
    finalCornerPosition: racePlan.checkpoints[3].position,
    finalStraightPosition: racePlan.checkpoints[4].position,
  }
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

const YEAR3_ACHIEVEMENT_RULES = [
  { id: 'SPRINT_KING', name: '스프린트 왕', races: [['takamatsunomiya_kinen'], ['sprinters_stakes']] },
  { id: 'MILE_DOMINATOR', name: '마일의 지배자', races: [['victoria_mile', 'yasuda_kinen'], ['mile_championship']] },
  { id: 'TENNO_DOUBLE', name: '봄·가을 천황상 제패', races: [['tenno_sho_spring'], ['tenno_sho_autumn']] },
  { id: 'GRAND_PRIX_DOUBLE', name: '그랑프리 제패', races: [['takarazuka_kinen'], ['arima_kinen']] },
  { id: 'AUTUMN_TRIPLE', name: '가을 고마 3관', races: [['tenno_sho_autumn'], ['japan_cup'], ['arima_kinen']] },
]

function unlockYear3Achievements(career) {
  const achievements = [...career.highYear3.achievements]
  const unlocked = YEAR3_ACHIEVEMENT_RULES.filter((rule) => !achievements.some(({ id }) => id === rule.id) && rule.races.every((alternatives) => alternatives.some((raceId) => career.highYear3.raceResults[raceId]?.won))).map(({ id, name }) => ({ id, name }))
  if (!unlocked.length) return career
  career.currentTurnHistory.achievements = [...(career.currentTurnHistory.achievements ?? []), ...unlocked]
  return { ...career, highYear3: { ...career.highYear3, achievements: [...achievements, ...unlocked], pendingAchievements: [...career.highYear3.pendingAchievements, ...unlocked] } }
}

export function dismissHighYear3Achievement(career, rng = Math.random) {
  if (!career.highYear3?.pendingAchievements.length) return career
  const next = { ...career, highYear3: { ...career.highYear3, pendingAchievements: career.highYear3.pendingAchievements.slice(1) } }
  return next.highYear3.pendingAchievements.length ? next : scheduleNextYear3Action(next, rng)
}

function finishYear2Race(career, race, rng) {
  let next = race.result === 'INELIGIBLE' ? career : applyRaceRewards(career, race)
  next.currentTurnHistory = structuredClone(career.currentTurnHistory)
  if (race.result !== 'INELIGIBLE') writeRaceHistory(next, race)
  const result = { raceId: race.raceId, raceName: race.raceName, turn: career.turnIndex + 1, distance: race.distance, grade: race.grade ?? 'G1', runningStyle: career.runningStyle, finishPosition: race.finishPosition, won: Boolean(race.won), skipped: race.result === 'INELIGIBLE' }
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

function finishYear3Race(career, race, rng) {
  let next = race.result === 'INELIGIBLE' ? career : applyRaceRewards(career, race)
  next.currentTurnHistory = structuredClone(career.currentTurnHistory)
  if (race.result !== 'INELIGIBLE') writeRaceHistory(next, race)
  const result = { raceId: race.raceId, raceName: race.raceName, turn: career.turnIndex + 1, distance: race.distance, grade: race.grade ?? 'G1', runningStyle: career.runningStyle, finishPosition: race.finishPosition, won: Boolean(race.won), skipped: race.result === 'INELIGIBLE' }
  const racesCompletedThisTurn = next.highYear3.racesCompletedThisTurn + 1
  next = {
    ...next,
    highYear3: { ...next.highYear3, raceResults: { ...next.highYear3.raceResults, [race.raceId]: result }, racesCompletedThisTurn },
    highSchoolState: { ...next.highSchoolState, pendingRace: null, pendingRaceResult: null, racePlan: null },
  }
  if (racesCompletedThisTurn >= 2) next = { ...next, condition: moveCondition(next.condition, -1), highYear3: { ...next.highYear3, penaltiesAppliedThisTurn: next.highYear3.penaltiesAppliedThisTurn + 1 } }
  next = unlockYear3Achievements(next)
  return next.highYear3.pendingAchievements.length ? next : scheduleNextYear3Action(next, rng)
}

export function finishHighSchoolRace(career, rng = Math.random) {
  const race = career.highSchoolState?.pendingRaceResult
  if (!race) return career
  if (!['DECLINED', 'INELIGIBLE'].includes(race.result) && !career.highSchoolState?.racePlan?.completed) return career
  if (career.turnIndex >= 20 && career.turnIndex <= 23) return finishYear3Race(career, race, rng)
  if (career.turnIndex >= 16 && career.turnIndex <= 19) return finishYear2Race(career, race, rng)
  let next = ['DECLINED', 'INELIGIBLE'].includes(race.result) ? career : applyRaceRewards(career, race)
  next.currentTurnHistory = structuredClone(career.currentTurnHistory)
  if (race.result !== 'INELIGIBLE') writeRaceHistory(next, race)
  const highSchoolState = { ...next.highSchoolState, pendingRaceResult: race, debutStatus: race.raceType === 'DEBUT' ? (race.result === 'SUCCESS' ? 'SUCCESS' : 'FAILED_ONCE') : next.highSchoolState.debutStatus, debutAttempts: race.raceType === 'DEBUT' ? race.attempt : next.highSchoolState.debutAttempts, achievements: race.raceType === 'G1' && race.won ? [...next.highSchoolState.achievements, race] : next.highSchoolState.achievements }
  return finalizeHighTurn({ ...next, highSchoolState }, rng)
}
