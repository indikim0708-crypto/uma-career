import { useEffect, useRef, useState } from 'react'

export default function AdmissionProgress({ plan, speed, onSpeedChange, onComplete, eyebrow = 'MIDDLE SCHOOL ADMISSION', title = <>중앙 트레센 학원 중등부<br />입학 선발 전형</> }) {
  const [progress, setProgress] = useState(0)
  const elapsedRef = useRef(0)
  const completedRef = useRef(false)

  useEffect(() => {
    if (completedRef.current) return undefined
    let frameId
    let completionTimer
    let previousTime = performance.now()
    const tick = (currentTime) => {
      elapsedRef.current += (currentTime - previousTime) * speed
      previousTime = currentTime
      const nextProgress = Math.min(1, elapsedRef.current / plan.durationMs)
      setProgress(nextProgress)
      if (nextProgress >= 1) {
        completedRef.current = true
        completionTimer = window.setTimeout(onComplete, 450)
        return
      }
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frameId)
      window.clearTimeout(completionTimer)
    }
  }, [onComplete, plan.durationMs, speed])

  const currentMessage = [...plan.messages].reverse().find(({ at }) => at <= progress) ?? plan.messages[0]
  const percentage = Math.round(progress * 100)

  return (
    <div className="turn-progress-backdrop" role="presentation">
      <section className="turn-progress-card admission-progress-card" role="dialog" aria-modal="true" aria-labelledby="admission-progress-title">
        <header>
          <div>
            <p>{eyebrow}</p>
            <h2 id="admission-progress-title">{title}</h2>
          </div>
          <div className="speed-control" aria-label="진행 속도">
            {[1, 2].map((value) => <button type="button" key={value} className={speed === value ? 'active' : ''} aria-pressed={speed === value} onClick={() => onSpeedChange(value)}>{value}x</button>)}
          </div>
        </header>
        <div className="turn-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={percentage}><span style={{ width: `${percentage}%` }} /></div>
        <div className="turn-progress-meta"><span>선발 전형 진행 중</span><strong>{percentage}%</strong></div>
        <p className="turn-progress-message" key={currentMessage.id}>“{currentMessage.text}”</p>
      </section>
    </div>
  )
}
