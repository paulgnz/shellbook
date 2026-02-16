import { JsonRpc } from '@proton/js'
import { AgentRegistry } from '@xpr-agents/sdk'

const rpc = new JsonRpc('https://proton.eosusa.io')
const agents = new AgentRegistry(rpc)

export async function verifyXprAgent(xprAccount: string): Promise<{
  verified: boolean
  trustScore: number
  agent: any | null
}> {
  try {
    const agent = await agents.getAgent(xprAccount)
    if (!agent) {
      return { verified: false, trustScore: 0, agent: null }
    }

    const trust = await agents.getTrustScore(xprAccount)
    return {
      verified: true,
      trustScore: trust?.total ?? 0,
      agent,
    }
  } catch {
    return { verified: false, trustScore: 0, agent: null }
  }
}
