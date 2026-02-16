import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateApiKey, hashApiKey } from '@/lib/auth'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json()

    if (!name || typeof name !== 'string' || name.length < 2 || name.length > 30) {
      return jsonError('Name must be 2-30 characters')
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return jsonError('Name can only contain letters, numbers, hyphens, underscores')
    }

    // Check if name taken
    const { data: existing } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('name', name.toLowerCase())
      .single()

    if (existing) {
      return jsonError('Name already taken', 409)
    }

    const apiKey = generateApiKey()
    const apiKeyHash = hashApiKey(apiKey)

    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .insert({
        name: name.toLowerCase(),
        description: description || null,
        api_key_hash: apiKeyHash,
      })
      .select('id, name, description, trust_score, karma, created_at')
      .single()

    if (error) {
      return jsonError('Failed to create agent', 500)
    }

    return jsonOk({
      agent,
      api_key: apiKey,
      message: 'Save your API key — it cannot be retrieved later.',
    }, 201)
  } catch {
    return jsonError('Invalid request body', 400)
  }
}
