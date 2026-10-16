const result = (type, weight, text, [statChanges = {}, conditionDelta = 0, ...effects] = []) => ({ type, weight, text, statChanges, conditionDelta, effects })
const reward = (statChanges = {}, conditionDelta = 0, ...effects) => [statChanges, conditionDelta, ...effects]

const outcomeText = (choiceText, type) => {
  if (type === 'GREAT_SUCCESS') return `“${choiceText}” 선택이 기대 이상의 성과로 이어졌다!`
  if (type === 'SUCCESS') return `“${choiceText}” 방법으로 좋은 경험을 쌓았다.`
  return `“${choiceText}” 시도는 생각처럼 풀리지 않았다.`
}

const choice = (id, text, weights, great, success, failure, texts = []) => ({
  id,
  text,
  outcomes: [
    result('GREAT_SUCCESS', weights[0], texts[0] ?? outcomeText(text, 'GREAT_SUCCESS'), great),
    result('SUCCESS', weights[1], texts[1] ?? outcomeText(text, 'SUCCESS'), success),
    result('FAILURE', weights[2], texts[2] ?? outcomeText(text, 'FAILURE'), failure),
  ],
})

const event = (id, name, situation, minGrade, maxGrade, choices) => ({ id, name, situation, minGrade, maxGrade, type: 'COMMON', choices })
const growthMain = (amount) => ({ kind: 'GROWTH_MAIN', amount })
const lowest = (amount) => ({ kind: 'LOWEST', amount })
const random = (amount) => ({ kind: 'RANDOM', amount })
const randomDistinct = (amount, count) => ({ kind: 'RANDOM_DISTINCT', amount, count })

