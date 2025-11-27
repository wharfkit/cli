import {assert} from 'chai'
import {execSync} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import {APIClient, FetchProvider} from '@wharfkit/antelope'
import fetch from 'node-fetch'
import {
    E2ETestContext,
    setupE2ETestEnvironment,
    teardownE2ETestEnvironment,
    getTransactionExpiration,
} from '../../utils/test-helpers'

/**
 * E2E tests for wallet functionality:
 * - Key creation and management
 * - Key import (wallet keys add)
 * - Transaction signing
 * - Key persistence
 */
suite('E2E: Wallet', () => {
    let ctx: E2ETestContext | null = null

    suiteSetup(async function () {
        ctx = await setupE2ETestEnvironment(this)
    })

    suiteTeardown(function () {
        this.timeout(30000)
        teardownE2ETestEnvironment(ctx)
    })

    suite('Key Management', () => {
        test('can create a wallet key', function () {
            if (!ctx) this.skip()
            const output = execSync(`node ${ctx.cliPath} wallet create --name testkey`, {
                encoding: 'utf8',
            })

            assert.include(output, '✅ Key created successfully!')
            assert.include(output, 'Name: testkey')
            assert.include(output, 'Public Key: PUB_K1_')
            assert.include(output, 'Private Key: PVT_K1_')
        })

        test('can list wallet keys', function () {
            if (!ctx) this.skip()
            // Create a key first
            execSync(`node ${ctx.cliPath} wallet create --name listtest`, {encoding: 'utf8'})

            // List keys
            const output = execSync(`node ${ctx.cliPath} wallet keys`, {encoding: 'utf8'})

            assert.include(output, 'listtest')
            assert.include(output, 'Public Key:')
            assert.include(output, 'Created:')
        })

        test('generates random key name when not specified', function () {
            if (!ctx) this.skip()
            const output = execSync(`node ${ctx.cliPath} wallet keys create`, {encoding: 'utf8'})

            assert.include(output, '✅ Key created successfully!')
            // Should have a name (either 'default' or 'keyN')
            assert.match(output, /Name: (default|key\d+)/)
        })

        test('can add an existing private key to wallet', function () {
            if (!ctx) this.skip()
            // Generate a private key using the CLI first to get a valid key format
            const createOutput = execSync(`node ${ctx.cliPath} wallet create --name tempkey`, {
                encoding: 'utf8',
            })

            // Extract the private key from the output
            const privateKeyMatch = createOutput.match(/Private Key: (PVT_K1_[A-Za-z0-9]+)/)
            const publicKeyMatch = createOutput.match(/Public Key: (PUB_K1_[A-Za-z0-9]+)/)
            assert.isNotNull(privateKeyMatch, 'Should have private key in output')
            assert.isNotNull(publicKeyMatch, 'Should have public key in output')

            const privateKey = privateKeyMatch![1]
            const expectedPublicKey = publicKeyMatch![1]

            // Add the same private key with a different name
            const addOutput = execSync(
                `node ${ctx.cliPath} wallet keys add ${privateKey} --name imported-key`,
                {encoding: 'utf8'}
            )

            assert.include(addOutput, '✅ Key added successfully!')
            assert.include(addOutput, 'Name: imported-key')
            assert.include(addOutput, `Public Key: ${expectedPublicKey}`)
        })

        test('wallet keys add fails with invalid private key', function () {
            if (!ctx) this.skip()
            try {
                execSync(`node ${ctx.cliPath} wallet keys add invalid-key --name badkey`, {
                    encoding: 'utf8',
                    stdio: 'pipe',
                })
                assert.fail('Should have thrown an error')
            } catch (error: any) {
                assert.include(error.message, 'Invalid private key format')
            }
        })

        test('wallet keys add generates name when not specified', function () {
            if (!ctx) this.skip()
            // Generate a private key using the CLI first
            const createOutput = execSync(`node ${ctx.cliPath} wallet create --name tempkey2`, {
                encoding: 'utf8',
            })

            // Extract the private key from the output
            const privateKeyMatch = createOutput.match(/Private Key: (PVT_K1_[A-Za-z0-9]+)/)
            assert.isNotNull(privateKeyMatch, 'Should have private key in output')

            const privateKey = privateKeyMatch![1]

            // Add without specifying name
            const addOutput = execSync(`node ${ctx.cliPath} wallet keys add ${privateKey}`, {
                encoding: 'utf8',
            })

            assert.include(addOutput, '✅ Key added successfully!')
            // Should have auto-generated name
            assert.match(addOutput, /Name: (default|key\d+)/)
        })
    })

    suite('Transaction Signing', () => {
        test('can transact (sign) a transaction with wallet key', function () {
            if (!ctx) this.skip()
            // Create a key first
            execSync(`node ${ctx.cliPath} wallet create --name signtest`, {encoding: 'utf8'})

            // Create test transaction
            const transaction = {
                expiration: getTransactionExpiration(),
                ref_block_num: 12345,
                ref_block_prefix: 67890,
                max_net_usage_words: 0,
                max_cpu_usage_ms: 0,
                delay_sec: 0,
                context_free_actions: [],
                actions: [
                    {
                        account: 'eosio.token',
                        name: 'transfer',
                        authorization: [{actor: 'testaccount', permission: 'active'}],
                        data: '0000000000ea305500000000487a2b9d0100000000000000045359530000000007746573742074',
                    },
                ],
                transaction_extensions: [],
            }

            const txPath = path.join(ctx.testDir, 'transaction.json')
            fs.writeFileSync(txPath, JSON.stringify(transaction))

            // Transact the transaction
            const output = execSync(`node ${ctx.cliPath} wallet transact ${txPath}`, {
                encoding: 'utf8',
            })

            assert.include(output, '✅ Transaction signed successfully!')
            assert.include(output, 'Signature: SIG_K1_')
            assert.include(output, 'signatures')
        })

        test('writes signed transaction to file when --output is provided', function () {
            if (!ctx) this.skip()
            execSync(`node ${ctx.cliPath} wallet create --name outputtest`, {encoding: 'utf8'})

            const transaction = {
                expiration: getTransactionExpiration(),
                ref_block_num: 54321,
                ref_block_prefix: 98765,
                max_net_usage_words: 0,
                max_cpu_usage_ms: 0,
                delay_sec: 0,
                context_free_actions: [],
                actions: [
                    {
                        account: 'eosio.token',
                        name: 'transfer',
                        authorization: [{actor: 'testaccount', permission: 'active'}],
                        data: '0000000000ea305500000000487a2b9d0100000000000000045359530000000007746573742074',
                    },
                ],
                transaction_extensions: [],
            }

            const txPath = path.join(ctx.testDir, 'transaction-output.json')
            const signedPath = path.join(ctx.testDir, 'signed-transaction.json')
            fs.writeFileSync(txPath, JSON.stringify(transaction))

            const output = execSync(
                `node ${ctx.cliPath} wallet transact ${txPath} --output ${signedPath}`,
                {encoding: 'utf8'}
            )

            assert.include(output, 'Signed transaction saved to:')
            assert.isTrue(fs.existsSync(signedPath))

            const saved = JSON.parse(fs.readFileSync(signedPath, 'utf8'))
            assert.isArray(saved.signatures, 'signed transaction should include signatures array')
            assert.isAbove(
                saved.signatures.length,
                0,
                'signed transaction should contain at least one signature'
            )
        })

        test('broadcasts transaction when --broadcast is provided', async function () {
            if (!ctx) this.skip()
            // Get valid reference block info from the chain
            const client = new APIClient({
                provider: new FetchProvider('http://127.0.0.1:8888', {fetch}),
            })
            const chainInfo = await client.v1.chain.get_info()

            // Calculate ref_block_num and ref_block_prefix from last_irreversible_block_num
            const blockNum = chainInfo.last_irreversible_block_num.toNumber()
            const blockInfo = await client.v1.chain.get_block(blockNum)

            const txPath = path.join(ctx.testDir, 'transaction-broadcast.json')
            const transaction = {
                expiration: getTransactionExpiration(),
                ref_block_num: blockNum & 0xffff,
                ref_block_prefix: blockInfo.ref_block_prefix.toNumber(),
                max_net_usage_words: 0,
                max_cpu_usage_ms: 0,
                delay_sec: 0,
                context_free_actions: [],
                actions: [
                    {
                        account: 'eosio',
                        name: 'buyram',
                        authorization: [{actor: 'eosio', permission: 'active'}],
                        data: '0000000000ea30550000000000ea30550100000000000000045359530000000000',
                    },
                ],
                transaction_extensions: [],
            }
            fs.writeFileSync(txPath, JSON.stringify(transaction))

            let output: string
            try {
                output = execSync(
                    `node ${ctx.cliPath} wallet transact ${txPath} --broadcast --key chain-key`,
                    {encoding: 'utf8'}
                )
            } catch {
                try {
                    output = execSync(
                        `node ${ctx.cliPath} wallet transact ${txPath} --broadcast --key default`,
                        {encoding: 'utf8'}
                    )
                } catch {
                    output = execSync(
                        `node ${ctx.cliPath} wallet transact ${txPath} --broadcast --key dev`,
                        {encoding: 'utf8'}
                    )
                }
            }

            assert.include(output, '🚀 Transaction broadcast successfully!')
            assert.include(output, 'Transaction ID:')
        })
    })

    suite('Key Persistence', () => {
        test('created keys are persisted in wallet', function () {
            if (!ctx) this.skip()
            const keyName = `persistent-${Date.now()}`

            // Create a key
            const createOutput = execSync(`node ${ctx.cliPath} wallet create --name ${keyName}`, {
                encoding: 'utf8',
            })
            assert.include(createOutput, keyName)

            // Verify it shows up in list
            const listOutput = execSync(`node ${ctx.cliPath} wallet keys`, {encoding: 'utf8'})
            assert.include(listOutput, keyName)
        })
    })
})

