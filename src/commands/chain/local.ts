/* eslint-disable no-console */
import {PrivateKey} from '@wharfkit/antelope'
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
import {addKeyToWallet, listWalletKeys} from '../wallet/utils'
import {NonInteractiveConsoleUI} from '../../utils/wharfkit-ui'

export interface LocalStartOptions {
    port: number
    clean: boolean
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

    // Create config files
    const configFile = path.join(configDir, 'config.ini')
    const genesisFile = path.join(configDir, 'genesis.json')

    // Write config.ini
    const configContent = getConfigIni(options.port)
    await fs.promises.writeFile(configFile, configContent)

    // Write genesis.json if it doesn't exist or if cleaning
    if (options.clean || !fs.existsSync(genesisFile)) {
        const genesisContent = getGenesisJson()
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

    // Setup dev wallet
    await setupDevWallet()

    console.log('\n✅ Local LEAP blockchain is running!')
    console.log(`   URL: http://127.0.0.1:${options.port}`)
    console.log(`   Data directory: ${dataDir}`)
    console.log(`   Config directory: ${configDir}`)
    console.log('\n📝 Development keys:')
    const devKeys = getDevKeys()
    console.log(`   Public: ${devKeys.publicKey}`)
    console.log(`   Private: ${devKeys.privateKey}`)
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
 * Setup development wallet with default keys
 */
async function setupDevWallet(): Promise<void> {
    console.log('Setting up development wallet...')

    const walletName = 'dev'
    const devKeys = getDevKeys()
    const devPrivateKey = PrivateKey.from(devKeys.privateKey)

    try {
        const existingKeys = listWalletKeys()
        const existingEntry = existingKeys.find(
            (key) => key.name === walletName || key.publicKey === devKeys.publicKey
        )

        if (!existingEntry) {
            addKeyToWallet(devPrivateKey, walletName)
            console.log(`Stored development key in WharfKit wallet as "${walletName}"`)
        } else if (existingEntry.name !== walletName) {
            console.log(
                `Development key already stored as "${existingEntry.name}", keeping existing entry`
            )
        } else {
            console.log('Development key already stored')
        }

        const walletPlugin = new WalletPluginPrivateKey(devPrivateKey)
        const renderer = new NonInteractiveConsoleUI()
        renderer.status('WharfKit wallet plugin initialized for local development')
        void walletPlugin

        console.log('Development wallet ready')
    } catch (error: any) {
        console.log(`Warning: Could not setup dev wallet: ${error.message}`)
        console.log('You can manually store the development key with:')
        console.log(
            `  wharfkit wallet keys add --name ${walletName} --private ${devKeys.privateKey}`
        )
    }
}
