export function randomIndex(length, rng = Math.random) {
  return Math.floor(rng() * length)
}

export function weightedPick(weights, rng = Math.random) {
  const roll = rng()
  let cumulative = 0

  for (const [value, weight] of Object.entries(weights)) {
    cumulative += weight
    if (roll < cumulative) return value
  }

  return Object.keys(weights).at(-1)
}

export function bellCurveScore(rng = Math.random) {
  const samples = 6
  let total = 0
  for (let index = 0; index < samples; index += 1) total += rng()
  return Math.max(0, Math.min(100, Math.round((total / samples) * 100)))
}
