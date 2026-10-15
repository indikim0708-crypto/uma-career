import { STATS } from '../data/stats.js'
import { CONDITIONS } from './condition.js'
import { randomChoice } from './eventScheduler.js'

const RATING_TEXT = {
  LOWEST: ['성장이 미비했다.', '좀처럼 눈에 띄는 발전을 보이지 못했다.'],
  LOW: ['조용한 한 해를 보냈다.', '조금씩 기초를 다졌다.'],
  NORMAL: ['꾸준히 성장했다.', '착실한 성장세를 보였다.'],
  HIGH: ['성공적인 훈련을 했다!', '눈에 띄게 실력이 향상되었다.'],
  VERY_HIGH: ['폭풍 성장!', '놀라운 속도로 성장했다!', '한 해 사이 크게 도약했다!'],
}

export function getGrowthRating(ratio) {
  if (ratio < 0.8) return 'LOWEST'
  if (ratio < 0.95) return 'LOW'
  if (ratio < 1.1) return 'NORMAL'
  if (ratio < 1.25) return 'HIGH'
  return 'VERY_HIGH'
}

export function beginTurnHistory(career, turn) {
  return {
    kind: 'TURN',
    turn: turn.number,
    periodLabel: turn.label,
    schoolId: turn.stage === '초등부' ? career.school.id : null,
    schoolName: turn.stage === '초등부' ? career.school.name : `${turn.stage} 과정`,
    statsBefore: { ...career.stats },
    statsAfterBase: null,
    statsAfter: null,
    baseGrowth: {},
    eventGrowth: {},
    totalGrowth: {},
    expectedGrowth: 0,
    actualGrowth: 0,
    growthRatio: 0,
    growthRating: null,
    growthRatingText: '',
    conditionBefore: career.condition,
    conditionAfterEvent: career.condition,
    conditionAfter: career.condition,
    eventConditionDelta: 0,
    naturalConditionDelta: 0,
    event: null,
  }
}

export function finalizeTurnHistory(career, { event = null, choice = null, outcome = null, expectedGrowth, rng = Math.random }) {
  const history = structuredClone(career.currentTurnHistory)
  history.statsAfter = { ...career.stats }
  history.conditionAfter = career.condition
  history.expectedGrowth = expectedGrowth
  history.actualGrowth = STATS.reduce((sum, { id }) => sum + history.statsAfter[id] - history.statsBefore[id], 0)
  history.growthRatio = expectedGrowth > 0 ? history.actualGrowth / expectedGrowth : 1
  history.growthRating = getGrowthRating(history.growthRatio)
  history.growthRatingText = randomChoice(RATING_TEXT[history.growthRating], rng)
  for (const { id } of STATS) {
    history.baseGrowth[id] = history.statsAfterBase[id] - history.statsBefore[id]
    history.eventGrowth[id] = history.statsAfter[id] - history.statsAfterBase[id]
    history.totalGrowth[id] = history.statsAfter[id] - history.statsBefore[id]
  }
  if (event) {
    history.event = {
      eventId: event.id,
      eventName: event.name,
      eventType: event.type,
      schoolEvent: event.type === 'SCHOOL',
      signatureEvent: event.type === 'SIGNATURE',
      situation: event.situation,
      selectedChoiceId: choice.id,
      selectedChoiceText: choice.text,
      outcomeType: outcome.type,
      outcomeText: outcome.text,
      statChanges: { ...outcome.statChanges },
      conditionDelta: outcome.conditionDelta,
    }
  }
  history.naturalConditionDelta = CONDITIONS.indexOf(history.conditionAfter) - CONDITIONS.indexOf(history.conditionAfterEvent)
  return { ...career, history: [history, ...(career.history ?? [])], logs: [history, ...(career.logs ?? [])].slice(0, 5), currentTurnHistory: null }
}
