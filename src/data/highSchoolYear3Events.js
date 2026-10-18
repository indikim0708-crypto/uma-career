const resultText = { GREAT_SUCCESS: '시니어다운 완성도로 큰 성과를 냈습니다!', SUCCESS: '마지막 시즌을 위한 의미 있는 성과를 얻었습니다.', FAILURE: '뜻대로 되지는 않았지만 경험을 남겼습니다.' }
const outcome = (type, weight, statChanges, conditionDelta = 0) => ({ type, weight, text: resultText[type], statChanges, conditionDelta, effects: [] })
const choice = (id, text, focus, secondary) => ({
  id,
  text,
  outcomes: [
    outcome('GREAT_SUCCESS', 20, { [focus]: 8, [secondary]: 4 }),
    outcome('SUCCESS', 70, { [focus]: 5, [secondary]: 2 }),
    outcome('FAILURE', 10, { intelligence: 1 }),
  ],
})
const event = (id, name, focus, secondary, choiceTexts) => {
  if (!Array.isArray(choiceTexts) || choiceTexts.length !== 3) {
    if (import.meta.env.DEV) console.warn(`[UMA CAREER] ${id} requires exactly three choice texts.`)
    return { id, stage: 'HIGH', type: 'HIGH_YEAR3_COMMON', name, situation: `${name}을 맞아 코치와 마지막 시즌의 방향을 고민했습니다.`, choices: [] }
  }
  return {
    id,
    stage: 'HIGH',
    type: 'HIGH_YEAR3_COMMON',
    name,
    situation: `${name}을 맞아 코치와 마지막 시즌의 방향을 고민했습니다.`,
    choices: [
      choice('a', choiceTexts[0], focus, secondary),
      choice('b', choiceTexts[1], 'intelligence', focus),
      choice('c', choiceTexts[2], secondary, 'stamina'),
    ],
  }
}

export const HIGH_SCHOOL_YEAR3_EVENTS = [
  event('high3_last_season', '마지막 시즌', 'grit', 'speed', ['남은 레이스마다 전부 쏟아붓는다', '마지막까지의 계획을 다시 세운다', '여기까지 달려온 리듬을 이어간다']),
  event('high3_champion_pressure', '챔피언의 무게', 'grit', 'intelligence', ['기대까지 짊어지고 선두에 선다', '부담의 정체부터 하나씩 정리한다', '시선은 잊고 평소처럼 달린다']),
  event('high3_challenger_arrives', '왕좌를 노리는 도전자', 'speed', 'grit', ['도전이라면 정면으로 받아준다', '상대의 강점부터 철저히 파악한다', '맞붙는 순간의 감각에 맡긴다']),
  event('high3_perfect_race', '완벽한 레이스란 무엇인가', 'intelligence', 'speed', ['처음부터 끝까지 지배하는 레이스를 꿈꾼다', '실수 없는 전개가 무엇인지 되짚는다', '달리고 나서 후회가 없다면 충분하다']),
  event('high3_body_management', '몸을 관리하는 것도 실력', 'stamina', 'intelligence', ['필요한 만큼만 쉬고 곧바로 훈련에 복귀한다', '컨디션 기록부터 꼼꼼히 점검한다', '오늘 몸이 원하는 만큼만 움직인다']),
  event('high3_small_warning', '몸이 보내는 작은 경고', 'stamina', 'grit', ['아직 움직일 수 있다면 끝까지 해본다', '이상이 생긴 원인을 먼저 확인한다', '평소와 다른 감각을 믿고 멈춘다']),
  event('high3_race_instinct', '머리보다 먼저 움직인 몸', 'power', 'speed', ['떠오른 순간 그대로 치고 나간다', '왜 그런 움직임이 나왔는지 복기한다', '생각하지 말고 몸이 기억한 대로 달린다']),
  event('high3_tactical_variation', '하나의 작전만으로는 부족하다', 'intelligence', 'power', ['새로운 전술을 실전에서 시험한다', '상대에 따라 전개를 바꾸는 법을 익힌다', '가장 자연스럽게 움직이는 방식을 찾는다']),
  event('high3_bad_matchup', '상성이 나쁜 상대', 'power', 'intelligence', ['약점째로 밀어붙여 넘어선다', '상대가 불편한 이유를 세세하게 분석한다', '맞붙어 보면 돌파구가 느껴질 것이다']),
  event('high3_distance_challenge', '주력 거리 밖의 도전', 'stamina', 'speed', ['익숙하지 않아도 과감히 출전한다', '거리 변화에 맞춰 페이스를 다시 계산한다', '일단 달려보고 몸의 반응을 확인한다']),
  event('high3_junior_question', '후배의 질문', 'intelligence', 'grit', ['직접 함께 뛰며 보여준다', '경험을 하나씩 풀어서 설명해준다', '정답 대신 스스로 느껴보게 한다']),
  event('high3_pair_with_junior', '후배와의 병주', 'speed', 'power', ['선배답게 확실한 차이를 보여준다', '후배의 페이스에 맞춰 부족한 점을 본다', '말보다 달리기로 서로 맞춰본다']),
  event('high3_fans_waiting', '기다리는 팬들', 'grit', 'intelligence', ['기대에 보답할 레이스를 약속한다', '지금 할 수 있는 일을 차분히 생각한다', '환호를 힘으로 바꿔 마음껏 달린다']),
  event('high3_media_attention', '늘어난 카메라', 'intelligence', 'grit', ['시선까지 즐기며 당당히 나선다', '필요한 말만 골라 신중하게 답한다', '카메라는 잊고 평소의 자신으로 돌아간다']),
  event('high3_record_board', '기록판에 남은 이름', 'grit', 'speed', ['더 높은 곳에 이름을 새긴다', '지금까지의 기록이 가진 의미를 돌아본다', '숫자보다 기억에 남는 레이스를 원한다']),
  event('high3_what_is_strength', '강함이란 무엇인가', 'power', 'grit', ['누구와 붙어도 이기는 것이 강함이다', '흔들려도 답을 찾아내는 힘이 강함이다', '끝까지 자기답게 달리는 것이 강함이다']),
  event('high3_last_camp', '마지막 여름 합숙', 'stamina', 'power', ['마지막 합숙답게 한계까지 몰아붙인다', '남은 시즌에 필요한 부분만 집중 보완한다', '이곳에서 익힌 감각을 몸에 새긴다']),
  event('high3_future_after_graduation', '졸업 이후의 이야기', 'intelligence', 'grit', ['다음 무대에서도 계속 승부한다', '앞으로 갈 수 있는 길들을 하나씩 살펴본다', '아직 오지 않은 미래는 달리면서 정한다']),
  event('high3_before_final_stage', '마지막 무대를 앞두고', 'speed', 'intelligence', ['시작부터 주도권을 빼앗는다', '상대와 코스를 마지막으로 다시 확인한다', '출발선에서 느껴지는 감각에 집중한다']),
  event('high3_no_regrets', '후회 없는 마지막까지', 'grit', 'stamina', ['남은 힘을 전부 써버린다', '지금까지 준비한 것을 하나도 놓치지 않는다', '마지막 순간만큼은 마음 가는 대로 달린다']),
]

