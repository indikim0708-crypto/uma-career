export const GROWTH_TYPES = [
  {
    id: 'sprinter',
    name: '스프린터',
    distance: '단거리',
    description: '폭발적인 가속과 파워에 특화된 성장형',
    main: ['파워'],
    support: ['스피드'],
    weights: { power: 0.6, speed: 0.4 },
  },
  {
    id: 'miler',
    name: '마일러',
    distance: '마일 · 중거리',
    description: '빠른 순항 속도와 추진력을 함께 키우는 성장형',
    main: ['스피드'],
    support: ['파워'],
    weights: { speed: 0.6, power: 0.4 },
  },
  {
    id: 'router',
    name: '라우터',
    distance: '중거리 · 장거리',
    description: '속도를 중심으로 힘과 끈기를 고르게 기르는 성장형',
    main: ['스피드'],
    support: ['파워', '근성'],
    weights: { speed: 0.5, power: 0.25, grit: 0.25 },
  },
  {
    id: 'stayer',
    name: '스테이어',
    distance: '장거리',
    description: '장거리를 버티는 지구력과 근성에 특화된 성장형',
    main: ['스태미나', '근성'],
    support: ['스피드'],
    weights: { stamina: 0.4, grit: 0.4, speed: 0.2 },
  },
]

export function getGrowthType(id) {
  return GROWTH_TYPES.find((type) => type.id === id)
}
