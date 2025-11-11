/* eslint-disable no-console */
import {Command} from 'commander'
import {compileContract} from './compile'
import {deployContract} from './deploy'
import {startDevMode} from './dev'

/**
 * Create the compile command
 */
export function createCompileCommand(): Command {
    const compile = new Command('compile')
    compile
        .description(
            'Compile C++ contract files (single file or all .cpp files in current directory)'
        )
        .argument('[file]', 'Optional file to compile (compiles all .cpp files if not specified)')
        .option('-o, --output <directory>', 'Output directory for compiled WASM files', '.')
        .action(async (file, options) => {
            try {
                await compileContract(file, options.output)
            } catch (error: any) {
                console.error(`Error: ${error.message}`)
                process.exit(1)
            }
        })

    return compile
}

/**
 * Create the deploy command
 */
export function createDeployCommand(): Command {
    const deploy = new Command('deploy')
    deploy
        .description('Deploy a compiled contract to the blockchain')
        .argument('[wasm]', 'WASM file to deploy (auto-detects if not specified)')
        .option('-a, --account <name>', 'Contract account name (default: derived from filename)')
        .option('-u, --url <url>', 'Blockchain API URL (default: http://127.0.0.1:8888)')
        .action(async (wasm, options) => {
            try {
                await deployContract(wasm, options)
            } catch (error: any) {
                console.error(`Error: ${error.message}`)
                process.exit(1)
            }
        })

    return deploy
}

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
        .action(async (options) => {
            try {
                await startDevMode({
                    account: options.account,
                    port: parseInt(options.port),
                    clean: options.clean,
                })
            } catch (error: any) {
                console.error(`Error: ${error.message}`)
                process.exit(1)
            }
        })

    return dev
}
