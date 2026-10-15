import { useState } from 'react'
import './App.css'
import { GROWTH_TYPES } from './data/growthTypes.js'
import { MAX_STAT, STATS } from './data/stats.js'
import { TURNS } from './data/turns.js'
import { createCareer, chooseGrowthType, rerollCareer } from './game/createCareer.js'
import { getCareerEvaluation } from './game/evaluation.js'
import { acknowledgeMiddleAdmission, advanceCareer, displayStat, finishElementaryEvent, resolveTransferAndStartElementaryTurn, selectElementaryEventChoice } from './game/growth.js'
import { finishMiddleEvent, finishMiddleLegend, selectMiddleEventChoice, selectMiddleLegend } from './game/middleEvents.js'
import { generateRandomUmaName } from './game/nameGenerator.js'
import { getElementarySchoolById } from './data/schools.js'
import TurnProgress from './components/TurnProgress.jsx'
import { createTurnProgressPlan } from './game/turnProgress.js'

const SCREENS = {
  HOME: 'HOME',
  NAME_ENTRY: 'NAME_ENTRY',
  ORIGIN: 'ORIGIN',
  GROWTH_PLAN: 'GROWTH_PLAN',
  CAREER: 'CAREER',
  RESULT: 'RESULT',
}

function Brand() {
  return <div className="brand"><span className="brand-mark">UC</span><span>UMA CAREER</span></div>
}

function StatGrid({ stats, previousStats = null }) {
  return (
    <div className="stat-grid">
      {STATS.map(({ id, label }) => {
        const value = displayStat(stats[id])
        const previous = previousStats ? displayStat(previousStats[id]) : null
        const delta = previous === null ? null : value - previous
        return (
          <div className="stat-row" key={id}>
            <span className="stat-label">{label}</span>
            <strong className="stat-value">{value} <small>/ {MAX_STAT}</small></strong>
            <div className="stat-track" role="meter" aria-label={label} aria-valuemin="0" aria-valuemax={MAX_STAT} aria-valuenow={value}>
              <span style={{ width: `${(value / MAX_STAT) * 100}%` }} />
            </div>
            {delta !== null && <span className={`stat-delta ${delta < 0 ? 'negative' : ''}`}>{delta >= 0 ? '+' : ''}{delta}</span>}
          </div>
        )
      })}
    </div>
  )
}

function Intro({ onStart }) {
  return (
    <main className="intro page-shell">
      <div className="ambient ambient-violet" aria-hidden="true" />
      <div className="ambient ambient-gold" aria-hidden="true" />
      <section className="intro-content" aria-labelledby="page-title">
        <p className="eyebrow">THE RACE BEGINS HERE</p>
        <h1 id="page-title">UMA CAREER</h1>
        <p className="intro-subtitle">우마무스메 커리어 시뮬레이터</p>
        <button className="primary-button" type="button" onClick={onStart}><span>NEW CAREER</span><span aria-hidden="true">→</span></button>
        <p className="intro-note">초등부 1학년부터 고등부 3학년까지 · 24 TURNS</p>
      </section>
    </main>
  )
}

function NameEntry({ names, onChange, onRandomName, onConfirm, onBack }) {
  const canContinue = Boolean(names.lastName.trim() && names.firstName.trim())

  return (
    <main className="game-page page-shell">
      <header className="topbar"><Brand /><span className="phase-label">NEW CAREER</span></header>
      <form className="flow-layout name-form" onSubmit={(event) => { event.preventDefault(); if (canContinue) onConfirm() }}>
        <button className="back-button" type="button" onClick={onBack}>← 홈으로</button>
        <section className="panel">
          <p className="section-kicker">NEW CAREER</p>
          <div className="name-title-row">
            <h1>우마무스메의 이름을<br />입력하세요.</h1>
            <button className="secondary-button random-name-button" type="button" onClick={onRandomName}><span aria-hidden="true">🎲</span> 랜덤</button>
          </div>
          <div className="name-fields">
            <label>성<input type="text" name="lastName" value={names.lastName} onChange={onChange} maxLength="5" autoComplete="off" placeholder="메지로" /></label>
            <label>이름<input type="text" name="firstName" value={names.firstName} onChange={onChange} maxLength="5" autoComplete="off" placeholder="맥퀸" /></label>
          </div>
          <p className="field-hint">각각 최대 5글자까지 입력할 수 있습니다.</p>
        </section>
        <button className="primary-button flow-primary" type="submit" disabled={!canContinue}><span>확인</span><span aria-hidden="true">→</span></button>
      </form>
    </main>
  )
}

