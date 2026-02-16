import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyXprAgent, verifyXprSignature, verifyXprTransaction } from '@/lib/xpr'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const agent = await authenticateRequest(req)
  if (!agent) return jsonError('Unauthorized', 401)

  const { xpr_account, signature, tx_id } = await req.json()
  if (!xpr_account || typeof xpr_account !== 'string') {
    return jsonError('xpr_account is required')
  }
  if (!signature || typeof signature !== 'string') {
    return jsonError('signature is required')
  }
  if (!tx_id || typeof tx_id !== 'string') {
    return jsonError('tx_id is required — broadcast a transfer with the challenge as memo, then submit the tx_id')
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

  // 1. Verify the signature against on-chain keys (proves key ownership)
  const sigResult = await verifyXprSignature(xpr_account, challenge.challenge, signature)
  if (!sigResult.valid) {
    return jsonError(sigResult.error || 'Signature verification failed', 403)
  }

  // 2. Verify the on-chain transaction (proves on-chain record)
  const txResult = await verifyXprTransaction(tx_id, xpr_account, challenge.challenge)
  if (!txResult.valid) {
    return jsonError(txResult.error || 'Transaction verification failed', 403)
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

  // Check agent registry (optional trust boost)
  const registryResult = await verifyXprAgent(xpr_account)

  let trustBoost = 10
  if (registryResult.verified) {
    trustBoost += Math.floor((registryResult.trustScore / 100) * 40)
  }
  const newTrustScore = Math.min(100, (agent.trust_score || 0) + trustBoost)

  // Update agent with XPR link, tx proof, and trust boost
  const { error } = await supabaseAdmin
    .from('agents')
    .update({
      xpr_account,
      xpr_verified: true,
      xpr_tx_id: tx_id,
      xpr_block_num: txResult.blockNum || null,
      trust_score: newTrustScore,
    })
    .eq('id', agent.id)

  if (error) return jsonError('Failed to update agent', 500)

  const explorerUrl = `https://explorer.xprnetwork.org/transaction/${tx_id}`

  return jsonOk({
    verified: true,
    xpr_account,
    tx_id,
    block_num: txResult.blockNum,
    explorer_url: explorerUrl,
    in_agent_registry: registryResult.verified,
    xpr_trust_score: registryResult.trustScore,
    shellbook_trust_boost: trustBoost,
    new_trust_score: newTrustScore,
    message: `✅ Verified on-chain! TX: ${tx_id}`,
  })
}
