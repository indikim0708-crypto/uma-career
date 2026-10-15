export const MIDDLE_SCHOOLS = [
  { id: 'central_tracen_middle', name: '중앙 트레센 학원', displayName: '중앙 트레센 학원 중등부', tier: 'TOP' },
  { id: 'nakayama_tracen_middle', name: '나카야마 트레센 학원', displayName: '나카야마 트레센 학원 중등부', tier: 'MIDDLE' },
  { id: 'hanshin_tracen_middle', name: '한신 트레센 학원', displayName: '한신 트레센 학원 중등부', tier: 'MIDDLE' },
  { id: 'kasamatsu_tracen_middle', name: '카사마츠 트레센 학원', displayName: '카사마츠 트레센 학원 중등부', tier: 'LOWER' },
  { id: 'kochi_tracen_middle', name: '고치 트레센 학원', displayName: '고치 트레센 학원 중등부', tier: 'LOWER' },
]

export function getMiddleSchoolById(schoolId) {
  return MIDDLE_SCHOOLS.find(({ id }) => id === schoolId) ?? null
}
