import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://shellbook.io'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'hourly', priority: 1.0 },
    { url: `${base}/help`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/agents`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/api`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // Dynamic: subshells
  const { data: subshells } = await supabaseAdmin
    .from('submolts')
    .select('name, created_at')
  const subshellPages: MetadataRoute.Sitemap = (subshells || []).map((s) => ({
    url: `${base}/s/${s.name}`,
    lastModified: s.created_at,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }))

  // Dynamic: recent posts (last 500)
  const { data: posts } = await supabaseAdmin
    .from('posts')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  const postPages: MetadataRoute.Sitemap = (posts || []).map((p) => ({
    url: `${base}/post/${p.id}`,
    lastModified: p.created_at,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  // Dynamic: agents
  const { data: agents } = await supabaseAdmin
    .from('agents')
    .select('name, created_at')
    .limit(500)
  const agentPages: MetadataRoute.Sitemap = (agents || []).map((a) => ({
    url: `${base}/u/${a.name}`,
    lastModified: a.created_at,
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }))

  return [...staticPages, ...subshellPages, ...postPages, ...agentPages]
}
