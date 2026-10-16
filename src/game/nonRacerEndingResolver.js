import { ANALYSIS_EVENT_IDS, HELPING_EVENT_IDS, NON_RACER_ENDINGS, TEAM_EVENT_IDS } from '../data/nonRacerEndings.js'

const statValues = (career) => Object.values(career.stats)
const isTop = (value, career) => value === Math.max(...statValues(career))
export function getNonRacerEventCounts(history = []) {
  const eventIds = history.map((entry) => entry.event?.eventId).filter(Boolean)
  return {
    analysis: eventIds.filter((id) => ANALYSIS_EVENT_IDS.has(id)).length,
    helping: eventIds.filter((id) => HELPING_EVENT_IDS.has(id)).length,
    team: eventIds.filter((id) => TEAM_EVENT_IDS.has(id)).length,
  }
}

export function resolveNonRacerEnding(career) {
  const { speed, stamina, power, grit, intelligence } = career.stats
  const counts = getNonRacerEventCounts(career.history)
  const average = statValues(career).reduce((sum, value) => sum + value, 0) / 5
  const spread = Math.max(...statValues(career)) - Math.min(...statValues(career))
  const centralMiddle = career.middleState?.schoolId === 'central_tracen_middle'
  const candidates = [
    intelligence >= 58 && isTop(intelligence, career) && ['RACE_ANALYST', intelligence * 1.5 + counts.analysis * 8],
    power >= 50 && grit >= 48 && intelligence >= 45 && ['TRAINER', power * 0.7 + grit * 0.7 + intelligence * 0.6 + counts.helping * 5],
    intelligence >= 55 && stamina >= 48 && ['SPORTS_SCIENTIST', intelligence * 1.1 + stamina * 0.8 + counts.analysis * 6],
    speed >= 60 && isTop(speed, career) && ['SPRINT_ATHLETE', speed * 1.5 + power * 0.5 + (['sprinter', 'miler'].includes(career.growthType.id) ? 5 : 0)],
    stamina >= 55 && grit >= 50 && ['ENDURANCE_ATHLETE', stamina * 1.2 + grit * 0.8 + (career.growthType.id === 'stayer' ? 5 : 0)],
    power >= 60 && isTop(power, career) && ['PHYSICAL_TRAINER', power * 1.5 + grit * 0.5],
    intelligence >= 50 && counts.analysis >= 2 && ['SPORTS_JOURNALIST', intelligence * 1.2 + counts.analysis * 8],
    grit >= 52 && intelligence >= 45 && ['PHYSICAL_EDUCATOR', grit * 0.9 + intelligence * 0.7 + counts.helping * 6],
    spread <= 20 && ['TRACEN_STAFF', average + (centralMiddle ? 10 : 5) + Math.min(counts.team * 2, 8)],
  ].filter(Boolean).map(([id, score]) => ({ ...NON_RACER_ENDINGS[id], score }))

  if (!candidates.length) return { ...NON_RACER_ENDINGS.ORDINARY_STUDENT, score: 0, counts, statsAverage: average, statSpread: spread }
  candidates.sort((a, b) => b.score - a.score || a.priority - b.priority)
  return { ...candidates[0], counts, statsAverage: average, statSpread: spread }
}
