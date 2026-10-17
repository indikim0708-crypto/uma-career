import { useEffect, useState } from 'react'
import './App.css'
import { GROWTH_TYPES } from './data/growthTypes.js'
import { getRunningStyle, RUNNING_STYLES } from './data/runningStyles.js'
import { MAX_STAT, STATS } from './data/stats.js'
import { TURNS } from './data/turns.js'
import { createCareer, chooseGrowthType, rerollCareer } from './game/createCareer.js'
import { getCareerEvaluation } from './game/evaluation.js'
import { acknowledgeMiddleAdmission, advanceCareer, completeMiddleAdmissionSequence, displayStat, finishElementaryEvent, resolveTransferAndStartElementaryTurn, selectElementaryEventChoice } from './game/growth.js'
import { resolveMiddleDistanceChange } from './game/middleDistanceChange.js'
import { finishMiddleEvent, finishMiddleLegend, selectMiddleEventChoice, selectMiddleLegend } from './game/middleEvents.js'
import { generateRandomUmaName } from './game/nameGenerator.js'
import { getElementarySchoolById } from './data/schools.js'
import { getMiddleSchoolById } from './data/middleSchools.js'
import TurnProgress from './components/TurnProgress.jsx'
import AdmissionProgress from './components/AdmissionProgress.jsx'
import RaceSequence from './components/RaceSequence.jsx'
import { createTurnProgressPlan } from './game/turnProgress.js'
import { completeHighSchoolAdmissionSequence, completeNonRacerCareer, enterHighSchool } from './game/highSchoolAdmission.js'
import { completeHighSchoolRaceSequence, dismissHighYear2Achievement, dismissHighYear3Achievement, finishHighSchoolEvent, finishHighSchoolLegend, finishHighSchoolRace, finishHighSchoolRunningStyle, resolveHighSchoolRace, resolveHighYear2Special, resolveHighYear3Special, resolveInitialTeamSelection, selectHighSchoolEventChoice, selectHighSchoolLegendChoice, selectHighSchoolRunningStyle } from './game/highSchoolYear1.js'
import { HIGH_YEAR2_RACES, HIGH_YEAR2_ROUTE_LABELS } from './data/highSchoolYear2Races.js'
import { TEAM_BY_ID } from './data/highSchoolTeams.js'
import { resolveTeamTransferOffer } from './game/highSchoolTeam.js'

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
  if (log.kind === 'SPECIAL' && log.id === 'high_running_style_decision') {
    return (
      <article className="transfer-log special">
        <span>SPECIAL EVENT · {log.title}</span>
        <p>코치 추천: <strong>{log.recommendedRunningStyleLabel}</strong></p>
        <p>선택: <strong>{log.selectedRunningStyleLabel}</strong></p>
        <strong>{log.resultText}</strong>
      </article>
    )
  }

  if (log.kind === 'SPECIAL' && log.id === 'middle_distance_change') {
    return (
      <article className="transfer-log special">
        <span>SPECIAL EVENT · {log.title}</span>
        <p>「{log.selectedChoiceText}」</p>
        <strong>{log.changed ? '성장 방향 변경' : `${log.previousGrowthTypeName} 유지`}</strong>
        {log.changed && <div className="school-change"><small>{log.previousGrowthTypeName}</small><b>→</b><small>{log.selectedGrowthTypeName}</small></div>}
      </article>
    )
  }

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
        {log.teamTraining && <section className="history-event"><span>TEAM TRAINING</span><h3>{log.teamTraining.teamName}</h3><div className="history-legend-effects">{Object.entries(log.teamTraining.statChanges).map(([id, amount]) => <small key={id}>{STATS.find((stat) => stat.id === id)?.label} +{amount}</small>)}</div></section>}
        {log.teamSupport?.success && <section className="history-event"><span>TEAM SUPPORT</span><h3>컨디션 지원</h3><p>{log.teamSupport.message}</p><p>{log.teamSupport.conditionBefore} → {log.teamSupport.conditionAfter}</p></section>}
        {log.legendEvent && (
          <section className="history-event legend-history">
            <span>★ LEGEND EVENT</span>
            <h3>{log.legendEvent.characterName} · {log.legendEvent.title}</h3>
            {log.legendEvent.outcomeType && <strong>{OUTCOME_LABELS[log.legendEvent.outcomeType]}</strong>}
            {log.legendEvent.quote && <p>{log.legendEvent.quote}</p>}
            <p>{log.legendEvent.outcomeText}</p>
            {log.legendEvent.selectedChoiceText && <p>선택: 「{log.legendEvent.selectedChoiceText}」</p>}
            <div className="history-legend-effects">
              {Object.entries(log.legendEvent.statChanges).map(([id, amount]) => <small key={id}>{STATS.find((stat) => stat.id === id)?.label} {amount >= 0 ? '+' : ''}{amount}</small>)}
              {log.legendEvent.conditionDelta !== 0 && <small>컨디션 {log.legendEvent.conditionDelta > 0 ? '상승' : '하락'}</small>}
            </div>
          </section>
        )}
        {(log.races ?? (log.race ? [log.race] : [])).map((race) => <section className="history-event race-history" key={race.raceId}>
          <span>{race.grade ?? 'RACE'} · {race.distance}</span>
          <h3>{race.raceName}</h3>
          {race.runningStyle && <p>작전: {getRunningStyle(race.runningStyle)?.label}</p>}
          <p>{race.result === 'WIN' ? '1위 · 우승' : race.result === 'SUCCESS' ? `${race.finishPosition}위 · 데뷔전 통과` : race.result === 'DECLINED' ? '출전을 보류했습니다.' : `${race.finishPosition ?? '-'}위`}</p>
        </section>)}
        {log.achievements?.map((achievement) => <section className="history-event achievement-history" key={achievement.id}><span>ACHIEVEMENT</span><h3>{achievement.name} 달성!</h3></section>)}
        {(log.specials ?? (log.special ? [log.special] : [])).map((specialEvent, index) => <section className="history-event" key={`${specialEvent.id}-${index}`}><span>SPECIAL EVENT</span><h3>{specialEvent.title}</h3><p>「{specialEvent.selectedChoiceText}」</p></section>)}
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
  const plan = career.middleState.admissionPlan
  const [destinationVisible, setDestinationVisible] = useState(plan.centralAccepted)
  useEffect(() => {
    if (plan.centralAccepted) return undefined
    const timer = window.setTimeout(() => setDestinationVisible(true), 1300)
    return () => window.clearTimeout(timer)
  }, [plan.centralAccepted])

  const passed = plan.centralAccepted
  const destination = getMiddleSchoolById(plan.destinationSchoolId)
  const internalProgression = passed && plan.isCentralElementary
  return (
    <div className="event-backdrop" role="presentation">
      <section className="event-modal admission-modal" role="dialog" aria-modal="true" aria-labelledby="admission-title">
        <p className="event-badge">MIDDLE SCHOOL ADMISSION</p>
        <img className="admission-emblem" src="/assets/trecen.png" alt="중앙 트레센 학원 로고" />
        <h2 id="admission-title">중앙 트레센 학원</h2>
        <p className={`admission-result ${passed ? 'passed' : 'failed'}`}>{passed ? (internalProgression ? '내부 진학 승인' : '합격') : '불합격'}</p>
        {passed && <p className="event-situation">{internalProgression ? '중앙 트레센 학원 중등부 진학이 승인되었습니다.' : '중앙 트레센 학원 중등부에 합격했습니다.'}</p>}
        {!passed && !destinationVisible && <p className="event-situation">아쉽게도 중앙 트레센의 최종 선발 명단에 들지 못했습니다. 잠시 후, 다른 트레센 학원에서 연락이 도착했습니다.</p>}
        {!passed && destinationVisible && <><p className="event-situation">새로운 무대가 결정되었습니다.</p><p className="admission-destination"><span>입학 제안이 도착했습니다</span><strong>{destination?.displayName ?? career.middleState.schoolName}</strong></p></>}
        {(passed || destinationVisible) && <button className="primary-button event-continue" type="button" onClick={onContinue}><span>중등부로 진학</span><span aria-hidden="true">→</span></button>}
      </section>
    </div>
  )
}

