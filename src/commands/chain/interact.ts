/* eslint-disable no-console */
import {APIClient, Name} from '@wharfkit/antelope'
import {Chains} from '@wharfkit/common'
import {Contract} from '@wharfkit/contract'
import {Command} from 'commander'
import fetch from 'node-fetch'

interface ChainInteractOptions {
    filter?: string
    json?: boolean
    scope?: string
}

function getApiUrl(chainName: string): string {
    // Check if it matches a known chain key from @wharfkit/common
    // The keys in Chains are PascalCase (e.g. Jungle4, EOS, WAX)
    // We should try to match case-insensitively
    const knownChainKey = Object.keys(Chains).find(
        (key) => key.toLowerCase() === chainName.toLowerCase()
    )

    if (knownChainKey) {
        return (Chains as any)[knownChainKey].url
    }

    switch (chainName) {
        case 'local':
            return 'http://127.0.0.1:8888'
        // mainnet, jungle4 etc are now handled via Chains lookup above
        // but keeping defaults/overrides if needed or for fallbacks
        default:
            if (chainName.startsWith('http')) {
                return chainName
            }
            throw new Error(`Unknown chain: ${chainName}. Please provide a full URL or a known chain name.`)
    }
}

function createApiClient(url: string): APIClient {
    return new APIClient({
        url,
        fetch,
    })
}

export async function lookupTable(
    chainName: string,
    tableNameInput: string,
    options: ChainInteractOptions
): Promise<void> {
    const url = getApiUrl(chainName)
    const api = createApiClient(url)

    let accountName: string
    let tableName: string

    if (tableNameInput.includes('::')) {
        const parts = tableNameInput.split('::')
        accountName = parts[0]
        tableName = parts[1]
    } else {
        if (!options.scope) {
             throw new Error('Please specify contract in format contract::table or use --scope to specify contract')
        }
        accountName = options.scope
        tableName = tableNameInput
    }

    try {
        const abiResponse = await api.v1.chain.get_abi(accountName)
        if (!abiResponse.abi) {
            throw new Error(`No ABI found for ${accountName}`)
        }

        const contract = new Contract({
            client: api,
            account: Name.from(accountName),
            abi: abiResponse.abi,
        })

        const queryOptions: any = {}
        if (options.filter) {
            queryOptions.from = options.filter
            queryOptions.limit = 10
        }
        
        // scope defaults to contract name if not provided
        // If user provided --scope, we use it.
        // Note: In our logic above, if :: is used, accountName is contract.
        // If not, accountName is options.scope (contract).
        // Table scope (the second arg to table()) is the data scope.
        // It defaults to contract name.
        // If user wants a different scope than contract, we might need another flag?
        // But usually contract::table implies scope=contract?
        // EOSIO tables: code, scope, table.
        // Contract.table(name, scope)
        // We will assume scope = contract name unless specified?
        // options.scope is currently used for contract name if :: is missing.
        // If :: is present, options.scope could be the data scope.
        
        let dataScope = accountName
        if (tableNameInput.includes('::') && options.scope) {
            dataScope = options.scope
        }
        
        const tableInstance = contract.table(tableName, dataScope)

        const results = await tableInstance.query(queryOptions)
        
        if (options.json) {
            console.log(JSON.stringify(results, null, 2))
        } else {
            console.table(results)
        }

    } catch (error: any) {
        console.error(`Error fetching table data: ${error.message}`)
        process.exit(1)
    }
}

export async function lookupAccount(
    chainName: string,
    accountName: string,
    options: ChainInteractOptions
): Promise<void> {
    const url = getApiUrl(chainName)
    const api = createApiClient(url)

    try {
        const account = await api.v1.chain.get_account(accountName)

        if (options.json) {
            console.log(JSON.stringify(account, null, 2))
        } else {
            // Pretty print essential info
            console.log(`Account: ${account.account_name}`)
            console.log(`Created: ${account.created}`)
            console.log(`Privileged: ${account.privileged}`)
            console.log(`Last code update: ${account.last_code_update}`)
            
            if (account.core_liquid_balance) {
                console.log(`Liquid Balance: ${account.core_liquid_balance}`)
            }
            
            console.log('\nResources:')
            console.log(`  RAM: ${account.ram_usage} / ${account.ram_quota} bytes`)
            if (account.net_limit) {
                 console.log(`  NET: ${account.net_limit.used} / ${account.net_limit.max} bytes (${account.net_limit.available} available)`)
            }
            if (account.cpu_limit) {
                 console.log(`  CPU: ${account.cpu_limit.used} / ${account.cpu_limit.max} us (${account.cpu_limit.available} available)`)
            }
            
            if (account.permissions.length > 0) {
                console.log('\nPermissions:')
                for (const perm of account.permissions) {
                     console.log(`  ${perm.perm_name} (${perm.parent}):`)
                     console.log(`    Threshold: ${perm.required_auth.threshold}`)
                     for (const key of perm.required_auth.keys) {
                         console.log(`    Key: ${key.key} (weight: ${key.weight})`)
                     }
                     for (const acc of perm.required_auth.accounts) {
                         console.log(`    Account: ${acc.permission.actor}@${acc.permission.permission} (weight: ${acc.weight})`)
                     }
                }
            }
        }
    } catch (error: any) {
        console.error(`Error fetching account: ${error.message}`)
        process.exit(1)
    }
}

export function addInteractSubcommands(command: Command, fixedChainName?: string) {
    command
        .command('table <tableName>')
        .description('Lookup table data (format: contract::table or use --scope)')
        .option('--filter <filter>', 'Filter the table data')
        .option('--scope <scope>', 'The contract/scope of the table')
        .option('--json', 'Output as JSON')
        .action(async (tableName, options, cmd) => {
             const chainName = fixedChainName || cmd.parent?.args[0]
             if (!chainName) {
                 console.error('Chain name is required')
                 process.exit(1)
             }
             await lookupTable(chainName, tableName, options)
        })

    command
        .command('account <accountName>')
        .description('Lookup account data')
        .option('--json', 'Output as JSON')
        .action(async (accountName, options, cmd) => {
             const chainName = fixedChainName || cmd.parent?.args[0]
             if (!chainName) {
                 console.error('Chain name is required')
                 process.exit(1)
             }
             await lookupAccount(chainName, accountName, options)
        })
}

export function addInteractCommands(chain: Command) {
    // Register known chains from @wharfkit/common as explicit subcommands
    // This ensures they are discoverable and work without 'remote' prefix
    const knownChains = Object.keys(Chains)
    
    for (const chainKey of knownChains) {
        const chainName = chainKey.toLowerCase() // register as lowercase (jungle4, eos, etc)
        
        // Skip if it conflicts with existing commands (like 'local') - though 'local' isn't in Chains
        if (chainName === 'local') continue 

        const cmd = chain.command(chainName)
            .description(`Interact with ${chainKey} chain`)
        
        addInteractSubcommands(cmd, chainKey) // Pass the PascalCase key or lowercase? getApiUrl handles both.
    }

    // For arbitrary URLs, we still want a catch-all or 'remote' command.
    const chainContext = chain.command('remote <chainName>')
        .description('Interact with a custom chain URL')
    addInteractSubcommands(chainContext)
}
