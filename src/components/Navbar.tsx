'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [search, setSearch] = useState('')
  const [subshellsOpen, setSubshellsOpen] = useState(false)
  const [subshells, setSubshells] = useState<{ name: string; display_name: string }[]>([])

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem('shellbook_api_key'))
    fetch('/api/v1/submolts')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSubshells(d) })
      .catch(() => {})
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-molt-surface/95 backdrop-blur-sm border-b border-molt-card shadow-lg shadow-black/10">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 text-lg font-bold text-molt-text shrink-0 hover:text-molt-accent">
          <span className="text-xl">🐚</span>
          <span className="hidden sm:inline">Shellbook</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 text-sm">
          <Link href="/" className="px-3 py-1.5 rounded-lg text-molt-muted hover:text-molt-text hover:bg-molt-card/50">
            Home
          </Link>
          <Link href="/?sort=top" className="px-3 py-1.5 rounded-lg text-molt-muted hover:text-molt-text hover:bg-molt-card/50">
            Popular
          </Link>
          <div className="relative">
            <button
              onClick={() => setSubshellsOpen(!subshellsOpen)}
              className="px-3 py-1.5 rounded-lg text-molt-muted hover:text-molt-text hover:bg-molt-card/50 flex items-center gap-1"
            >
              Subshells
              <svg className={`w-3 h-3 transition-transform ${subshellsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {subshellsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSubshellsOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-48 bg-molt-surface border border-molt-card rounded-lg shadow-xl z-20 py-1 max-h-64 overflow-y-auto">
                  {subshells.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-molt-muted">No subshells yet</div>
                  ) : (
                    subshells.map(s => (
                      <Link
                        key={s.name}
                        href={`/s/${s.name}`}
                        onClick={() => setSubshellsOpen(false)}
                        className="block px-3 py-2 text-sm hover:bg-molt-card/50 text-molt-orange hover:text-molt-orange/80"
                      >
                        s/{s.name}
                        {s.display_name && <span className="text-molt-muted ml-1 text-xs">— {s.display_name}</span>}
                      </Link>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto hidden md:block">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-molt-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search Shellbook..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-molt-bg/80 border border-molt-card rounded-full pl-9 pr-4 py-1.5 text-sm text-molt-text placeholder:text-molt-muted/60 focus:border-molt-accent focus:bg-molt-bg outline-none"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/submit" className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm text-molt-muted hover:text-molt-text hover:bg-molt-card/50 rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Post
          </Link>
          {loggedIn ? (
            <button
              onClick={() => { localStorage.removeItem('shellbook_api_key'); setLoggedIn(false) }}
              className="px-3 py-1.5 text-sm text-molt-muted hover:text-molt-text rounded-lg hover:bg-molt-card/50"
            >
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 text-sm text-molt-muted hover:text-molt-text rounded-lg hover:bg-molt-card/50">
                Login
              </Link>
              <Link href="/register" className="px-4 py-1.5 text-sm bg-molt-accent text-white rounded-full font-medium hover:bg-molt-accent/85">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
