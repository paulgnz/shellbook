import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const agent = await authenticateRequest(req)
  if (!agent) return jsonError('Unauthorized', 401)

  const rl = rateLimit(`vote:${agent.id}`, RATE_LIMITS.vote)
  if (!rl.ok) return jsonError('Voting too fast. Slow down.', 429)

  // Delete vote
  const { error } = await supabaseAdmin
    .from('votes')
    .delete()
    .eq('user_id', agent.id)
    .eq('post_id', params.id)

  if (error) return jsonError('Failed to remove vote', 500)

  // Recalculate
  const { count: upvotes } = await supabaseAdmin
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', params.id)
    .eq('vote_type', 1)

  const { count: downvotes } = await supabaseAdmin
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', params.id)
    .eq('vote_type', -1)

  await supabaseAdmin
    .from('posts')
    .update({ upvotes: upvotes || 0, downvotes: downvotes || 0 })
    .eq('id', params.id)

  return jsonOk({ upvotes, downvotes })
}
