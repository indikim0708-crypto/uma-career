const team = (id, rank, name, representative, file, trainingStyle, conditionCare, recoveryChance, minimumReputation, distribution, transferDialogue) => ({ id, rank, name, representative, portrait: `/assets/teams/${file}.png`, trainingStyle, conditionCare, recoveryChance, minimumReputation, distribution, transferDialogue })

export const HIGH_SCHOOL_TEAMS = [
  team('TEAM_ATTAKE', 1, '팀 앗타케', '나세', 'nase', '최정예 / 주능력 / 지능 / 약점 보완', '뛰어남', 30, 75, { PRIMARY: 40, intelligence: 30, LOWEST: 30 }, '“성적은 충분히 확인했습니다. 정상까지 갈 생각이 있다면, 앗타케로 오십시오.”'),
  team('TEAM_TURF_QUEENS', 2, '팀 터프퀸스', '마루젠스키', 'maruzen_sky', '스피드 / 파워 / 지능', '보통', 20, 45, { speed: 45, power: 30, intelligence: 25 }, '“요즘 너가 와따라며? 지금 팀도 나쁘진 않겠지만, 여기서 만족할 얼굴은 아닌 것 같은데. 더 쵸베리구한 무대에서 달려볼래?”'),
  team('TEAM_RIGIL', 3, '팀 리길', '에어 그루브', 'air_groove', '전술 / 지능 / 파워 / 스피드', '뛰어남', 30, 20, { intelligence: 40, power: 30, speed: 30 }, '“네 레이스를 지켜봤다. 더 높은 수준의 훈련을 원한다면, 리길로 와라.”'),
  team('TEAM_SPICA', 4, '팀 스피카', '스페셜 위크', 'special_week', '균형형 / 주능력 / 스피드 / 지능', '매우 뛰어남', 35, 0, { PRIMARY: 40, speed: 30, intelligence: 30 }, '“계속 지켜봤어요! 스피카에서 저희와 함께 더 높은 곳을 목표로 해보지 않을래요?”'),
  team('TEAM_SIRIUS', 5, '팀 시리우스', '골드 쉽', 'gold_ship', '스태미나 / 파워 / 근성', '다소 거침', 15, 0, { stamina: 35, power: 35, grit: 30 }, '“요즘 꽤 잘 나가더라? 시리우스로 와! 어디까지 버티나 제대로 달려보자고!”'),
  team('TEAM_CAPELLA', 6, '팀 카펠라', '사토노 다이아몬드', 'satono_diamond', '스태미나 / 지능 / 약점 보완', '매우 뛰어남', 40, 0, { stamina: 50, intelligence: 35, LOWEST: 15 }, '“지금까지의 노력이 정말 인상적이었어요. 카펠라에서 함께 다음 목표를 준비해보실래요?”'),
  team('TEAM_ASELLA', 7, '팀 아셀라', '킹 헤일로', 'king_halo', '근성 / 파워 / 지능', '보통', 25, 0, { grit: 45, power: 35, intelligence: 20 }, '“이제 제법 눈에 띄는군요. 일류를 목표로 한다면, 아셀라에서 제대로 배워보세요!”'),
  team('TEAM_CANOPUS', 8, '팀 카노푸스', '나이스 네이처', 'nice_nature', '약점 보완 / 근성 / 지능', '최상급', 45, 0, { LOWEST: 60, grit: 25, intelligence: 15 }, '“계속 보다 보니 응원하고 싶어지더라고. 괜찮다면 카노푸스에서 우리랑 같이 해볼래?”'),
]

export const TEAM_BY_ID = Object.fromEntries(HIGH_SCHOOL_TEAMS.map((entry) => [entry.id, entry]))
export const INITIAL_TEAM_IDS = ['TEAM_SPICA', 'TEAM_SIRIUS', 'TEAM_CAPELLA', 'TEAM_ASELLA', 'TEAM_CANOPUS']
export const TEAM_TRANSFER_CHECKPOINTS = { 17: 'beforeTurn17', 21: 'beforeTurn21', 24: 'beforeTurn24' }

export const TEAM_SUPPORT_MESSAGES = {
  TEAM_ATTAKE: '나세가 훈련량과 회복 상태를 세밀하게 조정했습니다.',
  TEAM_TURF_QUEENS: '마루젠스키가 오늘은 조금 속도를 내려도 괜찮다고 말했습니다.',
  TEAM_RIGIL: '에어 그루브가 몸 상태를 확인하고 훈련 계획을 다시 조정했습니다.',
  TEAM_SPICA: '팀원들과 시간을 보내는 동안 긴장이 조금 풀렸습니다.',
  TEAM_SIRIUS: '골드 쉽에게 끌려다니다 보니 이상하게 몸이 가벼워졌습니다.',
  TEAM_CAPELLA: '사토노 다이아몬드가 차분하게 휴식을 권했습니다.',
  TEAM_ASELLA: '킹 헤일로가 컨디션 관리 역시 일류의 의무라고 강조했습니다.',
  TEAM_CANOPUS: '나이스 네이처와 느긋하게 시간을 보내며 마음이 편해졌습니다.',
}
