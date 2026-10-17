import assert from 'node:assert/strict'
import test from 'node:test'
import { GROWTH_TYPES } from '../src/data/growthTypes.js'
import { MAX_STAT, STATS } from '../src/data/stats.js'
import { TURNS } from '../src/data/turns.js'
import { getNaturalConditionWeights, getNextCondition, rollNaturalConditionChange } from '../src/game/condition.js'
import { chooseGrowthType, createCareer, createInitialStats, rerollCareer } from '../src/game/createCareer.js'
import { ELEMENTARY_COMMON_EVENTS } from '../src/data/elementaryEvents.js'
import { ELEMENTARY_SCHOOL_EVENTS } from '../src/data/schoolEvents.js'
import { applyEventOutcome, materializeOutcome, moveCondition, resolveEventChoice } from '../src/game/eventResolver.js'
import { createElementaryEventState, getElementaryEvent, getEligibleCommonEvents } from '../src/game/eventScheduler.js'
import { validateElementaryCommonEvents } from '../src/game/eventValidation.js'
import { acknowledgeMiddleAdmission, advanceCareer, applyBaseGrowth, completeMiddleAdmissionSequence, finishElementaryEvent, resolveTransferAndStartElementaryTurn, selectElementaryEventChoice } from '../src/game/growth.js'
import { generatePotential } from '../src/game/random.js'
import { generateRandomUmaName, getValidNameParts } from '../src/game/nameGenerator.js'
import { ALL_ELEMENTARY_SCHOOLS, CENTRAL_TRACEN_SCHOOL, getElementarySchoolById } from '../src/data/schools.js'
import { chooseTransferDestination, getCentralTracenChance, initializeTransferState, resolveTransferDecision } from '../src/game/transfer.js'
import { MIDDLE_COMMON_EVENTS } from '../src/data/middleEvents.js'
import { MIDDLE_LEGEND_EVENTS } from '../src/data/middleLegendEvents.js'
import { MIDDLE_SCHOOLS } from '../src/data/middleSchools.js'
import { calculateAbilityScore, calculateMiddleAdmissionScore, calculateSchoolHistoryScore, chooseFallbackMiddleSchool, getCentralAdmissionChance } from '../src/game/middleAdmission.js'
import { finishMiddleEvent, finishMiddleLegend, selectMiddleEventChoice, selectMiddleLegend } from '../src/game/middleEvents.js'
import { getEligibleLegendEvents, rollLegendTargetCount, scheduleMiddleLegends } from '../src/game/middleLegend.js'
import { resolveMiddleDistanceChange } from '../src/game/middleDistanceChange.js'
import { ELEMENTARY_PROGRESS_MESSAGES, HIGH_PROGRESS_MESSAGES, MIDDLE_PROGRESS_MESSAGES, PROGRESS_MESSAGES } from '../src/data/progressMessages.js'
import { createTurnProgressPlan, getEligibleProgressMessages, getProgressDurationMs, selectTurnProgressMessages, TURN_PROGRESS_DURATION_MS } from '../src/game/turnProgress.js'
import { ADMISSION_SEQUENCE_DURATION_MS, createAdmissionPlan } from '../src/game/admissionSequence.js'
import { beginHighSchoolAdmission, calculateHighSchoolAdmissionScore, calculateHighSchoolSpecialtyScore, calculateHighSchoolSpecialtyStat, completeHighSchoolAdmissionSequence, enterHighSchool, getHighSchoolAdmissionChance } from '../src/game/highSchoolAdmission.js'
import { resolveNonRacerEnding } from '../src/game/nonRacerEndingResolver.js'
import { completeHighSchoolRaceSequence, createHighSchoolState, createHighYear2State, createHighYear3State, dismissHighYear3Achievement, finishHighSchoolEvent, finishHighSchoolLegend, finishHighSchoolRace, finishHighSchoolRunningStyle, resolveHighSchoolRace, resolveHighYear2Special, resolveHighYear3Special, resolveInitialTeamSelection, selectHighSchoolEventChoice, selectHighSchoolLegendChoice, selectHighSchoolRunningStyle } from '../src/game/highSchoolYear1.js'
import { createRacePlan } from '../src/game/racePlan.js'
import { calculateDistanceScore, calculatePositionKeepScore, calculateStaminaPenalty, calculateStyleFitScore, getPositionKeepRange, getRaceFieldStrength, simulateRace } from '../src/game/raceSimulation.js'
import { HIGH_SCHOOL_YEAR2_EVENTS } from '../src/data/highSchoolYear2Events.js'
import { HIGH_YEAR2_RACES, TURN18_RACES, TURN20_RACES } from '../src/data/highSchoolYear2Races.js'
import { HIGH_SCHOOL_YEAR3_EVENTS } from '../src/data/highSchoolYear3Events.js'
import { HIGH_YEAR3_RACES } from '../src/data/highSchoolYear3Races.js'
import { HIGH_SCHOOL_LEGEND_EVENTS } from '../src/data/highSchoolLegendEvents.js'
import { createHighSchoolLegendState, ensureHighSchoolLegendPlan, getHighLegendWeights, selectHighSchoolLegend } from '../src/game/highSchoolLegend.js'
import { applyTeamTurnPlan, calculateTeamReputation, createInitialTeamOffers, createTeamState, createTeamTurnPlan, getEligibleTransferTeams, getTeamTrainingPoints, prepareTeamTransferCheckpoint, resolveInitialTeamOffer, resolveTeamTransferOffer } from '../src/game/highSchoolTeam.js'
import { INITIAL_TEAM_IDS, TEAM_BY_ID } from '../src/data/highSchoolTeams.js'
import { STAYER_STAT_NORMS, TURN13_STAT_NORMS } from '../src/data/runningStyleRecommendationBalance.js'
import { normalizeTurn13Stats, recommendRunningStyle, safeZScore } from '../src/game/runningStyleRecommendation.js'

function makeHighYear2Career(growthTypeId = 'router') {
  const rng = seededRandom(900)
  return {
    ...chooseGrowthType(createCareer({ lastName: '시즌', firstName: '테스트' }, rng), growthTypeId),
    stats: { speed: 72, stamina: 72, power: 72, grit: 72, intelligence: 72 },
    turnIndex: 16,
    condition: '보통',
    stability: 50,
    runningStyle: 'SENKO',
    history: [],
    logs: [],
    recentProgressMessageIds: [],
    highSchoolState: createHighSchoolState(),
    teamState: { ...createTeamState(), initialOffersResolved: true, transferCheckpointsResolved: { beforeTurn17: true, beforeTurn21: true, beforeTurn24: true } },
    highYear2: null,
  }
}

function finishHighYear2RegularEvent(career, rng = () => 0.5) {
  let next = advanceCareer(career, rng)
  assert.ok(next.highSchoolState.pendingEvent)
  next = selectHighSchoolEventChoice(next, next.highSchoolState.pendingEvent.choices[0].id, rng)
  next = finishHighSchoolEvent(next, rng)
  return next.highSchoolLegend?.pendingLegend ? finishHighSchoolLegend(selectHighSchoolLegendChoice(next), rng) : next
}

function finishPendingHighRace(career, rng = () => 0) {
  let next = resolveHighSchoolRace(career, career.highSchoolState.pendingRace.choices[0].id, rng)
  next = completeHighSchoolRaceSequence(next)
  return finishHighSchoolRace(next, rng)
}

function runSeniorScenario(growthTypeId, decisions = {}) {
  const rng = () => 0
  let career = {
    ...chooseGrowthType(createCareer({ lastName: '시니어', firstName: '검증' }, rng), growthTypeId),
    stats: { speed: 115, stamina: 115, power: 115, grit: 115, intelligence: 115 },
    turnIndex: 20,
    condition: '보통',
    runningStyle: 'SENKO',
    history: [],
    logs: [],
    highSchoolState: createHighSchoolState(),
    highSchoolLegend: createHighSchoolLegendState(),
    teamState: { ...createTeamState(), initialOffersResolved: true, transferCheckpointsResolved: { beforeTurn17: true, beforeTurn21: true, beforeTurn24: true } },
    highYear2: createHighYear2State(),
    highYear3: createHighYear3State(),
  }
  while (!career.complete) {
    career = advanceCareer(career, rng)
    if (career.teamState?.currentTransferOffer) career = resolveTeamTransferOffer(career, false)
    if (career.highSchoolState.pendingEvent) {
      career = selectHighSchoolEventChoice(career, career.highSchoolState.pendingEvent.choices[0].id, rng)
      career = finishHighSchoolEvent(career, rng)
    }
    while (career.highSchoolLegend?.pendingLegend || career.highYear3?.pendingSpecial || career.highSchoolState.pendingRace || career.highYear3?.pendingAchievements.length) {
      if (career.highSchoolLegend?.pendingLegend) {
        career = finishHighSchoolLegend(selectHighSchoolLegendChoice(career), rng)
      } else if (career.highYear3.pendingSpecial) {
        const pending = career.highYear3.pendingSpecial
        career = resolveHighYear3Special(career, decisions[pending.id] ?? pending.choices[0].id, rng)
      } else if (career.highSchoolState.pendingRace) {
        career = finishPendingHighRace(career, rng)
      } else {
        career = dismissHighYear3Achievement(career, rng)
      }
    }
  }
  return career
}