function HighSchoolAdmissionModal({ career, onContinue }) {
  const accepted = career.highSchoolAdmission.accepted
  return (
    <div className="event-backdrop" role="presentation">
      <section className="event-modal admission-modal" role="dialog" aria-modal="true" aria-labelledby="high-admission-title">
        <p className="event-badge">HIGH SCHOOL ADMISSION</p>
        <img className="admission-emblem" src="/assets/trecen.png" alt="중앙 트레센 학원 로고" />
        <h2 id="high-admission-title">중앙 트레센 학원 고등부</h2>
        <p className={`admission-result ${accepted ? 'passed' : 'failed'}`}>{accepted ? '합격' : '불합격'}</p>
        <p className="event-situation">{accepted ? '중앙 트레센 학원 고등부 진학이 결정되었습니다.' : '아쉽게도 중앙 트레센 학원 고등부 최종 선발 명단에 들지 못했습니다.'}</p>
        <button className="primary-button event-continue" type="button" onClick={onContinue}><span>{accepted ? '고등부로 진학' : '다른 길을 찾아본다'}</span><span aria-hidden="true">→</span></button>
      </section>
    </div>
  )
}

function RaceModal({ race, result, racePlan, speed, onSpeedChange, onSelect, onSequenceComplete, onContinue }) {
  const title = race.raceType === 'G1' ? 'G1 출전 제안' : race.attempt === 2 ? '데뷔 재도전' : 'DEBUT'
  const resultText = result?.raceType === 'DEBUT'
    ? result.result === 'SUCCESS' ? '공식 레이스 데뷔에 성공했습니다!' : '아직 공식 레이서로 인정받지 못했습니다. 하지만 한 번의 기회가 더 남아 있습니다.'
    : result?.result === 'DECLINED' ? '올해는 경험을 쌓는 데 집중하기로 했습니다.'
      : result?.won ? '첫 G1 우승 기록을 남겼습니다!' : result?.finishPosition <= 3 ? '훌륭한 첫 G1 무대였습니다.' : result?.finishPosition <= 6 ? '큰 무대에서 값진 경험을 얻었습니다.' : '강한 상대들과의 격차를 실감했습니다.'
  return <div className="event-backdrop" role="presentation"><section className="event-modal race-modal" role="dialog" aria-modal="true" aria-labelledby="race-title"><p className="event-badge">RACE SPECIAL</p>{!result ? <><h2 id="race-title">{title}</h2><p className="event-situation">{race.raceType === 'G1' ? `${race.raceName}에 도전하시겠습니까?` : '출전 등록을 마쳤습니다. 패독에서 마지막 준비를 하고 있습니다. 출발 게이트에 들어갑니다. 데뷔전이 시작됩니다!'}</p><div className="event-choices">{race.choices.map((choice) => <button type="button" key={choice.id} onClick={() => onSelect(choice.id)}>{choice.text}<span aria-hidden="true">→</span></button>)}</div></> : racePlan && !racePlan.completed ? <RaceSequence key={racePlan.raceId} plan={racePlan} speed={speed} onSpeedChange={onSpeedChange} onComplete={onSequenceComplete} /> : <div className="event-result"><p className={`outcome ${result.won ? 'outcome-GREAT_SUCCESS' : ''}`}>{result.won ? (result.raceType === 'G1' ? 'G1 우승' : `${result.finishPosition}착`) : result.raceType === 'DEBUT' ? `${result.finishPosition}착` : 'RACE RESULT'}</p><h2 id="race-title">{result.raceName}</h2><p className="outcome-text">{resultText}</p><button className="primary-button event-continue" type="button" onClick={onContinue}><span>계속</span><span aria-hidden="true">→</span></button></div>}</section></div>
}

