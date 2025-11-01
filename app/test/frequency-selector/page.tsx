'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FrequencySelector } from '@/components/routines/FrequencySelector'
import { Frequency } from '@/types/routine'

export default function FrequencySelectorTest() {
  const [frequency, setFrequency] = useState<Frequency>({
    interval: 1,
    unit: 'day',
  })

  return (
    <div className="container mx-auto max-w-2xl p-8">
      <Link
        href="/test"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-2 text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="mb-8 text-3xl font-bold">FrequencySelector</h1>

      <div className="space-y-6">
        <FrequencySelector
          value={frequency}
          onChange={setFrequency}
          label="Test Frequency"
        />

        <div className="bg-muted rounded p-4">
          <pre className="text-sm">{JSON.stringify(frequency, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
