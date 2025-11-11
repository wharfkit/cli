import {KeyType, PrivateKey} from '@wharfkit/antelope'
import {log} from '../../utils'
import {addKeyToWallet, generateDefaultKeyName} from './utils'
import * as readline from 'readline'

interface CreateOptions {
    name?: string
    password?: boolean
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

    const confirm = await promptForPassword('Confirm password: ')
    if (password !== confirm) {
        throw new Error('Passwords do not match')
    }

    return password
}

/**
 * Create a new wallet key
 */
export async function createWalletKey(options: CreateOptions): Promise<void> {
    try {
        // Generate a new private key
        const privateKey = PrivateKey.generate(KeyType.K1)
        const publicKey = privateKey.toPublic()

        // Get password if requested
        const password = await getPassword(!!options.password)

        // Determine key name
        const keyName = options.name || generateDefaultKeyName()

        // Store the key
        addKeyToWallet(privateKey, keyName, password)

        log('✅ Key created successfully!', 'info')
        log(`Name: ${keyName}`, 'info')
        log(`Public Key: ${publicKey.toString()}`, 'info')
        log(`Private Key: ${privateKey.toString()}`, 'info')
        log('', 'info')

        if (!options.password) {
            log(
                '⚠️  Note: Key is encrypted with default password. Use --password flag for custom password.',
                'info'
            )
        } else {
            log('🔒 Key is encrypted with your custom password.', 'info')
        }
    } catch (error) {
        log(`❌ Failed to create key: ${(error as Error).message}`, 'info')
        process.exit(1)
    }
}
