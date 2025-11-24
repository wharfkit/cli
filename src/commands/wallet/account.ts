import '../../types/wharfkit-session'
import type {PublicKeyType} from '@wharfkit/antelope'
import {
    APIClient,
    FetchProvider,
    KeyType,
    type NameType,
    PrivateKey,
    PublicKey,
} from '@wharfkit/antelope'
import {type ChainDefinition, type ChainIndices, Chains} from '@wharfkit/common'
import {Session} from '@wharfkit/session'
import {WalletPluginPrivateKey} from '@wharfkit/wallet-plugin-privatekey'
import fetch from 'node-fetch'
import {getDevKeys} from '../chain/utils'
import {NonInteractiveConsoleUI} from '../../utils/wharfkit-ui'
import {
    addKeyToWallet,
    DEFAULT_KEY_NAME,
    EOSIO_KEY_PREFERRED_NAMES,
    getKeyFromWallet,
    listWalletKeys,
    type StoredKey,
} from './utils'
import {log, makeClient} from '../../utils'

interface AccountCreateOptions {
    key?: PublicKeyType | string
    name?: NameType | string
    chain?: ChainIndices | string
    url?: string
}

const supportedChains = ['Jungle4', 'KylinTestnet']

export async function createAccount(options: AccountCreateOptions): Promise<void> {
    let publicKey
    let privateKey

    // Determine chain URL
    let chainUrl: string
    let chainDefinition: ChainDefinition | undefined
    let isLocalChain = false

    if (options.url) {
        // Use provided URL (could be local or remote)
        chainUrl = options.url
        isLocalChain = chainUrl.includes('127.0.0.1') || chainUrl.includes('localhost')
    } else {
        // Convert chain option to ChainIndices format (PascalCase)
        let chainIndex: ChainIndices = 'Jungle4'
        if (options.chain) {
            const chainStr = String(options.chain)
            // Try exact match first (handles PascalCase like "KylinTestnet")
            if (supportedChains.includes(chainStr)) {
                chainIndex = chainStr as ChainIndices
            } else {
                // Convert to PascalCase (e.g., "jungle4" -> "Jungle4", "kylintestnet" -> "Kylintestnet")
                const pascalCaseChain =
                    chainStr.charAt(0).toUpperCase() + chainStr.slice(1).toLowerCase()
                if (supportedChains.includes(pascalCaseChain)) {
                    chainIndex = pascalCaseChain as ChainIndices
                } else {
                    log(
                        `Unsupported chain "${
                            options.chain
                        }". Supported chains are: ${supportedChains.join(', ')}`,
                        'info'
                    )
                    return
                }
            }
        }

        chainDefinition = Chains[chainIndex]
        chainUrl = chainDefinition
            ? chainDefinition.url
            : `http://${chainIndex.toLowerCase()}.greymass.com`
    }

    // For local chains, don't require .gm suffix
    if (options.name && !isLocalChain) {
        if (!String(options.name).endsWith('.gm')) {
            log('Account name must end with ".gm"', 'info')
            return
        }
    }

    if (options.name && (String(options.name).length > 12 || String(options.name).length < 3)) {
        log('Account name must be between 3 and 12 characters long', 'info')
        return
    }

    if (options.name && !isLocalChain) {
        const accountNameExists =
            options.name && (await checkAccountNameExists(options.name, chainUrl))

        if (accountNameExists) {
            log(
                `Account name "${options.name}" is already taken. Please choose another name.`,
                'info'
            )
            return
        }
    }

    // Generate a random account name if not provided
    const accountName =
        options.name ||
        (isLocalChain ? generateRandomLocalAccountName() : generateRandomAccountName())

    try {
        // Check if a public key is provided in the options
        if (options.key) {
            publicKey = String(options.key)
        } else {
            // Generate a new private key if none is provided
            privateKey = PrivateKey.generate(KeyType.K1)
            // Derive the corresponding public key
            publicKey = String(privateKey.toPublic())
        }

        if (isLocalChain) {
            // Use Session Kit for local chain
            await createAccountOnLocalChain(String(accountName), publicKey, privateKey, chainUrl)
        } else {
            // Use POST endpoint for remote chains
            const data = {
                accountName: accountName,
                activeKey: publicKey,
                ownerKey: publicKey,
                network: chainDefinition?.id || 'eos',
            }

            const response = await fetch(`${chainUrl}/account/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            if (response.status === 201) {
                log('Account created successfully!', 'info')
                log(`Account Name: ${accountName}`, 'info')
                if (privateKey) {
                    log(`Private Key: ${privateKey.toString()}`, 'info')
                }
                log(`Public Key: ${publicKey}`, 'info')
            } else {
                const responseData = await response.json()
                log(
                    `Failed to create account: ${responseData.message || responseData.reason}`,
                    'info'
                )
            }
        }
    } catch (error: unknown) {
        log(`Error during account creation: ${(error as {message: string}).message}`, 'info')
    }
}

async function createAccountOnLocalChain(
    accountName: string,
    publicKey: string,
    privateKey: PrivateKey | undefined,
    chainUrl: string
): Promise<void> {
    // Parse the public key string into a PublicKey object
    // If we have a private key, derive from it; otherwise use the provided public key string
    const newPublicKey = privateKey ? privateKey.toPublic() : PublicKey.from(publicKey)

    // Try to get eosio account key from wallet (default or hardcoded)
    // This ensures we use the correct key that matches the chain's eosio account permission
    let eosioPrivateKey: PrivateKey
    const walletKeys = listWalletKeys()
    const devKeys = getDevKeys()

    // Try to find the default key
    const preferredKeyName = resolveEosioWalletKeyName(walletKeys)
    const defaultKey = walletKeys.find((k) => k.name === DEFAULT_KEY_NAME)

    if (preferredKeyName) {
        eosioPrivateKey = getKeyFromWallet(preferredKeyName)
    } else if (defaultKey) {
        eosioPrivateKey = getKeyFromWallet(DEFAULT_KEY_NAME)
    } else {
        // Fall back to hardcoded dev keys (for backward compatibility)
        eosioPrivateKey = PrivateKey.from(devKeys.privateKey)
    }

    // Create API client
    const client = new APIClient({
        provider: new FetchProvider(chainUrl, {fetch}),
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

    // Create session with eosio account key
    const walletPlugin = new WalletPluginPrivateKey(eosioPrivateKey)
    walletPlugin.config.requiresChainSelect = false
    walletPlugin.config.requiresPermissionSelect = false
    walletPlugin.config.requiresPermissionEntry = false

    const session = new Session({
        chain: {
            id: String(info.chain_id),
            url: chainUrl,
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

    log('Account created successfully!', 'info')
    log(`Account Name: ${accountName}`, 'info')
    if (privateKey) {
        log(`Private Key: ${privateKey.toString()}`, 'info')
    }
    log(`Public Key: ${publicKey}`, 'info')
    log(`Transaction ID: ${result.resolved?.transaction.id}`, 'info')

    // Store the key in wallet with account name (only if we have a private key)
    if (privateKey) {
        try {
            addKeyToWallet(privateKey, accountName)
            log(`Key stored in wallet as: ${accountName}`, 'info')
        } catch (error) {
            log(
                `Could not store key in wallet (may already exist): ${(error as Error).message}`,
                'info'
            )
        }
    } else {
        log('Note: No private key available to store in wallet (public key was provided)', 'info')
    }
}

function generateRandomAccountName(): string {
    // Generate a random 12-character account name using the allowed characters for Antelope accounts
    const characters = 'abcdefghijklmnopqrstuvwxyz12345'
    let result = ''
    for (let i = 0; i < 9; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return `${result}.gm`
}

function generateRandomLocalAccountName(): string {
    // Generate a random 12-character account name for local chains (no .gm suffix required)
    const characters = 'abcdefghijklmnopqrstuvwxyz12345'
    let result = ''
    for (let i = 0; i < 12; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
}

function resolveEosioWalletKeyName(walletKeys: StoredKey[]): string | undefined {
    for (const preferredName of EOSIO_KEY_PREFERRED_NAMES) {
        if (walletKeys.some((key) => key.name === preferredName)) {
            return preferredName
        }
    }
    return undefined
}

async function checkAccountNameExists(accountName: NameType, chainUrl: string): Promise<boolean> {
    const client = makeClient(chainUrl)

    try {
        const account = await client.v1.chain.get_account(accountName)
        return !!account?.account_name
    } catch (error: unknown) {
        const errorMessage = (error as {message: string}).message
        if (
            errorMessage.includes('Account not found') ||
            errorMessage.includes('Account Query Exception')
        ) {
            return false
        }
        throw Error(`Error checking if account name exists: ${errorMessage}`)
    }
}
