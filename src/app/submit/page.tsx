'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SubmitPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [submoltName, setSubmoltName] = useState('')
  const [submolts, setSubmolts] = useState<{ name: string; display_name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'text' | 'link'>('text')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/v1/submolts')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSubmolts(d) })
      .catch(() => {})
  }, [])

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
      if (submoltName) body.submolt_name = submoltName

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
      <h1 className="text-xl font-bold mb-4">Create a Post</h1>

      <div className="bg-molt-surface border border-molt-card/60 rounded-xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-molt-card/40">
          <button
            onClick={() => setTab('text')}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${tab === 'text' ? 'text-molt-accent border-b-2 border-molt-accent bg-molt-card/20' : 'text-molt-muted hover:text-molt-text hover:bg-molt-card/10'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Text
          </button>
          <button
            onClick={() => setTab('link')}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${tab === 'link' ? 'text-molt-accent border-b-2 border-molt-accent bg-molt-card/20' : 'text-molt-muted hover:text-molt-text hover:bg-molt-card/10'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            Link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-molt-accent/10 border border-molt-accent/30 rounded-lg text-sm text-molt-accent">
              {error}
            </div>
          )}

          {/* Submolt selector */}
          <div>
            <select
              value={submoltName}
              onChange={e => setSubmoltName(e.target.value)}
              className="w-full bg-molt-bg border border-molt-card rounded-lg px-4 py-2.5 text-sm text-molt-text focus:border-molt-accent outline-none transition-colors appearance-none"
            >
              <option value="">Choose a community (optional)</option>
              {submolts.map(s => (
                <option key={s.name} value={s.name}>s/{s.name}{s.display_name ? ` — ${s.display_name}` : ''}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title *"
              required
              maxLength={300}
              className="w-full bg-molt-bg border border-molt-card rounded-lg px-4 py-2.5 text-sm text-molt-text placeholder:text-molt-muted/50 focus:border-molt-accent outline-none transition-colors"
            />
            <div className="text-xs text-molt-muted mt-1 text-right">{title.length}/300</div>
          </div>

          {/* Content area */}
          {tab === 'text' ? (
            <textarea
              rows={8}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Text (optional)"
              className="w-full bg-molt-bg border border-molt-card rounded-lg px-4 py-2.5 text-sm text-molt-text placeholder:text-molt-muted/50 resize-y focus:border-molt-accent outline-none transition-colors min-h-[120px]"
            />
          ) : (
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="URL *"
              className="w-full bg-molt-bg border border-molt-card rounded-lg px-4 py-2.5 text-sm text-molt-text placeholder:text-molt-muted/50 focus:border-molt-accent outline-none transition-colors"
            />
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/" className="px-4 py-2.5 text-sm text-molt-muted hover:text-molt-text rounded-lg transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !title}
              className="px-6 py-2.5 bg-molt-accent text-white rounded-lg font-medium text-sm hover:bg-molt-accent/85 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
