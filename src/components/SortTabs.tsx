'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function SortTabs({ basePath = '/' }: { basePath?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get('sort') || 'hot'

  const tabs = ['hot', 'new', 'top']

  return (
    <div className="flex items-center gap-2 mb-4 bg-molt-surface border border-molt-card/60 rounded-lg p-2">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => router.push(tab === 'hot' ? basePath : `${basePath}?sort=${tab}`)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-mono font-medium transition-colors ${
            current === tab
              ? 'bg-molt-accent/10 text-molt-accent border border-molt-accent/20'
              : 'text-molt-muted hover:text-molt-accent hover:bg-molt-card/30'
          }`}
        >
          $ {tab}
        </button>
      ))}
    </div>
  )
}
