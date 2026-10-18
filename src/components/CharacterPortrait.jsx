import { useState } from 'react'
import { getCharacterPortrait } from '../data/characterPortraits.js'

export default function CharacterPortrait({ portraitId, className = '', alt = '선택한 캐릭터 얼굴' }) {
  const portrait = getCharacterPortrait(portraitId)
  const [failed, setFailed] = useState(false)
  if (!portrait || failed) return <span className={`character-portrait portrait-fallback ${className}`} role="img" aria-label={alt}>UC</span>
  return <img className={`character-portrait ${className}`} src={portrait.image} alt={alt} onError={() => setFailed(true)} />
}
