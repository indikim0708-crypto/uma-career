import { NON_RACER_ENDINGS } from '../src/data/nonRacerEndings.js'
import { chooseGrowthType, createCareer } from '../src/game/createCareer.js'
import { advanceCareer, acknowledgeMiddleAdmission, completeMiddleAdmissionSequence, finishElementaryEvent, resolveTransferAndStartElementaryTurn, selectElementaryEventChoice } from '../src/game/growth.js'
import { finishMiddleEvent, finishMiddleLegend, selectMiddleEventChoice, selectMiddleLegend } from '../src/game/middleEvents.js'
import { getNonRacerEndingCandidates, selectRankedNonRacerEnding } from '../src/game/nonRacerEndingResolver.js'
import { resolveMiddleDistanceChange } from '../src/game/middleDistanceChange.js'

const RUNS = 100
const GROWTH_TYPES = ['sprinter', 'miler', 'router', 'stayer']
const ENDING_IDS = Object.keys(NON_RACER_ENDINGS)

function seededRandom(seed) {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6D2B79F5) >>> 0
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function randomChoice(items, rng) {
  return items[Math.floor(rng() * items.length)]
}

function createStats() {
  return Object.fromEntries(ENDING_IDS.map((id) => [id, {
    eligibleCount: 0,
    rank1Count: 0,
    rank2Count: 0,
    rank3Count: 0,
    rank4Count: 0,
    rank5PlusCount: 0,
    selectedCount: 0,
    scoreTotal: 0,
    minimumScore: Infinity,
    maximumScore: -Infinity,
    rankTotal: 0,
  }]))
}

function runToHighSchoolAdmission(career, rng) {
  let next = career
  let guard = 0

  while (!next.highSchoolAdmission?.resolved && guard < 100) {
    guard += 1
    next = advanceCareer(next, rng)

    if (next.transferState?.offered && !next.transferState.resolved) {
      next = resolveTransferAndStartElementaryTurn(next, rng() < 0.5, rng)
    }
    if (next.elementaryEventState.pendingEvent) {
      const choice = randomChoice(next.elementaryEventState.pendingEvent.choices, rng)
      next = selectElementaryEventChoice(next, choice.id, rng)
      next = finishElementaryEvent(next, rng)
    }
    if (next.middleState?.admissionPending) {
      next = acknowledgeMiddleAdmission(completeMiddleAdmissionSequence(next))
    }
    if (next.middleState?.distanceChangePending) {
      next = resolveMiddleDistanceChange(next, randomChoice(GROWTH_TYPES, rng))
    }
    if (next.middleState?.pendingEvent) {
      const choice = randomChoice(next.middleState.pendingEvent.choices, rng)
      next = selectMiddleEventChoice(next, choice.id, rng)
      next = finishMiddleEvent(next, rng)
    }
    if (next.middleState?.pendingLegend) {
      next = selectMiddleLegend(next, rng)
      next = finishMiddleLegend(next, rng)
    }
  }

  if (!next.highSchoolAdmission?.resolved) throw new Error('Failed to reach high school admission state.')
  return next
}

function recordRank(record, rank) {
  if (rank === 1) record.rank1Count += 1
  else if (rank === 2) record.rank2Count += 1
  else if (rank === 3) record.rank3Count += 1
  else if (rank === 4) record.rank4Count += 1
  else record.rank5PlusCount += 1
}

function percent(numerator, denominator) {
  return denominator ? `${((numerator / denominator) * 100).toFixed(1)}%` : '0.0%'
}

const stats = createStats()
const candidateDistribution = new Map()

for (let index = 0; index < RUNS; index += 1) {
  const rng = seededRandom(34000 + index)
  const initialType = randomChoice(GROWTH_TYPES, rng)
  const career = runToHighSchoolAdmission(chooseGrowthType(createCareer({}, rng), initialType), rng)
  const candidateState = getNonRacerEndingCandidates(career)
  const candidateCount = candidateState.candidates.length
  candidateDistribution.set(candidateCount, (candidateDistribution.get(candidateCount) ?? 0) + 1)

  if (!candidateCount) {
    stats.ORDINARY_STUDENT.selectedCount += 1
    continue
  }

  const { ranked, selected } = selectRankedNonRacerEnding(candidateState.candidates, rng)
  ranked.forEach((candidate, indexInRank) => {
    const record = stats[candidate.id]
    const rank = indexInRank + 1
    record.eligibleCount += 1
    record.rankTotal += rank
    record.scoreTotal += candidate.score
    record.minimumScore = Math.min(record.minimumScore, candidate.score)
    record.maximumScore = Math.max(record.maximumScore, candidate.score)
    recordRank(record, rank)
  })
  stats[selected.id].selectedCount += 1
}

const table = ENDING_IDS.map((id) => {
  const record = stats[id]
  return {
    Ending: id,
    Eligible: record.eligibleCount,
    Rank1: record.rank1Count,
    Rank2: record.rank2Count,
    Rank3: record.rank3Count,
    Rank4: record.rank4Count,
    'Rank5+': record.rank5PlusCount,
    Selected: record.selectedCount,
  }
})

const scoreTable = ENDING_IDS.map((id) => {
  const record = stats[id]
  return {
    Ending: id,
    'Avg Score': record.eligibleCount ? Number((record.scoreTotal / record.eligibleCount).toFixed(2)) : 0,
    'Min Score': record.eligibleCount ? Number(record.minimumScore.toFixed(2)) : 0,
    'Max Score': record.eligibleCount ? Number(record.maximumScore.toFixed(2)) : 0,
    'Rank1 / Eligible': percent(record.rank1Count, record.eligibleCount),
  }
})

const top = (selector, predicate = () => true) => ENDING_IDS
  .filter((id) => predicate(stats[id]))
  .sort((left, right) => selector(stats[right]) - selector(stats[left]) || left.localeCompare(right))
  .slice(0, 10)
  .map((id) => ({ Ending: id, Value: selector(stats[id]) }))

console.log(`Non-racer ranking debug: ${RUNS} careers`)
console.table(table)
console.table(scoreTable)
console.table(top((record) => record.eligibleCount))
console.table(top((record) => record.rank1Count))
console.table(top((record) => record.rank1Count / record.eligibleCount, (record) => record.eligibleCount >= 5))
console.table(top((record) => record.selectedCount))

for (const id of ['SCOUT', 'REHAB_TRAINER', 'EQUIPMENT_DEVELOPER']) {
  const record = stats[id]
  console.log(`${id}: eligible ${record.eligibleCount}/${RUNS} (${percent(record.eligibleCount, RUNS)}), rank1 ${record.rank1Count}/${record.eligibleCount} (${percent(record.rank1Count, record.eligibleCount)}), average rank ${record.eligibleCount ? (record.rankTotal / record.eligibleCount).toFixed(2) : '0.00'}, average score ${record.eligibleCount ? (record.scoreTotal / record.eligibleCount).toFixed(2) : '0.00'}, selected ${record.selectedCount}`)
}

const candidateRows = [...candidateDistribution.entries()]
  .sort(([left], [right]) => left - right)
  .map(([count, careers]) => ({ Candidates: count, Careers: careers }))
const allCandidateCounts = [...candidateDistribution.entries()].flatMap(([count, careers]) => Array(careers).fill(count))
const candidateTotal = allCandidateCounts.reduce((sum, count) => sum + count, 0)
console.table(candidateRows)
console.log(`Candidate count: average ${(candidateTotal / RUNS).toFixed(2)}, min ${Math.min(...allCandidateCounts)}, max ${Math.max(...allCandidateCounts)}`)
