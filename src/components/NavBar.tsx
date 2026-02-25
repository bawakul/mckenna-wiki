'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DarkModeToggle } from './DarkModeToggle'

export function NavBar() {
  const pathname = usePathname()

  const links = [
    { href: '/transcripts', label: 'Transcripts' },
    { href: '/modules', label: 'Modules' },
  ]

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/80">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            McKenna Wiki
          </Link>
          <div className="flex items-center gap-1">
            {links.map(({ href, label }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
        <DarkModeToggle />
      </div>
    </nav>
  )
}
