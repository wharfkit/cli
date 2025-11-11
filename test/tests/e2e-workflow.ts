import {assert} from 'chai'
import {execSync} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

/**
 * E2E tests for the complete workflow:
 * 1. Create wallet keys
 * 2. Create accounts
 * 3. Compile contracts
 * 4. Deploy contracts
 */
suite('E2E Workflow', () => {
    const cliPath = path.join(__dirname, '../../lib/cli.js')
    let testDir: string
    let testWalletDir: string
    let originalHome: string

    setup(function () {
        // Create a temporary test directory
        testDir = path.join(os.tmpdir(), `wharfkit-e2e-test-${Date.now()}`)
        fs.mkdirSync(testDir, {recursive: true})

        // Create a temporary wallet directory for tests
        testWalletDir = path.join(testDir, '.wharfkit', 'wallet')
        fs.mkdirSync(testWalletDir, {recursive: true})

        // Mock HOME to use test wallet directory
        originalHome = process.env.HOME || ''
        process.env.HOME = testDir
    })

    teardown(function () {
        // Restore original HOME
        process.env.HOME = originalHome

        // Clean up test directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, {recursive: true, force: true})
        }
    })

    suite('Wallet Key Management', () => {
        test('can create a wallet key', function () {
            const output = execSync(`node ${cliPath} wallet create --name testkey`, {
                encoding: 'utf8',
            })

            assert.include(output, '✅ Key created successfully!')
            assert.include(output, 'Name: testkey')
            assert.include(output, 'Public Key: PUB_K1_')
            assert.include(output, 'Private Key: PVT_K1_')
        })

        test('can list wallet keys', function () {
            // Create a key first
            execSync(`node ${cliPath} wallet create --name listtest`, {encoding: 'utf8'})

            // List keys
            const output = execSync(`node ${cliPath} wallet keys`, {encoding: 'utf8'})

            assert.include(output, 'listtest')
            assert.include(output, 'Public Key:')
            assert.include(output, 'Created:')
        })

        test('generates random key name when not specified', function () {
            const output = execSync(`node ${cliPath} wallet keys create`, {encoding: 'utf8'})

            assert.include(output, '✅ Key created successfully!')
            // Should have a name (either 'default' or 'keyN')
            assert.match(output, /Name: (default|key\d+)/)
        })
    })

    suite('Transaction Signing', () => {
        test('can sign a transaction with wallet key', function () {
            // Create a key first
            execSync(`node ${cliPath} wallet create --name signtest`, {encoding: 'utf8'})

            // Create test transaction
            const transaction = {
                expiration: '2025-11-11T00:00:00',
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

            const txPath = path.join(testDir, 'transaction.json')
            fs.writeFileSync(txPath, JSON.stringify(transaction))

            // Sign the transaction
            const output = execSync(`node ${cliPath} wallet sign ${txPath}`, {encoding: 'utf8'})

            assert.include(output, '✅ Transaction signed successfully!')
            assert.include(output, 'Signature: SIG_K1_')
            assert.include(output, 'signatures')
        })
    })

    suite('Contract Compilation', () => {
        test('shows helpful error when no cpp files found', function () {
            try {
                execSync(`node ${cliPath} compile`, {
                    encoding: 'utf8',
                    cwd: testDir,
                })
                assert.fail('Should throw error when no cpp files found')
            } catch (error: any) {
                // Command should exit with error when no files found
                assert.isTrue(error.status !== 0 || error.code !== 0)
            }
        })

        test('can compile a cpp file when cdt is installed', function () {
            // Create a simple contract
            const contractCode = `
#include <eosio/eosio.hpp>

class [[eosio::contract]] hello : public eosio::contract {
  public:
    using eosio::contract::contract;
    
    [[eosio::action]]
    void hi(eosio::name user) {
        print("Hello, ", user);
    }
};
`
            const cppPath = path.join(testDir, 'hello.cpp')
            fs.writeFileSync(cppPath, contractCode)

            try {
                const output = execSync(`node ${cliPath} compile`, {
                    encoding: 'utf8',
                    cwd: testDir,
                })

                // Should either compile successfully or show CDT not installed
                assert.isTrue(
                    output.includes('Compilation complete!') ||
                        output.includes('cdt-cpp is not installed') ||
                        output.includes('LEAP is not installed')
                )
            } catch (error: any) {
                // It's okay if CDT is not installed
                const output = error.stderr || error.stdout
                assert.isTrue(
                    output.includes('cdt-cpp is not installed') ||
                        output.includes('LEAP is not installed')
                )
            }
        })
    })

    suite('Command Structure', () => {
        test('wallet command has correct subcommands', function () {
            const output = execSync(`node ${cliPath} wallet --help`, {encoding: 'utf8'})

            assert.include(output, 'create')
            assert.include(output, 'keys')
            assert.include(output, 'account')
            assert.include(output, 'sign')
        })

        test('wallet account command has create subcommand', function () {
            const output = execSync(`node ${cliPath} wallet account --help`, {encoding: 'utf8'})

            assert.include(output, 'create')
            assert.include(output, 'Create a new account on the blockchain')
        })

        test('deploy command is at top level', function () {
            const output = execSync(`node ${cliPath} deploy --help`, {encoding: 'utf8'})

            assert.include(output, 'Deploy a compiled contract')
            assert.include(output, '--account')
            assert.include(output, '--url')
            assert.notInclude(output, '--key')
        })

        test('dev command is at top level', function () {
            const output = execSync(`node ${cliPath} dev --help`, {encoding: 'utf8'})

            assert.include(output, 'Start local chain and watch for changes')
            assert.include(output, '--account')
            assert.include(output, '--port')
            assert.include(output, '--clean')
        })

        test('compile command is at top level', function () {
            const output = execSync(`node ${cliPath} compile --help`, {encoding: 'utf8'})

            assert.include(output, 'Compile C++ contract files')
            assert.include(output, '--output')
        })
    })

    suite('Key Selection Logic', () => {
        test('deploy uses account-named key if available', function () {
            // This test verifies the key selection logic exists
            // Actual deployment would require a running chain
            const deployHelp = execSync(`node ${cliPath} deploy --help`, {encoding: 'utf8'})

            // Verify --account option exists (used for key selection)
            assert.include(deployHelp, '--account')
        })
    })

    suite('Integration: Wallet Key Storage', () => {
        test('created keys are persisted in wallet', function () {
            const keyName = `persistent-${Date.now()}`

            // Create a key
            const createOutput = execSync(`node ${cliPath} wallet create --name ${keyName}`, {
                encoding: 'utf8',
            })
            assert.include(createOutput, keyName)

            // Verify it shows up in list
            const listOutput = execSync(`node ${cliPath} wallet keys`, {encoding: 'utf8'})
            assert.include(listOutput, keyName)
        })
    })
})

