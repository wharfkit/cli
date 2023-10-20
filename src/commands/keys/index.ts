// commands/keys.ts

import {KeyType, PrivateKey} from '@wharfkit/antelope' // Assuming the Antelope library is installed and the path is correct
import {log} from '../../utils'

export async function generateKeysFromCommand() {
    try {
        // Generate a new private key
        const privateKey = PrivateKey.generate(KeyType.K1)

        // Derive the corresponding public key
        const publicKey = privateKey.toPublic()

        // Print the generated keys
        log(`Private Key: ${privateKey.toString()}`, 'info')
        log(`Public Key: ${publicKey.toString()}`, 'info')
    } catch (error: unknown) {
        log(`Failed to generate keys: ${(error as {message: string}).message}`, 'info')
    }
}
