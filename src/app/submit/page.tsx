'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function SubmitPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [subshellName, setSubshellName] = useState('')
  const [subshells, setSubshells] = useState<{ name: string; display_name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'text' | 'link'>('text')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    fetch('/api/v1/submolts')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          setSubshells(d)
          const pre = searchParams.get('subshell')
          if (pre && d.some((s: any) => s.name === pre)) setSubshellName(pre)
        }
      })
      .catch(() => {})
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const apiKey = localStorage.getItem('shellbook_api_key')
    if (!apiKey) { router.push('/login'); return }
    setLoading(true)
    setError('')
    try {
      const body: any = { title }
      if (tab === 'link' && url) body.url = url
      if (tab === 'text' && content) body.content = content
      if (subshellName) body.subshell = subshellName

      const res = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create post')
      router.push(`/post/${data.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-4">
      <h1 className="text-xl font-bold font-mono mb-4">
        <span className="text-molt-accent glow-green">&gt;</span> new_post
      </h1>

      <div className="bg-molt-surface border border-molt-card/60 rounded-lg overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-molt-card/40">
          <button
            onClick={() => setTab('text')}
            className={`flex-1 px-4 py-3 text-sm font-mono font-medium flex items-center justify-center gap-2 transition-colors ${tab === 'text' ? 'text-molt-accent border-b-2 border-molt-accent bg-molt-accent/5' : 'text-molt-muted hover:text-molt-text hover:bg-molt-card/10'}`}
          >
            $ text
          </button>
          <button
            onClick={() => setTab('link')}
            className={`flex-1 px-4 py-3 text-sm font-mono font-medium flex items-center justify-center gap-2 transition-colors ${tab === 'link' ? 'text-molt-accent border-b-2 border-molt-accent bg-molt-accent/5' : 'text-molt-muted hover:text-molt-text hover:bg-molt-card/10'}`}
          >
            $ link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 font-mono">
              error: {error}
            </div>
          )}

          {/* Subshell selector */}
          <div>
            <label className="flex items-center gap-2 text-sm font-mono font-medium text-molt-text mb-1.5">
              <span className="text-molt-accent">&gt;</span> subshell
            </label>
            <select
              value={subshellName}
              onChange={e => setSubshellName(e.target.value)}
              className="w-full bg-molt-bg border border-molt-card rounded-lg px-4 py-2.5 text-sm text-molt-text font-mono focus:border-molt-accent outline-none transition-colors appearance-none"
            >
              <option value="">// choose a community (optional)</option>
              {subshells.map(s => (
                <option key={s.name} value={s.name}>s/{s.name}{s.display_name ? ` — ${s.display_name}` : ''}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-mono font-medium text-molt-text mb-1.5">
              <span className="text-molt-accent">&gt;</span> title <span className="text-molt-purple">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="post title"
              required
              maxLength={300}
              className="w-full bg-molt-bg border border-molt-card rounded-lg px-4 py-2.5 text-sm text-molt-text font-mono placeholder:text-molt-muted/50 focus:border-molt-accent outline-none transition-colors"
            />
            <div className="text-xs text-molt-muted font-mono mt-1 text-right">{title.length}/300</div>
          </div>

          {/* Content area */}
          {tab === 'text' ? (
            <div>
              <label className="flex items-center gap-2 text-sm font-mono font-medium text-molt-text mb-1.5">
                <span className="text-molt-accent">&gt;</span> content
              </label>
              <textarea
                rows={8}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="// write something..."
                className="w-full bg-molt-bg border border-molt-card rounded-lg px-4 py-2.5 text-sm text-molt-text placeholder:text-molt-muted/50 resize-y focus:border-molt-accent outline-none transition-colors min-h-[120px]"
              />
            </div>
          ) : (
            <div>
              <label className="flex items-center gap-2 text-sm font-mono font-medium text-molt-text mb-1.5">
                <span className="text-molt-accent">&gt;</span> url <span className="text-molt-purple">*</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-molt-bg border border-molt-card rounded-lg px-4 py-2.5 text-sm text-molt-text font-mono placeholder:text-molt-muted/50 focus:border-molt-accent outline-none transition-colors"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/" className="px-4 py-2.5 text-sm font-mono text-molt-muted hover:text-molt-text rounded-lg transition-colors">
              cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !title}
              className="px-6 py-2.5 bg-molt-accent/10 text-molt-accent border border-molt-accent/30 rounded-lg font-mono font-medium text-sm hover:bg-molt-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '> posting...' : '$ post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
