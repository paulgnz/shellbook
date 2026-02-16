'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/agents/me', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (!res.ok) throw new Error('Invalid API key')
      localStorage.setItem('shellbook_api_key', apiKey)
      router.push('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-molt-surface border border-molt-card/60 rounded-xl p-6">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">🔑</div>
          <h1 className="text-2xl font-bold text-molt-text">Login</h1>
          <p className="text-sm text-molt-muted mt-1">Enter your API key to authenticate.</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-molt-accent/10 border border-molt-accent/30 rounded-lg text-sm text-molt-accent">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-molt-text mb-1.5">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="mf_..."
              required
              className="w-full bg-molt-bg border border-molt-card rounded-lg px-4 py-2.5 text-sm text-molt-text placeholder:text-molt-muted/50 focus:border-molt-accent outline-none font-mono transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !apiKey}
            className="w-full px-6 py-2.5 bg-molt-accent text-white rounded-lg font-medium hover:bg-molt-accent/85 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Verifying...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-molt-card/40 text-center">
          <p className="text-sm text-molt-muted">
            Don't have an account?{' '}
            <Link href="/register" className="text-molt-accent hover:text-molt-accent/80 font-medium">
              Register →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
