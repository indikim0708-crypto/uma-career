import { useState } from 'react'
import './App.css'
import { GROWTH_TYPES } from './data/growthTypes.js'
import { MAX_STAT, STATS } from './data/stats.js'
import { TURNS } from './data/turns.js'
import { createCareer, chooseGrowthType, rerollCareer } from './game/createCareer.js'
import { getCareerEvaluation } from './game/evaluation.js'
import { advanceCareer, displayStat } from './game/growth.js'

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
            {delta !== null && <span className="stat-delta">+{delta}</span>}
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

function NameEntry({ names, onChange, onConfirm, onBack }) {
  const canContinue = Boolean(names.lastName.trim() && names.firstName.trim())

  return (
    <main className="game-page page-shell">
      <header className="topbar"><Brand /><span className="phase-label">NEW CAREER</span></header>
      <form className="flow-layout name-form" onSubmit={(event) => { event.preventDefault(); if (canContinue) onConfirm() }}>
        <button className="back-button" type="button" onClick={onBack}>← 홈으로</button>
        <section className="panel">
          <p className="section-kicker">NEW CAREER</p>
          <h1>캐릭터의 이름을<br />입력하세요.</h1>
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
          <button className="secondary-button" type="button" onClick={onReroll}>리롤 하기 <span aria-hidden="true">↻</span></button>
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

function GrowthLog({ log, isLatest }) {
  return (
    <article className={`log-card ${isLatest ? 'latest' : ''}`}>
      <header><span>TURN {String(log.turn).padStart(2, '0')}</span><strong>{log.label}</strong></header>
      <div className="log-stats">
        {STATS.map(({ id, label }) => {
          const before = displayStat(log.before[id])
          const after = displayStat(log.after[id])
          return <p key={id}><span>{label}</span><span>{isLatest && <small>{before} → {after}</small>} <em>+{after - before}</em></span></p>
        })}
      </div>
      <footer>컨디션 <span>{log.conditionBefore}</span><b>→</b><strong>{log.conditionAfter}</strong></footer>
    </article>
  )
}

function Playing({ career, onAdvance }) {
  const currentTurn = TURNS[career.turnIndex]
  const lastLog = career.logs[0]
  const progress = ((career.turnIndex) / TURNS.length) * 100

  return (
    <main className="game-page page-shell">
      <header className="topbar"><Brand /><span className="phase-label">{currentTurn.stage} · TURN {String(currentTurn.number).padStart(2, '0')}</span></header>
      <div className="progress-line"><span style={{ width: `${progress}%` }} /></div>

      <div className="dashboard-layout">
        <section className="career-summary">
          <div className="chapter-line"><p className="section-kicker">CURRENT CHAPTER</p><span>{currentTurn.number} / {TURNS.length}</span></div>
          <p className="character-name">{career.fullName}</p>
          <h1>{currentTurn.label}</h1>
          <p className="summary-line">{career.region.name} · {currentTurn.stage === '초등부' ? career.school.name : `${currentTurn.stage} 과정`}</p>
          <p className="summary-line">{career.growthType.name} · 컨디션 <strong className={`condition condition-${career.condition}`}>{career.condition}</strong></p>
          {career.notice && <div className="milestone"><span>◆</span><p>{career.notice}</p></div>}
        </section>

        <section className="panel ability-panel">
          <div className="section-heading"><div><p className="section-kicker">CURRENT ABILITY</p><h2>능력치</h2></div>{lastLog && <span className="growth-caption">직전 턴 성장량</span>}</div>
          <StatGrid stats={career.stats} previousStats={lastLog?.before} />
        </section>

        <aside className="log-panel">
          <div className="section-heading"><div><p className="section-kicker">HISTORY</p><h2>최근 성장</h2></div><span>최근 {Math.min(career.logs.length, 3)}개</span></div>
          {career.logs.length > 0 ? career.logs.slice(0, 3).map((log, index) => <GrowthLog log={log} isLatest={index === 0} key={log.turn} />) : <div className="empty-log"><p>첫 성장 기록을 기다리고 있습니다.</p></div>}
        </aside>
        <div className="turn-action">
          <button className="primary-button" type="button" onClick={onAdvance}><span>다음 턴</span><span aria-hidden="true">→</span></button>
        </div>
      </div>
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

  const startNewCareer = () => {
    setNames({ lastName: '', firstName: '' })
    setCareer(null)
    setSelectedType(null)
    setScreen(SCREENS.NAME_ENTRY)
  }

  const handleNameChange = (event) => {
    setNames((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

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
    const next = advanceCareer(career)
    setCareer(next)
    if (next.complete) setScreen(SCREENS.RESULT)
  }

  if (screen === SCREENS.HOME) return <Intro onStart={startNewCareer} />
  if (screen === SCREENS.NAME_ENTRY) return <NameEntry names={names} onChange={handleNameChange} onConfirm={confirmName} onBack={() => setScreen(SCREENS.HOME)} />
  if (screen === SCREENS.ORIGIN) return <OriginReview career={career} onReroll={() => setCareer((current) => rerollCareer(current))} onConfirm={() => setScreen(SCREENS.GROWTH_PLAN)} onBack={() => setScreen(SCREENS.NAME_ENTRY)} />
  if (screen === SCREENS.GROWTH_PLAN) return <GrowthPlan career={career} selectedType={selectedType} onSelect={setSelectedType} onBegin={beginCareer} onBack={() => setScreen(SCREENS.ORIGIN)} />
  if (screen === SCREENS.CAREER) return <Playing career={career} onAdvance={handleAdvance} />
  if (screen === SCREENS.RESULT) return <Complete career={career} onRestart={startNewCareer} />
  return <Intro onStart={startNewCareer} />
}

export default App
