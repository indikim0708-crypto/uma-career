import { getGrowthType } from '../data/growthTypes.js'
import { rescheduleFutureCentralLegends } from './middleLegend.js'

export const MIDDLE_DISTANCE_CHANGE_TURN = 10

export function isMiddleDistanceChangeDue(career) {
  return Boolean(
    career.middleState
    && !career.middleState.distanceChangeResolved
    && !career.middleState.distanceChangePending
    && career.turnIndex + 1 === MIDDLE_DISTANCE_CHANGE_TURN,
  )
}

export function beginMiddleDistanceChange(career) {
  if (!isMiddleDistanceChangeDue(career)) return career
  return {
    ...career,
    middleState: { ...career.middleState, distanceChangePending: true },
  }
}

function createDistanceChangeHistory(career, previousGrowthType, selectedGrowthType, changed) {
  return {
    kind: 'SPECIAL',
    type: 'SPECIAL',
    id: 'middle_distance_change',
    title: '거리 전향 제안',
    periodLabel: '중등부 2학년 하반기 시작 전',
    previousGrowthType: previousGrowthType.id,
    previousGrowthTypeName: previousGrowthType.name,
    selectedGrowthType: selectedGrowthType.id,
    selectedGrowthTypeName: selectedGrowthType.name,
    changed,
    selectedChoiceText: changed ? `${selectedGrowthType.name}에 도전한다` : '현재 방향을 유지한다',
  }
}

export function resolveMiddleDistanceChange(career, selectedGrowthTypeId) {
  if (!career.middleState?.distanceChangePending || career.middleState.distanceChangeResolved) return career
  const selectedGrowthType = getGrowthType(selectedGrowthTypeId)
  if (!selectedGrowthType) return career

  const previousGrowthType = career.growthType
  const changed = previousGrowthType.id !== selectedGrowthType.id
  let next = {
    ...career,
    growthType: selectedGrowthType,
    middleState: {
      ...career.middleState,
      distanceChangePending: false,
      distanceChangeResolved: true,
    },
  }
  if (changed) next = rescheduleFutureCentralLegends(next, selectedGrowthType.id)

  const history = createDistanceChangeHistory(next, previousGrowthType, selectedGrowthType, changed)
  return { ...next, history: [history, ...(next.history ?? [])] }
}
