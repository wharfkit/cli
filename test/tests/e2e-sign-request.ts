import {assert} from 'chai'
import {execSync} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

/**
 * E2E tests for the sign request command:
 * - Creating signing requests for actions
 * - Using different data formats (JSON, key=value)
 * - Using different chain options
 *
 * Note: These tests use Jungle4 testnet for contract ABIs since local chain
 * may not have standard contracts deployed.
 */
suite('E2E: Sign Request', function () {
    this.timeout(30000)

    const cliPath = path.join(__dirname, '../../lib/cli.js')
    let testDir: string

    suiteSetup(function () {
        // Create a temporary test directory
        testDir = path.join(os.tmpdir(), `wharfkit-sign-test-${Date.now()}`)
        fs.mkdirSync(testDir, {recursive: true})
    })

    suiteTeardown(function () {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, {recursive: true, force: true})
        }
    })

    suite('Basic Request Creation', () => {
        test('can create a signing request with JSON data', function () {
            const output = execSync(
                `node ${cliPath} sign request eosio.token::transfer '{"from":"alice","to":"bob","quantity":"1.0000 EOS","memo":"test"}' --chain Jungle4`,
                {encoding: 'utf8'}
            )

            assert.include(output, 'Creating signing request...')
            assert.include(output, 'Contract: eosio.token')
            assert.include(output, 'Action: transfer')
            assert.include(output, '✅ Signing request created!')
            assert.include(output, 'esr://')
        })

        test('can create a signing request with key=value data', function () {
            const output = execSync(
                `node ${cliPath} sign request eosio.token::transfer 'from=alice,to=bob,quantity=1.0000 EOS,memo=test' --chain Jungle4`,
                {encoding: 'utf8'}
            )

            assert.include(output, 'Creating signing request...')
            assert.include(output, 'Contract: eosio.token')
            assert.include(output, 'Action: transfer')
            assert.include(output, '✅ Signing request created!')
        })

        test('can create a signing request with JSON file', function () {
            // Create a test JSON file
            const dataPath = path.join(testDir, 'action-data.json')
            const actionData = {
                from: 'alice',
                to: 'bob',
                quantity: '1.0000 EOS',
                memo: 'test from file',
            }
            fs.writeFileSync(dataPath, JSON.stringify(actionData))

            const output = execSync(
                `node ${cliPath} sign request eosio.token::transfer ${dataPath} --chain Jungle4`,
                {encoding: 'utf8'}
            )

            assert.include(output, 'Creating signing request...')
            assert.include(output, '✅ Signing request created!')
        })

        test('can create a signing request with $signer placeholder', function () {
            const output = execSync(
                `node ${cliPath} sign request eosio.token::transfer '{"from":"$signer","to":"bob","quantity":"1.0000 EOS","memo":"test"}' --chain Jungle4`,
                {encoding: 'utf8'}
            )

            assert.include(output, 'Creating signing request...')
            assert.include(output, '<wallet signer>')
            assert.include(output, '✅ Signing request created!')
        })
    })

    suite('Authorization Options', () => {
        test('can specify authorization with --auth option', function () {
            const output = execSync(
                `node ${cliPath} sign request eosio.token::transfer '{"from":"alice","to":"bob","quantity":"1.0000 EOS","memo":"test"}' --chain Jungle4 --auth alice@active`,
                {encoding: 'utf8'}
            )

            assert.include(output, 'Authorization: alice@active')
            assert.include(output, '✅ Signing request created!')
        })

        test('uses placeholder when no auth specified', function () {
            const output = execSync(
                `node ${cliPath} sign request eosio.token::transfer '{"from":"alice","to":"bob","quantity":"1.0000 EOS","memo":"test"}' --chain Jungle4`,
                {encoding: 'utf8'}
            )

            assert.include(output, 'Authorization: <wallet signer>@<wallet permission>')
        })

        test('can specify account-only authorization (defaults to active)', function () {
            const output = execSync(
                `node ${cliPath} sign request eosio.token::transfer '{"from":"alice","to":"bob","quantity":"1.0000 EOS","memo":"test"}' --chain Jungle4 --auth alice`,
                {encoding: 'utf8'}
            )

            assert.include(output, 'Authorization: alice@active')
        })
    })

    suite('Chain Options', () => {
        test('can specify Jungle4 chain', function () {
            const output = execSync(
                `node ${cliPath} sign request eosio.token::transfer '{"from":"alice","to":"bob","quantity":"1.0000 EOS","memo":"test"}' --chain Jungle4`,
                {encoding: 'utf8'}
            )

            assert.include(output, 'Chain: Jungle4')
            assert.include(output, '✅ Signing request created!')
        })

        test('can specify EOS chain', function () {
            const output = execSync(
                `node ${cliPath} sign request eosio.token::transfer '{"from":"alice","to":"bob","quantity":"1.0000 EOS","memo":"test"}' --chain EOS`,
                {encoding: 'utf8'}
            )

            assert.include(output, 'Chain: EOS')
            assert.include(output, '✅ Signing request created!')
        })

        test('can specify a custom URL', function () {
            const output = execSync(
                `node ${cliPath} sign request eosio.token::transfer '{"from":"alice","to":"bob","quantity":"1.0000 EOS","memo":"test"}' --chain https://jungle4.greymass.com`,
                {encoding: 'utf8'}
            )

            assert.include(output, 'https://jungle4.greymass.com')
            assert.include(output, '✅ Signing request created!')
        })
    })

    suite('Error Handling', () => {
        test('fails with invalid contract::action format', function () {
            try {
                execSync(
                    `node ${cliPath} sign request "invalid-format" '{"key":"value"}' --chain Jungle4`,
                    {encoding: 'utf8', stdio: 'pipe'}
                )
                assert.fail('Should have thrown an error')
            } catch (error: any) {
                const output = error.stdout || error.stderr || ''
                assert.include(output, 'contract::action')
            }
        })

        test('fails with invalid action data format', function () {
            try {
                execSync(
                    `node ${cliPath} sign request eosio.token::transfer "not valid data" --chain Jungle4`,
                    {encoding: 'utf8', stdio: 'pipe'}
                )
                assert.fail('Should have thrown an error')
            } catch (error: any) {
                const output = error.stdout || error.stderr || ''
                assert.include(output, 'Invalid action data format')
            }
        })

        test('fails with non-existent action', function () {
            try {
                execSync(
                    `node ${cliPath} sign request eosio.token::nonexistent '{"key":"value"}' --chain Jungle4`,
                    {encoding: 'utf8', stdio: 'pipe'}
                )
                assert.fail('Should have thrown an error')
            } catch (error: any) {
                // The output may be in stdout, stderr, or the error message itself
                const output = (error.stdout || '') + (error.stderr || '') + (error.message || '')
                assert.include(output, 'not found')
            }
        })

        test('fails with unknown chain name', function () {
            try {
                execSync(
                    `node ${cliPath} sign request eosio.token::transfer '{"from":"alice","to":"bob","quantity":"1.0000 EOS","memo":"test"}' --chain unknownchain`,
                    {encoding: 'utf8', stdio: 'pipe'}
                )
                assert.fail('Should have thrown an error')
            } catch (error: any) {
                const output = error.stdout || error.stderr || ''
                assert.include(output, 'Unknown chain')
            }
        })
    })
})
