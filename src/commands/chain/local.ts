/* eslint-disable no-console */
import {PrivateKey, PublicKey} from '@wharfkit/antelope'
import {Session} from '@wharfkit/session'
import {WalletPluginPrivateKey} from '@wharfkit/wallet-plugin-privatekey'
import {spawn} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import type {ChainStatus} from './utils'
import {
    cleanDataDir,
    createApiClientForPort,
    ensureDir,
    getConfigIni,
    getDefaultConfigDir,
    getDefaultDataDir,
    getDefaultWalletDir,
    getDevKeys,
    getGenesisJson,
    isPortAvailable,
    isProcessRunning,
    readPid,
    removePidFile,
    savePid,
    waitForChain,
} from './utils'
import {ensureLeapInstalled} from './install'
import {addKeyToWallet, DEFAULT_KEY_NAME, listWalletKeys} from '../wallet/utils'
import {NonInteractiveConsoleUI} from '../../utils/wharfkit-ui'

export interface LocalStartOptions {
    port: number
    clean: boolean
    key?: string
}

/**
 * Start the local blockchain
 */
export async function startLocalChain(options: LocalStartOptions): Promise<void> {
    console.log('Starting local LEAP blockchain...')

    // Check if LEAP is installed, install automatically if not
    await ensureLeapInstalled()

    // Check if chain is already running
    const currentStatus = await getChainStatus()
    if (currentStatus.running) {
        console.log(
            `Local chain is already running on port ${currentStatus.port} (PID: ${currentStatus.pid})`
        )
        return
    }

    // Setup directories
    const dataDir = getDefaultDataDir()
    const configDir = getDefaultConfigDir()
    const walletDir = getDefaultWalletDir()

    await ensureDir(dataDir)
    await ensureDir(configDir)
    await ensureDir(walletDir)

    // Clean if requested
    if (options.clean) {
        console.log('Cleaning blockchain data...')
        await cleanDataDir(dataDir)
    }

    // Check if port is available
    const portAvailable = await isPortAvailable(options.port)
    if (!portAvailable) {
        throw new Error(
            `Port ${options.port} is already in use. Use --port to specify a different port.`
        )
    }

    // Determine which key to use: provided, env var, or genesis key (default)
    let chainPrivateKey: PrivateKey
    let chainPublicKey: string
    const providedKey = options.key || process.env.WHARFKIT_CHAIN_KEY

    if (providedKey) {
        // Use provided key
        chainPrivateKey = PrivateKey.from(providedKey)
        chainPublicKey = chainPrivateKey.toPublic().toString()
        console.log('Using provided private key for chain')
    } else {
        // Use genesis key by default (always the same key for consistency)
        const devKeys = getDevKeys()
        chainPrivateKey = PrivateKey.from(devKeys.privateKey)
        chainPublicKey = devKeys.publicKey
        console.log('Using genesis key for chain (default)')
        console.log(`   Public Key: ${chainPublicKey}`)
    }

    // Create config files
    const configFile = path.join(configDir, 'config.ini')
    const genesisFile = path.join(configDir, 'genesis.json')

    // Write config.ini with the determined key
    const configContent = getConfigIni(options.port, chainPublicKey, chainPrivateKey.toString())
    await fs.promises.writeFile(configFile, configContent)

    // Write genesis.json if it doesn't exist or if cleaning
    if (options.clean || !fs.existsSync(genesisFile)) {
        const genesisContent = getGenesisJson(chainPublicKey)
        await fs.promises.writeFile(genesisFile, genesisContent)
    }

    // Start nodeos
    console.log(`Starting nodeos on port ${options.port}...`)

    const nodeosArgs = [
        '--config-dir',
        configDir,
        '--data-dir',
        dataDir,
        '--genesis-json',
        genesisFile,
        '--disable-replay-opts',
    ]

    // Setup log files
    const stdoutLog = path.join(dataDir, 'nodeos.log')
    const stderrLog = path.join(dataDir, 'nodeos-error.log')
    const stdoutFd = fs.openSync(stdoutLog, 'a')
    const stderrFd = fs.openSync(stderrLog, 'a')

    const nodeos = spawn('nodeos', nodeosArgs, {
        detached: true,
        stdio: ['ignore', stdoutFd, stderrFd],
    })

    // Close file descriptors in parent process (child has its own copy)
    fs.closeSync(stdoutFd)
    fs.closeSync(stderrFd)

    nodeos.unref()

    // Save PID
    await savePid(nodeos.pid!)

    console.log(`nodeos started with PID ${nodeos.pid}`)
    console.log(`   Logs: ${stdoutLog}`)

    // Wait for chain to be ready
    console.log('Waiting for chain to be ready...')
    const isReady = await waitForChain(options.port)

    if (!isReady) {
        const logFile = path.join(dataDir, 'nodeos-error.log')
        throw new Error(
            `Chain failed to start. Check logs for details:\n   ${logFile}\n   ${path.join(
                dataDir,
                'nodeos.log'
            )}`
        )
    }

    console.log('Chain is ready!')

    await ensureEosioPermissionsMatchChainKey(options.port, chainPrivateKey)

    // Setup dev wallet (import the key used for the chain)
    await setupDevWallet(chainPrivateKey.toString())

    console.log('\n✅ Local LEAP blockchain is running!')
    console.log(`   URL: http://127.0.0.1:${options.port}`)
    console.log(`   Data directory: ${dataDir}`)
    console.log(`   Config directory: ${configDir}`)
    console.log('\n📝 Chain keys:')
    console.log(`   Public: ${chainPublicKey}`)
    console.log(`   Private: ${chainPrivateKey.toString()}`)
    console.log('\n🛑 To stop: wharfkit chain local stop')
}

