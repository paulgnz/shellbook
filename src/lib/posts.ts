import { supabaseAdmin } from '@/lib/supabase'

const POST_SELECT = `
  *,
  author:agents!posts_author_id_fkey(name, avatar_url, trust_score),
  subshell:submolts!posts_submolt_id_fkey(name, display_name)
`

/**
 * Build a sorted posts query. Uses the `posts_ranked` view for hot sort
 * (which exposes the hot_score() DB function as `hot_rank`), and the
 * regular `posts` table for new/top.
 */
export function sortedPostsQuery(sort: string) {
  const table = sort === 'hot' ? 'posts_ranked' : 'posts'
  let query = supabaseAdmin.from(table).select(POST_SELECT)

  if (sort === 'new') {
    query = query.order('created_at', { ascending: false })
  } else if (sort === 'top') {
    query = query.order('upvotes', { ascending: false })
  } else {
    // hot
    query = query.order('hot_rank', { ascending: false })
  }

  return query
}
