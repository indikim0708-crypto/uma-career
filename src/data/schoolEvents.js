const outcome = (type, weight, text, statChanges = {}, conditionDelta = 0, effect = null) => ({ type, weight, text, statChanges, conditionDelta, effect })
const choice = (id, text, weights, great, success, failure) => ({
  id, text, outcomes: [outcome('GREAT_SUCCESS', weights[0], ...great), outcome('SUCCESS', weights[1], ...success), outcome('FAILURE', weights[2], ...failure)],
})
const schoolEvent = (id, schoolId, name, situation, choices, type = 'SCHOOL') => ({ id, schoolId, name, situation, type, choices })

export const ELEMENTARY_SCHOOL_EVENTS = [
  schoolEvent('mejiro_matriarch', 'mejiro', '가문 총수의 시선', '메지로 가문의 할머니이자 가문 총수가 직접 학교 훈련을 참관했다. 수많은 학생 사이에서 잠시 캐릭터에게 시선이 멈춘다.', [
    choice('a', '메지로의 전통대로 긴 거리를 달린다', [20, 65, 15], ["총수가 조용히 고개를 끄덕였다. ‘좋은 호흡이구나.’", { stamina: 7, grit: 4 }], ['긴 거리를 안정적으로 완주했다.', { stamina: 5, grit: 2 }], ['총수를 의식한 나머지 페이스를 잃었다.', { stamina: -1 }]),
    choice('b', '마지막 언덕에서 승부를 건다', [30, 40, 30], ["‘좋구나. 승부를 아는 아이야.’ 강렬한 인상을 남겼다!", { grit: 7, power: 5 }], ['마지막까지 강하게 밀어붙였다.', { grit: 4, power: 3 }], ['무리한 승부로 완전히 지쳐버렸다.', { stamina: -2 }, -1]),
    choice('c', '자신만의 달리기를 보여준다', [15, 75, 10], ["‘남을 따라 할 필요는 없단다.’ 뜻밖의 칭찬을 받았다.", { speed: 4, intelligence: 5 }], ['자신의 페이스를 끝까지 유지했다.', { speed: 3, intelligence: 3 }], ['아직 자신만의 스타일을 보여주기엔 부족했다.', {}]),
  ], 'SIGNATURE'),
  schoolEvent('mejiro_long_run', 'mejiro', '메지로 전통 장거리 주행', '메지로의 전통에 따라 긴 거리를 달리는 훈련이 시작됐다.', [
    choice('a', '선두 그룹을 끝까지 따라간다', [20, 60, 20], ['긴 거리에서도 한 번도 선두를 놓치지 않았다!', { stamina: 6, speed: 3 }], ['선두 그룹과 함께 완주했다.', { stamina: 4, speed: 2 }], ['마지막에 호흡이 무너졌다.', { stamina: -1 }]),
    choice('b', '자기 페이스를 철저히 지킨다', [10, 85, 5], ['완벽한 페이스 관리였다.', { stamina: 5, intelligence: 3 }], ['안정적인 장거리 주행이었다.', { stamina: 4, intelligence: 2 }], ['무난하게 마쳤다.', {}]),
    choice('c', '마지막까지 이를 악문다', [25, 50, 25], ['한계를 넘어 끝까지 달려냈다!', { grit: 7 }], ['근성으로 완주했다.', { grit: 4 }], ['완주했지만 완전히 지쳤다.', { grit: 1 }, -1]),
  ]),
  schoolEvent('mejiro_dignity', 'mejiro', '메지로의 품격', '메지로의 이름에 어울리는 품격과 실력을 갖추기 위한 수업이 열렸다.', [
    choice('a', '레이스 이론을 공부한다', [15, 75, 10], ['복잡한 레이스 이론을 완벽히 이해했다.', { intelligence: 6, stamina: 2 }], ['레이스 이론을 익혔다.', { intelligence: 4 }], ['큰 성과가 없었다.', {}]),
    choice('b', '자세와 주법을 교정한다', [20, 65, 15], ['우아하고 효율적인 주법을 익혔다.', { speed: 4, power: 4 }], ['자세가 한층 안정됐다.', { speed: 3, power: 2 }], ['교정한 자세가 아직 어색하다.', { power: -1 }]),
    choice('c', '예절보다 달리기가 먼저다!', [25, 45, 30], ['그 자신감조차 메지로답다는 평가를 받았다.', { speed: 5, grit: 4 }], ['자신 있는 달리기를 보여줬다.', { speed: 3, grit: 2 }], ['가문 총수에게 한 소리 들었다.', { intelligence: -2 }]),
  ]),

  schoolEvent('shadai_special_program', 'shadai', '특별 육성 프로그램 지명', '정밀 능력 측정 결과, 샤다이 전문 육성팀이 개인 특별 프로그램을 제안했다.', [
    choice('a', '최고속도 프로그램', [20, 70, 10], ['측정 한계를 넘어선 최고속도를 기록했다!', { speed: 7, power: 4 }], ['최고속도가 크게 향상됐다.', { speed: 5, power: 2 }], ['훈련 강도를 따라가지 못했다.', { speed: -1 }]),
    choice('b', '심폐·지구력 프로그램', [20, 70, 10], ['모든 지구력 측정 기록을 경신했다!', { stamina: 7, grit: 4 }], ['지구력이 크게 향상됐다.', { stamina: 5, grit: 2 }], ['훈련 강도를 따라가지 못했다.', { stamina: -1 }]),
    choice('c', '종합 육성 프로그램', [15, 75, 10], ['모든 측정치가 크게 향상됐다!', { speed: 3, stamina: 3, power: 3, grit: 3, intelligence: 3 }], ['모든 능력이 고르게 성장했다.', { speed: 2, stamina: 2, power: 2, grit: 2, intelligence: 2 }], ['기초부터 다시 다졌다.', { speed: 1, stamina: 1, power: 1, grit: 1, intelligence: 1 }]),
  ], 'SIGNATURE'),
  schoolEvent('shadai_data_running', 'shadai', '데이터로 보는 달리기', '최신 장비로 달리기를 측정하고 데이터를 분석한다.', [
    choice('a', '최고속도를 분석한다', [15, 75, 10], ['최고속도의 비밀을 찾아냈다.', { speed: 6, intelligence: 3 }], ['속도 데이터를 훈련에 반영했다.', { speed: 4, intelligence: 2 }], ['유용한 결과를 찾지 못했다.', {}]),
    choice('b', '가속 구간을 분석한다', [15, 75, 10], ['가속 동작을 완벽하게 개선했다.', { power: 6, intelligence: 3 }], ['가속 구간을 개선했다.', { power: 4, intelligence: 2 }], ['유용한 결과를 찾지 못했다.', {}]),
    choice('c', '약점을 집중적으로 찾는다', [20, 70, 10], ['가장 큰 약점을 완벽하게 보완했다.', {}, 0, { kind: 'LOWEST', amount: 7 }], ['약점을 크게 보완했다.', {}, 0, { kind: 'LOWEST', amount: 5 }], ['분석에 시간이 더 필요하다.', {}]),
  ]),
  schoolEvent('shadai_elite_training', 'shadai', '엘리트 합동훈련', '전국에서 모인 유망주들과 엘리트 합동훈련이 시작됐다.', [
    choice('a', '가장 빠른 아이를 따라간다', [25, 50, 25], ['최고 속도의 아이를 끝까지 따라잡았다!', { speed: 6, power: 4 }], ['빠른 상대에게 좋은 자극을 받았다.', { speed: 4, power: 2 }], ['무리한 추격으로 지쳤다.', { stamina: -1 }]),
    choice('b', '자신보다 강한 상대와 계속 승부한다', [25, 50, 25], ['강한 상대들을 연달아 꺾었다!', { power: 5, grit: 5 }], ['강한 상대와의 승부에서 성장했다.', { power: 3, grit: 3 }], ['패배가 이어져 자신감이 흔들렸다.', { grit: -1 }]),
    choice('c', '여러 선수의 장점을 관찰한다', [15, 80, 5], ['수많은 장점을 자신의 것으로 만들었다.', { intelligence: 6 }, 0, { kind: 'RANDOM_DISTINCT', amount: 2, count: 2 }], ['새로운 기술을 배웠다.', { intelligence: 4 }, 0, { kind: 'RANDOM', amount: 2 }], ['관찰만 하다 훈련이 끝났다.', {}]),
  ]),

  schoolEvent('cap_oguri_return', 'cap', '영웅의 귀환', '카사마츠의 영웅 오구리 캡이 학교를 방문했다. 오구리 캡이 학생들과 직접 한 바퀴를 달린다.', [
    choice('a', '오구리 캡을 끝까지 따라간다!', [30, 40, 30], ['잠깐이나마 오구리의 뒤를 놓치지 않았다! 운동장이 술렁인다.', { speed: 7, power: 6 }], ['차이는 컸지만 끝까지 쫓아갔다.', { speed: 4, power: 4 }], ['초반부터 전력으로 쫓다가 완전히 퍼졌다.', { stamina: -2 }, -1]),
    choice('b', '마지막 순간에만 승부한다', [20, 60, 20], ['오구리가 돌아보며 살짝 웃었다.', { power: 5, grit: 6 }], ['마지막까지 강하게 승부했다.', { power: 3, grit: 4 }], ['승부 타이밍을 놓쳤다.', { grit: -1 }]),
    choice('c', '오구리의 주법을 눈에 새긴다', [15, 80, 5], ['영웅의 주법에서 놀라운 깨달음을 얻었다.', { intelligence: 6, speed: 4 }], ['오구리의 주법을 배웠다.', { intelligence: 4, speed: 2 }], ['따라가기만도 벅찼다.', {}]),
  ], 'SIGNATURE'),
  schoolEvent('cap_dirt_trial', 'cap', '카사마츠 흙바닥 기록회', '카사마츠의 거친 흙바닥에서 기록회가 열린다.', [
    choice('a', '강하게 땅을 박차고 나간다', [20, 65, 15], ['흙바닥을 강하게 박차며 최고 기록을 냈다.', { power: 6, speed: 3 }], ['힘찬 주행을 보여줬다.', { power: 4, speed: 2 }], ['발이 흙에 빠졌다.', { power: -1 }]),
    choice('b', '미끄러져도 계속 밀어붙인다', [25, 50, 25], ['거친 노면에도 굴하지 않고 달렸다.', { grit: 6, power: 3 }], ['끝까지 밀어붙였다.', { grit: 4, power: 2 }], ['계속 미끄러져 완전히 지쳤다.', {}, -1]),
    choice('c', '노면 상태에 맞춰 주법을 바꾼다', [15, 80, 5], ['노면을 완벽하게 읽어냈다.', { intelligence: 5, power: 3 }], ['흙바닥에 맞는 주법을 익혔다.', { intelligence: 3, power: 2 }], ['큰 변화 없이 마쳤다.', {}]),
  ]),
  schoolEvent('cap_local_star', 'cap', '지방의 별', '지역 신문에서 캡 초등학교의 유망주를 취재하러 왔다.', [
    choice('a', '제가 제일 강합니다!', [25, 50, 25], ['당당한 선언 뒤 기록회에서도 1위를 차지했다!', { grit: 5, speed: 4 }], ['자신 있게 실력을 보여줬다.', { grit: 3, speed: 2 }], ['말과 달리 결과가 따라주지 않았다.', { grit: -2 }]),
    choice('b', '말보다 달리기로 보여준다', [20, 65, 15], ['압도적인 달리기로 모두를 놀라게 했다.', { power: 5, speed: 4 }], ['좋은 기록으로 답했다.', { power: 3, speed: 3 }], ['기록이 기대에 미치지 못했다.', { power: -1 }]),
    choice('c', '아직 배울 게 많습니다.', [10, 85, 5], ['겸손한 태도와 훌륭한 실력으로 사랑받았다.', { intelligence: 4, grit: 3 }, 1], ['침착하게 취재를 마쳤다.', { intelligence: 3, grit: 2 }], ['조용히 취재를 마쳤다.', {}]),
  ]),

  schoolEvent('symboli_rudolf_visit', 'symboli', '황제의 방문', '심볼리 가문의 전설 심볼리 루돌프가 학교를 방문했다. 훈련을 지켜본 루돌프가 묻는다. “레이스에서 가장 중요한 것은 무엇이라고 생각하지?”', [
    choice('a', '누구보다 빠르게 달리는 것입니다.', [20, 65, 15], ["루돌프가 만족스럽게 미소 지었다. ‘그 속도를 지배할 수 있다면 말이지.’", { speed: 7, intelligence: 3 }], ['속도에 대한 확신을 보여줬다.', { speed: 5, intelligence: 2 }], ['대답에 확신이 부족했다.', { speed: -1 }]),
    choice('b', '상대를 읽고 움직이는 것입니다.', [20, 70, 10], ["‘좋은 답이다.’ 황제가 직접 몇 가지 조언을 건넸다.", { intelligence: 7, power: 3 }], ['황제의 조언을 들었다.', { intelligence: 5, power: 2 }], ['아직 답을 더 고민해야 한다.', {}]),
    choice('c', '끝까지 포기하지 않는 것입니다.', [25, 55, 20], ["‘그 마음을 잊지 마라.’ 강렬한 격려를 받았다.", { grit: 7, stamina: 4 }], ['굳은 의지를 보여줬다.', { grit: 5, stamina: 2 }], ['긴장해 뜻을 제대로 전하지 못했다.', { grit: -1 }]),
  ], 'SIGNATURE'),
  schoolEvent('symboli_mock_race', 'symboli', '황제와의 모의 레이스', '심볼리 루돌프가 학생 몇 명과 짧은 시범 주행을 한다.', [
    choice('a', '처음부터 루돌프의 옆을 노린다', [30, 40, 30], ['순간이나마 황제와 어깨를 나란히 했다!', { speed: 6, power: 6 }], ['황제의 옆을 향해 힘껏 달렸다.', { speed: 4, power: 3 }], ['초반부터 무리해 크게 지쳤다.', { stamina: -2 }]),
    choice('b', '루돌프의 움직임을 따라간다', [15, 80, 5], ['한 번의 주행에서 수많은 것을 배웠다.', { intelligence: 6, speed: 3 }], ['황제의 움직임을 배웠다.', { intelligence: 4, speed: 2 }], ['따라가는 것만으로 벅찼다.', {}]),
    choice('c', '마지막 순간까지 기다렸다가 승부한다', [25, 55, 20], ['예상하지 못한 타이밍에 황제를 놀라게 했다!', { power: 5, intelligence: 4, grit: 2 }], ['침착하게 마지막 승부를 걸었다.', { power: 3, intelligence: 3 }], ['타이밍을 잘못 읽었다.', { intelligence: -1 }]),
  ]),
  schoolEvent('symboli_research', 'symboli', '심볼리식 레이스 연구회', '레이스 전체를 읽고 지배하기 위한 연구회가 열렸다.', [
    choice('a', '선두의 움직임을 분석한다', [15, 75, 10], ['선두의 움직임을 완벽히 파악했다.', { intelligence: 5, speed: 3 }], ['선두의 움직임을 이해했다.', { intelligence: 3, speed: 2 }], ['분석에 시간이 더 필요하다.', {}]),
    choice('b', '추월이 일어나는 지점을 찾는다', [20, 65, 15], ['모든 추월 지점을 정확히 찾아냈다.', { intelligence: 5, power: 4 }], ['추월의 핵심을 배웠다.', { intelligence: 3, power: 3 }], ['잘못된 지점을 골랐다.', { power: -1 }]),
    choice('c', '전체 레이스의 흐름을 정리한다', [10, 85, 5], ['레이스 전체의 흐름이 한눈에 들어왔다.', { intelligence: 5, speed: 2, stamina: 2 }], ['레이스의 흐름을 정리했다.', { intelligence: 4, stamina: 2 }], ['정리는 했지만 큰 소득은 없었다.', {}]),
  ]),
]

export const SIGNATURE_EVENT_IDS = {
  mejiro: 'mejiro_matriarch',
  shadai: 'shadai_special_program',
  cap: 'cap_oguri_return',
  symboli: 'symboli_rudolf_visit',
}