/**
 * Stop the local blockchain
 */
export async function stopLocalChain(): Promise<void> {
    console.log('Stopping local LEAP blockchain...')

    const pid = await readPid()

    if (!pid) {
        console.log('No running chain found')
        return
    }

    const running = await isProcessRunning(pid)

    if (!running) {
        console.log('Chain is not running')
        await removePidFile()
        return
    }

    // Try graceful shutdown first
    try {
        process.kill(pid, 'SIGTERM')
        console.log('Sent shutdown signal to nodeos')

        // Wait for process to stop
        let attempts = 0
        while (attempts < 20) {
            const stillRunning = await isProcessRunning(pid)
            if (!stillRunning) {
                break
            }
            await new Promise((resolve) => setTimeout(resolve, 500))
            attempts++
        }

        // Force kill if still running
        if (await isProcessRunning(pid)) {
            console.log('Force stopping nodeos...')
            process.kill(pid, 'SIGKILL')
        }
    } catch (error: any) {
        throw new Error(`Failed to stop chain: ${error.message}`)
    }

    await removePidFile()
    console.log('Local chain stopped successfully')
}

/**
 * Get the status of the local blockchain
 */
export async function getChainStatus(): Promise<ChainStatus> {
    const status: ChainStatus = {
        running: false,
        port: 8888,
        dataDir: getDefaultDataDir(),
    }

    const pid = await readPid()

    if (pid) {
        status.pid = pid
        status.running = await isProcessRunning(pid)
    }

    // Try to get chain info
    if (status.running) {
        try {
            const client = createApiClientForPort(status.port)
            const info = await client.v1.chain.get_info()
            status.headBlock = Number(info.head_block_num)
        } catch (error: any) {
            status.error = 'Could not connect to chain'
        }
    }

    return status
}

/**
 * Display the status of the local blockchain
 */
export async function showChainStatus(): Promise<void> {
    console.log('Checking local chain status...\n')

    const status = await getChainStatus()

    if (status.running) {
        console.log('✅ Local chain is running')
        console.log(`   PID: ${status.pid}`)
        console.log(`   URL: http://127.0.0.1:${status.port}`)
        console.log(`   Data directory: ${status.dataDir}`)

        if (status.headBlock !== undefined) {
            console.log(`   Head block: ${status.headBlock}`)
        }

        if (status.error) {
            console.log(`   ⚠️  ${status.error}`)
        }
    } else {
        console.log('❌ Local chain is not running')
        console.log('\n💡 Start with: wharfkit chain local start')
    }
}

/**
 * Show logs from the local blockchain
 */
