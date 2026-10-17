export const RUNNING_STYLES = [
  { id: 'NIGE', label: '도주', description: '초반부터 선두를 잡고 자신의 페이스로 레이스를 이끕니다.', abilities: '스피드 / 스태미나 / 지능', resultText: '앞에서 레이스를 이끄는 도주 스타일을 선택했습니다.' },
  { id: 'SENKO', label: '선행', description: '선두권 바로 뒤에서 좋은 위치를 유지하다가 적절한 순간에 승부합니다.', abilities: '스피드 / 파워 / 지능', resultText: '선두권에서 기회를 노리는 선행 스타일을 선택했습니다.' },
  { id: 'SASHI', label: '선입', description: '중단에서 힘을 아끼며 달리다가 후반부터 추월을 시작합니다.', abilities: '파워 / 지능 / 근성', resultText: '중단에서 후반 승부를 노리는 선입 스타일을 선택했습니다.' },
  { id: 'OIKOMI', label: '추입', description: '후방에서 기다리다가 마지막 구간에서 강하게 추격합니다.', abilities: '파워 / 근성 / 지능', resultText: '후방에서 마지막 추격을 노리는 추입 스타일을 선택했습니다.' },
]

export function getRunningStyle(id) {
  return RUNNING_STYLES.find((style) => style.id === id)
}
