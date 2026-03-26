import { useMemo, useState } from 'react'
import './App.css'

const QUIZ_FILES = [
  { id: 'intervals', name: 'Interval Quiz', file: 'intervaller-sv.json', description: 'Test interval basics and semitone recognition.' },
  { id: 'chords', name: 'Chord Quiz', file: 'chords-en.json', description: 'Practice chord quality, symbols, and interval structure.' }
]

const DEFAULT_SETTINGS = {
  shuffleQuestions: false,
  randomizeOptions: false,
  showImmediateFeedback: true
}

function App() {
  const [screen, setScreen] = useState('menu')
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isLocked, setIsLocked] = useState(false)
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)

  const currentQuestion = useMemo(() => questions[currentIndex] ?? null, [questions, currentIndex])

  const startQuiz = async (quizMeta) => {
    try {
      setError('')
      const url = `${import.meta.env.BASE_URL}quizzes/${quizMeta.file}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Could not read quiz file')

      const data = await response.json()
      validateQuiz(data)

      let prepared = data.questions.map((q) => ({ ...q }))
      if (settings.shuffleQuestions) prepared = shuffle(prepared)
      if (settings.randomizeOptions) prepared = prepared.map((q) => randomizeQuestionOptions(q))

      setQuiz({ ...data, file: quizMeta.file })
      setQuestions(prepared)
      setCurrentIndex(0)
      setSelectedIndex(null)
      setIsLocked(false)
      setScore(0)
      setScreen('play')
    } catch (err) {
      setError(err.message)
      setScreen('menu')
    }
  }

  const lockAnswer = (optionIndex) => {
    if (isLocked || !currentQuestion) return
    setSelectedIndex(optionIndex)
    setIsLocked(true)
    if (optionIndex === currentQuestion.correctIndex) {
      setScore((prev) => prev + 1)
    }

    if (!settings.showImmediateFeedback) {
      setTimeout(() => {
        goToNextQuestion()
      }, 280)
    }
  }

  const goToNextQuestion = () => {
    if (!quiz) return

    const nextIndex = currentIndex + 1
    if (nextIndex >= questions.length) {
      setScreen('results')
      return
    }

    setCurrentIndex(nextIndex)
    setSelectedIndex(null)
    setIsLocked(false)
  }

  const restartCurrentQuiz = () => {
    if (!quiz) return
    startQuiz({ file: quiz.file || QUIZ_FILES[0].file })
  }

  return (
    <main className="container">
      <section className="arcade">
        <div className="floating-orb orb-one" aria-hidden="true" />
        <div className="floating-orb orb-two" aria-hidden="true" />
        <div className="floating-orb orb-three" aria-hidden="true" />
        <header className="topbar">
          <div>
            <h1>Quiz System</h1>
            <p className="hero-copy">A file-driven quiz app for practicing intervals, chords, and other question sets loaded from JSON.</p>
          </div>
          <div className="hero-badges" aria-label="Highlights">
            <span className="badge">2 quiz packs</span>
            <span className="badge">JSON-powered</span>
            <span className="badge badge-accent">Arcade energy</span>
          </div>
        </header>

        {error && <p className="error">{error}</p>}

        {screen === 'menu' && (
          <MenuView
            settings={settings}
            onChangeSettings={setSettings}
            onStart={startQuiz}
            onOpenHelp={() => setScreen('help')}
            onOpenFormat={() => setScreen('format')}
          />
        )}

        {screen === 'play' && quiz && currentQuestion && (
          <PlayView
            quiz={quiz}
            questions={questions}
            currentQuestion={currentQuestion}
            currentIndex={currentIndex}
            selectedIndex={selectedIndex}
            isLocked={isLocked}
            score={score}
            showImmediateFeedback={settings.showImmediateFeedback}
            onSelectAnswer={lockAnswer}
            onNext={goToNextQuestion}
            onExit={() => setScreen('menu')}
          />
        )}

        {screen === 'results' && quiz && (
          <ResultsView
            quiz={quiz}
            score={score}
            total={questions.length}
            onPlayAgain={restartCurrentQuiz}
            onBackToMenu={() => setScreen('menu')}
          />
        )}

        {screen === 'help' && <HelpView onBack={() => setScreen('menu')} />}
        {screen === 'format' && <FormatView onBack={() => setScreen('menu')} />}
      </section>
    </main>
  )
}

function MenuView({ settings, onChangeSettings, onStart, onOpenHelp, onOpenFormat }) {
  return (
    <div className="menu-grid">
      <section className="panel panel-feature">
        <div className="panel-kicker">Pick your flavor</div>
        <h2>Start Menu</h2>
        <p className="muted">Choose a quiz and launch a noisy little brain workout.</p>
        <div className="quiz-list">
          {QUIZ_FILES.map((q) => (
            <button key={q.id} className="quiz-card" onClick={() => onStart(q)}>
              <span className="quiz-icon" aria-hidden="true">{q.id === 'intervals' ? '🎵' : '⚡'}</span>
              <strong>{q.name}</strong>
              <span>{q.description}</span>
              <span className="quiz-cta">Launch this quiz</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-kicker">Tweak the mayhem</div>
        <h2>Settings</h2>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.shuffleQuestions}
            onChange={(e) => onChangeSettings((s) => ({ ...s, shuffleQuestions: e.target.checked }))}
          />
          Shuffle question order
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.randomizeOptions}
            onChange={(e) => onChangeSettings((s) => ({ ...s, randomizeOptions: e.target.checked }))}
          />
          Randomize answer options
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.showImmediateFeedback}
            onChange={(e) => onChangeSettings((s) => ({ ...s, showImmediateFeedback: e.target.checked }))}
          />
          Show immediate right/wrong colors
        </label>
      </section>

      <section className="panel">
        <div className="panel-kicker">Useful nerd stuff</div>
        <h2>Help & Info</h2>
        <p className="muted">Read the rules, inspect the JSON shape, then get back to the confetti.</p>
        <div className="menu-actions">
          <button className="ghost-btn" onClick={onOpenHelp}>Help</button>
          <button className="ghost-btn" onClick={onOpenFormat}>Quiz format spec</button>
        </div>
      </section>
    </div>
  )
}

function PlayView({
  quiz,
  questions,
  currentQuestion,
  currentIndex,
  selectedIndex,
  isLocked,
  score,
  showImmediateFeedback,
  onSelectAnswer,
  onNext,
  onExit
}) {
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <>
      <section className="play-shell">
        <div className="status-strip">
          <span className="status-pill">{quiz.title}</span>
          <span className="status-pill">Question {currentIndex + 1} / {questions.length}</span>
          <span className="status-pill status-pill-hot">Score {score}</span>
        </div>
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <h2 className="question-title">{currentQuestion.question}</h2>

      {currentQuestion.image && (
        <img className="question-image" src={currentQuestion.image} alt="Question illustration" />
      )}

      <div className="options">
        {currentQuestion.options.map((option, index) => {
          const isCorrect = index === currentQuestion.correctIndex
          const isSelected = index === selectedIndex

          let className = 'option-btn'
          if (showImmediateFeedback && isLocked && isCorrect) className += ' correct'
          if (showImmediateFeedback && isLocked && isSelected && !isCorrect) className += ' wrong'

          return (
            <button
              key={`${currentQuestion.id}-${index}`}
              className={className}
              onClick={() => onSelectAnswer(index)}
              disabled={isLocked}
            >
              {option}
            </button>
          )
        })}
      </div>

      <div className="row">
        <button className="ghost-btn" onClick={onExit}>Back to menu</button>
        {showImmediateFeedback && isLocked && (
          <button className="primary-btn" onClick={onNext}>
            {currentIndex + 1 < questions.length ? 'Next question' : 'Show results'}
          </button>
        )}
      </div>
    </>
  )
}

function ResultsView({ quiz, score, total, onPlayAgain, onBackToMenu }) {
  const pct = Math.round((score / total) * 100)
  const reaction = pct >= 80 ? 'You crushed it.' : pct >= 50 ? 'Respectable chaos.' : 'A dramatic warm-up round.'

  return (
    <div className="panel results-panel">
      <div className="panel-kicker">Final tally</div>
      <h2>{quiz.title} Results</h2>
      <p className="subtitle">You scored {score} / {total} ({pct}%).</p>
      <p className="results-burst">{reaction}</p>
      <div className="menu-actions">
        <button className="primary-btn" onClick={onPlayAgain}>Play again</button>
        <button className="ghost-btn" onClick={onBackToMenu}>Back to menu</button>
      </div>
    </div>
  )
}

function HelpView({ onBack }) {
  return (
    <section className="panel prose">
      <div className="panel-kicker">How to play</div>
      <h2>Help</h2>
      <ul>
        <li>Pick a quiz from the Start Menu.</li>
        <li>Use Settings to shuffle questions/options.</li>
        <li>Enable or disable immediate feedback coloring.</li>
        <li>Each quiz is loaded from a JSON file in <code>public/quizzes/</code>.</li>
      </ul>
      <button className="ghost-btn" onClick={onBack}>Back</button>
    </section>
  )
}

function FormatView({ onBack }) {
  return (
    <section className="panel prose">
      <div className="panel-kicker">For quiz authors</div>
      <h2>Quiz format</h2>
      <p>Each quiz file is a plain JSON document:</p>
      <pre>{`{
  "title": "Quiz title",
  "version": 1,
  "questions": [
    {
      "id": "q1",
      "question": "Your question text",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 1,
      "image": "/images/example.png"
    }
  ]
}`}</pre>
      <button className="ghost-btn" onClick={onBack}>Back</button>
    </section>
  )
}

function validateQuiz(quiz) {
  if (!quiz?.title || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    throw new Error('Invalid quiz file: missing title or questions')
  }

  quiz.questions.forEach((question, idx) => {
    if (!question.id || !question.question) {
      throw new Error(`Question ${idx + 1}: missing id or question`)
    }

    if (!Array.isArray(question.options) || question.options.length < 2) {
      throw new Error(`Question ${idx + 1}: options must contain at least 2 answers`)
    }

    if (
      typeof question.correctIndex !== 'number' ||
      question.correctIndex < 0 ||
      question.correctIndex >= question.options.length
    ) {
      throw new Error(`Question ${idx + 1}: correctIndex is out of range`)
    }
  })
}

function shuffle(arr) {
  const next = [...arr]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function randomizeQuestionOptions(question) {
  const indexed = question.options.map((text, idx) => ({ text, idx }))
  const shuffled = shuffle(indexed)
  return {
    ...question,
    options: shuffled.map((x) => x.text),
    correctIndex: shuffled.findIndex((x) => x.idx === question.correctIndex)
  }
}

export default App
