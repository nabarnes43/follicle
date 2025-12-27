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
  ChevronDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export default function NavBar() {
  const pathname = usePathname()

  // Helper to check if any route in a group is active
  const isGroupActive = (paths: string[]) => {
    return paths.some((path) => pathname === path || pathname.startsWith(path))
  }

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link href="/">
          <span className="text-xl font-bold">Follicle</span>
        </Link>

        <div className="flex items-center space-x-6">
          {/* Products Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`flex items-center space-x-1 text-sm font-medium ${
                  isGroupActive(['/products'])
                    ? 'text-black'
                    : 'text-muted-foreground'
                }`}
              >
                <Beaker className="h-4 w-4" />
                <span>Products</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link
                  href="/products"
                  className="flex w-full items-center space-x-2"
                >
                  <Beaker className="h-4 w-4" />
                  <span>All Products</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/products/saved"
                  className="flex w-full items-center space-x-2"
                >
                  <Bookmark className="h-4 w-4" />
                  <span>My Products</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Routines Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`flex items-center space-x-1 text-sm font-medium ${
                  isGroupActive(['/routines'])
                    ? 'text-black'
                    : 'text-muted-foreground'
                }`}
              >
                <Globe className="h-4 w-4" />
                <span>Routines</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link
                  href="/routines/public"
                  className="flex w-full items-center space-x-2"
                >
                  <Globe className="h-4 w-4" />
                  <span>Browse Routines</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/routines/private"
                  className="flex w-full items-center space-x-2"
                >
                  <CalendarDays className="h-4 w-4" />
                  <span>My Routines</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/routines/create"
                  className="flex w-full items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Routine</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Ingredients Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`flex items-center space-x-1 text-sm font-medium ${
                  isGroupActive(['/ingredients'])
                    ? 'text-black'
                    : 'text-muted-foreground'
                }`}
              >
                <TestTubes className="h-4 w-4" />
                <span>Ingredients</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link
                  href="/ingredients"
                  className="flex w-full items-center space-x-2"
                >
                  <TestTubes className="h-4 w-4" />
                  <span>All Ingredients</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/ingredients/saved"
                  className="flex w-full items-center space-x-2"
                >
                  <Bookmark className="h-4 w-4" />
                  <span>My Ingredients</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Link (no dropdown) */}
          <Link
            href="/profile"
            className={`hover:text-primary flex items-center space-x-2 text-sm font-medium transition-colors ${
              pathname === '/profile' ? 'text-black' : 'text-muted-foreground'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