function OriginReview({ career, onReroll, onConfirm, onBack }) {
  return (
    <main className="game-page page-shell">
      <header className="topbar"><Brand /><span className="phase-label">ORIGIN</span></header>
      <div className="setup-layout">
        <button className="back-button" type="button" onClick={onBack}>← 이름 수정</button>
        <section className="panel origin-card">
          <p className="section-kicker">01 · ORIGIN</p>
          <h2>{career.fullName}의<br />출신과 능력은?</h2>
          <dl className="profile-list">
            <div><dt>이름</dt><dd>{career.fullName}</dd></div>
            <div><dt>출신</dt><dd>{career.region.name}</dd></div>
            <div><dt>초등학교</dt><dd>{career.school.name}</dd></div>
          </dl>
        </section>

        <section className="panel initial-stats">
          <div className="section-heading"><div><p className="section-kicker">02 · INITIAL ABILITY</p><h2>초기 능력치</h2></div><span className="hidden-badge">HIDDEN TRAITS GENERATED</span></div>
          <StatGrid stats={career.stats} />
          <p className="muted-copy">포텐셜과 안정성은 커리어 종료 시 공개됩니다.</p>
        </section>

        <div className="review-actions">
          <button className="secondary-button" type="button" onClick={onReroll}>리롤 <span aria-hidden="true">↻</span></button>
          <button className="primary-button" type="button" onClick={onConfirm}><span>확인</span><span aria-hidden="true">→</span></button>
        </div>
      </div>
    </main>
  )
}

function GrowthPlan({ career, selectedType, onSelect, onBegin, onBack }) {
  return (
    <main className="game-page page-shell">
      <header className="topbar"><Brand /><span className="phase-label">GROWTH PLAN</span></header>
      <div className="setup-layout growth-plan-layout">
        <button className="back-button" type="button" onClick={onBack}>← 출신과 능력 확인</button>
        <section className="type-section">
          <div className="section-heading"><div><p className="section-kicker">03 · GROWTH PLAN</p><h2>{career.fullName}을 어떤 선수로<br />성장시킬까요?</h2></div></div>
          <div className="type-grid">
            {GROWTH_TYPES.map((type) => (
              <button className={`type-card ${selectedType === type.id ? 'selected' : ''}`} type="button" key={type.id} onClick={() => onSelect(type.id)} aria-pressed={selectedType === type.id}>
                <span className="type-distance">{type.distance}</span><strong>{type.name}</strong>
                <span className="trait"><small>메인</small>{type.main.join(' / ')}</span>
                <span className="trait"><small>보조</small>{type.support.join(' / ')}</span>
              </button>
            ))}
          </div>
          <div className="setup-action">
            <button className="primary-button" type="button" disabled={!selectedType} onClick={onBegin}><span>이 성장 계획으로 시작</span><span aria-hidden="true">→</span></button>
          </div>
        </section>
      </div>
    </main>
  )
}

const OUTCOME_LABELS = { GREAT_SUCCESS: '대성공!', SUCCESS: '성공', FAILURE: '실패' }
const RATING_LABELS = { LOWEST: '성장 미비', LOW: '조용한 성장', NORMAL: '꾸준한 성장', HIGH: '성공적인 성장', VERY_HIGH: '폭풍 성장!' }

