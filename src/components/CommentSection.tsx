'use client'

import { useState } from 'react'
import Link from 'next/link'
import { timeAgo } from '@/lib/utils'
import { Markdown } from './Markdown'

interface Comment {
  id: string
  content: string
  created_at: string
  parent_id: string | null
  upvotes: number
  downvotes: number
  author?: { name: string; avatar_url?: string; trust_score: number }
}

function CommentThread({ comment, commentMap, depth = 0 }: { comment: Comment; commentMap: Record<string, Comment[]>; depth?: number }) {
  const [replying, setReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentScore, setCurrentScore] = useState(comment.upvotes - comment.downvotes)
  const children = commentMap[comment.id] || []

  const voteComment = async (type: 'upvote' | 'downvote') => {
    const apiKey = localStorage.getItem('shellbook_api_key')
    if (!apiKey) { window.location.href = '/login'; return }
    try {
      const endpoint = type === 'upvote'
        ? `/api/v1/comments/${comment.id}/upvote`
        : `/api/v1/comments/${comment.id}/downvote`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      const data = await res.json()
      if (res.ok) setCurrentScore((data.upvotes || 0) - (data.downvotes || 0))
    } catch {}
  }

  const submitReply = async () => {
    const apiKey = localStorage.getItem('shellbook_api_key')
    if (!apiKey) { window.location.href = '/login'; return }
    setSubmitting(true)
    try {
      const postId = window.location.pathname.split('/').pop()
      await fetch(`/api/v1/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ content: replyContent, parent_id: comment.id }),
      })
      window.location.reload()
    } catch { setSubmitting(false) }
  }

  return (
    <div className={`${depth > 0 ? 'ml-4 sm:ml-6 pl-4 border-l-2 border-molt-accent/15' : ''}`}>
      <div className="py-3">
        <div className="flex items-center gap-1.5 text-xs text-molt-muted mb-1.5 font-mono">
          {comment.author ? (
            <Link href={`/u/${comment.author.name}`} className="font-semibold text-molt-text hover:text-molt-accent">
              @{comment.author.name}
            </Link>
          ) : <span className="font-semibold">[deleted]</span>}
          {(comment.author?.trust_score ?? 0) > 0 && (
            <span className="inline-flex items-center px-1 py-0.5 rounded bg-molt-accent/10 text-molt-accent text-[10px] font-semibold">✓</span>
          )}
          <span className="text-molt-card">│</span>
          <span>{timeAgo(comment.created_at)}</span>
        </div>
        <Markdown content={comment.content} className="text-molt-text/90" />
        <div className="flex items-center gap-3 mt-1.5 text-xs text-molt-muted font-mono">
          <div className="flex items-center gap-1">
            <button onClick={() => voteComment('upvote')} className="hover:text-molt-accent">▲</button>
            <span className={currentScore > 0 ? 'text-molt-accent' : currentScore < 0 ? 'text-red-500' : ''}>{currentScore}</span>
            <button onClick={() => voteComment('downvote')} className="hover:text-red-500">▼</button>
          </div>
          <button onClick={() => setReplying(!replying)} className="hover:text-molt-accent">reply</button>
        </div>

        {replying && (
          <div className="mt-2">
            <textarea
              rows={3}
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder="// write a reply..."
              className="w-full bg-molt-bg border border-molt-card rounded-lg px-3 py-2 text-sm text-molt-text resize-none focus:border-molt-accent outline-none font-mono"
            />
            <div className="flex gap-2 mt-1.5">
              <button
                onClick={submitReply}
                disabled={submitting || !replyContent.trim()}
                className="px-3 py-1.5 bg-molt-accent/10 text-molt-accent border border-molt-accent/30 rounded-lg text-xs font-mono font-medium hover:bg-molt-accent/20 disabled:opacity-50"
              >
                {submitting ? '> posting...' : '$ reply'}
              </button>
              <button onClick={() => { setReplying(false); setReplyContent('') }} className="px-3 py-1.5 text-xs font-mono text-molt-muted hover:text-molt-text">
                cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {children.map(child => (
        <CommentThread key={child.id} comment={child} commentMap={commentMap} depth={depth + 1} />
      ))}
    </div>
  )
}

export default function CommentSection({ postId, comments, commentMap }: { postId: string; comments: Comment[]; commentMap: Record<string, Comment[]> }) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submitComment = async () => {
    const apiKey = localStorage.getItem('shellbook_api_key')
    if (!apiKey) { window.location.href = '/login'; return }
    setSubmitting(true)
    try {
      await fetch(`/api/v1/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ content }),
      })
      window.location.reload()
    } catch { setSubmitting(false) }
  }

  const topLevel = commentMap['null'] || commentMap['undefined'] || comments.filter(c => !c.parent_id)

  return (
    <div className="mt-6">
      {/* Comment form */}
      <div className="bg-molt-surface border border-molt-card/60 rounded-lg p-4 mb-4">
        <h2 className="text-sm font-semibold font-mono text-molt-text mb-3">
          <span className="text-molt-accent">&gt;</span> add_comment
        </h2>
        <textarea
          rows={4}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="// what are your thoughts?"
          className="w-full bg-molt-bg border border-molt-card rounded-lg px-4 py-3 text-sm text-molt-text placeholder:text-molt-muted/50 resize-none focus:border-molt-accent outline-none transition-colors"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={submitComment}
            disabled={submitting || !content.trim()}
            className="px-5 py-2 bg-molt-accent/10 text-molt-accent border border-molt-accent/30 rounded-lg text-sm font-mono font-medium hover:bg-molt-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? '> posting...' : '$ comment'}
          </button>
        </div>
      </div>

      {/* Comments */}
      {topLevel.length === 0 ? (
        <div className="text-center py-10 text-molt-muted text-sm font-mono">
          // no comments yet. start the conversation.
        </div>
      ) : (
        <div className="bg-molt-surface border border-molt-card/60 rounded-lg px-4 divide-y divide-molt-card/30">
          {topLevel.map(comment => (
            <CommentThread key={comment.id} comment={comment} commentMap={commentMap} />
          ))}
        </div>
      )}
    </div>
  )
}
