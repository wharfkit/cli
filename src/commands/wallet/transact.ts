import {Checksum256, SignedTransaction, Transaction} from '@wharfkit/antelope'
import {log} from '../../utils'
import {getKeyFromWallet, listWalletKeys} from './utils'
import * as readline from 'readline'
import * as fs from 'fs'

interface TransactOptions {
    key?: string
    password?: boolean
    output?: string
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
 * Select a key from the wallet
 */
function selectKey(keyName?: string): string {
    const keys = listWalletKeys()

    if (keys.length === 0) {
        throw new Error('No keys found in wallet. Create one with: wharfkit wallet keys create')
    }

    if (keyName) {
        const key = keys.find((k) => k.name === keyName || k.publicKey === keyName)
        if (!key) {
            throw new Error(`Key "${keyName}" not found in wallet`)
        }
        return key.name
    }

    // If only one key, use it
    if (keys.length === 1) {
        return keys[0].name
    }

    // If multiple keys and no key specified, use 'default' if it exists
    const defaultKey = keys.find((k) => k.name === 'default')
    if (defaultKey) {
        return defaultKey.name
    }

    // Otherwise, use the first key
    return keys[0].name
}

/**
 * Transact a transaction (sign-only for now)
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
        const keyName = selectKey(options.key)
        log(`Using key: ${keyName}`, 'info')

        // Get password if needed
        const password = await getPassword(!!options.password)

        // Load the private key
        const privateKey = getKeyFromWallet(keyName, password)

        // Create chain ID (you might want to make this configurable)
        // For now, we'll use a placeholder. In a real scenario, this should come from
        // the transaction data or be specified by the user
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
            log(`Transaction output saved to: ${options.output}`, 'info')
        } else {
            // Print to stdout
            log('Signed Transaction:', 'info')
            log(output, 'info')
        }

        log('', 'info')
        log(`Signature: ${signature.toString()}`, 'info')
    } catch (error) {
        log(`❌ Failed to process transaction: ${(error as Error).message}`, 'info')
        process.exit(1)
    }
}