function GrowthLog({ log, isLatest }) {
  if (log.kind === 'TRANSFER') {
    return (
      <article className={`transfer-log ${log.specialTransfer ? 'special' : ''}`}>
        <span>{log.specialTransfer ? '★★★ SPECIAL TRANSFER' : 'TRANSFER'} · {log.periodLabel}</span>
        <h3>{log.destinationSchoolName}</h3>
        <p>「{log.selectedChoiceText}」</p>
        <strong>{log.accepted ? '전학 수락' : '전학 거절'}</strong>
        {log.accepted
          ? <div className="school-change"><small>{log.fromSchoolName}</small><b>→</b><small>{log.destinationSchoolName}</small></div>
          : <p>{log.fromSchoolName}에서 계속 성장하기로 결정했습니다.</p>}
      </article>
    )
  }

  return (
    <details className={`log-card ${isLatest ? 'latest' : ''}`} open={isLatest}>
      <summary>
        <span className="log-turn">TURN {String(log.turn).padStart(2, '0')}</span>
        <span className="log-summary-main"><strong>{log.periodLabel}</strong><em>★ {RATING_LABELS[log.growthRating]} {log.legendEvent ? '· ★ LEGEND' : ''}</em></span>
        <span className="log-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="log-detail">
        <p className="rating-copy">{log.growthRatingText}</p>
        {log.schoolName && <p className="history-school">{log.schoolName}</p>}
        <div className="history-stats">
          {STATS.map(({ id, label }) => {
            const before = displayStat(log.statsBefore[id])
            const after = displayStat(log.statsAfter[id])
            const delta = after - before
            return <p key={id}><span>{label}</span><small>{before} → {after}</small><em className={delta < 0 ? 'negative' : ''}>{delta >= 0 ? '+' : ''}{delta}</em></p>
          })}
        </div>
        {log.event && (
          <section className={`history-event ${log.event.signatureEvent ? 'signature' : ''}`}>
            <span>{log.event.signatureEvent ? '★ LEGEND EVENT' : log.event.schoolEvent ? 'SCHOOL EVENT' : 'EVENT'}</span>
            <h3>{log.event.eventName} · {OUTCOME_LABELS[log.event.outcomeType]}</h3>
            <p>{log.event.situation}</p>
            <dl><div><dt>선택</dt><dd>「{log.event.selectedChoiceText}」</dd></div><div><dt>결과</dt><dd>{log.event.outcomeText}</dd></div></dl>
          </section>
        )}
        {log.legendEvent && (
          <section className="history-event legend-history">
            <span>★ LEGEND EVENT</span>
            <h3>{log.legendEvent.characterName} · {log.legendEvent.title}</h3>
            <strong>{OUTCOME_LABELS[log.legendEvent.outcomeType]}</strong>
            <p>{log.legendEvent.outcomeText}</p>
            <div className="history-legend-effects">
              {Object.entries(log.legendEvent.statChanges).map(([id, amount]) => <small key={id}>{STATS.find((stat) => stat.id === id)?.label} {amount >= 0 ? '+' : ''}{amount}</small>)}
              {log.legendEvent.conditionDelta !== 0 && <small>컨디션 {log.legendEvent.conditionDelta > 0 ? '상승' : '하락'}</small>}
            </div>
          </section>
        )}
        <footer>컨디션 <span>{log.conditionBefore}</span><b>→</b><strong>{log.conditionAfter}</strong></footer>
      </div>
    </details>
  )
}

function TransferModal({ career, onDecision }) {
  const destination = getElementarySchoolById(career.transferState.destinationSchoolId)
  if (!destination) return null
  const isCentral = destination.id === 'central_tracen'

  return (
    <div className="event-backdrop" role="presentation">
      <section className={`event-modal transfer-modal ${isCentral ? 'central' : ''}`} role="dialog" aria-modal="true" aria-labelledby="transfer-title">
        <p className="event-badge">{isCentral ? '★★★ SPECIAL TRANSFER' : 'SPECIAL EVENT'}</p>
        <h2 id="transfer-title">{isCentral ? destination.name : '스카우트 제안'}</h2>
        <p className="event-situation">
          {isCentral
            ? `전국의 유망주를 대상으로 한 특별 육성 과정에\n${career.fullName}의 이름이 올랐습니다.`
            : `최근의 기록을 지켜본 ${destination.name}에서\n전학 제안이 도착했습니다.\n\n“더 높은 수준의 환경에서 훈련해보지 않겠습니까?”`}
        </p>
        <div className="transfer-actions">
          <button className="primary-button" type="button" onClick={() => onDecision(true)}><span>{isCentral ? '중앙 트레센으로 간다' : '새로운 환경에 도전한다'}</span><span aria-hidden="true">→</span></button>
          <button className="secondary-button" type="button" onClick={() => onDecision(false)}>현재 학교에 남는다</button>
        </div>
      </section>
    </div>
  )
}

