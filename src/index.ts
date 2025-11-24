import {Command} from 'commander'

import {version} from '../package.json'
import {createContractCommand, generateContractFromCommand} from './commands/contract'
import {generateKeysFromCommand} from './commands/keys/index'
import {createChainCommand} from './commands/chain/index'
import {createCompileCommand} from './commands/compile'
import {createDevCommand} from './commands/dev'
import {createWalletCommand} from './commands/wallet/index'

const program = new Command()

program.version(version).name('wharfkit').description('Wharf Command Line Utilities')

// 1. Command to generate keys
program
    .command('keys')
    .description('Generate a new set of public and private keys')
    .action(generateKeysFromCommand)

// 2. Existing command to generate a contract
program
    .command('generate')
    .description('Generate Contract Kit code for the named smart contract')
    .argument('[account]', 'The account name of the contract (e.g. "eosio.token")')
    .option('-f, --file [filename]', 'The path where the generated file will be saved')
    .option('-j, --json [json]', 'The path to a JSON file containing the contract ABI')
    .option('-e, --eslintrc [eslintrc]', 'The eslintrc file to use')
    .option(
        '-u, --url <url>',
        'The URL of the API to connect with (e.g. "https://jungle4.greymass.com")',
        process.env.WHARFKIT_URL
    )
    .action(generateContractFromCommand)

// 3. Command to manage local blockchain
program.addCommand(createChainCommand())

// 4. Command to compile contracts
program.addCommand(createCompileCommand())

// 5. Command to manage contracts (deploy, etc)
program.addCommand(createContractCommand())

// 6. Command for development mode
program.addCommand(createDevCommand())

// 7. Command to manage wallet (includes account creation)
program.addCommand(createWalletCommand())

program.parse(process.argv)
