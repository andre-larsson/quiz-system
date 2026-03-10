import { useEffect, useMemo, useState } from 'react'
import './App.css'

const DEFAULT_QUIZ = `${import.meta.env.BASE_URL}quizzes/intervaller-sv.json`

function App() {
  const [quiz, setQuiz] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isLocked, setIsLocked] = useState(false)
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const response = await fetch(DEFAULT_QUIZ)
        if (!response.ok) throw new Error('Could not read quiz file')
        const data = await response.json()
        validateQuiz(data)
        setQuiz(data)
      } catch (err) {
        setError(err.message)
      }
    }

    loadQuiz()
  }, [])

  const currentQuestion = useMemo(() => {
    if (!quiz) return null
    return quiz.questions[currentIndex] ?? null
  }, [quiz, currentIndex])

  if (error) {
    return <main className="container"><p className="error">{error}</p></main>
  }

  if (!quiz) {
    return <main className="container"><p>Loading quiz…</p></main>
  }

  const isFinished = currentIndex >= quiz.questions.length

  if (isFinished) {
    return (
      <main className="container">
        <section className="card">
          <h1>{quiz.title}</h1>
          <p className="subtitle">Done! You got {score} / {quiz.questions.length} correct.</p>
          <button
            className="primary-btn"
            onClick={() => {
              setCurrentIndex(0)
              setSelectedIndex(null)
              setIsLocked(false)
              setScore(0)
            }}
          >
            Restart
          </button>
        </section>
      </main>
    )
  }

  if (!currentQuestion) {
    return <main className="container"><p className="error">Could not read current question.</p></main>
  }

  const progress = `${currentIndex + 1} / ${quiz.questions.length}`

  const lockAnswer = (optionIndex) => {
    if (isLocked) return
    setSelectedIndex(optionIndex)
    setIsLocked(true)
    if (optionIndex === currentQuestion.correctIndex) {
      setScore((prev) => prev + 1)
    }
  }

  const nextQuestion = () => {
    setCurrentIndex((prev) => prev + 1)
    setSelectedIndex(null)
    setIsLocked(false)
  }

  return (
    <main className="container">
      <section className="card">
        <p className="meta">{quiz.title} • Question {progress}</p>
        <h1>{currentQuestion.question}</h1>

        {currentQuestion.image && (
          <img className="question-image" src={currentQuestion.image} alt="Question illustration" />
        )}

        <div className="options">
          {currentQuestion.options.map((option, index) => {
            const isCorrect = index === currentQuestion.correctIndex
            const isSelected = index === selectedIndex

            let className = 'option-btn'
            if (isLocked && isCorrect) className += ' correct'
            if (isLocked && isSelected && !isCorrect) className += ' wrong'

            return (
              <button
                key={`${currentQuestion.id}-${index}`}
                className={className}
                onClick={() => lockAnswer(index)}
                disabled={isLocked}
              >
                {option}
              </button>
            )
          })}
        </div>

        {isLocked && (
          <button className="primary-btn" onClick={nextQuestion}>
            {currentIndex + 1 < quiz.questions.length ? 'Next question' : 'Show results'}
          </button>
        )}
      </section>
    </main>
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

export default App
