/* eslint-disable no-console */
import {APIClient, FetchProvider} from '@wharfkit/antelope'
import {exec} from 'child_process'
import fetch from 'node-fetch'
import {promisify} from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const execAsync = promisify(exec)

export interface ChainConfig {
    port: number
    dataDir: string
    configDir: string
    walletDir: string
    nodeosPid?: number
}

export interface ChainStatus {
    running: boolean
    pid?: number
    port: number
    dataDir: string
    headBlock?: number
    error?: string
}

/**
 * Get the default data directory for the local chain
 */
export function getDefaultDataDir(): string {
    return path.join(os.homedir(), '.wharfkit', 'chain')
}

/**
 * Get the default config directory for the local chain
 */
export function getDefaultConfigDir(): string {
    return path.join(os.homedir(), '.wharfkit', 'config')
}

/**
 * Get the default wallet directory
 */
export function getDefaultWalletDir(): string {
    return path.join(os.homedir(), '.wharfkit', 'wallet')
}

/**
 * Ensure directory exists, create if it doesn't
 */
export async function ensureDir(dir: string): Promise<void> {
    try {
        await fs.promises.access(dir)
    } catch {
        await fs.promises.mkdir(dir, {recursive: true})
    }
}

/**
 * Execute a command and return the result
 */
export async function executeCommand(command: string): Promise<{stdout: string; stderr: string}> {
    try {
        return await execAsync(command)
    } catch (error: any) {
        throw new Error(`Command failed: ${error.message}`)
    }
}

/**
 * Check if a process is running
 */
export async function isProcessRunning(pid: number): Promise<boolean> {
    try {
        process.kill(pid, 0)
        return true
    } catch {
        return false
    }
}

/**
 * Get the PID file path
 */
export function getPidFilePath(): string {
    return path.join(getDefaultDataDir(), 'nodeos.pid')
}

/**
 * Save PID to file
 */
export async function savePid(pid: number): Promise<void> {
    const pidFile = getPidFilePath()
    await ensureDir(path.dirname(pidFile))
    await fs.promises.writeFile(pidFile, pid.toString())
}

/**
 * Read PID from file
 */
export async function readPid(): Promise<number | null> {
    const pidFile = getPidFilePath()
    try {
        const content = await fs.promises.readFile(pidFile, 'utf-8')
        return parseInt(content.trim(), 10)
    } catch {
        return null
    }
}

/**
 * Remove PID file
 */
export async function removePidFile(): Promise<void> {
    const pidFile = getPidFilePath()
    try {
        await fs.promises.unlink(pidFile)
    } catch {
        // Ignore errors if file doesn't exist
    }
}

/**
 * Check if port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
    try {
        // Only check for LISTENING processes, not client connections
        const {stdout} = await execAsync(`lsof -ti:${port} -sTCP:LISTEN || echo "free"`)
        return stdout.includes('free')
    } catch {
        return true
    }
}

/**
 * Get platform information
 */
export function getPlatform(): {os: string; arch: string} {
    return {
        os: os.platform(),
        arch: os.arch(),
    }
}

/**
 * Clean blockchain data directory
 */
export async function cleanDataDir(dataDir: string): Promise<void> {
    try {
        // Remove blocks and state directories
        const blocksDir = path.join(dataDir, 'blocks')
        const stateDir = path.join(dataDir, 'state')

        if (fs.existsSync(blocksDir)) {
            await fs.promises.rm(blocksDir, {recursive: true, force: true})
        }
        if (fs.existsSync(stateDir)) {
            await fs.promises.rm(stateDir, {recursive: true, force: true})
        }

        console.log('Blockchain data cleaned successfully')
    } catch (error: any) {
        throw new Error(`Failed to clean data directory: ${error.message}`)
    }
}

/**
 * Get default development keys
 */
export function getDevKeys(): {publicKey: string; privateKey: string} {
    return {
        publicKey: 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV',
        privateKey: '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3',
    }
}

