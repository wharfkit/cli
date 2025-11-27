/* eslint-disable no-console */
import '../../types/wharfkit-session'
import {existsSync, readdirSync, readFileSync, statSync} from 'fs'
import {basename, extname, resolve} from 'path'
import {ABI, APIClient, Asset, FetchProvider, PrivateKey, Serializer} from '@wharfkit/antelope'
import {Session} from '@wharfkit/session'
import {WalletPluginPrivateKey} from '@wharfkit/wallet-plugin-privatekey'
import fetch from 'node-fetch'
import {NonInteractiveConsoleUI} from '../../utils/wharfkit-ui'
import {getKeyFromWallet, listWalletKeys} from '../wallet/utils'

import {Chains} from '@wharfkit/common'
import {compileContract} from '../compile'
import {displayQRCode} from '../../utils'
import {
    analyzeRamRequirements,
    createTransferESR,
    displayRamAnalysis,
    formatBytes,
    promptConfirmation,
    waitForBalance,
} from './deploy-utils'

interface DeployOptions {
    account?: string
    url?: string
    force?: boolean
    validate?: boolean
    key?: string
    yes?: boolean // Skip confirmation prompts
}

/**
 * Validate deployment safety (checks for orphaned tables with data)
 */
export async function validateDeploy(
    accountName: string,
    abiJson: any,
    url: string,
    force: boolean
): Promise<void> {
    const client = new APIClient({
        provider: new FetchProvider(url, {fetch}),
    })

    try {
        const existingAbiResponse = await client.v1.chain.get_abi(accountName)
        if (existingAbiResponse.abi) {
            const oldAbi = existingAbiResponse.abi
            const newAbi = ABI.from(abiJson)

            const oldTables = new Set(oldAbi.tables.map((t) => String(t.name)))
            const newTables = new Set(newAbi.tables.map((t) => String(t.name)))

            const removedTables = [...oldTables].filter((t) => !newTables.has(t))

            if (removedTables.length > 0) {
                console.log(
                    `\n⚠️  Warning: The new ABI removes the following tables: ${removedTables.join(
                        ', '
                    )}`
                )
                console.log(`   Checking for existing data in these tables...`)

                let hasData = false
                for (const table of removedTables) {
                    try {
                        const rows = await client.v1.chain.get_table_rows({
                            code: accountName,
                            scope: accountName,
                            table,
                            limit: 1,
                        })
                        if (rows.rows.length > 0) {
                            console.log(`   ❌ Table '${table}' contains data!`)
                            hasData = true
                        } else {
                            console.log(`   ✅ Table '${table}' is empty.`)
                        }
                    } catch (e: any) {
                        console.log(
                            `   ⚠️  Warning: Could not check table '${table}' for data: ${
                                e.message || String(e)
                            }`
                        )
                    }
                }

                if (hasData) {
                    if (force) {
                        console.log(`   ⚠️  Proceeding despite data loss warning (--force used).`)
                    } else {
                        throw new Error(
                            `Deployment would make existing table data inaccessible (orphaned).`
                        )
                    }
                } else {
                    console.log(`   ✅ No data found in removed tables. Safe to proceed.`)
                }
            } else {
                console.log(`   ✅ No tables removed.`)
            }
        } else {
            console.log(`   ✅ No existing ABI found (new deployment).`)
        }
    } catch (error: any) {
        if (error.message.includes('orphaned')) {
            throw new Error(
                `SAFETY CHECK FAILED: ${error.message}\nUse --force to override this check and deploy anyway.`
            )
        }
        // If validation fails due to network or other reasons, we might want to warn but proceed if not validating explicitly?
        // If explicitly validating, we should error.
        // If deploying, we usually proceed unless critical.
        // But "safety check" implies we stop.
        // However, if account doesn't exist, get_abi throws.
        // We should catch that.
        if (
            error.message.includes('Account not found') ||
            error.message.includes('does not exist') ||
            error.message.includes('Account Query Exception')
        ) {
            // New account or account doesn't exist yet, safe to proceed
            return
        }

        // If it's a validation run, rethrow.
        // If it's a deploy run, maybe warn?
        // But we want strict safety.
        throw error
    }
}

/**
 * Deploy a compiled contract to the blockchain
 * @param wasmFile - Path to the WASM file to deploy
 * @param options - Deployment options
 */
