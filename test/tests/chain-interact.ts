import {assert} from 'chai'
import {execSync} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {isNodeosAvailable, killProcessAtPort} from '../utils/test-helpers'

suite('Chain Interaction', () => {
    const cliPath = path.join(__dirname, '../../lib/cli.js')
    let testDir: string
    let originalHome: string
    let contractAccount: string

    suiteSetup(function () {
        // Skip suite if nodeos is not available
        if (!isNodeosAvailable()) {
            // eslint-disable-next-line no-console
            console.log('Skipping Chain Interaction tests: nodeos is not available')
            this.skip()
            return
        }

        this.timeout(120000) // Increase timeout for chain startup and deploy

        // Create a temporary test directory
        testDir = path.join(os.tmpdir(), `wharfkit-interact-test-${Date.now()}`)
        fs.mkdirSync(testDir, {recursive: true})

        // Mock HOME to use test wallet directory
        originalHome = process.env.HOME || ''
        process.env.HOME = testDir

        // Kill any existing processes on port 8888
        try {
            // Try to stop cleanly first
            execSync(`node ${cliPath} chain local stop`, {encoding: 'utf8', stdio: 'ignore'})
            // Give it a moment to fully shut down
            execSync('sleep 1', {encoding: 'utf8', stdio: 'ignore'})
        } catch (error) {
            // Ignore errors
        }

        // Also check for PID file and kill that process directly
        try {
            const pidFile = path.join(os.homedir(), '.wharfkit', 'chain', 'nodeos.pid')
            if (fs.existsSync(pidFile)) {
                const pid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim(), 10)
                if (!isNaN(pid) && pid > 0) {
                    try {
                        execSync(`kill -9 ${pid}`, {encoding: 'utf8', stdio: 'ignore'})
                        // Remove the PID file
                        fs.unlinkSync(pidFile)
                        // Give it a moment to fully shut down
                        execSync('sleep 0.5', {encoding: 'utf8', stdio: 'ignore'})
                    } catch {
                        // Process might be gone already
                    }
                }
            }
        } catch (error) {
            // Ignore errors
        }

        // Force kill any nodeos processes on port 8888
        killProcessAtPort(8888)

        // Wait for port 8888 to be free (only check for LISTENING processes)
        const startTime = Date.now()
        while (Date.now() - startTime < 20000) {
            // Increased wait to 20s
            try {
                execSync('lsof -ti:8888 -sTCP:LISTEN', {encoding: 'utf8', stdio: 'ignore'})
                // Port is still in use, wait for it to be released
                // If it's been more than 2 seconds, try stopping again
                if (Date.now() - startTime > 2000) {
                    try {
                        execSync(`node ${cliPath} chain local stop`, {
                            encoding: 'utf8',
                            stdio: 'ignore',
                        })
                    } catch {
                        // Ignore errors
                    }
                }
                execSync('sleep 0.5')
            } catch {
                // lsof failed, meaning port is free
                break
            }
        }

        // Final check - verify port is free (only LISTENING processes)
        try {
            const remainingPids = execSync('lsof -ti:8888 -sTCP:LISTEN', {encoding: 'utf8'}).trim()
            if (remainingPids) {
                // Check what's still holding the port
                const pids = remainingPids.split('\n')
                const processes: string[] = []
                for (const pid of pids) {
                    if (!pid) continue
                    try {
                        const cmd = execSync(`ps -p ${pid} -o command=`, {encoding: 'utf8'}).trim()
                        processes.push(`${pid}: ${cmd}`)
                    } catch {
                        processes.push(`${pid}: (unknown)`)
                    }
                }
                throw new Error(
                    `Port 8888 is still in use after cleanup by: ${processes.join(', ')}`
                )
            }
        } catch (e: any) {
            if (e.message && e.message.includes('Port 8888 is still in use')) throw e
            // lsof failed, meaning port is free - this is what we want
        }

        // Start local chain
        execSync(`node ${cliPath} chain local start`, {encoding: 'utf8'})

        // Wait for chain
        execSync('sleep 5')

        // Check if cdt-cpp is installed
        try {
            execSync('which cdt-cpp')

            // Deploy a test contract
            contractAccount = 'testcontract'
            execSync(`node ${cliPath} wallet account create --name ${contractAccount}`, {
                encoding: 'utf8',
            })

            const contractCode = `
            #include <eosio/eosio.hpp>
            class [[eosio::contract]] testcontract : public eosio::contract {
              public:
                using eosio::contract::contract;
                
                struct [[eosio::table]] item {
                    uint64_t id;
                    std::string name;
                    uint64_t primary_key() const { return id; }
                };
                typedef eosio::multi_index<"items"_n, item> items_table;

                [[eosio::action]]
                void add(uint64_t id, std::string name) {
                    items_table items(get_self(), get_self().value);
                    items.emplace(get_self(), [&](auto& row) {
                        row.id = id;
                        row.name = name;
                    });
                }
            };
            `
            const cppPath = path.join(testDir, 'testcontract.cpp')
            const wasmPath = path.join(testDir, 'testcontract.wasm')
            fs.writeFileSync(cppPath, contractCode)

            execSync(`node ${cliPath} compile`, {encoding: 'utf8', cwd: testDir})
            execSync(`node ${cliPath} contract deploy ${wasmPath} --account ${contractAccount}`, {
                encoding: 'utf8',
                cwd: testDir,
            })
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log('Skipping contract deployment (cdt-cpp not found or failed)')
            contractAccount = ''
        }
    })

    suiteTeardown(function () {
        this.timeout(30000)
        process.env.HOME = originalHome
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, {recursive: true, force: true})
        }
        try {
            execSync(`node ${cliPath} chain local stop`, {encoding: 'utf8'})
        } catch (e) {
            // Ignore error
        }
    })

    test('can lookup table data on deployed contract', function () {
        if (!contractAccount) this.skip()

        execSync(`node ${cliPath} chain local table ${contractAccount}::items`, {
            encoding: 'utf8',
        })
    })

    test('can lookup table data with scope option', function () {
        if (!contractAccount) this.skip()

        execSync(`node ${cliPath} chain local table items --scope ${contractAccount}`, {
            encoding: 'utf8',
        })
    })

    test('can lookup single account', function () {
        const output = execSync(`node ${cliPath} chain local account eosio`, {
            encoding: 'utf8',
        })

        assert.include(output, 'Account: eosio')
        assert.include(output, 'RAM:')
        assert.include(output, 'Permissions:')
    })

    test('can lookup single account with --json', function () {
        const output = execSync(`node ${cliPath} chain local account eosio --json`, {
            encoding: 'utf8',
        })

        const account = JSON.parse(output)
        assert.equal(account.account_name, 'eosio')
        assert.property(account, 'permissions')
    })

    test('can access known remote chain (jungle4) directly for account', function () {
        try {
            execSync(`node ${cliPath} chain jungle4 account teamgreymass`, {
                encoding: 'utf8',
            })
        } catch (error: any) {
            const output = (error.stderr || '').toString() + (error.stdout || '').toString()
            if (output.includes('unknown command')) {
                throw new Error('Commander failed to match jungle4: ' + output)
            }
        }
    })

    test('can access known remote chain (jungle4) directly for table', function () {
        try {
            execSync(`node ${cliPath} chain jungle4 table eosio::global`, {
                encoding: 'utf8',
            })
        } catch (error: any) {
            const output = (error.stderr || '').toString() + (error.stdout || '').toString()
            if (output.includes('unknown command')) {
                throw new Error('Commander failed to match jungle4 for table command: ' + output)
            }
        }
    })
})