function EventModal({ event, outcome, onSelect, onContinue }) {
  const isSignature = event.type === 'SIGNATURE'
  const typeLabel = isSignature ? '★ LEGEND EVENT' : event.type === 'SCHOOL' ? 'SCHOOL EVENT' : 'EVENT'
  return (
    <div className="event-backdrop" role="presentation">
      <section className={`event-modal ${isSignature ? 'signature' : ''}`} role="dialog" aria-modal="true" aria-labelledby="event-title">
        <p className="event-badge">{typeLabel}</p>
        {!outcome ? (
          <>
            <h2 id="event-title">{event.name}</h2>
            <p className="event-situation">{event.situation}</p>
            <div className="event-choices">
              {event.choices.map((choice) => <button type="button" key={choice.id} onClick={() => onSelect(choice.id)} disabled={Boolean(outcome)}>{choice.text}<span aria-hidden="true">→</span></button>)}
            </div>
          </>
        ) : (
          <div className="event-result">
            <p className={`outcome outcome-${outcome.type}`}>{outcome.type === 'GREAT_SUCCESS' ? '★ ' : ''}{OUTCOME_LABELS[outcome.type]}</p>
            <h2 id="event-title">{event.name}</h2>
            <p className="outcome-text">{outcome.text}</p>
            <div className="outcome-effects">
              {Object.entries(outcome.statChanges).map(([id, amount]) => <span className={amount < 0 ? 'negative' : ''} key={id}>{STATS.find((stat) => stat.id === id)?.label} {amount >= 0 ? '+' : ''}{amount}</span>)}
              {outcome.conditionDelta !== 0 && <span className={outcome.conditionDelta < 0 ? 'negative' : ''}>컨디션 {outcome.conditionDelta > 0 ? '+' : ''}{outcome.conditionDelta}</span>}
              {Object.keys(outcome.statChanges).length === 0 && outcome.conditionDelta === 0 && <span>변화 없음</span>}
            </div>
            <button className="primary-button event-continue" type="button" onClick={onContinue}><span>계속</span><span aria-hidden="true">→</span></button>
          </div>
        )}
      </section>
    </div>
  )
}

function AdmissionModal({ career, onContinue }) {
  const passed = career.middleState.centralAdmissionPassed
  return (
    <div className="event-backdrop" role="presentation">
      <section className="event-modal admission-modal" role="dialog" aria-modal="true" aria-labelledby="admission-title">
        <p className="event-badge">MIDDLE SCHOOL ADMISSION</p>
        <div className="admission-emblem" aria-hidden="true">◆</div>
        <h2 id="admission-title">중앙 트레센 학원</h2>
        <p className={`admission-result ${passed ? 'passed' : 'failed'}`}>{passed ? '합격' : '불합격'}</p>
        {!passed && <p className="admission-destination"><span>최종 진학</span><strong>{career.middleState.schoolName}</strong></p>}
        {passed && <p className="admission-destination"><span>최종 진학</span><strong>중앙 트레센 학원 중등부</strong></p>}
        <button className="primary-button event-continue" type="button" onClick={onContinue}><span>중등부로 진학</span><span aria-hidden="true">→</span></button>
      </section>
    </div>
  )
}