export const ELEMENTARY_COMMON_EVENTS = [
  event('common_relay', '운동회 계주 — 마지막 주자', '반 대표 계주의 마지막 주자를 맡게 되었다.', 1, 6, [
    choice('a', '처음부터 전력으로 치고 나간다!', [15, 65, 20], reward({ speed: 4, power: 2 }), reward({ speed: 3, power: 1 }), reward({ power: -1 }), ['완벽한 스타트! 단숨에 선두로 치고 나갔다!', '성공적인 출발로 앞쪽을 차지했다.', '출발에 지나치게 집중하다 타이밍을 놓쳤다.']),
    choice('b', '앞선 주자를 차분히 따라간다.', [15, 75, 10], reward({ intelligence: 4, speed: 2 }), reward({ intelligence: 3, speed: 1 }), reward()),
    choice('c', '마지막 직선에 모든 힘을 쏟는다.', [30, 40, 30], reward({ power: 4, grit: 4 }), reward({ power: 3, grit: 2 }), reward({ stamina: -1 })),
  ]),
  event('common_hill_race', '학교 뒤 언덕길 승부', '친구가 학교 뒤 언덕 꼭대기까지 누가 먼저 올라가는지 겨뤄보자고 한다.', 1, 6, [
    choice('a', '시작부터 전력질주한다.', [25, 55, 20], reward({ power: 4, speed: 3 }), reward({ power: 3, speed: 2 }), reward({ stamina: -1 })),
    choice('b', '일정한 속도로 올라간다.', [15, 75, 10], reward({ stamina: 4, intelligence: 2 }), reward({ stamina: 3, intelligence: 1 }), reward()),
    choice('c', '마지막 오르막에서 승부한다.', [30, 45, 25], reward({ power: 5, grit: 3 }), reward({ power: 3, grit: 2 }), reward({}, -1)),
  ]),
  event('common_long_run', '전교 오래달리기 대회', '전교생이 참가하는 오래달리기 대회가 열렸다.', 2, 6, [
    choice('a', '처음부터 앞쪽에서 달린다.', [20, 60, 20], reward({ speed: 3, stamina: 4 }), reward({ speed: 2, stamina: 3 }), reward({ stamina: -1 })),
    choice('b', '자기 페이스를 철저히 지킨다.', [15, 75, 10], reward({ stamina: 5, intelligence: 2 }), reward({ stamina: 4, intelligence: 1 }), reward()),
    choice('c', '힘들어도 절대 걷지 않는다.', [25, 55, 20], reward({ grit: 5, stamina: 3 }), reward({ grit: 3, stamina: 2 }), reward({}, -1)),
  ]),
  event('common_sprint', '100m 기록 측정', '선생님이 100m 달리기 기록을 측정한다.', 1, 6, [
    choice('a', '스타트에 모든 걸 건다.', [25, 55, 20], reward({ speed: 5, power: 2 }), reward({ speed: 3, power: 2 }), reward({ speed: -1 })),
    choice('b', '폼을 무너뜨리지 않고 달린다.', [15, 75, 10], reward({ speed: 4, intelligence: 3 }), reward({ speed: 3, intelligence: 2 }), reward()),
    choice('c', '마지막 30m에서 가속한다.', [25, 55, 20], reward({ power: 4, speed: 3 }), reward({ power: 3, speed: 2 }), reward({ stamina: -1 })),
  ]),
  event('common_commute', '아침 등굣길', '평소보다 늦게 집을 나왔다. 지각까지 시간이 얼마 남지 않았다.', 1, 6, [
    choice('a', '학교까지 달린다!', [25, 55, 20], reward({ speed: 4, stamina: 2 }), reward({ speed: 3, stamina: 1 }), reward({}, -1)),
    choice('b', '빠른 걸음으로 서두른다.', [10, 80, 10], reward({ stamina: 3, intelligence: 2 }), reward({ stamina: 2, intelligence: 1 }), reward()),
    choice('c', '지름길을 찾아본다.', [20, 65, 15], reward({ intelligence: 4, speed: 2 }), reward({ intelligence: 3, speed: 1 }), reward({ intelligence: -1 })),
  ]),
  event('common_rain', '비 오는 날의 운동장', '비가 내려 운동장이 미끄럽다. 오늘 훈련 방법을 정해야 한다.', 1, 6, [
    choice('a', '비가 와도 달린다.', [30, 40, 30], reward({ grit: 4, speed: 4 }), reward({ grit: 3, speed: 2 }), reward({}, -1)),
    choice('b', '조심스럽게 노면을 익힌다.', [15, 75, 10], reward({ intelligence: 4, power: 3 }), reward({ intelligence: 3, power: 2 }), reward()),
    choice('c', '실내에서 기초훈련을 한다.', [10, 80, 10], reward({ power: 3, stamina: 3 }), reward({ power: 2, stamina: 2 }), reward()),
  ]),
  event('common_extra_training', '방과 후 추가훈련', '수업이 끝난 뒤 운동장에 남아 부족한 부분을 더 연습하기로 했다.', 2, 6, [
    choice('a', '짧은 거리 전력질주를 반복한다.', [25, 55, 20], reward({ speed: 5, power: 2 }), reward({ speed: 3, power: 2 }), reward({}, -1)),
    choice('b', '긴 거리를 천천히 달린다.', [15, 75, 10], reward({ stamina: 5, grit: 2 }), reward({ stamina: 3, grit: 2 }), reward()),
    choice('c', '자신의 달리는 모습을 점검한다.', [15, 75, 10], reward({ intelligence: 5, speed: 2 }), reward({ intelligence: 3, speed: 2 }), reward()),
  ]),
  event('common_friend_race', '친구와의 즉석 레이스', '친구가 운동장 한 바퀴 즉석 레이스를 제안했다.', 1, 6, [
    choice('a', '절대 질 수 없다!', [30, 45, 25], reward({ speed: 4, grit: 4 }), reward({ speed: 3, grit: 2 }), reward({}, -1)),
    choice('b', '상대의 움직임을 보고 달린다.', [15, 75, 10], reward({ intelligence: 4, speed: 3 }), reward({ intelligence: 3, speed: 2 }), reward()),
    choice('c', '웃으면서 즐긴다.', [20, 70, 10], reward({ grit: 3 }, 1), reward({ grit: 2 }), reward()),
  ]),
  event('common_fitness_test', '체력장', '학교 체력장에서 여러 종목의 기록을 측정한다.', 2, 6, [
    choice('a', '달리기 종목에 집중한다.', [20, 65, 15], reward({ speed: 4, stamina: 3 }), reward({ speed: 3, stamina: 2 }), reward()),
    choice('b', '근력 종목에 집중한다.', [20, 65, 15], reward({ power: 4, grit: 3 }), reward({ power: 3, grit: 2 }), reward()),
    choice('c', '모든 종목을 고르게 해낸다.', [10, 80, 10], reward({ speed: 2, stamina: 2, power: 2, grit: 2, intelligence: 2 }), reward({}, 0, randomDistinct(1, 3)), reward()),
  ]),
  event('common_shoes', '운동화 선택', '새 운동화를 고를 기회가 생겼다.', 1, 6, [
    choice('a', '가장 가벼운 신발을 고른다.', [20, 65, 15], reward({ speed: 5, power: 1 }), reward({ speed: 3, power: 1 }), reward({ stamina: -1 })),
    choice('b', '발에 가장 편한 신발을 고른다.', [15, 75, 10], reward({ stamina: 4 }, 1), reward({ stamina: 3 }), reward()),
    choice('c', '직접 여러 켤레를 비교한다.', [15, 75, 10], reward({ intelligence: 4, speed: 2 }), reward({ intelligence: 3, speed: 1 }), reward()),
  ]),
  event('common_assignment', '선생님의 특별 과제', '선생님이 지금의 성장에 도움이 될 특별 훈련 과제를 내주었다.', 2, 6, [
    choice('a', '정해진 양보다 더 많이 한다.', [30, 40, 30], reward({ grit: 2 }, 0, growthMain(6)), reward({ grit: 1 }, 0, growthMain(4)), reward({}, -1)),
    choice('b', '정확하게 계획대로 수행한다.', [15, 75, 10], reward({ intelligence: 4 }, 0, growthMain(3)), reward({ intelligence: 3 }, 0, growthMain(2)), reward()),
    choice('c', '어려운 부분만 집중한다.', [20, 70, 10], reward({ intelligence: 2 }, 0, lowest(5)), reward({ intelligence: 1 }, 0, lowest(3)), reward()),
  ]),
  event('common_festival', '학교 축제 달리기 행사', '학교 축제에서 모두가 즐길 수 있는 달리기 행사가 열렸다.', 1, 6, [
    choice('a', '진지하게 우승을 노린다.', [25, 55, 20], reward({ speed: 4, power: 3 }), reward({ speed: 3, power: 2 }), reward({}, -1)),
    choice('b', '관객에게 멋진 모습을 보여준다.', [20, 65, 15], reward({ grit: 4, speed: 3 }, 1), reward({ grit: 3, speed: 2 }), reward()),
    choice('c', '친구들과 축제를 즐긴다.', [10, 80, 10], reward({ intelligence: 3 }, 1), reward({ intelligence: 2 }), reward()),
  ]),
  event('common_riverside', '하굣길 강변 코스', '하굣길에 강변을 따라 이어진 긴 달리기 코스가 눈에 들어왔다.', 2, 6, [
    choice('a', '끝까지 달려본다.', [20, 60, 20], reward({ stamina: 5, speed: 2 }), reward({ stamina: 3, speed: 2 }), reward({}, -1)),
    choice('b', '일정한 리듬으로 달린다.', [15, 75, 10], reward({ stamina: 4, intelligence: 3 }), reward({ stamina: 3, intelligence: 2 }), reward()),
    choice('c', '중간중간 전력질주한다.', [25, 55, 20], reward({ speed: 4, power: 3 }), reward({ speed: 3, power: 2 }), reward({ stamina: -1 })),
  ]),
  event('common_slump', '첫 번째 슬럼프', '전처럼 기록이 나오지 않는다. 첫 슬럼프를 어떻게 넘길지 고민한다.', 3, 6, [
    choice('a', '더 열심히 훈련한다.', [30, 40, 30], reward({ grit: 3 }, 0, growthMain(6)), reward({ grit: 2 }, 0, growthMain(4)), reward({}, -1)),
    choice('b', '원인을 천천히 분석한다.', [15, 75, 10], reward({ intelligence: 5 }, 0, lowest(3)), reward({ intelligence: 3 }, 0, lowest(2)), reward()),
    choice('c', '며칠 쉬어간다.', [20, 70, 10], reward({}, 2), reward({}, 1), reward()),
  ]),
  event('common_transfer_student', '전학생과의 만남', '달리기에 자신 있어 보이는 전학생이 찾아왔다.', 1, 6, [
    choice('a', '먼저 달리기 승부를 신청한다.', [25, 55, 20], reward({ speed: 4, power: 3 }), reward({ speed: 3, power: 2 }), reward({ grit: -1 })),
    choice('b', '친구가 되어 함께 훈련한다.', [15, 75, 10], reward({ stamina: 3, intelligence: 3 }, 1), reward({ stamina: 2, intelligence: 2 }), reward()),
    choice('c', '상대의 달리기를 관찰한다.', [15, 80, 5], reward({ intelligence: 5, speed: 2 }), reward({ intelligence: 3, speed: 1 }), reward()),
  ]),
  event('elem_summer_training', '여름방학 특별훈련', '긴 여름방학. 평소보다 많은 시간을 훈련에 쓸 수 있다.', 2, 6, [
    choice('a', '아침마다 달린다.', [20, 65, 15], reward({ stamina: 5, speed: 2 }), reward({ stamina: 3, speed: 2 }), reward({}, -1)),
    choice('b', '짧고 강하게 훈련한다.', [25, 55, 20], reward({ speed: 4, power: 4 }), reward({ speed: 3, power: 2 }), reward({ stamina: -1 })),
    choice('c', '계획표를 만들어 꾸준히 한다.', [15, 75, 10], reward({ intelligence: 4, stamina: 3 }), reward({ intelligence: 3, stamina: 2 }), reward()),
  ]),
  event('elem_snow_day', '눈 오는 날', '운동장에 하얀 눈이 쌓였다. 평소와 다른 훈련을 해볼 수 있을 것 같다.', 1, 6, [
    choice('a', '눈밭을 달린다.', [25, 50, 25], reward({ power: 5, grit: 3 }), reward({ power: 3, grit: 2 }), reward({}, -1)),
    choice('b', '눈을 치우며 몸을 움직인다.', [15, 75, 10], reward({ power: 3, stamina: 3 }), reward({ power: 2, stamina: 2 }), reward()),
    choice('c', '실내에서 자세를 연습한다.', [15, 80, 5], reward({ intelligence: 4, speed: 2 }), reward({ intelligence: 3, speed: 1 }), reward()),
  ]),
  event('elem_school_representative', '학교 대표 선발전', '지역 대회에 나갈 학교 대표를 뽑는 선발전이 시작됐다.', 4, 6, [
    choice('a', '기록으로 압도한다.', [25, 55, 20], reward({ speed: 5, power: 3 }), reward({ speed: 3, power: 2 }), reward({}, -1)),
    choice('b', '안정적인 달리기를 보여준다.', [15, 75, 10], reward({ stamina: 4, intelligence: 3 }), reward({ stamina: 3, intelligence: 2 }), reward()),
    choice('c', '마지막까지 포기하지 않는다.', [25, 55, 20], reward({ grit: 5, power: 3 }), reward({ grit: 3, power: 2 }), reward({ grit: -1 })),
  ]),
  event('elem_stair_training', '끝없는 계단', '학교 뒤편의 긴 계단이 오늘따라 끝없이 높아 보인다.', 2, 6, [
    choice('a', '한 번에 뛰어오른다.', [30, 40, 30], reward({ power: 5, speed: 3 }), reward({ power: 3, speed: 2 }), reward({}, -1)),
    choice('b', '여러 번 천천히 왕복한다.', [15, 75, 10], reward({ stamina: 5, grit: 2 }), reward({ stamina: 3, grit: 2 }), reward()),
    choice('c', '두 칸씩 밟아 오른다.', [25, 55, 20], reward({ power: 5, grit: 3 }), reward({ power: 3, grit: 2 }), reward({ stamina: -1 })),
  ]),
  event('elem_sand_run', '모래밭 달리기', '푹푹 빠지는 모래밭에서 달리기 훈련을 하게 됐다.', 2, 6, [
    choice('a', '전력으로 밀어붙인다.', [30, 40, 30], reward({ power: 6, grit: 2 }), reward({ power: 4, grit: 1 }), reward({}, -1)),
    choice('b', '자세를 무너뜨리지 않는다.', [15, 75, 10], reward({ power: 4, intelligence: 3 }), reward({ power: 3, intelligence: 2 }), reward()),
    choice('c', '긴 거리를 왕복한다.', [20, 60, 20], reward({ stamina: 4, power: 3 }), reward({ stamina: 3, power: 2 }), reward({ stamina: -1 })),
  ]),
  event('elem_jump_rope', '줄넘기 기록 도전', '체육 시간에 줄넘기 기록에 도전하게 됐다.', 1, 4, [
    choice('a', '빠르게 뛴다.', [20, 65, 15], reward({ speed: 3, power: 3 }), reward({ speed: 2, power: 2 }), reward()),
    choice('b', '오래 버틴다.', [15, 75, 10], reward({ stamina: 4, grit: 2 }), reward({ stamina: 3, grit: 1 }), reward()),
    choice('c', '어려운 기술을 시도한다.', [30, 40, 30], reward({ intelligence: 3, power: 4 }), reward({ intelligence: 2, power: 3 }), reward({ power: -1 })),
  ]),
  event('elem_baton_practice', '바통 터치 연습', '계주를 앞두고 친구와 바통을 주고받는 연습을 시작했다.', 2, 6, [
    choice('a', '속도를 줄이지 않고 넘긴다.', [25, 55, 20], reward({ speed: 4, intelligence: 3 }), reward({ speed: 3, intelligence: 2 }), reward({ speed: -1 })),
    choice('b', '정확성을 우선한다.', [10, 85, 5], reward({ intelligence: 5, speed: 1 }), reward({ intelligence: 3, speed: 1 }), reward()),
    choice('c', '둘만의 타이밍을 만든다.', [20, 70, 10], reward({ intelligence: 4, grit: 3 }), reward({ intelligence: 3, grit: 2 }), reward()),
  ]),
  event('elem_big_lunch', '오늘 급식은 특식', '오늘 급식에는 좋아하는 메뉴와 특별한 디저트까지 나왔다.', 1, 6, [
    choice('a', '배부르게 먹는다.', [20, 70, 10], reward({ stamina: 3 }, 1), reward({}, 1), reward()),
    choice('b', '적당히 먹는다.', [10, 85, 5], reward({ intelligence: 3, stamina: 2 }), reward({ intelligence: 2, stamina: 1 }), reward()),
    choice('c', '디저트까지 전부 먹는다.', [30, 40, 30], reward({ power: 3 }, 1), reward({ power: 2 }), reward({}, -1)),
  ]),
  event('elem_oversleep', '늦잠!', '눈을 떠보니 평소보다 훨씬 늦었다. 서둘러 학교에 가야 한다.', 1, 6, [
    choice('a', '전력으로 학교까지 달린다.', [25, 55, 20], reward({ speed: 4, stamina: 2 }), reward({ speed: 3, stamina: 1 }), reward({}, -1)),
    choice('b', '침착하게 준비한다.', [15, 80, 5], reward({ intelligence: 4 }), reward({ intelligence: 2 }), reward()),
    choice('c', '가족에게 도움을 요청한다.', [10, 85, 5], reward({ intelligence: 2 }, 1), reward(), reward()),
  ]),
  event('elem_family_jogging', '가족과 조깅', '쉬는 날 아침, 가족과 함께 동네를 가볍게 달리기로 했다.', 1, 6, [
    choice('a', '앞장서 달린다.', [20, 65, 15], reward({ speed: 4, stamina: 2 }), reward({ speed: 3, stamina: 1 }), reward()),
    choice('b', '가족의 속도에 맞춘다.', [15, 75, 10], reward({ stamina: 3, intelligence: 3 }), reward({ stamina: 2, intelligence: 2 }), reward()),
    choice('c', '이야기를 나누며 천천히 달린다.', [15, 75, 10], reward({ intelligence: 3 }, 1), reward({ intelligence: 2 }), reward()),
  ]),
  event('elem_parent_observation', '부모님이 보러 온 날', '부모님이 학교에 찾아와 훈련 모습을 지켜보고 있다.', 1, 6, [
    choice('a', '멋진 모습을 보여준다.', [25, 55, 20], reward({ speed: 4, grit: 3 }), reward({ speed: 3, grit: 2 }), reward({}, -1)),
    choice('b', '평소대로 달린다.', [15, 80, 5], reward({ intelligence: 3, stamina: 3 }), reward({ intelligence: 2, stamina: 2 }), reward()),
    choice('c', '응원에 힘을 얻는다.', [20, 70, 10], reward({ grit: 4 }, 1), reward({ grit: 3 }), reward()),
  ]),
  event('elem_obstacle_course', '장애물 달리기', '운동장에 여러 장애물이 놓인 특별 코스가 만들어졌다.', 1, 5, [
    choice('a', '속도를 줄이지 않는다.', [30, 40, 30], reward({ speed: 4, power: 4 }), reward({ speed: 3, power: 2 }), reward({ power: -1 })),
    choice('b', '하나씩 정확하게 넘는다.', [15, 75, 10], reward({ intelligence: 4, power: 3 }), reward({ intelligence: 3, power: 2 }), reward()),
    choice('c', '친구보다 먼저 끝낸다.', [25, 55, 20], reward({ grit: 4, speed: 3 }), reward({ grit: 3, speed: 2 }), reward({}, -1)),
  ]),
  event('elem_tag_game', '술래잡기 대소동', '쉬는 시간에 시작한 술래잡기가 운동장 전체로 번졌다.', 1, 4, [
    choice('a', '아무도 못 잡게 도망친다.', [20, 65, 15], reward({ speed: 5, intelligence: 2 }), reward({ speed: 3, intelligence: 2 }), reward()),
    choice('b', '술래가 되어 전부 잡는다.', [25, 55, 20], reward({ power: 4, speed: 3 }), reward({ power: 3, speed: 2 }), reward({ stamina: -1 })),
    choice('c', '친구들의 움직임을 예측한다.', [15, 80, 5], reward({ intelligence: 5, speed: 1 }), reward({ intelligence: 3, speed: 1 }), reward()),
  ]),
  event('elem_ball_game', '체육 시간의 공놀이', '체육 시간에 친구들과 팀을 나눠 공놀이를 하게 됐다.', 1, 5, [
    choice('a', '누구보다 활발하게 움직인다.', [20, 65, 15], reward({ power: 4, speed: 3 }), reward({ power: 3, speed: 2 }), reward()),
    choice('b', '상대의 움직임을 읽는다.', [15, 75, 10], reward({ intelligence: 5, power: 2 }), reward({ intelligence: 3, power: 2 }), reward()),
    choice('c', '끝까지 포기하지 않는다.', [20, 65, 15], reward({ grit: 5, power: 2 }), reward({ grit: 3, power: 2 }), reward()),
  ]),
  event('elem_treasure_hunt', '학교 보물찾기', '학교 곳곳에 숨겨진 단서를 따라 보물을 찾는 행사가 열렸다.', 1, 4, [
    choice('a', '빠르게 뛰어다닌다.', [20, 65, 15], reward({ speed: 4, stamina: 2 }), reward({ speed: 3, stamina: 1 }), reward()),
    choice('b', '단서를 꼼꼼히 읽는다.', [15, 80, 5], reward({ intelligence: 5 }), reward({ intelligence: 3 }), reward()),
    choice('c', '친구와 역할을 나눈다.', [15, 75, 10], reward({ intelligence: 3, grit: 3 }), reward({ intelligence: 2, grit: 2 }), reward()),
  ]),
  event('elem_cleaning_race', '청소도 경쟁?', '친구가 교실 청소를 누가 먼저 끝내는지 겨뤄보자고 한다.', 1, 6, [
    choice('a', '엄청난 속도로 끝낸다.', [25, 55, 20], reward({ speed: 3, power: 3 }), reward({ speed: 2, power: 2 }), reward({ intelligence: -1 })),
    choice('b', '빠르고 정확하게 한다.', [15, 75, 10], reward({ intelligence: 4, speed: 2 }), reward({ intelligence: 3, speed: 1 }), reward()),
    choice('c', '친구와 협력한다.', [15, 80, 5], reward({ grit: 3, intelligence: 3 }), reward({ grit: 2, intelligence: 2 }), reward()),
  ]),
  event('elem_library_book', '도서관에서 발견한 책', '유명 선수의 훈련법이 적힌 책을 발견했다.', 3, 6, [
    choice('a', '처음부터 끝까지 읽는다.', [15, 80, 5], reward({ intelligence: 6 }), reward({ intelligence: 4 }), reward()),
    choice('b', '훈련법만 골라 읽는다.', [20, 70, 10], reward({ intelligence: 4 }, 0, growthMain(2)), reward({ intelligence: 3 }, 0, growthMain(1)), reward()),
    choice('c', '바로 운동장에서 시험한다.', [25, 55, 20], reward({ intelligence: 2 }, 0, growthMain(4)), reward({ intelligence: 1 }, 0, growthMain(3)), reward({}, -1)),
  ]),
  event('elem_indoor_training', '체육관에서의 하루', '바깥 활동이 어려워 오늘 훈련은 체육관에서 진행한다.', 1, 6, [
    choice('a', '근력운동을 한다.', [20, 65, 15], reward({ power: 5, grit: 2 }), reward({ power: 3, grit: 2 }), reward()),
    choice('b', '자세 교정을 한다.', [15, 80, 5], reward({ intelligence: 4, speed: 2 }), reward({ intelligence: 3, speed: 1 }), reward()),
    choice('c', '왕복달리기를 한다.', [25, 55, 20], reward({ speed: 4, stamina: 3 }), reward({ speed: 3, stamina: 2 }), reward({}, -1)),
  ]),
  event('elem_hot_day', '한여름의 운동장', '햇볕이 뜨거운 한여름, 운동장에서는 열기가 아른거린다.', 1, 6, [
    choice('a', '평소처럼 훈련한다.', [30, 40, 30], reward({ stamina: 5, grit: 4 }), reward({ stamina: 3, grit: 2 }), reward({}, -1)),
    choice('b', '자주 쉬면서 달린다.', [10, 85, 5], reward({ stamina: 3, intelligence: 2 }), reward({ stamina: 2, intelligence: 1 }), reward()),
    choice('c', '해가 약해질 때까지 기다린다.', [15, 80, 5], reward({ intelligence: 4 }, 1), reward({ intelligence: 2 }), reward()),
  ]),
  event('elem_cold_morning', '추운 겨울 아침', '차가운 바람이 부는 아침, 몸이 좀처럼 따뜻해지지 않는다.', 1, 6, [
    choice('a', '바로 달리기 시작한다.', [25, 50, 25], reward({ speed: 4, grit: 3 }), reward({ speed: 3, grit: 2 }), reward({}, -1)),
    choice('b', '충분히 몸을 푼다.', [15, 80, 5], reward({ intelligence: 4, power: 2 }), reward({ intelligence: 3, power: 1 }), reward()),
    choice('c', '긴 조깅으로 몸을 데운다.', [15, 75, 10], reward({ stamina: 4, grit: 2 }), reward({ stamina: 3, grit: 1 }), reward()),
  ]),
  event('elem_growth_spurt', '갑자기 자란 키', '최근 키가 훌쩍 자라면서 달릴 때의 감각이 조금 달라졌다.', 4, 6, [
    choice('a', '새로운 보폭에 적응한다.', [20, 70, 10], reward({ speed: 3, power: 3 }), reward({ speed: 2, power: 2 }), reward()),
    choice('b', '균형을 다시 잡는다.', [15, 80, 5], reward({ intelligence: 4, power: 2 }), reward({ intelligence: 3, power: 1 }), reward()),
    choice('c', '더 큰 보폭으로 달려본다.', [30, 40, 30], reward({ speed: 5, power: 3 }), reward({ speed: 3, power: 2 }), reward({ speed: -1 })),
  ]),
  event('elem_shoelace_accident', '풀려버린 신발끈', '달리는 도중 신발끈이 풀린 것을 뒤늦게 알아챘다.', 1, 6, [
    choice('a', '멈추지 않고 끝까지 달린다.', [30, 40, 30], reward({ grit: 5, speed: 3 }), reward({ grit: 3, speed: 2 }), reward({}, -1)),
    choice('b', '바로 멈춰 다시 묶는다.', [10, 85, 5], reward({ intelligence: 4 }), reward({ intelligence: 2 }), reward()),
    choice('c', '다음부터 풀리지 않게 연구한다.', [15, 80, 5], reward({ intelligence: 5, speed: 1 }), reward({ intelligence: 3, speed: 1 }), reward()),
  ]),
  event('elem_best_friend_rival', '절친이자 라이벌', '가장 친한 친구가 오늘만큼은 진지하게 승부하자고 한다.', 3, 6, [
    choice('a', '반드시 이긴다.', [25, 55, 20], reward({ speed: 4, grit: 4 }), reward({ speed: 3, grit: 2 }), reward({}, -1)),
    choice('b', '서로 최선을 다한다.', [20, 70, 10], reward({ speed: 3, power: 3 }, 1), reward({ speed: 2, power: 2 }), reward()),
    choice('c', '상대의 장점을 배운다.', [15, 80, 5], reward({ intelligence: 4 }, 0, random(2)), reward({ intelligence: 3 }), reward()),
  ]),
  event('elem_help_friend', '다친 친구', '훈련 중 친구가 넘어져 다친 것 같다.', 1, 6, [
    choice('a', '바로 친구를 도와준다.', [20, 75, 5], reward({ grit: 4, intelligence: 3 }, 1), reward({ grit: 3, intelligence: 2 }), reward()),
    choice('b', '선생님을 불러온다.', [15, 80, 5], reward({ intelligence: 5 }), reward({ intelligence: 3 }), reward()),
    choice('c', '친구의 짐까지 대신 들고 간다.', [20, 65, 15], reward({ power: 3, grit: 3 }), reward({ power: 2, grit: 2 }), reward({}, -1)),
  ]),
  event('elem_school_trip_hike', '수학여행의 산길', '수학여행에서 친구들과 가파른 산길을 오르게 됐다.', 5, 6, [
    choice('a', '앞장서서 올라간다.', [20, 65, 15], reward({ stamina: 4, power: 3 }), reward({ stamina: 3, power: 2 }), reward()),
    choice('b', '친구를 도우며 올라간다.', [15, 75, 10], reward({ grit: 4, stamina: 2 }), reward({ grit: 3, stamina: 1 }), reward()),
    choice('c', '정상까지 쉬지 않는다.', [25, 55, 20], reward({ stamina: 5, grit: 3 }), reward({ stamina: 3, grit: 2 }), reward({}, -1)),
  ]),
  event('elem_beach_run', '모래사장의 달리기', '바닷가의 넓은 모래사장에서 달려볼 기회가 생겼다.', 1, 6, [
    choice('a', '파도 옆을 전력질주한다.', [25, 55, 20], reward({ speed: 4, power: 3 }), reward({ speed: 3, power: 2 }), reward({ stamina: -1 })),
    choice('b', '깊은 모래를 달린다.', [25, 55, 20], reward({ power: 5, grit: 2 }), reward({ power: 3, grit: 2 }), reward({}, -1)),
    choice('c', '천천히 오래 달린다.', [15, 75, 10], reward({ stamina: 4, power: 2 }), reward({ stamina: 3, power: 1 }), reward()),
  ]),
  event('elem_local_sports_day', '지역 체육대회', '지역의 여러 학교가 모이는 체육대회에 참가하게 됐다.', 3, 6, [
    choice('a', '자신의 속도를 보여준다.', [25, 55, 20], reward({ speed: 5, power: 2 }), reward({ speed: 3, power: 2 }), reward({}, -1)),
    choice('b', '강한 상대를 관찰한다.', [15, 80, 5], reward({ intelligence: 5, speed: 2 }), reward({ intelligence: 3, speed: 1 }), reward()),
    choice('c', '끝까지 경쟁한다.', [25, 55, 20], reward({ grit: 5, stamina: 2 }), reward({ grit: 3, stamina: 2 }), reward({ grit: -1 })),
  ]),
  event('elem_racecourse_visit', '처음 가본 경마장', '실제 레이스가 열리는 거대한 경기장을 방문했다.', 3, 6, [
    choice('a', '선수들의 달리기만 바라본다.', [15, 80, 5], reward({ speed: 3, intelligence: 4 }), reward({ speed: 2, intelligence: 3 }), reward()),
    choice('b', '스타트와 코너를 분석한다.', [15, 80, 5], reward({ intelligence: 6 }), reward({ intelligence: 4 }), reward()),
    choice('c', '언젠가 여기서 뛰겠다고 다짐한다.', [20, 70, 10], reward({ grit: 5 }, 1), reward({ grit: 3 }), reward()),
  ]),
  event('elem_famous_race_video', '전설의 레이스', '수업 시간에 모두가 기억하는 전설적인 레이스 영상을 보게 됐다.', 2, 6, [
    choice('a', '우승자의 속도를 따라 하고 싶다.', [20, 70, 10], reward({ speed: 4, intelligence: 2 }), reward({ speed: 3, intelligence: 1 }), reward()),
    choice('b', '마지막 추월을 반복해서 본다.', [20, 70, 10], reward({ power: 3, intelligence: 3 }), reward({ power: 2, intelligence: 2 }), reward()),
    choice('c', '끝까지 포기하지 않는 모습에 감동한다.', [20, 70, 10], reward({ grit: 5 }, 1), reward({ grit: 3 }), reward()),
  ]),
  event('elem_visiting_coach', '낯선 코치의 시선', '학교를 방문한 외부 코치가 훈련을 유심히 지켜보고 있다.', 4, 6, [
    choice('a', '자신의 장점을 보여준다.', [25, 55, 20], reward({ speed: 2 }, 0, growthMain(5)), reward({ speed: 1 }, 0, growthMain(3)), reward({}, -1)),
    choice('b', '평소처럼 훈련한다.', [15, 80, 5], reward({ stamina: 3, intelligence: 3 }), reward({ stamina: 2, intelligence: 2 }), reward()),
    choice('c', '조언을 부탁한다.', [15, 75, 10], reward({ intelligence: 4 }, 0, lowest(3)), reward({ intelligence: 3 }, 0, lowest(2)), reward()),
  ]),
  event('elem_record_board', '학교 기록판', '운동장 한쪽 기록판에 선배들이 남긴 최고 기록이 적혀 있다.', 3, 6, [
    choice('a', '최고 기록에 도전한다.', [30, 40, 30], reward({ speed: 6, grit: 2 }), reward({ speed: 4, grit: 1 }), reward({}, -1)),
    choice('b', '자신의 기록과 비교한다.', [15, 80, 5], reward({ intelligence: 4, speed: 2 }), reward({ intelligence: 3, speed: 1 }), reward()),
    choice('c', '하나씩 기록을 줄여간다.', [15, 75, 10], reward({ speed: 3, stamina: 3 }), reward({ speed: 2, stamina: 2 }), reward()),
  ]),
  event('elem_home_training', '집에서도 훈련', '집에서도 할 수 있는 작은 훈련을 찾아보기로 했다.', 2, 6, [
    choice('a', '근력운동을 한다.', [20, 65, 15], reward({ power: 5, grit: 2 }), reward({ power: 3, grit: 2 }), reward()),
    choice('b', '스트레칭과 자세 연습을 한다.', [15, 80, 5], reward({ intelligence: 4, power: 2 }), reward({ intelligence: 3, power: 1 }), reward()),
    choice('c', '계단을 이용한다.', [25, 55, 20], reward({ power: 4, stamina: 3 }), reward({ power: 3, stamina: 2 }), reward({}, -1)),
  ]),
  event('elem_exam_and_training', '시험과 훈련 사이', '시험 준비와 훈련을 모두 해야 해서 시간을 나누기가 쉽지 않다.', 5, 6, [
    choice('a', '공부부터 끝낸다.', [15, 80, 5], reward({ intelligence: 6 }), reward({ intelligence: 4 }), reward()),
    choice('b', '훈련을 먼저 한다.', [25, 55, 20], reward({ grit: 2 }, 0, growthMain(5)), reward({ grit: 2 }, 0, growthMain(3)), reward({}, -1)),
    choice('c', '시간을 나눠 둘 다 한다.', [15, 75, 10], reward({ intelligence: 3 }, 0, growthMain(3)), reward({ intelligence: 2 }, 0, growthMain(2)), reward()),
  ]),
  event('elem_future_dream', '앞으로의 꿈', '장래 희망을 적는 시간에 앞으로 어떤 선수가 되고 싶은지 생각해본다.', 4, 6, [
    choice('a', '최고의 선수가 되고 싶다고 쓴다.', [20, 70, 10], reward({ grit: 5, speed: 2 }), reward({ grit: 3, speed: 2 }), reward()),
    choice('b', '아직 천천히 생각해본다.', [15, 80, 5], reward({ intelligence: 5 }), reward({ intelligence: 3 }), reward()),
    choice('c', '자신이 좋아하는 달리기를 떠올린다.', [20, 70, 10], reward({}, 1, growthMain(4)), reward({}, 0, growthMain(3)), reward()),
  ]),
  event('elem_next_stage', '더 넓은 무대로', '중등부에 진학한 뒤 어떤 선수가 되고 싶은지 생각하게 됐다.', 5, 6, [
    choice('a', '누구보다 빠른 선수가 되고 싶다.', [20, 70, 10], reward({ speed: 5, grit: 2 }), reward({ speed: 3, grit: 2 }), reward()),
    choice('b', '어떤 레이스에서도 흔들리지 않는 선수가 되고 싶다.', [15, 80, 5], reward({ stamina: 4, intelligence: 3 }), reward({ stamina: 3, intelligence: 2 }), reward()),
    choice('c', '아직 정하지 않는다. 여러 가능성을 시험해본다.', [15, 75, 10], reward({ intelligence: 3 }, 0, lowest(4)), reward({ intelligence: 2 }, 0, lowest(3)), reward()),
  ]),
]
