export const CONDITIONS = ['최악', '저조', '보통', '양호', '최상']

export function getNextCondition(current, stability, rng = Math.random) {
  const currentIndex = CONDITIONS.indexOf(current)
  const stabilityRatio = stability / 100
  const stayChance = 0.35 + stabilityRatio * 0.55

  if (rng() < stayChance) return current

  const jumpChance = 0.15 + (1 - stabilityRatio) * 0.35
  const step = rng() < jumpChance ? 2 : 1
  let direction

  if (rng() < 0.5 + stabilityRatio * 0.35) {
    if (currentIndex < 2) direction = 1
    else if (currentIndex > 3) direction = -1
    else direction = rng() < 0.55 ? 1 : -1
  } else {
    direction = rng() < 0.5 ? -1 : 1
  }

  const nextIndex = Math.max(0, Math.min(CONDITIONS.length - 1, currentIndex + direction * step))
  return CONDITIONS[nextIndex]
}

export function getNaturalConditionWeights(stability) {
  if (stability >= 80) return { up: 0.15, stay: 0.70, down: 0.15 }
  if (stability >= 60) return { up: 0.20, stay: 0.60, down: 0.20 }
  if (stability >= 40) return { up: 0.25, stay: 0.50, down: 0.25 }
  if (stability >= 20) return { up: 0.30, stay: 0.40, down: 0.30 }
  return { up: 0.35, stay: 0.30, down: 0.35 }
}

export function rollNaturalConditionChange(stability, rng = Math.random) {
  const { up, stay } = getNaturalConditionWeights(stability)
  const roll = rng()
  if (roll < up) return 1
  if (roll < up + stay) return 0
  return -1
}
