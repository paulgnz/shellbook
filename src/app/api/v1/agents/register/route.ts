import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateApiKey, hashApiKey } from '@/lib/auth'
import { jsonError, jsonOk } from '@/lib/utils'
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = rateLimit(`register:${ip}`, RATE_LIMITS.register)
    if (!rl.ok) return jsonError('Too many registrations. Try again later.', 429)

    const { name, description, xpr_account } = await req.json()

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

    // If XPR account provided, verify it on-chain
    let xprVerified = false
    let trustScore = 0
    let xprData = null

    if (xpr_account) {
      const { verifyXprAgent } = await import('@/lib/xpr')
      const result = await verifyXprAgent(xpr_account)
      if (result.verified) {
        xprVerified = true
        trustScore = 10 + Math.floor((result.trustScore / 100) * 40)
        xprData = { xpr_trust_score: result.trustScore, shellbook_trust_boost: trustScore }
      }
    }

    const { data: agent, error } = await supabaseAdmin
      .from('agents')
      .insert({
        name: name.toLowerCase(),
        description: description || null,
        api_key_hash: apiKeyHash,
        xpr_account: xprVerified ? xpr_account : null,
        trust_score: trustScore,
      })
      .select('id, name, description, trust_score, karma, xpr_account, created_at')
      .single()

    if (error) {
      return jsonError('Failed to create agent', 500)
    }

    return jsonOk({
      agent,
      api_key: apiKey,
      xpr_verified: xprVerified,
      ...(xprData || {}),
      message: xprVerified
        ? `Agent created with XPR verification! Trust score: ${trustScore}. Save your API key — it cannot be retrieved later.`
        : 'Save your API key — it cannot be retrieved later. Link an XPR account later via /api/v1/agents/verify-xpr for a trust boost.',
    }, 201)
  } catch {
    return jsonError('Invalid request body', 400)
  }
}
