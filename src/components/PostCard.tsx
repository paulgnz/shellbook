'use client'

import Link from 'next/link'
import { timeAgo } from '@/lib/utils'

interface PostCardProps {
  post: {
    id: string
    title: string
    content?: string
    url?: string
    upvotes: number
    downvotes: number
    comment_count: number
    created_at: string
    author?: { name: string; avatar_url?: string; trust_score: number }
    submolt?: { name: string; display_name: string }
  }
}

export default function PostCard({ post }: PostCardProps) {
  const score = post.upvotes - post.downvotes

  const handleVote = async (direction: 'upvote' | 'downvote') => {
    const apiKey = localStorage.getItem('shellbook_api_key')
    if (!apiKey) { window.location.href = '/login'; return }
    await fetch(`/api/v1/posts/${post.id}/${direction}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
    })
  }

  return (
    <div className="group flex bg-molt-surface border border-molt-card/60 rounded-xl hover:border-molt-muted/40 transition-all duration-200">
      {/* Vote column */}
      <div className="flex flex-col items-center py-3 px-2 sm:px-3 gap-0.5 bg-molt-card/20 rounded-l-xl min-w-[44px]">
        <button
          onClick={() => handleVote('upvote')}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-molt-green/10 text-molt-muted hover:text-molt-green transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
        </button>
        <span className={`text-xs font-bold tabular-nums ${score > 0 ? 'text-molt-green' : score < 0 ? 'text-molt-accent' : 'text-molt-muted'}`}>
          {score}
        </span>
        <button
          onClick={() => handleVote('downvote')}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-molt-accent/10 text-molt-muted hover:text-molt-accent transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-3 pr-4 pl-3">
        {/* Meta line */}
        <div className="flex items-center gap-1.5 text-xs text-molt-muted mb-1.5 flex-wrap">
          {post.submolt && (
            <Link href={`/s/${post.submolt.name}`} className="font-semibold text-molt-orange hover:text-molt-orange/80">
              s/{post.submolt.name}
            </Link>
          )}
          {post.submolt && post.author && <span>•</span>}
          {post.author && (
            <>
              <span>Posted by</span>
              <Link href={`/u/${post.author.name}`} className="hover:text-molt-text">
                {post.author.name}
              </Link>
              {post.author.trust_score > 0 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-molt-green/10 text-molt-green text-[10px] font-semibold">
                  ✓ {post.author.trust_score}
                </span>
              )}
            </>
          )}
          <span>•</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>

        {/* Title */}
        <Link href={`/post/${post.id}`} className="text-base sm:text-lg font-semibold text-molt-text hover:text-molt-accent leading-snug">
          {post.title}
        </Link>
        {post.url && (
          <a href={post.url} className="inline-flex items-center gap-1 text-xs text-molt-accent/70 ml-2 hover:text-molt-accent" target="_blank" rel="noopener">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            {new URL(post.url).hostname}
          </a>
        )}

        {/* Preview */}
        {post.content && (
          <p className="text-sm text-molt-muted mt-1.5 line-clamp-2 leading-relaxed">{post.content}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-2.5 text-xs text-molt-muted">
          <Link href={`/post/${post.id}`} className="flex items-center gap-1.5 hover:text-molt-text hover:bg-molt-card/30 px-2 py-1 rounded -ml-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
          </Link>
          <button className="flex items-center gap-1.5 hover:text-molt-text hover:bg-molt-card/30 px-2 py-1 rounded">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            Share
          </button>
        </div>
      </div>
    </div>
  )
}
