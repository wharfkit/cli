/* eslint-disable no-console */
import {APIClient} from '@wharfkit/antelope'
import {Chains} from '@wharfkit/common'
import fetch from 'node-fetch'

interface ApiClientLike {
    v1: {
        chain: {
            get_account: (name: string) => Promise<{
                last_code_update: string
                ram_usage: {toNumber?: () => number} | number
                ram_quota: {toNumber?: () => number} | number
                core_liquid_balance?: {toString: () => string}
            }>
            get_abi: (name: string) => Promise<{
                abi?: {
                    actions?: {
                        name: {toString: () => string}
                        type: string
                        ricardian_contract?: string
                    }[]
                    tables?: {
                        name: {toString: () => string}
                        type: string
                        key_names?: string[]
                        index_type?: string
                    }[]
                    structs?: {name: string; fields?: {name: string; type: string}[]}[]
                    action_results?: {name: string; result_type: string}[]
                    variants?: {name: string; types?: string[]}[]
                }
            }>
        }
    }
}

interface ContractInfoOptions {
    chain?: string
    json?: boolean
    _apiClient?: ApiClientLike // For testing purposes
}

export function getApiUrl(chainName: string): string {
    const knownChainKey = Object.keys(Chains).find(
        (key) => key.toLowerCase() === chainName.toLowerCase()
    )

    if (knownChainKey) {
        return (Chains as any)[knownChainKey].url
    }

    switch (chainName) {
        case 'local':
            return 'http://127.0.0.1:8888'
        default:
            if (chainName.startsWith('http')) {
                return chainName
            }
            throw new Error(
                `Unknown chain: ${chainName}. Please provide a full URL or a known chain name.`
            )
    }
}

export function createApiClient(url: string): APIClient {
    return new APIClient({
        url,
        fetch,
    })
}

export async function lookupContractInfo(
    chainName: string,
    accountName: string,
    options: ContractInfoOptions
): Promise<void> {
    const url = getApiUrl(chainName)
    const api = options._apiClient || createApiClient(url)

    try {
        // Get account info
        const account = await api.v1.chain.get_account(accountName)

        // Get ABI
        const abiResponse = await api.v1.chain.get_abi(accountName)

        if (options.json) {
            const result = {
                account: accountName,
                chain: chainName,
                hasCode: !!abiResponse.abi,
                lastCodeUpdate: account.last_code_update,
                ram: {
                    used: Number(account.ram_usage),
                    quota: Number(account.ram_quota),
                },
                balance: account.core_liquid_balance?.toString() || '0',
                actions: abiResponse.abi?.actions?.map((a) => a.name.toString()) || [],
                tables: abiResponse.abi?.tables?.map((t) => t.name.toString()) || [],
                structs: abiResponse.abi?.structs?.map((s) => s.name) || [],
            }
            console.log(JSON.stringify(result, null, 2))
            return
        }

        // Pretty print
        console.log(`Contract: ${accountName}`)
        console.log(`Chain: ${chainName}`)

        if (!abiResponse.abi) {
            console.log('\n❌ No contract deployed on this account')
            return
        }

        console.log(`Last code update: ${account.last_code_update}`)
        console.log(`RAM: ${account.ram_usage} / ${account.ram_quota} bytes`)

        if (account.core_liquid_balance) {
            console.log(`Balance: ${account.core_liquid_balance}`)
        }

        // Actions
        const actions = abiResponse.abi.actions || []
        if (actions.length > 0) {
            console.log('\nActions:')
            for (const action of actions) {
                const actionStruct = abiResponse.abi.structs?.find((s) => s.name === action.type)
                const params = actionStruct?.fields?.map((f) => `${f.name}: ${f.type}`).join(', ')
                console.log(`  ${action.name}(${params || ''})`)
            }
        } else {
            console.log('\nActions: none')
        }

        // Tables
        const tables = abiResponse.abi.tables || []
        if (tables.length > 0) {
            console.log('\nTables:')
            for (const table of tables) {
                const tableStruct = abiResponse.abi.structs?.find((s) => s.name === table.type)
                const fields = tableStruct?.fields?.length || 0
                console.log(
                    `  ${table.name} (${fields} fields, key: ${
                        table.key_names?.[0] || table.index_type || 'primary'
                    })`
                )
            }
        } else {
            console.log('\nTables: none')
        }

        // Ricardian contracts (if any)
        const hasRicardian = actions.some(
            (a) => a.ricardian_contract && a.ricardian_contract.length > 0
        )
        if (hasRicardian) {
            console.log('\n✓ Has Ricardian contracts')
        }

        // Action results (if any)
        const actionResults = abiResponse.abi.action_results || []
        if (actionResults.length > 0) {
            console.log('\nAction Results:')
            for (const result of actionResults) {
                console.log(`  ${result.name} -> ${result.result_type}`)
            }
        }

        // Variants (if any)
        const variants = abiResponse.abi.variants || []
        if (variants.length > 0) {
            console.log('\nVariants:')
            for (const variant of variants) {
                console.log(`  ${variant.name}: ${variant.types?.join(' | ')}`)
            }
        }
    } catch (error: any) {
        if (error.message?.includes('Account not found')) {
            console.error(`Error: Account "${accountName}" not found on ${chainName}`)
        } else {
            console.error(`Error fetching contract info: ${error.message}`)
        }
        process.exit(1)
    }
}
