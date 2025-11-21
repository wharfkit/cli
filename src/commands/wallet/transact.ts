import {Checksum256, SignedTransaction, Transaction} from '@wharfkit/antelope'
import {APIClient} from '@wharfkit/antelope'
import {FetchProvider} from '@wharfkit/antelope'
import {log} from '../../utils'
import {getKeyFromWallet, listWalletKeys} from './utils'
import * as readline from 'readline'
import * as fs from 'fs'

interface SignOptions {
    key?: string
    password?: boolean
    output?: string
}

interface TransactOptions extends SignOptions {
    broadcast?: boolean
    url?: string
}

/**
 * Prompt for password from stdin
 */
async function promptForPassword(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        })

        // Hide password input
        const stdin = process.stdin
        ;(stdin as any).setRawMode?.(true)

        let password = ''

        process.stdout.write(prompt)

        stdin.on('data', (char) => {
            const charStr = char.toString()

            if (charStr === '\n' || charStr === '\r' || charStr === '\u0004') {
                // Enter or Ctrl+D
                ;(stdin as any).setRawMode?.(false)
                stdin.pause()
                process.stdout.write('\n')
                rl.close()
                resolve(password)
            } else if (charStr === '\u0003') {
                // Ctrl+C
                ;(stdin as any).setRawMode?.(false)
                stdin.pause()
                process.stdout.write('\n')
                rl.close()
                process.exit(0)
            } else if (charStr === '\u007f') {
                // Backspace
                if (password.length > 0) {
                    password = password.slice(0, -1)
                    process.stdout.write('\b \b')
                }
            } else {
                password += charStr
                process.stdout.write('*')
            }
        })
    })
}

/**
 * Get password from user or return undefined
 */
async function getPassword(usePassword: boolean): Promise<string | undefined> {
    if (!usePassword) {
        return undefined
    }

    const password = await promptForPassword('Enter password: ')
    if (!password) {
        throw new Error('Password cannot be empty')
    }

    return password
}

/**
 * Load transaction from JSON file or string
 */
function loadTransaction(transactionJson: string): Transaction {
    let transactionData: any

    try {
        // Try to read as file first
        if (fs.existsSync(transactionJson)) {
            const fileContent = fs.readFileSync(transactionJson, 'utf8')
            transactionData = JSON.parse(fileContent)
        } else {
            // Try to parse as JSON string
            transactionData = JSON.parse(transactionJson)
        }
    } catch (error) {
        throw new Error(
            `Failed to load transaction: ${(error as Error).message}. ` +
                'Provide either a JSON file path or a JSON string.'
        )
    }

    try {
        return Transaction.from(transactionData)
    } catch (error) {
        throw new Error(`Invalid transaction format: ${(error as Error).message}`)
    }
}

/**
 * Select a key from the wallet, optionally using transaction authorization to find a match
 */
function selectKey(keyName?: string, transaction?: Transaction): string {
    const keys = listWalletKeys()

    if (keys.length === 0) {
        throw new Error('No keys found in wallet. Create one with: wharfkit wallet keys create')
    }

    // 1. Use explicit key name if provided
    if (keyName) {
        const key = keys.find((k) => k.name === keyName || k.publicKey === keyName)
        if (!key) {
            throw new Error(`Key "${keyName}" not found in wallet`)
        }
        return key.name
    }

    // 2. Try to match based on transaction authorization
    if (transaction && transaction.actions.length > 0) {
        // Check authorizations of the first action
        // (A more complex logic could check all actions, but usually the first one dictates the primary signer)
        const auths = transaction.actions[0].authorization
        for (const auth of auths) {
            const actorName = String(auth.actor)
            // Check if we have a key for this actor
            const actorKey = keys.find((k) => k.name === actorName)
            if (actorKey) {
                log(`Auto-selected key for actor: ${actorName}`, 'info')
                return actorKey.name
            } else {
                log(
                    `No key found for actor: ${actorName}. Available keys: ${keys
                        .map((k) => k.name)
                        .join(', ')}`,
                    'info'
                )
            }
        }
    }

    // 3. If only one key, use it
    if (keys.length === 1) {
        return keys[0].name
    }

    // 4. If multiple keys and no key specified, use 'default' if it exists
    const defaultKey = keys.find((k) => k.name === 'default')
    if (defaultKey) {
        return defaultKey.name
    }

    // 5. Otherwise, use the first key
    return keys[0].name
}

/**
 * Sign a transaction
 */
