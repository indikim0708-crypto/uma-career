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
const event = (id, name, focus = 'intelligence', secondary = 'grit') => ({
  id,
  stage: 'HIGH',
  type: 'HIGH_YEAR3_COMMON',
  name,
  situation: `${name}을 맞아 코치와 마지막 시즌의 방향을 고민했습니다.`,
  choices: [
    choice('a', '정면으로 부딪친다', focus, secondary),
    choice('b', '차분하게 해법을 찾는다', 'intelligence', focus),
    choice('c', '몸의 감각을 믿는다', secondary, 'stamina'),
  ],
})

export const HIGH_SCHOOL_YEAR3_EVENTS = [
  event('high3_last_season', '마지막 시즌', 'grit', 'speed'),
  event('high3_champion_pressure', '챔피언의 무게', 'grit', 'intelligence'),
  event('high3_challenger_arrives', '왕좌를 노리는 도전자', 'speed', 'grit'),
  event('high3_perfect_race', '완벽한 레이스란 무엇인가', 'intelligence', 'speed'),
  event('high3_body_management', '몸을 관리하는 것도 실력', 'stamina', 'intelligence'),
  event('high3_small_warning', '몸이 보내는 작은 경고', 'stamina', 'grit'),
  event('high3_race_instinct', '머리보다 먼저 움직인 몸', 'power', 'speed'),
  event('high3_tactical_variation', '하나의 작전만으로는 부족하다', 'intelligence', 'power'),
  event('high3_bad_matchup', '상성이 나쁜 상대', 'power', 'intelligence'),
  event('high3_distance_challenge', '주력 거리 밖의 도전', 'stamina', 'speed'),
  event('high3_junior_question', '후배의 질문', 'intelligence', 'grit'),
  event('high3_pair_with_junior', '후배와의 병주', 'speed', 'power'),
  event('high3_fans_waiting', '기다리는 팬들', 'grit', 'intelligence'),
  event('high3_media_attention', '늘어난 카메라', 'intelligence', 'grit'),
  event('high3_record_board', '기록판에 남은 이름', 'grit', 'speed'),
  event('high3_what_is_strength', '강함이란 무엇인가', 'power', 'grit'),
  event('high3_last_camp', '마지막 여름 합숙', 'stamina', 'power'),
  event('high3_future_after_graduation', '졸업 이후의 이야기', 'intelligence', 'grit'),
  event('high3_before_final_stage', '마지막 무대를 앞두고', 'speed', 'intelligence'),
  event('high3_no_regrets', '후회 없는 마지막까지', 'grit', 'stamina'),
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
