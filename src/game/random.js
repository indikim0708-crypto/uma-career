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

export function randomInt(minimum, maximum, rng = Math.random) {
  return Math.floor(rng() * (maximum - minimum + 1)) + minimum
}

// Potential is deliberately tiered rather than bell-curved so exceptional
// careers remain uncommon but can occur at the intended rate.
export function generatePotential(rng = Math.random) {
  const roll = rng() * 100

  if (roll < 10) return randomInt(0, 19, rng)
  if (roll < 30) return randomInt(20, 39, rng)
  if (roll < 60) return randomInt(40, 59, rng)
  if (roll < 90) return randomInt(60, 79, rng)
  if (roll < 97) return randomInt(80, 94, rng)
  return randomInt(95, 100, rng)
}
