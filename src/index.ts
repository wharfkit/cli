import {Command} from 'commander'

import {version} from '../package.json'
import {generateContractFromCommand} from './commands/contract'

const program = new Command()

program.version(version).name('wharfkit').description('Wharf Command Line Utilities')

program
    .command('generate')
    .description('Generate Contract Kit code for the named smart contract')
    .argument('<account>', 'The account name of the contract (e.g. "eosio.token")')
    .option('-f, --file [filename]', 'The path where the generated file will be saved')
    .option('-j, --json [json]', 'The path to a JSON file containing the contract ABI')
    .requiredOption(
        '-u, --url <url>',
        'The URL of the API to connect with (e.g. "https://jungle4.greymass.com")',
        process.env.WHARFKIT_URL
    )
    .action(generateContractFromCommand)

program.parse()
