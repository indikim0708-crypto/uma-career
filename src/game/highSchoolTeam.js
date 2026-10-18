import { INITIAL_TEAM_IDS, TEAM_BY_ID, TEAM_SUPPORT_MESSAGES, TEAM_TRANSFER_CHECKPOINTS } from '../data/highSchoolTeams.js'
import { MAX_STAT, STATS } from '../data/stats.js'
import { moveCondition } from './eventResolver.js'
import { scaleHighSchoolStatChanges } from './highSchoolGrowth.js'

const INITIAL_GROWTH = {
  sprinter: { TEAM_SPICA: 8, TEAM_ASELLA: 6, TEAM_SIRIUS: 4, TEAM_CAPELLA: 2, TEAM_CANOPUS: 2 },
  miler: { TEAM_SPICA: 8, TEAM_ASELLA: 5, TEAM_CAPELLA: 4, TEAM_SIRIUS: 2, TEAM_CANOPUS: 2 },
  router: { TEAM_SPICA: 8, TEAM_SIRIUS: 6, TEAM_ASELLA: 4, TEAM_CAPELLA: 3, TEAM_CANOPUS: 2 },
  stayer: { TEAM_CAPELLA: 10, TEAM_SIRIUS: 8, TEAM_SPICA: 5, TEAM_CANOPUS: 4, TEAM_ASELLA: 2 },
}
const INITIAL_STYLE = {
  NIGE: { TEAM_SPICA: 6, TEAM_SIRIUS: 3 }, SENKO: { TEAM_SPICA: 5, TEAM_ASELLA: 4, TEAM_CAPELLA: 2 }, SASHI: { TEAM_ASELLA: 6, TEAM_CANOPUS: 4, TEAM_SPICA: 3 }, OIKOMI: { TEAM_SIRIUS: 6, TEAM_CANOPUS: 5, TEAM_CAPELLA: 4 },
}
const PRESTIGE = { TEAM_ATTAKE: 16, TEAM_TURF_QUEENS: 12, TEAM_RIGIL: 8, TEAM_SPICA: 5, TEAM_SIRIUS: 4, TEAM_CAPELLA: 3, TEAM_ASELLA: 2, TEAM_CANOPUS: 1 }
const TRANSFER_GROWTH = {
  sprinter: { TEAM_TURF_QUEENS: 10, TEAM_SPICA: 8, TEAM_ASELLA: 6, TEAM_RIGIL: 6, TEAM_ATTAKE: 4 },
  miler: { TEAM_TURF_QUEENS: 8, TEAM_RIGIL: 8, TEAM_SPICA: 8, TEAM_ASELLA: 5, TEAM_ATTAKE: 4 },
  router: { TEAM_ATTAKE: 8, TEAM_RIGIL: 8, TEAM_SPICA: 6, TEAM_SIRIUS: 5, TEAM_TURF_QUEENS: 5 },
  stayer: { TEAM_CAPELLA: 10, TEAM_SIRIUS: 8, TEAM_ATTAKE: 8, TEAM_RIGIL: 5, TEAM_CANOPUS: 4 },
}
const TRANSFER_STYLE = {
  NIGE: { TEAM_TURF_QUEENS: 8, TEAM_SPICA: 5 }, SENKO: { TEAM_RIGIL: 8, TEAM_SPICA: 6, TEAM_ATTAKE: 4 }, SASHI: { TEAM_RIGIL: 7, TEAM_ASELLA: 6, TEAM_ATTAKE: 4 }, OIKOMI: { TEAM_SIRIUS: 8, TEAM_CANOPUS: 6, TEAM_CAPELLA: 5 },
}

export function getTransferPolicy(potential) {
  if (potential <= 50) return { checkpoints: ['beforeTurn21'], highestEligibleRank: 4 }
  if (potential <= 60) return { checkpoints: ['beforeTurn17', 'beforeTurn24'], highestEligibleRank: 3 }
  if (potential <= 75) return { checkpoints: ['beforeTurn17', 'beforeTurn21', 'beforeTurn24'], highestEligibleRank: 2 }
  return { checkpoints: ['beforeTurn17', 'beforeTurn21', 'beforeTurn24'], highestEligibleRank: 1 }
}

export function createTeamState() {
  return { currentTeamId: null, teamTenureTurnCount: 0, initialOffersResolved: false, initialOfferTeamIds: [], transferCheckpointsResolved: { beforeTurn17: false, beforeTurn21: false, beforeTurn24: false }, currentTransferOffer: null, turnPlans: {}, history: [] }
}

function weightedId(ids, weights, rng) {
  const total = ids.reduce((sum, id) => sum + weights[id], 0)
  let roll = rng() * total
  for (const id of ids) { roll -= weights[id]; if (roll < 0) return id }
  return ids.at(-1)
}