function LegendEventModal({ event, outcome, onSelect, onContinue }) {
  return (
    <div className="event-backdrop" role="presentation">
      <section className="event-modal legend-modal" role="dialog" aria-modal="true" aria-labelledby="legend-title">
        <p className="event-badge">★ LEGEND EVENT</p>
        <img
          className="legend-portrait"
          src={event.portrait}
          alt={`${event.characterName} 얼굴 이미지`}
          onError={(imageEvent) => { imageEvent.currentTarget.onerror = null; imageEvent.currentTarget.src = '/assets/legends/placeholder.svg' }}
        />
        <p className="legend-name">{event.characterName}</p>
        {!outcome ? (
          <>
            <h2 id="legend-title">{event.title}</h2>
            <p className="event-situation">{event.situation}</p>
            <div className="event-choices"><button type="button" onClick={onSelect} disabled={Boolean(outcome)}>{event.choices[0].text}<span aria-hidden="true">→</span></button></div>
          </>
        ) : (
          <div className="event-result">
            <p className={`outcome outcome-${outcome.type}`}>{outcome.type === 'GREAT_SUCCESS' ? '★ ' : ''}{OUTCOME_LABELS[outcome.type]}</p>
            <h2 id="legend-title">{event.title}</h2>
            <p className="outcome-text">{outcome.text}</p>
            <div className="outcome-effects">
              {Object.entries(outcome.statChanges).map(([id, amount]) => <span key={id}>{STATS.find((stat) => stat.id === id)?.label} +{amount}</span>)}
              {outcome.conditionDelta !== 0 && <span>컨디션 +{outcome.conditionDelta}</span>}
            </div>
            <button className="primary-button event-continue" type="button" onClick={onContinue}><span>계속</span><span aria-hidden="true">→</span></button>
          </div>
        )}
      </section>
    </div>
  )
}

function Playing({ career, turnProgress, progressSpeed, onProgressSpeedChange, onProgressEventTrigger, onProgressLegendTrigger, onProgressComplete, onAdvance, onEventChoice, onEventContinue, onTransferDecision, onAdmissionContinue, onMiddleEventChoice, onMiddleEventContinue, onLegendSelect, onLegendContinue }) {
  const currentTurn = TURNS[career.turnIndex]
  const lastLog = career.logs[0]
  const progress = ((career.turnIndex) / TURNS.length) * 100
  const elementaryEventOpen = Boolean(turnProgress?.eventTriggered && !turnProgress.eventResolved && career.elementaryEventState.pendingEvent)
  const middleEventOpen = Boolean(turnProgress?.eventTriggered && !turnProgress.eventResolved && career.middleState?.pendingEvent)
  const legendOpen = Boolean(turnProgress?.legendTriggered && !turnProgress.legendResolved && career.middleState?.pendingLegend)
  const progressPaused = elementaryEventOpen || middleEventOpen || legendOpen

  return (
    <main className="game-page page-shell">
      <header className="topbar"><Brand /><span className="phase-label">{currentTurn.stage} · TURN {String(currentTurn.number).padStart(2, '0')}</span></header>
      <div className="progress-line"><span style={{ width: `${progress}%` }} /></div>

      <div className="dashboard-layout">
        <section className="career-summary">
          <div className="chapter-line"><p className="section-kicker">CURRENT CHAPTER</p><span>{currentTurn.number} / {TURNS.length}</span></div>
          <p className="character-name">{career.fullName}</p>
          <h1>{currentTurn.label}</h1>
          <p className="summary-line">{career.region.name} · {currentTurn.stage === '초등부' ? career.school.name : currentTurn.stage === '중등부' ? career.middleState.schoolName : `${currentTurn.stage} 과정`}</p>
          <p className="summary-line">{career.growthType.name} · 컨디션 <strong className={`condition condition-${career.condition}`}>{career.condition}</strong></p>
          {career.notice && <div className="milestone"><span>◆</span><p>{career.notice}</p></div>}
        </section>

        <section className="panel ability-panel">
          <div className="section-heading"><div><p className="section-kicker">CURRENT ABILITY</p><h2>능력치</h2></div>{lastLog && <span className="growth-caption">직전 턴 성장량</span>}</div>
          <StatGrid stats={career.stats} previousStats={lastLog?.statsBefore} />
        </section>

        <aside className="log-panel">
          <div className="section-heading"><div><p className="section-kicker">HISTORY</p><h2>최근 기록</h2></div><span>최근 {Math.min(career.history.length, 3)}개</span></div>
          {career.history.length > 0 ? career.history.slice(0, 3).map((log, index) => <GrowthLog log={log} isLatest={index === 0} key={`${log.kind ?? 'TURN'}-${log.turn}`} />) : <div className="empty-log"><p>첫 성장 기록을 기다리고 있습니다.</p></div>}
        </aside>
        <div className="turn-action">
          <button className="primary-button" type="button" onClick={onAdvance} disabled={Boolean(turnProgress)}><span>다음 턴</span><span aria-hidden="true">→</span></button>
        </div>
      </div>
      {career.transferState?.offered && !career.transferState.resolved && <TransferModal career={career} onDecision={onTransferDecision} />}
      {turnProgress && <TurnProgress plan={turnProgress} speed={progressSpeed} paused={progressPaused} onSpeedChange={onProgressSpeedChange} onEventTrigger={onProgressEventTrigger} onLegendTrigger={onProgressLegendTrigger} onComplete={onProgressComplete} />}
      {elementaryEventOpen && <EventModal event={career.elementaryEventState.pendingEvent} outcome={career.elementaryEventState.pendingOutcome} onSelect={onEventChoice} onContinue={onEventContinue} />}
      {!turnProgress && career.middleState?.admissionPending && <AdmissionModal career={career} onContinue={onAdmissionContinue} />}
      {middleEventOpen && <EventModal event={career.middleState.pendingEvent} outcome={career.middleState.pendingOutcome} onSelect={onMiddleEventChoice} onContinue={onMiddleEventContinue} />}
      {legendOpen && <LegendEventModal event={career.middleState.pendingLegend} outcome={career.middleState.pendingLegendOutcome} onSelect={onLegendSelect} onContinue={onLegendContinue} />}
    </main>
  )
}

