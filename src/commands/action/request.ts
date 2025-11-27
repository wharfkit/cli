/* eslint-disable no-console */
import {ABI, APIClient, FetchProvider} from '@wharfkit/antelope'
import {Chains} from '@wharfkit/common'
import {PlaceholderName, PlaceholderPermission, SigningRequest} from '@wharfkit/signing-request'
import fetch from 'node-fetch'
import {displayQRCode} from '../../utils'

export interface ActionRequestOptions {
    chain?: string
    auth?: string
}

/**
 * Parse authorization string (e.g., "account@permission" or "account")
 * Returns undefined for actor/permission to use placeholders
 */
export function parseAuthorization(authString?: string): {
    actor: string | null
    permission: string
} {
    if (!authString) {
        return {actor: null, permission: 'active'}
    }

    if (authString.includes('@')) {
        const [actor, permission] = authString.split('@')
        return {actor, permission: permission || 'active'}
    }

    return {actor: authString, permission: 'active'}
}

/**
 * Parse action data from string (JSON or key=value pairs)
 */
export function parseActionData(dataString: string): Record<string, unknown> {
    // Try JSON first
    try {
        return JSON.parse(dataString)
    } catch {
        // Try key=value format
        const data: Record<string, unknown> = {}
        const pairs = dataString.split(',').map((p) => p.trim())

        for (const pair of pairs) {
            const [key, ...valueParts] = pair.split('=')
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').trim()
                // Try to parse as number or boolean
                if (value === 'true') {
                    data[key.trim()] = true
                } else if (value === 'false') {
                    data[key.trim()] = false
                } else if (!isNaN(Number(value)) && value !== '') {
                    data[key.trim()] = Number(value)
                } else {
                    data[key.trim()] = value
                }
            }
        }

        if (Object.keys(data).length === 0) {
            throw new Error(
                `Invalid action data format. Use JSON (e.g., '{"key": "value"}') or key=value pairs (e.g., 'key1=value1,key2=value2')`
            )
        }

        return data
    }
}

/**
 * Parse contract::action format and validate
 */
export function parseContractAction(contractAction: string): {
    contractAccount: string
    actionName: string
} {
    if (!contractAction.includes('::')) {
        throw new Error(
            `Invalid format. Use contract::action format (e.g., "eosio.token::transfer")`
        )
    }

    const [contractAccount, actionName] = contractAction.split('::')

    if (!contractAccount || !actionName) {
        throw new Error(
            `Invalid format. Use contract::action format (e.g., "eosio.token::transfer")`
        )
    }

    return {contractAccount, actionName}
}

/**
 * Get the API URL for a chain name or URL
 */
export function getApiUrl(chainOrUrl: string): string {
    // Check if it's already a URL
    if (chainOrUrl.startsWith('http://') || chainOrUrl.startsWith('https://')) {
        return chainOrUrl
    }

    // Check if it matches a known chain key from @wharfkit/common
    const knownChainKey = Object.keys(Chains).find(
        (key) => key.toLowerCase() === chainOrUrl.toLowerCase()
    )

    if (knownChainKey) {
        return (Chains as Record<string, {url: string}>)[knownChainKey].url
    }

    // Default to local
    if (chainOrUrl === 'local') {
        return 'http://127.0.0.1:8888'
    }

    throw new Error(
        `Unknown chain: ${chainOrUrl}. Use a full URL (http://...) or a known chain name (EOS, Jungle4, WAX, etc.)`
    )
}

/**
 * Create an ESR (EOSIO Signing Request) for any action
 */
export async function createActionESR(
    client: APIClient,
    contractAccount: string,
    actionName: string,
    actionData: Record<string, unknown>,
    auth: {actor: string | null; permission: string}
): Promise<{uri: string; encodedUri: string}> {
    const info = await client.v1.chain.get_info()
    const chainId = String(info.chain_id)

    // Fetch the contract ABI for serialization
    const abiResponse = await client.v1.chain.get_abi(contractAccount)
    if (!abiResponse.abi) {
        throw new Error(`Could not fetch ABI for contract: ${contractAccount}`)
    }
    const contractAbi = ABI.from(abiResponse.abi)

    // Verify the action exists in the ABI
    const actionDef = contractAbi.actions.find((a) => String(a.name) === actionName)
    if (!actionDef) {
        const availableActions = contractAbi.actions.map((a) => String(a.name)).join(', ')
        throw new Error(
            `Action "${actionName}" not found in contract "${contractAccount}". Available actions: ${availableActions}`
        )
    }

    // Use placeholders if no specific actor is provided
    const actor = auth.actor || PlaceholderName
    const permission = auth.actor ? auth.permission : PlaceholderPermission

    // Replace placeholder tokens in data with actual placeholders
    const processedData = processDataPlaceholders(actionData, auth.actor)

    // Create the signing request
    const request = await SigningRequest.create(
        {
            action: {
                account: contractAccount,
                name: actionName,
                authorization: [
                    {
                        actor,
                        permission,
                    },
                ],
                data: processedData,
            },
            chainId,
        },
        {
            abiProvider: {
                getAbi: async () => contractAbi,
            },
        }
    )

    const encodedUri = request.encode()
    // Normalize to esr:// format
    let uri = encodedUri
    if (!uri.startsWith('esr://')) {
        if (uri.startsWith('esr:')) {
            uri = `esr://${uri.slice(4)}`
        }
    }

    return {uri, encodedUri}
}

/**
 * Process data to replace special placeholder tokens
 * Replaces $signer with the PlaceholderName for ESR
 */
function processDataPlaceholders(
    data: Record<string, unknown>,
    specificActor: string | null
): Record<string, unknown> {
    const processed: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string' && value === '$signer') {
            processed[key] = specificActor || PlaceholderName
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            processed[key] = processDataPlaceholders(
                value as Record<string, unknown>,
                specificActor
            )
        } else {
            processed[key] = value
        }
    }

    return processed
}

/**
 * Create a signing request and display QR code
 */
export async function createActionRequest(
    contractAction: string,
    dataString: string,
    options: ActionRequestOptions
): Promise<void> {
    // Parse contract::action format
    const {contractAccount, actionName} = parseContractAction(contractAction)

    // Parse action data
    const actionData = parseActionData(dataString)

    // Parse authorization
    const auth = parseAuthorization(options.auth)

    // Get the API URL
    const url = getApiUrl(options.chain || 'local')

    console.log('Creating signing request...')
    console.log(`  Contract: ${contractAccount}`)
    console.log(`  Action: ${actionName}`)
    console.log(`  Chain: ${options.chain || 'local'} (${url})`)
    console.log(`  Data: ${JSON.stringify(actionData, null, 2)}`)

    if (auth.actor) {
        console.log(`  Authorization: ${auth.actor}@${auth.permission}`)
    } else {
        console.log(`  Authorization: <wallet signer>@<wallet permission>`)
    }

    try {
        const client = new APIClient({
            provider: new FetchProvider(url, {fetch}),
        })

        const {uri} = await createActionESR(client, contractAccount, actionName, actionData, auth)

        displayQRCode(uri, `📝 ${contractAccount}::${actionName}`)

        console.log(`\n✅ Signing request created!`)
        console.log(`   Scan the QR code with a compatible wallet to sign and broadcast.`)
    } catch (error) {
        console.error(`\n❌ Failed to create signing request: ${(error as Error).message}`)
        process.exit(1)
    }
}
