import {assert} from 'chai'
import sinon from 'sinon'
import fs from 'fs'

import {ContractKit} from '@wharfkit/contract'
import eosioMsigAbi from '../data/abis/eosio.msig.json'

import {generateContractFromCommand} from 'src/commands/contract'

suite('generateContractFromCommand', () => {
    let sandbox

    setup(function () {
        sandbox = sinon.createSandbox()
    })

    teardown(function () {
        sandbox.restore()
    })

    test('--json option uses the provided ABI', async function () {
        try {
            await generateContractFromCommand('someContractThatDoesntExist', {
                url: 'http://eos.example-api.com',
                json: './test/data/abis/rewards.gm.json',
            })
        } catch (error) {
            assert.fail(
                `Error should not be thrown when valid JSON ABI file is passed. Error: ${error}`
            )
        }
    })

    test("--json option throws an error when file doesn't exist", async function () {
        try {
            await generateContractFromCommand('someContract', {
                url: 'http://eos.example-api.com',
                json: './test/data/abis/does-not-exist.json',
            })
            assert.fail('Error should be thrown when JSON file does not exist.')
        } catch (error) {
            assert(
                (error as unknown as Error).message.includes('no such file or directory'),
                'Error should be thrown when JSON file does not exist.'
            )
        }
    })

    test('--file option specifies the path for the generated file', async function () {
        const writeFileSyncStub = sandbox.stub(fs, 'writeFileSync')

        sandbox.stub(ContractKit.prototype, 'load').resolves({
            name: 'eosio.msig',
            abi: eosioMsigAbi,
        })

        await generateContractFromCommand('someContract', {
            url: 'http://example-api.com',
            file: './path/to/file',
        })

        assert(
            writeFileSyncStub.calledWith('./path/to/file', sinon.match.string),
            'writeFileSync should be called with correct path'
        )
    })

    test('Without --file option, code is logged to stdout.write', async function () {
        const stdOutStub = sandbox.stub(process.stdout, 'write')

        sandbox.stub(ContractKit.prototype, 'load').resolves({
            name: 'eosio.msig',
            abi: eosioMsigAbi,
        })

        await generateContractFromCommand('someContract', {
            url: 'http://example-api.com',
        })

        assert(
            stdOutStub.calledWith(sinon.match.string),
            'process.stdout.write should be called with generated contract code'
        )
    })
})
