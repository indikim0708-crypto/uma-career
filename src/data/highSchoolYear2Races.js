export const HIGH_YEAR2_RACES = {
  nhk_mile_cup: { raceId: 'nhk_mile_cup', raceName: 'NHK 마일 컵', distance: '1600m', grade: 'G1' },
  satsuki_sho: { raceId: 'satsuki_sho', raceName: '사츠키상', distance: '2000m', grade: 'G1' },
  japan_derby: { raceId: 'japan_derby', raceName: '일본 더비', distance: '2400m', grade: 'G1' },
  oka_sho: { raceId: 'oka_sho', raceName: '벚꽃상', distance: '1600m', grade: 'G1' },
  oaks: { raceId: 'oaks', raceName: '오크스', distance: '2400m', grade: 'G1' },
  sprinters_stakes: { raceId: 'sprinters_stakes', raceName: '스프린터즈 스테이크스', distance: '1200m', grade: 'G1' },
  mile_championship: { raceId: 'mile_championship', raceName: '마일 챔피언십', distance: '1600m', grade: 'G1' },
  kikuka_sho: { raceId: 'kikuka_sho', raceName: '국화상', distance: '3000m', grade: 'G1' },
  shuka_sho: { raceId: 'shuka_sho', raceName: '추화상', distance: '2000m', grade: 'G1' },
}

export const HIGH_YEAR2_ROUTE_LABELS = {
  SPRINT: '스프린트 노선',
  MILE: '마일 노선',
  CLASSIC_TRIPLE: '클래식 삼관 도전',
  TRIPLE_TIARA: '트리플 티아라 도전',
  LONG: '장거리 노선',
}

export const TURN18_RACES = {
  SPRINT: [],
  MILE: ['nhk_mile_cup'],
  CLASSIC_TRIPLE: ['satsuki_sho', 'japan_derby'],
  TRIPLE_TIARA: ['oka_sho', 'oaks'],
  LONG: [],
}

export const TURN20_RACES = {
  SPRINT: ['sprinters_stakes'],
  MILE: ['mile_championship'],
  CLASSIC_TRIPLE: ['kikuka_sho'],
  TRIPLE_TIARA: ['shuka_sho'],
  LONG: ['kikuka_sho'],
}
