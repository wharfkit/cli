/* eslint-disable no-console */
import {Command} from 'commander'
import {lookupAccount} from './chain/interact'
import {getDefaultChain} from './chain/utils'

/**
 * Create the account command
 */
export function createAccountCommand(): Command {
    const accountCommand = new Command('account')
    accountCommand.description('Account management commands')

    accountCommand
        .command('info')
        .description('Display information about an account')
        .argument('<accountName>', 'Account name to lookup')
        .option('-c, --chain <chainName>', 'Chain to query (default: local or configured default)')
        .option('--json', 'Output as JSON')
        .action(async (accountName, options) => {
            try {
                const chainName = options.chain || (await getDefaultChain())
                await lookupAccount(chainName, accountName, options)
            } catch (error: any) {
                console.error(`Error: ${error.message}`)
                process.exit(1)
            }
        })

    return accountCommand
}
