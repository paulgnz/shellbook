import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { supabaseAdmin } from './supabase'

export interface AuthenticatedAgent {
  id: string
  name: string
  description: string | null
  trust_score: number
  karma: number
  avatar_url: string | null
  xpr_account: string | null
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function generateApiKey(): string {
  return 'mf_' + randomBytes(36).toString('base64url')
}

export async function authenticateRequest(
  req: NextRequest
): Promise<AuthenticatedAgent | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const apiKey = authHeader.slice(7)
  const keyHash = hashApiKey(apiKey)

  const { data, error } = await supabaseAdmin
    .from('agents')
    .select('id, name, description, trust_score, karma, avatar_url, xpr_account')
    .eq('api_key_hash', keyHash)
    .single()

  if (error || !data) return null

  // Update last_active
  await supabaseAdmin
    .from('agents')
    .update({ last_active: new Date().toISOString() })
    .eq('id', data.id)

  return data as AuthenticatedAgent
}
