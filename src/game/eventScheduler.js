import { ELEMENTARY_COMMON_EVENTS } from '../data/elementaryEvents.js'
import { ELEMENTARY_SCHOOL_EVENTS, SIGNATURE_EVENT_IDS } from '../data/schoolEvents.js'

export const SPECIAL_ELEMENTARY_SCHOOLS = Object.keys(SIGNATURE_EVENT_IDS)

export function randomChoice(items, rng = Math.random) {
  return items[Math.floor(rng() * items.length)]
}

export function isSpecialElementarySchool(schoolId) {
  return SPECIAL_ELEMENTARY_SCHOOLS.includes(schoolId)
}

export function getEventById(eventId) {
  return [...ELEMENTARY_COMMON_EVENTS, ...ELEMENTARY_SCHOOL_EVENTS].find(({ id }) => id === eventId) ?? null
}

export function getSignatureEventForSchool(schoolId) {
  return getEventById(SIGNATURE_EVENT_IDS[schoolId])
}

export function scheduleSignatureEvent(schoolId, rng = Math.random, possibleGrades = [3, 4, 5, 6], guaranteed = false) {
  const empty = { signatureScheduled: false, signatureEventId: null, signatureGrade: null, signatureTriggered: false }
  if (!isSpecialElementarySchool(schoolId) || (!guaranteed && rng() >= 0.3)) return empty

  return {
    signatureScheduled: true,
    signatureEventId: SIGNATURE_EVENT_IDS[schoolId],
    signatureGrade: randomChoice(possibleGrades, rng),
    signatureTriggered: false,
  }
}

export function initializeTransferredSchoolEvents(previousState, schoolId, currentGrade, rng = Math.random) {
  const possibleGrades = Array.from({ length: 7 - currentGrade }, (_, index) => currentGrade + index)
  const signature = scheduleSignatureEvent(schoolId, rng, possibleGrades, schoolId === 'central_tracen')
  return {
    ...previousState,
    schoolEventCount: 0,
    ...signature,
    pendingEvent: null,
    pendingOutcome: null,
  }
}

export function createElementaryEventState(schoolId, rng = Math.random) {
  return {
    completedEventIds: [],
    schoolEventCount: 0,
    ...scheduleSignatureEvent(schoolId, rng),
    pendingEvent: null,
    pendingOutcome: null,
  }
}

export function getSchoolEventChance(schoolEventCount) {
  if (schoolEventCount === 0) return 0.25
  if (schoolEventCount === 1) return 0.15
  return 0
}

export function canRollRegularSchoolEvent(career, currentGrade) {
  const state = career.elementaryEventState
  if (!isSpecialElementarySchool(career.school.id) || state.schoolEventCount >= 2) return false
  return !(
    state.signatureScheduled
    && !state.signatureTriggered
    && state.signatureGrade > currentGrade
    && state.schoolEventCount >= 1
  )
}

export function getEligibleCommonEvents(career) {
  return ELEMENTARY_COMMON_EVENTS.filter(({ id }) => !career.elementaryEventState.completedEventIds.includes(id))
}

export function getEligibleSchoolEvents(career, { excludeSignature = false } = {}) {
  return ELEMENTARY_SCHOOL_EVENTS.filter((event) => (
    event.schoolId === career.school.id
    && !(excludeSignature && event.type === 'SIGNATURE')
    && !career.elementaryEventState.completedEventIds.includes(event.id)
  ))
}

export function getElementaryEvent(career, grade, rng = Math.random) {
  const state = career.elementaryEventState
  if (state.signatureScheduled && !state.signatureTriggered && state.signatureGrade === grade) {
    return getEventById(state.signatureEventId)
  }

  if (grade === 6 && isSpecialElementarySchool(career.school.id) && state.schoolEventCount === 0) {
    const schoolEvents = getEligibleSchoolEvents(career, { excludeSignature: true })
    if (schoolEvents.length) return randomChoice(schoolEvents, rng)
  }

  if (canRollRegularSchoolEvent(career, grade) && rng() < getSchoolEventChance(state.schoolEventCount)) {
    const schoolEvents = getEligibleSchoolEvents(career, { excludeSignature: true })
    if (schoolEvents.length) return randomChoice(schoolEvents, rng)
  }

  const commonEvents = getEligibleCommonEvents(career)
  return randomChoice(commonEvents.length ? commonEvents : ELEMENTARY_COMMON_EVENTS, rng)
}
