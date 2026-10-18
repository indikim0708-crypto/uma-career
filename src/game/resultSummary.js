import { HIGH_YEAR2_ROUTE_LABELS } from '../data/highSchoolYear2Races.js'
import { getMiddleSchoolById } from '../data/middleSchools.js'
import { getRunningStyle } from '../data/runningStyles.js'
import { MAX_STAT, STATS } from '../data/stats.js'
import { TEAM_BY_ID } from '../data/highSchoolTeams.js'

function chronologicalHistory(history = []) {
  return [...history].sort((a, b) => (a.turn ?? 0) - (b.turn ?? 0))
}

function collectRaces(history) {
  return chronologicalHistory(history).flatMap((entry) => {
    if (Array.isArray(entry.races)) return entry.races
    return entry.race ? [entry.race] : []
  }).filter((race) => race && race.result !== 'DECLINED')
}

export function getRaceGradeLabel(race) {
  const grade = race?.grade ?? race?.raceType
  return grade === 'DEBUT' || race?.raceType === 'DEBUT' ? 'DEBUT' : grade === 'G2' || race?.raceType === 'G2' ? 'G2' : 'G1'
}

export function isFirstG1Win(history, race) {
  const grade = race?.grade ?? race?.raceType
  const finishPosition = race?.finalPosition ?? race?.finishPosition
  if (grade !== 'G1' || finishPosition !== 1) return false
  return collectRaces(history).filter((previousRace) => {
    const previousGrade = previousRace.grade ?? previousRace.raceType
    const previousFinishPosition = previousRace.finalPosition ?? previousRace.finishPosition
    return previousGrade === 'G1' && previousFinishPosition === 1
  }).length === 0
}

function collectAchievements(career) {
  const byId = new Map()
  for (const achievement of [...(career.highYear2?.achievements ?? []), ...(career.highYear3?.achievements ?? [])]) {
    if (achievement?.id && !byId.has(achievement.id)) byId.set(achievement.id, achievement)
  }
  return [...byId.values()]
}

function collectLegends(history) {
  const byOccurrence = new Map()
  for (const entry of chronologicalHistory(history)) {
    const legend = entry.legendEvent
    if (!legend) continue
    const key = `${entry.turn ?? entry.periodLabel}-${legend.legendId ?? legend.eventId ?? legend.characterName}`
    if (!byOccurrence.has(key)) byOccurrence.set(key, {
      turn: entry.turn ?? null,
      periodLabel: entry.periodLabel ?? '',
      name: legend.characterName ?? legend.legendName ?? 'LEGEND',
      title: legend.title ?? '',
      quote: legend.quote ?? '',
    })
  }
  return [...byOccurrence.values()]
}

function collectTeamCareer(career) {
  const result = []
  for (const entry of career.teamState?.history ?? []) {
    const teamId = entry.type === 'TEAM_JOIN' ? entry.teamId : entry.type === 'TEAM_TRANSFER' ? entry.toTeamId : null
    if (!teamId) continue
    const previous = result.at(-1)
    if (previous?.teamId === teamId) continue
    const turn = entry.turn ?? entry.beforeTurn ?? null
    result.push({ teamId, teamName: TEAM_BY_ID[teamId]?.name ?? entry.teamName ?? teamId, turn, periodLabel: turn ? `TURN ${turn}` : '' })
  }
  return result
}

function collectCareerPath(career, middleSchool) {
  const acceptedTransfers = chronologicalHistory(career.history).filter((entry) => entry.kind === 'TRANSFER' && entry.accepted)
  const initialElementary = acceptedTransfers[0]?.fromSchoolName ?? career.school?.name
  const path = [career.region?.name, initialElementary].filter(Boolean)
  for (const transfer of acceptedTransfers) {
    if (path.at(-1) !== transfer.destinationSchoolName) path.push(transfer.destinationSchoolName)
  }
  if (career.school?.name && path.at(-1) !== career.school.name) path.push(career.school.name)
  if (middleSchool?.displayName) path.push(middleSchool.displayName)
  if (career.highSchoolState || career.highSchoolAdmission?.accepted) path.push('중앙 트레센 학원 고등부')
  if (career.complete && !career.badEnding && !career.nonRacerEnding) path.push('졸업')
  return path
}

