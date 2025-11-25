import {assert} from 'chai'
import sinon from 'sinon'
import * as nodeFetch from 'node-fetch'
import {Chains} from '@wharfkit/common'

import {createAccount} from 'src/commands/wallet/account'
import * as utils from 'src/utils'
import * as walletUtils from 'src/commands/wallet/utils'

suite('Wallet Account Create', () => {
    let sandbox: sinon.SinonSandbox
    let fetchStub: sinon.SinonStub
    let makeClientStub: sinon.SinonStub
    let logStub: sinon.SinonStub
    let addKeyToWalletStub: sinon.SinonStub

    setup(function () {
        sandbox = sinon.createSandbox()
        fetchStub = sandbox.stub()
        makeClientStub = sandbox.stub()
        logStub = sandbox.stub()
        addKeyToWalletStub = sandbox.stub()

        // Mock fetch from node-fetch
        sandbox.stub(nodeFetch, 'default').callsFake(fetchStub as any)

        // Mock makeClient and log from utils
        sandbox.stub(utils, 'makeClient').callsFake(makeClientStub as any)
        sandbox.stub(utils, 'log').callsFake(logStub as any)

        // Mock addKeyToWallet from wallet utils
        sandbox.stub(walletUtils, 'addKeyToWallet').callsFake(addKeyToWalletStub as any)
    })

    teardown(function () {
        sandbox.restore()
    })

    test('creates account with auto-generated name on default chain (Jungle4)', async function () {
        const mockResponse = {
            status: 201,
            json: sandbox.stub().resolves({}),
        }
        fetchStub.resolves(mockResponse)

        await createAccount({})

        assert.isTrue(fetchStub.calledOnce)
        const callArgs = fetchStub.getCall(0).args
        assert.equal(callArgs[0], `${Chains.Jungle4.url}/account/create`)
        assert.equal(callArgs[1].method, 'POST')
        assert.equal(callArgs[1].headers['Content-Type'], 'application/json')

        const body = JSON.parse(callArgs[1].body)
        assert.isString(body.accountName)
        assert.isTrue(body.accountName.endsWith('.gm'))
        assert.isString(body.activeKey)
        assert.isString(body.ownerKey)
        assert.equal(body.activeKey, body.ownerKey)
        assert.equal(body.network, Chains.Jungle4.id)

        assert.isTrue(logStub.calledWith('Account created successfully!', 'info'))
    })

    test('creates account with custom name', async function () {
        const accountName = 'testacc.gm'
        const mockResponse = {
            status: 201,
            json: sandbox.stub().resolves({}),
        }
        fetchStub.resolves(mockResponse)

        // Mock account check - account doesn't exist
        const mockClient = {
            v1: {
                chain: {
                    get_account: sandbox.stub().rejects(new Error('Account not found')),
                },
            },
        }
        makeClientStub.returns(mockClient)

        await createAccount({name: accountName})

        assert.isTrue(makeClientStub.calledOnce)
        assert.isTrue(fetchStub.calledOnce)

        const body = JSON.parse(fetchStub.getCall(0).args[1].body)
        assert.equal(body.accountName, accountName)
        assert.isTrue(logStub.calledWith(`Account Name: ${accountName}`, 'info'))
    })

    test('creates account with custom public key', async function () {
        const publicKey = 'PUB_K1_5TXDWwucfSa9Ghh49di3vxthzUcLSDE5yuxEMCJvw29Jpjq4mp'
        const mockResponse = {
            status: 201,
            json: sandbox.stub().resolves({}),
        }
        fetchStub.resolves(mockResponse)

        await createAccount({key: publicKey})

        const body = JSON.parse(fetchStub.getCall(0).args[1].body)
        assert.equal(body.activeKey, publicKey)
        assert.equal(body.ownerKey, publicKey)

        // Should not log private key when key is provided
        const logCalls = logStub.getCalls().map((call) => call.args[0])
        assert.isFalse(logCalls.some((msg) => msg.includes('Private Key')))
        // Should not import key when only public key is provided
        assert.isFalse(addKeyToWalletStub.called)
    })

    test('generates private key when not provided', async function () {
        const mockResponse = {
            status: 201,
            json: sandbox.stub().resolves({}),
        }
        fetchStub.resolves(mockResponse)

        await createAccount({})

        const body = JSON.parse(fetchStub.getCall(0).args[1].body)
        assert.isString(body.activeKey)
        assert.include(body.activeKey, 'PUB_K1_')

        // Should import private key when it was generated (not log it)
        const logCalls = logStub.getCalls().map((call) => call.args[0])
        assert.isFalse(logCalls.some((msg) => msg.includes('Private Key:')))
        assert.isTrue(logCalls.some((msg) => msg.includes('Private key imported into wallet')))
        assert.isTrue(addKeyToWalletStub.calledOnce)
    })

    test('creates account on KylinTestnet chain', async function () {
        const mockResponse = {
            status: 201,
            json: sandbox.stub().resolves({}),
        }
        fetchStub.resolves(mockResponse)

        await createAccount({chain: 'KylinTestnet'})

        assert.isTrue(fetchStub.calledOnce)
        const callArgs = fetchStub.getCall(0).args
        assert.equal(callArgs[0], `${Chains.KylinTestnet.url}/account/create`)

        const body = JSON.parse(callArgs[1].body)
        assert.equal(body.network, Chains.KylinTestnet.id)
    })

    test('handles lowercase chain name', async function () {
        const mockResponse = {
            status: 201,
            json: sandbox.stub().resolves({}),
        }
        fetchStub.resolves(mockResponse)

        await createAccount({chain: 'jungle4'})

        const callArgs = fetchStub.getCall(0).args
        assert.equal(callArgs[0], `${Chains.Jungle4.url}/account/create`)
    })

    test('rejects unsupported chain', async function () {
        await createAccount({chain: 'EOS'})

        assert.isTrue(
            logStub.calledWith(
                sinon.match(
                    /Unsupported chain.*Supported chains are: Jungle4, KylinTestnet, local/
                ),
                'info'
            )
        )
        assert.isFalse(fetchStub.called)
    })

    test('rejects account name without .gm suffix', async function () {
        await createAccount({name: 'testaccount'})

        assert.isTrue(logStub.calledWith('Account name must end with ".gm"', 'info'))
        assert.isFalse(fetchStub.called)
    })

    test('accepts valid short account name', async function () {
        const accountName = 'ab.gm'
        const mockResponse = {
            status: 201,
            json: sandbox.stub().resolves({}),
        }
        fetchStub.resolves(mockResponse)

        // Mock account check - account doesn't exist
        const mockClient = {
            v1: {
                chain: {
                    get_account: sandbox.stub().rejects(new Error('Account not found')),
                },
            },
        }
        makeClientStub.returns(mockClient)

        // "ab.gm" is valid (5 chars total, which is >= 3)
        await createAccount({name: accountName})

        // Should proceed to account creation since it's valid length
        assert.isTrue(fetchStub.called)
        const body = JSON.parse(fetchStub.getCall(0).args[1].body)
        assert.equal(body.accountName, accountName)
    })

    test('rejects account name that is too long', async function () {
        await createAccount({name: 'toolongaccountname.gm'})

        assert.isTrue(
            logStub.calledWith('Account name must be between 3 and 12 characters long', 'info')
        )
        assert.isFalse(fetchStub.called)
    })

    test('rejects account name that already exists', async function () {
        const accountName = 'existing.gm'
        const mockClient = {
            v1: {
                chain: {
                    get_account: sandbox.stub().resolves({
                        account_name: accountName,
                    }),
                },
            },
        }
        makeClientStub.returns(mockClient)

        await createAccount({name: accountName})

        assert.isTrue(
            logStub.calledWith(
                `Account name "${accountName}" is already taken. Please choose another name.`,
                'info'
            )
        )
        assert.isFalse(fetchStub.called)
    })

    test('handles account creation failure', async function () {
        const mockResponse = {
            status: 400,
            json: sandbox.stub().resolves({
                message: 'Account creation failed',
            }),
        }
        fetchStub.resolves(mockResponse)

        await createAccount({})

        assert.isTrue(
            logStub.calledWith('Failed to create account: Account creation failed', 'info')
        )
    })

    test('handles fetch error', async function () {
        fetchStub.rejects(new Error('Network error'))

        await createAccount({})

        assert.isTrue(logStub.calledWith(sinon.match(/Error during account creation/), 'info'))
    })

    test('generates random account name ending with .gm', async function () {
        const mockResponse = {
            status: 201,
            json: sandbox.stub().resolves({}),
        }
        fetchStub.resolves(mockResponse)

        await createAccount({})

        const body = JSON.parse(fetchStub.getCall(0).args[1].body)
        assert.isTrue(body.accountName.endsWith('.gm'))
        // Should be 9 chars + .gm = 12 chars total
        assert.equal(body.accountName.length, 12)
    })
})
