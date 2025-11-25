/* eslint-disable no-console */
import {Command} from 'commander'
import {showChainLogs, showChainStatus, startLocalChain, stopLocalChain} from './local'
import {checkLeapInstallation} from './install'
import {addInteractCommands, addInteractSubcommands} from './interact'
import {setDefaultChain} from './utils'

/**
 * Create the chain command with subcommands
 */
export function createChainCommand(): Command {
    const chain = new Command('chain')
    chain.description('Manage local LEAP blockchain')

    // Local subcommand
    const local = chain.command('local').description('Manage local blockchain instance')

    // Add interact commands to local
    addInteractSubcommands(local, 'local')

    // Local start
    local
        .command('start')
        .description('Start a local LEAP blockchain (installs LEAP automatically if needed)')
        .option('-p, --port <port>', 'Port for the HTTP server', '8888')
        .option('-c, --clean', 'Clean blockchain data before starting', false)
        .option(
            '-k, --key <key>',
            'Private key to automatically import into wallet (overrides WHARFKIT_CHAIN_KEY env var)'
        )
        .action(async (options) => {
            try {
                await startLocalChain({
                    port: parseInt(options.port, 10),
                    clean: options.clean,
                    key: options.key,
                })
            } catch (error: any) {
                console.error(`Error: ${error.message}`)
                process.exit(1)
            }
        })

    // Local stop
    local
        .command('stop')
        .description('Stop the local blockchain')
        .action(async () => {
            try {
                await stopLocalChain()
            } catch (error: any) {
                console.error(`Error: ${error.message}`)
                process.exit(1)
            }
        })

    // Local status
    local
        .command('status')
        .description('Check the status of the local blockchain')
        .action(async () => {
            try {
                await showChainStatus()
            } catch (error: any) {
                console.error(`Error: ${error.message}`)
                process.exit(1)
            }
        })

    // Local logs
    local
        .command('logs')
        .description('Show logs from the local blockchain (includes block production)')
        .option('-f, --follow', 'Follow log output in real-time', false)
        .option('-e, --errors', 'Show only errors and warnings', false)
        .action(async (options) => {
            try {
                await showChainLogs({
                    follow: options.follow,
                    errors: options.errors,
                })
            } catch (error: any) {
                console.error(`Error: ${error.message}`)
                process.exit(1)
            }
        })

    // Set default chain
    chain
        .command('set <chainName>')
        .description('Set the default chain for account lookups')
        .action(async (chainName) => {
            try {
                await setDefaultChain(chainName)
                console.log(`Default chain set to: ${chainName}`)
            } catch (error: any) {
                console.error(`Error: ${error.message}`)
                process.exit(1)
            }
        })

    // Check installation
    chain
        .command('check')
        .description('Check LEAP installation status')
        .action(async () => {
            try {
                const status = await checkLeapInstallation()

                console.log('\nLEAP Installation Status:\n')

                if (status.installed) {
                    console.log('✅ LEAP is installed')
                    console.log(`   Version: ${status.version}`)
                    console.log(`   nodeos: ${status.nodeosPath}`)
                    console.log(
                        `   WharfKit console renderer: ${
                            status.wharfkit.consoleRenderer ? 'available' : 'missing'
                        }`
                    )
                    console.log(
                        `   WharfKit wallet plugin: ${
                            status.wharfkit.walletPlugin ? 'available' : 'missing'
                        }`
                    )
                } else {
                    console.log('❌ LEAP is not installed\n')
                    console.log('Missing components:')
                    if (!status.nodeos) console.log('   - nodeos')
                    if (!status.wharfkit.consoleRenderer)
                        console.log('   - WharfKit console renderer')
                    if (!status.wharfkit.walletPlugin)
                        console.log('   - WharfKit private key wallet plugin')
                    console.log('\n💡 Install automatically with: wharfkit chain local start')
                }
            } catch (error: any) {
                console.error(`Error: ${error.message}`)
                process.exit(1)
            }
        })

    // Add dynamic chain commands
    addInteractCommands(chain)

    return chain
}

/**
 * Command handler for the chain command (called from main CLI)
 */
export function chainCommandHandler(): void {
    const chain = createChainCommand()
    chain.parse(process.argv)
}
