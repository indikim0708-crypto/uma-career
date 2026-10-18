import { forwardRef } from 'react'

function SectionTitle({ children }) {
  return <p className="summary-card-kicker">{children}</p>
}

function displayWholeStat(value) {
  return Math.round(Number(value) || 0)
}

const ResultSummaryCard = forwardRef(function ResultSummaryCard({ summary }, ref) {
  const { profile, finalStats, schoolHistory, raceSummary, raceRecords, achievements, ending } = summary
  const hasHighSchool = Boolean(schoolHistory.high)
  const isAnotherPath = ending.type === 'ANOTHER PATH'
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
              {finalStats.map((stat) => <div key={stat.id}><span>{stat.label}</span><strong>{displayWholeStat(stat.value)}<small> / {stat.maximum}</small></strong><i><b style={{ width: `${Math.min(100, (stat.value / stat.maximum) * 100)}%` }} /></i></div>)}
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
          <section className="summary-card-section summary-card-race-record">
            <SectionTitle>RACE RECORD</SectionTitle>
            <h2>레이스 전적</h2>
            {raceRecords.length ? <div className="summary-card-race-list">{raceRecords.map((race, index) => <p key={`${race.turn}-${race.raceId}-${index}`}><b className={`race-grade-${race.grade.toLowerCase()}`}>[{race.grade}]</b><span>{race.raceName}</span><strong>{race.finalPosition}착</strong></p>)}</div> : <p className="summary-card-empty">출전 기록 없음</p>}
          </section>
        </div>

        <div className={`summary-card-bottom${isAnotherPath ? ' summary-card-bottom-another-path' : ''}`}>
          <section className={`summary-card-section summary-card-overview${isAnotherPath ? ' summary-card-another-path' : ''}`}>
            <SectionTitle>CAREER SUMMARY</SectionTitle>
            <h2>커리어 요약</h2>
            {hasHighSchool ? <div className="summary-card-metrics"><div><span>G1 출전</span><strong>{raceSummary.g1Starts}회</strong></div><div><span>G1 우승</span><strong>{raceSummary.g1Wins}회</strong></div></div> : <div className="summary-card-path-metrics"><span>고등부 진학</span><strong>다른 길을 선택했습니다</strong></div>}
            <div className="summary-card-ending"><span>{ending.type}</span><strong>{ending.title}</strong>{ending.career && <em>최종 진로 · {ending.career}</em>}{ending.detail && <p>{ending.detail}</p>}</div>
          </section>
          <section className="summary-card-section summary-card-achievements">
            <SectionTitle>ACHIEVEMENTS</SectionTitle>
            <h2>시즌 업적</h2>
            {achievements.length ? <div className="summary-card-achievement-list">{achievements.map((achievement) => <p key={achievement.id}>◆ {achievement.name}</p>)}</div> : <p className="summary-card-empty">획득한 시즌 업적 없음</p>}
          </section>
        </div>
      </div>

      <footer>UMA CAREER</footer>
    </article>
  )
})

export default ResultSummaryCard