const FAVORED_EVENT_IDS = {
  21: ['high3_last_season', 'high3_champion_pressure', 'high3_challenger_arrives', 'high3_perfect_race'],
  22: ['high3_body_management', 'high3_small_warning', 'high3_race_instinct', 'high3_tactical_variation', 'high3_bad_matchup', 'high3_distance_challenge'],
  23: ['high3_junior_question', 'high3_pair_with_junior', 'high3_last_camp', 'high3_fans_waiting'],
  24: ['high3_record_board', 'high3_what_is_strength', 'high3_future_after_graduation', 'high3_before_final_stage', 'high3_no_regrets'],
}

function g1Wins(career) {
  return (career.history ?? []).flatMap((log) => log.races ?? (log.race ? [log.race] : [])).filter((race) => race.grade === 'G1' && race.won).length
}

export function materializeHighYear3Event(baseEvent, career) {
  if (baseEvent.id === 'high3_what_is_strength') {
    return {
      ...baseEvent,
      situation: '마지막 시즌을 앞두고, 코치와 함께 진정한 강함이 무엇인지 이야기를 나누었습니다.',
    }
  }
  if (baseEvent.id === 'high3_champion_pressure') {
    return { ...baseEvent, situation: g1Wins(career) >= 2 ? '이제 출전한다는 이유만으로 우승 후보로 지목되고 있습니다.' : '마지막 시즌이 시작됐지만 아직 모두가 인정하는 정상에는 오르지 못했습니다.' }
  }
  if (baseEvent.id === 'high3_record_board') {
    const ids = new Set(career.highYear2?.achievements?.map(({ id }) => id))
    const record = ids.has('CLASSIC_TRIPLE_CROWN') ? '클래식 삼관의 기록과 함께 자신의 이름이 빛나고 있습니다.' : ids.has('TRIPLE_TIARA') ? '트리플 티아라의 기록과 함께 자신의 이름이 빛나고 있습니다.' : '아직 역사적인 기록 한가운데 자신의 이름은 없습니다. 하지만 마지막 시즌은 아직 끝나지 않았습니다.'
    return { ...baseEvent, situation: record }
  }
  return baseEvent
}

export function pickHighYear3Event(career, turnNumber, rng = Math.random) {
  const completed = new Set(career.highSchoolState.completedEventIds)
  const candidates = HIGH_SCHOOL_YEAR3_EVENTS.filter(({ id }) => !completed.has(id))
  const favored = new Set(FAVORED_EVENT_IDS[turnNumber] ?? [])
  const weighted = candidates.flatMap((candidate) => favored.has(candidate.id) ? [candidate, candidate, candidate] : [candidate])
  return materializeHighYear3Event(weighted[Math.min(weighted.length - 1, Math.floor(rng() * weighted.length))], career)
}
