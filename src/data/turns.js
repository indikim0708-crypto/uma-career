const elementary = Array.from({ length: 6 }, (_, index) => ({
  stage: '초등부',
  label: `초등부 ${index + 1}학년`,
  baseGrowth: 1,
  bonusPoints: 2,
}))

const middle = Array.from({ length: 6 }, (_, index) => ({
  stage: '중등부',
  label: `중등부 ${Math.floor(index / 2) + 1}학년 ${index % 2 === 0 ? '상반기' : '하반기'}`,
  baseGrowth: 2,
  bonusPoints: 3,
}))

const high = Array.from({ length: 12 }, (_, index) => ({
  stage: '고등부',
  label: `고등부 ${Math.floor(index / 4) + 1}학년 ${(index % 4) + 1}분기`,
  baseGrowth: 2,
  bonusPoints: 4,
}))

export const TURNS = [...elementary, ...middle, ...high].map((turn, index) => ({
  ...turn,
  number: index + 1,
}))
