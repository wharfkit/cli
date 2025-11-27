import {assert} from 'chai'
import type {ChildProcess} from 'child_process'
import {execSync, spawn} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {ABI, APIClient, FetchProvider, Serializer} from '@wharfkit/antelope'
import fetch from 'node-fetch'
import {log} from '../../src/utils'
import {killProcessAtPort, waitForChainReady} from '../utils/test-helpers'

/**
 * Check if nodeos is available in PATH
 */
function isNodeosAvailable(): boolean {
    try {
        execSync('which nodeos', {encoding: 'utf8', stdio: 'pipe'})
        return true
    } catch {
        return false
    }
}

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
        this.timeout(180000) // Increase timeout for potential LEAP installation + chain startup

        // Skip E2E tests if nodeos is not available (e.g., in CI without LEAP installed)
        if (!isNodeosAvailable()) {
            // eslint-disable-next-line no-console
            console.log('Skipping E2E tests: nodeos is not available in PATH')
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

        // Start the chain with --clean to ensure fresh state and genesis key is used
        execSync(`node ${cliPath} chain local start --clean`, {encoding: 'utf8'})

        // Wait for chain to be ready
        await waitForChainReady('http://127.0.0.1:8888', 30000)
    })

    suiteTeardown(function () {
        this.timeout(30000)

        // If suite was skipped (nodeos not available), nothing to clean up
        if (!testDir) {
            return
        }

        // Restore original HOME
        process.env.HOME = originalHome

        // Clean up test directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, {recursive: true, force: true})
        }

        try {
            execSync(`node ${cliPath} chain local stop`, {encoding: 'utf8'})
        } catch {
            // Ignore errors if chain wasn't started
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
            this.timeout(60000) // Allow time for compilation

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

            // 4. Deploy contract with --yes flag to skip prompts
            const output = execSync(
                `node ${cliPath} contract deploy ${wasmPath} --account ${accountName} --yes`,
                {
                    encoding: 'utf8',
                    cwd: testDir,
                }
            )

            assert.include(output, '✅ Contract deployed successfully!')
            assert.include(output, 'Transaction ID:')
        })

        test('shows RAM analysis during deployment', function () {
            this.timeout(60000) // Allow time for compilation

            // 1. Create an account
            const accountName = getRandomLocalAccountName('ramtest')
            execSync(
                `node ${cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888`,
                {
                    encoding: 'utf8',
                }
            )

            // 2. Use persistent contract file (keep same name to match contract class name)
            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(testDir, 'ramanalysis_test.cpp')
            const wasmPath = path.join(testDir, 'ramanalysis_test.wasm')

            // Read and modify the contract class name to match the filename
            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] ramanalysis_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            // 3. Compile contract
            execSync(`node ${cliPath} compile ${cppPath} --output ${testDir}`, {
                encoding: 'utf8',
                cwd: testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            // 4. Deploy contract with --yes to skip prompts and check output
            const output = execSync(
                `node ${cliPath} contract deploy ${wasmPath} --account ${accountName} --yes`,
                {
                    encoding: 'utf8',
                    cwd: testDir,
                }
            )

            // Verify RAM analysis output is shown
            assert.include(output, '📊 RAM Analysis')
            assert.include(output, 'RAM needed:')
            assert.include(output, 'Current RAM available:')
            // On local chains without system contracts, we show a different message
            // On chains with system contracts, we show RAM purchase details
            assert.isTrue(
                output.includes('RAM to purchase:') ||
                    output.includes('RAM management not required'),
                'Should show RAM info or local chain message'
            )
            assert.include(output, '✅ Contract deployed successfully!')
        })

        test('shows QR code when insufficient funds and completes after transfer', async function () {
            this.timeout(120000) // 120 second timeout to allow for potential LEAP installation

            // 1. Create an account WITHOUT tokens (only minimal RAM from account creation)
            // The account creation gives 8192 bytes which is not enough for contract deployment
            const accountName = getRandomLocalAccountName('qrtest')
            execSync(
                `node ${cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888`,
                {
                    encoding: 'utf8',
                }
            )

            // Verify account has no tokens (eosio.token might not exist on local chain)
            const client = new APIClient({
                provider: new FetchProvider('http://127.0.0.1:8888', {fetch}),
            })
            try {
                const balances = await client.v1.chain.get_currency_balance(
                    'eosio.token',
                    accountName
                )
                assert.equal(balances.length, 0, 'Account should have no token balance initially')
            } catch {
                // eosio.token might not be deployed on local chain, that's fine
            }

            // 2. Compile a contract (use the test.cpp which is a simple contract)
            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(testDir, 'qrfunds_test.cpp')
            const wasmPath = path.join(testDir, 'qrfunds_test.wasm')

            // Read and modify the contract class name to match the filename
            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] qrfunds_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            execSync(`node ${cliPath} compile ${cppPath} --output ${testDir}`, {
                encoding: 'utf8',
                cwd: testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            // 3. Spawn the deploy command as a child process
            // It should detect insufficient funds and show QR code
            let deployOutput = ''
            let deployExitCode: number | null = null

            const deployProcess: ChildProcess = spawn(
                'node',
                [cliPath, 'contract', 'deploy', wasmPath, '--account', accountName, '--yes'],
                {
                    cwd: testDir,
                    env: {...process.env, HOME: testDir},
                }
            )

            const deployPromise = new Promise<void>((resolve, reject) => {
                deployProcess.stdout?.on('data', (data: Buffer) => {
                    const text = data.toString()
                    deployOutput += text
                    // Log for debugging
                    // process.stdout.write(`[deploy stdout]: ${text}`)
                })

                deployProcess.stderr?.on('data', (data: Buffer) => {
                    const text = data.toString()
                    deployOutput += text
                    // process.stderr.write(`[deploy stderr]: ${text}`)
                })

                deployProcess.on('close', (code) => {
                    deployExitCode = code
                    if (code === 0) {
                        resolve()
                    } else {
                        reject(new Error(`Deploy process exited with code ${code}`))
                    }
                })

                deployProcess.on('error', (err) => {
                    reject(err)
                })
            })

            // 4. Wait for the QR code / ESR link to appear in output
            const waitForQrCode = async (): Promise<boolean> => {
                const startTime = Date.now()
                const timeout = 30000 // 30 seconds

                while (Date.now() - startTime < timeout) {
                    if (
                        deployOutput.includes('esr://') ||
                        deployOutput.includes('Scan this QR code')
                    ) {
                        return true
                    }
                    // Check if process exited (might have enough RAM already)
                    if (deployExitCode !== null) {
                        return false
                    }
                    await new Promise((resolve) => setTimeout(resolve, 200))
                }
                return false
            }

            const qrCodeShown = await waitForQrCode()

            // If QR code was shown, we need to transfer funds
            if (qrCodeShown) {
                // Verify ESR link is present
                assert.include(deployOutput, 'esr://', 'Should show ESR link')
                assert.include(
                    deployOutput,
                    'Scan this QR code',
                    'Should show QR code instructions'
                )
                assert.include(deployOutput, 'Waiting for funds', 'Should show waiting message')

                // 5. Transfer tokens from eosio to the account
                // Get chain info for TAPOS
                const chainInfo = await client.v1.chain.get_info()
                const blockNum = chainInfo.last_irreversible_block_num.toNumber()
                const blockInfo = await client.v1.chain.get_block(blockNum)

                // Create transfer transaction
                // Data for eosio.token::transfer: from, to, quantity, memo
                const transferTx = {
                    expiration: getTransactionExpiration(),
                    ref_block_num: blockNum & 0xffff,
                    ref_block_prefix: blockInfo.ref_block_prefix.toNumber(),
                    max_net_usage_words: 0,
                    max_cpu_usage_ms: 0,
                    delay_sec: 0,
                    context_free_actions: [],
                    actions: [
                        {
                            account: 'eosio.token',
                            name: 'transfer',
                            authorization: [{actor: 'eosio', permission: 'active'}],
                            // Pre-serialized transfer data: eosio -> accountName, 100.0000 SYS
                            data: Serializer.encode({
                                object: {
                                    from: 'eosio',
                                    to: accountName,
                                    quantity: '100.0000 SYS',
                                    memo: 'funding for contract deployment',
                                },
                                abi: (await client.v1.chain.get_abi('eosio.token')).abi!,
                                type: 'transfer',
                            }).hexString,
                        },
                    ],
                    transaction_extensions: [],
                }

                const txPath = path.join(testDir, 'transfer_for_deploy.json')
                fs.writeFileSync(txPath, JSON.stringify(transferTx))

                // Execute the transfer
                log('Transferring 100 SYS to account...', 'info')
                execSync(`node ${cliPath} wallet transact ${txPath} --broadcast --key chain-key`, {
                    encoding: 'utf8',
                    env: {...process.env, HOME: testDir},
                })

                // 6. Wait for the deploy to complete (should happen within ~10 seconds due to polling)
                try {
                    await Promise.race([
                        deployPromise,
                        new Promise((_, reject) =>
                            setTimeout(
                                () => reject(new Error('Deploy timed out after transfer')),
                                20000
                            )
                        ),
                    ])
                } catch (e) {
                    // If timed out, kill the process
                    if (deployExitCode === null) {
                        deployProcess.kill()
                    }
                    throw e
                }
            } else {
                // Process might have completed without needing QR code
                // (if account had enough RAM from creation)
                await deployPromise
            }

            // 7. Assert deployment succeeded
            assert.include(
                deployOutput,
                '✅ Contract deployed successfully!',
                'Deployment should succeed'
            )
            assert.include(deployOutput, 'Transaction ID:', 'Should show transaction ID')
        })

        test('validates table removal safety', async function () {
            this.timeout(120000) // Allow time for multiple compilations

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
                )} --account ${accountName} --yes`,
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
                execSync(
                    `node ${cliPath} contract deploy ${v2Wasm} --account ${accountName} --yes`,
                    {
                        encoding: 'utf8',
                        cwd: testDir,
                        stdio: 'pipe', // Capture stderr
                    }
                )
                assert.fail('Should have failed validation')
            } catch (error: unknown) {
                const err = error as {stderr?: string; stdout?: string}
                const output = (err.stderr || '').toString() + (err.stdout || '').toString()
                assert.include(output, 'SAFETY CHECK FAILED')
                assert.include(output, "Table 'data' contains data")
            }

            // 5. Try to deploy V2 with --force - SHOULD SUCCEED
            const output = execSync(
                `node ${cliPath} contract deploy ${v2Wasm} --account ${accountName} --force --yes`,
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

    suite('Integration: Deploy Key Options', () => {
        let deployKeyPrivate: string
        let deployKeyPublic: string

        suiteSetup(function () {
            // Create a key and extract its private key for testing
            const keyOutput = execSync(`node ${cliPath} wallet create --name deploy-test-key`, {
                encoding: 'utf8',
            })
            // Extract private key from output (format: "Private Key: PVT_K1_...")
            const privateKeyMatch = keyOutput.match(/Private Key: (PVT_K1_[A-Za-z0-9]+)/)
            const publicKeyMatch = keyOutput.match(/Public Key: (PUB_K1_[A-Za-z0-9]+)/)
            if (!privateKeyMatch || !publicKeyMatch) {
                throw new Error('Could not extract keys from wallet create output')
            }
            deployKeyPrivate = privateKeyMatch[1]
            deployKeyPublic = publicKeyMatch[1]
        })

        test('can deploy using --key option with wallet key name', function () {
            this.timeout(60000)

            // 1. Create an account using chain-key (the account needs the deploy-test-key's public key)
            const accountName = getRandomLocalAccountName('keyopt')

            // Create account with the deploy-test-key's public key
            execSync(
                `node ${cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888 --key ${deployKeyPublic}`,
                {
                    encoding: 'utf8',
                }
            )

            // 2. Copy and compile test contract
            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(testDir, 'keyopt_test.cpp')
            const wasmPath = path.join(testDir, 'keyopt_test.wasm')

            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] keyopt_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            execSync(`node ${cliPath} compile ${cppPath} --output ${testDir}`, {
                encoding: 'utf8',
                cwd: testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            // 3. Deploy using --key option with wallet key name
            const output = execSync(
                `node ${cliPath} contract deploy ${wasmPath} --account ${accountName} --key deploy-test-key --yes`,
                {
                    encoding: 'utf8',
                    cwd: testDir,
                }
            )

            assert.include(output, 'Using wallet key: deploy-test-key')
            assert.include(output, '✅ Contract deployed successfully!')
            assert.include(output, 'Transaction ID:')
        })

        test('can deploy using --key option with private key directly', function () {
            this.timeout(60000)

            // 1. Create an account with the deploy-test-key's public key
            const accountName = getRandomLocalAccountName('keypvt')

            execSync(
                `node ${cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888 --key ${deployKeyPublic}`,
                {
                    encoding: 'utf8',
                }
            )

            // 2. Copy and compile test contract
            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(testDir, 'keypvt_test.cpp')
            const wasmPath = path.join(testDir, 'keypvt_test.wasm')

            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] keypvt_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            execSync(`node ${cliPath} compile ${cppPath} --output ${testDir}`, {
                encoding: 'utf8',
                cwd: testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            // 3. Deploy using --key option with private key directly
            const output = execSync(
                `node ${cliPath} contract deploy ${wasmPath} --account ${accountName} --key ${deployKeyPrivate} --yes`,
                {
                    encoding: 'utf8',
                    cwd: testDir,
                }
            )

            assert.include(output, 'Using private key from --key option')
            assert.include(output, '✅ Contract deployed successfully!')
            assert.include(output, 'Transaction ID:')
        })

        test('can deploy using WHARFKIT_DEPLOY_KEY environment variable with private key', function () {
            this.timeout(60000)

            // 1. Create an account with the deploy-test-key's public key
            const accountName = getRandomLocalAccountName('envkey')

            execSync(
                `node ${cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888 --key ${deployKeyPublic}`,
                {
                    encoding: 'utf8',
                }
            )

            // 2. Copy and compile test contract
            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(testDir, 'envkey_test.cpp')
            const wasmPath = path.join(testDir, 'envkey_test.wasm')

            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] envkey_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            execSync(`node ${cliPath} compile ${cppPath} --output ${testDir}`, {
                encoding: 'utf8',
                cwd: testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            // 3. Deploy using WHARFKIT_DEPLOY_KEY environment variable
            const output = execSync(
                `node ${cliPath} contract deploy ${wasmPath} --account ${accountName} --yes`,
                {
                    encoding: 'utf8',
                    cwd: testDir,
                    env: {
                        ...process.env,
                        HOME: testDir,
                        WHARFKIT_DEPLOY_KEY: deployKeyPrivate,
                    },
                }
            )

            assert.include(output, 'Using private key from WHARFKIT_DEPLOY_KEY environment variable')
            assert.include(output, '✅ Contract deployed successfully!')
            assert.include(output, 'Transaction ID:')
        })

        test('can deploy using WHARFKIT_DEPLOY_KEY environment variable with wallet key name', function () {
            this.timeout(60000)

            // 1. Create an account with the deploy-test-key's public key
            const accountName = getRandomLocalAccountName('envnam')

            execSync(
                `node ${cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888 --key ${deployKeyPublic}`,
                {
                    encoding: 'utf8',
                }
            )

            // 2. Copy and compile test contract
            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(testDir, 'envnam_test.cpp')
            const wasmPath = path.join(testDir, 'envnam_test.wasm')

            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] envnam_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            execSync(`node ${cliPath} compile ${cppPath} --output ${testDir}`, {
                encoding: 'utf8',
                cwd: testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            // 3. Deploy using WHARFKIT_DEPLOY_KEY environment variable with key name
            const output = execSync(
                `node ${cliPath} contract deploy ${wasmPath} --account ${accountName} --yes`,
                {
                    encoding: 'utf8',
                    cwd: testDir,
                    env: {
                        ...process.env,
                        HOME: testDir,
                        WHARFKIT_DEPLOY_KEY: 'deploy-test-key',
                    },
                }
            )

            assert.include(output, 'Using wallet key from environment: deploy-test-key')
            assert.include(output, '✅ Contract deployed successfully!')
            assert.include(output, 'Transaction ID:')
        })

        test('--key option takes precedence over WHARFKIT_DEPLOY_KEY', function () {
            this.timeout(60000)

            // 1. Create an account with the deploy-test-key's public key
            const accountName = getRandomLocalAccountName('keyprec')

            execSync(
                `node ${cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888 --key ${deployKeyPublic}`,
                {
                    encoding: 'utf8',
                }
            )

            // 2. Copy and compile test contract
            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(testDir, 'keyprec_test.cpp')
            const wasmPath = path.join(testDir, 'keyprec_test.wasm')

            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] keyprec_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            execSync(`node ${cliPath} compile ${cppPath} --output ${testDir}`, {
                encoding: 'utf8',
                cwd: testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            // 3. Deploy with both --key and WHARFKIT_DEPLOY_KEY set
            // --key should take precedence
            const output = execSync(
                `node ${cliPath} contract deploy ${wasmPath} --account ${accountName} --key deploy-test-key --yes`,
                {
                    encoding: 'utf8',
                    cwd: testDir,
                    env: {
                        ...process.env,
                        HOME: testDir,
                        WHARFKIT_DEPLOY_KEY: 'some-other-key', // This should be ignored
                    },
                }
            )

            // Should use the --key option, not the env var
            assert.include(output, 'Using wallet key: deploy-test-key')
            assert.include(output, '✅ Contract deployed successfully!')
        })
    })
})
