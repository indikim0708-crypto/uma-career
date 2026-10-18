export const HIGH_SCHOOL_POTENTIAL_MULTIPLIERS = {
  LOW: 0.55,
  LOWER_MIDDLE: 0.70,
  MIDDLE: 0.85,
  UPPER_MIDDLE: 1.00,
  HIGH: 1.10,
  ELITE: 1.20,
}

export function getHighSchoolPotentialMultiplier(potential) {
  if (potential < 20) return HIGH_SCHOOL_POTENTIAL_MULTIPLIERS.LOW
  if (potential < 40) return HIGH_SCHOOL_POTENTIAL_MULTIPLIERS.LOWER_MIDDLE
  if (potential < 60) return HIGH_SCHOOL_POTENTIAL_MULTIPLIERS.MIDDLE
  if (potential < 80) return HIGH_SCHOOL_POTENTIAL_MULTIPLIERS.UPPER_MIDDLE
  if (potential < 95) return HIGH_SCHOOL_POTENTIAL_MULTIPLIERS.HIGH
  return HIGH_SCHOOL_POTENTIAL_MULTIPLIERS.ELITE
}

export function scaleHighSchoolStatChanges(statChanges, potential) {
  const multiplier = getHighSchoolPotentialMultiplier(potential)
  return Object.fromEntries(Object.entries(statChanges ?? {}).map(([id, amount]) => [id, amount > 0 ? amount * multiplier : amount]))
}
