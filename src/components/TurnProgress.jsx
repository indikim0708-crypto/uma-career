import { useEffect, useRef, useState } from 'react'

export default function TurnProgress({ plan, speed, paused, onSpeedChange, onEventTrigger, onLegendTrigger, onComplete }) {
  const [progress, setProgress] = useState(0)
  const elapsedRef = useRef(0)
  const completedRef = useRef(false)

  useEffect(() => {
    if (paused || completedRef.current) return undefined
    let frameId
    let previousTime = performance.now()

    const tick = (currentTime) => {
      elapsedRef.current += (currentTime - previousTime) * speed
      previousTime = currentTime
      let nextProgress = Math.min(1, elapsedRef.current / plan.durationMs)

      if (!plan.eventTriggered && nextProgress >= plan.eventProgressPoint) {
        nextProgress = plan.eventProgressPoint
        elapsedRef.current = nextProgress * plan.durationMs
        setProgress(nextProgress)
        onEventTrigger()
        return
      }

      if (plan.eventResolved && plan.legendRequired && !plan.legendTriggered && nextProgress >= plan.legendProgressPoint) {
        nextProgress = plan.legendProgressPoint
        elapsedRef.current = nextProgress * plan.durationMs
        setProgress(nextProgress)
        onLegendTrigger()
        return
      }

      setProgress(nextProgress)
      if (nextProgress >= 1 && plan.eventResolved && plan.legendResolved) {
        completedRef.current = true
        onComplete()
        return
      }
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [onComplete, onEventTrigger, onLegendTrigger, paused, plan.durationMs, plan.eventProgressPoint, plan.eventResolved, plan.eventTriggered, plan.legendProgressPoint, plan.legendRequired, plan.legendResolved, plan.legendTriggered, speed])

  const currentMessage = [...plan.messages].reverse().find(({ at }) => at <= progress) ?? plan.messages[0]
  const percentage = Math.round(progress * 100)

  return (
    <div className="turn-progress-backdrop" role="presentation">
      <section className="turn-progress-card" role="dialog" aria-modal="true" aria-labelledby="turn-progress-title">
        <header>
          <div>
            <p>TURN PROGRESS</p>
            <h2 id="turn-progress-title">{plan.periodLabel}</h2>
          </div>
          <div className="speed-control" aria-label="진행 속도">
            {[1, 2].map((value) => (
              <button type="button" key={value} className={speed === value ? 'active' : ''} aria-pressed={speed === value} onClick={() => onSpeedChange(value)}>{value}x</button>
            ))}
          </div>
        </header>
        <div className="turn-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={percentage}>
          <span style={{ width: `${percentage}%` }} />
        </div>
        <div className="turn-progress-meta"><span>진행 중</span><strong>{percentage}%</strong></div>
        <p className="turn-progress-message" key={currentMessage?.id}>“{currentMessage?.text}”</p>
        {paused && <p className="turn-progress-paused">EVENT 진행 중 · 시간이 멈췄습니다</p>}
      </section>
    </div>
  )
}
