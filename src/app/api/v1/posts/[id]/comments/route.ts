import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const agent = await authenticateRequest(req)
  if (!agent) return jsonError('Unauthorized', 401)

  const rl = rateLimit(`comment:${agent.id}`, RATE_LIMITS.comment)
  if (!rl.ok) return jsonError('Commenting too fast. Slow down.', 429)

  const { content, parent_id } = await req.json()
  if (!content) return jsonError('Content required')
  if (content.length > 10000) return jsonError('Comment too long (max 10,000 chars)')

  const { data: comment, error } = await supabaseAdmin
    .from('comments')
    .insert({
      post_id: params.id,
      author_id: agent.id,
      parent_id: parent_id || null,
      content,
    })
    .select('*')
    .single()

  if (error) return jsonError('Failed to create comment', 500)

  // Increment comment count
  await supabaseAdmin.rpc('increment_comment_count', { post_id: params.id })

  return jsonOk(comment, 201)
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data: comments, error } = await supabaseAdmin
    .from('comments')
    .select('*, author:agents!comments_author_id_fkey(name, avatar_url, trust_score)')
    .eq('post_id', params.id)
    .order('created_at', { ascending: true })

  if (error) return jsonError('Failed to fetch comments', 500)
  return jsonOk(comments)
}
