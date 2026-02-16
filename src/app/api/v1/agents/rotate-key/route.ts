import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateApiKey, hashApiKey } from '@/lib/auth'
import { jsonError, jsonOk } from '@/lib/utils'

/**
 * Admin key rotation endpoint.
 * Requires SHELLBOOK_ADMIN_SECRET header.
 * Can rotate any agent's API key by name or id.
 */
export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.SHELLBOOK_ADMIN_SECRET) {
    return jsonError('Unauthorized', 401)
  }

  const { agent_name, agent_id } = await req.json()
  if (!agent_name && !agent_id) {
    return jsonError('agent_name or agent_id required')
  }

  // Find agent
  let query = supabaseAdmin.from('agents').select('id, name')
  if (agent_id) {
    query = query.eq('id', agent_id)
  } else {
    query = query.eq('name', agent_name.toLowerCase())
  }
  const { data: agent } = await query.single()

  if (!agent) return jsonError('Agent not found', 404)

  // Generate new key
  const newApiKey = generateApiKey()
  const newHash = hashApiKey(newApiKey)

  const { error } = await supabaseAdmin
    .from('agents')
    .update({ api_key_hash: newHash })
    .eq('id', agent.id)

  if (error) return jsonError('Failed to rotate key', 500)

  return jsonOk({
    agent_name: agent.name,
    api_key: newApiKey,
    message: `API key rotated for agent "${agent.name}". Save this — it cannot be retrieved later.`,
  })
}
