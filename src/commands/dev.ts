/* eslint-disable no-console */
import {Command} from 'commander'
import {watch} from 'fs'
import {extname} from 'path'
import {compileContract} from './compile'
import {deployContract} from './contract/deploy'
import {getChainStatus, startLocalChain, stopLocalChain} from './chain/local'

interface DevOptions {
    account?: string
    port?: number
    clean?: boolean
    key?: string
}

let isCompiling = false
const compileQueue: Set<string> = new Set()
let debounceTimer: NodeJS.Timeout | null = null

/**
 * Start development mode: local chain + auto-compile + auto-deploy
 * @param options - Development options
 */
export async function startDevMode(options: DevOptions): Promise<void> {
    const port = options.port || 8888
    const url = `http://127.0.0.1:${port}`

    console.log('🚀 Starting Wharf development mode...\n')

    // Check if chain is already running
    const status = await getChainStatus()

    if (!status.running) {
        console.log('📦 Starting local blockchain...')
        try {
            await startLocalChain({
                port,
                clean: options.clean || false,
                key: options.key,
            })
            console.log('✅ Local blockchain started\n')

            // Wait a bit for the chain to be fully ready
            await new Promise((resolve) => setTimeout(resolve, 2000))
        } catch (error) {
            console.error(`Failed to start local chain: ${(error as Error).message}`)
            process.exit(1)
        }
    } else {
        console.log('✅ Local blockchain already running\n')
    }

    // Do initial compile and deploy
    console.log('🔨 Initial compilation and deployment...\n')
    try {
        await compileContract(undefined, '.')
        await deployContract(undefined, {account: options.account, url})
        console.log('\n✅ Initial deployment complete\n')
    } catch (error) {
        console.error(`Warning: Initial deployment failed: ${(error as Error).message}`)
        console.log('Will retry on file changes...\n')
    }

    // Start watching for file changes
    console.log('👀 Watching for file changes...')
    console.log('   Press Ctrl+C to stop\n')

    await watchFiles(options.account, url)
}

/**
 * Watch for file changes and trigger recompile/redeploy
 */
async function watchFiles(account: string | undefined, url: string): Promise<void> {
    const currentDir = process.cwd()
    watch(currentDir, {recursive: true}, (eventType, filename) => {
        if (!filename) return

        // Only watch .cpp and .hpp files
        const ext = extname(filename)
        if (ext !== '.cpp' && ext !== '.hpp' && ext !== '.h') return

        // Ignore hidden files and node_modules
        if (filename.startsWith('.') || filename.includes('node_modules')) return

        console.log(`\n📝 File changed: ${filename}`)

        // Add to compile queue
        compileQueue.add(filename)

        // Debounce: wait for 500ms of inactivity before compiling
        if (debounceTimer) {
            clearTimeout(debounceTimer)
        }

        debounceTimer = setTimeout(async () => {
            await handleFileChange(account, url)
        }, 500)
    })

    // Keep the process running
    await new Promise(() => {
        // This promise never resolves, keeping the watcher active
    })
}

/**
 * Handle file changes: compile and deploy
 */
async function handleFileChange(account: string | undefined, url: string): Promise<void> {
    if (isCompiling) {
        console.log('⏳ Compilation already in progress, queuing...')
        return
    }

    isCompiling = true
    compileQueue.clear()

    try {
        console.log('\n🔨 Compiling...')
        await compileContract(undefined, '.')

        console.log('\n🚀 Deploying...')
        await deployContract(undefined, {account, url})

        console.log('\n✅ Deploy complete!')
    } catch (error) {
        console.error(`\n❌ Error: ${(error as Error).message}`)
    } finally {
        isCompiling = false
        console.log('\n👀 Watching for changes...')
    }
}

/**
 * Stop development mode (cleanup)
 */
export async function stopDevMode(): Promise<void> {
    console.log('\n\n🛑 Stopping development mode...')

    // Stop the local chain
    try {
        await stopLocalChain()
        console.log('✅ Local blockchain stopped')
    } catch (error) {
        console.log('Note: Could not stop local chain (may not be running)')
    }

    process.exit(0)
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
    await stopDevMode()
})

process.on('SIGTERM', async () => {
    await stopDevMode()
})

/**
 * Create the dev command
 */
export function createDevCommand(): Command {
    const dev = new Command('dev')
    dev.description(
        'Start local chain and watch for changes (auto-compile and auto-deploy on file changes)'
    )
        .option('-a, --account <name>', 'Contract account name (default: derived from filename)')
        .option('-p, --port <port>', 'Port for local blockchain', '8888')
        .option('-c, --clean', 'Start with a clean blockchain state')
        .option(
            '-k, --key <key>',
            'Private key to automatically import into wallet (overrides WHARFKIT_CHAIN_KEY env var)'
        )
        .action(async (options) => {
            try {
                await startDevMode({
                    account: options.account,
                    port: parseInt(options.port),
                    clean: options.clean,
                    key: options.key,
                })
            } catch (error: any) {
                console.error(`Error: ${error.message}`)
                process.exit(1)
            }
        })

    return dev
}
