export const PROGRESS_SPEED_PREFERENCE_KEY = 'uma-career-progress-speed-v1'

function browserStorage() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch (error) {
    console.warn('UMA CAREER localStorage is unavailable.', error)
    return null
  }
}

export function normalizeProgressSpeed(value) {
  return value === 2 ? 2 : 1
}

export function loadProgressSpeedPreference(storage = browserStorage()) {
  if (!storage) return 1
  try {
    return normalizeProgressSpeed(Number(storage.getItem(PROGRESS_SPEED_PREFERENCE_KEY)))
  } catch (error) {
    console.warn('UMA CAREER progress speed preference could not be loaded.', error)
    return 1
  }
}

export function saveProgressSpeedPreference(value, storage = browserStorage()) {
  const speed = normalizeProgressSpeed(value)
  if (!storage) return speed
  try {
    storage.setItem(PROGRESS_SPEED_PREFERENCE_KEY, String(speed))
  } catch (error) {
    console.warn('UMA CAREER progress speed preference could not be saved.', error)
  }
  return speed
}
