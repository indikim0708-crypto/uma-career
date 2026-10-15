import { ALL_ELEMENTARY_SCHOOLS, getElementarySchoolById } from '../data/schools.js'
import { initializeTransferredSchoolEvents, randomChoice } from './eventScheduler.js'

const noTransfer = (eligible = false) => ({
  eligible,
  scheduled: false,
  grade: null,
  destinationSchoolId: null,
  offered: false,
  resolved: false,
  accepted: false,
  previousSchoolId: null,
})

export function getCentralTracenChance(potential) {
  if (potential >= 95) return 0.5
  if (potential >= 90) return 0.25
  if (potential >= 80) return 0.1
  return 0
}

export function chooseTransferDestination(career, rng = Math.random) {
  const currentSchool = career.school
  if (!currentSchool || currentSchool.id === 'central_tracen') return null

  if (rng() < getCentralTracenChance(career.potential)) {
    return getElementarySchoolById('central_tracen')
  }

  const candidates = ALL_ELEMENTARY_SCHOOLS.filter((school) => (
    school.id !== currentSchool.id
    && school.id !== 'central_tracen'
    && !school.transferOnly
    && school.tier > currentSchool.tier
  ))
  return candidates.length ? randomChoice(candidates, rng) : null
}

export function initializeTransferState(career, rng = Math.random) {
  const eligible = career.potential > 70 && career.school.id !== 'central_tracen'
  if (!eligible || rng() >= 0.5) return noTransfer(eligible)

  const destination = chooseTransferDestination(career, rng)
  if (!destination) return noTransfer(eligible)

  return {
    ...noTransfer(true),
    scheduled: true,
    grade: randomChoice([2, 3, 4], rng),
    destinationSchoolId: destination.id,
  }
}

export function isTransferOfferDue(career, grade = career.turnIndex + 1) {
  const transfer = career.transferState
  return Boolean(
    transfer?.scheduled
    && !transfer.offered
    && !transfer.resolved
    && transfer.grade === grade,
  )
}

export function markTransferOffered(career) {
  if (!isTransferOfferDue(career)) return career
  return { ...career, transferState: { ...career.transferState, offered: true } }
}

function createTransferHistory(career, fromSchool, destination, accepted) {
  return {
    kind: 'TRANSFER',
    turn: career.turnIndex + 1,
    periodLabel: `초등부 ${career.turnIndex + 1}학년`,
    fromSchoolId: fromSchool.id,
    fromSchoolName: fromSchool.name,
    destinationSchoolId: destination.id,
    destinationSchoolName: destination.name,
    selectedChoiceText: accepted ? '새로운 환경에 도전한다' : '현재 학교에 남는다',
    accepted,
    specialTransfer: destination.id === 'central_tracen',
  }
}

export function resolveTransferDecision(career, accepted, rng = Math.random) {
  const transfer = career.transferState
  if (!transfer?.offered || transfer.resolved) return career
  const destination = getElementarySchoolById(transfer.destinationSchoolId)
  if (!destination) return career

  const fromSchool = career.school
  const transferState = {
    ...transfer,
    resolved: true,
    accepted,
    previousSchoolId: accepted ? fromSchool.id : null,
  }
  let next = { ...career, transferState }

  if (accepted) {
    next = {
      ...next,
      school: destination,
      elementaryEventState: initializeTransferredSchoolEvents(
        career.elementaryEventState,
        destination.id,
        career.turnIndex + 1,
        rng,
      ),
    }
  }

  const transferHistory = createTransferHistory(next, fromSchool, destination, accepted)
  return { ...next, history: [transferHistory, ...(next.history ?? [])] }
}
