export const RACE_BALANCE = {
  debutChanceBands: [{ below: 40, chance: 0.45 }, { below: 45, chance: 0.55 }, { below: 50, chance: 0.65 }, { below: 55, chance: 0.72 }, { below: 60, chance: 0.78 }, { below: 65, chance: 0.83 }, { below: Infinity, chance: 0.88 }],
  g1WinChanceBands: [{ below: 45, chance: 0.15 }, { below: 50, chance: 0.20 }, { below: 55, chance: 0.30 }, { below: 60, chance: 0.35 }, { below: 65, chance: 0.40 }, { below: 70, chance: 0.50 }, { below: 75, chance: 0.60 }, { below: 80, chance: 0.70 }, { below: Infinity, chance: 0.80 }],
}

export const POSITION_KEEP_RANGES = {
  NIGE: [1, 2],
  SENKO: [3, 5],
  SASHI: [6, 9],
  OIKOMI: [10, 12],
}

export const RUNNING_STYLE_WEIGHTS = {
  NIGE: { speed: .35, stamina: .25, intelligence: .25, power: .10, grit: .05 },
  SENKO: { speed: .30, power: .25, intelligence: .25, stamina: .15, grit: .05 },
  SASHI: { power: .30, intelligence: .30, speed: .20, grit: .15, stamina: .05 },
  OIKOMI: { power: .25, grit: .25, intelligence: .30, speed: .15, stamina: .05 },
}

export const POSITION_KEEP_WEIGHTS = { speed: .25, stamina: .15, power: .10, grit: .05, intelligence: .45 }

export const DISTANCE_WEIGHTS = {
  1200: { speed: .35, power: .30, intelligence: .20, grit: .10, stamina: .05 },
  1600: { speed: .32, power: .25, intelligence: .20, stamina: .13, grit: .10 },
  2000: { speed: .28, power: .22, intelligence: .20, stamina: .18, grit: .12 },
  2400: { speed: .25, stamina: .25, power: .18, intelligence: .18, grit: .14 },
  3000: { stamina: .32, speed: .20, grit: .18, intelligence: .17, power: .13 },
}

export const PHASE_WEIGHTS = {
  MIDDLE: { intelligence: .35, speed: .25, stamina: .20, power: .15, grit: .05 },
  FINAL_CORNER: { power: .30, speed: .25, intelligence: .20, stamina: .15, grit: .10 },
  FINAL_STRAIGHT: { speed: .30, power: .25, stamina: .20, grit: .20, intelligence: .05 },
}

export const CONDITION_MODIFIERS = { 최상: 4, 양호: 2, 보통: 0, 저조: -3, 최악: -6 }
export const REQUIRED_STAMINA = { 1200: 24, 1600: 32, 2000: 40, 2400: 48, 3000: 58 }
export const STYLE_BASE_SHIFTS = {
  MIDDLE: { NIGE: 0, SENKO: 0, SASHI: 0, OIKOMI: 0 },
  FINAL_CORNER: { NIGE: 1, SENKO: 0, SASHI: -1, OIKOMI: -2 },
  FINAL_STRAIGHT: { NIGE: 2, SENKO: 1, SASHI: -2, OIKOMI: -4 },
}

export const FIELD_STRENGTH_RANGES = {
  DEBUT: [55, 65],
  HIGH_YEAR1_G1: [75, 85],
  HIGH_YEAR2_G1: [85, 100],
  HIGH_YEAR3_G1: [95, 110],
  TOP_G1: [105, 120],
  EARLY_G2: [65, 75],
  LATE_G2: [75, 90],
  STAYER_PREP_G2: [80, 90],
}
