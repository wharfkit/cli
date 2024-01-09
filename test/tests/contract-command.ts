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

    test('--url option uses the provided URL', async function () {
        const contractKitLoadStub = sandbox.stub(ContractKit.prototype, 'load').resolves({
            name: 'eosio.msig',
            abi: eosioMsigAbi,
        })

        await generateContractFromCommand('eosio.msig', {
            url: 'http://eos.greymass.com',
        })

        assert(
            contractKitLoadStub.calledWith('eosio.msig'),
            'ContractKit.load should be called with correct contract name'
        )
    })

    test('throws an error when --url and --json are not provided', async function () {
        try {
            await generateContractFromCommand('eosio.msig', {})
            assert.fail('Error should be thrown when neither --url nor --json are provided.')
        } catch (error) {
            assert(
                (error as unknown as Error).message.includes(
                    'URL is required when json value is not provided.'
                ),
                'Error should be thrown when neither --url nor --json are provided.'
            )
        }
    })

    test('throws an error when --json and contractName are not provided', async function () {
        try {
            await generateContractFromCommand(undefined, {
                url: 'http://eos.greymass.com',
            })

            assert.fail('Error should be thrown when neither --json nor contractName are provided.')
        } catch (error) {
            assert(
                (error as unknown as Error).message.includes(
                    'Contract name is required when json value is not provided.'
                ),
                'Error should be thrown when neither --json nor contractName are provided.'
            )
        }
    })

    test('--json option uses the provided ABI', async function () {
        try {
            await generateContractFromCommand('someContractThatDoesntExist', {
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

    test('--eslintrc option uses the provided eslintrc', async function () {
        try {
            await generateContractFromCommand('someContractThatDoesntExist', {
                url: 'http://eos.example-api.com',
                json: './test/data/abis/rewards.gm.json',
                eslintrc: './.eslintrc',
            })
        } catch (error) {
            assert.fail(
                `Error should not be thrown when valid eslintrc file is passed. Error: ${error}`
            )
        }
    })

    test("--eslintrc option throws an error when file doesn't exist", async function () {
        try {
            await generateContractFromCommand('someContract', {
                url: 'http://eos.example-api.com',
                json: './test/data/abis/rewards.gm.json',
                eslintrc: './.does-not-exist-eslintrc',
            })
            assert.fail('Error should be thrown when eslintrc file does not exist.')
        } catch (error) {
            assert(
                (error as unknown as Error).message.includes('no such file or directory'),
                'Error should be thrown when eslintrc file does not exist.'
            )
        }
    })
})
