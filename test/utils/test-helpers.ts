import {execSync} from 'child_process'
import {APIClient, FetchProvider} from '@wharfkit/antelope'
import fetch from 'node-fetch'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

/**
 * Check if nodeos is available in PATH
 */
export function isNodeosAvailable(): boolean {
    try {
        execSync('which nodeos', {encoding: 'utf8', stdio: 'ignore'})
        return true
    } catch {
        return false
    }
}

/**
 * Get CLI path relative to test directory
 */
export function getCliPath(): string {
    return path.join(__dirname, '../../lib/cli.js')
}

/**
 * Get a transaction expiration date 1 hour from now
 */
export function getTransactionExpiration(): string {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return now.toISOString().slice(0, 19) // Remove milliseconds and timezone
}

/**
 * Generate a random local account name (12 chars, no .gm suffix)
 */
export function getRandomLocalAccountName(prefix: string): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz12345'
    let result = prefix
    const remaining = 12 - prefix.length
    for (let i = 0; i < remaining; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

/**
 * E2E test context that is shared across test files
 */
export interface E2ETestContext {
    cliPath: string
    testDir: string
    testWalletDir: string
    originalHome: string
}

/**
 * Setup E2E test environment with temporary directories and running chain
 * Call this in suiteSetup() of your E2E test file
 */
export async function setupE2ETestEnvironment(
    mochaContext: Mocha.Context
): Promise<E2ETestContext | null> {
    mochaContext.timeout(180000)

    // Skip E2E tests if nodeos is not available
    if (!isNodeosAvailable()) {
        // eslint-disable-next-line no-console
        console.log('Skipping E2E tests: nodeos is not available in PATH')
        mochaContext.skip()
        return null
    }

    const cliPath = getCliPath()

    // Create a temporary test directory
    const testDir = path.join(os.tmpdir(), `wharfkit-e2e-test-${Date.now()}`)
    fs.mkdirSync(testDir, {recursive: true})

    // Create a temporary wallet directory for tests
    const testWalletDir = path.join(testDir, '.wharfkit', 'wallet')
    fs.mkdirSync(testWalletDir, {recursive: true})

    // Mock HOME to use test wallet directory
    const originalHome = process.env.HOME || ''
    process.env.HOME = testDir

    // Stop any existing chain before starting
    try {
        execSync(`node ${cliPath} chain local stop`, {encoding: 'utf8', stdio: 'ignore'})
        execSync('sleep 1', {encoding: 'utf8', stdio: 'ignore'})
    } catch {
        // Ignore errors - chain might not be running
    }

    // Also check port 8888 directly
    killProcessAtPort(8888)

    // Start the chain with --clean to ensure fresh state
    execSync(`node ${cliPath} chain local start --clean`, {encoding: 'utf8'})

    // Wait for chain to be ready
    await waitForChainReady('http://127.0.0.1:8888', 30000)

    return {cliPath, testDir, testWalletDir, originalHome}
}

/**
 * Teardown E2E test environment
 * Call this in suiteTeardown() of your E2E test file
 */
export function teardownE2ETestEnvironment(context: E2ETestContext | null): void {
    if (!context) return

    const {cliPath, testDir, originalHome} = context

    // Restore original HOME
    process.env.HOME = originalHome

    // Clean up test directory
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, {recursive: true, force: true})
    }

    try {
        execSync(`node ${cliPath} chain local stop`, {encoding: 'utf8'})
    } catch {
        // Ignore errors if chain wasn't started
    }
}

/**
 * Wait for the chain to be ready by checking the API
 * @param url - Chain API URL (default: http://127.0.0.1:8888)
 * @param timeoutMs - Maximum time to wait in milliseconds (default: 30000)
 * @returns Promise that resolves when chain is ready, rejects on timeout
 */
export async function waitForChainReady(
    url: string = 'http://127.0.0.1:8888',
    timeoutMs: number = 30000
): Promise<void> {
    const client = new APIClient({
        provider: new FetchProvider(url, {fetch}),
    })

    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
        try {
            const info = await client.v1.chain.get_info()
            if (Number(info.head_block_num) >= 0) {
                return
            }
        } catch {
            // Chain not ready yet, continue waiting
        }
        await new Promise((resolve) => setTimeout(resolve, 500))
    }

    throw new Error(`Chain at ${url} did not become ready within ${timeoutMs}ms`)
}

/**
 * Kill any nodeos processes listening on the specified port
 * @param port - The port number to check
 */
export function killProcessAtPort(port: number): void {
    try {
        const pids = execSync(`lsof -ti:${port} -sTCP:LISTEN`, {encoding: 'utf8'})
            .trim()
            .split('\n')
        for (const pid of pids) {
            if (!pid) continue
            const pidNum = parseInt(pid)
            if (isNaN(pidNum) || pidNum === process.pid || pidNum === process.ppid) continue
            try {
                const cmd = execSync(`ps -p ${pidNum} -o command=`, {encoding: 'utf8'}).trim()
                if (cmd.includes('nodeos')) {
                    execSync(`kill -9 ${pidNum}`, {encoding: 'utf8', stdio: 'ignore'})
                }
            } catch {
                // Process might be gone already
            }
        }
        // Give it a moment to fully shut down
        execSync('sleep 0.5', {encoding: 'utf8', stdio: 'ignore'})
    } catch {
        // Port is free or lsof failed
    }
}
