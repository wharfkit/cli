// commands/keys.ts

import { KeyType, PrivateKey } from '@wharfkit/antelope'; // Assuming the Antelope library is installed and the path is correct

export async function generateKeysFromCommand() {
    try {
        // Generate a new private key
        const privateKey = PrivateKey.generate(KeyType.K1);

        // Derive the corresponding public key
        const publicKey = privateKey.toPublic();

        // Print the generated keys
        console.log(`Private Key: ${privateKey.toString()}`);
        console.log(`Public Key: ${publicKey.toString()}`);
    } catch (error: unknown) {
        console.error("Failed to generate keys:", (error as { message: string }).message);
    }
}
