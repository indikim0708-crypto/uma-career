export const SCHOOL_TIERS = { GENERAL: 1, ELITE: 2, TOP: 3, CENTRAL_TRACEN: 4 }

export const ELEMENTARY_SCHOOLS = {
  fuchu: [
    { id: 'fuchu_central', name: '후추 중앙 초등학교', tier: SCHOOL_TIERS.GENERAL, rank: '일반학교', tendency: '균형형' },
    { id: 'sakura', name: '사쿠라 초등학교', tier: SCHOOL_TIERS.ELITE, rank: '명문', tendency: '스피드 · 지능 성향' },
  ],
  hidaka: [
    { id: 'mejiro', name: '메지로 초등학교', tier: SCHOOL_TIERS.TOP, rank: '전국구 명문', tendency: '전통 교육 · 스태미나 · 근성 성향' },
    { id: 'shadai', name: '샤다이 초등학교', tier: SCHOOL_TIERS.TOP, rank: '전국구 최상위 명문', tendency: '과학적 종합 육성 · 전체 성장' },
  ],
  kasamatsu: [
    { id: 'kasamatsu_central', name: '카사마츠 중앙 초등학교', tier: SCHOOL_TIERS.GENERAL, rank: '일반학교', tendency: '근성 성향' },
    { id: 'cap', name: '캡 초등학교', tier: SCHOOL_TIERS.ELITE, rank: '지역 최상위 명문', tendency: '실전형 · 파워 · 승부욕 성향' },
  ],
  funabashi: [
    { id: 'funabashi_uma', name: '후나바시 우마 초등학교', tier: SCHOOL_TIERS.GENERAL, rank: '일반학교', tendency: '스피드 · 파워 성향' },
    { id: 'symboli', name: '심볼리 초등학교', tier: SCHOOL_TIERS.ELITE, rank: '수도권 명문', tendency: '균형형 · 지능 성향' },
  ],
  morioka: [
    { id: 'morioka_north', name: '모리오카 북부 초등학교', tier: SCHOOL_TIERS.GENERAL, rank: '일반학교', tendency: '스태미나 성향' },
    { id: 'tokai', name: '토카이 초등학교', tier: SCHOOL_TIERS.ELITE, rank: '명문', tendency: '스태미나 · 근성 성향' },
  ],
  nagoya: [
    { id: 'nagoya_central', name: '나고야 중앙 초등학교', tier: SCHOOL_TIERS.GENERAL, rank: '일반학교', tendency: '균형형' },
    { id: 'daiwa', name: '다이와 초등학교', tier: SCHOOL_TIERS.ELITE, rank: '명문', tendency: '스피드 · 파워 성향' },
  ],
  sonoda: [
    { id: 'sonoda_uma', name: '소노다 우마 초등학교', tier: SCHOOL_TIERS.GENERAL, rank: '일반학교', tendency: '파워 · 근성 성향' },
    { id: 'narita', name: '나리타 초등학교', tier: SCHOOL_TIERS.ELITE, rank: '명문', tendency: '스태미나 · 승부욕 성향' },
  ],
  kochi: [
    { id: 'kochi_south', name: '고치 남부 초등학교', tier: SCHOOL_TIERS.GENERAL, rank: '일반학교', tendency: '근성 · 대기만성 성향' },
    { id: 'agnes', name: '아그네스 초등학교', tier: SCHOOL_TIERS.ELITE, rank: '명문', tendency: '지능 · 성장성 성향' },
  ],
}

export const CENTRAL_TRACEN_SCHOOL = {
  id: 'central_tracen',
  name: '중앙 트레센 초등학교',
  tier: SCHOOL_TIERS.CENTRAL_TRACEN,
  rank: '전학 전용 최상위 학교',
  tendency: '최고 수준의 유망주 육성',
  transferOnly: true,
  initialAssignmentAllowed: false,
}

export const ALL_ELEMENTARY_SCHOOLS = [
  ...Object.values(ELEMENTARY_SCHOOLS).flat(),
  CENTRAL_TRACEN_SCHOOL,
]

export function getElementarySchoolById(schoolId) {
  return ALL_ELEMENTARY_SCHOOLS.find(({ id }) => id === schoolId) ?? null
}