export async function deployContract(
    wasmFile: string | undefined,
    options: DeployOptions
): Promise<void> {
    // Determine the WASM file to deploy
    let wasmPath: string
    try {
        wasmPath = wasmFile ? resolve(wasmFile) : await findWasmFile()
    } catch (error: any) {
        if (error.message.includes('No .wasm files found') && !wasmFile) {
            console.log('No WASM file found. Attempting to compile contracts...')
            try {
                await compileContract(undefined, '.')
                wasmPath = await findWasmFile()
            } catch (compileError: any) {
                throw new Error(
                    `Failed to auto-compile: ${compileError.message}\nPlease run 'wharfkit compile' manually.`
                )
            }
        } else {
            throw error
        }
    }

    if (!existsSync(wasmPath)) {
        throw new Error(`WASM file not found: ${wasmPath}`)
    }

    if (extname(wasmPath) !== '.wasm') {
        throw new Error(`File must be a .wasm file: ${wasmPath}`)
    }

    // Find the ABI file
    const abiPath = wasmPath.replace('.wasm', '.abi')
    if (!existsSync(abiPath)) {
        throw new Error(`ABI file not found: ${abiPath}`)
    }

    // Determine the contract account name
    const accountName = options.account || basename(wasmPath, '.wasm')

    // Determine the blockchain URL
    let url = options.url || 'http://127.0.0.1:8888'

    // Check if URL is a known chain name
    const knownChainKey = Object.keys(Chains).find((key) => key.toLowerCase() === url.toLowerCase())
    if (knownChainKey) {
        url = (Chains as any)[knownChainKey].url
    }

    if (options.validate) {
        console.log(`Validating deployment for ${accountName}...`)
    } else {
        console.log(`Deploying contract...`)
    }
    console.log(`  WASM: ${wasmPath}`)
    console.log(`  ABI: ${abiPath}`)
    console.log(`  Account: ${accountName}`)
    console.log(`  URL: ${url}`)

    try {
        // Read WASM and ABI files
        const wasmCode = readFileSync(wasmPath)
        const abiJson = JSON.parse(readFileSync(abiPath, 'utf8'))

        // Perform validation/safety check
        // Only skip if force is used AND we are NOT explicitly validating?
        // Actually, even with force, we might want to see warnings.
        // But validateDeploy throws if unsafe and not forced.
        await validateDeploy(accountName, abiJson, url, !!options.force)

        if (options.validate) {
            console.log('\n✅ Validation passed! Deployment appears safe.')
            return
        }

        // Create API client for RAM analysis
        const analysisClient = new APIClient({
            provider: new FetchProvider(url, {fetch}),
        })

        // Get file sizes for RAM calculation
        const wasmSize = statSync(wasmPath).size
        const abiSize = statSync(abiPath).size

        // Analyze RAM requirements
        console.log('\n📊 Analyzing RAM requirements...')
        let ramInfo = await analyzeRamRequirements(analysisClient, accountName, wasmSize, abiSize)
        displayRamAnalysis(ramInfo, accountName)

        // Handle insufficient resources (only on chains with system contracts)
        if (ramInfo.hasSystemContract && !ramInfo.hasEnoughRam && !ramInfo.hasEnoughTokens) {
            // Need to acquire tokens first
            const tokensNeeded = Asset.from(ramInfo.costInTokens)
            const symbol = String(tokensNeeded).split(' ')[1]
            const currentBalance = ramInfo.tokenBalance.value || 0
            const shortfall = tokensNeeded.value - currentBalance
            const amountToSend = Asset.from(`${(shortfall * 1.01).toFixed(4)} ${symbol}`)

            console.log(
                `\n❌ Insufficient funds! Need approximately ${amountToSend} more ${symbol}`
            )

            try {
                const {uri} = await createTransferESR(
                    analysisClient,
                    accountName,
                    amountToSend,
                    `RAM for contract deployment`
                )

                displayQRCode(uri, `💰 Send ${amountToSend} to ${accountName}`)

                // Poll for balance - only wait for the actual amount needed (not the buffered amount)
                const targetBalance = Asset.from(`${tokensNeeded.value.toFixed(4)} ${symbol}`)
                const received = await waitForBalance(
                    analysisClient,
                    accountName,
                    targetBalance,
                    5000,
                    300000
                )

                if (!received) {
                    throw new Error('Deployment cancelled: Funds not received within timeout')
                }

                // Re-analyze RAM after receiving funds
                ramInfo = await analyzeRamRequirements(
                    analysisClient,
                    accountName,
                    wasmSize,
                    abiSize
                )
            } catch (esrError) {
                // ESR creation might fail on local chains without proper setup
                console.log(
                    `\n⚠️  Could not create payment request: ${(esrError as Error).message}`
                )
                console.log(
                    `\n💡 Please manually send at least ${ramInfo.costInTokens} to ${accountName}`
                )
                throw new Error('Insufficient funds for deployment')
            }
        }

        // Check if we need to buy RAM (only on chains with system contracts)
        if (ramInfo.hasSystemContract && !ramInfo.hasEnoughRam && ramInfo.hasEnoughTokens) {
            console.log(`\n💡 Account needs to purchase ${formatBytes(ramInfo.ramToBuy)} of RAM`)
            console.log(`   Estimated cost: ${ramInfo.costInTokens}`)

            if (!options.yes) {
                const ramAmount = formatBytes(ramInfo.ramToBuy)
                const proceed = await promptConfirmation(
                    `\nPurchase ${ramAmount} of RAM for ~${ramInfo.costInTokens}?`
                )

                if (!proceed) {
                    console.log('Deployment cancelled by user.')
                    return
                }
            }
        } else if (!options.yes) {
            // Confirm deployment even if RAM is sufficient
            const proceed = await promptConfirmation(
                `\nProceed with deployment? (RAM needed: ${formatBytes(ramInfo.ramBytesNeeded)})`
            )

            if (!proceed) {
                console.log('Deployment cancelled by user.')
                return
            }
        }

        // Get private key from wallet for this account
        const privateKey = await getPrivateKeyForDeploy(accountName, options)

        // Create API client
        const client = new APIClient({
            provider: new FetchProvider(url, {fetch}),
        })

        // Verify the key matches the account's active permission
        try {
            const accountInfo = await client.v1.chain.get_account(accountName)
            const activePermission = accountInfo.permissions.find(
                (p) => String(p.perm_name) === 'active'
            )
            if (activePermission) {
                const publicKey = privateKey.toPublic().toString()
                const keyMatches = activePermission.required_auth.keys.some(
                    (k) => String(k.key) === publicKey
                )
                if (!keyMatches) {
                    const accountKeys = activePermission.required_auth.keys.map((k) => k.key)
                    throw new Error(
                        `The selected key (${publicKey}) does not match account "${accountName}"'s active permission.\n` +
                            `Account's active permission keys: ${accountKeys.join(', ')}\n\n` +
                            `To deploy, you need a key that matches the account's active permission.\n` +
                            `Options:\n` +
                            `  1. Import the correct key: wharfkit wallet keys add <private-key>\n` +
                            `  2. Specify the key: wharfkit contract deploy --key <key-name-or-private-key>\n` +
                            `  3. Set WHARFKIT_DEPLOY_KEY environment variable`
                    )
                }
            }
        } catch (error: any) {
            // If account doesn't exist or we can't fetch permissions, let the deployment attempt proceed
            // (it will fail with a clearer error from the blockchain)
            if (!error.message.includes('does not match')) {
                console.log(
                    `Warning: Could not verify key matches account permission: ${error.message}`
                )
            } else {
                throw error
            }
        }

        // Create session with private key wallet plugin
        const walletPlugin = new WalletPluginPrivateKey(privateKey)
        walletPlugin.config.requiresChainSelect = false
        walletPlugin.config.requiresPermissionSelect = false
        walletPlugin.config.requiresPermissionEntry = false

        const session = new Session({
            chain: {
                id: await getChainId(client),
                url,
            },
            actor: accountName,
            permission: 'active',
            walletPlugin,
            ui: new NonInteractiveConsoleUI(),
        })

        console.log('\n🚀 Deploying contract...')

        // Build actions array
        const actions: Array<{
            account: string
            name: string
            authorization: Array<{actor: string; permission: string}>
            data: Record<string, unknown>
        }> = []

        // Add buyrambytes action if needed (only on chains with system contracts)
        if (ramInfo.hasSystemContract && !ramInfo.hasEnoughRam && ramInfo.ramToBuy > 0) {
            console.log(`   📦 Buying ${formatBytes(ramInfo.ramToBuy)} of RAM...`)
            actions.push({
                account: 'eosio',
                name: 'buyrambytes',
                authorization: [
                    {
                        actor: accountName,
                        permission: 'active',
                    },
                ],
                data: {
                    payer: accountName,
                    receiver: accountName,
                    bytes: ramInfo.ramToBuy,
                },
            })
        }

        // Create setcode action
        const setcodeAction = {
            account: 'eosio',
            name: 'setcode',
            authorization: [
                {
                    actor: accountName,
                    permission: 'active',
                },
            ],
            data: {
                account: accountName,
                vmtype: 0,
                vmversion: 0,
                code: wasmCode.toString('hex'),
            },
        }
        actions.push(setcodeAction)

        // Create setabi action
        const setabiAction = {
            account: 'eosio',
            name: 'setabi',
            authorization: [
                {
                    actor: accountName,
                    permission: 'active',
                },
            ],
            data: {
                account: accountName,
                abi: Serializer.encode({object: ABI.from(abiJson), type: ABI}).hexString,
            },
        }
        actions.push(setabiAction)

        // Transact all actions
        const result = await session.transact(
            {
                actions,
            },
            {
                broadcast: true,
            }
        )

        console.log('\n✅ Contract deployed successfully!')
        console.log(`Transaction ID: ${result.resolved?.transaction.id}`)
    } catch (error) {
        const errorMessage = (error as Error).message
        throw new Error(`Failed to deploy contract: ${errorMessage}`)
    }
}

