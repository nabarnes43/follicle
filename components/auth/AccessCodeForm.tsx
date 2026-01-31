'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth'
import AuthDialog from './AuthDialog'
import SignOutButton from './SignOutButton'

export function AccessCodeForm() {
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = await user?.getIdToken()
      const res = await fetch('/api/validate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Invalid code')
        return
      }

      window.location.reload()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-background flex min-h-screen items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Enter Access Code</CardTitle>
            <CardDescription>
              Follicle is in closed beta. Enter your code to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="FOLLICLE-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={loading}
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !code}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Validating...' : 'Continue'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 border-t pt-4">
            <p className="text-muted-foreground text-center text-sm">
              No code?{' '}
              <a
                href="https://forms.gle/TcdhrGnFRwz9yfUEA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Request Access
              </a>
            </p>
            {user?.isAnonymous ? (
              <>
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
              </>
            ) : (
              <SignOutButton />
            )}
          </CardFooter>
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
