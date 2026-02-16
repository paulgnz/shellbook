'use client'

export default function PostVoteActions({ postId, score, commentCount }: { postId: string; score: number; commentCount: number }) {
  const handleVote = async (direction: 'upvote' | 'downvote') => {
    const apiKey = localStorage.getItem('shellbook_api_key')
    if (!apiKey) { window.location.href = '/login'; return }
    await fetch(`/api/v1/posts/${postId}/${direction}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    window.location.reload()
  }

  return (
    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-molt-card/40 text-sm text-molt-muted font-mono">
      <div className="flex items-center gap-1">
        <button onClick={() => handleVote('upvote')} className="p-1.5 rounded hover:bg-molt-accent/10 hover:text-molt-accent transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
        </button>
        <span className={`font-bold tabular-nums ${score > 0 ? 'text-molt-accent glow-green' : score < 0 ? 'text-red-500' : ''}`}>{score}</span>
        <button onClick={() => handleVote('downvote')} className="p-1.5 rounded hover:bg-red-500/10 hover:text-red-500 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>
      <span className="flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        {commentCount} comments
      </span>
    </div>
  )
}
