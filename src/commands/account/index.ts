import type {PublicKeyType} from '@wharfkit/antelope'
import {APIClient, KeyType, type NameType, PrivateKey} from '@wharfkit/antelope'
import {type ChainDefinition, type ChainIndices, Chains} from '@wharfkit/common'
import {log} from '../../utils'

interface CommandOptions {
    key?: PublicKeyType
    name?: NameType
    chain?: ChainIndices
}

const supportedChains = ['Jungle4']

export async function createAccountFromCommand(options: CommandOptions) {
    let publicKey
    let privateKey

    if (options.chain && !supportedChains.includes(options.chain)) {
        log(
            `Unsupported chain "${options.chain}". Supported chains are: ${supportedChains.join(
                ', '
            )}`,
            'info'
        )
        return
    }

    const chainIndex: ChainIndices = options.chain || 'Jungle4'
    const chainDefinition: ChainDefinition = Chains[chainIndex]

    // Default to "jungle4" if no chain option is provided
    const chainUrl = `http://${chainIndex.toLowerCase()}.greymass.com`

    if (options.name) {
        if (!String(options.name).endsWith('.gm')) {
            log('Account name must end with ".gm"', 'info')
            return
        }

        if (options.name && (String(options.name).length > 12 || String(options.name).length < 3)) {
            log('Account name must be between 3 and 12 characters long', 'info')
            return
        }

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
    const accountName = options.name || generateRandomAccountName()

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

        // Prepare the data for the POST request
        const data = {
            accountName: accountName,
            activeKey: publicKey,
            ownerKey: publicKey,
            network: chainDefinition.id,
        }

        // Make the POST request to create the account
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
                // Only print the private key if it was generated
                log(`Private Key: ${privateKey.toString()}`, 'info')
            }
            log(`Public Key: ${publicKey}`, 'info')
        } else {
            const responseData = await response.json()
            log(`Failed to create account: ${responseData.message || responseData.reason}`, 'info')
        }
    } catch (error: unknown) {
        log(`Error during account creation: ${(error as {message: string}).message}`, 'info')
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

async function checkAccountNameExists(accountName: NameType, chainUrl: string): Promise<boolean> {
    const client = new APIClient({url: chainUrl})

    try {
        const account = await client.v1.chain.get_account(accountName)

        return !!account?.account_name
    } catch (error: unknown) {
        const errorMessage = (error as {message: string}).message

        if (errorMessage.includes('Account not found')) {
            return false
        }

        throw Error(`Error checking if account name exists: ${errorMessage}`)
    }
}
