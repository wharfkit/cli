import {Command} from 'commander'
import {createAccount} from './account'
import {createWalletKey} from './create'
import {createKey, listKeys} from './keys'
import {signTransaction} from './sign'

/**
 * Create the wallet command with subcommands
 */
export function createWalletCommand(): Command {
    const walletCommand = new Command('wallet')
    walletCommand.description('Manage local wallet and sign transactions')

    // wallet create - Create a new wallet key
    walletCommand
        .command('create')
        .description('Create a new wallet key')
        .option('-n, --name <name>', 'Name for the key (default: auto-generated)')
        .option('-p, --password', 'Prompt for a password to encrypt the key')
        .action(async (options) => {
            await createWalletKey(options)
        })

    // wallet keys - Manage keys
    const keysCommand = new Command('keys')
    keysCommand.description('Manage wallet keys')

    // wallet keys (no subcommand) - List all keys
    keysCommand.action(() => {
        listKeys()
    })

    // wallet keys create - Create a new key
    keysCommand
        .command('create')
        .description('Create a new key in the wallet')
        .option('-n, --name <name>', 'Name for the key (default: auto-generated)')
        .option('-p, --password', 'Prompt for a password to encrypt the key')
        .action(async (options) => {
            await createKey(options)
        })

    walletCommand.addCommand(keysCommand)

    // wallet account - Manage accounts
    const accountCommand = new Command('account')
    accountCommand.description('Manage blockchain accounts')

    // wallet account create - Create a new account
    accountCommand
        .command('create')
        .description('Create a new account on the blockchain')
        .option('-n, --name <name>', 'Account name (default: auto-generated)')
        .option('-u, --url <url>', 'Blockchain API URL (default: http://127.0.0.1:8888)')
        .action(async (options) => {
            await createAccount(options)
        })

    walletCommand.addCommand(accountCommand)

    // wallet sign - Sign a transaction
    walletCommand
        .command('sign')
        .description('Sign a transaction with a key from the wallet')
        .argument('<transaction>', 'Transaction JSON string or path to JSON file')
        .option('-k, --key <name>', 'Name or public key of the key to use for signing')
        .option('-p, --password', 'Prompt for password if key is encrypted with custom password')
        .option('-o, --output <file>', 'Output file path for signed transaction (default: stdout)')
        .action(async (transaction, options) => {
            await signTransaction(transaction, options)
        })

    return walletCommand
}