export function createInitialTeamOffers(career, rng = Math.random) {
  const state = career.teamState ?? createTeamState()
  if (state.initialOfferTeamIds.length || state.initialOffersResolved) return career.teamState ? career : { ...career, teamState: state }
  const weights = Object.fromEntries(INITIAL_TEAM_IDS.map((id) => [id, 10 + (INITIAL_GROWTH[career.growthType.id]?.[id] ?? 0) + (INITIAL_STYLE[career.runningStyle]?.[id] ?? 0)]))
  const first = weightedId(INITIAL_TEAM_IDS, weights, rng)
  const second = weightedId(INITIAL_TEAM_IDS.filter((id) => id !== first), weights, rng)
  return { ...career, teamState: { ...state, initialOfferTeamIds: [first, second] } }
}

export function resolveInitialTeamOffer(career, teamId) {
  const state = career.teamState
  if (!state || state.initialOffersResolved || (teamId !== null && !state.initialOfferTeamIds.includes(teamId))) return career
  const selected = teamId ? TEAM_BY_ID[teamId] : null
  const entry = selected ? { type: 'TEAM_JOIN', turn: 13, teamId, teamName: selected.name, representative: selected.representative } : { type: 'TEAM_DECLINED_INITIAL_OFFERS', turn: 13, offeredTeamIds: [...state.initialOfferTeamIds] }
  return { ...career, teamState: { ...state, currentTeamId: teamId, teamTenureTurnCount: 0, initialOffersResolved: true, history: [...state.history, entry] } }
}

export function getTeamTrainingPoints(teamId, tenureTurn) {
  if (teamId === 'TEAM_CANOPUS') return tenureTurn % 2 === 0 ? 1 : 0
  if (teamId === 'TEAM_ASELLA') return 1
  if (teamId === 'TEAM_CAPELLA') return 1 + (tenureTurn % 4 === 0 ? 1 : 0)
  if (teamId === 'TEAM_SIRIUS') return 1 + (tenureTurn % 3 === 0 ? 1 : 0)
  if (teamId === 'TEAM_SPICA') return 1 + (tenureTurn % 2 === 0 ? 1 : 0)
  if (teamId === 'TEAM_RIGIL') return 2
  if (teamId === 'TEAM_TURF_QUEENS') return 2 + (tenureTurn % 3 === 0 ? 1 : 0)
  if (teamId === 'TEAM_ATTAKE') return 2 + (tenureTurn % 2 === 0 ? 1 : 0)
  return 0
}

function weightedKey(weights, rng) {
  const entries = Object.entries(weights); let roll = rng() * entries.reduce((sum, [, value]) => sum + value, 0)
  for (const [key, value] of entries) { roll -= value; if (roll < 0) return key }
  return entries.at(-1)[0]
}

function resolveTrainingTarget(target, career, lowestIds, rng) {
  if (target === 'PRIMARY') return weightedKey(Object.fromEntries(Object.entries(career.growthType.weights).map(([id, weight]) => [id, weight * 100])), rng)
  if (target === 'LOWEST') return lowestIds[Math.min(lowestIds.length - 1, Math.floor(rng() * lowestIds.length))]
  return target
}

export function createTeamTurnPlan(career, rng = Math.random) {
  const turn = career.turnIndex + 1
  const state = career.teamState ?? createTeamState()
  if (state.turnPlans[turn]) return state.turnPlans[turn]
  const team = TEAM_BY_ID[state.currentTeamId]
  if (!team) return { turn, teamId: null, training: { points: 0, statChanges: {} }, conditionSupport: { rolled: false, success: false, conditionBefore: career.condition, conditionAfter: career.condition, message: '' }, resolved: false }
  const tenureTurn = state.teamTenureTurnCount + 1
  const points = getTeamTrainingPoints(team.id, tenureTurn)
  const minimum = Math.min(...STATS.map(({ id }) => career.stats[id]))
  const lowestIds = STATS.map(({ id }) => id).filter((id) => career.stats[id] === minimum)
  const statChanges = {}
  for (let index = 0; index < points; index += 1) {
    const target = resolveTrainingTarget(weightedKey(team.distribution, rng), career, lowestIds, rng)
    statChanges[target] = (statChanges[target] ?? 0) + 1
  }
  const lowCondition = ['저조', '최악'].includes(career.condition)
  const chance = Math.min(100, team.recoveryChance + (lowCondition ? 20 : 0))
  const rolled = career.condition !== '최상'
  const success = rolled && rng() * 100 < chance
  return { turn, teamId: team.id, tenureTurn, training: { points, statChanges }, conditionSupport: { chance, rolled, success, conditionBefore: career.condition, conditionAfter: success ? moveCondition(career.condition, 1) : career.condition, message: success ? TEAM_SUPPORT_MESSAGES[team.id] : '오늘은 특별한 컨디션 변화가 없었습니다.' }, resolved: false }
}

