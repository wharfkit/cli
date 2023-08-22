import {ABI, APIClient} from '@wharfkit/antelope'

export async function generateContract(account, options) {
    const client = new APIClient({url: options.url})
    client.v1.chain
        .get_raw_abi(account)
        .then((result) => {
            const abi = ABI.from(result.abi)
            console.log(abi)
            // generate code based on ABI and output to stdout
        })
        .catch((error) => {
            console.error(error.message)
        })
}
