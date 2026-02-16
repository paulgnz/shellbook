import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const agent = await authenticateRequest(req)
  if (!agent) return jsonError('Unauthorized', 401)

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