export async function signTransaction(
    transactionJson: string,
    options: SignOptions
): Promise<void> {
    try {
        // Load the transaction
        const transaction = loadTransaction(transactionJson)

        log('Transaction loaded:', 'info')
        log(JSON.stringify(transaction, null, 2), 'info')
        log('', 'info')

        // Select the key to use
        const keyName = selectKey(options.key, transaction)
        log(`Using key: ${keyName}`, 'info')

        // Get password if needed
        const password = await getPassword(!!options.password)

        // Load the private key
        const privateKey = getKeyFromWallet(keyName, password)

        // When not broadcasting, use EOS mainnet as default (user can modify transaction before broadcasting)
        const chainId = Checksum256.from(
            transaction.ref_block_num
                ? '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d' // EOS mainnet as default
                : '0000000000000000000000000000000000000000000000000000000000000000'
        )

        // Sign the transaction
        const digest = transaction.signingDigest(chainId)
        const signature = privateKey.signDigest(digest)

        // Create signed transaction
        const signedTransaction = SignedTransaction.from({
            ...transaction,
            signatures: [signature],
        })

        log('✅ Transaction signed successfully!', 'info')
        log('', 'info')

        const output = JSON.stringify(signedTransaction, null, 2)

        if (options.output) {
            // Save to file
            fs.writeFileSync(options.output, output, 'utf8')
            log(`Signed transaction saved to: ${options.output}`, 'info')
        } else {
            // Print to stdout
            log('Signed Transaction:', 'info')
            log(output, 'info')
        }

        log('', 'info')
        log(`Signature: ${signature.toString()}`, 'info')
    } catch (error) {
        log(`❌ Failed to sign transaction: ${(error as Error).message}`, 'info')
        process.exit(1)
    }
}

/**
 * Sign and optionally broadcast a transaction
 */
export async function transactTransaction(
    transactionJson: string,
    options: TransactOptions
): Promise<void> {
    try {
        // Load the transaction
        const transaction = loadTransaction(transactionJson)

        log('Transaction loaded:', 'info')
        log(JSON.stringify(transaction, null, 2), 'info')
        log('', 'info')

        // Select the key to use
        const keyName = selectKey(options.key, transaction)
        log(`Using key: ${keyName}`, 'info')

        // Get password if needed
        const password = await getPassword(!!options.password)

        // Load the private key
        const privateKey = getKeyFromWallet(keyName, password)

        // Get chain ID - fetch from blockchain if broadcasting, otherwise use a default
        let chainId: Checksum256
        if (options.broadcast) {
            const url = options.url || 'http://127.0.0.1:8888'
            const client = new APIClient({
                provider: new FetchProvider(url, {fetch: globalThis.fetch}),
            })
            const info = await client.v1.chain.get_info()
            chainId = Checksum256.from(info.chain_id)
            log(`Chain ID: ${chainId}`, 'info')
        } else {
            // When not broadcasting, use EOS mainnet as default (user can modify transaction before broadcasting)
            chainId = Checksum256.from(
                transaction.ref_block_num
                    ? '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d' // EOS mainnet
                    : '0000000000000000000000000000000000000000000000000000000000000000'
            )
        }

        // Sign the transaction
        const digest = transaction.signingDigest(chainId)
        const signature = privateKey.signDigest(digest)

        // Create signed transaction
        const signedTransaction = SignedTransaction.from({
            ...transaction,
            signatures: [signature],
        })

        log('✅ Transaction signed successfully!', 'info')
        log('', 'info')

        if (options.broadcast) {
            // Broadcast the transaction
            const url = options.url || 'http://127.0.0.1:8888'
            log(`Broadcast target: ${url}`, 'info')

            try {
                // Create API client
                const client = new APIClient({
                    provider: new FetchProvider(url, {fetch: globalThis.fetch}),
                })

                // Push the transaction
                const result = await client.v1.chain.push_transaction(signedTransaction)

                log('🚀 Transaction broadcast successfully!', 'info')
                log(`Transaction ID: ${result.transaction_id}`, 'info')
                log(`Status: ${result.processed.receipt.status}`, 'info')
            } catch (error: any) {
                log(`❌ Failed to broadcast transaction: ${error.message}`, 'info')
                process.exit(1)
            }
        } else {
            // Just output the signed transaction
            const output = JSON.stringify(signedTransaction, null, 2)

            if (options.output) {
                // Save to file
                fs.writeFileSync(options.output, output, 'utf8')
                log(`Signed transaction saved to: ${options.output}`, 'info')
            } else {
                // Print to stdout
                log('Signed Transaction:', 'info')
                log(output, 'info')
            }

            log('', 'info')
            log(`Signature: ${signature.toString()}`, 'info')
        }
    } catch (error) {
        log(`❌ Failed to transact: ${(error as Error).message}`, 'info')
        process.exit(1)
    }
}
