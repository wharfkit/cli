import {execSync} from 'child_process'
import {APIClient, FetchProvider} from '@wharfkit/antelope'
import fetch from 'node-fetch'

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
