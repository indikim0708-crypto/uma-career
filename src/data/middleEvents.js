const result = (type, weight, spec = {}) => ({
  type,
  weight,
  text: spec.text ?? (type === 'GREAT_SUCCESS' ? '훈련이 기대 이상의 성과로 이어졌다!' : type === 'SUCCESS' ? '의도한 훈련 성과를 얻었다.' : '뜻대로 풀리지는 않았지만 경험을 얻었다.'),
  statChanges: spec.stats ?? {},
  conditionDelta: spec.condition ?? 0,
  effects: spec.effects ?? [],
})

const choice = (id, text, weights, great = {}, success = {}, failure = {}) => ({
  id,
  text,
  outcomes: [
    result('GREAT_SUCCESS', weights[0], great),
    result('SUCCESS', weights[1], success),
    result('FAILURE', weights[2], failure),
  ],
})

const event = (id, category, name, situation, choices) => ({ id, stage: 'MIDDLE', type: 'MIDDLE_COMMON', category, name, situation, choices })
const s = (stats = {}, condition = 0, effects = []) => ({ stats, condition, effects })
const main = (amount) => ({ kind: 'GROWTH_MAIN', amount })
const support = (amount) => ({ kind: 'GROWTH_SUPPORT', amount })
const lowest = (amount) => ({ kind: 'LOWEST', amount })
const random = (amount, exclude = []) => ({ kind: 'RANDOM', amount, exclude })

