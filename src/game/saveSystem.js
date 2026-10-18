import { TURNS } from '../data/turns.js'

export const CAREER_SAVE_KEY = 'uma-career-save-v1'
export const CAREER_SAVE_SCHEMA_VERSION = 1

const SAVEABLE_SCREENS = new Set(['NAME_ENTRY', 'ORIGIN', 'GROWTH_PLAN', 'CHARACTER_SELECT', 'CAREER', 'RESULT'])
const STAT_IDS = ['speed', 'stamina', 'power', 'grit', 'intelligence']

function browserStorage() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch (error) {
    console.warn('UMA CAREER localStorage is unavailable.', error)
    return null
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function validCareer(career, screen) {
  if (career === null) return screen === 'NAME_ENTRY'
  if (!isObject(career) || typeof career.fullName !== 'string') return false
  if (!isObject(career.stats) || !STAT_IDS.every((id) => Number.isFinite(career.stats[id]))) return false
  if (!Number.isInteger(career.turnIndex) || career.turnIndex < 0 || career.turnIndex >= TURNS.length) return false
  if (!Array.isArray(career.history) || !Array.isArray(career.logs)) return false
  if (screen === 'CAREER' && !isObject(career.growthType)) return false
  return true
}

export function validateSaveData(saveData) {
  if (!isObject(saveData) || saveData.schemaVersion !== CAREER_SAVE_SCHEMA_VERSION) return false
  if (!Number.isFinite(saveData.savedAt) || !isObject(saveData.summary) || !isObject(saveData.gameState)) return false
  const { screen, names, career, selectedType } = saveData.gameState
  if (!SAVEABLE_SCREENS.has(screen) || !isObject(names)) return false
  if (typeof names.lastName !== 'string' || typeof names.firstName !== 'string') return false
  if (selectedType !== null && typeof selectedType !== 'string') return false
  return validCareer(career, screen)
}

export function buildSaveSnapshot({ screen, names, career, selectedType = null }, now = Date.now()) {
  const normalizedScreen = career?.complete ? 'RESULT' : screen
  const turn = career && ['CAREER', 'RESULT'].includes(normalizedScreen) ? TURNS[career.turnIndex] : null
  return {
    schemaVersion: CAREER_SAVE_SCHEMA_VERSION,
    savedAt: now,
    summary: {
      fullName: career?.fullName ?? [names?.lastName, names?.firstName].filter(Boolean).join(' '),
      turn: turn?.number ?? null,
      periodLabel: turn?.label ?? '',
      stage: turn?.stage ?? '',
      growthType: career?.growthType?.id ?? null,
      runningStyle: career?.runningStyle ?? null,
      currentTeamId: career?.teamState?.currentTeamId ?? null,
      completed: Boolean(career?.complete),
    },
    gameState: {
      screen: normalizedScreen,
      names: { lastName: names?.lastName ?? '', firstName: names?.firstName ?? '' },
      career,
      selectedType,
    },
  }
}

export function saveCareerState(gameState, storage = browserStorage(), now = Date.now()) {
  if (!storage) return null
  try {
    const snapshot = buildSaveSnapshot(gameState, now)
    if (!validateSaveData(snapshot)) return null
    storage.setItem(CAREER_SAVE_KEY, JSON.stringify(snapshot))
    return snapshot
  } catch (error) {
    console.warn('UMA CAREER save failed.', error)
    return null
  }
}

export function loadCareerSave(storage = browserStorage()) {
  if (!storage) return null
  try {
    const raw = storage.getItem(CAREER_SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!validateSaveData(parsed)) {
      console.warn('UMA CAREER save is invalid or unsupported.')
      return null
    }
    return parsed
  } catch (error) {
    console.warn('UMA CAREER save could not be loaded.', error)
    return null
  }
}

export function hasCareerSave(storage = browserStorage()) {
  return Boolean(loadCareerSave(storage))
}

export function deleteCareerSave(storage = browserStorage()) {
  if (!storage) return false
  try {
    storage.removeItem(CAREER_SAVE_KEY)
    return true
  } catch (error) {
    console.warn('UMA CAREER save could not be deleted.', error)
    return false
  }
}
