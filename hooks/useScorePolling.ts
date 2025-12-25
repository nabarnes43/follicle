'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth'

interface ScoreProgress {
  current: number
  total: number
}

interface ScorePollingResult<T> {
  data: T[]
  isChecking: boolean
  progress: ScoreProgress | null
  isComplete: boolean
}

interface UseScorePollingOptions {
  enabled: boolean
  apiEndpoint: string
  initialData?: any[]
}

export function useScorePolling<T>({
  enabled,
  apiEndpoint,
  initialData = [],
}: UseScorePollingOptions): ScorePollingResult<T> {
  const { user } = useAuth()
  const [data, setData] = useState<T[]>(initialData)
  const [isChecking, setIsChecking] = useState(enabled)
  const [isComplete, setIsComplete] = useState(false) // ✅ Track completion
  const [progress, setProgress] = useState<ScoreProgress | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // If not enabled or already finished, don't start polling
    if (!enabled || !user || isComplete) {
      setIsChecking(false)
      return
    }

    setIsChecking(true)
    const startTime = Date.now()

    const fetchScores = async () => {
      try {
        const token = await user.getIdToken()
        const response = await fetch(apiEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const responseData = await response.json()
          const total =
            responseData.totalProducts || responseData.totalRoutines || 0

          setProgress({
            current: responseData.count,
            total: total,
          })

          if (responseData.isComplete) {
            setData(responseData.scores || responseData.routines || [])
            setIsComplete(true) // ✅ Mark as finished
            setIsChecking(false)

            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch scores:', error)
      }
    }

    fetchScores()
    intervalRef.current = setInterval(fetchScores, 5000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    // Removed data.length to prevent interval resets during partial progress updates
  }, [enabled, user, apiEndpoint, isComplete])

  return { data, isChecking, progress, isComplete }
}
