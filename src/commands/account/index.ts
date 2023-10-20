import { PrivateKey, KeyType } from '@wharfkit/antelope';
import { Chains, type ChainIndices } from '@wharfkit/common';


interface CommandOptions {
    publicKey?: string;
    accountName?: string;
    chain?: ChainIndices;
}

export async function createAccountFromCommand(options: CommandOptions) {
    let publicKey;
    let privateKey;

    // Generate a random account name if not provided
    const accountName = options.accountName || generateRandomAccountName();

    if (!accountName.endsWith('.gm')) {
        console.error('Account name must end with ".gm"');
        return;
    }

    // Default to "jungle4" if no chain option is provided
    const chainUrl = `http://${options.chain?.toLowerCase() || "jungle4"}.greymass.com`;

    try {
        // Check if a public key is provided in the options
        if (options.publicKey) {
            publicKey = options.publicKey;
        } else {
            // Generate a new private key if none is provided
            privateKey = PrivateKey.generate(KeyType.K1);
            // Derive the corresponding public key
            publicKey = String(privateKey.toPublic());
        }

        // Prepare the data for the POST request
        const data = {
            accountName: accountName,
            activeKey: publicKey,
            ownerKey: publicKey,
            network: (options.chain && Chains[options.chain]) || "73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d"
        };

        // Make the POST request to create the account
        const response = await fetch(`${chainUrl}/account/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.status === 201) {
            console.log('Account created successfully!');
            console.log(`Account Name: ${accountName}`)
            if (privateKey) { // Only print the private key if it was generated
                console.log(`Private Key: ${privateKey.toString()}`);
            }
            console.log(`Public Key: ${publicKey}`);
        } else {
            const responseData = await response.json();
            console.error('Failed to create account:', responseData.message || responseData.reason);
        }
    } catch (error: unknown) {
        console.error('Error during account creation:', (error as { message: string }).message);
    }
}

function generateRandomAccountName(): string {
    // Generate a random 12-character account name using the allowed characters for EOSIO
    const characters = 'abcdefghijklmnopqrstuvwxyz12345';
    let result = '';
    for (let i = 0; i < 9; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return `${result}.gm`;
}