function seededRandom(seed) {
  let value = seed >>> 0
  return () => {
    value += 0x6D2B79F5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function finishCareer(typeId, seed = 1, overrides = {}) {
  const { declineInitialTeam = false, ...careerOverrides } = overrides
  const rng = seededRandom(seed)
  let career = chooseGrowthType({ ...createCareer(rng), ...careerOverrides }, typeId)
  while (!career.complete) {
    career = advanceCareer(career, rng)
    if (career.teamState?.currentTransferOffer) career = resolveTeamTransferOffer(career, false)
    if (career.transferState?.offered && !career.transferState.resolved) {
      career = resolveTransferAndStartElementaryTurn(career, false, rng)
    }
    if (career.elementaryEventState.pendingEvent) {
      career = selectElementaryEventChoice(career, career.elementaryEventState.pendingEvent.choices[0].id, rng)
      career = finishElementaryEvent(career, rng)
    }
    if (career.middleState?.admissionPending) career = acknowledgeMiddleAdmission(completeMiddleAdmissionSequence(career))
    if (career.middleState?.distanceChangePending) career = resolveMiddleDistanceChange(career, career.growthType.id)
    if (career.middleState?.pendingEvent) {
      career = selectMiddleEventChoice(career, career.middleState.pendingEvent.choices[0].id, rng)
      career = finishMiddleEvent(career, rng)
    }
    if (career.middleState?.pendingLegend) {
      career = selectMiddleLegend(career, rng)
      career = finishMiddleLegend(career, rng)
    }
    if (career.highSchoolAdmission?.resolved && career.turnIndex === 11) {
      career = completeHighSchoolAdmissionSequence(career)
      career = enterHighSchool({ ...career, highSchoolAdmission: { ...career.highSchoolAdmission, accepted: true } })
    }
    if (career.highSchoolState?.pendingEvent) {
      career = selectHighSchoolEventChoice(career, career.highSchoolState.pendingEvent.choices[0].id, rng)
      career = finishHighSchoolEvent(career, rng)
    }
    if (career.highSchoolState?.pendingRunningStyleDecision) {
      career = selectHighSchoolRunningStyle(career, 'SENKO')
      career = finishHighSchoolRunningStyle(career, rng)
    }
    if (career.teamState?.initialOfferTeamIds.length && !career.teamState.initialOffersResolved) career = resolveInitialTeamSelection(career, declineInitialTeam ? null : career.teamState.initialOfferTeamIds[0], rng)
    if (career.highSchoolLegend?.pendingLegend) {
      career = selectHighSchoolLegendChoice(career)
      career = finishHighSchoolLegend(career, rng)
    }
    if (career.highYear2?.pendingSpecial) {
      career = resolveHighYear2Special(career, career.highYear2.pendingSpecial.choices[0].id, rng)
    }
    if (career.highYear3?.pendingSpecial) {
      career = resolveHighYear3Special(career, career.highYear3.pendingSpecial.choices[0].id, rng)
    }
    if (career.highSchoolState?.pendingRace) {
      career = resolveHighSchoolRace(career, career.highSchoolState.pendingRace.choices[0].id, rng)
      career = completeHighSchoolRaceSequence(career)
      career = finishHighSchoolRace(career, rng)
    }
    while (career.highYear3?.pendingAchievements?.length) career = dismissHighYear3Achievement(career, rng)
  }
  return career
}

test('turn schedule is exactly 6 elementary, 6 middle, and 12 high school turns', () => {
  assert.equal(TURNS.length, 24)
  assert.equal(TURNS.filter(({ stage }) => stage === '초등부').length, 6)
  assert.equal(TURNS.filter(({ stage }) => stage === '중등부').length, 6)
  assert.equal(TURNS.filter(({ stage }) => stage === '고등부').length, 12)
  assert.equal(TURNS[23].label, '고등부 3학년 4분기')
})

test('initial stats stay within 8-12 and follow the requested weighted distribution', () => {
  const rng = seededRandom(42)
  const counts = { 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 }
  const samples = 50000

  for (let index = 0; index < samples / 5; index += 1) {
    const stats = createInitialStats(rng)
    for (const value of Object.values(stats)) counts[value] += 1
  }

  assert.ok(counts[10] > counts[9] && counts[10] > counts[11])
  assert.ok(Math.abs(counts[8] / samples - 0.1) < 0.015)
  assert.ok(Math.abs(counts[9] / samples - 0.2) < 0.015)
  assert.ok(Math.abs(counts[10] / samples - 0.4) < 0.02)
  assert.ok(Math.abs(counts[11] / samples - 0.2) < 0.015)
  assert.ok(Math.abs(counts[12] / samples - 0.1) < 0.015)
})

test('potential and stability are generated independently from separate random samples', () => {
  const values = [0.2, 0.2, ...Array(5).fill(0.5), 0.95, 0.5, ...Array(6).fill(0.2), 0.99]
  let index = 0
  const career = createCareer(() => values[index++] ?? 0.5)
  assert.equal(career.potential, 87)
  assert.equal(career.stability, 20)
  assert.notEqual(career.potential, career.stability)
})

test('potential uses the requested tier distribution and always stays in range', () => {
  const rng = seededRandom(100_000)
  const counts = { low: 0, lowerMiddle: 0, middle: 0, upperMiddle: 0, high: 0, elite: 0 }
  const samples = 100_000

  for (let index = 0; index < samples; index += 1) {
    const potential = generatePotential(rng)
    assert.ok(potential >= 0 && potential <= 100)
    if (potential <= 19) counts.low += 1
    else if (potential <= 39) counts.lowerMiddle += 1
    else if (potential <= 59) counts.middle += 1
    else if (potential <= 79) counts.upperMiddle += 1
    else if (potential <= 94) counts.high += 1
    else counts.elite += 1
  }

  const expected = { low: 0.1, lowerMiddle: 0.2, middle: 0.3, upperMiddle: 0.3, high: 0.07, elite: 0.03 }
  for (const [tier, probability] of Object.entries(expected)) {
    assert.ok(Math.abs(counts[tier] / samples - probability) < 0.006, `${tier}: ${counts[tier] / samples}`)
  }
  assert.ok(Math.abs((counts.high + counts.elite) / samples - 0.1) < 0.006)
  assert.ok(Math.abs(counts.elite / samples - 0.03) < 0.006)
})

test('random Uma names are non-empty, varied, and always respect the five-character input limit', () => {
  const rng = seededRandom(300)
  const generated = new Set()

  for (let index = 0; index < 1_000; index += 1) {
    const name = generateRandomUmaName(rng)
    assert.ok(name.lastName)
    assert.ok(name.firstName)
    assert.ok([...name.lastName].length <= 5)
    assert.ok([...name.firstName].length <= 5)
    generated.add(`${name.lastName} ${name.firstName}`)
  }

  assert.ok(generated.size > 100)
  assert.deepEqual(getValidNameParts(['짧은', '여섯글자가넘음']), ['짧은'])
})

test('career stores a trimmed character name with a five-character limit', () => {
  const career = createCareer({ lastName: '  메지로  ', firstName: '맥퀸123456' }, seededRandom(3))
  assert.equal(career.lastName, '메지로')
  assert.equal(career.firstName, '맥퀸123')
  assert.equal(career.fullName, '메지로 맥퀸123')
})

test('reroll preserves the name while regenerating origin, stats, and hidden traits', () => {
  const original = createCareer({ lastName: '메지로', firstName: '맥퀸' }, () => 0.2)
  const rerolled = rerollCareer(original, () => 0.8)

  assert.equal(rerolled.lastName, original.lastName)
  assert.equal(rerolled.firstName, original.firstName)
  assert.equal(rerolled.fullName, original.fullName)
  assert.notEqual(rerolled.region.id, original.region.id)
  assert.notDeepEqual(rerolled.stats, original.stats)
  assert.notEqual(rerolled.potential, original.potential)
  assert.notEqual(rerolled.stability, original.stability)
})

test('each growth type completes a career while every stat grows', () => {
  const results = Object.fromEntries(GROWTH_TYPES.map(({ id }) => [id, finishCareer(id, 2026)]))

  for (const career of Object.values(results)) {
    for (const { id } of STATS) assert.ok(career.stats[id] > career.initialStats[id])
  }
})

test('higher potential creates faster growth with identical rolls', () => {
  const low = finishCareer('router', 77, { potential: 10, declineInitialTeam: true })
  const high = finishCareer('router', 77, { potential: 98, declineInitialTeam: true })
  const total = (career) => STATS.reduce((sum, { id }) => sum + career.stats[id], 0)
  assert.ok(total(high) > total(low))
})

test('stability controls volatility without making low stability always negative', () => {
  const simulate = (stability, seed) => {
    const rng = seededRandom(seed)
    let condition = '보통'
    let changes = 0
    const seen = new Set([condition])
    for (let index = 0; index < 5000; index += 1) {
      const next = getNextCondition(condition, stability, rng)
      if (next !== condition) changes += 1
      condition = next
      seen.add(condition)
    }
    return { changes, seen }
  }

  const low = simulate(5, 19)
  const high = simulate(95, 19)
  assert.ok(low.changes > high.changes * 3)
  assert.ok(low.seen.has('최상'))
  assert.ok(low.seen.has('최악'))
})

test('career completes after turn 24 and stats never exceed 120', () => {
  const career = finishCareer('sprinter', 9, {
    stats: Object.fromEntries(STATS.map(({ id }) => [id, 119])),
  })
  assert.equal(career.complete, true)
  assert.equal(career.turnIndex, 23)
  assert.equal(career.logs[0].turn, 24)
  for (const value of Object.values(career.stats)) assert.ok(value <= MAX_STAT)
})

test('all event choices have exactly three outcomes with total weight 100', () => {
  for (const event of [...ELEMENTARY_COMMON_EVENTS, ...ELEMENTARY_SCHOOL_EVENTS, ...HIGH_SCHOOL_YEAR2_EVENTS]) {
    assert.equal(event.choices.length, 3, event.id)
    for (const choice of event.choices) {
      assert.equal(choice.outcomes.length, 3, `${event.id}/${choice.id}`)
      assert.equal(choice.outcomes.reduce((sum, outcome) => sum + outcome.weight, 0), 100, `${event.id}/${choice.id}`)
    }
  }
})

test('elementary common event catalog has 50 unique, grade-valid events', () => {
  assert.equal(ELEMENTARY_COMMON_EVENTS.length, 50)
  assert.equal(new Set(ELEMENTARY_COMMON_EVENTS.map(({ id }) => id)).size, 50)
  assert.deepEqual(validateElementaryCommonEvents(ELEMENTARY_COMMON_EVENTS), [])
})

test('elementary common event candidates honor grade ranges and completed ids', () => {
  const career = eventCareer({ id: 'fuchu_central', name: '후추 중앙 초등학교' }, {
    completedEventIds: ['common_relay', 'elem_snow_day'],
  })
  const firstGrade = getEligibleCommonEvents(career, 1)
  assert.ok(firstGrade.every(({ minGrade, maxGrade }) => minGrade <= 1 && maxGrade >= 1))
  assert.ok(!firstGrade.some(({ id }) => id === 'elem_next_stage'))
  assert.ok(!firstGrade.some(({ id }) => id === 'common_relay' || id === 'elem_snow_day'))

  const fifthGrade = getEligibleCommonEvents(career, 5)
  assert.ok(fifthGrade.some(({ id }) => id === 'elem_next_stage'))
  assert.ok(fifthGrade.every(({ minGrade, maxGrade }) => minGrade <= 5 && maxGrade >= 5))
})

test('elementary dynamic rewards materialize once from career state and growth type', () => {
  const stats = { speed: 10, stamina: 20, power: 30, grit: 40, intelligence: 50 }
  const router = GROWTH_TYPES.find(({ id }) => id === 'router')
  const assignment = ELEMENTARY_COMMON_EVENTS.find(({ id }) => id === 'common_assignment')
  const assignmentOutcome = assignment.choices[0].outcomes[0]
  const materialized = materializeOutcome(assignmentOutcome, stats, () => 0, router)
  assert.deepEqual(materialized.statChanges, { grit: 2, speed: 6 })

  const fitness = ELEMENTARY_COMMON_EVENTS.find(({ id }) => id === 'common_fitness_test')
  const distinct = materializeOutcome(fitness.choices[2].outcomes[1], stats, seededRandom(99), router)
  assert.equal(Object.keys(distinct.statChanges).length, 3)
  assert.ok(Object.values(distinct.statChanges).every((amount) => amount === 1))
})

function eventCareer(school, stateOverrides = {}) {
  const base = chooseGrowthType(createCareer({ lastName: '테스트', firstName: '선수' }, seededRandom(4)), 'router')
  return {
    ...base,
    school,
    elementaryEventState: {
      ...createElementaryEventState(school.id, () => 0.99),
      ...stateOverrides,
    },
  }
}

test('ordinary schools receive six unique common events in elementary school', () => {
  let career = eventCareer({ id: 'fuchu_central', name: '후추 중앙 초등학교' })
  const ids = []
  const rng = seededRandom(91)
  for (let grade = 1; grade <= 6; grade += 1) {
    career = advanceCareer(career, rng)
    ids.push(career.elementaryEventState.pendingEvent.id)
    assert.equal(career.elementaryEventState.pendingEvent.type, 'COMMON')
    career = selectElementaryEventChoice(career, 'a', rng)
    career = finishElementaryEvent(career, rng)
  }
  assert.equal(ids.length, 6)
  assert.equal(new Set(ids).size, 6)
})

test('multiple elementary careers draw from the full 50-event common pool without repeats', () => {
  const seen = new Set()
  for (let seed = 1; seed <= 500; seed += 1) {
    const rng = seededRandom(seed)
    const career = eventCareer({ id: 'fuchu_central', name: '후추 중앙 초등학교' })
    const completedEventIds = []
    for (let grade = 1; grade <= 6; grade += 1) {
      career.turnIndex = grade - 1
      career.elementaryEventState.completedEventIds = completedEventIds
      const event = getElementaryEvent(career, grade, rng)
      assert.ok(!completedEventIds.includes(event.id), `${seed}/${grade}/${event.id}`)
      completedEventIds.push(event.id)
      seen.add(event.id)
    }
  }
  assert.equal(seen.size, 50)
})

test('elementary event rewards do not use the potential growth multiplier', () => {
  const event = ELEMENTARY_COMMON_EVENTS.find(({ id }) => id === 'common_sprint')
  const career = {
    ...eventCareer({ id: 'fuchu_central', name: '후추 중앙 초등학교' }),
    potential: 100,
  }
  career.elementaryEventState.pendingEvent = event
  const selected = selectElementaryEventChoice(career, 'a', () => 0)
  assert.deepEqual(selected.elementaryEventState.pendingOutcome.statChanges, { speed: 5, power: 2 })
})

test('a special school without signature gets one or two school events and never its signature', () => {
  let career = eventCareer({ id: 'cap', name: '캡 초등학교' })
  const rng = seededRandom(12)
  for (let grade = 1; grade <= 6; grade += 1) {
    career = advanceCareer(career, rng)
    career = selectElementaryEventChoice(career, 'a', rng)
    career = finishElementaryEvent(career, rng)
  }
  assert.ok(career.elementaryEventState.schoolEventCount >= 1)
  assert.ok(career.elementaryEventState.schoolEventCount <= 2)
  assert.ok(!career.elementaryEventState.completedEventIds.includes('cap_oguri_return'))
})

test('a future signature reserves the second school-event slot', () => {
  const school = { id: 'cap', name: '캡 초등학교' }
  const career = eventCareer(school, {
    schoolEventCount: 1,
    completedEventIds: ['cap_dirt_trial'],
    signatureScheduled: true,
    signatureEventId: 'cap_oguri_return',
    signatureGrade: 5,
    signatureTriggered: false,
  })
  assert.equal(getElementaryEvent(career, 3, () => 0).type, 'COMMON')
  assert.equal(getElementaryEvent(career, 4, () => 0).type, 'COMMON')
  assert.equal(getElementaryEvent(career, 5, () => 0).id, 'cap_oguri_return')
})

test('a grade-six signature has priority over the minimum school-event guarantee', () => {
  const career = eventCareer({ id: 'symboli', name: '심볼리 초등학교' }, {
    schoolEventCount: 0,
    signatureScheduled: true,
    signatureEventId: 'symboli_rudolf_visit',
    signatureGrade: 6,
    signatureTriggered: false,
  })
  assert.equal(getElementaryEvent(career, 6, () => 0.99).id, 'symboli_rudolf_visit')
})

test('rapid choice and continue actions resolve and apply an outcome only once', () => {
  let career = eventCareer({ id: 'fuchu_central', name: '후추 중앙 초등학교' })
  career = advanceCareer(career, () => 0)
  const once = selectElementaryEventChoice(career, 'a', () => 0)
  const twice = selectElementaryEventChoice(once, 'a', () => 0.99)
  assert.strictEqual(twice, once)
  const finished = finishElementaryEvent(twice, () => 0.5)
  const repeated = finishElementaryEvent(finished, () => 0.5)
  assert.strictEqual(repeated, finished)
  assert.equal(finished.history.length, 1)
  assert.equal(finished.elementaryEventState.completedEventIds.length, 1)
})

test('great success and failure are recorded in history with bounded values', () => {
  let great = eventCareer({ id: 'fuchu_central', name: '후추 중앙 초등학교' })
  great = advanceCareer(great, () => 0)
  great = selectElementaryEventChoice(great, 'a', () => 0)
  great = finishElementaryEvent(great, () => 0.5)
  assert.equal(great.history[0].event.outcomeType, 'GREAT_SUCCESS')
  assert.ok(great.history[0].event.statChanges.speed > 0)

  const failure = resolveEventChoice(ELEMENTARY_SCHOOL_EVENTS.find(({ id }) => id === 'cap_oguri_return'), 'a', () => 0.999)
  assert.equal(failure.type, 'FAILURE')
  const zeroed = { ...eventCareer({ id: 'cap', name: '캡 초등학교' }), stats: Object.fromEntries(STATS.map(({ id }) => [id, 0])) }
  const applied = applyEventOutcome(zeroed, ELEMENTARY_SCHOOL_EVENTS.find(({ id }) => id === 'cap_oguri_return'), failure)
  assert.equal(applied.stats.stamina, 0)
})

test('condition and stats are clamped to their legal ranges', () => {
  assert.equal(moveCondition('최악', -1), '최악')
  const event = ELEMENTARY_SCHOOL_EVENTS.find(({ id }) => id === 'mejiro_matriarch')
  const career = { ...eventCareer({ id: 'mejiro', name: '메지로 초등학교' }), stats: Object.fromEntries(STATS.map(({ id }) => [id, 119])) }
  const applied = applyEventOutcome(career, event, { statChanges: { stamina: 7 }, conditionDelta: 0 })
  assert.equal(applied.stats.stamina, 120)
})

function makeTransferCareer({ potential = 85, schoolId = 'fuchu_central', destinationSchoolId = 'symboli', grade = 2, offered = false } = {}) {
  const school = getElementarySchoolById(schoolId)
  return {
    ...eventCareer(school),
    potential,
    school,
    turnIndex: grade - 1,
    transferState: {
      eligible: potential > 70,
      scheduled: true,
      grade,
      destinationSchoolId,
      offered,
      resolved: false,
      accepted: false,
      previousSchoolId: null,
    },
  }
}

test('transfer eligibility, one-time scheduling, and grade range follow the rules', () => {
  const general = getElementarySchoolById('fuchu_central')
  assert.equal(initializeTransferState({ potential: 65, school: general }, () => 0).scheduled, false)

  const rng = seededRandom(700)
  const samples = 50_000
  let scheduled = 0
  for (let index = 0; index < samples; index += 1) {
    const state = initializeTransferState({ potential: 75, school: general }, rng)
    if (state.scheduled) {
      scheduled += 1
      assert.ok([2, 3, 4].includes(state.grade))
    }
  }
  assert.ok(Math.abs(scheduled / samples - 0.5) < 0.015)
})

test('central Tracen offer chance follows potential bands', () => {
  assert.equal(getCentralTracenChance(79), 0)
  assert.equal(getCentralTracenChance(80), 0.1)
  assert.equal(getCentralTracenChance(90), 0.25)
  assert.equal(getCentralTracenChance(95), 0.5)

  const school = getElementarySchoolById('fuchu_central')
  const measure = (potential, seed) => {
    const rng = seededRandom(seed)
    let central = 0
    const samples = 30_000
    for (let index = 0; index < samples; index += 1) {
      if (chooseTransferDestination({ potential, school }, rng)?.id === 'central_tracen') central += 1
    }
    return central / samples
  }
  assert.equal(measure(75, 1), 0)
  assert.ok(Math.abs(measure(85, 2) - 0.1) < 0.015)
  assert.ok(Math.abs(measure(92, 3) - 0.25) < 0.015)
  assert.ok(Math.abs(measure(98, 4) - 0.5) < 0.015)
})

test('transfer destinations are always higher tier and central Tracen is never initially assigned', () => {
  const rng = seededRandom(818)
  for (const school of ALL_ELEMENTARY_SCHOOLS.filter(({ id }) => id !== 'central_tracen')) {
    for (let index = 0; index < 100; index += 1) {
      const destination = chooseTransferDestination({ potential: 99, school }, rng)
      if (destination) assert.ok(destination.tier > school.tier)
    }
  }

  let career = createCareer(seededRandom(12))
  for (let index = 0; index < 1_000; index += 1) {
    assert.notEqual(career.school.id, CENTRAL_TRACEN_SCHOOL.id)
    career = rerollCareer(career, rng)
  }
})

test('accepting changes only the school, declining preserves it, and both resolve the offer once', () => {
  const accepting = makeTransferCareer({ offered: true })
  const accepted = resolveTransferDecision(accepting, true, () => 0.99)
  assert.equal(accepted.school.id, 'symboli')
  assert.equal(accepted.transferState.previousSchoolId, 'fuchu_central')
  assert.equal(accepted.transferState.accepted, true)
  assert.strictEqual(resolveTransferDecision(accepted, false, () => 0), accepted)

  const declining = makeTransferCareer({ offered: true })
  const declined = resolveTransferDecision(declining, false, () => 0)
  assert.equal(declined.school.id, 'fuchu_central')
  assert.equal(declined.transferState.accepted, false)
  assert.equal(declined.transferState.resolved, true)
  assert.strictEqual(resolveTransferDecision(declined, true, () => 0), declined)
})

test('a transfer offer is separate from the regular event in the same grade', () => {
  let career = makeTransferCareer({ destinationSchoolId: 'central_tracen', offered: false })
  const before = { ...career.stats }
  career = advanceCareer(career, () => 0)
  assert.equal(career.transferState.offered, true)
  assert.deepEqual(career.stats, before)
  assert.equal(career.elementaryEventState.pendingEvent, null)

  career = resolveTransferAndStartElementaryTurn(career, true, () => 0)
  assert.equal(career.school.id, 'central_tracen')
  assert.ok(career.elementaryEventState.pendingEvent)
  assert.equal(career.history[0].kind, 'TRANSFER')
  career = selectElementaryEventChoice(career, 'a', () => 0)
  career = finishElementaryEvent(career, () => 0.5)
  assert.equal(career.turnIndex, 2)
  assert.equal(career.elementaryEventState.completedEventIds.length, 1)
})

test('accepting cancels the old signature and guarantees the central Tracen chairman signature', () => {
  const career = {
    ...makeTransferCareer({ schoolId: 'cap', destinationSchoolId: 'central_tracen', grade: 4, offered: true }),
    elementaryEventState: {
      ...createElementaryEventState('cap', () => 0.99),
      signatureScheduled: true,
      signatureEventId: 'cap_oguri_return',
      signatureGrade: 5,
      completedEventIds: ['common_relay'],
    },
  }
  const accepted = resolveTransferDecision(career, true, () => 0)
  assert.equal(accepted.elementaryEventState.signatureScheduled, true)
  assert.equal(accepted.elementaryEventState.signatureEventId, 'tracen_chairman_eye')
  assert.ok(accepted.elementaryEventState.signatureGrade >= 4 && accepted.elementaryEventState.signatureGrade <= 6)
  assert.equal(accepted.elementaryEventState.schoolEventCount, 0)
  assert.deepEqual(accepted.elementaryEventState.completedEventIds, ['common_relay'])

  const declined = resolveTransferDecision(career, false, () => 0)
  assert.equal(declined.elementaryEventState.signatureEventId, 'cap_oguri_return')
  assert.equal(declined.elementaryEventState.signatureGrade, 5)
})

test('central Tracen signature occurs at most once and its school events stay school-specific', () => {
  const career = {
    ...makeTransferCareer({ schoolId: 'central_tracen', destinationSchoolId: 'central_tracen' }),
    school: CENTRAL_TRACEN_SCHOOL,
    elementaryEventState: {
      ...createElementaryEventState('central_tracen', () => 0.99),
      signatureScheduled: true,
      signatureEventId: 'tracen_chairman_eye',
      signatureGrade: 4,
      signatureTriggered: false,
    },
  }
  assert.equal(getElementaryEvent(career, 4, () => 0).id, 'tracen_chairman_eye')
  const triggered = { ...career, elementaryEventState: { ...career.elementaryEventState, signatureTriggered: true, completedEventIds: ['tracen_chairman_eye'] } }
  assert.notEqual(getElementaryEvent(triggered, 4, () => 0).id, 'tracen_chairman_eye')

  const cap = eventCareer(getElementarySchoolById('cap'))
  const capCandidates = ELEMENTARY_SCHOOL_EVENTS.filter(({ schoolId }) => schoolId === cap.school.id)
  assert.ok(capCandidates.every(({ id }) => !id.startsWith('tracen_')))
})

test('turn history snapshots the school before and after a transfer', () => {
  let career = makeTransferCareer({ schoolId: 'cap', destinationSchoolId: 'central_tracen', grade: 2 })
  career.turnIndex = 0
  career.transferState.grade = 2
  career = advanceCareer(career, () => 0.6)
  career = selectElementaryEventChoice(career, 'a', () => 0.5)
  career = finishElementaryEvent(career, () => 0.5)
  assert.equal(career.history[0].schoolName, '캡 초등학교')

  career = advanceCareer(career, () => 0)
  career = resolveTransferAndStartElementaryTurn(career, true, () => 0)
  career = selectElementaryEventChoice(career, 'a', () => 0.5)
  career = finishElementaryEvent(career, () => 0.5)
  assert.equal(career.history[0].schoolName, '중앙 트레센 초등학교')
  assert.ok(career.history.some((entry) => entry.kind === 'TRANSFER' && entry.accepted))
  assert.ok(career.history.some((entry) => entry.kind === 'TURN' && entry.schoolName === '캡 초등학교'))
})

function reachMiddleSchool(seed = 120) {
  const rng = seededRandom(seed)
  let career = chooseGrowthType(createCareer({ lastName: '미들', firstName: '테스트' }, rng), 'router')
  while (career.turnIndex < 6) {
    career = advanceCareer(career, rng)
    if (career.transferState?.offered && !career.transferState.resolved) career = resolveTransferAndStartElementaryTurn(career, false, rng)
    career = selectElementaryEventChoice(career, career.elementaryEventState.pendingEvent.choices[0].id, rng)
    career = finishElementaryEvent(career, rng)
  }
  return { career, rng }
}

test('middle admission score combines ability, hidden potential, and elementary history', () => {
  const career = {
    stats: { speed: 20, stamina: 20, power: 20, grit: 20, intelligence: 20 },
    potential: 50,
    school: getElementarySchoolById('fuchu_central'),
    history: [],
  }
  const expectedAbility = ((100 - 75) / 45) * 35 + ((20 - 18) / 17) * 20
  assert.ok(Math.abs(calculateAbilityScore(career.stats) - expectedAbility) < 0.0001)
  assert.equal(calculateSchoolHistoryScore(career), 2)
  assert.ok(Math.abs(calculateMiddleAdmissionScore(career) - (expectedAbility + 12.5 + 2)) < 0.0001)

  const decorated = {
    ...career,
    school: CENTRAL_TRACEN_SCHOOL,
    history: [
      { kind: 'TURN', event: { schoolEvent: true, signatureEvent: false, outcomeType: 'SUCCESS' } },
      { kind: 'TURN', event: { schoolEvent: false, signatureEvent: true, outcomeType: 'GREAT_SUCCESS' } },
      { kind: 'TRANSFER', accepted: true, specialTransfer: true },
    ],
  }
  assert.equal(calculateSchoolHistoryScore(decorated), 19)
})

test('middle admission chance bands and central elementary exception follow the balance table', () => {
  assert.equal(getCentralAdmissionChance(39), 0.15)
  assert.equal(getCentralAdmissionChance(40), 0.30)
  assert.equal(getCentralAdmissionChance(59), 0.45)
  assert.equal(getCentralAdmissionChance(60), 0.60)
  assert.equal(getCentralAdmissionChance(79), 0.75)
  assert.equal(getCentralAdmissionChance(80), 0.90)
  assert.equal(getCentralAdmissionChance(90), 0.97)
  assert.equal(getCentralAdmissionChance(20, 'central_tracen'), 0.90)
  assert.ok(['nakayama_tracen_middle', 'hanshin_tracen_middle'].includes(chooseFallbackMiddleSchool(10, 'central_tracen', () => 0.8).id))
})

test('elementary graduation assigns exactly one of five middle Tracen schools and hides the score in state', () => {
  const { career } = reachMiddleSchool(121)
  assert.equal(career.turnIndex, 6)
  assert.equal(career.middleState.admissionPending, true)
  assert.ok(MIDDLE_SCHOOLS.some(({ id }) => id === career.middleState.schoolId))
  assert.ok(career.middleState.admissionScore >= 0 && career.middleState.admissionScore <= 100)
  assert.ok(career.middleState.schoolName.includes('트레센 학원 중등부'))
  const central = MIDDLE_SCHOOLS.find(({ id }) => id === 'central_tracen_middle')
  assert.equal(central.location, '일본 도쿄도 후추시')
  assert.equal(central.summaryName, '중앙 트레센 학원')
})

test('middle admission is resolved once at graduation and stores the complete selection sequence', () => {
  const { career } = reachMiddleSchool(122)
  const plan = career.middleState.admissionPlan
  assert.equal(plan.resolved, true)
  assert.equal(plan.durationMs, ADMISSION_SEQUENCE_DURATION_MS)
  assert.equal(plan.centralAccepted, career.middleState.centralAdmissionPassed)
  assert.equal(plan.destinationSchoolId, career.middleState.schoolId)
  assert.equal(plan.sequenceCompleted, false)
  assert.deepEqual(plan.messages.map(({ id }) => id), [
    'application', 'report-card', 'records', 'interview', 'growth-interview', 'fitness', 'starting-line', 'race-start', 'competition', 'race-strength', 'review', 'final-list', 'result',
  ])
  assert.ok(plan.messages.some(({ text }) => text === '초등학교 성적표를 확인하고 있습니다.'))
  assert.ok(plan.messages.some(({ text }) => text === '면접을 진행하고 있습니다.'))
  assert.ok(plan.messages.some(({ text }) => text === '선발 레이스가 시작되었습니다!'))

  const started = advanceCareer(career, () => 0)
  assert.strictEqual(started, career)
  const completed = completeMiddleAdmissionSequence(career)
  assert.equal(completed.middleState.admissionPlan.sequenceCompleted, true)
  assert.strictEqual(completeMiddleAdmissionSequence(completed), completed)
  const entered = acknowledgeMiddleAdmission(completed)
  assert.equal(entered.middleState.admissionPending, false)
  assert.equal(entered.middleState.schoolId, plan.destinationSchoolId)
})

test('central elementary applicants retain the pre-resolved outcome and receive internal progression messages', () => {
  let { career } = reachMiddleSchool(123)
  career = { ...career, school: CENTRAL_TRACEN_SCHOOL }
  const plan = createAdmissionPlan(career, { school: MIDDLE_SCHOOLS[0], centralAdmissionPassed: true })
  assert.equal(plan.destinationSchoolId, 'central_tracen_middle')
  assert.equal(plan.isCentralElementary, true)
  assert.ok(plan.messages.some(({ text }) => text === '초등부 지도 기록을 검토하고 있습니다.'))
  assert.ok(plan.messages.some(({ text }) => text === '중등부 진학 면접을 진행하고 있습니다.'))
})

function endingCareer(stats, growthTypeId = 'router', history = [], schoolId = 'kasamatsu_tracen_middle') {
  return {
    stats,
    growthType: GROWTH_TYPES.find(({ id }) => id === growthTypeId),
    history,
    middleState: { schoolId },
  }
}

test('high school admission uses final stats, final growth type, central bonus, and exactly one acceptance roll', () => {
  const career = endingCareer({ speed: 60, stamina: 40, power: 60, grit: 40, intelligence: 40 }, 'sprinter')
  const central = { ...career, middleState: { schoolId: 'central_tracen_middle' } }
  assert.ok(Math.abs(calculateHighSchoolAdmissionScore(career) - 55.5) < 0.0001)
  assert.ok(Math.abs(calculateHighSchoolAdmissionScore(central) - 65.5) < 0.0001)
  assert.equal(calculateHighSchoolAdmissionScore({ ...career, potential: 0 }), calculateHighSchoolAdmissionScore({ ...career, potential: 100 }))
  assert.equal(getHighSchoolAdmissionChance(39.99), 0.05)
  assert.equal(getHighSchoolAdmissionChance(40), 0.20)
  assert.equal(getHighSchoolAdmissionChance(95), 0.99)

  let calls = 0
  const planned = beginHighSchoolAdmission(career, () => { calls += 1; return 0.99 })
  assert.equal(calls, 1)
  assert.equal(planned.highSchoolAdmission.resolved, true)
  assert.equal(planned.highSchoolAdmission.accepted, false)
  assert.strictEqual(beginHighSchoolAdmission(planned, () => { calls += 1; return 0 }), planned)
  assert.equal(calls, 1)
  assert.strictEqual(enterHighSchool(planned), planned)
  const completed = completeHighSchoolAdmissionSequence(planned)
  assert.strictEqual(enterHighSchool(completed), completed)

  const accepted = beginHighSchoolAdmission(central, () => 0)
  const entered = enterHighSchool(completeHighSchoolAdmissionSequence(accepted))
  assert.equal(entered.turnIndex, 12)
  assert.equal(entered.nonRacerEnding, null)
})

test('high school specialty score uses core-stat averages and type-specific normalization', () => {
  const stats = { speed: 55, stamina: 40, power: 55, grit: 40, intelligence: 40 }
  const sprinter = endingCareer(stats, 'sprinter')
  const miler = endingCareer(stats, 'miler')
  const router = endingCareer({ ...stats, speed: 49.2, power: 49.2, grit: 49.2 }, 'router')
  const stayer = endingCareer({ ...stats, speed: 49.2, stamina: 49.2, grit: 49.2 }, 'stayer')

  assert.equal(calculateHighSchoolSpecialtyStat(sprinter), 55)
  assert.equal(calculateHighSchoolSpecialtyStat(miler), 55)
  assert.ok(Math.abs(calculateHighSchoolSpecialtyStat(router) - 49.2) < 0.0001)
  assert.ok(Math.abs(calculateHighSchoolSpecialtyStat(stayer) - 49.2) < 0.0001)
  for (const career of [sprinter, miler, router, stayer]) {
    assert.ok(Math.abs(calculateHighSchoolSpecialtyScore(career) - 21) < 0.0001)
  }
  assert.equal(calculateHighSchoolSpecialtyScore(endingCareer({ speed: 0, stamina: 0, power: 0, grit: 0, intelligence: 0 }, 'router')), 0)
  assert.equal(calculateHighSchoolSpecialtyScore(endingCareer({ speed: 120, stamina: 120, power: 120, grit: 120, intelligence: 120 }, 'stayer')), 35)
})

test('turn 13 resolves one running-style special after its regular event without changing growth values', () => {
  const career = {
    ...endingCareer({ speed: 60, stamina: 50, power: 58, grit: 46, intelligence: 55 }, 'miler'),
    turnIndex: 12,
    potential: 50,
    stability: 50,
    condition: '보통',
    history: [],
    logs: [],
    recentProgressMessageIds: [],
    runningStyle: null,
    highSchoolState: createHighSchoolState(),
    teamState: createTeamState(),
  }
  const started = advanceCareer(career, () => 0)
  assert.ok(started.highSchoolState.pendingEvent)
  const withChoice = selectHighSchoolEventChoice(started, started.highSchoolState.pendingEvent.choices[0].id, () => 0)
  const afterEvent = finishHighSchoolEvent(withChoice, () => 0)
  const decision = afterEvent.highSchoolState.pendingRunningStyleDecision
  assert.ok(decision)
  assert.equal(afterEvent.highSchoolState.completedEventIds.length, 1)
  assert.equal(afterEvent.runningStyle, null)
  assert.equal(Object.keys(decision.recommendationDebug.zScores).length, 5)
  assert.ok(['FRONT', 'BACK'].includes(decision.recommendationDebug.group))
  assert.strictEqual(finishHighSchoolEvent(afterEvent, () => 0.99), afterEvent)

  const selected = selectHighSchoolRunningStyle(afterEvent, 'OIKOMI')
  assert.equal(selected.highSchoolState.pendingRunningStyleDecision.selectedStyle, 'OIKOMI')
  assert.deepEqual(selected.stats, afterEvent.stats)
  assert.equal(selected.condition, afterEvent.condition)
  assert.equal(selected.growthType.id, 'miler')
  const scouted = finishHighSchoolRunningStyle(selected, () => 0)
  assert.equal(scouted.runningStyle, 'OIKOMI')
  assert.equal(scouted.highSchoolState.runningStyleDecisionResolved, true)
  assert.equal(scouted.turnIndex, 12)
  assert.equal(scouted.teamState.initialOfferTeamIds.length, 2)
  const resolved = resolveInitialTeamSelection(scouted, scouted.teamState.initialOfferTeamIds[0], () => 0)
  assert.equal(resolved.turnIndex, 13)
  assert.equal(resolved.history[1].id, 'high_running_style_decision')
  assert.equal(resolved.history[1].selectedRunningStyle, 'OIKOMI')
  assert.equal(resolved.history[1].recommendedRunningStyle, decision.recommendedStyle)
  assert.equal(resolved.history[0].teamTraining.teamId, resolved.teamState.currentTeamId)
  assert.equal(resolved.history[0].teamTraining.points, 1)
  assert.strictEqual(finishHighSchoolRunningStyle(scouted, () => 0), scouted)
  assert.ok(advanceCareer(resolved, () => 0).highSchoolState.pendingEvent)
})

test('running-style recommendation uses cohort Z-scores and the two-stage style resolver', () => {
  const statsFromZ = (zScores) => Object.fromEntries(Object.entries(TURN13_STAT_NORMS).map(([id, norm]) => [id, norm.mean + (zScores[id] ?? 0) * norm.sd]))
  const resolve = (zScores, growthTypeId = 'router') => recommendRunningStyle(statsFromZ(zScores), growthTypeId, () => .25)

  assert.equal(resolve({ speed: 1, intelligence: 1, power: -1 }).group, 'FRONT')
  assert.equal(resolve({ speed: 1, power: 1, intelligence: -1 }).group, 'BACK')
  assert.equal(resolve({ speed: 1, intelligence: 1, power: -1, stamina: 2 }).recommendation, 'NIGE')
  assert.equal(resolve({ speed: 1, intelligence: 1.5, power: .5, stamina: -2 }).recommendation, 'SENKO')
  assert.equal(resolve({ speed: 1, power: 1.5, intelligence: .5, grit: -2 }).recommendation, 'SASHI')
  assert.equal(resolve({ speed: 1, power: 1.5, intelligence: -1, grit: 2 }).recommendation, 'OIKOMI')

  assert.equal(safeZScore(10, 10, 0), 0)
  assert.equal(safeZScore(10, 10, 1e-12), 0)
  const extremes = normalizeTurn13Stats(statsFromZ({ speed: 10, stamina: -10 }))
  assert.equal(extremes.speed, 2.5)
  assert.equal(extremes.stamina, -2.5)

  const norms = Object.fromEntries(Object.entries(TURN13_STAT_NORMS).map(([id, norm]) => [id, norm.mean]))
  const first = recommendRunningStyle(norms, null, () => .25)
  const second = recommendRunningStyle(norms, null, () => .75)
  assert.equal(first.frontBackTieRoll, .25)
  assert.equal(first.detailTieRoll, .25)
  assert.notEqual(first.recommendation, second.recommendation)

  const stayerMeans = Object.fromEntries(Object.entries(STAYER_STAT_NORMS).map(([id, norm]) => [id, norm.mean]))
  assert.deepEqual(normalizeTurn13Stats(stayerMeans, 'stayer'), { speed: 0, stamina: 0, power: 0, grit: 0, intelligence: 0 })
  assert.notDeepEqual(normalizeTurn13Stats(stayerMeans, 'router'), normalizeTurn13Stats(stayerMeans, 'stayer'))
})

test('race plans derive the result from position keep and the five simulation checkpoints', () => {
  const stats = { speed: 60, stamina: 60, power: 60, grit: 60, intelligence: 60 }
  const race = { raceId: 'test-race', raceName: '테스트 레이스', raceType: 'G1', distance: '1600m', finishPosition: 12, fieldStrength: 50 }
  const expectations = { NIGE: [1, 2], SENKO: [3, 5], SASHI: [6, 9], OIKOMI: [10, 12] }
  for (const [runningStyle, [minimum, maximum]] of Object.entries(expectations)) {
    const plan = createRacePlan({ race, stats, condition: '보통', runningStyle, rng: seededRandom(77) })
    assert.equal(plan.checkpoints.length, 5)
    assert.ok(plan.checkpoints.every(({ position }) => position >= 1 && position <= 12))
    assert.ok(plan.checkpoints[0].position >= minimum && plan.checkpoints[0].position <= maximum)
    assert.ok(plan.checkpoints[1].position >= minimum && plan.checkpoints[1].position <= maximum)
    assert.ok(plan.checkpoints[0].positionKeep)
    assert.ok(plan.checkpoints[1].positionKeep)
    assert.equal(plan.checkpoints[2].positionKeep, false)
    assert.equal(plan.finalPosition, plan.checkpoints.at(-1).position)
    assert.notEqual(plan.finalPosition, race.finishPosition)
    assert.ok(plan.checkpoints.every(({ message }) => message.length > 0))
  }
})

test('race result and its plan resolve once before the sequence can award rewards', () => {
  const career = {
    ...endingCareer({ speed: 60, stamina: 50, power: 58, grit: 46, intelligence: 55 }, 'miler'),
    runningStyle: 'SENKO',
    highSchoolState: { ...createHighSchoolState(), pendingRace: { raceId: 'debut', raceName: '첫 데뷔전', raceType: 'DEBUT', distance: '데뷔전', attempt: 1 } },
  }
  const resolved = resolveHighSchoolRace(career, 'run', () => 0.5)
  assert.ok(resolved.highSchoolState.racePlan)
  assert.ok(resolved.highSchoolState.pendingRaceResult.finishPosition >= 1 && resolved.highSchoolState.pendingRaceResult.finishPosition <= 5)
  assert.equal(resolved.highSchoolState.racePlan.finalPosition, resolved.highSchoolState.pendingRaceResult.finishPosition)
  assert.equal(resolved.highSchoolState.pendingRaceResult.result, resolved.highSchoolState.pendingRaceResult.finishPosition <= 5 ? 'SUCCESS' : 'FAILURE')
  assert.equal(resolved.highSchoolState.pendingRaceResult.startPosition, resolved.highSchoolState.racePlan.checkpoints[0].position)
  assert.equal(resolved.highSchoolState.pendingRaceResult.finalStraightPosition, resolved.highSchoolState.racePlan.finalPosition)
  assert.strictEqual(resolveHighSchoolRace(resolved, 'run', () => 0), resolved)
  assert.strictEqual(finishHighSchoolRace(resolved, () => 0), resolved)
  const sequenceComplete = completeHighSchoolRaceSequence(resolved)
  assert.equal(sequenceComplete.highSchoolState.racePlan.completed, true)
})

test('race score helpers use the requested position, style, distance, and stamina formulas', () => {
  const stats = { speed: 80, stamina: 40, power: 60, grit: 30, intelligence: 70 }
  assert.equal(calculatePositionKeepScore(stats), 65)
  assert.equal(calculateStyleFitScore(stats, 'NIGE'), 63)
  assert.ok(Math.abs(calculateDistanceScore(stats, '1200m') - 65) < 0.0001)
  assert.equal(calculateStaminaPenalty({ ...stats, stamina: 40 }, '3000m', 'MIDDLE'), 0)
  assert.ok(Math.abs(calculateStaminaPenalty({ ...stats, stamina: 40 }, '3000m', 'FINAL_CORNER') - 2.7) < 0.0001)
  assert.ok(Math.abs(calculateStaminaPenalty({ ...stats, stamina: 40 }, '3000m', 'FINAL_STRAIGHT') - 6.3) < 0.0001)
  assert.deepEqual(getPositionKeepRange('NIGE', 12), [1, 2])
  assert.deepEqual(getPositionKeepRange('SENKO', 12), [3, 5])
  assert.deepEqual(getPositionKeepRange('SASHI', 12), [6, 9])
  assert.deepEqual(getPositionKeepRange('OIKOMI', 12), [10, 12])
  assert.equal(getRaceFieldStrength({ raceType: 'DEBUT', attempt: 2 }), getRaceFieldStrength({ raceType: 'DEBUT', attempt: 1 }) - 2)

  const frontRunnerStats = { speed: 75, stamina: 72, power: 50, grit: 45, intelligence: 75 }
  const closerStats = { speed: 50, stamina: 48, power: 75, grit: 72, intelligence: 75 }
  assert.ok(calculateStyleFitScore(frontRunnerStats, 'NIGE') > calculateStyleFitScore(closerStats, 'NIGE'))
  assert.ok(calculateStyleFitScore(closerStats, 'OIKOMI') > calculateStyleFitScore(frontRunnerStats, 'OIKOMI'))
  assert.ok(calculateDistanceScore({ speed: 80, stamina: 40, power: 80, grit: 50, intelligence: 50 }, '1200m') > calculateDistanceScore({ speed: 50, stamina: 80, power: 50, grit: 50, intelligence: 50 }, '1200m'))
  assert.ok(calculatePositionKeepScore({ ...stats, intelligence: 100 }) > calculatePositionKeepScore({ ...stats, intelligence: 20 }))
})

test('race simulation consumes the supplied RNG once and stores a reproducible seed', () => {
  let calls = 0
  const plan = simulateRace({
    race: { raceId: 'seed-test', raceName: '시드 테스트', raceType: 'G1', distance: '1600m', fieldStrength: 50 },
    stats: { speed: 60, stamina: 60, power: 60, grit: 60, intelligence: 60 },
    condition: '보통',
    runningStyle: 'SENKO',
    rng: () => { calls += 1; return .375 },
  })
  assert.equal(calls, 1)
  assert.equal(plan.raceSeed, 1610612736)
  assert.deepEqual(plan, simulateRace({
    race: { raceId: 'seed-test', raceName: '시드 테스트', raceType: 'G1', distance: '1600m', fieldStrength: 50 },
    stats: { speed: 60, stamina: 60, power: 60, grit: 60, intelligence: 60 },
    condition: '보통',
    runningStyle: 'SENKO',
    rng: () => .375,
  }))
})

test('10,000 race simulations keep early positions bounded and make stamina matter at 3000m', () => {
  const styles = ['NIGE', 'SENKO', 'SASHI', 'OIKOMI']
  const stats = { speed: 60, stamina: 60, power: 60, grit: 60, intelligence: 60 }
  const race = { raceId: 'kikuka_sho', raceName: '국화상', raceType: 'G1', distance: '3000m' }
  const summaries = {}
  for (const style of styles) summaries[style] = { wins: 0, positionTotal: 0 }
  for (let index = 0; index < 10000; index += 1) {
    const style = styles[index % styles.length]
    const plan = simulateRace({ race, stats, condition: '보통', runningStyle: style, rng: seededRandom(index + 1000) })
    const [minimum, maximum] = getPositionKeepRange(style, 12)
    assert.ok(plan.checkpoints[0].position >= minimum && plan.checkpoints[0].position <= maximum)
    assert.ok(plan.checkpoints[1].position >= minimum && plan.checkpoints[1].position <= maximum)
    assert.equal(plan.finalPosition, plan.checkpoints[4].position)
    summaries[style].wins += Number(plan.finalPosition === 1)
    summaries[style].positionTotal += plan.finalPosition
  }
  assert.equal(Object.values(summaries).reduce((sum, value) => sum + value.positionTotal, 0) > 0, true)
  const winCounts = Object.values(summaries).map(({ wins }) => wins)
  assert.ok(Math.max(...winCounts) - Math.min(...winCounts) <= 125)

  const lowStamina = { speed: 60, stamina: 30, power: 60, grit: 60, intelligence: 60 }
  const highStamina = { ...lowStamina, stamina: 70 }
  let lowTotal = 0
  let highTotal = 0
  for (let index = 0; index < 2000; index += 1) {
    lowTotal += simulateRace({ race, stats: lowStamina, condition: '보통', runningStyle: 'SENKO', rng: seededRandom(index + 20000) }).finalPosition
    highTotal += simulateRace({ race, stats: highStamina, condition: '보통', runningStyle: 'SENKO', rng: seededRandom(index + 20000) }).finalPosition
  }
  assert.ok(highTotal < lowTotal)
})

test('non-racer ending resolver is deterministic, history-aware, and covers specialist and fallback paths', () => {
  const analysisHistory = [
    { event: { eventId: 'elem_library_book' } },
    { event: { eventId: 'middle_video_analysis' } },
  ]
  const helperHistory = [{ event: { eventId: 'elem_help_friend' } }, { event: { eventId: 'middle_team_leader' } }]
  const analyst = endingCareer({ speed: 45, stamina: 45, power: 45, grit: 45, intelligence: 65 }, 'router', analysisHistory)
  assert.equal(resolveNonRacerEnding(analyst).id, 'RACE_ANALYST')
  assert.deepEqual(resolveNonRacerEnding(analyst), resolveNonRacerEnding(analyst))
  assert.equal(resolveNonRacerEnding(endingCareer({ speed: 66, stamina: 40, power: 55, grit: 40, intelligence: 40 }, 'sprinter')).id, 'SPRINT_ATHLETE')
  assert.equal(resolveNonRacerEnding(endingCareer({ speed: 40, stamina: 62, power: 44, grit: 54, intelligence: 40 }, 'stayer')).id, 'ENDURANCE_ATHLETE')
  assert.equal(resolveNonRacerEnding(endingCareer({ speed: 42, stamina: 42, power: 65, grit: 50, intelligence: 40 }, 'sprinter')).id, 'PHYSICAL_TRAINER')
  assert.equal(resolveNonRacerEnding(endingCareer({ speed: 50, stamina: 50, power: 50, grit: 50, intelligence: 50 }, 'router', helperHistory, 'central_tracen_middle')).id, 'TRAINER')
  assert.equal(resolveNonRacerEnding(endingCareer({ speed: 31, stamina: 10, power: 10, grit: 10, intelligence: 10 })).id, 'ORDINARY_STUDENT')
})

test('all 32 middle events have three choices and valid one-roll outcome tables', () => {
  assert.equal(MIDDLE_COMMON_EVENTS.length, 32)
  assert.equal(new Set(MIDDLE_COMMON_EVENTS.map(({ id }) => id)).size, 32)
  for (const event of MIDDLE_COMMON_EVENTS) {
    assert.equal(event.choices.length, 3, event.id)
    for (const choice of event.choices) {
      assert.equal(choice.outcomes.length, 3, `${event.id}/${choice.id}`)
      assert.equal(choice.outcomes.reduce((sum, outcome) => sum + outcome.weight, 0), 100, `${event.id}/${choice.id}`)
    }
  }
})

test('middle natural condition uses the requested symmetric stability bands and clamps at both ends', () => {
  assert.deepEqual(getNaturalConditionWeights(100), { up: 0.15, stay: 0.70, down: 0.15 })
  assert.deepEqual(getNaturalConditionWeights(70), { up: 0.20, stay: 0.60, down: 0.20 })
  assert.deepEqual(getNaturalConditionWeights(50), { up: 0.25, stay: 0.50, down: 0.25 })
  assert.deepEqual(getNaturalConditionWeights(30), { up: 0.30, stay: 0.40, down: 0.30 })
  assert.deepEqual(getNaturalConditionWeights(10), { up: 0.35, stay: 0.30, down: 0.35 })
  assert.equal(rollNaturalConditionChange(100, () => 0.10), 1)
  assert.equal(rollNaturalConditionChange(100, () => 0.50), 0)
  assert.equal(rollNaturalConditionChange(100, () => 0.95), -1)
  assert.equal(moveCondition('최상', 1), '최상')
  assert.equal(moveCondition('최악', -1), '최악')
})

test('legend target roll, candidates, and schedules are unique and school-specific', () => {
  assert.equal(rollLegendTargetCount(() => 0.1), 0)
  assert.equal(rollLegendTargetCount(() => 0.5), 1)
  assert.equal(rollLegendTargetCount(() => 0.9), 2)
  const base = chooseGrowthType(createCareer(seededRandom(5)), 'sprinter')
  const central = { ...base, middleState: { schoolId: 'central_tracen_middle', completedLegendIds: [] } }
  assert.deepEqual(getEligibleLegendEvents(central).map(({ id }) => id).sort(), ['legend_bakushin', 'legend_calstone'])
  const local = { ...base, middleState: { schoolId: 'kasamatsu_tracen_middle', completedLegendIds: [] } }
  assert.deepEqual(getEligibleLegendEvents(local).map(({ id }) => id), ['legend_oguri'])
  const schedule = scheduleMiddleLegends(central, () => 0.99)
  assert.equal(schedule.legendTargetCount, 2)
  assert.equal(schedule.legendSchedule.length, 2)
  assert.equal(new Set(schedule.legendSchedule.map(({ eventId }) => eventId)).size, 2)
  assert.equal(new Set(schedule.legendSchedule.map(({ turn }) => turn)).size, 2)
  assert.equal(scheduleMiddleLegends(local, () => 0.99).legendSchedule.length, 1)
  assert.equal(MIDDLE_LEGEND_EVENTS.length, 12)
})

test('middle event outcome is resolved once, ignores potential multiplier, and records optional legend in the same turn', () => {
  let { career } = reachMiddleSchool(129)
  career = acknowledgeMiddleAdmission(completeMiddleAdmissionSequence(career))
  career = {
    ...career,
    potential: 100,
    middleState: {
      ...career.middleState,
      schoolId: 'kasamatsu_tracen_middle',
      schoolName: '카사마츠 트레센 학원 중등부',
      legendSchedule: [{ eventId: 'legend_oguri', turn: 7, triggered: false }],
    },
  }
  career = advanceCareer(career, () => 0)
  const beforeEvent = { ...career.stats }
  const once = selectMiddleEventChoice(career, career.middleState.pendingEvent.choices[0].id, () => 0)
  const twice = selectMiddleEventChoice(once, career.middleState.pendingEvent.choices[0].id, () => 0.99)
  assert.strictEqual(twice, once)
  career = finishMiddleEvent(once, () => 0.5)
  for (const [id, delta] of Object.entries(once.middleState.pendingOutcome.statChanges)) {
    assert.equal(career.stats[id] - beforeEvent[id], delta)
  }
  assert.equal(career.middleState.pendingLegend.id, 'legend_oguri')
  const legendOnce = selectMiddleLegend(career, () => 0)
  assert.strictEqual(selectMiddleLegend(legendOnce, () => 0.99), legendOnce)
  career = finishMiddleLegend(legendOnce, () => 0.5)
  assert.equal(career.turnIndex, 7)
  assert.ok(career.history[0].event)
  assert.equal(career.history[0].legendEvent.characterName, '오구리 캡')
  assert.equal(career.history[0].schoolName, '카사마츠 트레센 학원 중등부')
})

test('six middle turns always use unique common events and then start high school admission', () => {
  let { career, rng } = reachMiddleSchool(177)
  career = acknowledgeMiddleAdmission(completeMiddleAdmissionSequence(career))
  const eventIds = []
  while (!career.highSchoolAdmission) {
    career = advanceCareer(career, rng)
    if (career.middleState.distanceChangePending) career = resolveMiddleDistanceChange(career, career.growthType.id)
    if (!career.middleState.pendingEvent) career = advanceCareer(career, rng)
    eventIds.push(career.middleState.pendingEvent.id)
    career = selectMiddleEventChoice(career, career.middleState.pendingEvent.choices[0].id, rng)
    career = finishMiddleEvent(career, rng)
    if (career.middleState.pendingLegend) {
      career = selectMiddleLegend(career, rng)
      career = finishMiddleLegend(career, rng)
    }
  }
  assert.equal(eventIds.length, 6)
  assert.equal(new Set(eventIds).size, 6)
  assert.equal(career.turnIndex, 11)
  assert.equal(career.highSchoolAdmission.resolved, true)
  assert.equal(career.middleState.completedEventIds.length, 6)
  assert.equal(career.history.filter(({ turn }) => turn >= 7 && turn <= 12).length, 6)
})

test('the turn 10 distance-change special event resolves once, preserves career values, and uses the new growth type immediately', () => {
  let { career } = reachMiddleSchool(190)
  career = acknowledgeMiddleAdmission(completeMiddleAdmissionSequence(career))
  career = {
    ...career,
    turnIndex: 9,
    condition: '양호',
    growthType: GROWTH_TYPES.find(({ id }) => id === 'sprinter'),
    middleState: {
      ...career.middleState,
      schoolId: 'central_tracen_middle',
      admissionPending: false,
      distanceChangePending: false,
      distanceChangeResolved: false,
      completedLegendIds: ['legend_bakushin'],
      legendSchedule: [
        { eventId: 'legend_bakushin', turn: 8, triggered: true },
        { eventId: 'legend_calstone', turn: 10, triggered: false },
        { eventId: 'legend_calstone', turn: 12, triggered: false },
      ],
    },
  }
  const originalStats = { ...career.stats }
  const originalPotential = career.potential
  const originalStability = career.stability
  const originalCondition = career.condition
  const originalHistory = career.history

  const pending = advanceCareer(career, () => 0)
  assert.equal(pending.middleState.distanceChangePending, true)
  assert.equal(pending.middleState.pendingEvent, null)
  assert.deepEqual(pending.stats, originalStats)
  assert.equal(pending.condition, originalCondition)
  assert.strictEqual(advanceCareer(pending, () => 0.9), pending)

  const switched = resolveMiddleDistanceChange(pending, 'stayer')
  assert.equal(switched.growthType.id, 'stayer')
  assert.equal(switched.middleState.distanceChangeResolved, true)
  assert.equal(switched.middleState.distanceChangePending, false)
  assert.deepEqual(switched.stats, originalStats)
  assert.equal(switched.potential, originalPotential)
  assert.equal(switched.stability, originalStability)
  assert.equal(switched.condition, originalCondition)
  assert.deepEqual(switched.history.slice(1), originalHistory)
  assert.deepEqual(switched.middleState.completedLegendIds, ['legend_bakushin'])
  assert.deepEqual(switched.middleState.legendSchedule.map(({ eventId, turn, triggered }) => ({ eventId, turn, triggered })), [
    { eventId: 'legend_bakushin', turn: 8, triggered: true },
    { eventId: 'legend_creek', turn: 10, triggered: false },
    { eventId: 'legend_mcqueen', turn: 12, triggered: false },
  ])
  assert.deepEqual(switched.history[0], {
    kind: 'SPECIAL', type: 'SPECIAL', id: 'middle_distance_change', title: '거리 전향 제안',
    periodLabel: '중등부 2학년 하반기 시작 전', previousGrowthType: 'sprinter', previousGrowthTypeName: '스프린터',
    selectedGrowthType: 'stayer', selectedGrowthTypeName: '스테이어', changed: true, selectedChoiceText: '스테이어에 도전한다',
  })
  assert.strictEqual(resolveMiddleDistanceChange(switched, 'router'), switched)

  const turnTen = advanceCareer(switched, () => 0)
  assert.ok(turnTen.middleState.pendingEvent)
  assert.deepEqual(turnTen.stats, applyBaseGrowth(switched, () => 0).stats)
})

test('keeping the current type and local Tracen legends leaves the schedule untouched', () => {
  const base = chooseGrowthType(createCareer(seededRandom(191)), 'router')
  const career = {
    ...base,
    turnIndex: 9,
    middleState: {
      schoolId: 'kasamatsu_tracen_middle',
      distanceChangePending: true,
      distanceChangeResolved: false,
      legendSchedule: [{ eventId: 'legend_oguri', turn: 11, triggered: false }],
      completedLegendIds: [],
    },
  }
  const resolved = resolveMiddleDistanceChange(career, 'router')
  assert.equal(resolved.growthType.id, 'router')
  assert.equal(resolved.history[0].changed, false)
  assert.deepEqual(resolved.middleState.legendSchedule, career.middleState.legendSchedule)
})

test('progress message data contains effect-free entries for each supported stage', () => {
  assert.equal(ELEMENTARY_PROGRESS_MESSAGES.length, 100)
  assert.equal(MIDDLE_PROGRESS_MESSAGES.length, 100)
  assert.equal(HIGH_PROGRESS_MESSAGES.length, 10)
  assert.equal(PROGRESS_MESSAGES.length, 210)
  assert.equal(new Set(PROGRESS_MESSAGES.map(({ id }) => id)).size, 210)
  for (const message of PROGRESS_MESSAGES) {
    assert.equal('effect' in message, false, message.id)
    assert.ok(['ELEMENTARY', 'MIDDLE', 'HIGH'].includes(message.stage))
    assert.ok(message.text.length > 0)
  }
})

test('progress messages obey stage, growth type, school, and condition filters', () => {
  const elementary = getEligibleProgressMessages({ stage: 'ELEMENTARY', growthTypeId: 'sprinter', schoolId: 'cap', conditionDelta: 0 })
  assert.ok(elementary.every(({ stage }) => stage === 'ELEMENTARY'))
  assert.ok(elementary.some(({ id }) => id === 'elem_086'))
  assert.ok(!elementary.some(({ id }) => id === 'elem_088'))
  assert.ok(!elementary.some(({ category }) => ['CONDITION_UP', 'CONDITION_DOWN'].includes(category)))

  const up = getEligibleProgressMessages({ stage: 'MIDDLE', growthTypeId: 'router', schoolId: 'kasamatsu_tracen_middle', conditionDelta: 1 })
  assert.ok(up.some(({ category }) => category === 'CONDITION_UP'))
  assert.ok(!up.some(({ category }) => category === 'CONDITION_DOWN'))
  assert.ok(up.some(({ id }) => id === 'middle_063'))
  assert.ok(!up.some(({ id }) => id === 'middle_060'))

  const down = getEligibleProgressMessages({ stage: 'MIDDLE', growthTypeId: 'router', schoolId: 'kasamatsu_tracen_middle', conditionDelta: -1 })
  assert.ok(down.some(({ category }) => category === 'CONDITION_DOWN'))
  assert.ok(!down.some(({ category }) => category === 'CONDITION_UP'))
})

test('one progress turn selects 4-6 unique messages and suppresses recent repeats', () => {
  const context = { stage: 'ELEMENTARY', growthTypeId: 'router', schoolId: 'cap', conditionDelta: 1 }
  const first = selectTurnProgressMessages(context, [], seededRandom(501), 6)
  assert.equal(first.length, 6)
  assert.equal(new Set(first.map(({ id }) => id)).size, 6)
  assert.equal(first.filter(({ category }) => category === 'CONDITION_UP').length, 1)
  for (let index = 2; index < first.length; index += 1) {
    assert.ok(!(first[index].category === first[index - 1].category && first[index].category === first[index - 2].category))
  }
  const second = selectTurnProgressMessages(context, first.map(({ id }) => id), seededRandom(502), 6)
  assert.ok(second.every(({ id }) => !first.some((message) => message.id === id)))
})

test('turn progress plan keeps gameplay values unchanged and schedules event and legend separately', () => {
  const rng = seededRandom(610)
  let career = chooseGrowthType(createCareer(rng), 'router')
  career = advanceCareer(career, rng)
  const statsAfterGrowth = { ...career.stats }
  const conditionAfterGrowth = career.condition
  const prepared = createTurnProgressPlan(career, rng)
  assert.equal(prepared.plan.durationMs, TURN_PROGRESS_DURATION_MS)
  assert.ok(prepared.plan.messages.length >= 4 && prepared.plan.messages.length <= 6)
  for (let index = 1; index < prepared.plan.messages.length; index += 1) {
    const intervalSeconds = (prepared.plan.messages[index].at - prepared.plan.messages[index - 1].at) * 8
    assert.ok(intervalSeconds >= 1.1 && intervalSeconds <= 1.8)
  }
  assert.ok(prepared.plan.eventProgressPoint >= 0.35 && prepared.plan.eventProgressPoint <= 0.70)
  assert.equal(prepared.plan.legendRequired, false)
  assert.deepEqual(prepared.career.stats, statsAfterGrowth)
  assert.equal(prepared.career.condition, conditionAfterGrowth)
  assert.equal(prepared.career.turnIndex, 0)
  assert.equal(getProgressDurationMs(1), 8000)
  assert.equal(getProgressDurationMs(2), 4000)

  const middle = {
    ...career,
    turnIndex: 6,
    middleState: {
      schoolId: 'central_tracen_middle',
      legendSchedule: [{ eventId: 'legend_gentildonna', turn: 7, triggered: false }],
    },
    currentTurnHistory: { naturalConditionDelta: -1 },
  }
  const legendPlan = createTurnProgressPlan(middle, seededRandom(611)).plan
  assert.equal(legendPlan.legendRequired, true)
  assert.ok(legendPlan.legendProgressPoint >= 0.70 && legendPlan.legendProgressPoint <= 0.85)
  assert.ok(legendPlan.legendProgressPoint > legendPlan.eventProgressPoint)
  assert.equal(legendPlan.messages.filter(({ category }) => category === 'CONDITION_DOWN').length, 1)
})

test('high school year two data has 20 unique events and the requested stable race schedule', () => {
  assert.equal(HIGH_SCHOOL_YEAR2_EVENTS.length, 20)
  assert.equal(new Set(HIGH_SCHOOL_YEAR2_EVENTS.map(({ id }) => id)).size, 20)
  assert.ok(HIGH_SCHOOL_YEAR2_EVENTS.every(({ type, choices }) => type === 'HIGH_YEAR2_COMMON' && choices.length === 3))
  assert.deepEqual(TURN18_RACES.CLASSIC_TRIPLE, ['satsuki_sho', 'japan_derby'])
  assert.deepEqual(TURN18_RACES.TRIPLE_TIARA, ['oka_sho', 'oaks'])
  assert.deepEqual(TURN20_RACES, {
    SPRINT: ['sprinters_stakes'],
    MILE: ['mile_championship'],
    CLASSIC_TRIPLE: ['kikuka_sho'],
    TRIPLE_TIARA: ['shuka_sho'],
    LONG: ['kikuka_sho'],
  })
  assert.deepEqual([
    HIGH_YEAR2_RACES.sprinters_stakes.distance,
    HIGH_YEAR2_RACES.mile_championship.distance,
    HIGH_YEAR2_RACES.kikuka_sho.distance,
    HIGH_YEAR2_RACES.shuka_sho.distance,
  ], ['1200m', '1600m', '3000m', '2000m'])
  assert.deepEqual([
    HIGH_YEAR2_RACES.oka_sho.raceName,
    HIGH_YEAR2_RACES.kikuka_sho.raceName,
    HIGH_YEAR2_RACES.shuka_sho.raceName,
  ], ['벚꽃상', '국화상', '추화상'])
})

test('router classic route runs every regular event, two spring G1s, no summer G1, and unlocks the triple crown', () => {
  let career = finishHighYear2RegularEvent(makeHighYear2Career('router'))
  assert.equal(career.highYear2.pendingSpecial.id, 'high2_classic_season')
  assert.deepEqual(career.highYear2.pendingSpecial.choices.map(({ id }) => id), ['CLASSIC_TRIPLE', 'TRIPLE_TIARA'])
  career = resolveHighYear2Special(career, 'CLASSIC_TRIPLE', () => 0.5)
  assert.equal(career.turnIndex, 17)
  assert.equal(career.highYear2.route, 'CLASSIC_TRIPLE')
  assert.equal(career.history[0].seasonRoute, 'CLASSIC_TRIPLE')

  career = finishHighYear2RegularEvent(career)
  assert.equal(career.highSchoolState.pendingRace.raceId, 'satsuki_sho')
  const springHistoryCount = career.history.length
  career = finishPendingHighRace(career)
  assert.equal(career.highSchoolState.pendingRace.raceId, 'japan_derby')
  const afterFirstCondition = career.condition
  career = finishPendingHighRace(career)
  assert.equal(career.turnIndex, 18)
  assert.equal(career.highYear2.consecutivePenaltyApplied, true)
  assert.equal(career.condition, afterFirstCondition)
  assert.equal(career.history.length, springHistoryCount + 1)
  assert.deepEqual(career.history[0].races.map(({ raceId }) => raceId), ['satsuki_sho', 'japan_derby'])

  career = finishHighYear2RegularEvent(career)
  assert.equal(career.turnIndex, 19)
  assert.equal(career.highSchoolState.pendingRace, null)
  career = finishHighYear2RegularEvent(career)
  assert.equal(career.highSchoolState.pendingRace.raceId, 'kikuka_sho')
  career = finishPendingHighRace(career)
  assert.equal(career.turnIndex, 20)
  assert.deepEqual(career.highYear2.achievements.map(({ id }) => id), ['CLASSIC_TRIPLE_CROWN'])
  assert.equal(career.highYear2.pendingAchievement.name, '클래식 삼관')
  assert.equal(career.history[0].achievements[0].name, '클래식 삼관')
  assert.equal(new Set(career.highSchoolState.completedEventIds).size, 4)
  assert.equal(career.highSchoolState.completedEventIds.length, 4)
})

test('tiara, mile, and long routes preserve their distinct queues and achievement rules', () => {
  let tiara = finishHighYear2RegularEvent(makeHighYear2Career('router'))
  tiara = resolveHighYear2Special(tiara, 'TRIPLE_TIARA', () => 0.5)
  tiara = finishHighYear2RegularEvent(tiara)
  assert.equal(tiara.highSchoolState.pendingRace.raceName, '벚꽃상')
  tiara = finishPendingHighRace(tiara)
  assert.equal(tiara.highSchoolState.pendingRace.raceName, '오크스')
  tiara = finishPendingHighRace(tiara)
  tiara = finishHighYear2RegularEvent(tiara)
  tiara = finishHighYear2RegularEvent(tiara)
  assert.equal(tiara.highSchoolState.pendingRace.raceName, '추화상')
  tiara = finishPendingHighRace(tiara)
  assert.deepEqual(tiara.highYear2.achievements.map(({ id }) => id), ['TRIPLE_TIARA'])

  let mile = finishHighYear2RegularEvent(makeHighYear2Career('miler'))
  mile = resolveHighYear2Special(mile, 'MILE', () => 0.5)
  mile = finishHighYear2RegularEvent(mile)
  assert.equal(mile.highSchoolState.pendingRace.raceId, 'nhk_mile_cup')
  mile = finishPendingHighRace(mile)
  assert.equal(mile.highYear2.pendingSpecial.id, 'high2_derby_dream')
  mile = resolveHighYear2Special(mile, 'ENTER_DERBY', () => 0.5)
  assert.equal(mile.highSchoolState.pendingRace.raceId, 'japan_derby')
  mile = finishPendingHighRace(mile)
  assert.equal(mile.highYear2.enteredJapanDerby, true)
  assert.equal(mile.highYear2.consecutivePenaltyApplied, true)

  let long = finishHighYear2RegularEvent(makeHighYear2Career('stayer'))
  long = resolveHighYear2Special(long, 'LONG', () => 0.5)
  long = finishHighYear2RegularEvent(long)
  assert.equal(long.highSchoolState.pendingRace, null)
  assert.equal(long.highYear2.pendingSpecial.id, 'high2_derby_dream')
  long = resolveHighYear2Special(long, 'ENTER_DERBY', () => 0.5)
  long = finishPendingHighRace(long)
  long = finishHighYear2RegularEvent(long)
  long = finishHighYear2RegularEvent(long)
  long = finishPendingHighRace(long)
  assert.equal(long.highYear2.raceResults.japan_derby.won, true)
  assert.equal(long.highYear2.raceResults.kikuka_sho.won, true)
  assert.deepEqual(long.highYear2.achievements, [])
})

test('sprint skips the spring G1 and one missed classic win prevents the triple crown without cancelling later races', () => {
  let sprint = finishHighYear2RegularEvent(makeHighYear2Career('sprinter'))
  sprint = resolveHighYear2Special(sprint, 'SPRINT', () => 0.5)
  sprint = finishHighYear2RegularEvent(sprint)
  assert.equal(sprint.turnIndex, 18)
  assert.equal(sprint.highSchoolState.pendingRace, null)
  sprint = finishHighYear2RegularEvent(sprint)
  sprint = finishHighYear2RegularEvent(sprint)
  assert.equal(sprint.highSchoolState.pendingRace.raceId, 'sprinters_stakes')

  let missed = makeHighYear2Career('router')
  missed = {
    ...missed,
    turnIndex: 19,
    highYear2: {
      ...createHighYear2State(),
      route: 'CLASSIC_TRIPLE',
      raceResults: {
        satsuki_sho: { raceId: 'satsuki_sho', won: true },
        japan_derby: { raceId: 'japan_derby', won: false },
      },
    },
  }
  missed = finishHighYear2RegularEvent(missed)
  assert.equal(missed.highSchoolState.pendingRace.raceId, 'kikuka_sho')
  missed = finishPendingHighRace(missed)
  assert.equal(missed.highYear2.raceResults.kikuka_sho.won, true)
  assert.deepEqual(missed.highYear2.achievements, [])
})

test('senior season data has 20 unique common events, three choices each, and all stable G1 entries', () => {
  assert.equal(HIGH_SCHOOL_YEAR3_EVENTS.length, 20)
  assert.equal(new Set(HIGH_SCHOOL_YEAR3_EVENTS.map(({ id }) => id)).size, 20)
  assert.ok(HIGH_SCHOOL_YEAR3_EVENTS.every(({ type, choices }) => type === 'HIGH_YEAR3_COMMON' && choices.length === 3))
  assert.deepEqual(Object.keys(HIGH_YEAR3_RACES), ['takamatsunomiya_kinen', 'osaka_hai', 'tenno_sho_spring', 'victoria_mile', 'yasuda_kinen', 'takarazuka_kinen', 'sprinters_stakes', 'tenno_sho_autumn', 'mile_championship', 'japan_cup', 'arima_kinen'])
  assert.equal(HIGH_YEAR3_RACES.arima_kinen.distance, '2500m')
  assert.equal(HIGH_YEAR3_RACES.tenno_sho_spring.distance, '3200m')
})

test('senior sprinter scenario runs its five selected G1s once and graduates after turn 24', () => {
  const career = runSeniorScenario('sprinter', { high3_sprint_mile: 'YES', high3_mile_wall: 'YES', high3_final_stage: 'YES' })
  assert.equal(career.complete, true)
  assert.equal(career.turnIndex, 23)
  assert.deepEqual(Object.keys(career.highYear3.raceResults), ['takamatsunomiya_kinen', 'yasuda_kinen', 'sprinters_stakes', 'mile_championship', 'arima_kinen'])
  assert.equal(career.highSchoolState.completedEventIds.filter((id) => id.startsWith('high3_')).length, 4)
  assert.ok(career.highYear3.achievements.some(({ id }) => id === 'SPRINT_KING'))
})

test('senior miler scenario applies one condition penalty after every additional same-turn G1', () => {
  const career = runSeniorScenario('miler', { high3_spring_mile: 'BOTH', high3_autumn_2000: 'YES', high3_longer_stage: 'JAPAN_CUP', high3_final_stage: 'YES' })
  const finalTurn = career.history.find(({ turn }) => turn === 24)
  assert.deepEqual(finalTurn.races.map(({ raceId }) => raceId), ['tenno_sho_autumn', 'mile_championship', 'japan_cup', 'arima_kinen'])
  assert.equal(career.highYear3.penaltiesAppliedThisTurn, 3)
  assert.ok(career.highYear3.achievements.some(({ id }) => id === 'MILE_DOMINATOR'))
})

test('senior router and stayer scenarios preserve sequential choices and unlock race achievements', () => {
  const router = runSeniorScenario('router', { high3_autumn_tenno: 'YES', high3_world_stage: 'YES', high3_final_stage: 'YES' })
  assert.ok(router.highYear3.achievements.some(({ id }) => id === 'AUTUMN_TRIPLE'))
  assert.deepEqual(router.history.find(({ turn }) => turn === 24).races.map(({ raceId }) => raceId), ['tenno_sho_autumn', 'japan_cup', 'arima_kinen'])

  const stayer = runSeniorScenario('stayer', { high3_spring_first_g1: 'PREPARE', high3_spring_grand_prix: 'YES', high3_autumn_tenno: 'YES', high3_world_stage: 'YES', high3_final_stage: 'YES' })
  assert.equal(stayer.highYear3.raceResults.osaka_hai, undefined)
  assert.ok(stayer.highYear3.achievements.some(({ id }) => id === 'TENNO_DOUBLE'))
  assert.ok(stayer.highYear3.achievements.some(({ id }) => id === 'GRAND_PRIX_DOUBLE'))
})

test('high school legend catalog has ten fixed one-choice rewards with no condition changes', () => {
  assert.equal(HIGH_SCHOOL_LEGEND_EVENTS.length, 10)
  assert.equal(new Set(HIGH_SCHOOL_LEGEND_EVENTS.map(({ legendId }) => legendId)).size, 10)
  assert.ok(HIGH_SCHOOL_LEGEND_EVENTS.every(({ type, choices, statChanges }) => type === 'HIGH_LEGEND' && choices.length === 1 && Object.values(statChanges).every((amount) => amount > 0)))
  const rudolf = HIGH_SCHOOL_LEGEND_EVENTS.find(({ legendId }) => legendId === 'SYMBOLI_RUDOLF')
  assert.deepEqual(rudolf.statChanges, { speed: 10, stamina: 10, intelligence: 10 })
})

test('high school legend weights follow growth, style, route, achievements, and race results', () => {
  const base = {
    ...chooseGrowthType(createCareer({ lastName: '전설', firstName: '가중치' }, () => 0.5), 'stayer'),
    runningStyle: 'OIKOMI',
    turnIndex: 18,
    middleState: { completedLegendIds: [] },
    highSchoolLegend: createHighSchoolLegendState(),
    highYear2: { ...createHighYear2State(), route: 'LONG' },
    highYear3: createHighYear3State(),
  }
  const turn16 = getHighLegendWeights(base, 16)
  const turn19 = getHighLegendWeights(base, 19)
  assert.equal(turn16.MEJIRO_MCQUEEN, 28)
  assert.equal(turn16.ORFEVRE, 36)
  assert.equal(turn19.MEJIRO_MCQUEEN, 46)
  assert.equal(turn19.SUPER_CREEK, 40)
  assert.equal(turn19.ORFEVRE, 44)

  const accomplished = { ...base, highYear2: { ...base.highYear2, achievements: [{ id: 'CLASSIC_TRIPLE_CROWN' }] }, highYear3: { ...base.highYear3, raceResults: { tenno_sho_spring: { won: true }, takarazuka_kinen: { won: true } } } }
  const turn23 = getHighLegendWeights(accomplished, 23)
  assert.equal(turn23.GENTILDONNA, 30)
  assert.equal(turn23.ORFEVRE, 48)
  assert.equal(turn23.MEJIRO_MCQUEEN, 40)
})

test('high school legend selection excludes middle and high school repeats and keeps Rudolf near five percent', () => {
  const career = {
    ...chooseGrowthType(createCareer({ lastName: '전설', firstName: '추첨' }, () => 0.5), 'router'),
    runningStyle: 'SASHI',
    middleState: { completedLegendIds: ['legend_oguri'] },
    highSchoolLegend: { ...createHighSchoolLegendState(), completedLegendIds: ['TAIKI_SHUTTLE', 'ALMOND_EYE'] },
    highYear2: { ...createHighYear2State(), route: 'CLASSIC_TRIPLE' },
    highYear3: createHighYear3State(),
  }
  const weights = getHighLegendWeights(career, 19)
  assert.equal(weights.OGURI_CAP, undefined)
  assert.equal(weights.TAIKI_SHUTTLE, undefined)
  assert.equal(weights.ALMOND_EYE, undefined)

  const rng = seededRandom(9012)
  const counts = {}
  for (let index = 0; index < 10_000; index += 1) {
    const id = selectHighSchoolLegend({ ...career, middleState: { completedLegendIds: [] }, highSchoolLegend: createHighSchoolLegendState() }, 16, rng).legendId
    counts[id] = (counts[id] ?? 0) + 1
  }
  assert.ok(Math.abs(counts.SYMBOLI_RUDOLF / 10_000 - 0.05) < 0.012)
  assert.ok(counts.GENTILDONNA > counts.SUPER_CREEK)
  assert.ok(counts.ALMOND_EYE > counts.SUPER_CREEK)
})

test('turns 16, 19, and 23 award exactly one high school legend before later race content', () => {
  const career = finishCareer('router', 771)
  assert.equal(career.highSchoolLegend.completedLegendIds.length, 3)
  assert.equal(new Set(career.highSchoolLegend.completedLegendIds).size, 3)
  for (const turn of [16, 19, 23]) {
    const log = career.history.find((entry) => entry.turn === turn)
    assert.equal(log.legendEvent.type, 'LEGEND')
    assert.equal(log.legendEvent.conditionDelta, 0)
    assert.ok(Object.values(log.legendEvent.statChanges).every((amount) => amount > 0))
  }
})

test('a high school legend plan is rolled once and rapid selection cannot duplicate its reward', () => {
  const base = {
    ...chooseGrowthType(createCareer({ lastName: '전설', firstName: '고정' }, () => 0.5), 'router'),
    turnIndex: 15,
    runningStyle: 'NIGE',
    middleState: { completedLegendIds: [] },
    highSchoolLegend: createHighSchoolLegendState(),
  }
  const planned = ensureHighSchoolLegendPlan(base, 16, () => 0)
  const rerendered = ensureHighSchoolLegendPlan(planned, 16, () => 0.99)
  assert.strictEqual(rerendered, planned)
  assert.equal(planned.highSchoolLegend.plans[16].legendId, 'SYMBOLI_RUDOLF')

  const pending = { ...planned, stats: { speed: 115, stamina: 115, power: 50, grit: 50, intelligence: 115 }, currentTurnHistory: { statsBefore: { speed: 115, stamina: 115, power: 50, grit: 50, intelligence: 115 }, statsAfterBase: { speed: 115, stamina: 115, power: 50, grit: 50, intelligence: 115 }, statsAfterEvent: { speed: 115, stamina: 115, power: 50, grit: 50, intelligence: 115 }, expectedGrowth: 1, periodLabel: '고등부 1학년 4분기' }, highSchoolState: { ...createHighSchoolState(), debutStatus: 'SUCCESS' }, highSchoolLegend: { ...planned.highSchoolLegend, pendingLegend: HIGH_SCHOOL_LEGEND_EVENTS[0] } }
  const selected = selectHighSchoolLegendChoice(pending)
  assert.strictEqual(selectHighSchoolLegendChoice(selected), selected)
  const resolved = finishHighSchoolLegend(selected, () => 0.5)
  assert.deepEqual({ speed: resolved.stats.speed, stamina: resolved.stats.stamina, intelligence: resolved.stats.intelligence }, { speed: 120, stamina: 120, intelligence: 120 })
  assert.strictEqual(finishHighSchoolLegend(resolved, () => 0), resolved)
  assert.equal(resolved.highSchoolLegend.completedLegendIds.length, 1)
})

test('initial team scouting offers exactly two unique lower-rank teams and resolves only once', () => {
  const base = {
    ...chooseGrowthType(createCareer({ lastName: '팀', firstName: '영입' }, seededRandom(101)), 'router'),
    turnIndex: 12,
    runningStyle: 'SENKO',
    teamState: createTeamState(),
  }
  const offered = createInitialTeamOffers(base, seededRandom(102))
  assert.equal(offered.teamState.initialOfferTeamIds.length, 2)
  assert.equal(new Set(offered.teamState.initialOfferTeamIds).size, 2)
  assert.ok(offered.teamState.initialOfferTeamIds.every((id) => INITIAL_TEAM_IDS.includes(id)))
  assert.ok(offered.teamState.initialOfferTeamIds.every((id) => TEAM_BY_ID[id].rank >= 4))
  assert.strictEqual(createInitialTeamOffers(offered, () => 0.99), offered)

  const selectedId = offered.teamState.initialOfferTeamIds[0]
  const joined = resolveInitialTeamOffer(offered, selectedId)
  assert.equal(joined.teamState.currentTeamId, selectedId)
  assert.equal(joined.teamState.teamTenureTurnCount, 0)
  assert.equal(joined.teamState.history[0].type, 'TEAM_JOIN')
  assert.strictEqual(resolveInitialTeamOffer(joined, offered.teamState.initialOfferTeamIds[1]), joined)
})

test('team training point schedules match every team tenure rule', () => {
  assert.deepEqual([1, 2, 3, 4].map((turn) => getTeamTrainingPoints('TEAM_CANOPUS', turn)), [0, 1, 0, 1])
  assert.deepEqual([1, 2, 3, 4].map((turn) => getTeamTrainingPoints('TEAM_ASELLA', turn)), [1, 1, 1, 1])
  assert.deepEqual([1, 2, 3, 4].map((turn) => getTeamTrainingPoints('TEAM_CAPELLA', turn)), [1, 1, 1, 2])
  assert.deepEqual([1, 2, 3, 4].map((turn) => getTeamTrainingPoints('TEAM_SIRIUS', turn)), [1, 1, 2, 1])
  assert.deepEqual([1, 2, 3, 4].map((turn) => getTeamTrainingPoints('TEAM_SPICA', turn)), [1, 2, 1, 2])
  assert.deepEqual([1, 2, 3].map((turn) => getTeamTrainingPoints('TEAM_RIGIL', turn)), [2, 2, 2])
  assert.deepEqual([1, 2, 3].map((turn) => getTeamTrainingPoints('TEAM_TURF_QUEENS', turn)), [2, 2, 3])
  assert.deepEqual([1, 2, 3, 4].map((turn) => getTeamTrainingPoints('TEAM_ATTAKE', turn)), [2, 3, 2, 3])
})

test('team turn plans are stable, apply once, ignore potential, and clamp stats', () => {
  const makeCareer = (potential) => ({
    ...chooseGrowthType(createCareer({ lastName: '팀', firstName: '훈련' }, () => 0.5), 'router'),
    potential,
    turnIndex: 16,
    condition: '보통',
    stats: { speed: 120, stamina: 119, power: 118, grit: 117, intelligence: 116 },
    currentTurnHistory: { statsAfterEvent: { speed: 120, stamina: 119, power: 118, grit: 117, intelligence: 116 } },
    teamState: { ...createTeamState(), currentTeamId: 'TEAM_ATTAKE', initialOffersResolved: true },
  })
  const lowPlan = createTeamTurnPlan(makeCareer(0), seededRandom(333))
  const highPlan = createTeamTurnPlan(makeCareer(100), seededRandom(333))
  assert.deepEqual(lowPlan.training, highPlan.training)

  const plannedCareer = { ...makeCareer(50), teamState: { ...makeCareer(50).teamState, turnPlans: { 17: lowPlan } } }
  const applied = applyTeamTurnPlan(plannedCareer, () => 0.99)
  assert.equal(applied.teamState.teamTenureTurnCount, 1)
  assert.ok(Object.values(applied.stats).every((value) => value <= MAX_STAT))
  assert.deepEqual(applied.currentTurnHistory.teamGrowth, lowPlan.training.statChanges)
  assert.strictEqual(applyTeamTurnPlan(applied, () => 0), applied)
})

test('team condition support uses each base chance, adds twenty points when struggling, and skips top condition', () => {
  const samples = 10_000
  for (const teamId of Object.keys(TEAM_BY_ID)) {
    const team = TEAM_BY_ID[teamId]
    const simulate = (condition, seed) => {
      const rng = seededRandom(seed)
      let successes = 0
      for (let index = 0; index < samples; index += 1) {
        const career = {
          ...chooseGrowthType(createCareer({ lastName: '지원', firstName: '검증' }, () => 0.5), 'miler'),
          turnIndex: 16,
          condition,
          stats: { speed: 50, stamina: 50, power: 50, grit: 50, intelligence: 50 },
          teamState: { ...createTeamState(), currentTeamId: teamId, initialOffersResolved: true },
        }
        if (createTeamTurnPlan(career, rng).conditionSupport.success) successes += 1
      }
      return successes / samples
    }
    assert.ok(Math.abs(simulate('보통', team.rank * 10) - team.recoveryChance / 100) < 0.02, teamId)
    assert.ok(Math.abs(simulate('저조', team.rank * 10 + 1) - (team.recoveryChance + 20) / 100) < 0.02, `${teamId} low`)
  }
  const top = createTeamTurnPlan({
    ...chooseGrowthType(createCareer({ lastName: '지원', firstName: '최상' }, () => 0.5), 'miler'),
    turnIndex: 16,
    condition: '최상',
    teamState: { ...createTeamState(), currentTeamId: 'TEAM_CANOPUS', initialOffersResolved: true },
  }, () => 0)
  assert.equal(top.conditionSupport.rolled, false)
  assert.equal(top.conditionSupport.success, false)
})

test('team reputation counts G1 results and unique route achievements at the requested values', () => {
  const career = {
    history: [{ races: [
      { grade: 'G1', finishPosition: 1 },
      { raceType: 'G1', finishPosition: 3 },
      { grade: 'G1', finishPosition: 6 },
      { grade: 'G1', finishPosition: 9 },
      { grade: 'G2', finishPosition: 1 },
    ] }],
    highYear2: { achievements: [{ id: 'CLASSIC_TRIPLE_CROWN' }] },
    highYear3: { achievements: [{ id: 'SPRINT_KING' }, { id: 'SPRINT_KING' }] },
  }
  assert.equal(calculateTeamReputation(career), 71)
})

test('transfer checkpoints offer only eligible stronger teams and acceptance resets tenure once', () => {
  const base = {
    ...chooseGrowthType(createCareer({ lastName: '팀', firstName: '이적' }, () => 0.5), 'router'),
    turnIndex: 16,
    runningStyle: 'SENKO',
    history: [{ races: [{ grade: 'G1', finishPosition: 1 }] }],
    teamState: { ...createTeamState(), currentTeamId: 'TEAM_CANOPUS', initialOffersResolved: true, teamTenureTurnCount: 4 },
  }
  const eligible = getEligibleTransferTeams(base)
  assert.ok(eligible.every(({ rank, minimumReputation }) => rank < 8 && minimumReputation <= 20))
  assert.ok(eligible.some(({ id }) => id === 'TEAM_RIGIL'))
  assert.ok(!eligible.some(({ id }) => id === 'TEAM_TURF_QUEENS' || id === 'TEAM_ATTAKE'))

  const spicaAt51 = {
    ...base,
    history: [{ races: [
      { grade: 'G1', finishPosition: 1 }, { grade: 'G1', finishPosition: 1 },
      { grade: 'G1', finishPosition: 2 }, { grade: 'G1', finishPosition: 6 },
    ] }],
    teamState: { ...base.teamState, currentTeamId: 'TEAM_SPICA' },
  }
  assert.deepEqual(getEligibleTransferTeams(spicaAt51).map(({ id }) => id), ['TEAM_TURF_QUEENS', 'TEAM_RIGIL'])

  const rigilAt80 = {
    ...base,
    history: [{ races: Array.from({ length: 4 }, () => ({ grade: 'G1', finishPosition: 1 })) }],
    teamState: { ...base.teamState, currentTeamId: 'TEAM_RIGIL' },
  }
  assert.deepEqual(getEligibleTransferTeams(rigilAt80).map(({ id }) => id), ['TEAM_ATTAKE', 'TEAM_TURF_QUEENS'])

  const offered = prepareTeamTransferCheckpoint(base, seededRandom(701))
  assert.equal(offered.teamState.currentTransferOffer.beforeTurn, 17)
  assert.strictEqual(prepareTeamTransferCheckpoint(offered, () => 0.99), offered)
  const offeredTeamId = offered.teamState.currentTransferOffer.teamId
  const accepted = resolveTeamTransferOffer(offered, true)
  assert.equal(accepted.teamState.currentTeamId, offeredTeamId)
  assert.equal(accepted.teamState.teamTenureTurnCount, 0)
  assert.equal(accepted.teamState.transferCheckpointsResolved.beforeTurn17, true)
  assert.equal(accepted.teamState.history.at(-1).type, 'TEAM_TRANSFER')
  assert.strictEqual(resolveTeamTransferOffer(accepted, true), accepted)

  const rejected = resolveTeamTransferOffer(prepareTeamTransferCheckpoint(base, seededRandom(702)), false)
  assert.equal(rejected.teamState.currentTeamId, 'TEAM_CANOPUS')
  assert.equal(rejected.teamState.teamTenureTurnCount, 4)
})