export async function showChainLogs(options: {follow: boolean; errors: boolean}): Promise<void> {
    const dataDir = getDefaultDataDir()
    const logFile = path.join(dataDir, 'nodeos-error.log') // Contains all output: info, warnings, errors

    // Check if chain is running
    const status = await getChainStatus()
    if (!status.running) {
        console.log('❌ Local chain is not running')
        console.log('\n💡 Start with: wharfkit chain local start')
        return
    }

    const logType = options.errors ? 'Errors & Warnings' : 'All Logs'
    console.log(`📋 Showing ${logType}`)
    console.log(`Press Ctrl+C to exit\n`)

    try {
        // Check if log file exists
        if (!fs.existsSync(logFile)) {
            console.log(`No log file found at ${logFile}`)
            return
        }

        // Build grep filter if showing only errors
        let command = ''
        if (options.follow) {
            if (options.errors) {
                // Follow with error filtering
                command = `tail -f ${logFile} | grep -E "error|warn|exception"`
            } else {
                // Just follow
                command = `tail -f ${logFile}`
            }
        } else {
            if (options.errors) {
                // Show last 50 lines with error filtering
                command = `tail -n 100 ${logFile} | grep -E "error|warn|exception" | tail -n 50`
            } else {
                // Show last 50 lines
                command = `tail -n 50 ${logFile}`
            }
        }

        // Use spawn to run the command through shell
        const process = spawn('sh', ['-c', command], {
            stdio: 'inherit',
        })

        // Handle process exit
        process.on('exit', (code) => {
            if (code !== 0 && code !== null) {
                console.log(`\nLog viewer exited with code ${code}`)
            }
        })

        process.on('error', (error) => {
            console.error(`Failed to read logs: ${error.message}`)
        })
    } catch (error: any) {
        throw new Error(`Failed to show logs: ${error.message}`)
    }
}

/**
 * Check if a string looks like a private key
 */
function isPrivateKeyString(str: string): boolean {
    return str.startsWith('PVT_') || str.startsWith('5') || /^[A-Za-z0-9]{51}$/.test(str)
}

/**
 * Setup development wallet with default keys and optionally import custom key
 */
async function setupDevWallet(customKey?: string): Promise<void> {
    console.log('Setting up development wallet...')

    const walletName = DEFAULT_KEY_NAME
    const devKeys = getDevKeys()
    const devPrivateKey = PrivateKey.from(devKeys.privateKey)

    try {
        ensureDevelopmentKeyStored(devPrivateKey, walletName, devKeys.publicKey)

        if (customKey) {
            ensureChainKeyStored(customKey)
        }

        const walletPlugin = new WalletPluginPrivateKey(devPrivateKey)
        const renderer = new NonInteractiveConsoleUI()
        renderer.status('WharfKit wallet plugin initialized for local development')
        void walletPlugin

        console.log('Development wallet ready')
    } catch (error: any) {
        console.log(`Warning: Could not setup dev wallet: ${error.message}`)
        console.log('You can manually store the development key with:')
        console.log(`  wharfkit wallet keys add --name ${walletName} ${devKeys.privateKey}`)
    }
}

function ensureDevelopmentKeyStored(
    devPrivateKey: PrivateKey,
    walletName: string,
    devPublicKey: string
): void {
    const walletKeys = listWalletKeys()
    const existingByPublic = walletKeys.find((key) => key.publicKey === devPublicKey)

    if (existingByPublic) {
        if (existingByPublic.name === walletName) {
            console.log('Development key already stored')
        } else {
            console.log(
                `Development key already stored as "${existingByPublic.name}", keeping existing entry`
            )
        }
        return
    }

    const conflictingByName = walletKeys.find((key) => key.name === walletName)
    if (conflictingByName) {
        console.log(
            `Warning: Wallet already contains a key named "${walletName}" with a different public key.`
        )
        console.log('         Skipping automatic import of the development key to avoid conflicts.')
        console.log(
            `         You can remove or rename the existing entry and rerun "wharfkit chain local start".`
        )
        return
    }

    addKeyToWallet(devPrivateKey, walletName)
    console.log(`Stored development key in WharfKit wallet as "${walletName}"`)
}

