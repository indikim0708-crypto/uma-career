import { useEffect, useRef, useState } from 'react'
import { RACE_SEQUENCE_DURATION_MS } from '../data/raceMessages.js'
import { getRunningStyle } from '../data/runningStyles.js'

export default function RaceSequence({ plan, speed, onSpeedChange, onComplete }) {
  const [progress, setProgress] = useState(0)
  const elapsedRef = useRef(0)
  const completedRef = useRef(false)

  useEffect(() => {
    if (completedRef.current) return undefined
    let frameId
    let previousTime = performance.now()
    const tick = (currentTime) => {
      elapsedRef.current += (currentTime - previousTime) * speed
      previousTime = currentTime
      const nextProgress = Math.min(1, elapsedRef.current / RACE_SEQUENCE_DURATION_MS)
      setProgress(nextProgress)
      if (nextProgress >= 1) {
        completedRef.current = true
        window.setTimeout(onComplete, 420)
        return
      }
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [onComplete, speed])

  const checkpoint = [...plan.checkpoints].reverse().find(({ at }) => at <= progress) ?? plan.checkpoints[0]
  const percentage = Math.round(progress * 100)
  const runningStyle = getRunningStyle(plan.runningStyle)
  return (
    <section className="race-sequence" aria-live="polite">
      <header><div><p>RACE SEQUENCE</p><h2>{plan.raceName}</h2><small>{plan.distance} · 작전: {runningStyle?.label}</small></div><div className="speed-control" aria-label="레이스 속도">{[1, 2].map((value) => <button type="button" key={value} className={speed === value ? 'active' : ''} onClick={() => onSpeedChange(value)}>{value}x</button>)}</div></header>
      <div className="race-position"><strong>현재 {checkpoint.position}위</strong><span>/ {plan.fieldSize}명</span><em>{checkpoint.phaseLabel}</em></div>
      {checkpoint.positionKeep && <p className="position-keep-status">POSITION KEEP · 포지션 유지 중</p>}
      {checkpoint.positionKeepReleased && <p className="position-keep-status released">포지션 킵 해제</p>}
      <div className="turn-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={percentage}><span style={{ width: `${percentage}%` }} /></div>
      <div className="turn-progress-meta"><span>레이스 진행 중</span><strong>{percentage}%</strong></div>
      <p className="race-message">“{checkpoint.message}”</p>
    </section>
  )
}
