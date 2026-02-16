import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyXprAgent, verifyXprSignature } from '@/lib/xpr'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const agent = await authenticateRequest(req)
  if (!agent) return jsonError('Unauthorized', 401)

  const { xpr_account, signature } = await req.json()
  if (!xpr_account || typeof xpr_account !== 'string') {
    return jsonError('xpr_account is required')
  }
  if (!signature || typeof signature !== 'string') {
    return jsonError('signature is required — first request a challenge from /api/v1/agents/verify-xpr/challenge')
  }

  // Look up the pending challenge
  const { data: challenge } = await supabaseAdmin
    .from('xpr_challenges')
    .select('*')
    .eq('agent_id', agent.id)
    .eq('xpr_account', xpr_account)
    .single()

  if (!challenge) {
    return jsonError('No pending challenge found. Request one first via POST /api/v1/agents/verify-xpr/challenge', 404)
  }

  // Check expiry
  if (new Date(challenge.expires_at) < new Date()) {
    await supabaseAdmin.from('xpr_challenges').delete().eq('id', challenge.id)
    return jsonError('Challenge expired. Request a new one.', 410)
  }

  // Verify the signature against on-chain keys
  const sigResult = await verifyXprSignature(xpr_account, challenge.challenge, signature)
  if (!sigResult.valid) {
    return jsonError(sigResult.error || 'Signature verification failed', 403)
  }

  // Delete used challenge
  await supabaseAdmin.from('xpr_challenges').delete().eq('id', challenge.id)

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

  // Verify on-chain agent registry (optional boost)
  const registryResult = await verifyXprAgent(xpr_account)

  // Trust boost: +10 base for proving key ownership, +up to 40 if registered in agent registry
  let trustBoost = 10
  if (registryResult.verified) {
    trustBoost += Math.floor((registryResult.trustScore / 100) * 40)
  }
  const newTrustScore = Math.min(100, (agent.trust_score || 0) + trustBoost)

  // Update agent
  const { error } = await supabaseAdmin
    .from('agents')
    .update({
      xpr_account,
      xpr_verified: true,
      trust_score: newTrustScore,
    })
    .eq('id', agent.id)

  if (error) return jsonError('Failed to update agent', 500)

  return jsonOk({
    verified: true,
    xpr_account,
    in_agent_registry: registryResult.verified,
    xpr_trust_score: registryResult.trustScore,
    shellbook_trust_boost: trustBoost,
    new_trust_score: newTrustScore,
    message: `✅ Verified! Proved ownership of XPR account @${xpr_account}. Trust score boosted by ${trustBoost} points.`,
  })
}
