const EXPORT_BACKGROUND = '#17131d'
export const RESULT_SUMMARY_IMAGE_SIZE = 1000

export function buildResultImageFilename(fullName, date = new Date()) {
  const safeName = (fullName || 'career').replace(/[\\/:*?"<>|\s]+/g, '').slice(0, 40) || 'career'
  const dateText = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
  return `uma-career_${safeName}_${dateText}.png`
}

export function downloadBlob(blob, filename, documentObject = document, urlObject = URL) {
  const url = urlObject.createObjectURL(blob)
  const anchor = documentObject.createElement('a')
  try {
    anchor.href = url
    anchor.download = filename
    documentObject.body.append(anchor)
    anchor.click()
  } finally {
    anchor.remove()
    window.setTimeout(() => urlObject.revokeObjectURL(url), 1000)
  }
}

export async function createResultImageBlob(node) {
  if (!node) throw new Error('Result export card is not ready.')
  const { toBlob } = await import('html-to-image')
  if (document.fonts?.ready) await document.fonts.ready
  await Promise.all([...node.querySelectorAll('img')].map((image) => image.decode?.().catch(() => undefined) ?? Promise.resolve()))
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  const blob = await toBlob(node, {
    backgroundColor: EXPORT_BACKGROUND,
    cacheBust: true,
    height: RESULT_SUMMARY_IMAGE_SIZE,
    pixelRatio: 1,
    width: RESULT_SUMMARY_IMAGE_SIZE,
  })
  if (!blob) throw new Error('PNG generation returned an empty result.')
  return { blob, height: RESULT_SUMMARY_IMAGE_SIZE, width: RESULT_SUMMARY_IMAGE_SIZE }
}

export async function saveOrShareResultImage({ blob, filename, title = 'UMA CAREER 결과', navigatorObject = navigator }) {
  const file = typeof File === 'function' ? new File([blob], filename, { type: 'image/png' }) : null
  const coarsePointer = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
  const canShareFile = coarsePointer && file && typeof navigatorObject.share === 'function' && typeof navigatorObject.canShare === 'function' && navigatorObject.canShare({ files: [file] })
  if (canShareFile) {
    try {
      await navigatorObject.share({ files: [file], title })
      return 'shared'
    } catch (error) {
      if (error?.name !== 'AbortError') console.warn('UMA CAREER image share failed; using download fallback.', error)
    }
  }
  downloadBlob(blob, filename)
  return 'downloaded'
}