function collectSchoolHistory(career, middleSchool) {
  const acceptedTransfers = chronologicalHistory(career.history).filter((entry) => entry.kind === 'TRANSFER' && entry.accepted)
  const elementary = [acceptedTransfers[0]?.fromSchoolName ?? career.school?.name].filter(Boolean)
  for (const transfer of acceptedTransfers) {
    if (elementary.at(-1) !== transfer.destinationSchoolName) elementary.push(transfer.destinationSchoolName)
  }
  if (career.school?.name && elementary.at(-1) !== career.school.name) elementary.push(career.school.name)
  return {
    elementary,
    middle: middleSchool?.displayName ?? career.middleState?.schoolName ?? null,
    high: career.highSchoolState || career.highSchoolAdmission?.accepted ? '중앙 트레센 학원 고등부' : null,
  }
}

function collectNotes(career) {
  const notes = []
  const distanceChange = (career.history ?? []).find((entry) => entry.id === 'middle_distance_change' && entry.changed)
  if (distanceChange) notes.push({ label: '거리 전향', value: `${distanceChange.previousGrowthTypeName} → ${distanceChange.selectedGrowthTypeName}` })
  if (career.highYear2?.route) notes.push({ label: '고2 목표', value: HIGH_YEAR2_ROUTE_LABELS[career.highYear2.route] ?? career.highYear2.route })
  if (career.highYear2?.derbyDecisionResolved) notes.push({ label: '일본 더비', value: career.highYear2.enteredJapanDerby ? '도전' : '미출전' })
  const style = getRunningStyle(career.runningStyle)
  if (style) notes.push({ label: '각질', value: style.label })
  return notes
}

function buildEnding(career) {
  if (career.badEnding) return { type: 'BAD END', title: career.badEnding.title, detail: career.badEnding.body }
  if (career.nonRacerEnding) return { type: 'ANOTHER PATH', title: career.nonRacerEnding.title, career: career.nonRacerEnding.career ?? null, detail: career.nonRacerEnding.body ?? career.nonRacerEnding.career }
  return { type: 'ENDING', title: '중앙 트레센 학원 고등부 졸업', detail: career.notice || '24턴의 커리어를 완주했습니다.' }
}

export function buildCareerResultSummary(career) {
  const middleSchool = getMiddleSchoolById(career.middleState?.schoolId)
  const careerPath = collectCareerPath(career, middleSchool)
  const schoolHistory = collectSchoolHistory(career, middleSchool)
  const races = collectRaces(career.history)
  const raceRecords = races
    .filter((race) => ['DEBUT', 'G2', 'G1'].includes(getRaceGradeLabel(race)) && Number.isFinite(race.finalPosition ?? race.finishPosition))
    .map((race) => ({
      raceId: race.raceId,
      raceName: race.raceName,
      grade: getRaceGradeLabel(race),
      finalPosition: race.finalPosition ?? race.finishPosition,
      turn: race.turn,
      isDebut: getRaceGradeLabel(race) === 'DEBUT',
    }))
  const g1Results = races.filter((race) => race.grade === 'G1' || race.raceType === 'G1')
  const teamCareer = collectTeamCareer(career)
  const runningStyle = getRunningStyle(career.runningStyle)
  return {
    profile: {
      fullName: career.fullName,
      region: career.region?.name ?? '-',
      elementarySchool: careerPath[1] ?? career.school?.name ?? '-',
      middleSchool: middleSchool?.displayName ?? career.middleState?.schoolName ?? null,
      highSchool: career.highSchoolState || career.highSchoolAdmission?.accepted ? '중앙 트레센 학원 고등부' : null,
      growthType: career.growthType?.name ?? '-',
      runningStyle: runningStyle?.label ?? null,
      finalTeam: TEAM_BY_ID[career.teamState?.currentTeamId]?.name ?? null,
    },
    finalStats: STATS.map(({ id, label }) => ({ id, label, value: career.stats?.[id] ?? 0, maximum: MAX_STAT })),
    schoolHistory,
    careerPath,
    teamCareer,
    races,
    raceRecords,
    raceSummary: {
      starts: races.length,
      wins: races.filter((race) => race.finishPosition === 1 || race.won).length,
      g1Starts: g1Results.length,
      g1Wins: g1Results.filter((race) => race.finishPosition === 1 || race.won).length,
      g1Top3: g1Results.filter((race) => race.finishPosition >= 1 && race.finishPosition <= 3).length,
    },
    g1Results,
    majorWins: g1Results.filter((race) => race.finishPosition === 1 || race.won),
    achievements: collectAchievements(career),
    legends: collectLegends(career.history),
    notes: collectNotes(career),
    ending: buildEnding(career),
  }
}
