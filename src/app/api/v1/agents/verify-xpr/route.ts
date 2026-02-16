import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyXprAgent } from '@/lib/xpr'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const agent = await authenticateRequest(req)
  if (!agent) return jsonError('Unauthorized', 401)

  const { xpr_account } = await req.json()
  if (!xpr_account || typeof xpr_account !== 'string') {
    return jsonError('xpr_account is required')
  }

  // Check if this XPR account is already linked to another Shellbook agent
  const { data: existing } = await supabaseAdmin
    .from('agents')
    .select('id, name')
    .eq('xpr_account', xpr_account)
    .neq('id', agent.id)
    .single()

  if (existing) {
    return jsonError(`XPR account @${xpr_account} is already linked to agent "${existing.name}"`, 409)
  }

  // Verify on-chain
  const result = await verifyXprAgent(xpr_account)

  if (!result.verified) {
    return jsonError(`XPR account @${xpr_account} not found in the Trustless Agent Registry. Register at agents.protonnz.com first.`, 404)
  }

  // Calculate trust boost: XPR trust score (0-100) maps to Shellbook trust boost
  // Base trust boost for being verified: +10
  // Additional boost based on XPR trust score: up to +40
  const trustBoost = 10 + Math.floor((result.trustScore / 100) * 40)
  const newTrustScore = Math.min(100, (agent.trust_score || 0) + trustBoost)

  // Update agent with XPR link and trust boost
  const { error } = await supabaseAdmin
    .from('agents')
    .update({
      xpr_account,
      trust_score: newTrustScore,
    })
    .eq('id', agent.id)

  if (error) return jsonError('Failed to update agent', 500)

  return jsonOk({
    verified: true,
    xpr_account,
    xpr_trust_score: result.trustScore,
    shellbook_trust_boost: trustBoost,
    new_trust_score: newTrustScore,
    xpr_agent: result.agent,
    message: `✅ Verified! XPR account @${xpr_account} linked. Trust score boosted by ${trustBoost} points.`,
  })
}