function ensureChainKeyStored(customKey: string): void {
    if (!isPrivateKeyString(customKey)) {
        console.log(
            `Warning: Provided key "${customKey}" does not appear to be a valid private key format`
        )
        return
    }

    try {
        const customPrivateKey = PrivateKey.from(customKey)
        const customPublicKey = customPrivateKey.toPublic().toString()
        const walletKeys = listWalletKeys()
        const existingEntry = walletKeys.find((key) => key.publicKey === customPublicKey)

        if (existingEntry) {
            console.log(
                `Genesis key already stored in wallet as "${existingEntry.name}" - reusing it`
            )
            return
        }

        // Try to use default name
        const defaultKey = walletKeys.find((key) => key.name === DEFAULT_KEY_NAME)
        if (!defaultKey) {
            addKeyToWallet(customPrivateKey, DEFAULT_KEY_NAME)
            console.log(
                `✅ Automatically imported genesis key into wallet as "${DEFAULT_KEY_NAME}"`
            )
            console.log(`   Public Key: ${customPublicKey}`)
            return
        }

        // If default already exists, warn user
        console.log(
            `Warning: Key "${DEFAULT_KEY_NAME}" already exists. Skipping automatic import of genesis key.`
        )
        console.log('You can manually import it with:')
        console.log(`  wharfkit wallet keys add "${customKey}"`)
    } catch (error: any) {
        console.log(`Warning: Could not import chain key: ${error.message}`)
        console.log('You can manually import it with:')
        console.log(`  wharfkit wallet keys add "${customKey}"`)
    }
}

async function ensureEosioPermissionsMatchChainKey(
    port: number,
    chainPrivateKey: PrivateKey
): Promise<void> {
    try {
        const client = createApiClientForPort(port)
        const [account, info] = await Promise.all([
            client.v1.chain.get_account('eosio'),
            client.v1.chain.get_info(),
        ])
        const targetPublicKey = chainPrivateKey.toPublic()
        const permissions: any[] = account.permissions ?? []
        const ownerPermission = permissions.find((perm) => perm.perm_name === 'owner')
        const activePermission = permissions.find((perm) => perm.perm_name === 'active')

        const ownerMatches = permissionIncludesKey(ownerPermission, targetPublicKey)
        const activeMatches = permissionIncludesKey(activePermission, targetPublicKey)

        if (ownerMatches && activeMatches) {
            console.log('eosio account permissions already match the configured chain key')
            return
        }

        console.log('Aligning eosio account permissions with the configured chain key...')

        const walletPlugin = new WalletPluginPrivateKey(chainPrivateKey)
        walletPlugin.config.requiresChainSelect = false
        walletPlugin.config.requiresPermissionSelect = false
        walletPlugin.config.requiresPermissionEntry = false

        const session = new Session({
            chain: {
                id: String(info.chain_id),
                url: `http://127.0.0.1:${port}`,
            },
            actor: 'eosio',
            permission: 'owner',
            walletPlugin,
            ui: new NonInteractiveConsoleUI(),
        })

        const actions: any[] = []
        if (!ownerMatches) {
            actions.push(buildUpdateAuthAction('owner', targetPublicKey))
        }
        if (!activeMatches) {
            actions.push(buildUpdateAuthAction('active', targetPublicKey))
        }

        if (actions.length === 0) {
            return
        }

        await session.transact(
            {
                actions,
            },
            {
                broadcast: true,
            }
        )

        console.log('Updated eosio account permissions to use the configured chain key')
    } catch (error: any) {
        console.log(
            `Warning: Could not verify or update eosio permissions: ${error?.message ?? error}`
        )
        console.log('You can manually verify with:')
        console.log(
            '  curl -s http://127.0.0.1:8888/v1/chain/get_account -X POST -d \'{"account_name":"eosio"}\''
        )
    }
}

function permissionIncludesKey(permission: any, targetPublicKey: PublicKey): boolean {
    if (!permission || !permission.required_auth) {
        return false
    }

    const targetVariants = new Set<string>([
        targetPublicKey.toString(),
        targetPublicKey.toLegacyString(),
    ])

    return (permission.required_auth.keys ?? []).some((entry: any) => {
        if (!entry?.key) {
            return false
        }

        try {
            const parsedKey = PublicKey.from(entry.key)
            return parsedKey.equals(targetPublicKey)
        } catch {
            return targetVariants.has(entry.key)
        }
    })
}

function buildUpdateAuthAction(permission: 'owner' | 'active', publicKey: PublicKey): any {
    return {
        account: 'eosio',
        name: 'updateauth',
        authorization: [
            {
                actor: 'eosio',
                permission: 'owner',
            },
        ],
        data: {
            account: 'eosio',
            permission,
            parent: permission === 'owner' ? '' : 'owner',
            auth: {
                threshold: 1,
                keys: [
                    {
                        key: publicKey.toString(),
                        weight: 1,
                    },
                ],
                accounts: [],
                waits: [],
            },
        },
    }
}
