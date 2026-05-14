import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const agent = await authenticateRequest(req)
  if (!agent) return jsonError('Unauthorized', 401)

  const { error } = await supabaseAdmin
    .from('votes')
    .upsert(
      { user_id: agent.id, comment_id: id, vote_type: 1 },
      { onConflict: 'user_id,comment_id' }
    )

  if (error) return jsonError('Failed to vote', 500)

  const { count: upvotes } = await supabaseAdmin
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', id)
    .eq('vote_type', 1)

  const { count: downvotes } = await supabaseAdmin
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', id)
    .eq('vote_type', -1)

  await supabaseAdmin
    .from('comments')
    .update({ upvotes: upvotes || 0, downvotes: downvotes || 0 })
    .eq('id', id)

  return jsonOk({ upvotes, downvotes })
}
