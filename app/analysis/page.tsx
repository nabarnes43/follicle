// app/analysis/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProgressBar } from '@/components/analysis/ProgressBar'
import { AnalysisQuestion } from '@/components/analysis/AnalysisQuestion'
import { Button } from '@/components/ui/button'
import { SHORT_ANALYSIS_QUESTIONS } from '@/lib/analysis/questions-short'
import { saveAnalysisResults } from '@/lib/firebase/analysis'
import { useAuth } from '@/contexts/auth'

const QUESTIONS_PER_PAGE = 5

export default function AnalysisPage() {
  const [currentPage, setCurrentPage] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const totalPages = Math.ceil(
    SHORT_ANALYSIS_QUESTIONS.length / QUESTIONS_PER_PAGE
  )
  const startIdx = currentPage * QUESTIONS_PER_PAGE
  const endIdx = Math.min(
    startIdx + QUESTIONS_PER_PAGE,
    SHORT_ANALYSIS_QUESTIONS.length
  )
  const currentQuestions = SHORT_ANALYSIS_QUESTIONS.slice(startIdx, endIdx)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('analysisAnswers')
    if (saved) setAnswers(JSON.parse(saved))
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('analysisAnswers', JSON.stringify(answers))
  }, [answers])

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

  const handleSubmit = async () => {
    console.log('1. handleSubmit called')
    console.log('2. User:', user)
    console.log('3. Answers:', answers)

    if (!user?.uid) {
      console.log('4. NO USER UID - stopping')
      return
    }

    console.log('5. User is valid, proceeding...')
    const email = user.email || undefined

    console.log('6. Starting submission...')
    setIsSubmitting(true)

    try {
      console.log('7. Calling saveAnalysisResults...')
      const follicleId = await saveAnalysisResults(user.uid, email, answers)
      console.log('8. Got follicleId:', follicleId)

      localStorage.removeItem('analysisAnswers')
      console.log('9. Navigating to results...')
      router.push(`/analysis/results?follicleId=${follicleId}`)
    } catch (error) {
      console.error('10. ERROR:', error)
      setIsSubmitting(false)
    }
  }

  const canProceed = currentQuestions.every((q) => {
    if (!q.required) return true
    const answer = answers[q.id]
    if (Array.isArray(answer)) return answer.length > 0
    return answer !== undefined && answer !== ''
  })

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-card sticky top-0 z-40 border-b">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <ProgressBar
            currentStep={startIdx + 1}
            totalSteps={SHORT_ANALYSIS_QUESTIONS.length}
          />
        </div>
      </div>

      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-8 space-y-12">
          {currentQuestions.map((question) => (
            <div key={question.id} className="bg-card rounded-lg border p-6">
              <AnalysisQuestion
                question={question}
                value={answers[question.id]}
                onChange={(value) =>
                  setAnswers((prev) => ({ ...prev, [question.id]: value }))
                }
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pb-8">
          <Button
            onClick={handleBack}
            disabled={currentPage === 0 || isSubmitting}
            variant="outline"
            size="lg"
          >
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed || isSubmitting}
            size="lg"
          >
            {isSubmitting
              ? 'Submitting...'
              : currentPage === totalPages - 1
                ? 'Get My Results'
                : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
