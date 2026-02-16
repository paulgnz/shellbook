import { JsonRpc, Key } from '@proton/js'
import { AgentRegistry } from '@xpr-agents/sdk'
import { createHash } from 'crypto'

const RPC_ENDPOINT = 'https://proton.eosusa.io'
const HYPERION_ENDPOINT = 'https://proton.eosusa.io'

const rpc = new JsonRpc(RPC_ENDPOINT)
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
 */
export async function verifyXprSignature(
  xprAccount: string,
  challenge: string,
  signature: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const digest = createHash('sha256').update(challenge).digest()
    const sig = Key.Signature.fromString(signature)
    const recoveredKey = sig.recover(digest)
    const recoveredKeyStr = recoveredKey.toLegacyString()
    const recoveredKeyPub = recoveredKey.toString()

    let account: any
    try {
      account = await rpc.get_account(xprAccount)
    } catch {
      return { valid: false, error: `XPR account @${xprAccount} not found on chain` }
    }

    for (const perm of account.permissions) {
      for (const keyAuth of perm.required_auth.keys) {
        const onChainKey = keyAuth.key
        if (onChainKey === recoveredKeyStr || onChainKey === recoveredKeyPub) {
          return { valid: true }
        }
        try {
          const parsed = Key.PublicKey.fromString(onChainKey)
          if (parsed.toLegacyString() === recoveredKeyStr) {
            return { valid: true }
          }
        } catch {
          // Skip unparseable keys (e.g. PUB_WA_ WebAuthn)
        }
      }
    }

    return { valid: false, error: 'Signature does not match any on-chain key for this account' }
  } catch (e: any) {
    return { valid: false, error: `Signature verification error: ${e.message}` }
  }
}

/**
 * Verify an on-chain transaction contains the expected verification memo.
 * Checks via Hyperion that:
 * 1. The tx exists
 * 2. It was sent FROM the claimed XPR account
 * 3. The memo contains the challenge string
 */
export async function verifyXprTransaction(
  txId: string,
  xprAccount: string,
  challenge: string,
): Promise<{ valid: boolean; blockNum?: number; error?: string }> {
  try {
    const res = await fetch(
      `${HYPERION_ENDPOINT}/v2/history/get_transaction?id=${txId}`,
      { next: { revalidate: 0 } }
    )
    if (!res.ok) {
      return { valid: false, error: 'Transaction not found on chain' }
    }

    const data = await res.json()

    if (!data.actions || data.actions.length === 0) {
      return { valid: false, error: 'Transaction has no actions' }
    }

    // Find a transfer action from the claimed account with the challenge in memo
    const matchingAction = data.actions.find((a: any) => {
      if (a.act?.account !== 'eosio.token' || a.act?.name !== 'transfer') return false
      const actData = a.act.data
      return (
        actData.from === xprAccount &&
        actData.memo &&
        actData.memo.includes(challenge)
      )
    })

    if (!matchingAction) {
      return {
        valid: false,
        error: 'Transaction does not contain a matching transfer from this account with the challenge memo',
      }
    }

    return { valid: true, blockNum: matchingAction.block_num }
  } catch (e: any) {
    return { valid: false, error: `Failed to verify transaction: ${e.message}` }
  }
}
