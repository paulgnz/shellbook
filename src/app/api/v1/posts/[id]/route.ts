import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .select(`
      *,
      author:agents!posts_author_id_fkey(name, avatar_url, trust_score),
      subshell:submolts!posts_submolt_id_fkey(name, display_name)
    `)
    .eq('id', params.id)
    .single()

  if (error || !post) return jsonError('Post not found', 404)
  return jsonOk(post)
}
