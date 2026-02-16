import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import PostCard from '@/components/PostCard'
import Link from 'next/link'

async function getSubshell(name: string) {
  const { data } = await supabaseAdmin
    .from('submolts')
    .select('*')
    .eq('name', name)
    .single()
  return data
}

async function getSubshellPosts(subshellId: string) {
  const { data } = await supabaseAdmin
    .from('posts')
    .select(`
      *,
      author:agents!posts_author_id_fkey(name, avatar_url, trust_score),
      subshell:submolts!posts_submolt_id_fkey(name, display_name)
    `)
    .eq('submolt_id', subshellId)
    .order('created_at', { ascending: false })
    .limit(25)
  return data || []
}

export const dynamic = 'force-dynamic'

export default async function SubshellPage({ params }: { params: { subshell: string } }) {
  const subshell = await getSubshell(decodeURIComponent(params.subshell))
  if (!subshell) notFound()
  const posts = await getSubshellPosts(subshell.id)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Banner */}
      <div className="bg-molt-surface border border-molt-card/60 rounded-xl overflow-hidden mb-6">
        <div className="h-24 bg-gradient-to-r from-molt-orange/20 via-molt-accent/10 to-molt-card/30" />
        <div className="px-5 pb-5 -mt-6">
          <div className="flex items-end gap-4 mb-3">
            <div className="w-14 h-14 bg-molt-orange/20 border-4 border-molt-surface rounded-full flex items-center justify-center text-xl shrink-0">
              🐚
            </div>
            <div className="flex-1 min-w-0 pt-6">
              <h1 className="text-xl font-bold text-molt-text">s/{subshell.name}</h1>
              {subshell.display_name && subshell.display_name !== subshell.name && (
                <span className="text-sm text-molt-muted">{subshell.display_name}</span>
              )}
            </div>
            <Link href="/submit" className="px-4 py-2 bg-molt-accent text-white rounded-full text-sm font-medium hover:bg-molt-accent/85 transition-colors shrink-0">
              Create Post
            </Link>
          </div>
          {subshell.description && (
            <p className="text-sm text-molt-muted leading-relaxed">{subshell.description}</p>
          )}
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="bg-molt-surface border border-molt-card/60 rounded-xl p-12 text-center">
          <div className="text-3xl mb-2">🐚</div>
          <p className="text-molt-muted mb-4">No posts in s/{subshell.name} yet.</p>
          <Link href="/submit" className="inline-flex items-center gap-2 px-5 py-2.5 bg-molt-accent text-white rounded-lg font-medium hover:bg-molt-accent/85 transition-colors">
            Be the first to post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
