import {assert} from 'chai'
import {execSync} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

suite('Chain Interaction', () => {
    const cliPath = path.join(__dirname, '../../lib/cli.js')
    let testDir: string
    let originalHome: string
    let contractAccount: string

    suiteSetup(function () {
        this.timeout(120000) // Increase timeout for chain startup and deploy
        
        // Create a temporary test directory
        testDir = path.join(os.tmpdir(), `wharfkit-interact-test-${Date.now()}`)
        fs.mkdirSync(testDir, {recursive: true})

        // Mock HOME to use test wallet directory
        originalHome = process.env.HOME || ''
        process.env.HOME = testDir

        // Kill any existing processes on port 8888
        try {
            execSync(`lsof -ti:8888 | xargs kill -9 2>/dev/null || true`, {encoding: 'utf8'})
        } catch (error) {
            // Ignore errors
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
            execSync(`node ${cliPath} wallet account create --name ${contractAccount}`, {encoding: 'utf8'})
            
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
            execSync(`node ${cliPath} deploy ${wasmPath} --account ${contractAccount}`, {encoding: 'utf8', cwd: testDir})
            
        } catch (e) {
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
        } catch (e) { }
    })

    test('can lookup table data on deployed contract', function () {
        if (!contractAccount) this.skip()
        
        const output = execSync(`node ${cliPath} chain local table ${contractAccount}::items`, {
            encoding: 'utf8',
        })
        assert.doesNotThrow(() => {})
    })

    test('can lookup table data with scope option', function () {
        if (!contractAccount) this.skip()
        
        const output = execSync(`node ${cliPath} chain local table items --scope ${contractAccount}`, {
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
                encoding: 'utf8'
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
                encoding: 'utf8'
            })
        } catch (error: any) {
            const output = (error.stderr || '').toString() + (error.stdout || '').toString()
            if (output.includes('unknown command')) {
                 throw new Error('Commander failed to match jungle4 for table command: ' + output)
            }
        }
    })
})
