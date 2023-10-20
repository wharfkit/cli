import { PrivateKey, KeyType, NameType, APIClient } from '@wharfkit/antelope';
import { Chains, type ChainIndices, type ChainDefinition } from '@wharfkit/common';


interface CommandOptions {
    publicKey?: string;
    accountName?: NameType;
    chain?: ChainIndices;
}

const supportedChains = ['Jungle4']

export async function createAccountFromCommand(options: CommandOptions) {
    let publicKey;
    let privateKey;

    if (options.chain && !supportedChains.includes(options.chain)) {
        console.error(`Unsupported chain "${options.chain}". Supported chains are: ${supportedChains.join(', ')}`);
        return;
    }

    const chainIndex: ChainIndices = options.chain || 'Jungle4';
    const chainDefinition: ChainDefinition = Chains[chainIndex];

    // Default to "jungle4" if no chain option is provided
    const chainUrl = `http://${chainIndex.toLowerCase()}.greymass.com`;

    if (options.accountName) {
        if (!String(options.accountName).endsWith('.gm')) {
            console.error('Account name must end with ".gm"');
            return;
        }
    
        if (options.accountName && (String(options.accountName).length > 12 || String(options.accountName).length < 3)) {
            console.error('Account name must be between 3 and 12 characters long');
            return;
        }

        const accountNameExists = await checkAccountNameExists(options.accountName, chainUrl);

        if (accountNameExists) {
            console.error(`Account name "${options.accountName}" is already taken. Please choose another name.`);
            return;
        }
    }

    // Generate a random account name if not provided
    const accountName = options.accountName || generateRandomAccountName();

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
            network: chainDefinition.id,
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
    // Generate a random 12-character account name using the allowed characters for Antelope accounts
    const characters = 'abcdefghijklmnopqrstuvwxyz12345';
    let result = '';
    for (let i = 0; i < 9; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return `${result}.gm`;
}



async function checkAccountNameExists(accountName: NameType, chainUrl: string): Promise<boolean> {
    const client = new APIClient({ url: chainUrl });

    try {
        const account = await client.v1.chain.get_account(accountName);

        return !!account?.account_name;
    } catch (error: unknown) {
        const errorMessage = (error as { message: string }).message;

        if (errorMessage.includes('Account not found')) {
            return false;
        }
        
        throw Error(`Error checking if account name exists: ${errorMessage}`);
    }
}
