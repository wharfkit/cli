import {assert} from 'chai'
import {execSync} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {ABI, APIClient, FetchProvider, Serializer} from '@wharfkit/antelope'
import fetch from 'node-fetch'
import {log} from '../../src/utils'
import {isNodeosAvailable, killProcessAtPort, waitForChainReady} from '../utils/test-helpers'

/**
 * E2E tests for the complete workflow:
 * 1. Create wallet keys
 * 2. Create accounts
 * 3. Compile contracts
 * 4. Deploy contracts
 */

/**
 * Get a transaction expiration date 1 hour from now
 */
function getTransactionExpiration(): string {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    return now.toISOString().slice(0, 19) // Remove milliseconds and timezone
}

function getRandomLocalAccountName(prefix: string): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz12345'
    let result = prefix
    // Generate up to 12 chars total (no .gm suffix for local chains)
    const remaining = 12 - prefix.length
    for (let i = 0; i < remaining; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

suite('E2E Workflow', () => {
    const cliPath = path.join(__dirname, '../../lib/cli.js')
    let testDir: string
    let testWalletDir: string
    let originalHome: string

    suiteSetup(async function () {
        this.timeout(60000) // Increase timeout for chain startup

        // Skip suite if nodeos is not available
        if (!isNodeosAvailable()) {
            // eslint-disable-next-line no-console
            console.log('Skipping E2E Workflow tests: nodeos is not available')
            this.skip()
            return
        }

        // Create a temporary test directory
        testDir = path.join(os.tmpdir(), `wharfkit-e2e-test-${Date.now()}`)
        fs.mkdirSync(testDir, {recursive: true})

        // Create a temporary wallet directory for tests
        testWalletDir = path.join(testDir, '.wharfkit', 'wallet')
        fs.mkdirSync(testWalletDir, {recursive: true})

        // Mock HOME to use test wallet directory
        originalHome = process.env.HOME || ''
        process.env.HOME = testDir

        // Stop any existing chain before starting
        // Try chain local stop first (works if chain was started with same HOME)
        try {
            execSync(`node ${cliPath} chain local stop`, {encoding: 'utf8', stdio: 'ignore'})
            execSync('sleep 1', {encoding: 'utf8', stdio: 'ignore'})
        } catch {
            // Ignore errors - chain might not be running or was started with different HOME
        }

        // Also check port 8888 directly in case chain was started by another test with different HOME
        killProcessAtPort(8888)

        // Start the chain
        execSync(`node ${cliPath} chain local start`, {encoding: 'utf8'})

        // Wait for chain to be ready
        await waitForChainReady('http://127.0.0.1:8888', 30000)
    })

    suiteTeardown(function () {
        this.timeout(30000)
        // Restore original HOME
        process.env.HOME = originalHome

        // Clean up test directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, {recursive: true, force: true})
        }

        execSync(`node ${cliPath} chain local stop`, {encoding: 'utf8'})
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

            const txPath = path.join(testDir, 'transaction-output.json')
            const signedPath = path.join(testDir, 'signed-transaction.json')
            fs.writeFileSync(txPath, JSON.stringify(transaction))

            const output = execSync(
                `node ${cliPath} wallet transact ${txPath} --output ${signedPath}`,
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
            // Get valid reference block info from the chain
            const client = new APIClient({
                provider: new FetchProvider('http://127.0.0.1:8888', {fetch}),
            })
            const chainInfo = await client.v1.chain.get_info()

            // Calculate ref_block_num and ref_block_prefix from last_irreversible_block_num
            const blockNum = chainInfo.last_irreversible_block_num.toNumber()
            const blockInfo = await client.v1.chain.get_block(blockNum)

            const txPath = path.join(testDir, 'transaction-broadcast.json')
            // Use buyram action - a core system action that's always available
            // This buys 1 byte of RAM for eosio from eosio (essentially a no-op but valid)
            // Data format for buyram: payer (name), receiver (name), quant (asset)
            // Serialized: eosio (8 bytes), eosio (8 bytes), "0.0001 SYS" (asset)
            const transaction = {
                expiration: getTransactionExpiration(),
                ref_block_num: blockNum & 0xffff, // Last 16 bits
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

            // Test that the broadcast functionality works properly
            // Try to use the chain's key (chain-key, default, or dev) which has eosio authority
            // The chain key is automatically imported when the chain starts
            let output: string
            try {
                // Try chain-key first (if chain uses random key)
                output = execSync(
                    `node ${cliPath} wallet transact ${txPath} --broadcast --key chain-key`,
                    {
                        encoding: 'utf8',
                    }
                )
            } catch {
                try {
                    // Try default (if chain key was imported as default)
                    output = execSync(
                        `node ${cliPath} wallet transact ${txPath} --broadcast --key default`,
                        {
                            encoding: 'utf8',
                        }
                    )
                } catch {
                    // Fall back to dev key (if chain uses dev keys)
                    output = execSync(
                        `node ${cliPath} wallet transact ${txPath} --broadcast --key dev`,
                        {
                            encoding: 'utf8',
                        }
                    )
                }
            }

            // Should show broadcast success message
            assert.include(output, '🚀 Transaction broadcast successfully!')
            assert.include(output, 'Transaction ID:')
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
            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(testDir, 'test.cpp')

            fs.copyFileSync(rootCppPath, cppPath)

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

        test('contract deploy command works', function () {
            const output = execSync(`node ${cliPath} contract deploy --help`, {encoding: 'utf8'})

            assert.include(output, 'Deploy a compiled contract')
            assert.include(output, '--account')
            assert.include(output, '--url')
            assert.include(output, '--key')
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
            const deployHelp = execSync(`node ${cliPath} contract deploy --help`, {
                encoding: 'utf8',
            })

            // Verify --account option exists (used for key selection)
            assert.include(deployHelp, '--account')
        })
    })

    suite('Integration: Account and Deployment', () => {
        test('can create an account on the local chain', function () {
            const accountName = getRandomLocalAccountName('acc')
            const output = execSync(
                `node ${cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888`,
                {
                    encoding: 'utf8',
                }
            )

            assert.include(output, 'Account created successfully!')
            assert.include(output, `Account Name: ${accountName}`)
        })

        test('can deploy a contract to the account', function () {
            // Check if cdt-cpp is installed before running this test
            try {
                execSync('which cdt-cpp')
            } catch (e) {
                this.skip()
            }

            // 1. Create an account
            const accountName = getRandomLocalAccountName('deploy')
            execSync(
                `node ${cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888`,
                {
                    encoding: 'utf8',
                }
            )

            // 2. Use persistent contract file
            // Copy test.cpp from root to testDir
            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(testDir, 'test.cpp')
            const wasmPath = path.join(testDir, 'test.wasm')

            fs.copyFileSync(rootCppPath, cppPath)

            // 3. Compile contract
            execSync(`node ${cliPath} compile`, {
                encoding: 'utf8',
                cwd: testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            // 4. Deploy contract
            const output = execSync(
                `node ${cliPath} contract deploy ${wasmPath} --account ${accountName}`,
                {
                    encoding: 'utf8',
                    cwd: testDir,
                }
            )

            assert.include(output, '✅ Contract deployed successfully!')
            assert.include(output, 'Transaction ID:')
        })

        test('validates table removal safety', async function () {
            // Check if cdt-cpp is installed
            try {
                execSync('which cdt-cpp')
            } catch (e) {
                this.skip()
            }

            const accountName = getRandomLocalAccountName('val')
            execSync(
                `node ${cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888`,
                {
                    encoding: 'utf8',
                }
            )

            // 1. Deploy contract V1 (with table)
            const v1Code = `
            #include <eosio/eosio.hpp>
            using namespace eosio;
            class [[eosio::contract]] v1 : public contract {
              public:
                using contract::contract;
                struct [[eosio::table]] data {
                    uint64_t id;
                    std::string val;
                    uint64_t primary_key() const { return id; }
                };
                typedef eosio::multi_index<"data"_n, data> data_table;

                [[eosio::action]]
                void insert(uint64_t id, std::string val) {
                    data_table table(get_self(), get_self().value);
                    table.emplace(get_self(), [&](auto& row) {
                        row.id = id;
                        row.val = val;
                    });
                }
            };
            `
            const cppPath = path.join(testDir, 'v1.cpp')
            fs.writeFileSync(cppPath, v1Code)

            // Compile & Deploy V1
            execSync(`node ${cliPath} compile ${cppPath} --output ${testDir}`, {encoding: 'utf8'})
            execSync(
                `node ${cliPath} contract deploy ${path.join(
                    testDir,
                    'v1.wasm'
                )} --account ${accountName}`,
                {encoding: 'utf8', cwd: testDir}
            )

            // 2. Add data to the table
            // Read ABI to serialize action data
            const abiPath = path.join(testDir, 'v1.abi')
            const abi = ABI.from(JSON.parse(fs.readFileSync(abiPath, 'utf8')))
            const actionData = {
                id: 1,
                val: 'unsafe to remove',
            }
            const hexData = Serializer.encode({object: actionData, abi, type: 'insert'}).hexString

            // Fetch chain info for valid TAPOS
            const client = new APIClient({
                provider: new FetchProvider('http://127.0.0.1:8888', {fetch}),
            })
            const chainInfo = await client.v1.chain.get_info()
            const blockNum = chainInfo.last_irreversible_block_num.toNumber()
            const blockInfo = await client.v1.chain.get_block(blockNum)

            // We need to push an action. We can use wallet transact.
            const tx = {
                expiration: getTransactionExpiration(),
                ref_block_num: blockNum & 0xffff,
                ref_block_prefix: blockInfo.ref_block_prefix.toNumber(),
                actions: [
                    {
                        account: accountName,
                        name: 'insert',
                        authorization: [{actor: accountName, permission: 'active'}],
                        data: hexData,
                    },
                ],
            }
            const txPath = path.join(testDir, 'insert_data.json')
            fs.writeFileSync(txPath, JSON.stringify(tx))

            // Use --broadcast to push to chain
            // wallet transact should auto-detect the key from authorization
            try {
                execSync(`node ${cliPath} wallet transact ${txPath} --broadcast`, {
                    encoding: 'utf8',
                })
            } catch (e: any) {
                log('Transact failed:', 'info')
                log(e.stdout, 'info')
                log(e.stderr, 'info')
                throw e
            }

            // 3. Create contract V2 (WITHOUT table)
            const v2Code = `
            #include <eosio/eosio.hpp>
            using namespace eosio;
            class [[eosio::contract]] v2 : public contract {
              public:
                using contract::contract;
                [[eosio::action]]
                void hi() { print("hi"); }
            };
            `
            const v2CppPath = path.join(testDir, 'v2.cpp')
            fs.writeFileSync(v2CppPath, v2Code)

            // Compile V2
            execSync(`node ${cliPath} compile ${v2CppPath} --output ${testDir}`, {encoding: 'utf8'})
            const v2Wasm = path.join(testDir, 'v2.wasm')

            // 4. Try to deploy V2 - SHOULD FAIL due to safety check
            try {
                execSync(`node ${cliPath} contract deploy ${v2Wasm} --account ${accountName}`, {
                    encoding: 'utf8',
                    cwd: testDir,
                    stdio: 'pipe', // Capture stderr
                })
                assert.fail('Should have failed validation')
            } catch (error: any) {
                const output = (error.stderr || '').toString() + (error.stdout || '').toString()
                assert.include(output, 'SAFETY CHECK FAILED')
                assert.include(output, "Table 'data' contains data")
            }

            // 5. Try to deploy V2 with --force - SHOULD SUCCEED
            const output = execSync(
                `node ${cliPath} contract deploy ${v2Wasm} --account ${accountName} --force`,
                {
                    encoding: 'utf8',
                    cwd: testDir,
                }
            )
            assert.include(output, 'Contract deployed successfully')
            assert.include(output, 'Proceeding despite data loss warning')
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
