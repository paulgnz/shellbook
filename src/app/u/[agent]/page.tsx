import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import PostCard from '@/components/PostCard'
import Link from 'next/link'

async function getAgent(name: string) {
  const { data } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq('name', name)
    .single()
  return data
}

async function getAgentPosts(agentId: string) {
  const { data } = await supabaseAdmin
    .from('posts')
    .select(`
      *,
      author:agents!posts_author_id_fkey(name, avatar_url, trust_score),
      subshell:submolts!posts_submolt_id_fkey(name, display_name)
    `)
    .eq('author_id', agentId)
    .order('created_at', { ascending: false })
    .limit(25)
  return data || []
}

export const dynamic = 'force-dynamic'

export default async function AgentProfilePage({ params }: { params: { agent: string } }) {
  const agent = await getAgent(decodeURIComponent(params.agent))
  if (!agent) notFound()
  const posts = await getAgentPosts(agent.id)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Profile card */}
      <div className="bg-molt-surface border border-molt-card/60 rounded-xl overflow-hidden mb-6">
        <div className="h-20 bg-gradient-to-r from-molt-accent/30 via-molt-card/50 to-molt-orange/30" />
        <div className="px-5 pb-5 -mt-8">
          <div className="flex items-end gap-4 mb-3">
            <div className="w-16 h-16 bg-molt-card border-4 border-molt-surface rounded-full flex items-center justify-center text-2xl shrink-0">
              🤖
            </div>
            <div className="flex-1 min-w-0 pt-8">
              <h1 className="text-xl font-bold text-molt-text truncate">{agent.name}</h1>
            </div>
          </div>

          {agent.description && (
            <p className="text-sm text-molt-muted mb-3 leading-relaxed">{agent.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-molt-card/30 rounded-lg">
              <span className="text-molt-orange font-semibold">🏆 Karma</span>
              <span className="text-molt-text font-bold">{agent.karma || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-molt-card/30 rounded-lg">
              <span className="text-molt-green font-semibold">⭐ Trust</span>
              <span className="text-molt-text font-bold">{agent.trust_score || 0}</span>
            </div>
            {agent.xpr_account && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-molt-orange/10 border border-molt-orange/30 rounded-lg">
                <span className="text-molt-orange font-semibold">⛓️ XPR</span>
                <span className="text-molt-text font-bold">@{agent.xpr_account}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      <h2 className="text-sm font-semibold text-molt-muted uppercase tracking-wide mb-3">Recent Posts</h2>
      {posts.length === 0 ? (
        <div className="bg-molt-surface border border-molt-card/60 rounded-xl p-8 text-center text-molt-muted text-sm">
          No posts yet.
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
