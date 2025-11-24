import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {PrivateKey} from '@wharfkit/antelope'

export const DEFAULT_KEY_NAME = 'default'
// Use default for all eosio account keys
export const EOSIO_KEY_PREFERRED_NAMES = [DEFAULT_KEY_NAME] as const

// Default password for encryption when user doesn't provide one
const DEFAULT_PASSWORD = 'wharfkit-default-encryption-key-do-not-use-in-production'

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 32
const TAG_LENGTH = 16

export interface StoredKey {
    name: string
    publicKey: string
    encryptedPrivateKey: string
    createdAt: string
}

export interface WalletData {
    keys: StoredKey[]
}

/**
 * Get the wallet directory path
 */
export function getWalletDir(): string {
    return path.join(os.homedir(), '.wharfkit', 'wallet')
}

/**
 * Get the wallet file path
 */
export function getWalletFilePath(): string {
    return path.join(getWalletDir(), 'keys.json')
}

/**
 * Ensure wallet directory exists
 */
export function ensureWalletDir(): void {
    const dir = getWalletDir()
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true, mode: 0o700})
    }
}

/**
 * Derive a key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256')
}

/**
 * Encrypt a private key
 */
export function encryptPrivateKey(privateKey: string, password?: string): string {
    const pwd = password || DEFAULT_PASSWORD
    const salt = crypto.randomBytes(SALT_LENGTH)
    const key = deriveKey(pwd, salt)
    const iv = crypto.randomBytes(IV_LENGTH)

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    const encrypted = Buffer.concat([cipher.update(privateKey, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()

    // Combine salt + iv + tag + encrypted data
    const result = Buffer.concat([salt, iv, tag, encrypted])
    return result.toString('base64')
}

/**
 * Decrypt a private key
 */
export function decryptPrivateKey(encryptedData: string, password?: string): string {
    const pwd = password || DEFAULT_PASSWORD
    const buffer = Buffer.from(encryptedData, 'base64')

    // Extract salt, iv, tag, and encrypted data
    const salt = buffer.subarray(0, SALT_LENGTH)
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)

    const key = deriveKey(pwd, salt)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    try {
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
        return decrypted.toString('utf8')
    } catch (error) {
        throw new Error('Failed to decrypt private key. Invalid password.')
    }
}

/**
 * Load wallet data from file
 */
export function loadWalletData(): WalletData {
    const filePath = getWalletFilePath()
    if (!fs.existsSync(filePath)) {
        return {keys: []}
    }

    try {
        const data = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(data) as WalletData
    } catch (error) {
        throw new Error(`Failed to load wallet data: ${(error as Error).message}`)
    }
}

/**
 * Save wallet data to file
 */
export function saveWalletData(data: WalletData): void {
    ensureWalletDir()
    const filePath = getWalletFilePath()

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), {mode: 0o600})
    } catch (error) {
        throw new Error(`Failed to save wallet data: ${(error as Error).message}`)
    }
}

/**
 * Add a key to the wallet
 */
export function addKeyToWallet(privateKey: PrivateKey, name: string, password?: string): StoredKey {
    const walletData = loadWalletData()

    // Check if key already exists
    const publicKey = privateKey.toPublic().toString()
    const existingKey = walletData.keys.find((k) => k.publicKey === publicKey)
    if (existingKey) {
        throw new Error(`Key with public key ${publicKey} already exists as "${existingKey.name}"`)
    }

    // Check if name already exists
    const nameExists = walletData.keys.find((k) => k.name === name)
    if (nameExists) {
        throw new Error(`Key with name "${name}" already exists`)
    }

    // Encrypt and store the key
    const encryptedPrivateKey = encryptPrivateKey(privateKey.toString(), password)
    const storedKey: StoredKey = {
        name,
        publicKey,
        encryptedPrivateKey,
        createdAt: new Date().toISOString(),
    }

    walletData.keys.push(storedKey)
    saveWalletData(walletData)

    return storedKey
}

/**
 * Get a key from the wallet by name or public key
 */
export function getKeyFromWallet(nameOrPublicKey: string, password?: string): PrivateKey {
    const walletData = loadWalletData()

    const storedKey = walletData.keys.find(
        (k) => k.name === nameOrPublicKey || k.publicKey === nameOrPublicKey
    )

    if (!storedKey) {
        throw new Error(`Key "${nameOrPublicKey}" not found in wallet`)
    }

    const decryptedPrivateKey = decryptPrivateKey(storedKey.encryptedPrivateKey, password)
    return PrivateKey.from(decryptedPrivateKey)
}

/**
 * List all keys in the wallet
 */
export function listWalletKeys(): StoredKey[] {
    const walletData = loadWalletData()
    return walletData.keys
}

/**
 * Remove a key from the wallet
 */
export function removeKeyFromWallet(nameOrPublicKey: string): void {
    const walletData = loadWalletData()

    const index = walletData.keys.findIndex(
        (k) => k.name === nameOrPublicKey || k.publicKey === nameOrPublicKey
    )

    if (index === -1) {
        throw new Error(`Key "${nameOrPublicKey}" not found in wallet`)
    }

    walletData.keys.splice(index, 1)
    saveWalletData(walletData)
}

/**
 * Generate a default key name
 */
export function generateDefaultKeyName(): string {
    const walletData = loadWalletData()
    const existingNames = walletData.keys.map((k) => k.name)

    // Try default, key1, key2, etc.
    if (!existingNames.includes('default')) {
        return 'default'
    }

    let i = 1
    while (existingNames.includes(`key${i}`)) {
        i++
    }
    return `key${i}`
}
