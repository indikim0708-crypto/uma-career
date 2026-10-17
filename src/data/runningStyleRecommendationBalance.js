export const TURN13_STAT_NORMS = {
  speed: { mean: 66.015355, sd: 9.496213 },
  stamina: { mean: 44.411185, sd: 9.182077 },
  power: { mean: 61.04975, sd: 10.328851 },
  grit: { mean: 47.23172, sd: 7.868115 },
  intelligence: { mean: 48.6291, sd: 6.537716 },
}

export const RUNNING_STYLE_RECOMMENDATION_BALANCE = {
  zScoreClamp: 2.5,
  frontBackDeadZone: 0.15,
  neutralRandomThreshold: 0.05,
  detailDeadZone: 0.12,
  growthTypeGroupBias: {
    sprinter: 0.10,
    miler: 0.05,
    router: -0.05,
    stayer: -0.05,
  },
  frontBackWeights: {
    front: { speed: 0.50, intelligence: 0.50 },
    back: { speed: 0.50, power: 0.50 },
  },
  detailWeights: {
    NIGE: { stamina: 0.45, intelligence: 0.35, speed: 0.20 },
    SENKO: { power: 0.40, speed: 0.35, intelligence: 0.25 },
    SASHI: { intelligence: 0.40, power: 0.30, speed: 0.30 },
    OIKOMI: { grit: 0.45, power: 0.35, speed: 0.20 },
  },
}

export const RUNNING_STYLE_RECOMMENDATION_REASONS = {
  NIGE: '동세대보다 스피드·지능·스태미나가 뛰어나 앞에서 페이스를 이끄는 주행에 적합합니다.',
  SENKO: '동세대보다 스피드와 지능이 좋고 선두권 경쟁에 필요한 파워를 갖추고 있습니다.',
  SASHI: '동세대보다 스피드와 파워가 뛰어나며 중단에서 움직일 판단력이 강점입니다.',
  OIKOMI: '동세대보다 스피드와 파워가 뛰어나고 후반 승부에 필요한 근성이 강점입니다.',
}
