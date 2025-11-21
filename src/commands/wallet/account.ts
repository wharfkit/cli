/* eslint-disable no-console */
import {APIClient, FetchProvider, KeyType, PrivateKey} from '@wharfkit/antelope'
import {Session} from '@wharfkit/session'
import {WalletPluginPrivateKey} from '@wharfkit/wallet-plugin-privatekey'
import fetch from 'node-fetch'
import {getDevKeys} from '../chain/utils'
import {NonInteractiveConsoleUI} from '../../utils/wharfkit-ui'
import {addKeyToWallet} from './utils'

interface AccountCreateOptions {
    name?: string
    url?: string
}

export async function createAccount(options: AccountCreateOptions): Promise<void> {
    const url = options.url || 'http://127.0.0.1:8888'

    // Generate account name if not provided
    const accountName = options.name || generateRandomAccountName()

    // Validate account name
    if (accountName.length > 12 || accountName.length < 3) {
        console.error('Account name must be between 3 and 12 characters long')
        process.exit(1)
    }

    console.log('Creating account on local chain...')
    console.log(`  Account: ${accountName}`)
    console.log(`  URL: ${url}`)

    try {
        // Generate a new key pair for the account
        const newPrivateKey = PrivateKey.generate(KeyType.K1)
        const newPublicKey = newPrivateKey.toPublic()

        console.log(`  Public Key: ${newPublicKey.toString()}`)

        // Get dev keys for signing the newaccount action
        const devKeys = getDevKeys()
        const devPrivateKey = PrivateKey.from(devKeys.privateKey)

        // Create API client
        const client = new APIClient({
            provider: new FetchProvider(url, {fetch}),
        })

        // Get chain info
        const info = await client.v1.chain.get_info()

        // Check if system contract is deployed (for buyram/delegatebw)
        let hasSystemContract = false
        try {
            const abiResponse = await client.v1.chain.get_abi('eosio')
            if (abiResponse.abi) {
                const actionNames = abiResponse.abi.actions.map((a) => String(a.name))
                hasSystemContract =
                    actionNames.includes('buyrambytes') && actionNames.includes('delegatebw')
            }
        } catch (e) {
            // Ignore error, assume no system contract
        }

        // Create session with dev key
        const walletPlugin = new WalletPluginPrivateKey(devPrivateKey)
        walletPlugin.config.requiresChainSelect = false
        walletPlugin.config.requiresPermissionSelect = false
        walletPlugin.config.requiresPermissionEntry = false

        const session = new Session({
            chain: {
                id: String(info.chain_id),
                url,
            },
            actor: 'eosio',
            permission: 'active',
            walletPlugin,
            ui: new NonInteractiveConsoleUI(),
        })

        const actions: any[] = [
            {
                account: 'eosio',
                name: 'newaccount',
                authorization: [
                    {
                        actor: 'eosio',
                        permission: 'active',
                    },
                ],
                data: {
                    creator: 'eosio',
                    name: accountName,
                    owner: {
                        threshold: 1,
                        keys: [
                            {
                                key: newPublicKey,
                                weight: 1,
                            },
                        ],
                        accounts: [],
                        waits: [],
                    },
                    active: {
                        threshold: 1,
                        keys: [
                            {
                                key: newPublicKey,
                                weight: 1,
                            },
                        ],
                        accounts: [],
                        waits: [],
                    },
                },
            },
        ]

        if (hasSystemContract) {
            actions.push({
                account: 'eosio',
                name: 'buyrambytes',
                authorization: [
                    {
                        actor: 'eosio',
                        permission: 'active',
                    },
                ],
                data: {
                    payer: 'eosio',
                    receiver: accountName,
                    bytes: 8192,
                },
            })
            actions.push({
                account: 'eosio',
                name: 'delegatebw',
                authorization: [
                    {
                        actor: 'eosio',
                        permission: 'active',
                    },
                ],
                data: {
                    from: 'eosio',
                    receiver: accountName,
                    stake_net_quantity: '1.0000 SYS',
                    stake_cpu_quantity: '1.0000 SYS',
                    transfer: false,
                },
            })
        }

        // Create newaccount action
        const result = await session.transact(
            {
                actions,
            },
            {
                broadcast: true,
            }
        )

        console.log('\n✅ Account created successfully!')
        console.log(`Account: ${accountName}`)
        console.log(`Private Key: ${newPrivateKey.toString()}`)
        console.log(`Public Key: ${newPublicKey.toString()}`)
        console.log(`Transaction ID: ${result.resolved?.transaction.id}`)

        // Store the key in wallet with account name
        try {
            addKeyToWallet(newPrivateKey, accountName)
            console.log(`\n🔐 Key stored in wallet as: ${accountName}`)
            console.log(
                'You can now deploy contracts with: wharfkit contract deploy --account ' +
                    accountName
            )
        } catch (error) {
            console.log(
                '\n⚠️  Could not store key in wallet (may already exist): ' +
                    (error as Error).message
            )
        }
    } catch (error) {
        console.error(`\n❌ Failed to create account: ${(error as Error).message}`)
        console.error('\nMake sure the local chain is running: wharfkit chain local start')
        process.exit(1)
    }
}

function generateRandomAccountName(): string {
    // Generate a random 12-character account name using the allowed characters for Antelope accounts
    const characters = 'abcdefghijklmnopqrstuvwxyz12345'
    let result = ''
    for (let i = 0; i < 12; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
}
