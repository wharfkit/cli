import {Command} from 'commander'
import {createActionRequest} from './request'

/**
 * Create the sign command with subcommands
 */
export function createSignCommand(): Command {
    const signCommand = new Command('sign')
    signCommand.description('Create signing requests (ESR) for blockchain actions')

    // sign request - Create a signing request (ESR) and display QR code
    signCommand
        .command('request')
        .description('Create a signing request (ESR) and display QR code for any action')
        .argument('<contract::action>', 'Contract and action in format "contract::action"')
        .argument('<data>', 'Action data as JSON file, JSON string, or key=value pairs')
        .option(
            '-c, --chain <chain>',
            'Chain name or API URL (e.g., local, Jungle4, EOS, https://...)',
            'local'
        )
        .option(
            '-a, --auth <authorization>',
            'Authorization in format "account@permission" (default: wallet placeholder)'
        )
        .action(async (contractAction, data, options) => {
            await createActionRequest(contractAction, data, options)
        })

    return signCommand
}
