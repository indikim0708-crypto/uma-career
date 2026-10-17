import { ADMISSION_BALANCE } from '../data/admissionBalance.js'
import { resolveNonRacerEnding } from './nonRacerEndingResolver.js'

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value))
const HIGH = ADMISSION_BALANCE.HIGH_SCHOOL_ADMISSION

export function calculateHighSchoolSpecialtyStat(career) {
  const { speed, stamina, power, grit } = career.stats
  switch (career.growthType.id) {
    case 'sprinter':
    case 'miler':
      return (speed + power) / 2
    case 'router':
      return (speed + power + grit) / 3
    case 'stayer':
      return (stamina + grit + speed) / 3
    default:
      return 0
  }
}

export function calculateHighSchoolSpecialtyScore(career) {
  const normalization = HIGH.specialtyNormalization[career.growthType.id.toUpperCase()]
  const coreStatAverage = calculateHighSchoolSpecialtyStat(career)
  return clamp((coreStatAverage - normalization.min) / (normalization.max - normalization.min), 0, 1) * HIGH.specialtyMaximum
}

export function calculateHighSchoolAdmissionScore(career) {
  const totalStats = Object.values(career.stats).reduce((sum, value) => sum + value, 0)
  const overallScore = clamp((totalStats - HIGH.overall.minimumTotal) / HIGH.overall.range, 0, 1) * HIGH.overall.maximum
  const specialtyScore = calculateHighSchoolSpecialtyScore(career)
  const schoolBonus = career.middleState?.schoolId === 'central_tracen_middle' ? HIGH.centralMiddleBonus : 0
  return clamp(overallScore + specialtyScore + schoolBonus, 0, 100)
}

export function getHighSchoolAdmissionChance(score) {
  return HIGH.chanceBands.find(({ below }) => score < below).chance
}

export function resolveHighSchoolAdmission(career, rng = Math.random) {
  const score = calculateHighSchoolAdmissionScore(career)
  const chance = getHighSchoolAdmissionChance(score)
  return { resolved: true, score, chance, accepted: rng() < chance }
}

export function createHighSchoolAdmissionPlan(career, resolution) {
  const centralMiddle = career.middleState?.schoolId === 'central_tracen_middle'
  return {
    ...resolution,
    durationMs: 9000,
    sequenceCompleted: false,
    messages: [
      { id: 'application', at: 0.05, text: '고등부 진학 신청서를 제출했습니다.' },
      { id: 'report-card', at: 0.16, text: '중등부 성적표를 확인하고 있습니다.' },
      { id: 'training-record', at: 0.27, text: '지난 3년간의 훈련 기록을 검토하고 있습니다.' },
      { id: 'teacher-review', at: 0.38, text: centralMiddle ? '중앙 트레센 중등부 지도 기록을 확인하고 있습니다.' : '중등부 지도교사의 평가서를 확인하고 있습니다.' },
      { id: 'interview', at: 0.48, text: '고등부 진학 면접을 진행하고 있습니다.' },
      { id: 'ability', at: 0.57, text: '기초 능력 평가가 진행되고 있습니다.' },
      { id: 'starting-line', at: 0.65, text: '선발 레이스 출발선에 섰습니다.' },
      { id: 'race-start', at: 0.73, text: '최종 선발 레이스가 시작되었습니다!' },
      { id: 'competition', at: 0.81, text: '고등부 후보생들과 치열하게 경쟁하고 있습니다.' },
      { id: 'review', at: 0.91, text: '코치진이 모든 평가 결과를 검토하고 있습니다.' },
      { id: 'final-list', at: 0.98, text: '최종 진학 명단을 작성하고 있습니다...' },
      { id: 'result', at: 1, text: '결과 발표' },
    ],
  }
}

export function beginHighSchoolAdmission(career, rng = Math.random) {
  if (career.highSchoolAdmission?.resolved) return career
  const resolution = resolveHighSchoolAdmission(career, rng)
  const plan = createHighSchoolAdmissionPlan(career, resolution)
  return {
    ...career,
    highSchoolAdmission: plan,
    nonRacerEnding: resolution.accepted ? null : resolveNonRacerEnding(career),
    notice: '중등부를 졸업했습니다. 고등부 진학 심사가 시작됩니다.',
  }
}

export function completeHighSchoolAdmissionSequence(career) {
  const admission = career.highSchoolAdmission
  if (!admission?.resolved || admission.sequenceCompleted) return career
  return { ...career, highSchoolAdmission: { ...admission, sequenceCompleted: true } }
}

export function enterHighSchool(career) {
  if (!career.highSchoolAdmission?.accepted || !career.highSchoolAdmission.sequenceCompleted) return career
  return { ...career, turnIndex: 12, highSchoolState: { completedEventIds: [], pendingEvent: null, pendingOutcome: null, pendingRace: null, pendingRaceResult: null, racePlan: null, pendingRunningStyleDecision: null, runningStyleDecisionResolved: false, debutStatus: 'PENDING', debutAttempts: 0, achievements: [] }, highYear2: null, highYear3: null, notice: '중앙 트레센 학원 고등부 진학이 결정되었습니다.' }
}

export function completeNonRacerCareer(career) {
  if (career.highSchoolAdmission?.accepted || !career.highSchoolAdmission?.sequenceCompleted || !career.nonRacerEnding) return career
  return { ...career, complete: true, notice: '' }
}
