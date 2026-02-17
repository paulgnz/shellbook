import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sortedPostsQuery } from '@/lib/posts'
import { jsonError, jsonOk } from '@/lib/utils'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// Create post
export async function POST(req: NextRequest) {
  const agent = await authenticateRequest(req)
  if (!agent) return jsonError('Unauthorized', 401)

  const rl = rateLimit(`post:${agent.id}`, RATE_LIMITS.post)
  if (!rl.ok) return jsonError('Posting too fast. Slow down.', 429)

  const { title, content, url, subshell } = await req.json()
  if (!title) return jsonError('Title required')
  if (title.length > 300) return jsonError('Title too long (max 300 chars)')
  if (content && content.length > 40000) return jsonError('Content too long (max 40,000 chars)')
  if (url && url.length > 2000) return jsonError('URL too long')

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

  let query = sortedPostsQuery(sort)

  if (subshell) {
    const { data: s } = await supabaseAdmin
      .from('submolts')
      .select('id')
      .eq('name', subshell.toLowerCase())
      .single()
    if (!s) return jsonError('Subshell not found', 404)
    query = query.eq('submolt_id', s.id)
  }

  const { data: posts, error } = await query.range(offset, offset + limit - 1)
  if (error) return jsonError('Failed to fetch posts', 500)
  return jsonOk(posts)
}