function Complete({ career, onRestart }) {
  return (
    <main className="result-page page-shell">
      <header className="topbar"><Brand /><span className="phase-label">FINAL REPORT</span></header>
      <div className="result-hero">
        <p className="eyebrow">24 TURNS COMPLETED</p>
        <h1>CAREER COMPLETE</h1>
        <strong className="result-name">{career.fullName}의 커리어 결과</strong>
        <p>{getCareerEvaluation(career.potential, career.stability)}</p>
      </div>
      <div className="result-layout">
        <section className="panel result-profile">
          <p className="section-kicker">CAREER PROFILE</p>
          <dl className="profile-list">
            <div><dt>출신</dt><dd>{career.region.name}</dd></div>
            <div><dt>초등학교</dt><dd>{career.school.name}</dd></div>
            <div><dt>성장 타입</dt><dd>{career.growthType.name}</dd></div>
            <div><dt>최종 컨디션</dt><dd>{career.condition}</dd></div>
          </dl>
        </section>
        <section className="panel result-stats">
          <p className="section-kicker">FINAL ABILITY</p>
          <h2>최종 능력치</h2>
          <StatGrid stats={career.stats} />
        </section>
        <section className="panel reveal-panel">
          <p className="section-kicker">HIDDEN TRAITS REVEALED</p>
          <h2>숨겨진 자질</h2>
          <div className="reveal-values">
            <div><span>포텐셜</span><strong>{career.potential}</strong><small>/ 100</small></div>
            <div><span>안정성</span><strong>{career.stability}</strong><small>/ 100</small></div>
          </div>
        </section>
      </div>
      <button className="primary-button restart-button" type="button" onClick={onRestart}><span>다시 시작하기</span><span aria-hidden="true">↻</span></button>
    </main>
  )
}

