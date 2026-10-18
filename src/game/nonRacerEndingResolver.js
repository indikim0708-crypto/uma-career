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

function getRankWeights(candidateCount) {
  if (candidateCount === 1) return [1]
  if (candidateCount === 2) return [0.6, 0.4]
  if (candidateCount === 3) return [0.5, 0.3, 0.2]
  if (candidateCount === 4) return [0.45, 0.3, 0.15, 0.1]
  return [0.4, 0.25, 0.15, 0.1, ...Array(candidateCount - 4).fill(0.1 / (candidateCount - 4))]
}

export function rankNonRacerEndingCandidates(candidates, rng = Math.random) {
  const scoreGroups = new Map()
  for (const candidate of candidates) {
    const group = scoreGroups.get(candidate.score) ?? []
    group.push(candidate)
    scoreGroups.set(candidate.score, group)
  }

  return [...scoreGroups.entries()]
    .sort(([left], [right]) => right - left)
    .flatMap(([, group]) => {
      const shuffled = [...group]
      for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(rng() * (index + 1))
        ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
      }
      return shuffled
    })
}

export function selectRankedNonRacerEnding(candidates, rng = Math.random) {
  const ranked = rankNonRacerEndingCandidates(candidates, rng)
  const weights = getRankWeights(ranked.length)
  const roll = rng()
  let cumulative = 0

  for (let index = 0; index < ranked.length; index += 1) {
    cumulative += weights[index]
    if (roll < cumulative || index === ranked.length - 1) {
      return { selected: ranked[index], ranked, weights }
    }
  }

  return { selected: ranked.at(-1), ranked, weights }
}

export function getNonRacerEndingCandidates(career) {
  const { speed, stamina, power, grit, intelligence } = career.stats
  const counts = getNonRacerEventCounts(career.history)
  const average = statValues(career).reduce((sum, value) => sum + value, 0) / 5
  const spread = Math.max(...statValues(career)) - Math.min(...statValues(career))
  const centralMiddle = career.middleState?.schoolId === 'central_tracen_middle'
  const candidates = [
    intelligence >= 40 && isTop(intelligence, career) && ['RACE_ANALYST', intelligence * 1.5 + counts.analysis * 8],
    power >= 45 && grit >= 40 && intelligence >= 32 && ['TRAINER', power * 0.7 + grit * 0.7 + intelligence * 0.6 + counts.helping * 5],
    intelligence >= 40 && stamina >= 35 && ['SPORTS_SCIENTIST', intelligence * 1.1 + stamina * 0.8 + counts.analysis * 6],
    speed >= 60 && isTop(speed, career) && ['SPRINT_ATHLETE', speed * 1.5 + power * 0.5 + (['sprinter', 'miler'].includes(career.growthType.id) ? 5 : 0)],
    stamina >= 55 && grit >= 50 && ['ENDURANCE_ATHLETE', stamina * 1.2 + grit * 0.8 + (career.growthType.id === 'stayer' ? 5 : 0)],
    power >= 60 && isTop(power, career) && ['PHYSICAL_TRAINER', power * 1.5 + grit * 0.5],
    intelligence >= 35 && counts.analysis >= 1 && ['SPORTS_JOURNALIST', intelligence * 1.2 + counts.analysis * 8],
    grit >= 45 && intelligence >= 32 && ['PHYSICAL_EDUCATOR', grit * 0.9 + intelligence * 0.7 + counts.helping * 6],
    centralMiddle && spread <= 20 && ['TRACEN_STAFF', average + 10 + Math.min(counts.team * 2, 8)],
    intelligence >= 35 && speed >= 35 && ['RACE_COMMENTATOR', intelligence * 1.15 + speed * 0.75 + counts.analysis * 8],
    intelligence >= 34 && (speed >= 45 || power >= 45) && ['SCOUT', intelligence * 0.9 + speed * 0.75 + power * 0.75 + (speed >= 45 && power >= 45 ? 8 : 0)],
    intelligence >= 34 && stamina >= 35 && ['SPORTS_NUTRITIONIST', intelligence * 1.2 + stamina],
    stamina >= 38 && grit >= 38 && intelligence >= 30 && ['REHAB_TRAINER', stamina + grit + intelligence * 0.6 + counts.helping * 5],
    power >= 42 && intelligence >= 34 && ['EQUIPMENT_DEVELOPER', power * 1.1 + intelligence * 1.1],
    spread <= 25 && ['RACE_OPERATIONS', average + Math.min(counts.team * 3, 9)],
    grit >= 45 && power >= 40 && ['ATHLETICS_COACH', grit + power * 0.95 + counts.helping * 6],
    speed >= 52 && stamina >= 42 && ['MIDDLE_DISTANCE_ATHLETE', speed + stamina * 0.8 + (career.growthType.id === 'router' ? 4 : 0)],
    intelligence >= 32 && (counts.analysis >= 1 || counts.team >= 1) && ['SPORTS_PHOTOGRAPHER', intelligence * 1.25 + counts.analysis * 8 + counts.team * 4],
    grit >= 40 && average >= 35 && ['LOCAL_SPORTS_INSTRUCTOR', grit * 0.8 + average + counts.helping * 6],
  ].filter(Boolean).map(([id, score]) => ({ ...NON_RACER_ENDINGS[id], score }))

  return { candidates, counts, statsAverage: average, statSpread: spread }
}

export function resolveNonRacerEnding(career, rng = Math.random) {
  const { candidates, counts, statsAverage, statSpread } = getNonRacerEndingCandidates(career)
  if (!candidates.length) return { ...NON_RACER_ENDINGS.ORDINARY_STUDENT, score: 0, counts, statsAverage, statSpread }
  const { selected } = selectRankedNonRacerEnding(candidates, rng)
  return { ...selected, counts, statsAverage, statSpread }
}
