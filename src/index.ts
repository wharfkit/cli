import { Command } from 'commander';

import { version } from '../package.json';
import { generateContractFromCommand } from './commands/contract';
import { generateKeysFromCommand } from './commands/keys/index';
import { createAccountFromCommand } from './commands/account/index';

const program = new Command();

program
    .version(version)
    .name('wharfkit')
    .description('Wharf Command Line Utilities');

// 1. Command to generate keys
program
    .command('generate-keys')
    .description('Generate a new set of public and private keys')
    .action(generateKeysFromCommand);

// 2. Command to create an account
program
    .command('create-account')
    .description('Create a new account with an optional public key')
    .option('--chain <chain>', 'The chain to create the account on. Defaults to "jungle4".')
    .option('--account-name <accountName>', 'Account name for the new account. Must end with ".gm". If not provided, a random name is generated.')
    .option('--public-key <publicKey>', 'Public key for the new account. If not provided, keys are generated.')
    .action(createAccountFromCommand);

// 3. Existing command to generate a contract
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
    .action(generateContractFromCommand);

program.parse(process.argv);
