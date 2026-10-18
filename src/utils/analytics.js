const MEASUREMENT_ID = 'G-34679N411E'

// Add a custom domain here when it becomes the public production address.
export const ANALYTICS_ALLOWED_HOSTS = new Set(['uma-career.vercel.app'])

function canonicalId(value, fallback = 'NONE') {
  return value ? String(value).toUpperCase() : fallback
}

function isAllowedHost() {
  if (typeof window === 'undefined') return false
  return ANALYTICS_ALLOWED_HOSTS.has(window.location.hostname.toLowerCase())
}

function collectRecordedRaces(career) {
  return (career.history ?? []).flatMap((entry) => Array.isArray(entry.races) ? entry.races : entry.race ? [entry.race] : [])
    .filter((race) => race && race.result !== 'DECLINED')
}

export function initializeAnalytics() {
  if (!isAllowedHost() || window.__umaCareerGa4Initialized) return false

  try {
    window.dataLayer = window.dataLayer || []
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments) }
    window.gtag('js', new Date())
    window.gtag('config', MEASUREMENT_ID, {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    })

    if (!document.getElementById('uma-career-ga4')) {
      const script = document.createElement('script')
      script.async = true
      script.id = 'uma-career-ga4'
      script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
      document.head.appendChild(script)
    }

    window.__umaCareerGa4Initialized = true
    return true
  } catch {
    return false
  }
}

export function trackEvent(eventName, parameters = {}) {
  if (!isAllowedHost()) {
    console.warn('[GA4 DEBUG] skipped: hostname is not allowed', typeof window === 'undefined' ? 'server' : window.location.hostname)
    return false
  }
  try {
    if (typeof window.gtag !== 'function') {
      console.warn('[GA4 DEBUG] skipped: window.gtag is unavailable', eventName)
      return false
    }
    console.log('[GA4 DEBUG] sending', eventName, parameters)
    window.gtag('event', eventName, parameters)
    return true
  } catch (error) {
    console.warn('[GA4 DEBUG] send failed', eventName, error)
    return false
  }
}

export function buildCareerStartParams(career) {
  const parameters = { growth_type: canonicalId(career.growthType?.id) }
  if (career.region?.id) parameters.origin_id = career.region.id
  return parameters
}

export function buildHighSchoolAdmissionParams(career) {
  const admission = career.highSchoolAdmission
  return {
    result: admission?.accepted ? 'success' : 'fail',
    growth_type: canonicalId(career.growthType?.id),
    admission_score: admission?.score ?? 0,
  }
}

export function buildCareerEndParams(career) {
  const races = collectRecordedRaces(career)
  const g1Wins = races.filter((race) => (race.grade ?? race.raceType) === 'G1' && (race.finalPosition ?? race.finishPosition) === 1).length
  const ending = career.nonRacerEnding
    ? { ending_type: 'non_racer', ending_id: career.nonRacerEnding.id }
    : career.badEnding
      ? { ending_type: 'debut_fail', ending_id: 'FAILED_DEBUT' }
      : { ending_type: 'normal', ending_id: 'GRADUATION' }

  return {
    ...ending,
    growth_type: canonicalId(career.growthType?.id),
    running_style: canonicalId(career.runningStyle),
    g1_wins: g1Wins,
    total_races: races.length,
  }
}

export const trackCareerStart = (career) => trackEvent('career_start', buildCareerStartParams(career))
export const trackHighSchoolAdmission = (career) => trackEvent('high_school_admission', buildHighSchoolAdmissionParams(career))
export const trackCareerEnd = (career) => trackEvent('career_end', buildCareerEndParams(career))
