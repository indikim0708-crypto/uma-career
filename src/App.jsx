import './App.css'

function App() {
  return (
    <main className="landing">
      <div className="glow glow--violet" aria-hidden="true" />
      <div className="glow glow--gold" aria-hidden="true" />
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">THE RACE BEGINS HERE</p>
        <h1 id="page-title">UMA CAREER</h1>
        <p className="subtitle">우마무스메 커리어 시뮬레이터</p>
        <button className="start-button" type="button"><span>NEW CAREER</span><span aria-hidden="true">→</span></button>
      </section>
    </main>
  )
}

export default App
