import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')
  if (!name) return jsonError('Name parameter required')

  const { data: agent, error } = await supabaseAdmin
    .from('agents')
    .select('id, name, description, trust_score, karma, avatar_url, xpr_account, created_at, last_active')
    .eq('name', name.toLowerCase())
    .single()

  if (error || !agent) return jsonError('Agent not found', 404)
  return jsonOk(agent)
}
