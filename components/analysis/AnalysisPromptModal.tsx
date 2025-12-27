// components/analysis/AnalysisPromptModal.tsx
'use client'

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import AuthDialog from '@/components/auth/AuthDialog'

interface AnalysisPromptModalProps {
  shouldShow: boolean
  isAnonymous?: boolean
  delaySeconds?: number
}

export function AnalysisPromptModal({
  shouldShow,
  isAnonymous = false,
  delaySeconds = 5,
}: AnalysisPromptModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  useEffect(() => {
    if (!shouldShow) return

    const hasSeen = localStorage.getItem('hasSeenAnalysisPrompt')
    if (hasSeen) return

    const timer = setTimeout(() => {
      setIsOpen(true)
    }, delaySeconds * 1000)

    return () => clearTimeout(timer)
  }, [shouldShow, delaySeconds])

  const handleClose = () => {
    localStorage.setItem('hasSeenAnalysisPrompt', 'true')
    setIsOpen(false)
  }

  const handleTakeAnalysis = () => {
    localStorage.setItem('hasSeenAnalysisPrompt', 'true')
    // Link will handle navigation
  }

  if (!shouldShow) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <VisuallyHidden>
            <DialogTitle>Get Personalized Recommendations</DialogTitle>
            <DialogDescription>
              Take our hair analysis to get personalized product recommendations
            </DialogDescription>
          </VisuallyHidden>

          <Card className="border-0 shadow-none">
            <CardHeader className="text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Sparkles className="text-primary h-8 w-8" />
              </div>
              <CardTitle className="text-2xl">
                Get Personalized Recommendations
              </CardTitle>
              <CardDescription>
                Discover products perfectly matched to your unique hair profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center text-sm">
                Our 5-minute analysis will evaluate your unique hair
                characteristics and provide personalized product
                recommendations.
              </p>
              <Button
                size="lg"
                className="w-full"
                asChild
                onClick={handleTakeAnalysis}
              >
                <Link href="/analysis">Take Hair Analysis</Link>
              </Button>
            </CardContent>

            {isAnonymous && (
              <CardFooter className="flex flex-col space-y-2 border-t pt-4">
                <p className="text-muted-foreground text-center text-sm">
                  Already have an account?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setAuthDialogOpen(true)
                    handleClose() // Close this modal when opening auth
                  }}
                >
                  Sign In
                </Button>
              </CardFooter>
            )}
          </Card>
        </DialogContent>
      </Dialog>

      {/* Reuse existing AuthDialog component */}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        defaultTab="signin"
      />
    </>
  )
}
