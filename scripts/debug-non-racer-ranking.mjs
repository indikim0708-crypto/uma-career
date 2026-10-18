import { NON_RACER_ENDINGS } from '../src/data/nonRacerEndings.js'
import { chooseGrowthType, createCareer } from '../src/game/createCareer.js'
import { advanceCareer, acknowledgeMiddleAdmission, completeMiddleAdmissionSequence, finishElementaryEvent, resolveTransferAndStartElementaryTurn, selectElementaryEventChoice } from '../src/game/growth.js'
import { finishMiddleEvent, finishMiddleLegend, selectMiddleEventChoice, selectMiddleLegend } from '../src/game/middleEvents.js'
import { getNonRacerEndingCandidates, OBSERVATION_CAREER_ENDING_IDS, OBSERVATION_CAREER_FAMILY_ID, selectObservationCareerEnding, selectRankedNonRacerEnding } from '../src/game/nonRacerEndingResolver.js'
import { resolveMiddleDistanceChange } from '../src/game/middleDistanceChange.js'

const RUNS = 100
const GROWTH_TYPES = ['sprinter', 'miler', 'router', 'stayer']
const ENDING_IDS = Object.keys(NON_RACER_ENDINGS)
const TOP_LEVEL_IDS = [...ENDING_IDS.filter((id) => !OBSERVATION_CAREER_ENDING_IDS.includes(id) && id !== 'ORDINARY_STUDENT'), OBSERVATION_CAREER_FAMILY_ID]

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

function createRankStats(ids) {
  return Object.fromEntries(ids.map((id) => [id, {
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
  }]))
}

function runToHighSchoolAdmission(career, rng) {
  let next = career
  let guard = 0
  while (!next.highSchoolAdmission?.resolved && guard < 100) {
    guard += 1
    next = advanceCareer(next, rng)
    if (next.transferState?.offered && !next.transferState.resolved) next = resolveTransferAndStartElementaryTurn(next, rng() < 0.5, rng)
    if (next.elementaryEventState.pendingEvent) {
      next = selectElementaryEventChoice(next, randomChoice(next.elementaryEventState.pendingEvent.choices, rng).id, rng)
      next = finishElementaryEvent(next, rng)
    }
    if (next.middleState?.admissionPending) next = acknowledgeMiddleAdmission(completeMiddleAdmissionSequence(next))
    if (next.middleState?.distanceChangePending) next = resolveMiddleDistanceChange(next, randomChoice(GROWTH_TYPES, rng))
    if (next.middleState?.pendingEvent) {
      next = selectMiddleEventChoice(next, randomChoice(next.middleState.pendingEvent.choices, rng).id, rng)
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

const topLevelStats = createRankStats(TOP_LEVEL_IDS)
const finalSelections = Object.fromEntries(ENDING_IDS.map((id) => [id, 0]))
const candidateDistribution = new Map()

for (let index = 0; index < RUNS; index += 1) {
  const rng = seededRandom(42000 + index)
  const career = runToHighSchoolAdmission(chooseGrowthType(createCareer({}, rng), randomChoice(GROWTH_TYPES, rng)), rng)
  const candidateState = getNonRacerEndingCandidates(career)
  const candidateCount = candidateState.candidates.length
  candidateDistribution.set(candidateCount, (candidateDistribution.get(candidateCount) ?? 0) + 1)

  if (!candidateCount) {
    finalSelections.ORDINARY_STUDENT += 1
    continue
  }

  const { ranked, selected } = selectRankedNonRacerEnding(candidateState.candidates, rng)
  ranked.forEach((candidate, indexInRank) => {
    const record = topLevelStats[candidate.id]
    const rank = indexInRank + 1
    record.eligibleCount += 1
    record.scoreTotal += candidate.score
    record.minimumScore = Math.min(record.minimumScore, candidate.score)
    record.maximumScore = Math.max(record.maximumScore, candidate.score)
    recordRank(record, rank)
  })
  topLevelStats[selected.id].selectedCount += 1
  const ending = selected.id === OBSERVATION_CAREER_FAMILY_ID
    ? selectObservationCareerEnding(career, candidateState.counts, rng)
    : selected
  finalSelections[ending.id] += 1
}

console.log(`Non-racer family debug: ${RUNS} careers`)
console.table(TOP_LEVEL_IDS.map((id) => {
  const record = topLevelStats[id]
  return { Candidate: id, Eligible: record.eligibleCount, Rank1: record.rank1Count, Rank2: record.rank2Count, Rank3: record.rank3Count, Rank4: record.rank4Count, 'Rank5+': record.rank5PlusCount, Selected: record.selectedCount }
}))
console.table(TOP_LEVEL_IDS.map((id) => {
  const record = topLevelStats[id]
  return { Candidate: id, 'Avg Score': record.eligibleCount ? Number((record.scoreTotal / record.eligibleCount).toFixed(2)) : 0, 'Min Score': record.eligibleCount ? Number(record.minimumScore.toFixed(2)) : 0, 'Max Score': record.eligibleCount ? Number(record.maximumScore.toFixed(2)) : 0, 'Rank1 / Eligible': percent(record.rank1Count, record.eligibleCount) }
}))
console.table(ENDING_IDS.map((id) => ({ Ending: id, Selected: finalSelections[id], Percent: percent(finalSelections[id], RUNS) })))

const family = topLevelStats[OBSERVATION_CAREER_FAMILY_ID]
console.log(`OBSERVATION FAMILY: eligible ${family.eligibleCount}, rank1 ${family.rank1Count}, top-level selected ${family.selectedCount}`)
console.table(OBSERVATION_CAREER_ENDING_IDS.map((id) => ({ Ending: id, Selected: finalSelections[id], Percent: percent(finalSelections[id], RUNS) })))

const candidateRows = [...candidateDistribution.entries()].sort(([left], [right]) => left - right).map(([count, careers]) => ({ Candidates: count, Careers: careers }))
const candidateCounts = [...candidateDistribution.entries()].flatMap(([count, careers]) => Array(careers).fill(count))
console.table(candidateRows)
console.log(`Candidate count: average ${(candidateCounts.reduce((sum, count) => sum + count, 0) / RUNS).toFixed(2)}, min ${Math.min(...candidateCounts)}, max ${Math.max(...candidateCounts)}`)