export function applyTeamTurnPlan(career, rng = Math.random) {
  const state = career.teamState ?? createTeamState()
  const turn = career.turnIndex + 1
  if (state.turnPlans[turn]?.resolved) return career
  const plan = state.turnPlans[turn] ?? createTeamTurnPlan({ ...career, teamState: state }, rng)
  const appliedStatChanges = scaleHighSchoolStatChanges(plan.training.statChanges, career.potential)
  const stats = { ...career.stats }
  for (const [id, amount] of Object.entries(appliedStatChanges)) stats[id] = Math.min(MAX_STAT, stats[id] + amount)
  const resolvedPlan = { ...plan, resolved: true }
  const currentTurnHistory = structuredClone(career.currentTurnHistory)
  currentTurnHistory.teamGrowth = { ...appliedStatChanges }
  currentTurnHistory.statsAfterTeam = { ...stats }
  currentTurnHistory.teamTraining = plan.teamId ? { teamId: plan.teamId, teamName: TEAM_BY_ID[plan.teamId].name, points: plan.training.points, statChanges: { ...appliedStatChanges } } : null
  currentTurnHistory.teamSupport = plan.teamId ? { ...plan.conditionSupport } : null
  return { ...career, stats, condition: plan.conditionSupport.conditionAfter, currentTurnHistory, teamState: { ...state, teamTenureTurnCount: plan.teamId ? plan.tenureTurn : state.teamTenureTurnCount, turnPlans: { ...state.turnPlans, [turn]: resolvedPlan } } }
}

export function calculateTeamReputation(career) {
  const races = (career.history ?? []).flatMap((log) => log.races ?? (log.race ? [log.race] : []))
  const racePoints = races.filter((race) => race.grade === 'G1' || race.raceType === 'G1').reduce((sum, race) => sum + (race.finishPosition === 1 ? 20 : race.finishPosition <= 3 ? 8 : race.finishPosition <= 6 ? 3 : 0), 0)
  const achievements = new Set([...(career.highYear2?.achievements ?? []), ...(career.highYear3?.achievements ?? [])].map(({ id }) => id))
  let achievementPoints = 0
  if (achievements.has('CLASSIC_TRIPLE_CROWN')) achievementPoints += 25
  if (achievements.has('TRIPLE_TIARA')) achievementPoints += 25
  for (const id of ['SPRINT_KING', 'MILE_DOMINATOR', 'TENNO_DOUBLE', 'GRAND_PRIX_DOUBLE', 'AUTUMN_TRIPLE']) if (achievements.has(id)) achievementPoints += 15
  return racePoints + achievementPoints
}

export function getEligibleTransferTeams(career) {
  const reputation = calculateTeamReputation(career)
  const current = TEAM_BY_ID[career.teamState?.currentTeamId]
  const { highestEligibleRank } = getTransferPolicy(career.potential)
  return Object.values(TEAM_BY_ID).filter((team) => (!current || team.rank < current.rank) && team.rank >= highestEligibleRank && team.minimumReputation <= reputation)
}

export function prepareTeamTransferCheckpoint(career, rng = Math.random) {
  const beforeTurn = career.turnIndex + 1
  const checkpoint = TEAM_TRANSFER_CHECKPOINTS[beforeTurn]
  if (!checkpoint) return career
  const state = career.teamState ?? createTeamState()
  if (state.transferCheckpointsResolved[checkpoint] || state.currentTransferOffer) return career.teamState ? career : { ...career, teamState: state }
  if (!getTransferPolicy(career.potential).checkpoints.includes(checkpoint)) {
    return { ...career, teamState: { ...state, transferCheckpointsResolved: { ...state.transferCheckpointsResolved, [checkpoint]: true } } }
  }
  const candidates = getEligibleTransferTeams({ ...career, teamState: state })
  if (!candidates.length) return { ...career, teamState: { ...state, transferCheckpointsResolved: { ...state.transferCheckpointsResolved, [checkpoint]: true } } }
  const weights = Object.fromEntries(candidates.map(({ id }) => [id, 10 + PRESTIGE[id] + (TRANSFER_GROWTH[career.growthType.id]?.[id] ?? 0) + (TRANSFER_STYLE[career.runningStyle]?.[id] ?? 0)]))
  const teamId = weightedId(candidates.map(({ id }) => id), weights, rng)
  return { ...career, teamState: { ...state, currentTransferOffer: { beforeTurn, checkpoint, teamId, reputation: calculateTeamReputation(career), resolved: false } } }
}

export function resolveTeamTransferOffer(career, accepted) {
  const state = career.teamState
  const offer = state?.currentTransferOffer
  if (!offer || offer.resolved) return career
  const fromTeamId = state.currentTeamId
  const currentTeamId = accepted ? offer.teamId : fromTeamId
  const history = accepted ? [...state.history, { type: 'TEAM_TRANSFER', beforeTurn: offer.beforeTurn, fromTeamId, toTeamId: offer.teamId }] : state.history
  return { ...career, teamState: { ...state, currentTeamId, teamTenureTurnCount: accepted ? 0 : state.teamTenureTurnCount, currentTransferOffer: null, transferCheckpointsResolved: { ...state.transferCheckpointsResolved, [offer.checkpoint]: true }, history } }
}
