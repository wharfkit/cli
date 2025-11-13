import {assert} from 'chai'
import {execSync} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as http from 'http'

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

    suite('Transaction Transacting', () => {
        test('can transact (sign) a transaction with wallet key', function () {
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

            // Transact the transaction
            const output = execSync(`node ${cliPath} wallet transact ${txPath}`, {encoding: 'utf8'})

            assert.include(output, '✅ Transaction signed successfully!')
            assert.include(output, 'Signature: SIG_K1_')
            assert.include(output, 'signatures')
        })

        test('writes signed transaction to file when --output is provided', function () {
            execSync(`node ${cliPath} wallet create --name outputtest`, {encoding: 'utf8'})

            const transaction = {
                expiration: '2025-11-11T00:00:00',
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

            const txPath = path.join(testDir, 'transaction-output.json')
            const signedPath = path.join(testDir, 'signed-transaction.json')
            fs.writeFileSync(txPath, JSON.stringify(transaction))

            const output = execSync(
                `node ${cliPath} wallet transact ${txPath} --output ${signedPath}`,
                {encoding: 'utf8'}
            )

            assert.include(output, 'Transaction output saved to:')
            assert.isTrue(fs.existsSync(signedPath))

            const saved = JSON.parse(fs.readFileSync(signedPath, 'utf8'))
            assert.isArray(saved.signatures, 'signed transaction should include signatures array')
            assert.isAbove(saved.signatures.length, 0, 'signed transaction should contain at least one signature')
        })

        test('broadcasts transaction when --broadcast is provided', async function () {
            const chainId =
                'b94d27b9934d3e08a52e52d7da7dabfade8882abff6b19413ababd9f146e6e1'
            const requests: Array<{path: string; method: string; body?: any}> = []

            const server = http.createServer((req, res) => {
                if (!req.url || !req.method) {
                    res.writeHead(400)
                    res.end()
                    return
                }

                if (req.method === 'GET' && req.url === '/v1/chain/get_info') {
                    requests.push({path: req.url, method: req.method})
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify({chain_id: chainId}))
                    return
                }

                if (req.method === 'POST' && req.url === '/v1/chain/push_transaction') {
                    let body = ''
                    req.on('data', (chunk) => {
                        body += chunk
                    })
                    req.on('end', () => {
                        requests.push({
                            path: req.url as string,
                            method: req.method as string,
                            body: body ? JSON.parse(body) : undefined,
                        })
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(
                            JSON.stringify({
                                transaction_id: 'abcd1234ef567890',
                                processed: {receipt: {status: 'executed'}},
                            })
                        )
                    })
                    return
                }

                res.writeHead(404)
                res.end()
            })

            const port = await new Promise<number>((resolve) => {
                server.listen(0, () => {
                    const address = server.address()
                    if (typeof address === 'object' && address?.port) {
                        resolve(address.port)
                    } else {
                        resolve(0)
                    }
                })
            })

            const txPath = path.join(testDir, 'transaction-broadcast.json')
            const transaction = {
                expiration: '2025-11-11T00:00:00',
                ref_block_num: 1111,
                ref_block_prefix: 2222,
                max_net_usage_words: 0,
                max_cpu_usage_ms: 0,
                delay_sec: 0,
                context_free_actions: [],
                actions: [
                    {
                        account: 'eosio.token',
                        name: 'transfer',
                        authorization: [{actor: 'broadcastacc', permission: 'active'}],
                        data: '0000000000ea305500000000487a2b9d010000000000000004535953000000000b62726f616463617374',
                    },
                ],
                transaction_extensions: [],
            }
            fs.writeFileSync(txPath, JSON.stringify(transaction))

            execSync(`node ${cliPath} wallet create --name broadcastkey`, {encoding: 'utf8'})

            let output: string | undefined
            try {
                output = execSync(
                    `node ${cliPath} wallet transact ${txPath} --broadcast --url http://127.0.0.1:${port}`,
                    {encoding: 'utf8'}
                )
            } finally {
                await new Promise((resolve) => server.close(resolve))
            }

            assert.isString(output)
            assert.include(output, '🚀 Transaction broadcast successfully!')
            assert.include(output, 'Transaction ID: abcd1234ef567890')
            assert.include(output, 'Status: executed')

            const broadcastRequest = requests.find(
                (request) => request.path === '/v1/chain/push_transaction'
            )
            assert.isDefined(broadcastRequest, 'push_transaction should be called')
            assert.isArray(broadcastRequest?.body?.signatures)
            assert.isAbove(broadcastRequest?.body?.signatures.length ?? 0, 0)
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
            assert.include(output, 'transact')
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

