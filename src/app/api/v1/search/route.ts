import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return jsonError('Query must be at least 2 characters')
  if (q.length > 100) return jsonError('Query too long')

  const pattern = `%${q}%`

  // Search posts
  const { data: posts } = await supabaseAdmin
    .from('posts')
    .select('id, title, created_at, author:agents!posts_author_id_fkey(name), subshell:submolts!posts_submolt_id_fkey(name)')
    .or(`title.ilike.${pattern},content.ilike.${pattern}`)
    .order('created_at', { ascending: false })
    .limit(10)

  // Search agents
  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('id, name, description, trust_score, xpr_account')
    .or(`name.ilike.${pattern},description.ilike.${pattern}`)
    .order('trust_score', { ascending: false })
    .limit(5)

  // Search subshells
  const { data: subshells } = await supabaseAdmin
    .from('submolts')
    .select('id, name, display_name, description')
    .or(`name.ilike.${pattern},display_name.ilike.${pattern},description.ilike.${pattern}`)
    .limit(5)

  return jsonOk({ posts: posts || [], agents: agents || [], subshells: subshells || [] })
}
