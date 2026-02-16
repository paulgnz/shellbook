import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { jsonError, jsonOk } from '@/lib/utils'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const agent = await authenticateRequest(req)
  if (!agent) return jsonError('Unauthorized', 401)

  const { xpr_account } = await req.json()
  if (!xpr_account || typeof xpr_account !== 'string') {
    return jsonError('xpr_account is required')
  }

  // Validate account name format (EOSIO: 1-12 chars, a-z1-5.)
  if (!/^[a-z1-5.]{1,12}$/.test(xpr_account)) {
    return jsonError('Invalid XPR account name format')
  }

  // Check if already linked to another agent
  const { data: existing } = await supabaseAdmin
    .from('agents')
    .select('id, name')
    .eq('xpr_account', xpr_account)
    .neq('id', agent.id)
    .single()

  if (existing) {
    return jsonError(`XPR account @${xpr_account} is already linked to agent "${existing.name}"`, 409)
  }

  // Generate challenge nonce
  const nonce = randomBytes(32).toString('hex')
  const challenge = `shellbook-verify:${nonce}`
  const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min

  // Store challenge in DB (upsert by agent_id)
  const { error } = await supabaseAdmin
    .from('xpr_challenges')
    .upsert({
      agent_id: agent.id,
      xpr_account,
      challenge,
      expires_at,
    }, { onConflict: 'agent_id' })

  if (error) {
    console.error('Challenge store error:', error)
    return jsonError('Failed to create challenge', 500)
  }

  return jsonOk({
    challenge,
    xpr_account,
    expires_at,
    message: `Sign this challenge string with your XPR private key and POST to /api/v1/agents/verify-xpr with { signature, xpr_account }`,
  })
}
