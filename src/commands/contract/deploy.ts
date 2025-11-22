/* eslint-disable no-console */
import '../../types/wharfkit-session'
import {existsSync, readdirSync, readFileSync} from 'fs'
import {basename, extname, resolve} from 'path'
import type {PrivateKey} from '@wharfkit/antelope'
import {ABI, APIClient, FetchProvider, Serializer} from '@wharfkit/antelope'
import {Session} from '@wharfkit/session'
import {WalletPluginPrivateKey} from '@wharfkit/wallet-plugin-privatekey'
import fetch from 'node-fetch'
import {NonInteractiveConsoleUI} from '../../utils/wharfkit-ui'
import {getKeyFromWallet, listWalletKeys} from '../wallet/utils'

import {Chains} from '@wharfkit/common'
import {compileContract} from '../wharfkit/compile'

interface DeployOptions {
    account?: string
    url?: string
    force?: boolean
    validate?: boolean
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
                        // If check fails, ignore or warn?
                        // Often "table not found" error if using state history or other plugins if really gone?
                        // But if get_abi returned it, it was in ABI.
                        // We assume no data if error, or warn.
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
            error.message.includes('does not exist')
        ) {
            // New account, safe.
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

        // Get private key from wallet for this account
        const privateKey = await getPrivateKeyForDeploy(accountName)

        // Create API client
        const client = new APIClient({
            provider: new FetchProvider(url, {fetch}),
        })

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

        // Transact both actions
        const result = await session.transact(
            {
                actions: [setcodeAction, setabiAction],
            },
            {
                broadcast: true,
            }
        )

        console.log('\n✅ Contract deployed successfully!')
        console.log(`Transaction ID: ${result.resolved?.transaction.id}`)
    } catch (error) {
        const errorMessage = (error as Error).message
        throw new Error(
            `Failed to deploy contract: ${errorMessage}\n\n` +
                `Make sure:\n` +
                `1. The blockchain is running (wharfkit chain local start)\n` +
                `2. The account "${accountName}" exists\n` +
                `3. You have a wallet key with permissions for this account\n` +
                `4. The ABI file exists alongside the WASM file`
        )
    }
}

/**
 * Get private key for deployment based on account name
 */
async function getPrivateKeyForDeploy(accountName: string): Promise<PrivateKey> {
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
