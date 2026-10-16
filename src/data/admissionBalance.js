export const ADMISSION_BALANCE = {
  ability: {
    overall: { minimumTotal: 75, range: 45, maximum: 35 },
    specialty: { minimumTopTwoAverage: 18, range: 17, maximum: 20 },
  },
  potentialMultiplier: 0.25,
  schoolHistoryBase: {
    GENERAL: 2,
    ELITE: 6,
    TOP: 10,
    CENTRAL_TRACEN: 14,
  },
  centralChanceBands: [
    { below: 40, chance: 0.15 },
    { below: 50, chance: 0.30 },
    { below: 60, chance: 0.45 },
    { below: 70, chance: 0.60 },
    { below: 80, chance: 0.75 },
    { below: 90, chance: 0.90 },
    { below: Infinity, chance: 0.97 },
  ],
  fallbackMiddleChanceBands: [
    { below: 40, middle: 0.20 },
    { below: 50, middle: 0.40 },
    { below: 60, middle: 0.70 },
    { below: 70, middle: 0.90 },
    { below: Infinity, middle: 1 },
  ],
  centralElementaryMinimumChance: 0.90,
  HIGH_SCHOOL_ADMISSION: {
    overall: { minimumTotal: 200, range: 80, maximum: 55 },
    specialty: { minimum: 35, range: 30, maximum: 35 },
    centralMiddleBonus: 10,
    chanceBands: [
      { below: 40, chance: 0.05 },
      { below: 50, chance: 0.20 },
      { below: 60, chance: 0.40 },
      { below: 70, chance: 0.65 },
      { below: 80, chance: 0.85 },
      { below: 90, chance: 0.95 },
      { below: Infinity, chance: 0.99 },
    ],
  },
}
