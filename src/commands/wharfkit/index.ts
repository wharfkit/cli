/* eslint-disable no-console */
import {Command} from 'commander'
import {compileContract} from './compile'

/**
 * Create the wharfkit command with subcommands
 */
export function createWharfkitCommand(): Command {
    const wharfkit = new Command('wharfkit')
    wharfkit.description('Wharf development utilities')

    // Compile subcommand
    wharfkit
        .command('compile [file]')
        .description('Compile C++ contract files (single file or all .cpp files in current directory)')
        .option('-o, --output <directory>', 'Output directory for compiled WASM files', '.')
        .action(async (file, options) => {
            try {
                await compileContract(file, options.output)
            } catch (error: any) {
                console.error(`Error: ${error.message}`)
                process.exit(1)
            }
        })

    return wharfkit
}

/**
 * Command handler for the wharfkit command (called from main CLI)
 */
export function wharfkitCommandHandler(): void {
    const wharfkit = createWharfkitCommand()
    wharfkit.parse(process.argv)
}

