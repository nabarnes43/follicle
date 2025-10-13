'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase/client'
import { signOut } from 'firebase/auth'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sparkles, Bookmark, User, LogOut, ChevronDown } from 'lucide-react'

export default function NavBar() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false)
  const [checkingQuiz, setCheckingQuiz] = useState(true)

  useEffect(() => {
    const checkQuizCompletion = async () => {
      if (!user) {
        setCheckingQuiz(false)
        return
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        const follicleId = userDoc.data()?.follicleId
        setHasCompletedQuiz(!!follicleId)
      } catch (error) {
        console.error('Error checking quiz completion:', error)
        setHasCompletedQuiz(false)
      } finally {
        setCheckingQuiz(false)
      }
    }

    checkQuizCompletion()
  }, [user])

  if (loading || checkingQuiz || !hasCompletedQuiz) {
    return null
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push('/') // Redirect to home page after sign out
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const navLinks = [
    { href: '/recommendations', label: 'Products', icon: Sparkles },
    { href: '/saved', label: 'Saved', icon: Bookmark },
  ]

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between">
        {/* Logo - Left */}
        <Link href="/recommendations">
          <span className="text-xl font-bold">Follicle</span>
        </Link>

        {/* Nav Links + User Menu - Right */}
        <div className="flex items-center space-x-6">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-primary flex items-center space-x-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            )
          })}

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <User className="mr-2 h-4 w-4" />
                <span>Account</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link
                  href="/profile"
                  className="flex cursor-pointer items-center"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
