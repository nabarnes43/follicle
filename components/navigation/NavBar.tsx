'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Beaker,
  Bookmark,
  Globe,
  TestTubes,
  CalendarDays,
  Plus,
  User,
} from 'lucide-react'

export default function NavBar() {
  const pathname = usePathname()

  const navLinks = [
    { href: '/ingredients', label: 'Ingredients', icon: TestTubes },
    { href: '/products', label: 'Products', icon: Beaker },
    { href: '/products/saved', label: 'Saved Products', icon: Bookmark },
    { href: '/routines/public', label: 'Browse Routines', icon: Globe },
    { href: '/routines/private', label: 'My Routines', icon: CalendarDays },
    { href: '/routines/create', label: 'Create Routine', icon: Plus },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link href="/">
          <span className="text-xl font-bold">Follicle</span>
        </Link>

        <div className="flex items-center space-x-6">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-primary flex items-center space-x-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-black' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
