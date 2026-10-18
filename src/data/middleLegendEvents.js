const portrait = (file) => `/assets/legends/${file}.png`
const outcome = (type, weight, text, statChanges, conditionDelta = 0) => ({ type, weight, text, statChanges, conditionDelta })
const legend = ({ id, schoolId, growthTypes = [], characterName, title, file, dialogue, buttonText, great, success, failure }) => ({
  id,
  stage: 'MIDDLE',
  type: 'LEGEND',
  schoolId,
  growthTypes,
  characterName,
  title,
  name: title,
  portrait: portrait(file),
  situation: dialogue,
  choices: [{
    id: 'accept',
    text: buttonText,
    outcomes: [
      outcome('GREAT_SUCCESS', great[0], great[1], great[2], great[3]),
      outcome('SUCCESS', success[0], success[1], success[2], success[3]),
      outcome('FAILURE', failure[0], failure[1], failure[2], failure[3]),
    ],
  }],
})

const CENTRAL = 'central_tracen_middle'

export const MIDDLE_LEGEND_EVENTS = [
  legend({
    id: 'legend_bakushin', schoolId: CENTRAL, growthTypes: ['sprinter'], characterName: '사쿠라 바쿠신 오', title: '돌격! 돌격! 돌격입니다!!', file: 'sakura_bakushin_o',
    dialogue: '“고민할 시간에 앞으로 달리는 겁니다!\n돌격! 돌격! 바쿠신입니다!!”', buttonText: '무조건 바쿠신한다!',
    great: [30, '“훌륭한 바쿠신입니다!!”', { speed: 12, power: 3 }, 1], success: [60, '거침없는 돌격으로 한계를 넘었다.', { speed: 9, power: 2 }], failure: [10, '달리는 즐거움만큼은 확실히 배웠다.', { speed: 4 }],
  }),
  legend({
    id: 'legend_calstone', schoolId: CENTRAL, growthTypes: ['sprinter'], characterName: '칼스톤 라이트 오', title: '직선. 직선. 오직 직선!', file: 'calstone_light_o',
    dialogue: '“직선은 아름답다.\n직선으로 달려라.\n더 직선으로.”', buttonText: '오직 직선으로 달린다',
    great: [20, '완벽하게 곧은 질주였다.', { speed: 9, power: 3 }], success: [75, '흔들림 없는 직선 주법을 익혔다.', { speed: 7, power: 2 }], failure: [5, '직선을 향한 마음은 남았다.', { speed: 3 }],
  }),
  legend({
    id: 'legend_taiki', schoolId: CENTRAL, growthTypes: ['miler'], characterName: '타이키 셔틀', title: '가속합니DA!', file: 'taiki_shuttle',
    dialogue: '“HEY! 여기서 망설이면 NO GOOD!\n한 번에 가속합니DA!”', buttonText: '한 번에 가속한다!',
    great: [30, '“VERY GOOD! 최고의 가속입니DA!”', { power: 11, speed: 4 }, 1], success: [60, '시원한 가속으로 앞으로 튀어나갔다.', { power: 8, speed: 3 }], failure: [10, '다음 가속을 위한 감각을 얻었다.', { power: 4 }],
  }),
  legend({
    id: 'legend_ruby', schoolId: CENTRAL, growthTypes: ['miler'], characterName: '다이이치 루비', title: '그 순간까지 기다리세요', file: 'daiichi_ruby',
    dialogue: '“가속은 빠른 것보다\n정확한 것이 중요합니다.”', buttonText: '정확한 순간을 기다린다',
    great: [20, '완벽한 순간에 폭발적인 가속을 만들었다.', { power: 8, intelligence: 5 }], success: [75, '서두르지 않고 가속 타이밍을 익혔다.', { power: 6, intelligence: 3 }], failure: [5, '작은 깨달음도 다음 질주에 남았다.', { power: 3, intelligence: 1 }],
  }),
  legend({
    id: 'legend_gentildonna', schoolId: CENTRAL, growthTypes: ['router'], characterName: '젠틸돈나', title: '당당하게 달리세요', file: 'gentildonna',
    dialogue: '“상대를 의식해 자신을 작게 만들 필요는 없습니다.\n당신이 앞에 설 사람이라고 생각하고 뛰세요.”', buttonText: '당당하게 앞에 선다',
    great: [25, '“그 정도라면 충분히 당당해도 되겠군요.”', { power: 10, speed: 6 }], success: [65, '강한 자신감으로 코스를 장악했다.', { power: 7, speed: 4 }], failure: [10, '위축되지 않는 자세를 배웠다.', { power: 3, speed: 2 }],
  }),
  legend({
    id: 'legend_almond', schoolId: CENTRAL, growthTypes: ['router'], characterName: '아몬드 아이', title: '빛나는 순간', file: 'almond_eye',
    dialogue: '“달리고 싶다는 마음이 반짝이는 순간이 있어.\n그 감각을 놓치지 마.”', buttonText: '빛나는 감각을 붙잡는다',
    great: [25, '달리는 마음이 눈부신 질주로 이어졌다.', { speed: 10, stamina: 5 }, 1], success: [65, '자신만의 빛나는 리듬을 찾았다.', { speed: 7, stamina: 4 }], failure: [10, '희미하지만 분명한 감각을 기억했다.', { speed: 3, stamina: 2 }],
  }),
  legend({
    id: 'legend_creek', schoolId: CENTRAL, growthTypes: ['stayer'], characterName: '슈퍼 크릭', title: '천천히, 끝까지', file: 'super_creek',
    dialogue: '“괜찮아요. 급하게 갈 필요 없어요.\n끝까지 갈 수 있는 속도를 찾으면 된답니다.”', buttonText: '끝까지 갈 수 있는 속도를 찾는다',
    great: [30, '편안하면서도 강한 자신만의 호흡을 찾았다.', { stamina: 12 }, 1], success: [60, '긴 거리를 지탱하는 리듬을 익혔다.', { stamina: 9 }], failure: [10, '천천히 달려도 배움은 남았다.', { stamina: 4 }],
  }),
  legend({
    id: 'legend_mcqueen', schoolId: CENTRAL, growthTypes: ['stayer'], characterName: '메지로 맥퀸', title: '이 정도는 해내셔야죠?', file: 'mejiro_mcqueen',
    dialogue: '“딱히 당신을 걱정해서 온 것은 아닙니다만…\n장거리에서 이 정도는 버텨주셔야 곤란하지 않데스와.”', buttonText: '우아하게 끝까지 버틴다',
    great: [20, '흠잡을 데 없는 장거리 주행을 보여줬다.', { stamina: 9, intelligence: 4 }], success: [75, '절제된 페이스로 거리를 견뎠다.', { stamina: 7, intelligence: 2 }], failure: [5, '기본적인 호흡부터 다시 익혔다.', { stamina: 3 }],
  }),
  legend({
    id: 'legend_grass', schoolId: 'nakayama_tracen_middle', characterName: '그래스 원더', title: '조급해하지 않으셔도 괜찮아요', file: 'grass_wonder',
    dialogue: '“서두르지 않아도 괜찮아요.\n지금의 한 걸음이 분명 힘이 될 테니까요.”', buttonText: '차분하게 한 걸음씩 나아간다',
    great: [25, '차분한 집중이 눈부신 성과를 냈다.', { speed: 7, power: 7 }, 1], success: [65, '흔들리지 않고 자신의 주행을 완성했다.', { speed: 5, power: 5 }], failure: [10, '작은 걸음에서도 배움을 얻었다.', { speed: 2, power: 2 }],
  }),
  legend({
    id: 'legend_mayano', schoolId: 'hanshin_tracen_middle', characterName: '마야노 탑건', title: '너무 심각하게 생각하지 마☆', file: 'mayano_top_gun',
    dialogue: '“레이스도 훈련도 즐거워야 잘 되는 거야!\n자, 마야랑 같이 가자~!”', buttonText: '마야노와 즐겁게 달린다',
    great: [25, '즐거운 질주가 최고의 훈련이 됐다.', { stamina: 7, power: 7 }, 1], success: [65, '힘을 빼자 주행이 한층 자연스러워졌다.', { stamina: 5, power: 5 }], failure: [10, '웃으며 달린 시간도 좋은 경험이 됐다.', { stamina: 2, power: 2 }],
  }),
  legend({
    id: 'legend_oguri', schoolId: 'kasamatsu_tracen_middle', characterName: '오구리 캡', title: '우선 먹어라', file: 'oguri_cap',
    dialogue: '“배가 고프면 달릴 수 없다.\n우선 먹는 게 좋다.”', buttonText: '든든하게 먹고 달린다',
    great: [30, '든든히 채운 힘이 폭발적인 주행으로 이어졌다.', { power: 12, stamina: 3 }, 1], success: [60, '충분한 에너지로 강한 훈련을 해냈다.', { power: 9, stamina: 2 }], failure: [10, '먹는 것도 훈련이라는 사실을 배웠다.', { power: 4 }],
  }),
  legend({
    id: 'legend_urara', schoolId: 'kochi_tracen_middle', characterName: '하루 우라라', title: '오늘도 즐겁게 달리자!', file: 'haru_urara',
    dialogue: '“못 이겨도 괜찮아!\n오늘보다 내일 더 즐겁게 달리면 되는 거야!”', buttonText: '오늘도 즐겁게 달린다!',
    great: [30, '끝까지 웃으며 달려 모두에게 힘을 주었다.', { grit: 12 }, 1], success: [60, '즐거운 마음으로 끝까지 달렸다.', { grit: 9 }, 1], failure: [10, '결과와 상관없이 다시 달릴 용기를 얻었다.', { grit: 4 }],
  }),
]
