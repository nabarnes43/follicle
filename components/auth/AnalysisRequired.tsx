'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import AuthDialog from './AuthDialog'

interface AnalysisRequiredProps {
  title?: string
  message?: string
  showSignInPrompt?: boolean
}

export function AnalysisRequired({
  title = 'Complete Your Hair Analysis',
  message = 'You need to complete your hair analysis to access this feature',
  showSignInPrompt = false,
}: AnalysisRequiredProps) {
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  return (
    <>
      <div className="bg-background flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Sparkles className="text-primary h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center text-sm">
              Our 5-minute analysis will evaluate your unique hair
              characteristics and provide personalized product recommendations.
            </p>
            <Button size="lg" className="w-full" asChild>
              <Link href="/analysis">Take Hair Analysis</Link>
            </Button>
          </CardContent>

          {showSignInPrompt && (
            <CardFooter className="flex flex-col space-y-2 border-t pt-4">
              <p className="text-muted-foreground text-center text-sm">
                Already have an account?
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setAuthDialogOpen(true)}
              >
                Sign In
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        defaultTab="signin"
      />
    </>
  )
}
