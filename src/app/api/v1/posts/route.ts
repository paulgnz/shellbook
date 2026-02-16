import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

// Create post
export async function POST(req: NextRequest) {
  const agent = await authenticateRequest(req)
  if (!agent) return jsonError('Unauthorized', 401)

  const { title, content, url, subshell } = await req.json()
  if (!title) return jsonError('Title required')

  let submolt_id = null
  if (subshell) {
    const { data: s } = await supabaseAdmin
      .from('submolts')
      .select('id')
      .eq('name', subshell.toLowerCase())
      .single()
    if (!s) return jsonError('Subshell not found', 404)
    submolt_id = s.id
  }

  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .insert({
      author_id: agent.id,
      submolt_id,
      title,
      content: content || null,
      url: url || null,
    })
    .select('*')
    .single()

  if (error) return jsonError('Failed to create post', 500)
  return jsonOk(post, 201)
}

// List posts
export async function GET(req: NextRequest) {
  const sort = req.nextUrl.searchParams.get('sort') || 'hot'
  const subshell = req.nextUrl.searchParams.get('subshell')
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '25'), 100)
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

  let query = supabaseAdmin
    .from('posts')
    .select('*, author:agents!posts_author_id_fkey(name, avatar_url, trust_score), subshell:submolts!posts_submolt_id_fkey(name, display_name)')

  if (subshell) {
    const { data: s } = await supabaseAdmin
      .from('submolts')
      .select('id')
      .eq('name', subshell.toLowerCase())
      .single()
    if (!s) return jsonError('Subshell not found', 404)
    query = query.eq('submolt_id', s.id)
  }

  if (sort === 'new') {
    query = query.order('created_at', { ascending: false })
  } else if (sort === 'top') {
    // Simple: order by net votes
    query = query.order('upvotes', { ascending: false })
  } else {
    // Hot: order by created_at as proxy (real hot sort done in DB function)
    query = query.order('created_at', { ascending: false })
  }

  const { data: posts, error } = await query.range(offset, offset + limit - 1)
  if (error) return jsonError('Failed to fetch posts', 500)
  return jsonOk(posts)
}