function App() {
  const [screen, setScreen] = useState(SCREENS.HOME)
  const [names, setNames] = useState({ lastName: '', firstName: '' })
  const [career, setCareer] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  const [turnProgress, setTurnProgress] = useState(null)
  const [progressSpeed, setProgressSpeed] = useState(1)

  const startNewCareer = () => {
    setNames({ lastName: '', firstName: '' })
    setCareer(null)
    setSelectedType(null)
    setTurnProgress(null)
    setProgressSpeed(1)
    setScreen(SCREENS.NAME_ENTRY)
  }

  const handleNameChange = (event) => {
    setNames((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const randomizeName = () => setNames(generateRandomUmaName())

  const confirmName = () => {
    const normalizedNames = {
      lastName: names.lastName.trim(),
      firstName: names.firstName.trim(),
    }
    setNames(normalizedNames)
    setCareer(createCareer(normalizedNames))
    setScreen(SCREENS.ORIGIN)
  }

  const beginCareer = () => {
    setCareer((current) => chooseGrowthType(current, selectedType))
    setScreen(SCREENS.CAREER)
  }

  const handleAdvance = () => {
    if (turnProgress) return
    const stage = TURNS[career.turnIndex].stage
    const next = advanceCareer(career)
    if (['초등부', '중등부'].includes(stage) && (next.elementaryEventState.pendingEvent || next.middleState?.pendingEvent)) {
      const prepared = createTurnProgressPlan(next)
      setCareer(prepared.career)
      setTurnProgress(prepared.plan)
    } else {
      setCareer(next)
    }
    if (next.complete) setScreen(SCREENS.RESULT)
  }

  const handleEventChoice = (choiceId) => setCareer((current) => selectElementaryEventChoice(current, choiceId))

  const handleEventContinue = () => {
    setCareer((current) => finishElementaryEvent(current))
    setTurnProgress((current) => current ? { ...current, eventResolved: true } : current)
  }

  const handleTransferDecision = (accepted) => {
    const next = resolveTransferAndStartElementaryTurn(career, accepted)
    const prepared = createTurnProgressPlan(next)
    setCareer(prepared.career)
    setTurnProgress(prepared.plan)
  }

  const handleAdmissionContinue = () => setCareer((current) => acknowledgeMiddleAdmission(current))
  const handleMiddleEventChoice = (choiceId) => setCareer((current) => selectMiddleEventChoice(current, choiceId))
  const handleMiddleEventContinue = () => {
    setCareer((current) => finishMiddleEvent(current))
    setTurnProgress((current) => current ? { ...current, eventResolved: true } : current)
  }
  const handleLegendSelect = () => setCareer((current) => selectMiddleLegend(current))
  const handleLegendContinue = () => {
    setCareer((current) => finishMiddleLegend(current))
    setTurnProgress((current) => current ? { ...current, legendResolved: true } : current)
  }

  const triggerProgressEvent = () => setTurnProgress((current) => current ? { ...current, eventTriggered: true } : current)
  const triggerProgressLegend = () => setTurnProgress((current) => current ? { ...current, legendTriggered: true } : current)
  const completeProgress = () => setTurnProgress(null)

  if (screen === SCREENS.HOME) return <Intro onStart={startNewCareer} />
  if (screen === SCREENS.NAME_ENTRY) return <NameEntry names={names} onChange={handleNameChange} onRandomName={randomizeName} onConfirm={confirmName} onBack={() => setScreen(SCREENS.HOME)} />
  if (screen === SCREENS.ORIGIN) return <OriginReview career={career} onReroll={() => setCareer((current) => rerollCareer(current))} onConfirm={() => setScreen(SCREENS.GROWTH_PLAN)} onBack={() => setScreen(SCREENS.NAME_ENTRY)} />
  if (screen === SCREENS.GROWTH_PLAN) return <GrowthPlan career={career} selectedType={selectedType} onSelect={setSelectedType} onBegin={beginCareer} onBack={() => setScreen(SCREENS.ORIGIN)} />
  if (screen === SCREENS.CAREER) return <Playing career={career} turnProgress={turnProgress} progressSpeed={progressSpeed} onProgressSpeedChange={setProgressSpeed} onProgressEventTrigger={triggerProgressEvent} onProgressLegendTrigger={triggerProgressLegend} onProgressComplete={completeProgress} onAdvance={handleAdvance} onEventChoice={handleEventChoice} onEventContinue={handleEventContinue} onTransferDecision={handleTransferDecision} onAdmissionContinue={handleAdmissionContinue} onMiddleEventChoice={handleMiddleEventChoice} onMiddleEventContinue={handleMiddleEventContinue} onLegendSelect={handleLegendSelect} onLegendContinue={handleLegendContinue} />
  if (screen === SCREENS.RESULT) return <Complete career={career} onRestart={startNewCareer} />
  return <Intro onStart={startNewCareer} />
}

export default App