/**
 * Create default genesis.json
 */
export function getGenesisJson(publicKey?: string): string {
    const devKeys = getDevKeys()
    const initialKey = publicKey || devKeys.publicKey
    // Use a fixed timestamp for deterministic blockchain
    const timestamp = '2018-12-05T08:55:00.000'
    return JSON.stringify(
        {
            initial_timestamp: timestamp,
            initial_key: initialKey,
            initial_configuration: {
                max_block_net_usage: 1048576,
                target_block_net_usage_pct: 1000,
                max_transaction_net_usage: 524288,
                base_per_transaction_net_usage: 12,
                net_usage_leeway: 500,
                context_free_discount_net_usage_num: 20,
                context_free_discount_net_usage_den: 100,
                max_block_cpu_usage: 200000,
                target_block_cpu_usage_pct: 1000,
                max_transaction_cpu_usage: 150000,
                min_transaction_cpu_usage: 100,
                max_transaction_lifetime: 3600,
                deferred_trx_expiration_window: 600,
                max_transaction_delay: 3888000,
                max_inline_action_size: 4096,
                max_inline_action_depth: 4,
                max_authority_depth: 6,
            },
        },
        null,
        2
    )
}

/**
 * Create default config.ini
 */
export function getConfigIni(port: number, publicKey?: string, privateKey?: string): string {
    const devKeys = getDevKeys()
    const producerPublicKey = publicKey || devKeys.publicKey
    const producerPrivateKey = privateKey || devKeys.privateKey
    return `# Plugins
plugin = eosio::chain_api_plugin
plugin = eosio::chain_plugin
plugin = eosio::http_plugin
plugin = eosio::producer_plugin
plugin = eosio::producer_api_plugin

# HTTP settings
http-server-address = 0.0.0.0:${port}
access-control-allow-origin = *
access-control-allow-headers = *
http-validate-host = false
verbose-http-errors = true

# Chain settings
chain-state-db-size-mb = 1024
contracts-console = true
abi-serializer-max-time-ms = 2000

# Resource monitoring - relaxed for local development
chain-state-db-guard-size-mb = 128
chain-threads = 2
resource-monitor-not-shutdown-on-threshold-exceeded = true

# Producer settings
producer-name = eosio
signature-provider = ${producerPublicKey}=KEY:${producerPrivateKey}
enable-stale-production = true
pause-on-startup = false
`
}

/**
 * Wait for chain to be ready
 */
export async function waitForChain(port: number, timeoutMs: number = 10000): Promise<boolean> {
    const startTime = Date.now()
    const client = createApiClientForPort(port)

    while (Date.now() - startTime < timeoutMs) {
        try {
            const info = await client.v1.chain.get_info()
            if (Number(info.head_block_num) >= 0) {
                return true
            }
        } catch {
            // Chain not ready yet
        }
        await new Promise((resolve) => setTimeout(resolve, 500))
    }

    return false
}

export function createApiClientForPort(port: number): APIClient {
    const url = `http://127.0.0.1:${port}`
    const provider = new FetchProvider(url, {fetch})
    return new APIClient({provider})
}

/**
 * Get the config file path for storing default chain preference
 */
export function getConfigFilePath(): string {
    return path.join(getDefaultConfigDir(), 'default-chain.json')
}

/**
 * Get the default chain name (defaults to 'local')
 */
export async function getDefaultChain(): Promise<string> {
    const configFile = getConfigFilePath()
    try {
        const content = await fs.promises.readFile(configFile, 'utf-8')
        const config = JSON.parse(content)
        return config.chain || 'local'
    } catch {
        return 'local'
    }
}

/**
 * Set the default chain name
 */
export async function setDefaultChain(chainName: string): Promise<void> {
    const configFile = getConfigFilePath()
    await ensureDir(path.dirname(configFile))
    const config = {chain: chainName}
    await fs.promises.writeFile(configFile, JSON.stringify(config, null, 2))
}
