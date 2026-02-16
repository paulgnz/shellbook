import { JsonRpc, Key } from '@proton/js'
import { AgentRegistry } from '@xpr-agents/sdk'
import { createHash } from 'crypto'

const rpc = new JsonRpc('https://proton.eosusa.io')
const agents = new AgentRegistry(rpc)

/**
 * Check if an XPR account is registered in the Trustless Agent Registry.
 */
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

/**
 * Verify a signature against on-chain public keys for an XPR account.
 *
 * Flow:
 * 1. Hash the challenge string with SHA256
 * 2. Recover the public key from the signature + digest
 * 3. Fetch the account's on-chain keys
 * 4. Check if the recovered key matches any active/owner permission key
 */
export async function verifyXprSignature(
  xprAccount: string,
  challenge: string,
  signature: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    // 1. Create digest from challenge
    const digest = createHash('sha256').update(challenge).digest()

    // 2. Recover public key from signature
    const sig = Key.Signature.fromString(signature)
    const recoveredKey = sig.recover(digest)
    const recoveredKeyStr = recoveredKey.toLegacyString()
    const recoveredKeyPub = recoveredKey.toString() // PUB_K1_ format

    // 3. Fetch on-chain account
    let account: any
    try {
      account = await rpc.get_account(xprAccount)
    } catch {
      return { valid: false, error: `XPR account @${xprAccount} not found on chain` }
    }

    // 4. Check all permission keys (active + owner)
    for (const perm of account.permissions) {
      for (const keyAuth of perm.required_auth.keys) {
        const onChainKey = keyAuth.key
        // Compare in both legacy (EOS...) and modern (PUB_K1_...) formats
        if (onChainKey === recoveredKeyStr || onChainKey === recoveredKeyPub) {
          return { valid: true }
        }
        // Also try converting on-chain key to legacy for comparison
        try {
          const parsed = Key.PublicKey.fromString(onChainKey)
          if (parsed.toLegacyString() === recoveredKeyStr) {
            return { valid: true }
          }
        } catch {
          // Skip keys we can't parse (e.g. PUB_WA_ WebAuthn keys)
        }
      }
    }

    return { valid: false, error: 'Signature does not match any on-chain key for this account' }
  } catch (e: any) {
    return { valid: false, error: `Signature verification error: ${e.message}` }
  }
}