function DistanceChangeModal({ career, onSelect }) {
  const currentType = career.growthType
  const choices = [currentType, ...GROWTH_TYPES.filter(({ id }) => id !== currentType.id)]

  return (
    <div className="event-backdrop" role="presentation">
      <section className="event-modal distance-change-modal" role="dialog" aria-modal="true" aria-labelledby="distance-change-title">
        <p className="event-badge">SPECIAL EVENT</p>
        <h2 id="distance-change-title">거리 전향 제안</h2>
        <p className="event-situation">코치가 최근 훈련 기록을 살펴보더니 다른 거리 적성도 시험해보는 것이 어떻겠냐고 제안했습니다. 현재 성장형을 유지할 수도 있고, 다른 성장형으로 전향할 수도 있습니다.</p>
        <div className="event-choices">
          {choices.map((type, index) => (
            <button className={index === 0 ? 'keep-current' : ''} type="button" key={type.id} onClick={() => onSelect(type.id)}>
              {index === 0 ? `${type.name}를 유지한다` : `${type.name}로 전향한다`}<span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function RunningStyleModal({ decision, onSelect, onContinue }) {
  const selectedStyle = getRunningStyle(decision.selectedStyle)
  const recommendedStyle = getRunningStyle(decision.recommendedStyle)
  return (
    <div className="event-backdrop" role="presentation">
      <section className="event-modal running-style-modal" role="dialog" aria-modal="true" aria-labelledby="running-style-title">
        <p className="event-badge">SPECIAL EVENT</p>
        {!selectedStyle ? <>
          <h2 id="running-style-title">주행 스타일 결정</h2>
          <p className="event-situation">코치가 훈련 기록을 살펴보며 앞으로 실전에서 어떤 방식으로 달릴지 정해보는 것이 좋겠다고 이야기했습니다. 앞에서 레이스를 이끌 수도 있고, 뒤에서 기회를 기다릴 수도 있습니다. 자신에게 가장 잘 맞는 주행 스타일을 선택하세요.</p>
          <div className="running-style-choices">
            {RUNNING_STYLES.map((style) => <button type="button" key={style.id} onClick={() => onSelect(style.id)}>
              <span className="running-style-heading"><strong>{style.label}</strong>{style.id === recommendedStyle?.id && <em>★ 코치 추천</em>}</span>
              <small>{style.description}</small>
              <b>{style.abilities}</b>
            </button>)}
          </div>
        </> : <div className="event-result">
          <p className="outcome">주행 스타일 선택</p>
          <h2 id="running-style-title">{selectedStyle.label}</h2>
          <p className="outcome-text">{selectedStyle.resultText}</p>
          <button className="primary-button event-continue" type="button" onClick={onContinue}><span>결정한다</span><span aria-hidden="true">→</span></button>
        </div>}
      </section>
    </div>
  )
}

function Year2SpecialModal({ special, onSelect }) {
  return <div className="event-backdrop" role="presentation"><section className="event-modal" role="dialog" aria-modal="true" aria-labelledby="year2-special-title"><p className="event-badge">SPECIAL EVENT</p><h2 id="year2-special-title">{special.title}</h2><p className="event-situation">{special.description}</p><div className="event-choices">{special.choices.map((choice) => <button type="button" key={choice.id} onClick={() => onSelect(choice.id)}>{choice.text}<span aria-hidden="true">→</span></button>)}</div></section></div>
}

function Year2AchievementModal({ achievement, onContinue }) {
  const descriptions = {
    CLASSIC_TRIPLE_CROWN: '사츠키상, 일본 더비, 국화상. 세 개의 G1을 모두 제패했습니다.',
    TRIPLE_TIARA: '벚꽃상, 오크스, 추화상. 세 개의 G1을 모두 제패했습니다.',
    MILE_STAR: 'NHK 마일 컵과 마일 챔피언십을 모두 제패했습니다.',
    SPRINT_KING: '봄과 가을의 대표 단거리 G1을 모두 제패했습니다.',
    MILE_DOMINATOR: '봄 마일 G1과 마일 챔피언십을 제패했습니다.',
    TENNO_DOUBLE: '천황상(봄)과 천황상(가을)을 모두 제패했습니다.',
    GRAND_PRIX_DOUBLE: '다카라즈카 기념과 아리마 기념을 모두 제패했습니다.',
    AUTUMN_TRIPLE: '천황상(가을), 재팬 컵, 아리마 기념. 가을의 세 거대한 무대를 모두 제패했습니다.',
  }
  const description = descriptions[achievement.id]
  return <div className="event-backdrop" role="presentation"><section className="event-modal achievement-modal" role="dialog" aria-modal="true" aria-labelledby="year2-achievement-title"><p className="event-badge">SEASON ACHIEVEMENT</p><div className="achievement-mark" aria-hidden="true">★</div><h2 id="year2-achievement-title">{achievement.name} 달성!</h2><p className="event-situation">{description}</p><button className="primary-button event-continue" type="button" onClick={onContinue}><span>계속</span><span aria-hidden="true">→</span></button></section></div>
}

function Year2SeasonStatus({ season }) {
  if (!season?.route) return null
  const routeRaces = {
    CLASSIC_TRIPLE: ['satsuki_sho', 'japan_derby', 'kikuka_sho'],
    TRIPLE_TIARA: ['oka_sho', 'oaks', 'shuka_sho'],
    MILE: ['nhk_mile_cup', 'mile_championship'],
    SPRINT: ['sprinters_stakes'],
    LONG: ['kikuka_sho'],
  }[season.route]
  return <div className="season-status"><strong>{HIGH_YEAR2_ROUTE_LABELS[season.route]}</strong>{routeRaces.map((raceId) => { const result = season.raceResults[raceId]; return <p key={raceId}><span>{HIGH_YEAR2_RACES[raceId].raceName}</span><em>{result ? `${result.finishPosition}착${result.won ? ' ✓' : ''}` : '예정'}</em></p> })}</div>
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

function HighSchoolLegendModal({ event, outcome, onSelect, onContinue }) {
  return <div className="event-backdrop" role="presentation"><section className="event-modal legend-modal" role="dialog" aria-modal="true" aria-labelledby="high-legend-title"><p className="event-badge">★ LEGEND EVENT</p><img className="legend-portrait" src={event.portrait} alt={`${event.characterName} 얼굴 이미지`} onError={(imageEvent) => { imageEvent.currentTarget.onerror = null; imageEvent.currentTarget.src = '/assets/legends/placeholder.svg' }} /><p className="legend-name">{event.characterName}</p>{!outcome ? <><h2 id="high-legend-title">{event.title}</h2><p className="event-situation">{event.situation}</p><div className="event-choices"><button type="button" onClick={onSelect}>{event.choices[0].text}<span aria-hidden="true">→</span></button></div></> : <div className="event-result"><p className="outcome outcome-GREAT_SUCCESS">LEGEND TRAINING</p><h2 id="high-legend-title">{event.title}</h2><div className="outcome-effects">{Object.entries(outcome.statChanges).map(([id, amount]) => <span key={id}>{STATS.find((stat) => stat.id === id)?.label} +{amount}</span>)}</div><button className="primary-button event-continue" type="button" onClick={onContinue}><span>계속</span><span aria-hidden="true">→</span></button></div>}</section></div>
}

function TeamPortrait({ team }) {
  return <img className="team-portrait" src={team.portrait} alt={`${team.representative} 초상화`} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/assets/legends/placeholder.svg' }} />
}

function InitialTeamScoutModal({ offerIds, onSelect }) {
  const teams = offerIds.map((id) => TEAM_BY_ID[id])
  return <div className="event-backdrop" role="presentation"><section className="event-modal team-scout-modal" role="dialog" aria-modal="true" aria-labelledby="team-scout-title"><p className="event-badge">TEAM SCOUT</p><h2 id="team-scout-title">두 팀에서 영입 제안이 도착했습니다</h2><div className="team-offer-list">{teams.map((team) => <article className="team-offer-card" key={team.id}><TeamPortrait team={team} /><div><h3>{team.name}</h3><p>대표: {team.representative}</p><small>훈련 성향</small><p>{team.trainingStyle}</p><small>컨디션 관리 · {team.conditionCare}</small></div><button type="button" onClick={() => onSelect(team.id)}>{team.name}에 가입한다</button></article>)}</div><button className="secondary-button team-decline" type="button" onClick={() => onSelect(null)}>아직 어느 팀에도 들어가지 않는다</button></section></div>
}

function TeamTransferModal({ offer, currentTeamId, onDecision }) {
  const team = TEAM_BY_ID[offer.teamId]
  const current = TEAM_BY_ID[currentTeamId]
  return <div className="event-backdrop" role="presentation"><section className="event-modal legend-modal" role="dialog" aria-modal="true" aria-labelledby="team-transfer-title"><p className="event-badge">TRANSFER OFFER</p><TeamPortrait team={team} /><p className="legend-name">{team.representative}</p><h2 id="team-transfer-title">{team.name}</h2><p className="event-situation">지금까지의 성적을 지켜봤습니다. 더 높은 무대에 도전할 생각이 있다면 우리 팀에서 함께하자는 제안입니다.</p><div className="event-choices"><button type="button" onClick={() => onDecision(true)}>{team.name}로 {current ? '이적한다' : '합류한다'}<span aria-hidden="true">→</span></button><button type="button" onClick={() => onDecision(false)}>{current ? `${current.name}에 남는다` : '이번 제안은 거절한다'}<span aria-hidden="true">→</span></button></div></section></div>
}

function Playing({ career, turnProgress, progressSpeed, onProgressSpeedChange, onProgressEventTrigger, onProgressLegendTrigger, onProgressComplete, onAdvance, onEventChoice, onEventContinue, onTransferDecision, onTeamInitialSelect, onTeamTransferDecision, onAdmissionContinue, onAdmissionSequenceComplete, onHighAdmissionSequenceComplete, onHighAdmissionContinue, onDistanceChange, onMiddleEventChoice, onMiddleEventContinue, onLegendSelect, onLegendContinue, onHighLegendSelect, onHighLegendContinue, onHighEventChoice, onHighEventContinue, onRunningStyleSelect, onRunningStyleContinue, onYear2SpecialSelect, onYear3SpecialSelect, onYear2AchievementContinue, onYear3AchievementContinue, onRaceSelect, onRaceSequenceComplete, onRaceContinue }) {
  const currentTurn = TURNS[career.turnIndex]
  const middleSchool = currentTurn.stage === '중등부' ? getMiddleSchoolById(career.middleState.schoolId) : null
  const summaryLocation = middleSchool?.location ?? career.region.name
  const summarySchoolName = middleSchool?.summaryName ?? career.middleState?.schoolName
  const lastLog = career.logs[0]
  const progress = ((career.turnIndex) / TURNS.length) * 100
  const elementaryEventOpen = Boolean(turnProgress?.eventTriggered && !turnProgress.eventResolved && career.elementaryEventState.pendingEvent)
  const middleEventOpen = Boolean(turnProgress?.eventTriggered && !turnProgress.eventResolved && career.middleState?.pendingEvent)
  const legendOpen = Boolean(turnProgress?.legendTriggered && !turnProgress.legendResolved && career.middleState?.pendingLegend)
  const highLegendOpen = Boolean(turnProgress?.legendTriggered && !turnProgress.legendResolved && career.highSchoolLegend?.pendingLegend)
  const highEventOpen = Boolean(turnProgress?.eventTriggered && !turnProgress.eventResolved && career.highSchoolState?.pendingEvent)
  const runningStyleOpen = Boolean(turnProgress?.eventResolved && career.highSchoolState?.pendingRunningStyleDecision)
  const teamScoutOpen = Boolean(turnProgress?.eventResolved && career.teamState?.initialOfferTeamIds.length && !career.teamState.initialOffersResolved && !career.highSchoolState?.pendingRunningStyleDecision)
  const year2SpecialOpen = Boolean(turnProgress?.legendTriggered && !turnProgress.legendResolved && career.highYear2?.pendingSpecial && !career.highSchoolState?.pendingRace)
  const year3SpecialOpen = Boolean(turnProgress?.legendTriggered && !turnProgress.legendResolved && career.highYear3?.pendingSpecial && !career.highSchoolState?.pendingRace)
  const raceOpen = Boolean(turnProgress?.legendTriggered && !turnProgress.legendResolved && career.highSchoolState?.pendingRace)
  const year2AchievementOpen = Boolean(turnProgress?.legendTriggered && !turnProgress.legendResolved && career.highYear2?.pendingAchievement && !career.highSchoolState?.pendingRace && !career.highYear2?.pendingSpecial)
  const year3AchievementOpen = Boolean(turnProgress?.legendTriggered && !turnProgress.legendResolved && career.highYear3?.pendingAchievements?.length && !career.highSchoolState?.pendingRace && !career.highYear3?.pendingSpecial)
  const progressPaused = elementaryEventOpen || middleEventOpen || legendOpen || highLegendOpen || highEventOpen || runningStyleOpen || teamScoutOpen || year2SpecialOpen || year3SpecialOpen || raceOpen || year2AchievementOpen || year3AchievementOpen

  return (
    <main className="game-page page-shell">
      <header className="topbar"><Brand /><span className="phase-label">{currentTurn.stage} · TURN {String(currentTurn.number).padStart(2, '0')}</span></header>
      <div className="progress-line"><span style={{ width: `${progress}%` }} /></div>

      <div className="dashboard-layout">
        <section className="career-summary">
          <div className="chapter-line"><p className="section-kicker">CURRENT CHAPTER</p><span>{currentTurn.number} / {TURNS.length}</span></div>
          <p className="character-name">{career.fullName}</p>
          <h1>{currentTurn.label}</h1>
          <p className="summary-line">{summaryLocation} · {currentTurn.stage === '초등부' ? career.school.name : currentTurn.stage === '중등부' ? summarySchoolName : `${currentTurn.stage} 과정`}</p>
          <p className="summary-line">{career.growthType.name} · 컨디션 <strong className={`condition condition-${career.condition}`}>{career.condition}</strong></p>
          {career.runningStyle && <p className="summary-line">주행 스타일 · {getRunningStyle(career.runningStyle)?.label}</p>}
          {currentTurn.stage === '고등부' && <p className="summary-line">소속 팀 · {TEAM_BY_ID[career.teamState?.currentTeamId]?.name ?? '무소속'}</p>}
          <Year2SeasonStatus season={career.highYear2} />
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
      {!turnProgress && career.middleState?.admissionPending && !career.middleState.admissionPlan?.sequenceCompleted && <AdmissionProgress plan={career.middleState.admissionPlan} speed={progressSpeed} onSpeedChange={onProgressSpeedChange} onComplete={onAdmissionSequenceComplete} />}
      {!turnProgress && career.middleState?.admissionPending && career.middleState.admissionPlan?.sequenceCompleted && <AdmissionModal career={career} onContinue={onAdmissionContinue} />}
      {!turnProgress && career.highSchoolAdmission?.resolved && !career.highSchoolAdmission.sequenceCompleted && <AdmissionProgress plan={career.highSchoolAdmission} speed={progressSpeed} onSpeedChange={onProgressSpeedChange} onComplete={onHighAdmissionSequenceComplete} eyebrow="HIGH SCHOOL ADMISSION" title={<>중앙 트레센 학원 고등부<br />진학 선발 전형</>} />}
      {!turnProgress && career.highSchoolAdmission?.resolved && career.highSchoolAdmission.sequenceCompleted && career.turnIndex === 11 && <HighSchoolAdmissionModal career={career} onContinue={onHighAdmissionContinue} />}
      {!turnProgress && career.middleState?.distanceChangePending && <DistanceChangeModal career={career} onSelect={onDistanceChange} />}
      {middleEventOpen && <EventModal event={career.middleState.pendingEvent} outcome={career.middleState.pendingOutcome} onSelect={onMiddleEventChoice} onContinue={onMiddleEventContinue} />}
      {legendOpen && <LegendEventModal event={career.middleState.pendingLegend} outcome={career.middleState.pendingLegendOutcome} onSelect={onLegendSelect} onContinue={onLegendContinue} />}
      {highLegendOpen && <HighSchoolLegendModal event={career.highSchoolLegend.pendingLegend} outcome={career.highSchoolLegend.pendingOutcome} onSelect={onHighLegendSelect} onContinue={onHighLegendContinue} />}
      {highEventOpen && <EventModal event={career.highSchoolState.pendingEvent} outcome={career.highSchoolState.pendingOutcome} onSelect={onHighEventChoice} onContinue={onHighEventContinue} />}
      {runningStyleOpen && <RunningStyleModal decision={career.highSchoolState.pendingRunningStyleDecision} onSelect={onRunningStyleSelect} onContinue={onRunningStyleContinue} />}
      {teamScoutOpen && <InitialTeamScoutModal offerIds={career.teamState.initialOfferTeamIds} onSelect={onTeamInitialSelect} />}
      {!turnProgress && career.teamState?.currentTransferOffer && <TeamTransferModal offer={career.teamState.currentTransferOffer} currentTeamId={career.teamState.currentTeamId} onDecision={onTeamTransferDecision} />}
      {year2SpecialOpen && <Year2SpecialModal special={career.highYear2.pendingSpecial} onSelect={onYear2SpecialSelect} />}
      {year3SpecialOpen && <Year2SpecialModal special={career.highYear3.pendingSpecial} onSelect={onYear3SpecialSelect} />}
      {raceOpen && <RaceModal race={career.highSchoolState.pendingRace} result={career.highSchoolState.pendingRaceResult} racePlan={career.highSchoolState.racePlan} speed={progressSpeed} onSpeedChange={onProgressSpeedChange} onSelect={onRaceSelect} onSequenceComplete={onRaceSequenceComplete} onContinue={onRaceContinue} />}
      {year2AchievementOpen && <Year2AchievementModal achievement={career.highYear2.pendingAchievement} onContinue={onYear2AchievementContinue} />}
      {year3AchievementOpen && <Year2AchievementModal achievement={career.highYear3.pendingAchievements[0]} onContinue={onYear3AchievementContinue} />}
    </main>
  )
}

function Complete({ career, onRestart }) {
  if (career.badEnding) {
    return <main className="result-page page-shell"><header className="topbar"><Brand /><span className="phase-label">BAD END</span></header><div className="result-hero"><p className="eyebrow">고등부 1학년 3분기 · 데뷔전 2회 실패</p><h1>{career.badEnding.title}</h1></div><div className="result-layout"><section className="panel ending-panel"><p className="section-kicker">BAD END</p><p>{career.badEnding.body}</p></section><section className="panel result-stats"><p className="section-kicker">FINAL ABILITY</p><h2>최종 능력치</h2><StatGrid stats={career.stats} /></section></div><button className="primary-button restart-button" type="button" onClick={onRestart}><span>새 커리어 시작</span><span aria-hidden="true">↻</span></button></main>
  }
  if (career.nonRacerEnding) {
    const ending = career.nonRacerEnding
    const middleSchool = getMiddleSchoolById(career.middleState?.schoolId)
    return (
      <main className="result-page page-shell">
        <header className="topbar"><Brand /><span className="phase-label">ANOTHER PATH</span></header>
        <div className="result-hero non-racer-hero"><p className="eyebrow">A DIFFERENT FINISH LINE</p><h1>{ending.title}</h1><strong className="result-name">{career.fullName}의 새로운 길</strong></div>
        <div className="result-layout">
          <section className="panel result-profile"><p className="section-kicker">CAREER PROFILE</p><dl className="profile-list"><div><dt>출신</dt><dd>{career.region.name}</dd></div><div><dt>초등학교</dt><dd>{career.school.name}</dd></div><div><dt>중등학교</dt><dd>{middleSchool?.displayName ?? career.middleState?.schoolName}</dd></div><div><dt>성장 타입</dt><dd>{career.growthType.name}</dd></div><div><dt>중앙 트레센 고등부</dt><dd>불합격</dd></div><div><dt>최종 진로</dt><dd>{ending.career}</dd></div></dl></section>
          <section className="panel result-stats"><p className="section-kicker">FINAL ABILITY</p><h2>최종 능력치</h2><StatGrid stats={career.stats} /></section>
          <section className="panel ending-panel"><p className="section-kicker">ANOTHER PATH</p><h2>「{ending.title}」</h2><p>{ending.body}</p></section>
        </div>
        <button className="primary-button restart-button" type="button" onClick={onRestart}><span>새 커리어 시작</span><span aria-hidden="true">↻</span></button>
      </main>
    )
  }
  const g1Races = (career.history ?? []).flatMap((log) => log.races ?? (log.race ? [log.race] : [])).filter((race) => race.grade === 'G1' || race.raceType === 'G1')
  const g1Wins = g1Races.filter(({ won }) => won)
  const achievements = [...(career.highYear2?.achievements ?? []), ...(career.highYear3?.achievements ?? [])]
  const teamHistory = career.teamState?.history ?? []
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
            <div><dt>주행 스타일</dt><dd>{getRunningStyle(career.runningStyle)?.label ?? '-'}</dd></div>
            <div><dt>G1 출전 / 우승</dt><dd>{g1Races.length}회 / {g1Wins.length}회</dd></div>
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
        {g1Wins.length > 0 && <section className="panel achievement-panel"><p className="section-kicker">MAJOR WINS</p><h2>주요 우승 레이스</h2>{g1Wins.map((race) => <p key={`${race.turn}-${race.raceId}`}>◆ {race.raceName}</p>)}</section>}
        {achievements.length > 0 && <section className="panel achievement-panel"><p className="section-kicker">ACHIEVEMENTS</p><h2>시즌 업적</h2>{achievements.map((achievement) => <p key={achievement.id}>★ {achievement.name}</p>)}</section>}
        <section className="panel achievement-panel"><p className="section-kicker">TEAM CAREER</p><h2>팀 이력</h2>{teamHistory.length ? teamHistory.map((entry, index) => <p key={`${entry.type}-${index}`}>{entry.type === 'TEAM_JOIN' ? `TURN 13 · ${entry.teamName} 가입` : entry.type === 'TEAM_TRANSFER' ? `TURN ${entry.beforeTurn} 전 · ${TEAM_BY_ID[entry.fromTeamId]?.name ?? '무소속'} → ${TEAM_BY_ID[entry.toTeamId]?.name}` : 'TURN 13 · 무소속 선택'}</p>) : <p>무소속</p>}<p><strong>최종 · {TEAM_BY_ID[career.teamState?.currentTeamId]?.name ?? '무소속'}</strong></p></section>
      </div>
      <button className="primary-button restart-button" type="button" onClick={onRestart}><span>다시 시작하기</span><span aria-hidden="true">↻</span></button>
    </main>
  )
}

function AnotherPath({ onComplete }) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, 1400)
    return () => window.clearTimeout(timer)
  }, [onComplete])
  return <main className="another-path page-shell"><p className="eyebrow">ANOTHER PATH</p><h1>레이스와는 다른 길</h1><p>새로운 가능성을 향해 나아갑니다.</p></main>
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
    if (['초등부', '중등부', '고등부'].includes(stage) && (next.elementaryEventState.pendingEvent || next.middleState?.pendingEvent || next.highSchoolState?.pendingEvent)) {
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

  const handleAdmissionSequenceComplete = () => setCareer((current) => completeMiddleAdmissionSequence(current))
  const handleAdmissionContinue = () => setCareer((current) => acknowledgeMiddleAdmission(current))
  const handleHighAdmissionSequenceComplete = () => setCareer((current) => completeHighSchoolAdmissionSequence(current))
  const handleHighAdmissionContinue = () => {
    if (career.highSchoolAdmission?.accepted) {
      setCareer((current) => enterHighSchool(current))
      return
    }
    setCareer((current) => completeNonRacerCareer(current))
    setScreen('ANOTHER_PATH')
  }
  const handleDistanceChange = (growthTypeId) => {
    const resolved = resolveMiddleDistanceChange(career, growthTypeId)
    const next = advanceCareer(resolved)
    const prepared = createTurnProgressPlan(next)
    setCareer(prepared.career)
    setTurnProgress(prepared.plan)
  }
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
  const handleHighLegendSelect = () => setCareer((current) => selectHighSchoolLegendChoice(current))
  const handleHighLegendContinue = () => {
    const next = finishHighSchoolLegend(career)
    setCareer(next)
    const postTurnPending = Boolean(next.highYear2?.pendingSpecial || next.highYear3?.pendingSpecial || next.highSchoolState?.pendingRace || next.highYear2?.pendingAchievement || next.highYear3?.pendingAchievements?.length)
    setTurnProgress((current) => current ? { ...current, legendResolved: !postTurnPending } : current)
    if (next.complete) setScreen(SCREENS.RESULT)
  }
  const handleHighEventChoice = (choiceId) => setCareer((current) => selectHighSchoolEventChoice(current, choiceId))
  const handleHighEventContinue = () => {
    setCareer((current) => finishHighSchoolEvent(current))
    setTurnProgress((current) => current ? { ...current, eventResolved: true } : current)
  }
  const handleRunningStyleSelect = (styleId) => setCareer((current) => selectHighSchoolRunningStyle(current, styleId))
  const handleRunningStyleContinue = () => setCareer((current) => finishHighSchoolRunningStyle(current))
  const handleTeamInitialSelect = (teamId) => setCareer((current) => resolveInitialTeamSelection(current, teamId))
  const handleTeamTransferDecision = (accepted) => {
    const resolved = resolveTeamTransferOffer(career, accepted)
    const next = advanceCareer(resolved)
    const prepared = createTurnProgressPlan(next)
    setCareer(prepared.career)
    setTurnProgress(prepared.plan)
  }
  const handleYear2SpecialSelect = (choiceId) => {
    const next = resolveHighYear2Special(career, choiceId)
    setCareer(next)
    const postTurnPending = Boolean(next.highYear2?.pendingSpecial || next.highSchoolState?.pendingRace)
    setTurnProgress((current) => current ? { ...current, legendResolved: !postTurnPending } : current)
  }
  const handleYear3SpecialSelect = (choiceId) => {
    const next = resolveHighYear3Special(career, choiceId)
    setCareer(next)
    const postTurnPending = Boolean(next.highYear3?.pendingSpecial || next.highSchoolState?.pendingRace || next.highYear3?.pendingAchievements?.length)
    setTurnProgress((current) => current ? { ...current, legendResolved: !postTurnPending } : current)
    if (next.complete) setScreen(SCREENS.RESULT)
  }
  const handleRaceSelect = (choiceId) => setCareer((current) => resolveHighSchoolRace(current, choiceId))
  const handleRaceSequenceComplete = () => setCareer((current) => completeHighSchoolRaceSequence(current))
  const handleRaceContinue = () => {
    const next = finishHighSchoolRace(career)
    setCareer(next)
    const postTurnPending = Boolean(next.highYear2?.pendingSpecial || next.highYear3?.pendingSpecial || next.highSchoolState?.pendingRace || next.highYear2?.pendingAchievement || next.highYear3?.pendingAchievements?.length)
    setTurnProgress((current) => current ? { ...current, legendResolved: !postTurnPending } : current)
    if (next.complete) setScreen(SCREENS.RESULT)
  }
  const handleYear2AchievementContinue = () => {
    setCareer((current) => dismissHighYear2Achievement(current))
    setTurnProgress((current) => current ? { ...current, legendResolved: true } : current)
  }
  const handleYear3AchievementContinue = () => {
    const next = dismissHighYear3Achievement(career)
    setCareer(next)
    const postTurnPending = Boolean(next.highYear3?.pendingSpecial || next.highSchoolState?.pendingRace || next.highYear3?.pendingAchievements?.length)
    setTurnProgress((current) => current ? { ...current, legendResolved: !postTurnPending } : current)
    if (next.complete) setScreen(SCREENS.RESULT)
  }

  const triggerProgressEvent = () => setTurnProgress((current) => current ? { ...current, eventTriggered: true } : current)
  const triggerProgressLegend = () => setTurnProgress((current) => current ? { ...current, legendTriggered: true } : current)
  const completeProgress = () => setTurnProgress(null)

  if (screen === SCREENS.HOME) return <Intro onStart={startNewCareer} />
  if (screen === SCREENS.NAME_ENTRY) return <NameEntry names={names} onChange={handleNameChange} onRandomName={randomizeName} onConfirm={confirmName} onBack={() => setScreen(SCREENS.HOME)} />
  if (screen === SCREENS.ORIGIN) return <OriginReview career={career} onReroll={() => setCareer((current) => rerollCareer(current))} onConfirm={() => setScreen(SCREENS.GROWTH_PLAN)} onBack={() => setScreen(SCREENS.NAME_ENTRY)} />
  if (screen === SCREENS.GROWTH_PLAN) return <GrowthPlan career={career} selectedType={selectedType} onSelect={setSelectedType} onBegin={beginCareer} onBack={() => setScreen(SCREENS.ORIGIN)} />
  if (screen === SCREENS.CAREER) return <Playing career={career} turnProgress={turnProgress} progressSpeed={progressSpeed} onProgressSpeedChange={setProgressSpeed} onProgressEventTrigger={triggerProgressEvent} onProgressLegendTrigger={triggerProgressLegend} onProgressComplete={completeProgress} onAdvance={handleAdvance} onEventChoice={handleEventChoice} onEventContinue={handleEventContinue} onTransferDecision={handleTransferDecision} onTeamInitialSelect={handleTeamInitialSelect} onTeamTransferDecision={handleTeamTransferDecision} onAdmissionContinue={handleAdmissionContinue} onAdmissionSequenceComplete={handleAdmissionSequenceComplete} onHighAdmissionSequenceComplete={handleHighAdmissionSequenceComplete} onHighAdmissionContinue={handleHighAdmissionContinue} onDistanceChange={handleDistanceChange} onMiddleEventChoice={handleMiddleEventChoice} onMiddleEventContinue={handleMiddleEventContinue} onLegendSelect={handleLegendSelect} onLegendContinue={handleLegendContinue} onHighLegendSelect={handleHighLegendSelect} onHighLegendContinue={handleHighLegendContinue} onHighEventChoice={handleHighEventChoice} onHighEventContinue={handleHighEventContinue} onRunningStyleSelect={handleRunningStyleSelect} onRunningStyleContinue={handleRunningStyleContinue} onYear2SpecialSelect={handleYear2SpecialSelect} onYear3SpecialSelect={handleYear3SpecialSelect} onYear2AchievementContinue={handleYear2AchievementContinue} onYear3AchievementContinue={handleYear3AchievementContinue} onRaceSelect={handleRaceSelect} onRaceSequenceComplete={handleRaceSequenceComplete} onRaceContinue={handleRaceContinue} />
  if (screen === 'ANOTHER_PATH') return <AnotherPath onComplete={() => setScreen(SCREENS.RESULT)} />
  if (screen === SCREENS.RESULT) return <Complete career={career} onRestart={startNewCareer} />
  return <Intro onStart={startNewCareer} />
}

export default App
