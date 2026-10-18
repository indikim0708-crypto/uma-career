import { forwardRef } from 'react'

function SectionTitle({ children }) {
  return <p className="summary-card-kicker">{children}</p>
}

const ResultSummaryCard = forwardRef(function ResultSummaryCard({ summary }, ref) {
  const { profile, finalStats, schoolHistory, raceSummary, majorWins, ending } = summary
  return (
    <article className="result-summary-card" ref={ref} aria-hidden="true">
      <header className="summary-card-header">
        <div className="summary-card-brand"><span>UC</span><strong>UMA CAREER</strong></div>
        <p>CAREER RESULT</p>
        <h1>{profile.fullName}</h1>
        <div className="summary-card-meta">
          <span>{profile.growthType}</span>
          <span>{profile.runningStyle ?? '각질 미정'}</span>
          <span>{profile.finalTeam ?? '무소속'}</span>
        </div>
      </header>

      <div className="summary-card-body">
        <div className="summary-card-left">
          <section className="summary-card-section">
            <SectionTitle>FINAL ABILITY</SectionTitle>
            <h2>최종 능력치</h2>
            <div className="summary-card-stats">
              {finalStats.map((stat) => <div key={stat.id}><span>{stat.label}</span><strong>{stat.value}<small> / {stat.maximum}</small></strong><i><b style={{ width: `${Math.min(100, (stat.value / stat.maximum) * 100)}%` }} /></i></div>)}
            </div>
          </section>

          <section className="summary-card-section summary-card-schools">
            <SectionTitle>SCHOOL RECORD</SectionTitle>
            <h2>학교 기록</h2>
            <dl>
              <div><dt>초등부</dt><dd>{schoolHistory.elementary.join(' → ') || '-'}</dd></div>
              {schoolHistory.middle && <div><dt>중등부</dt><dd>{schoolHistory.middle}</dd></div>}
              {schoolHistory.high && <div><dt>고등부</dt><dd>{schoolHistory.high}</dd></div>}
            </dl>
          </section>
        </div>

        <div className="summary-card-right">
          <section className="summary-card-section summary-card-wins">
            <SectionTitle>G1 WINS</SectionTitle>
            <h2>G1 우승</h2>
            {majorWins.length ? <div className="summary-card-win-list">{majorWins.map((race, index) => <p key={`${race.turn}-${race.raceId}-${index}`}><b>★</b>{race.raceName}</p>)}</div> : <p className="summary-card-empty">G1 우승 없음</p>}
          </section>

          <section className="summary-card-section summary-card-overview">
            <SectionTitle>CAREER SUMMARY</SectionTitle>
            <h2>커리어 요약</h2>
            <div className="summary-card-metrics"><div><span>G1 출전</span><strong>{raceSummary.g1Starts}회</strong></div><div><span>G1 우승</span><strong>{raceSummary.g1Wins}회</strong></div></div>
            <div className="summary-card-ending"><span>{ending.type}</span><strong>{ending.title}</strong>{ending.detail && <p>{ending.detail}</p>}</div>
          </section>
        </div>
      </div>

      <footer>UMA CAREER</footer>
    </article>
  )
})

export default ResultSummaryCard
