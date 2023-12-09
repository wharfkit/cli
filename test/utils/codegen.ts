import {ABI} from '@wharfkit/session'
import fs from 'fs'
import path from 'path'
import {generateContract} from '../../src/commands/contract'

export async function generateCodegenContract(contractName: string) {
    // Read the ABI from a JSON file
    const abiJson = fs.readFileSync(`test/data/abis/${contractName}.json`, {encoding: 'utf8'})
    const abi = new ABI(JSON.parse(abiJson))

    // Generate the code
    const generatedCode = await generateContract(contractName, abi, './.eslintrc')

    // Create the tmp directory under the test directory if it does not exist
    if (!fs.existsSync('test/tmp')) {
        fs.mkdirSync('test/tmp')
    }

    // Write the generated code to a file in the tmp directory
    fs.writeFileSync(path.join('test/tmp', `${contractName}.ts`), generatedCode, {
        encoding: 'utf8',
    })

    return {
        import: await import(`../tmp/${contractName}`),
        text: generatedCode,
    }
}

export function removeCodegenContracts() {
    // fs.rmSync('test/tmp', {recursive: true, force: true})
}
