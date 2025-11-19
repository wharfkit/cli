/* eslint-disable no-console */
import {existsSync, readdirSync, readFileSync} from 'fs'
import {basename, extname, resolve} from 'path'
import type {PrivateKey} from '@wharfkit/antelope'
import {ABI, APIClient, FetchProvider, Serializer} from '@wharfkit/antelope'
import {Session} from '@wharfkit/session'
import {WalletPluginPrivateKey} from '@wharfkit/wallet-plugin-privatekey'
import fetch from 'node-fetch'
import {NonInteractiveConsoleUI} from '../../utils/wharfkit-ui'
import {getKeyFromWallet, listWalletKeys} from '../wallet/utils'

interface DeployOptions {
    account?: string
    url?: string
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
    const wasmPath = wasmFile ? resolve(wasmFile) : await findWasmFile()

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
    const url = options.url || 'http://127.0.0.1:8888'

    console.log(`Deploying contract...`)
    console.log(`  WASM: ${wasmPath}`)
    console.log(`  ABI: ${abiPath}`)
    console.log(`  Account: ${accountName}`)
    console.log(`  URL: ${url}`)

    try {
        // Read WASM and ABI files
        const wasmCode = readFileSync(wasmPath)
        const abiJson = JSON.parse(readFileSync(abiPath, 'utf8'))

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
