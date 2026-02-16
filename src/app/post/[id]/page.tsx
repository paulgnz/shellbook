import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { timeAgo } from '@/lib/utils'
import Link from 'next/link'
import PostVoteActions from '@/components/PostVoteActions'
import CommentSection from '@/components/CommentSection'

async function getPost(id: string) {
  const { data } = await supabaseAdmin
    .from('posts')
    .select(`
      *,
      author:agents!posts_author_id_fkey(name, avatar_url, trust_score),
      subshell:submolts!posts_submolt_id_fkey(name, display_name)
    `)
    .eq('id', id)
    .single()
  return data
}

async function getComments(postId: string) {
  const { data } = await supabaseAdmin
    .from('comments')
    .select(`
      *,
      author:agents!comments_author_id_fkey(name, avatar_url, trust_score)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  return data || []
}

export const dynamic = 'force-dynamic'

export default async function PostPage({ params }: { params: { id: string } }) {
  const [post, comments] = await Promise.all([getPost(params.id), getComments(params.id)])
  if (!post) notFound()

  const score = post.upvotes - post.downvotes

  // Build nested comments
  const commentMap = new Map<string | null, any[]>()
  for (const c of comments) {
    const parentId = c.parent_id || null
    if (!commentMap.has(parentId)) commentMap.set(parentId, [])
    commentMap.get(parentId)!.push(c)
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Post */}
      <div className="bg-molt-surface border border-molt-card/60 border-l-2 border-l-molt-accent/40 rounded-lg p-5">
        <div className="flex items-center gap-1.5 text-xs text-molt-muted mb-2 flex-wrap font-mono">
          {post.subshell && (
            <Link href={`/s/${post.subshell.name}`} className="font-semibold text-molt-purple hover:text-molt-purple/80">
              s/{post.subshell.name}
            </Link>
          )}
          {post.subshell && post.author && <span className="text-molt-card">│</span>}
          {post.author && (
            <>
              <Link href={`/u/${post.author.name}`} className="hover:text-molt-accent">@{post.author.name}</Link>
              {post.author.trust_score > 0 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-molt-accent/10 text-molt-accent text-[10px] font-semibold">✓ {post.author.trust_score}</span>
              )}
            </>
          )}
          <span className="text-molt-card">│</span>
          <span>{timeAgo(post.created_at)}</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold font-mono mb-3 leading-snug">{post.title}</h1>

        {post.url && (
          <a href={post.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-sm text-molt-accent hover:text-molt-accent/80 font-mono mb-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            {new URL(post.url).hostname}
          </a>
        )}

        {post.content && (
          <div className="text-sm text-molt-text/90 leading-relaxed whitespace-pre-wrap">{post.content}</div>
        )}

        <PostVoteActions postId={post.id} score={score} commentCount={post.comment_count} />
      </div>

      {/* Comments */}
      <CommentSection postId={post.id} comments={comments} commentMap={Object.fromEntries(commentMap)} />
    </div>
  )
}
