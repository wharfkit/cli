import { Bytes, KeyType, PrivateKey } from "@wharfkit/antelope";

export async function createAccountFromCommand(options: any) {
    let publicKey;
    let privateKey;

    try {
        // Check if a public key is provided in the options
        if (options.publicKey) {
            publicKey = options.publicKey;
        } else {
            // Generate a new private key if none is provided
            privateKey = PrivateKey.generate(KeyType.K1);
            // Derive the corresponding public key
            publicKey = privateKey.toPublicKey().toString();
        }

        // Prepare the data for the POST request to Sextant
        const data = {
            account: 'eosio',
            permission: 'active',
            public_key: publicKey
        };

        // Convert the data object to a Buffer
        const requestBodyInBytes = Buffer.from(JSON.stringify(data), 'utf8');

        // Generate the signature for the request body
        const signature = generateSignatureForBody(requestBodyInBytes);

        // Make the POST request to Sextant to create the account
        const response = await fetch(`${SEXTANT_URL}/v1/chain/account`, {
            method: 'POST',
            headers: {
                'X-Request-Sig': signature,
                'Content-Type': 'application/json',
            },
            body: requestBodyInBytes.toString('utf8'),
        });

        const responseData = await response.json();

        if (responseData.success) {
            console.log('Account created successfully!');
            if (privateKey) { // Only print the private key if it was generated
                console.log(`Private Key: ${privateKey.toString()}`);
            }
            console.log(`Public Key: ${publicKey}`);
        } else {
            console.error('Failed to create account:', responseData.message || responseData.reason);
        }
    } catch (error: unknown) {
        console.error('Error during account creation:', (error as { message: string }).message);
    }
}

function generateSignatureForBody(bodyBytes) {
    if (!SEXTANT_KEY_PADDING) {
        throw Error('Missing Sextant API key.');
    }

    const deobfuscated = SEXTANT_KEY_PADDING.split(', ')
        .slice(4)
        .map((b, i) => b ^ (42 * i));

    const privateKey = new PrivateKey(KeyType.K1, Bytes.from(deobfuscated));

    return privateKey.signMessage(bodyBytes).toString();
}
