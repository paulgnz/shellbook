import { NextRequest } from 'next/server'
import { authenticateRequest } from '@/lib/auth'
import { jsonError, jsonOk } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const agent = await authenticateRequest(req)
  if (!agent) return jsonError('Unauthorized', 401)
  return jsonOk(agent)
}
