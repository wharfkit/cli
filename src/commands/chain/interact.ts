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
    limit?: string
    all?: boolean
    columns?: boolean
    fields?: string
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
        }
        
        // Default limit to 4 rows unless specified
        const userLimit = options.limit ? parseInt(options.limit, 10) : 4
        // Fetch one extra row to detect if there are more
        queryOptions.limit = userLimit + 1
        
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

        const cursor = await tableInstance.query(queryOptions)
        const allRows = await cursor.all()
        
        const hasMoreRows = allRows.length > userLimit
        const rows = hasMoreRows ? allRows.slice(0, userLimit) : allRows
        
        if (options.json) {
            console.log(JSON.stringify(rows, null, 2))
        } else if (options.columns) {
            // List available columns
            if (rows.length > 0) {
                const firstRow = rows[0]
                const rowObj = (firstRow as any).toJSON ? (firstRow as any).toJSON() : firstRow
                console.log('Available columns:')
                Object.keys(rowObj).forEach(key => console.log(`- ${key}`))
            } else {
                console.log('No data available to determine columns.')
            }
        } else {
            // If rows are complex objects (like Wharf structs), they might need toJSON()
            // But console.table handles objects well usually. 
            // Wharfkit structs have toJSON() which returns the plain object.
            const plainRows = rows.map((r) => {
                const row = (r as any).toJSON ? (r as any).toJSON() : r
                // Recursively convert objects to strings for console.table friendliness
                // This flattens BNs and other complex types
                const flatten = (obj: any): any => {
                    if (obj && typeof obj === 'object') {
                        // If it looks like a BN or wrapper { value: ... }
                        if ('value' in obj && Object.keys(obj).length === 1) {
                            return String(obj.value)
                        }
                        // Recursively map object values
                        const newObj: any = {}
                        for (const key in obj) {
                            newObj[key] = flatten(obj[key])
                        }
                        return newObj
                    }
                    return obj
                }
                return flatten(row)
            })

            // Limit columns displayed unless --all is used
            const displayedRows = plainRows.map(row => {
                if (options.all) return row
                
                const newRow: any = {}
                const keys = Object.keys(row)
                
                // Filter by --fields if provided
                if (options.fields) {
                    const selectedFields = options.fields.split(',').map(f => f.trim())
                    selectedFields.forEach(key => {
                        if (key in row) {
                            newRow[key] = row[key]
                        }
                    })
                    return newRow
                }
                
                if (keys.length <= 5) return row
                
                const visibleKeys = keys.slice(0, 4)
                visibleKeys.forEach(key => newRow[key] = row[key])
                
                // Add summary of hidden columns
                const hiddenCount = keys.length - 4
                newRow['...'] = `+${hiddenCount} more fields`
                return newRow
            })

            console.table(displayedRows)
            
            if (hasMoreRows) {
                console.log(`\n... and more rows (showing first ${userLimit}). Use --limit <number> to see more.`)
            }
            if (!options.all && !options.fields && plainRows.length > 0 && Object.keys(plainRows[0]).length > 5) {
                 console.log(`\nSome columns hidden. Use --all to see all, --fields to select specific columns, or --columns to list them.`)
            }
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
        .command('table <tableName> [extraFields...]')
        .description('Lookup table data (format: contract::table or use --scope)')
        .option('--filter <filter>', 'Filter the table data')
        .option('--scope <scope>', 'The contract/scope of the table')
        .option('--limit <limit>', 'Limit the number of rows displayed', '4')
        .option('--all', 'Display all columns')
        .option('--fields <fields>', 'Comma-separated list of fields/columns to display')
        .option('--columns', 'List available columns')
        .option('--json', 'Output as JSON')
        .action(async (tableName, extraFields, options, cmd) => {
             // Handle variadic args being shifted if extraFields is empty/present
             // Commander passes (arg1, arg2..., options, cmd)
             // If extraFields is provided, it's the second arg.
             // If NOT provided, options is the second arg? NO, extraFields is an array, potentially empty.
             // Wait, with [extraFields...], it is ALWAYS passed as an array (second arg).
             // But we need to be careful if 'options' is the 3rd arg.
             
             let opts = options
             let extras = extraFields
             
             // Commander 7+ usually guarantees order for defined args.
             // (tableName, extras, options, cmd)
             
             const chainName = fixedChainName || cmd.parent?.args[0]
             if (!chainName) {
                 console.error('Chain name is required')
                 process.exit(1)
             }
             
             // If user provided spaced fields like "--fields a, b", 'b' ends up in extras.
             // We should append them to fields.
             if (opts.fields && extras && extras.length > 0) {
                 opts.fields = [opts.fields, ...extras].join(' ')
             }
             
             await lookupTable(chainName, tableName, opts)
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
