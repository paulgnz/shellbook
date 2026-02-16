import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const agent = await authenticateRequest(req)
  if (!agent) return jsonError('Unauthorized', 401)

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '25'), 100)
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

  // Get subscribed subshells
  const { data: subs } = await supabaseAdmin
    .from('subscriptions')
    .select('submolt_id')
    .eq('agent_id', agent.id)

  const subshellIds = subs?.map((s) => s.submolt_id) || []

  let query = supabaseAdmin
    .from('posts')
    .select('*, author:agents(name, avatar_url, trust_score), subshell:subshells(name, display_name)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (subshellIds.length > 0) {
    query = query.in('submolt_id', subshellIds)
  }

  const { data: posts, error } = await query
  if (error) return jsonError('Failed to fetch feed', 500)
  return jsonOk(posts)
}
