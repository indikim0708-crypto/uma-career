import { STATS } from '../data/stats.js'

export const ADMISSION_SEQUENCE_DURATION_MS = 9000

const INTERVIEW_BY_GROWTH_TYPE = {
  sprinter: '짧은 거리에서 가장 자신 있는 점은 무엇인가요?',
  miler: '빠른 흐름 속에서 자신의 강점은 무엇인가요?',
  router: '여러 거리에서 경쟁하려면 무엇이 필요하다고 생각하나요?',
  stayer: '긴 레이스에서 가장 중요하다고 생각하는 것은 무엇인가요?',
}

const RACE_BY_STAT = {
  speed: '선발 레이스에서 좋은 출발을 보여주고 있습니다.',
  stamina: '긴 평가 구간에서도 페이스가 흔들리지 않습니다.',
  power: '가속 구간에서 강한 추진력을 보여주고 있습니다.',
  grit: '힘든 상황에서도 끝까지 따라붙고 있습니다.',
  intelligence: '침착하게 자신의 위치를 조절하고 있습니다.',
}

function getHighestStatId(stats) {
  return STATS.reduce((highest, stat) => (
    stats[stat.id] > stats[highest.id] ? stat : highest
  )).id
}

export function createAdmissionPlan(career, admission) {
  const isCentralElementary = career.school.id === 'central_tracen'
  const highestStatId = getHighestStatId(career.stats)
  const messages = [
    { id: 'application', at: 0.05, text: '입학 전형에 응시하고 있습니다.' },
    { id: 'report-card', at: 0.18, text: '초등학교 성적표를 확인하고 있습니다.' },
    { id: 'records', at: 0.32, text: '초등학교 생활기록과 훈련 기록을 검토하고 있습니다.' },
    ...(isCentralElementary ? [{ id: 'internal-records', at: 0.36, text: '초등부 지도 기록을 검토하고 있습니다.' }] : []),
    { id: 'interview', at: 0.44, text: '면접을 진행하고 있습니다.' },
    ...(isCentralElementary ? [{ id: 'internal-interview', at: 0.47, text: '중등부 진학 면접을 진행하고 있습니다.' }] : []),
    { id: 'growth-interview', at: 0.49, text: INTERVIEW_BY_GROWTH_TYPE[career.growthType.id] },
    { id: 'fitness', at: 0.55, text: '기초 체력 측정이 진행되고 있습니다.' },
    { id: 'starting-line', at: 0.65, text: '선발 레이스 출발선에 섰습니다.' },
    { id: 'race-start', at: 0.73, text: '선발 레이스가 시작되었습니다!' },
    { id: 'competition', at: 0.81, text: '지원자들과 치열하게 경쟁하고 있습니다.' },
    { id: 'race-strength', at: 0.85, text: RACE_BY_STAT[highestStatId] },
    ...((career.potential >= 80 && (career.potential + career.stats[highestStatId]) % 5 === 0)
      ? [{ id: 'potential-hint', at: 0.87, text: '심사위원 몇 명이 주행을 유심히 지켜보고 있습니다.' }]
      : []),
    { id: 'review', at: 0.91, text: '심사위원들이 모든 평가 결과를 검토하고 있습니다.' },
    { id: 'final-list', at: 0.98, text: '최종 선발 명단을 작성하고 있습니다...' },
    { id: 'result', at: 1, text: '결과 발표' },
  ]

  return {
    resolved: true,
    centralAccepted: admission.centralAdmissionPassed,
    destinationSchoolId: admission.school.id,
    isCentralElementary,
    durationMs: ADMISSION_SEQUENCE_DURATION_MS,
    messages,
    sequenceCompleted: false,
  }
}
