import {assert} from 'chai'
import type {ChildProcess} from 'child_process'
import {execSync, spawn} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import {ABI, APIClient, FetchProvider, Serializer} from '@wharfkit/antelope'
import fetch from 'node-fetch'
import {log} from '../../src/utils'
import {
    E2ETestContext,
    setupE2ETestEnvironment,
    teardownE2ETestEnvironment,
    getTransactionExpiration,
    getRandomLocalAccountName,
} from '../utils/test-helpers'

/**
 * E2E tests for deployment functionality:
 * - Key selection logic
 * - Account creation
 * - Contract deployment
 * - RAM analysis
 * - Deploy key options (--key, env vars)
 */
suite('E2E: Deploy', () => {
    let ctx: E2ETestContext | null = null

    suiteSetup(async function () {
        ctx = await setupE2ETestEnvironment(this)
    })

    suiteTeardown(function () {
        this.timeout(30000)
        teardownE2ETestEnvironment(ctx)
    })

    suite('Key Selection Logic', () => {
        test('deploy command has --account option for key selection', function () {
            if (!ctx) this.skip()
            const deployHelp = execSync(`node ${ctx.cliPath} contract deploy --help`, {
                encoding: 'utf8',
            })

            assert.include(deployHelp, '--account')
        })

        test('deploy auto-selects key matching account name', function () {
            if (!ctx) this.skip()
            this.timeout(60000)

            const accountName = getRandomLocalAccountName('autokey')

            // 1. Create a key with the SAME name as the account
            const keyOutput = execSync(`node ${ctx.cliPath} wallet create --name ${accountName}`, {
                encoding: 'utf8',
            })

            const publicKeyMatch = keyOutput.match(/Public Key: (PUB_K1_[A-Za-z0-9]+)/)
            assert.isNotNull(publicKeyMatch, 'Should have public key in output')
            const accountKeyPublic = publicKeyMatch![1]

            // 2. Create account with the matching key's public key
            execSync(
                `node ${ctx.cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888 --key ${accountKeyPublic}`,
                {encoding: 'utf8'}
            )

            // 3. Copy and compile test contract
            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(ctx.testDir, 'autokey_test.cpp')
            const wasmPath = path.join(ctx.testDir, 'autokey_test.wasm')

            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] autokey_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            execSync(`node ${ctx.cliPath} compile ${cppPath} --output ${ctx.testDir}`, {
                encoding: 'utf8',
                cwd: ctx.testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            // 4. Deploy WITHOUT specifying --key
            const output = execSync(
                `node ${ctx.cliPath} contract deploy ${wasmPath} --account ${accountName} --yes`,
                {
                    encoding: 'utf8',
                    cwd: ctx.testDir,
                }
            )

            assert.include(output, `Using wallet key: ${accountName}`)
            assert.include(output, '✅ Contract deployed successfully!')
            assert.include(output, 'Transaction ID:')
        })
    })

    suite('Account and Deployment', () => {
        test('can create an account on the local chain', function () {
            if (!ctx) this.skip()
            const accountName = getRandomLocalAccountName('acc')
            const output = execSync(
                `node ${ctx.cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888`,
                {encoding: 'utf8'}
            )

            assert.include(output, 'Account created successfully!')
            assert.include(output, `Account Name: ${accountName}`)
        })

        test('can deploy a contract to the account', function () {
            if (!ctx) this.skip()
            this.timeout(60000)

            const accountName = getRandomLocalAccountName('deploy')
            execSync(
                `node ${ctx.cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888`,
                {encoding: 'utf8'}
            )

            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(ctx.testDir, 'test.cpp')
            const wasmPath = path.join(ctx.testDir, 'test.wasm')

            fs.copyFileSync(rootCppPath, cppPath)

            execSync(`node ${ctx.cliPath} compile`, {
                encoding: 'utf8',
                cwd: ctx.testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            const output = execSync(
                `node ${ctx.cliPath} contract deploy ${wasmPath} --account ${accountName} --yes`,
                {
                    encoding: 'utf8',
                    cwd: ctx.testDir,
                }
            )

            assert.include(output, '✅ Contract deployed successfully!')
            assert.include(output, 'Transaction ID:')
        })

        test('shows RAM analysis during deployment', function () {
            if (!ctx) this.skip()
            this.timeout(60000)

            const accountName = getRandomLocalAccountName('ramtest')
            execSync(
                `node ${ctx.cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888`,
                {encoding: 'utf8'}
            )

            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(ctx.testDir, 'ramanalysis_test.cpp')
            const wasmPath = path.join(ctx.testDir, 'ramanalysis_test.wasm')

            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] ramanalysis_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            execSync(`node ${ctx.cliPath} compile ${cppPath} --output ${ctx.testDir}`, {
                encoding: 'utf8',
                cwd: ctx.testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            const output = execSync(
                `node ${ctx.cliPath} contract deploy ${wasmPath} --account ${accountName} --yes`,
                {
                    encoding: 'utf8',
                    cwd: ctx.testDir,
                }
            )

            assert.include(output, '📊 RAM Analysis')
            assert.include(output, 'RAM needed:')
            assert.include(output, 'Current RAM available:')
            assert.isTrue(
                output.includes('RAM to purchase:') ||
                    output.includes('RAM management not required'),
                'Should show RAM info or local chain message'
            )
            assert.include(output, '✅ Contract deployed successfully!')
        })

        test('shows QR code when insufficient funds and completes after transfer', async function () {
            if (!ctx) this.skip()
            this.timeout(120000)

            const accountName = getRandomLocalAccountName('qrtest')
            execSync(
                `node ${ctx.cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888`,
                {encoding: 'utf8'}
            )

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
                // eosio.token might not be deployed on local chain
            }

            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(ctx.testDir, 'qrfunds_test.cpp')
            const wasmPath = path.join(ctx.testDir, 'qrfunds_test.wasm')

            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] qrfunds_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            execSync(`node ${ctx.cliPath} compile ${cppPath} --output ${ctx.testDir}`, {
                encoding: 'utf8',
                cwd: ctx.testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            let deployOutput = ''
            let deployExitCode: number | null = null

            const deployProcess: ChildProcess = spawn(
                'node',
                [ctx.cliPath, 'contract', 'deploy', wasmPath, '--account', accountName, '--yes'],
                {
                    cwd: ctx.testDir,
                    env: {...process.env, HOME: ctx.testDir},
                }
            )

            const deployPromise = new Promise<void>((resolve, reject) => {
                deployProcess.stdout?.on('data', (data: Buffer) => {
                    deployOutput += data.toString()
                })

                deployProcess.stderr?.on('data', (data: Buffer) => {
                    deployOutput += data.toString()
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

            const waitForQrCode = async (): Promise<boolean> => {
                const startTime = Date.now()
                const timeout = 30000

                while (Date.now() - startTime < timeout) {
                    if (
                        deployOutput.includes('esr://') ||
                        deployOutput.includes('Scan this QR code')
                    ) {
                        return true
                    }
                    if (deployExitCode !== null) {
                        return false
                    }
                    await new Promise((resolve) => setTimeout(resolve, 200))
                }
                return false
            }

            const qrCodeShown = await waitForQrCode()

            if (qrCodeShown) {
                assert.include(deployOutput, 'esr://', 'Should show ESR link')
                assert.include(deployOutput, 'Scan this QR code', 'Should show QR code instructions')
                assert.include(deployOutput, 'Waiting for funds', 'Should show waiting message')

                const chainInfo = await client.v1.chain.get_info()
                const blockNum = chainInfo.last_irreversible_block_num.toNumber()
                const blockInfo = await client.v1.chain.get_block(blockNum)

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

                const txPath = path.join(ctx.testDir, 'transfer_for_deploy.json')
                fs.writeFileSync(txPath, JSON.stringify(transferTx))

                log('Transferring 100 SYS to account...', 'info')
                execSync(`node ${ctx.cliPath} wallet transact ${txPath} --broadcast --key chain-key`, {
                    encoding: 'utf8',
                    env: {...process.env, HOME: ctx.testDir},
                })

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
                    if (deployExitCode === null) {
                        deployProcess.kill()
                    }
                    throw e
                }
            } else {
                await deployPromise
            }

            assert.include(deployOutput, '✅ Contract deployed successfully!', 'Deployment should succeed')
            assert.include(deployOutput, 'Transaction ID:', 'Should show transaction ID')
        })

        test('validates table removal safety', async function () {
            if (!ctx) this.skip()
            this.timeout(120000)

            const accountName = getRandomLocalAccountName('val')
            execSync(
                `node ${ctx.cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888`,
                {encoding: 'utf8'}
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
            const cppPath = path.join(ctx.testDir, 'v1.cpp')
            fs.writeFileSync(cppPath, v1Code)

            execSync(`node ${ctx.cliPath} compile ${cppPath} --output ${ctx.testDir}`, {encoding: 'utf8'})
            execSync(
                `node ${ctx.cliPath} contract deploy ${path.join(ctx.testDir, 'v1.wasm')} --account ${accountName} --yes`,
                {encoding: 'utf8', cwd: ctx.testDir}
            )

            // 2. Add data to the table
            const abiPath = path.join(ctx.testDir, 'v1.abi')
            const abi = ABI.from(JSON.parse(fs.readFileSync(abiPath, 'utf8')))
            const actionData = {id: 1, val: 'unsafe to remove'}
            const hexData = Serializer.encode({object: actionData, abi, type: 'insert'}).hexString

            const client = new APIClient({
                provider: new FetchProvider('http://127.0.0.1:8888', {fetch}),
            })
            const chainInfo = await client.v1.chain.get_info()
            const blockNum = chainInfo.last_irreversible_block_num.toNumber()
            const blockInfo = await client.v1.chain.get_block(blockNum)

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
            const txPath = path.join(ctx.testDir, 'insert_data.json')
            fs.writeFileSync(txPath, JSON.stringify(tx))

            try {
                execSync(`node ${ctx.cliPath} wallet transact ${txPath} --broadcast`, {
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
            const v2CppPath = path.join(ctx.testDir, 'v2.cpp')
            fs.writeFileSync(v2CppPath, v2Code)

            execSync(`node ${ctx.cliPath} compile ${v2CppPath} --output ${ctx.testDir}`, {encoding: 'utf8'})
            const v2Wasm = path.join(ctx.testDir, 'v2.wasm')

            // 4. Try to deploy V2 - SHOULD FAIL
            try {
                execSync(
                    `node ${ctx.cliPath} contract deploy ${v2Wasm} --account ${accountName} --yes`,
                    {
                        encoding: 'utf8',
                        cwd: ctx.testDir,
                        stdio: 'pipe',
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
                `node ${ctx.cliPath} contract deploy ${v2Wasm} --account ${accountName} --force --yes`,
                {
                    encoding: 'utf8',
                    cwd: ctx.testDir,
                }
            )
            assert.include(output, 'Contract deployed successfully')
            assert.include(output, 'Proceeding despite data loss warning')
        })
    })

    suite('Deploy Key Options', () => {
        let deployKeyPrivate: string
        let deployKeyPublic: string

        suiteSetup(function () {
            if (!ctx) return
            const keyOutput = execSync(`node ${ctx.cliPath} wallet create --name deploy-test-key`, {
                encoding: 'utf8',
            })
            const privateKeyMatch = keyOutput.match(/Private Key: (PVT_K1_[A-Za-z0-9]+)/)
            const publicKeyMatch = keyOutput.match(/Public Key: (PUB_K1_[A-Za-z0-9]+)/)
            if (!privateKeyMatch || !publicKeyMatch) {
                throw new Error('Could not extract keys from wallet create output')
            }
            deployKeyPrivate = privateKeyMatch[1]
            deployKeyPublic = publicKeyMatch[1]
        })

        test('can deploy using --key option with wallet key name', function () {
            if (!ctx) this.skip()
            this.timeout(60000)

            const accountName = getRandomLocalAccountName('keyopt')

            execSync(
                `node ${ctx.cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888 --key ${deployKeyPublic}`,
                {encoding: 'utf8'}
            )

            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(ctx.testDir, 'keyopt_test.cpp')
            const wasmPath = path.join(ctx.testDir, 'keyopt_test.wasm')

            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] keyopt_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            execSync(`node ${ctx.cliPath} compile ${cppPath} --output ${ctx.testDir}`, {
                encoding: 'utf8',
                cwd: ctx.testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            const output = execSync(
                `node ${ctx.cliPath} contract deploy ${wasmPath} --account ${accountName} --key deploy-test-key --yes`,
                {
                    encoding: 'utf8',
                    cwd: ctx.testDir,
                }
            )

            assert.include(output, 'Using wallet key: deploy-test-key')
            assert.include(output, '✅ Contract deployed successfully!')
            assert.include(output, 'Transaction ID:')
        })

        test('can deploy using --key option with private key directly', function () {
            if (!ctx) this.skip()
            this.timeout(60000)

            const accountName = getRandomLocalAccountName('keypvt')

            execSync(
                `node ${ctx.cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888 --key ${deployKeyPublic}`,
                {encoding: 'utf8'}
            )

            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(ctx.testDir, 'keypvt_test.cpp')
            const wasmPath = path.join(ctx.testDir, 'keypvt_test.wasm')

            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] keypvt_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            execSync(`node ${ctx.cliPath} compile ${cppPath} --output ${ctx.testDir}`, {
                encoding: 'utf8',
                cwd: ctx.testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            const output = execSync(
                `node ${ctx.cliPath} contract deploy ${wasmPath} --account ${accountName} --key ${deployKeyPrivate} --yes`,
                {
                    encoding: 'utf8',
                    cwd: ctx.testDir,
                }
            )

            assert.include(output, 'Using private key from --key option')
            assert.include(output, '✅ Contract deployed successfully!')
            assert.include(output, 'Transaction ID:')
        })

        test('can deploy using WHARFKIT_DEPLOY_KEY environment variable with private key', function () {
            if (!ctx) this.skip()
            this.timeout(60000)

            const accountName = getRandomLocalAccountName('envkey')

            execSync(
                `node ${ctx.cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888 --key ${deployKeyPublic}`,
                {encoding: 'utf8'}
            )

            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(ctx.testDir, 'envkey_test.cpp')
            const wasmPath = path.join(ctx.testDir, 'envkey_test.wasm')

            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] envkey_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            execSync(`node ${ctx.cliPath} compile ${cppPath} --output ${ctx.testDir}`, {
                encoding: 'utf8',
                cwd: ctx.testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            const output = execSync(
                `node ${ctx.cliPath} contract deploy ${wasmPath} --account ${accountName} --yes`,
                {
                    encoding: 'utf8',
                    cwd: ctx.testDir,
                    env: {
                        ...process.env,
                        HOME: ctx.testDir,
                        WHARFKIT_DEPLOY_KEY: deployKeyPrivate,
                    },
                }
            )

            assert.include(output, 'Using private key from WHARFKIT_DEPLOY_KEY environment variable')
            assert.include(output, '✅ Contract deployed successfully!')
            assert.include(output, 'Transaction ID:')
        })

        test('can deploy using WHARFKIT_DEPLOY_KEY environment variable with wallet key name', function () {
            if (!ctx) this.skip()
            this.timeout(60000)

            const accountName = getRandomLocalAccountName('envnam')

            execSync(
                `node ${ctx.cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888 --key ${deployKeyPublic}`,
                {encoding: 'utf8'}
            )

            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(ctx.testDir, 'envnam_test.cpp')
            const wasmPath = path.join(ctx.testDir, 'envnam_test.wasm')

            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] envnam_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            execSync(`node ${ctx.cliPath} compile ${cppPath} --output ${ctx.testDir}`, {
                encoding: 'utf8',
                cwd: ctx.testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            const output = execSync(
                `node ${ctx.cliPath} contract deploy ${wasmPath} --account ${accountName} --yes`,
                {
                    encoding: 'utf8',
                    cwd: ctx.testDir,
                    env: {
                        ...process.env,
                        HOME: ctx.testDir,
                        WHARFKIT_DEPLOY_KEY: 'deploy-test-key',
                    },
                }
            )

            assert.include(output, 'Using wallet key from environment: deploy-test-key')
            assert.include(output, '✅ Contract deployed successfully!')
            assert.include(output, 'Transaction ID:')
        })

        test('--key option takes precedence over WHARFKIT_DEPLOY_KEY', function () {
            if (!ctx) this.skip()
            this.timeout(60000)

            const accountName = getRandomLocalAccountName('keyprec')

            execSync(
                `node ${ctx.cliPath} wallet account create --name ${accountName} --url http://127.0.0.1:8888 --key ${deployKeyPublic}`,
                {encoding: 'utf8'}
            )

            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(ctx.testDir, 'keyprec_test.cpp')
            const wasmPath = path.join(ctx.testDir, 'keyprec_test.wasm')

            const contractCode = fs.readFileSync(rootCppPath, 'utf8')
            const modifiedCode = contractCode.replace(
                /class \[\[eosio::contract\]\] test/,
                'class [[eosio::contract]] keyprec_test'
            )
            fs.writeFileSync(cppPath, modifiedCode)

            execSync(`node ${ctx.cliPath} compile ${cppPath} --output ${ctx.testDir}`, {
                encoding: 'utf8',
                cwd: ctx.testDir,
            })

            assert.isTrue(fs.existsSync(wasmPath), 'WASM file should be generated')

            const output = execSync(
                `node ${ctx.cliPath} contract deploy ${wasmPath} --account ${accountName} --key deploy-test-key --yes`,
                {
                    encoding: 'utf8',
                    cwd: ctx.testDir,
                    env: {
                        ...process.env,
                        HOME: ctx.testDir,
                        WHARFKIT_DEPLOY_KEY: 'some-other-key',
                    },
                }
            )

            assert.include(output, 'Using wallet key: deploy-test-key')
            assert.include(output, '✅ Contract deployed successfully!')
        })
    })
})

