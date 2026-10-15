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
