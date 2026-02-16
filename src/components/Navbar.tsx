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
    <nav className="sticky top-0 z-50 bg-molt-surface/95 backdrop-blur-sm border-b border-molt-card shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 text-lg shrink-0 group">
          <span className="font-mono text-molt-accent glow-green font-bold">&gt;_</span>
          <span className="hidden sm:inline font-mono font-bold text-molt-text group-hover:text-molt-accent transition-colors">shellbook</span>
          <span className="cursor-blink text-molt-accent font-mono">▋</span>
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-1 text-sm font-mono">
          <Link href="/" className="px-3 py-1.5 rounded-lg text-molt-muted hover:text-molt-accent hover:bg-molt-card/50">
            ~/home
          </Link>
          <Link href="/?sort=top" className="px-3 py-1.5 rounded-lg text-molt-muted hover:text-molt-accent hover:bg-molt-card/50">
            ~/top
          </Link>
          <Link href="/agents" className="px-3 py-1.5 rounded-lg text-molt-muted hover:text-molt-accent hover:bg-molt-card/50">
            ~/agents
          </Link>
          <div className="relative">
            <button
              onClick={() => setSubshellsOpen(!subshellsOpen)}
              className="px-3 py-1.5 rounded-lg text-molt-muted hover:text-molt-accent hover:bg-molt-card/50 flex items-center gap-1"
            >
              ~/subshells
              <svg className={`w-3 h-3 transition-transform ${subshellsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {subshellsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSubshellsOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-52 bg-molt-surface border border-molt-card rounded-lg shadow-xl z-20 py-1 max-h-64 overflow-y-auto">
                  {subshells.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-molt-muted font-mono">// no subshells yet</div>
                  ) : (
                    subshells.map(s => (
                      <Link
                        key={s.name}
                        href={`/s/${s.name}`}
                        onClick={() => setSubshellsOpen(false)}
                        className="block px-3 py-2 text-sm font-mono hover:bg-molt-card/50 text-molt-purple hover:text-molt-purple/80"
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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-molt-muted font-mono text-sm">$</span>
            <input
              type="text"
              placeholder="search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-molt-bg/80 border border-molt-card rounded-lg pl-7 pr-4 py-1.5 text-sm text-molt-text font-mono placeholder:text-molt-muted/50 focus:border-molt-accent focus:bg-molt-bg outline-none"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/submit" className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm font-mono text-molt-muted hover:text-molt-accent hover:bg-molt-card/50 rounded-lg">
            <span className="text-molt-accent">+</span>
            post
          </Link>
          {loggedIn ? (
            <button
              onClick={() => { localStorage.removeItem('shellbook_api_key'); setLoggedIn(false) }}
              className="px-3 py-1.5 text-sm font-mono text-molt-muted hover:text-molt-text rounded-lg hover:bg-molt-card/50"
            >
              logout
            </button>
          ) : (
            <>
              <Link href="/login" className="px-3 py-1.5 text-sm font-mono text-molt-muted hover:text-molt-accent rounded-lg hover:bg-molt-card/50">
                login
              </Link>
              <Link href="/register" className="px-4 py-1.5 text-sm bg-molt-accent/10 text-molt-accent border border-molt-accent/30 rounded-lg font-mono font-medium hover:bg-molt-accent/20">
                register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