export const MIDDLE_COMMON_EVENTS = [
  event('middle_pair_senior', 'PAIR_TRAINING', '선배와의 첫 병주', '중등부에 올라온 뒤 처음으로 상급생과 병주한다.', [
    choice('a', '끝까지 따라붙는다', [25, 55, 20], s({ speed: 6, power: 3 }), s({ speed: 4, power: 2 }), s({}, -1)),
    choice('b', '페이스를 배운다', [15, 75, 10], s({ intelligence: 5, stamina: 3 }), s({ intelligence: 3, stamina: 2 })),
    choice('c', '마지막에 승부한다', [30, 45, 25], s({ power: 6, grit: 4 }), s({ power: 4, grit: 2 }), s({ stamina: -1 })),
  ]),
  event('middle_classmate_challenge', 'PAIR_TRAINING', '동급생의 도전장', '동급생이 정식으로 병주 승부를 신청했다.', [
    choice('a', '정면으로 받아준다', [25, 55, 20], s({ speed: 5, power: 4 }), s({ speed: 3, power: 3 }), s({ power: -1 })),
    choice('b', '상대의 달리기를 관찰한다', [15, 75, 10], s({ intelligence: 5, speed: 3 }), s({ intelligence: 3, speed: 2 })),
    choice('c', '절대 지지 않는다', [30, 45, 25], s({ grit: 7, speed: 3 }), s({ grit: 4, speed: 2 }), s({}, -1)),
  ]),
  event('middle_hill_pair', 'PAIR_TRAINING', '언덕 병주', '가파른 언덕 코스에서 라이벌과 나란히 달린다.', [
    choice('a', '먼저 치고 나간다', [25, 50, 25], s({ speed: 5, power: 5 }), s({ speed: 3, power: 3 }), s({ stamina: -1 })),
    choice('b', '상대 뒤에서 버틴다', [20, 65, 15], s({ stamina: 6, grit: 4 }), s({ stamina: 4, grit: 2 }), s({}, -1)),
    choice('c', '언덕 끝에서 추월한다', [25, 60, 15], s({ power: 6, intelligence: 3 }), s({ power: 4, intelligence: 2 }), s({ power: -1 })),
  ]),
  event('middle_1000_pair', 'PAIR_TRAINING', '1000m 전력 병주', '짧고 강한 1000m 전력 병주가 시작됐다.', [
    choice('a', '처음부터 전력으로', [30, 45, 25], s({ speed: 7, power: 3 }), s({ speed: 5, power: 2 }), s({ stamina: -2 })),
    choice('b', '속도를 서서히 올린다', [20, 65, 15], s({ speed: 5, intelligence: 3 }), s({ speed: 3, intelligence: 2 })),
    choice('c', '후반에 폭발한다', [25, 55, 20], s({ power: 6, grit: 4 }), s({ power: 4, grit: 2 }), s({}, -1)),
  ]),
  event('middle_2000_pair', 'PAIR_TRAINING', '2000m 페이스 병주', '2000m 코스에서 페이스 운영을 시험한다.', [
    choice('a', '선두에서 페이스를 만든다', [20, 60, 20], s({ speed: 5, stamina: 5 }), s({ speed: 3, stamina: 3 }), s({}, -1)),
    choice('b', '상대 페이스에 맞춘다', [15, 75, 10], s({ stamina: 5, intelligence: 4 }), s({ stamina: 3, intelligence: 3 })),
    choice('c', '후반부터 압박한다', [25, 55, 20], s({ power: 6, grit: 4 }), s({ power: 4, grit: 2 }), s({ stamina: -1 })),
  ]),
  event('middle_pressure_behind', 'PAIR_TRAINING', '등 뒤의 압박감', '바로 뒤에서 들리는 발소리가 점점 가까워진다.', [
    choice('a', '더 속도를 높인다', [25, 55, 20], s({ speed: 6, grit: 3 }), s({ speed: 4, grit: 2 }), s({}, -1)),
    choice('b', '호흡을 유지한다', [15, 75, 10], s({ stamina: 5, intelligence: 4 }), s({ stamina: 3, intelligence: 3 })),
    choice('c', '한번 보내준 뒤 다시 쫓는다', [25, 55, 20], s({ power: 5, grit: 5 }), s({ power: 3, grit: 3 }), s({ stamina: -1 })),
  ]),
  event('middle_overtake', 'PAIR_TRAINING', '추월 연습', '코너와 직선에서 여러 추월 경로를 시험한다.', [
    choice('a', '안쪽 빈틈을 찌른다', [20, 65, 15], s({ intelligence: 5, speed: 4 }), s({ intelligence: 3, speed: 3 }), s({ intelligence: -1 })),
    choice('b', '바깥으로 크게 돈다', [25, 55, 20], s({ power: 6, speed: 3 }), s({ power: 4, speed: 2 }), s({ stamina: -1 })),
    choice('c', '빈틈이 생길 때까지 기다린다', [15, 80, 5], s({ intelligence: 7, speed: 2 }), s({ intelligence: 5, speed: 1 })),
  ]),
  event('middle_rain_pair', 'PAIR_TRAINING', '비 오는 날의 병주', '빗물로 미끄러운 코스에서도 병주는 계속된다.', [
    choice('a', '평소처럼 달린다', [30, 40, 30], s({ speed: 6, grit: 5 }), s({ speed: 4, grit: 3 }), s({}, -1)),
    choice('b', '보폭을 줄이고 안정적으로', [15, 75, 10], s({ intelligence: 5, stamina: 4 }), s({ intelligence: 3, stamina: 3 })),
    choice('c', '미끄러운 노면을 익힌다', [20, 65, 15], s({ power: 5, intelligence: 4 }), s({ power: 3, intelligence: 3 }), s({ power: -1 })),
  ]),
  event('middle_first_practice_race', 'PRACTICE_RACE', '첫 교내 연습 레이스', '중등부 첫 교내 연습 레이스의 출발선에 섰다.', [
    choice('a', '처음부터 선두로', [25, 55, 20], s({ speed: 6, grit: 4 }), s({ speed: 4, grit: 2 }), s({ stamina: -1 })),
    choice('b', '중단에서 흐름을 본다', [15, 75, 10], s({ intelligence: 5, power: 4 }), s({ intelligence: 3, power: 3 })),
    choice('c', '후방에서 마지막 승부', [30, 40, 30], s({ power: 7, grit: 5 }), s({ power: 4, grit: 3 }), s({}, -1)),
  ]),
  event('middle_1200_mock', 'PRACTICE_RACE', '1200m 스프린트 모의전', '순간 가속이 중요한 1200m 모의전에 나선다.', [
    choice('a', '스타트로 승부한다', [30, 50, 20], s({ speed: 7, power: 3 }), s({ speed: 5, power: 2 }), s({ stamina: -1 })),
    choice('b', '직선에서 가속한다', [25, 55, 20], s({ power: 7, speed: 3 }), s({ power: 5, speed: 2 }), s({}, -1)),
    choice('c', '상대의 움직임을 읽는다', [15, 75, 10], s({ intelligence: 5, speed: 4 }), s({ intelligence: 3, speed: 3 })),
  ]),
  event('middle_1600_mock', 'PRACTICE_RACE', '1600m 마일 모의전', '빠른 흐름 속에서 위치 선정과 가속을 시험한다.', [
    choice('a', '빠른 페이스를 만든다', [25, 55, 20], s({ speed: 6, power: 4 }), s({ speed: 4, power: 2 }), s({ stamina: -1 })),
    choice('b', '좋은 위치를 선점한다', [15, 75, 10], s({ intelligence: 6, speed: 3 }), s({ intelligence: 4, speed: 2 })),
    choice('c', '막판 가속에 건다', [25, 55, 20], s({ power: 6, grit: 4 }), s({ power: 4, grit: 2 }), s({}, -1)),
  ]),
  event('middle_2000_race', 'PRACTICE_RACE', '2000m 연습 레이스', '균형 잡힌 능력이 필요한 2000m 레이스다.', [
    choice('a', '앞에서 레이스를 끌고 간다', [20, 60, 20], s({ speed: 5, stamina: 5 }), s({ speed: 3, stamina: 3 }), s({ stamina: -1 })),
    choice('b', '균형 있게 달린다', [15, 75, 10], s({}, 0, [{ kind: 'RANDOM_DISTINCT', amount: 3, count: 3 }]), s({}, 0, [{ kind: 'RANDOM_DISTINCT', amount: 2, count: 3 }]), s({}, 0, [random(1)])),
    choice('c', '마지막 직선 승부', [25, 55, 20], s({ power: 6, grit: 4 }), s({ power: 4, grit: 2 }), s({}, -1)),
  ]),
  event('middle_2400_mock', 'PRACTICE_RACE', '2400m 장거리 모의전', '긴 거리에서 페이스와 인내심을 검증한다.', [
    choice('a', '일정한 페이스를 유지한다', [15, 75, 10], s({ stamina: 8, intelligence: 2 }), s({ stamina: 6, intelligence: 1 })),
    choice('b', '중반부터 움직인다', [20, 60, 20], s({ stamina: 5, power: 5 }), s({ stamina: 3, power: 3 }), s({ stamina: -1 })),
    choice('c', '마지막까지 참는다', [25, 50, 25], s({ stamina: 6, grit: 5 }), s({ stamina: 4, grit: 3 }), s({}, -1)),
  ]),
  event('middle_outer_start', 'PRACTICE_RACE', '불리한 바깥쪽 출발', '바깥쪽 출발 위치에서 불리한 전개를 맞았다.', [
    choice('a', '바로 안쪽으로 들어간다', [30, 40, 30], s({ speed: 6, power: 5 }), s({ speed: 4, power: 3 }), s({ stamina: -2 })),
    choice('b', '천천히 자리를 찾는다', [15, 80, 5], s({ intelligence: 7, speed: 2 }), s({ intelligence: 5, speed: 1 })),
    choice('c', '바깥에서 그대로 달린다', [20, 65, 15], s({ stamina: 5, grit: 4 }), s({ stamina: 3, grit: 3 }), s({}, -1)),
  ]),
  event('middle_late_start', 'PRACTICE_RACE', '출발이 늦었다!', '출발 타이밍을 놓쳐 선두와 거리가 벌어졌다.', [
    choice('a', '즉시 따라간다', [30, 45, 25], s({ speed: 8, power: 2 }), s({ speed: 5, power: 2 }), s({ stamina: -2 })),
    choice('b', '당황하지 않는다', [15, 80, 5], s({ intelligence: 6, stamina: 3 }), s({ intelligence: 4, stamina: 2 })),
    choice('c', '마지막에 한 번에 따라잡는다', [25, 50, 25], s({ power: 6, grit: 5 }), s({ power: 4, grit: 3 }), s({}, -1)),
  ]),
  event('middle_favorite_duel', 'PRACTICE_RACE', '우승후보와 맞대결', '주목받는 우승후보와 같은 조에서 맞붙는다.', [
    choice('a', '정면으로 이긴다', [30, 40, 30], s({ speed: 6, power: 5 }), s({ speed: 4, power: 3 }), s({}, -1)),
    choice('b', '상대의 약점을 찾는다', [15, 75, 10], s({ intelligence: 6, power: 3 }), s({ intelligence: 4, power: 2 })),
    choice('c', '끝까지 물고 늘어진다', [25, 55, 20], s({ grit: 7, stamina: 3 }), s({ grit: 5, stamina: 2 }), s({ stamina: -1 })),
  ]),
  event('middle_start_dash', 'TRAINING', '스타트 대시 반복훈련', '출발 반응과 첫걸음을 반복해서 다듬는다.', [
    choice('a', '반응속도에 집중한다', [20, 65, 15], s({ speed: 6, intelligence: 3 }), s({ speed: 4, intelligence: 2 })),
    choice('b', '폭발적인 첫걸음', [25, 55, 20], s({ speed: 5, power: 5 }), s({ speed: 3, power: 3 }), s({ stamina: -1 })),
    choice('c', '훈련 횟수를 늘린다', [30, 40, 30], s({ speed: 6, grit: 5 }), s({ speed: 4, grit: 3 }), s({}, -1)),
  ]),
  event('middle_cornering', 'TRAINING', '코너링 집중훈련', '속도를 잃지 않는 코너 진입과 탈출을 연습한다.', [
    choice('a', '안쪽 라인을 익힌다', [15, 75, 10], s({ intelligence: 6, speed: 3 }), s({ intelligence: 4, speed: 2 })),
    choice('b', '속도를 유지하며 돈다', [20, 65, 15], s({ speed: 5, power: 4 }), s({ speed: 3, power: 3 }), s({ stamina: -1 })),
    choice('c', '안정적인 자세에 집중', [15, 80, 5], s({ intelligence: 5, power: 4 }), s({ intelligence: 3, power: 3 })),
  ]),
  event('middle_steep_hill', 'TRAINING', '가파른 언덕 질주', '숨이 턱 막히는 경사의 언덕 코스를 달린다.', [
    choice('a', '전력으로 오른다', [30, 45, 25], s({ power: 8, grit: 2 }), s({ power: 5, grit: 2 }), s({}, -1)),
    choice('b', '일정한 속도를 유지한다', [20, 65, 15], s({ stamina: 5, power: 4 }), s({ stamina: 3, power: 3 })),
    choice('c', '몇 번이고 반복한다', [25, 50, 25], s({ grit: 6, power: 5 }), s({ grit: 4, power: 3 }), s({}, -1)),
  ]),
  event('middle_endurance_run', 'TRAINING', '장거리 지속주', '긴 시간 동안 일정한 속도로 달리는 훈련이다.', [
    choice('a', '끝까지 같은 페이스', [15, 75, 10], s({ stamina: 8, intelligence: 2 }), s({ stamina: 6, intelligence: 1 })),
    choice('b', '마지막에 속도를 올린다', [20, 65, 15], s({ stamina: 5, speed: 4 }), s({ stamina: 3, speed: 3 }), s({ stamina: -1 })),
    choice('c', '힘들어도 계속 달린다', [25, 55, 20], s({ stamina: 5, grit: 5 }), s({ stamina: 3, grit: 3 }), s({}, -1)),
  ]),
  event('middle_strength_circuit', 'TRAINING', '근력 서킷', '여러 근력 훈련을 쉬지 않고 이어간다.', [
    choice('a', '하체 중심', [20, 65, 15], s({ power: 7, grit: 2 }), s({ power: 5, grit: 1 })),
    choice('b', '코어 중심', [20, 65, 15], s({ power: 5, grit: 4 }), s({ power: 3, grit: 3 })),
    choice('c', '전체 균형', [15, 75, 10], s({ power: 4, stamina: 3, grit: 3 }), s({ power: 3, stamina: 2, grit: 2 })),
  ]),
  event('middle_video_analysis', 'TRAINING', '레이스 영상 분석', '훈련실에서 여러 레이스 영상을 분석한다.', [
    choice('a', '자신의 주행을 본다', [15, 80, 5], s({ intelligence: 7, speed: 2 }), s({ intelligence: 5, speed: 1 })),
    choice('b', '강자의 주행을 본다', [15, 75, 10], s({ intelligence: 6, power: 3 }), s({ intelligence: 4, power: 2 })),
    choice('c', '패배 장면만 반복해서 본다', [20, 65, 15], s({ intelligence: 5, grit: 4 }), s({ intelligence: 3, grit: 3 }), s({}, -1)),
  ]),
  event('middle_rival_declaration', 'SCHOOL_LIFE', '라이벌 선언', '한 동급생이 앞으로 계속 경쟁하자고 선언했다.', [
    choice('a', '좋아, 승부야!', [25, 55, 20], s({ speed: 5, grit: 5 }), s({ speed: 3, grit: 3 }), s({}, -1)),
    choice('b', '결과로 보여주겠다', [20, 65, 15], s({ power: 5, intelligence: 4 }), s({ power: 3, intelligence: 3 })),
    choice('c', '같이 강해지자', [15, 75, 10], s({ speed: 3, grit: 4 }, 1), s({ grit: 3, intelligence: 2 })),
  ]),
  event('middle_team_leader', 'SCHOOL_LIFE', '팀 훈련의 리더', '오늘 팀 훈련을 이끌 역할을 맡았다.', [
    choice('a', '직접 앞에서 이끈다', [20, 65, 15], s({ grit: 5, intelligence: 4 }), s({ grit: 3, intelligence: 3 })),
    choice('b', '가장 힘든 훈련을 맡는다', [25, 55, 20], s({ power: 5, grit: 5 }), s({ power: 3, grit: 3 }), s({}, -1)),
    choice('c', '모두의 상태를 살핀다', [15, 75, 10], s({ intelligence: 6 }, 1), s({ intelligence: 4 })),
  ]),
  event('middle_exam_training', 'SCHOOL_LIFE', '시험기간과 훈련', '시험 준비와 훈련 일정이 겹쳤다.', [
    choice('a', '공부에 집중한다', [15, 80, 5], s({ intelligence: 8, stamina: 1 }), s({ intelligence: 6 })),
    choice('b', '훈련을 우선한다', [30, 45, 25], s({ grit: 2 }, 0, [main(8)]), s({}, 0, [main(6)]), s({}, -1)),
    choice('c', '둘 다 해낸다', [15, 75, 10], s({ intelligence: 4 }, 0, [random(5, ['intelligence'])]), s({ intelligence: 3 }, 0, [random(3, ['intelligence'])]), s({ intelligence: 1 })),
  ]),
  event('middle_cheering_voice', 'SCHOOL_LIFE', '응원석에서 들려온 목소리', '연습 중 익숙한 응원 목소리가 들려왔다.', [
    choice('a', '응원에서 힘을 얻는다', [15, 75, 10], s({ grit: 5 }, 1), s({ grit: 4 })),
    choice('b', '더 좋은 모습을 보여주고 싶다', [25, 55, 20], s({ speed: 5, grit: 4 }), s({ speed: 3, grit: 3 }), s({}, -1)),
    choice('c', '침착함을 유지한다', [15, 80, 5], s({ intelligence: 5 }, 1), s({ intelligence: 4 })),
  ]),
  event('middle_career_talk', 'SCHOOL_LIFE', '코치와의 진로 상담', '코치가 앞으로 어떤 능력을 키울지 물었다.', [
    choice('a', '장점을 더 키운다', [20, 70, 10], s({}, 0, [main(8), support(3)]), s({}, 0, [main(6), support(2)]), s({}, 0, [main(2)])),
    choice('b', '약점을 보완한다', [20, 70, 10], s({ intelligence: 2 }, 0, [lowest(8)]), s({}, 0, [lowest(6)]), s({}, 0, [lowest(2)])),
    choice('c', '전체적으로 다듬는다', [10, 80, 10], s({ speed: 2, stamina: 2, power: 2, grit: 2, intelligence: 2 }), s({ speed: 1, stamina: 1, power: 1, grit: 1, intelligence: 1 }), s({}, 0, [random(1)])),
  ]),
  event('middle_fatigue', 'CONDITION', '피로가 쌓였다', '연일 이어진 훈련으로 몸이 무겁다.', [
    choice('a', '완전히 쉰다', [15, 75, 10], s({ stamina: 2 }, 2), s({}, 1)),
    choice('b', '가볍게 몸만 푼다', [15, 75, 10], s({ stamina: 3, intelligence: 3 }, 1), s({ stamina: 2, intelligence: 2 })),
    choice('c', '계획대로 강행한다', [30, 40, 30], s({ grit: 3 }, 0, [main(8)]), s({}, -1, [main(5)]), s({}, -1)),
  ]),
  event('middle_light_body', 'CONDITION', '몸이 가볍다!', '오늘은 평소보다 몸이 놀라울 정도로 가볍다.', [
    choice('a', '속도훈련을 한다', [25, 60, 15], s({ speed: 7 }, 1), s({ speed: 5 })),
    choice('b', '강도를 더 올린다', [25, 55, 20], s({ power: 5, stamina: 5 }), s({ power: 3, stamina: 3 }), s({}, -1)),
    choice('c', '좋은 감각을 기억한다', [15, 75, 10], s({ intelligence: 5, speed: 3 }, 1), s({ intelligence: 3, speed: 3 })),
  ]),
  event('middle_first_slump', 'CONDITION', '첫 슬럼프', '아무리 달려도 기대한 기록이 나오지 않는다.', [
    choice('a', '원인을 분석한다', [15, 75, 10], s({ intelligence: 6 }, 1), s({ intelligence: 4 })),
    choice('b', '계속 달린다', [30, 40, 30], s({ grit: 8, power: 2 }), s({ grit: 5 }), s({}, -1)),
    choice('c', '며칠 쉬어간다', [20, 70, 10], s({ stamina: 2 }, 2), s({ stamina: 1 }, 1)),
  ]),
  event('middle_sleepless', 'CONDITION', '잠을 설친 날', '잠을 제대로 자지 못해 집중하기 어렵다.', [
    choice('a', '휴식한다', [20, 70, 10], s({}, 2), s({}, 1)),
    choice('b', '가벼운 조정만 한다', [15, 80, 5], s({ intelligence: 4, stamina: 3 }), s({ intelligence: 3, stamina: 2 })),
    choice('c', '그래도 병주한다', [30, 40, 30], s({ speed: 5, power: 5 }), s({ speed: 3, power: 3 }), s({}, -1)),
  ]),
  event('middle_overtraining', 'CONDITION', '과훈련 경고', '코치가 지금은 훈련 강도를 조절해야 한다고 경고했다.', [
    choice('a', '코치의 말을 듣는다', [20, 70, 10], s({ intelligence: 3 }, 2), s({ intelligence: 2 }, 1)),
    choice('b', '강도를 조금만 낮춘다', [15, 75, 10], s({ stamina: 4, grit: 4 }), s({ stamina: 3, grit: 3 })),
    choice('c', '지금 멈출 수 없다', [30, 40, 30], s({ grit: 3 }, 0, [main(9)]), s({}, 0, [main(6)]), s({}, -2)),
  ]),
]
