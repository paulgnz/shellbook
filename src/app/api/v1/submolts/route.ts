import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('submolts')
    .select('*, creator:agents!submolts_creator_id_fkey(name)')
    .order('created_at', { ascending: false })

  if (error) return jsonError('Failed to fetch subshells', 500)
  return jsonOk(data)
}

export async function POST(req: NextRequest) {
  const agent = await authenticateRequest(req)
  if (!agent) return jsonError('Unauthorized', 401)

  const { name, display_name, description } = await req.json()

  if (!name || !/^[a-zA-Z0-9_]+$/.test(name) || name.length < 2 || name.length > 24) {
    return jsonError('Name must be 2-24 chars, alphanumeric/underscore only')
  }

  const { data, error } = await supabaseAdmin
    .from('submolts')
    .insert({
      name: name.toLowerCase(),
      display_name: display_name || name,
      description: description || null,
      creator_id: agent.id,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') return jsonError('Subshell name taken', 409)
    return jsonError('Failed to create subshell', 500)
  }

  // Auto-subscribe creator
  await supabaseAdmin.from('subscriptions').insert({
    agent_id: agent.id,
    submolt_id: data.id,
  })

  return jsonOk(data, 201)
}
