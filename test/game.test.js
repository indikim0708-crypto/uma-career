import assert from 'node:assert/strict'
import test from 'node:test'
import { GROWTH_TYPES } from '../src/data/growthTypes.js'
import { MAX_STAT, STATS } from '../src/data/stats.js'
import { TURNS } from '../src/data/turns.js'
import { getNextCondition } from '../src/game/condition.js'
import { chooseGrowthType, createCareer, createInitialStats, rerollCareer } from '../src/game/createCareer.js'
import { ELEMENTARY_COMMON_EVENTS } from '../src/data/elementaryEvents.js'
import { ELEMENTARY_SCHOOL_EVENTS } from '../src/data/schoolEvents.js'
import { applyEventOutcome, moveCondition, resolveEventChoice } from '../src/game/eventResolver.js'
import { createElementaryEventState, getElementaryEvent } from '../src/game/eventScheduler.js'
import { advanceCareer, finishElementaryEvent, resolveTransferAndStartElementaryTurn, selectElementaryEventChoice } from '../src/game/growth.js'
import { generatePotential } from '../src/game/random.js'
import { generateRandomUmaName, getValidNameParts } from '../src/game/nameGenerator.js'
import { ALL_ELEMENTARY_SCHOOLS, CENTRAL_TRACEN_SCHOOL, getElementarySchoolById } from '../src/data/schools.js'
import { chooseTransferDestination, getCentralTracenChance, initializeTransferState, resolveTransferDecision } from '../src/game/transfer.js'

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
  const rng = seededRandom(seed)
  let career = chooseGrowthType({ ...createCareer(rng), ...overrides }, typeId)
  while (!career.complete) {
    career = advanceCareer(career, rng)
    if (career.transferState?.offered && !career.transferState.resolved) {
      career = resolveTransferAndStartElementaryTurn(career, false, rng)
    }
    if (career.elementaryEventState.pendingEvent) {
      career = selectElementaryEventChoice(career, career.elementaryEventState.pendingEvent.choices[0].id, rng)
      career = finishElementaryEvent(career, rng)
    }
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

test('each growth type produces its intended tendency while every stat grows', () => {
  const results = Object.fromEntries(GROWTH_TYPES.map(({ id }) => [id, finishCareer(id, 2026)]))

  for (const career of Object.values(results)) {
    for (const { id } of STATS) assert.ok(career.stats[id] > career.initialStats[id])
  }

  assert.ok(results.sprinter.stats.power > results.sprinter.stats.speed)
  assert.ok(results.sprinter.stats.speed > results.sprinter.stats.intelligence)
  assert.ok(results.miler.stats.speed > results.miler.stats.power)
  assert.ok(results.miler.stats.power > results.miler.stats.grit)
  assert.ok(results.router.stats.speed > results.router.stats.power)
  assert.ok(results.router.stats.power > results.router.stats.stamina)
  assert.ok(results.router.stats.grit > results.router.stats.intelligence)
  assert.ok(results.stayer.stats.stamina > results.stayer.stats.speed)
  assert.ok(results.stayer.stats.grit > results.stayer.stats.speed)
  assert.ok(results.stayer.stats.speed > results.stayer.stats.intelligence)
})

test('higher potential creates faster growth with identical rolls', () => {
  const low = finishCareer('router', 77, { potential: 10 })
  const high = finishCareer('router', 77, { potential: 98 })
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
  for (const event of [...ELEMENTARY_COMMON_EVENTS, ...ELEMENTARY_SCHOOL_EVENTS]) {
    assert.equal(event.choices.length, 3, event.id)
    for (const choice of event.choices) {
      assert.equal(choice.outcomes.length, 3, `${event.id}/${choice.id}`)
      assert.equal(choice.outcomes.reduce((sum, outcome) => sum + outcome.weight, 0), 100, `${event.id}/${choice.id}`)
    }
  }
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
