// app/quiz/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { ProgressBar } from '@/components/quiz/ProgressBar'
import { QuizQuestion } from '@/components/quiz/QuizQuestion'
import { Button } from '@/components/ui/button'
import { QUIZ_QUESTIONS } from '@/lib/quiz/questions'

const QUESTIONS_PER_PAGE = 5

type AnswerValue = string | string[] | number
type Answers = Record<string, AnswerValue>

export default function QuizPage() {
  const [currentPage, setCurrentPage] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})

  const totalPages = Math.ceil(QUIZ_QUESTIONS.length / QUESTIONS_PER_PAGE)
  const startIdx = currentPage * QUESTIONS_PER_PAGE
  const endIdx = Math.min(startIdx + QUESTIONS_PER_PAGE, QUIZ_QUESTIONS.length)
  const currentQuestions = QUIZ_QUESTIONS.slice(startIdx, endIdx)

  // Load saved answers from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('quizAnswers')
    if (saved) {
      try {
        setAnswers(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load saved answers:', e)
      }
    }
  }, [])

  // Save answers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('quizAnswers', JSON.stringify(answers))
  }, [answers])

  const handleAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = () => {
    console.log('Quiz submitted:', answers)
    // TODO: Send to backend/ML service
  }

  // Check if current page has all required questions answered
  const canProceed = currentQuestions.every((q) => {
    if (!q.required) return true
    const answer = answers[q.id]
    if (Array.isArray(answer)) return answer.length > 0
    return answer !== undefined && answer !== ''
  })

  return (
    <div className="bg-background min-h-screen">
      {/* Clean Header with just progress */}
      <div className="bg-card sticky top-0 z-40 border-b">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <ProgressBar
            currentStep={startIdx + 1}
            totalSteps={QUIZ_QUESTIONS.length}
          />
        </div>
      </div>

      {/* Quiz Content */}
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-8 space-y-12">
          {currentQuestions.map((question) => (
            <div key={question.id} className="bg-card rounded-lg border p-6">
              <QuizQuestion
                question={question}
                value={answers[question.id]}
                onChange={(value) => handleAnswer(question.id, value)}
              />
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pb-8">
          <Button
            onClick={handleBack}
            disabled={currentPage === 0}
            variant="outline"
            size="lg"
          >
            Back
          </Button>

          <Button onClick={handleNext} disabled={!canProceed} size="lg">
            {currentPage === totalPages - 1 ? 'Submit Quiz' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
