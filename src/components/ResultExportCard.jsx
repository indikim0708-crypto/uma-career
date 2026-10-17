import { forwardRef } from 'react'

const SummaryMetric = ({ label, value }) => <div><span>{label}</span><strong>{value}</strong></div>

function ExportSection({ kicker, title, children, className = '' }) {
  return <section className={`export-section ${className}`}><p className="export-kicker">{kicker}</p><h2>{title}</h2>{children}</section>
}

const ResultExportCard = forwardRef(function ResultExportCard({ summary, generatedDate }, ref) {
  const { profile, finalStats, raceSummary, g1Results, majorWins, achievements, teamCareer, legends, careerPath, notes, ending } = summary
  return (
    <article className="result-export-card" ref={ref} aria-hidden="true">
      <header className="export-header">
        <div><span className="export-brand-mark">UC</span><strong>UMA CAREER</strong></div>
        <p>CAREER RESULT</p>
        <h1>{profile.fullName}</h1>
        <span>24 TURN CAREER RECORD</span>
      </header>

      <div className="export-body">
        <ExportSection kicker="PROFILE" title="커리어 프로필" className="export-profile">
          <dl>
            <div><dt>출신</dt><dd>{profile.region}</dd></div>
            <div><dt>초등학교</dt><dd>{profile.elementarySchool}</dd></div>
            {profile.middleSchool && <div><dt>중등부</dt><dd>{profile.middleSchool}</dd></div>}
            {profile.highSchool && <div><dt>고등부</dt><dd>{profile.highSchool}</dd></div>}
            <div><dt>최종 성장형</dt><dd>{profile.growthType}</dd></div>
            {profile.runningStyle && <div><dt>최종 각질</dt><dd>{profile.runningStyle}</dd></div>}
            <div><dt>최종 소속</dt><dd>{profile.finalTeam ?? '무소속'}</dd></div>
          </dl>
        </ExportSection>

        <ExportSection kicker="FINAL ABILITY" title="최종 능력치">
          <div className="export-stats">
            {finalStats.map((stat) => <div className="export-stat" key={stat.id}><span>{stat.label}</span><strong>{stat.value}<small> / {stat.maximum}</small></strong><i><b style={{ width: `${Math.min(100, (stat.value / stat.maximum) * 100)}%` }} /></i></div>)}
          </div>
        </ExportSection>

        {raceSummary.starts > 0 && <ExportSection kicker="CAREER SUMMARY" title="레이스 기록">
          <div className="export-metrics">
            <SummaryMetric label="총 출전" value={`${raceSummary.starts}회`} />
            <SummaryMetric label="총 우승" value={`${raceSummary.wins}회`} />
            <SummaryMetric label="G1 출전" value={`${raceSummary.g1Starts}회`} />
            <SummaryMetric label="G1 우승" value={`${raceSummary.g1Wins}회`} />
            <SummaryMetric label="G1 2~3착" value={`${raceSummary.g1Top3 - raceSummary.g1Wins}회`} />
          </div>
        </ExportSection>}

        {g1Results.length > 0 && <ExportSection kicker="G1 RESULTS" title="G1 레이스 결과">
          <div className="export-race-list">{g1Results.map((race, index) => <div key={`${race.turn}-${race.raceId}-${index}`}><span><small>{race.periodLabel || `TURN ${race.turn}`}</small>{race.raceName}</span><strong>{race.finishPosition}착</strong></div>)}</div>
        </ExportSection>}

        {(g1Results.length > 0 || achievements.length > 0) && <div className="export-columns">
          {g1Results.length > 0 && <ExportSection kicker="MAJOR WINS" title="주요 우승">
            <div className="export-simple-list">{majorWins.length ? majorWins.map((race, index) => <p key={`${race.turn}-${race.raceId}-${index}`}>◆ {race.raceName}</p>) : <p className="export-empty">G1 우승 없음</p>}</div>
          </ExportSection>}
          <ExportSection kicker="ACHIEVEMENTS" title="시즌 업적">
            <div className="export-simple-list">{achievements.length ? achievements.map((achievement) => <p key={achievement.id}>★ {achievement.name}</p>) : <p className="export-empty">획득한 주요 업적 없음</p>}</div>
          </ExportSection>
        </div>}

        {teamCareer.length > 0 && <ExportSection kicker="TEAM CAREER" title="팀 커리어">
          <div className="export-path">{teamCareer.map((team, index) => <div key={`${team.teamId}-${team.turn}-${index}`}><small>{team.periodLabel}</small><strong>{team.teamName}</strong>{index < teamCareer.length - 1 && <span>↓</span>}</div>)}</div>
        </ExportSection>}

        {legends.length > 0 && <ExportSection kicker="LEGEND ENCOUNTERS" title="전설과의 만남">
          <div className="export-legend-list">{legends.map((legend, index) => <div key={`${legend.turn}-${legend.name}-${index}`}><strong>{legend.name}</strong><span>{legend.title && `「${legend.title}」`}</span></div>)}</div>
        </ExportSection>}

        {careerPath.length > 0 && <ExportSection kicker="CAREER PATH" title="걸어온 길">
          <div className="export-path horizontal">{careerPath.map((path, index) => <div key={`${path}-${index}`}><strong>{path}</strong>{index < careerPath.length - 1 && <span>↓</span>}</div>)}</div>
        </ExportSection>}

        {notes.length > 0 && <ExportSection kicker="CAREER NOTES" title="특별 기록">
          <dl className="export-notes">{notes.map((note) => <div key={note.label}><dt>{note.label}</dt><dd>{note.value}</dd></div>)}</dl>
        </ExportSection>}

        <ExportSection kicker={ending.type} title="엔딩" className="export-ending">
          <strong>{ending.title}</strong>
          {ending.detail && <p>{ending.detail}</p>}
        </ExportSection>
      </div>

      <footer><strong>UMA CAREER</strong><span>Generated {generatedDate}</span></footer>
    </article>
  )
})

export default ResultExportCard
