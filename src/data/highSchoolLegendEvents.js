const portrait = (file) => `/assets/legends/${file}.png`
const legend = (legendId, characterName, title, file, situation, choiceText, statChanges, quote) => ({
  id: `high_legend_${legendId.toLowerCase()}`,
  legendId,
  stage: 'HIGH',
  type: 'HIGH_LEGEND',
  characterName,
  title,
  name: title,
  portrait: portrait(file),
  situation,
  quote,
  choices: [{ id: 'accept', text: choiceText }],
  statChanges,
})

export const HIGH_SCHOOL_LEGEND_EVENTS = [
  legend('SYMBOLI_RUDOLF', '심볼리 루돌프', '황제의 격언', 'symboli_rudolf', '훈련이 끝난 트랙에서 심볼리 루돌프가 당신을 불러 세웠습니다. 잠시 당신을 바라보던 황제가 조용히 입을 열었습니다. “새겨라. Eclipse first, the rest nowhere.” 정상에 서겠다면 아무도 따라오지 못할 만큼 앞서가라.', '새기겠습니다!', { speed: 10, stamina: 10, intelligence: 10 }, '“새겨라. Eclipse first, the rest nowhere.”'),
  legend('SILENCE_SUZUKA', '사일런스 스즈카', '누구도 없는 앞쪽으로', 'silence_suzuka', '사일런스 스즈카가 텅 빈 트랙의 가장 앞쪽을 바라보고 있습니다. “누군가보다 앞에 있고 싶은 게 아니야. 아무도 없는 곳까지 달리고 싶은 거야.”', '저도 그 풍경을 보고 싶습니다.', { speed: 12, stamina: 7, intelligence: 7 }, '“아무도 없는 곳까지 달리고 싶은 거야.”'),
  legend('SAKURA_BAKUSHIN_O', '사쿠라 바쿠신 오', '단 하나의 정답', 'sakura_bakushin_o', '사쿠라 바쿠신 오가 엄청난 기세로 손을 들어 올렸습니다. “고민할 필요 없습니다! 빠르게! 더 빠르게! 그리고 누구보다 먼저 결승선으로! 그것이야말로 정답입니다!”', '바쿠신하겠습니다!!', { speed: 12, power: 8, grit: 6 }, '“빠르게! 더 빠르게! 그리고 누구보다 먼저 결승선으로!”'),
  legend('TAIKI_SHUTTLE', '타이키 셔틀', '승부는 즐겁게!', 'taiki_shuttle', '타이키 셔틀이 당신의 등을 힘껏 두드렸습니다. “레이스 시작하기도 전에 그렇게 굳어 있으면 안 돼! 빠르게 달리고, 크게 웃고, 마지막에 이기면 되는 거야!”', '즐기면서 이기겠습니다!', { speed: 10, power: 8, intelligence: 7 }, '“빠르게 달리고, 크게 웃고, 마지막에 이기면 되는 거야!”'),
  legend('OGURI_CAP', '오구리 캡', '끝까지 달릴 수 있는 이유', 'oguri_cap', '오구리 캡이 훈련을 마친 당신을 조용히 바라봤습니다. “힘든가? 그래도 결승선은 없어지지 않는다. 그러니 나는 끝까지 달린다.”', '저도 끝까지 달리겠습니다.', { stamina: 9, power: 9, grit: 8 }, '“그래도 결승선은 없어지지 않는다.”'),
  legend('MEJIRO_MCQUEEN', '메지로 맥퀸', '장거리의 품격', 'mejiro_mcqueen', '메지로 맥퀸이 당신의 페이스를 한동안 지켜봤습니다. “긴 거리는 단순히 오래 달리는 경기가 아닙니다. 끝까지 자신을 통제할 수 있는 자만이 마지막 순간까지 흐트러지지 않고 달릴 수 있지요.”', '마지막까지 흐트러지지 않겠습니다.', { stamina: 12, intelligence: 8, grit: 6 }, '“끝까지 자신을 통제할 수 있어야 합니다.”'),
  legend('SUPER_CREEK', '슈퍼 크릭', '서두르지 않아도 괜찮아', 'super_creek', '슈퍼 크릭이 무리해서 훈련을 계속하려는 당신을 멈춰 세웠습니다. “강해지고 싶다는 마음은 알아요. 하지만 긴 레이스에서 중요한 건 마지막까지 달릴 힘을 남겨두는 거랍니다.”', '제 페이스를 잊지 않겠습니다.', { stamina: 10, grit: 8, intelligence: 7 }, '“마지막까지 달릴 힘을 남겨두는 거랍니다.”'),
  legend('GENTILDONNA', '젠틸돈나', '힘으로 증명하라', 'gentildonna', '젠틸돈나가 당신을 날카롭게 바라봅니다. “강하다고 말하는 것은 누구나 할 수 있어. 정말 강하다면 레이스에서 상대가 반박할 수 없도록 증명해.”', '누구도 부정할 수 없게 만들겠습니다.', { power: 12, grit: 8, speed: 6 }, '“레이스에서 상대가 반박할 수 없도록 증명해.”'),
  legend('ALMOND_EYE', '아몬드 아이', '모든 거리를 바라보는 눈', 'almond_eye', '아몬드 아이가 여러 코스의 레이스 영상을 차례로 넘겨봅니다. “거리도, 상대도, 전개도 매번 달라. 하나만 잘해서는 모든 무대를 이길 수 없어. 어디서든 달릴 수 있게 만들어.”', '어떤 무대에서도 통하는 선수가 되겠습니다.', { speed: 5, stamina: 5, power: 5, grit: 5, intelligence: 5 }, '“어디서든 달릴 수 있게 만들어.”'),
  legend('ORFEVRE', '오르페브르', '왕은 굴복하지 않는다', 'orfevre', '오르페브르가 당신의 이야기를 듣고 비웃듯 웃었습니다. “한 번 졌다고 고개를 숙이는 건가? 왕좌란 패배하지 않는 자의 것이 아니다. 패배 따위로 무릎 꿇지 않는 자의 것이다.”', '끝까지 굴복하지 않겠습니다.', { grit: 12, power: 9, speed: 6 }, '“패배 따위로 무릎 꿇지 않는 자의 것이다.”'),
]

export const HIGH_SCHOOL_LEGEND_BY_ID = Object.fromEntries(HIGH_SCHOOL_LEGEND_EVENTS.map((event) => [event.legendId, event]))
