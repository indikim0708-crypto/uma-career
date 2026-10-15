import { useState } from 'react'
import './App.css'
import { GROWTH_TYPES } from './data/growthTypes.js'
import { MAX_STAT, STATS } from './data/stats.js'
import { TURNS } from './data/turns.js'
import { createCareer, chooseGrowthType } from './game/createCareer.js'
import { getCareerEvaluation } from './game/evaluation.js'
import { advanceCareer, displayStat } from './game/growth.js'

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
            <div className="stat-heading">
              <span>{label}</span>
              <strong>{value} <small>/ {MAX_STAT}</small></strong>
            </div>
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
        <h1 id="page-title">UMA<br />CAREER</h1>
        <p className="intro-subtitle">우마무스메 커리어 시뮬레이터</p>
        <button className="primary-button" type="button" onClick={onStart}><span>NEW CAREER</span><span aria-hidden="true">→</span></button>
        <p className="intro-note">초등부 1학년부터 고등부 3학년까지 · 24 TURNS</p>
      </section>
    </main>
  )
}

function Setup({ career, selectedType, onSelect, onBegin, onReroll }) {
  return (
    <main className="game-page page-shell">
      <header className="topbar"><Brand /><span className="phase-label">CAREER SETUP</span></header>
      <div className="setup-layout">
        <section className="panel origin-card">
          <p className="section-kicker">01 · ORIGIN</p>
          <h2>새로운 유망주를<br />발견했습니다.</h2>
          <dl className="profile-list">
            <div><dt>출신 지역</dt><dd>{career.region.name}</dd></div>
            <div><dt>배정 학교</dt><dd>{career.school.name}</dd></div>
            <div><dt>학교 분류</dt><dd>{career.school.rank}</dd></div>
            <div><dt>육성 성향</dt><dd>{career.school.tendency}</dd></div>
          </dl>
          <button className="text-button" type="button" onClick={onReroll}>다른 유망주 찾기 ↻</button>
        </section>

        <section className="panel initial-stats">
          <div className="section-heading"><div><p className="section-kicker">02 · INITIAL ABILITY</p><h2>초기 능력치</h2></div><span className="hidden-badge">HIDDEN TRAITS GENERATED</span></div>
          <StatGrid stats={career.stats} />
          <p className="muted-copy">포텐셜과 안정성은 커리어 종료 시 공개됩니다.</p>
        </section>

        <section className="type-section">
          <div className="section-heading"><div><p className="section-kicker">03 · GROWTH PLAN</p><h2>성장 타입 선택</h2></div><p>초기 능력치와 무관하게 앞으로의 성장 방향을 결정합니다.</p></div>
          <div className="type-grid">
            {GROWTH_TYPES.map((type) => (
              <button className={`type-card ${selectedType === type.id ? 'selected' : ''}`} type="button" key={type.id} onClick={() => onSelect(type.id)} aria-pressed={selectedType === type.id}>
                <span className="type-number">0{GROWTH_TYPES.indexOf(type) + 1}</span>
                <span className="type-distance">{type.distance}</span>
                <strong>{type.name}</strong>
                <span className="type-description">{type.description}</span>
                <span className="trait"><small>메인</small>{type.main.join(' / ')}</span>
                <span className="trait"><small>보조</small>{type.support.join(' / ')}</span>
              </button>
            ))}
          </div>
          <div className="setup-action">
            <button className="primary-button" type="button" disabled={!selectedType} onClick={onBegin}><span>육성 시작</span><span aria-hidden="true">→</span></button>
          </div>
        </section>
      </div>
    </main>
  )
}

function GrowthLog({ log }) {
  return (
    <article className="log-card">
      <header><span>TURN {String(log.turn).padStart(2, '0')}</span><strong>{log.label}</strong></header>
      <div className="log-stats">
        {STATS.map(({ id, label }) => {
          const before = displayStat(log.before[id])
          const after = displayStat(log.after[id])
          return <p key={id}><span>{label}</span><span>{before} → <strong>{after}</strong> <em>+{after - before}</em></span></p>
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
          <p className="section-kicker">CURRENT CHAPTER</p>
          <h1>{currentTurn.label}</h1>
          <div className="summary-meta">
            <div><span>소속 / 시기</span><strong>{currentTurn.stage === '초등부' ? career.school.name : `${currentTurn.stage} 과정`}</strong></div>
            <div><span>출신</span><strong>{career.region.name}</strong></div>
            <div><span>성장 타입</span><strong>{career.growthType.name}</strong></div>
            <div><span>컨디션</span><strong className={`condition condition-${career.condition}`}>{career.condition}</strong></div>
          </div>
          {career.notice && <div className="milestone"><span>◆</span><p>{career.notice}</p></div>}
          <div className="turn-action">
            <button className="primary-button" type="button" onClick={onAdvance}><span>다음 턴</span><span aria-hidden="true">→</span></button>
            <small>{currentTurn.number} / {TURNS.length} TURN</small>
          </div>
        </section>

        <section className="panel ability-panel">
          <div className="section-heading"><div><p className="section-kicker">CURRENT ABILITY</p><h2>능력치</h2></div>{lastLog && <span className="growth-caption">직전 턴 성장량</span>}</div>
          <StatGrid stats={career.stats} previousStats={lastLog?.before} />
        </section>

        <aside className="log-panel">
          <div className="section-heading"><div><p className="section-kicker">HISTORY</p><h2>성장 로그</h2></div><span>최근 {Math.min(career.logs.length, 5)}개</span></div>
          {career.logs.length > 0 ? career.logs.map((log) => <GrowthLog log={log} key={log.turn} />) : <div className="empty-log"><span>01</span><p>첫 성장 기록을<br />기다리고 있습니다.</p></div>}
        </aside>
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
        <h1>CAREER<br />COMPLETE</h1>
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
  const [screen, setScreen] = useState('intro')
  const [career, setCareer] = useState(null)
  const [selectedType, setSelectedType] = useState(null)

  const startNewCareer = () => {
    setCareer(createCareer())
    setSelectedType(null)
    setScreen('setup')
  }

  const beginCareer = () => {
    setCareer((current) => chooseGrowthType(current, selectedType))
    setScreen('playing')
  }

  const handleAdvance = () => {
    const next = advanceCareer(career)
    setCareer(next)
    if (next.complete) setScreen('complete')
  }

  if (screen === 'intro') return <Intro onStart={startNewCareer} />
  if (screen === 'setup') return <Setup career={career} selectedType={selectedType} onSelect={setSelectedType} onBegin={beginCareer} onReroll={startNewCareer} />
  if (screen === 'complete') return <Complete career={career} onRestart={startNewCareer} />
  return <Playing career={career} onAdvance={handleAdvance} />
}

export default App
