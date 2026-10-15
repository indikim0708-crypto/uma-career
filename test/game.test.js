import assert from 'node:assert/strict'
import test from 'node:test'
import { GROWTH_TYPES } from '../src/data/growthTypes.js'
import { MAX_STAT, STATS } from '../src/data/stats.js'
import { TURNS } from '../src/data/turns.js'
import { getNextCondition } from '../src/game/condition.js'
import { chooseGrowthType, createCareer, createInitialStats } from '../src/game/createCareer.js'
import { advanceCareer } from '../src/game/growth.js'

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
  for (let turn = 0; turn < 24; turn += 1) career = advanceCareer(career, rng)
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
  const values = [0.2, ...Array(6).fill(0.5), ...Array(6).fill(0.2), ...Array(6).fill(0.8)]
  let index = 0
  const career = createCareer(() => values[index++] ?? 0.5)
  assert.equal(career.potential, 20)
  assert.equal(career.stability, 80)
  assert.notEqual(career.potential, career.stability)
})

test('each growth type produces its intended tendency while every stat grows', () => {
  const results = Object.fromEntries(GROWTH_TYPES.map(({ id }) => [id, finishCareer(id, 2026)]))

  for (const career of Object.values(results)) {
    for (const { id } of STATS) assert.ok(career.stats[id] > career.initialStats[id])
  }

  assert.ok(results.sprinter.stats.power > results.sprinter.stats.speed)
  assert.ok(results.sprinter.stats.speed > results.sprinter.stats.stamina)
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