/**
 * Check if a string looks like a private key
 */
function isPrivateKeyString(str: string): boolean {
    return str.startsWith('PVT_') || str.startsWith('5') || /^[A-Za-z0-9]{51}$/.test(str)
}

/**
 * Get private key for deployment based on account name, options, and environment
 */
async function getPrivateKeyForDeploy(
    accountName: string,
    options?: DeployOptions
): Promise<PrivateKey> {
    // 1. Check if --key option is provided
    if (options?.key) {
        // Check if it's a private key string
        if (isPrivateKeyString(options.key)) {
            try {
                console.log('Using private key from --key option')
                return PrivateKey.from(options.key)
            } catch (error) {
                throw new Error(`Invalid private key format: ${(error as Error).message}`)
            }
        }

        // Otherwise, treat it as a key name
        const keys = listWalletKeys()
        const key = keys.find((k) => k.name === options.key || k.publicKey === options.key)
        if (key) {
            console.log(`Using wallet key: ${key.name}`)
            return getKeyFromWallet(key.name)
        }
        throw new Error(`Key "${options.key}" not found in wallet`)
    }

    // 2. Check environment variable
    const envKey = process.env.WHARFKIT_DEPLOY_KEY
    if (envKey) {
        if (isPrivateKeyString(envKey)) {
            try {
                console.log('Using private key from WHARFKIT_DEPLOY_KEY environment variable')
                return PrivateKey.from(envKey)
            } catch (error) {
                throw new Error(
                    `Invalid private key format in WHARFKIT_DEPLOY_KEY: ${(error as Error).message}`
                )
            }
        }

        // Otherwise, treat it as a key name
        const keys = listWalletKeys()
        const key = keys.find((k) => k.name === envKey || k.publicKey === envKey)
        if (key) {
            console.log(`Using wallet key from environment: ${key.name}`)
            return getKeyFromWallet(key.name)
        }
        throw new Error(`Key "${envKey}" from WHARFKIT_DEPLOY_KEY not found in wallet`)
    }

    // 3. Fallback to existing logic: try account name, then default, then first key
    const keys = listWalletKeys()

    if (keys.length === 0) {
        throw new Error('No keys found in wallet. Create one with: wharfkit wallet create')
    }

    // Try to find a key with the same name as the account
    const accountKey = keys.find((k) => k.name === accountName)
    if (accountKey) {
        console.log(`Using wallet key: ${accountKey.name}`)
        return getKeyFromWallet(accountName)
    }

    // Otherwise, try 'default' key
    const defaultKey = keys.find((k) => k.name === 'default')
    if (defaultKey) {
        console.log(`Using wallet key: default`)
        return getKeyFromWallet('default')
    }

    // Try 'chain-key' (imported when chain starts)
    // Note: This only works if the account's active permission matches this key
    const chainKey = keys.find((k) => k.name === 'chain-key')
    if (chainKey) {
        console.log(`Using wallet key: chain-key`)
        console.log(
            `Note: This will only work if account "${accountName}"'s active permission matches this key`
        )
        return getKeyFromWallet('chain-key')
    }

    // Use first available key
    console.log(`Using wallet key: ${keys[0].name}`)
    return getKeyFromWallet(keys[0].name)
}

/**
 * Get chain ID from the API
 */
async function getChainId(client: APIClient): Promise<string> {
    try {
        const info = await client.v1.chain.get_info()
        return String(info.chain_id)
    } catch (error) {
        // Default to local chain ID if we can't get it
        return '8a34ec7df1b8cd06ff4a8abbaa7cc50300823350cadc59ab296cb00d104d2b8f'
    }
}

/**
 * Find a WASM file in the current directory
 */
async function findWasmFile(): Promise<string> {
    const currentDir = process.cwd()

    const wasmFiles = readdirSync(currentDir)
        .filter((file) => extname(file) === '.wasm')
        .map((file) => resolve(currentDir, file))

    if (wasmFiles.length === 0) {
        throw new Error(
            'No .wasm files found in current directory. Please specify a file or compile first with: wharfkit compile'
        )
    }

    if (wasmFiles.length > 1) {
        throw new Error(
            `Multiple .wasm files found: ${wasmFiles.map((f) => basename(f)).join(', ')}\n` +
                `Please specify which file to deploy.`
        )
    }

    return wasmFiles[0]
}
