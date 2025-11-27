import {assert} from 'chai'
import sinon from 'sinon'
import {ABI, Asset, Name, UInt64} from '@wharfkit/antelope'

import {getApiUrl, lookupContractInfo} from 'src/commands/contract/info'

import eosioTokenAbi from '../data/abis/eosio.token.json'
import rewardsGmAbi from '../data/abis/rewards.gm.json'

suite('Contract Info', function () {
    let sandbox: sinon.SinonSandbox
    let consoleLogStub: sinon.SinonStub
    let consoleErrorStub: sinon.SinonStub
    let processExitStub: sinon.SinonStub

    setup(function () {
        sandbox = sinon.createSandbox()
        consoleLogStub = sandbox.stub(console, 'log')
        consoleErrorStub = sandbox.stub(console, 'error')
        processExitStub = sandbox.stub(process, 'exit')
    })

    teardown(function () {
        sandbox.restore()
    })

    suite('getApiUrl', function () {
        test('returns URL for known chain "EOS"', function () {
            const url = getApiUrl('EOS')
            assert.isString(url)
            assert.include(url, 'http')
        })

        test('returns URL for known chain case-insensitive', function () {
            const url = getApiUrl('eos')
            assert.isString(url)
            assert.include(url, 'http')
        })

        test('returns URL for Jungle4', function () {
            const url = getApiUrl('Jungle4')
            assert.isString(url)
            assert.include(url, 'http')
        })

        test('returns localhost URL for "local" chain', function () {
            const url = getApiUrl('local')
            assert.equal(url, 'http://127.0.0.1:8888')
        })

        test('returns custom URL when provided', function () {
            const customUrl = 'http://my-custom-node.com:8888'
            const url = getApiUrl(customUrl)
            assert.equal(url, customUrl)
        })

        test('throws error for unknown chain without URL format', function () {
            try {
                getApiUrl('unknownchain')
                assert.fail('Should throw error for unknown chain')
            } catch (error) {
                assert.include((error as Error).message, 'Unknown chain: unknownchain')
            }
        })
    })

    suite('lookupContractInfo', function () {
        function createMockApiClient(
            mockAccount: object,
            mockAbiResponse: object,
            accountError?: Error
        ) {
            return {
                v1: {
                    chain: {
                        get_account: accountError
                            ? sandbox.stub().rejects(accountError)
                            : sandbox.stub().resolves(mockAccount),
                        get_abi: sandbox.stub().resolves(mockAbiResponse),
                    },
                },
            }
        }

        test('outputs JSON format when --json option is used', async function () {
            const mockAccount = {
                last_code_update: '2024-01-01T00:00:00.000',
                ram_usage: UInt64.from(50000),
                ram_quota: UInt64.from(100000),
                core_liquid_balance: Asset.from('100.0000 EOS'),
            }

            const mockAbiResponse = {
                account_name: Name.from('eosio.token'),
                abi: ABI.from(eosioTokenAbi),
            }

            const mockClient = createMockApiClient(mockAccount, mockAbiResponse)

            await lookupContractInfo('local', 'eosio.token', {
                json: true,
                _apiClient: mockClient,
            })

            assert(consoleLogStub.called, 'console.log should be called')
            const output = consoleLogStub.firstCall.args[0]
            const parsed = JSON.parse(output)

            assert.equal(parsed.account, 'eosio.token')
            assert.equal(parsed.chain, 'local')
            assert.isTrue(parsed.hasCode)
            assert.isArray(parsed.actions)
            assert.isArray(parsed.tables)
            assert.isArray(parsed.structs)
        })

        test('outputs pretty format by default', async function () {
            const mockAccount = {
                last_code_update: '2024-01-01T00:00:00.000',
                ram_usage: UInt64.from(50000),
                ram_quota: UInt64.from(100000),
                core_liquid_balance: Asset.from('100.0000 EOS'),
            }

            const mockAbiResponse = {
                account_name: Name.from('eosio.token'),
                abi: ABI.from(eosioTokenAbi),
            }

            const mockClient = createMockApiClient(mockAccount, mockAbiResponse)

            await lookupContractInfo('local', 'eosio.token', {_apiClient: mockClient})

            assert(consoleLogStub.called, 'console.log should be called')

            // Check that contract name is logged
            const allOutput = consoleLogStub
                .getCalls()
                .map((c) => c.args[0])
                .join('\n')
            assert.include(allOutput, 'Contract: eosio.token')
            assert.include(allOutput, 'Chain: local')
        })

        test('shows "no contract deployed" message when account has no ABI', async function () {
            const mockAccount = {
                last_code_update: '2024-01-01T00:00:00.000',
                ram_usage: UInt64.from(5000),
                ram_quota: UInt64.from(10000),
            }

            const mockAbiResponse = {
                account_name: Name.from('testaccount'),
                abi: undefined,
            }

            const mockClient = createMockApiClient(mockAccount, mockAbiResponse)

            await lookupContractInfo('local', 'testaccount', {_apiClient: mockClient})

            const allOutput = consoleLogStub
                .getCalls()
                .map((c) => c.args[0])
                .join('\n')
            assert.include(allOutput, 'No contract deployed')
        })

        test('displays actions with parameters', async function () {
            const mockAccount = {
                last_code_update: '2024-01-01T00:00:00.000',
                ram_usage: UInt64.from(50000),
                ram_quota: UInt64.from(100000),
                core_liquid_balance: Asset.from('100.0000 EOS'),
            }

            const mockAbiResponse = {
                account_name: Name.from('eosio.token'),
                abi: ABI.from(eosioTokenAbi),
            }

            const mockClient = createMockApiClient(mockAccount, mockAbiResponse)

            await lookupContractInfo('local', 'eosio.token', {_apiClient: mockClient})

            const allOutput = consoleLogStub
                .getCalls()
                .map((c) => c.args[0])
                .join('\n')
            assert.include(allOutput, 'Actions:')
            assert.include(allOutput, 'transfer')
        })

        test('displays tables', async function () {
            const mockAccount = {
                last_code_update: '2024-01-01T00:00:00.000',
                ram_usage: UInt64.from(50000),
                ram_quota: UInt64.from(100000),
                core_liquid_balance: Asset.from('100.0000 EOS'),
            }

            const mockAbiResponse = {
                account_name: Name.from('eosio.token'),
                abi: ABI.from(eosioTokenAbi),
            }

            const mockClient = createMockApiClient(mockAccount, mockAbiResponse)

            await lookupContractInfo('local', 'eosio.token', {_apiClient: mockClient})

            const allOutput = consoleLogStub
                .getCalls()
                .map((c) => c.args[0])
                .join('\n')
            assert.include(allOutput, 'Tables:')
            assert.include(allOutput, 'accounts')
        })

        test('handles account not found error', async function () {
            const mockClient = createMockApiClient({}, {}, new Error('Account not found'))

            await lookupContractInfo('local', 'nonexistent', {_apiClient: mockClient})

            assert(consoleErrorStub.called, 'console.error should be called')
            const errorOutput = consoleErrorStub.firstCall.args[0]
            assert.include(errorOutput, 'nonexistent')
            assert.include(errorOutput, 'not found')
            assert(processExitStub.calledWith(1), 'process.exit should be called with 1')
        })

        test('handles generic API errors', async function () {
            const mockClient = createMockApiClient({}, {}, new Error('Network error'))

            await lookupContractInfo('local', 'testaccount', {_apiClient: mockClient})

            assert(consoleErrorStub.called, 'console.error should be called')
            const errorOutput = consoleErrorStub.firstCall.args[0]
            assert.include(errorOutput, 'Network error')
            assert(processExitStub.calledWith(1), 'process.exit should be called with 1')
        })

        test('JSON output includes correct action list', async function () {
            const mockAccount = {
                last_code_update: '2024-01-01T00:00:00.000',
                ram_usage: UInt64.from(50000),
                ram_quota: UInt64.from(100000),
                core_liquid_balance: Asset.from('100.0000 EOS'),
            }

            const mockAbiResponse = {
                account_name: Name.from('eosio.token'),
                abi: ABI.from(eosioTokenAbi),
            }

            const mockClient = createMockApiClient(mockAccount, mockAbiResponse)

            await lookupContractInfo('local', 'eosio.token', {
                json: true,
                _apiClient: mockClient,
            })

            const output = consoleLogStub.firstCall.args[0]
            const parsed = JSON.parse(output)

            // eosio.token has these actions: close, create, issue, open, retire, transfer
            assert.include(parsed.actions, 'close')
            assert.include(parsed.actions, 'create')
            assert.include(parsed.actions, 'issue')
            assert.include(parsed.actions, 'transfer')
        })

        test('JSON output includes correct table list', async function () {
            const mockAccount = {
                last_code_update: '2024-01-01T00:00:00.000',
                ram_usage: UInt64.from(50000),
                ram_quota: UInt64.from(100000),
                core_liquid_balance: Asset.from('100.0000 EOS'),
            }

            const mockAbiResponse = {
                account_name: Name.from('eosio.token'),
                abi: ABI.from(eosioTokenAbi),
            }

            const mockClient = createMockApiClient(mockAccount, mockAbiResponse)

            await lookupContractInfo('local', 'eosio.token', {
                json: true,
                _apiClient: mockClient,
            })

            const output = consoleLogStub.firstCall.args[0]
            const parsed = JSON.parse(output)

            // eosio.token has these tables: accounts, stat
            assert.include(parsed.tables, 'accounts')
            assert.include(parsed.tables, 'stat')
        })

        test('shows Ricardian contract indicator when present', async function () {
            const mockAccount = {
                last_code_update: '2024-01-01T00:00:00.000',
                ram_usage: UInt64.from(50000),
                ram_quota: UInt64.from(100000),
                core_liquid_balance: Asset.from('100.0000 EOS'),
            }

            // eosio.token.json has Ricardian contracts
            const mockAbiResponse = {
                account_name: Name.from('eosio.token'),
                abi: ABI.from(eosioTokenAbi),
            }

            const mockClient = createMockApiClient(mockAccount, mockAbiResponse)

            await lookupContractInfo('local', 'eosio.token', {_apiClient: mockClient})

            const allOutput = consoleLogStub
                .getCalls()
                .map((c) => c.args[0])
                .join('\n')
            assert.include(allOutput, 'Has Ricardian contracts')
        })

        test('works with contracts that have action_results', async function () {
            const mockAccount = {
                last_code_update: '2024-01-01T00:00:00.000',
                ram_usage: UInt64.from(50000),
                ram_quota: UInt64.from(100000),
                core_liquid_balance: Asset.from('100.0000 GM'),
            }

            const mockAbiResponse = {
                account_name: Name.from('rewards.gm'),
                abi: ABI.from(rewardsGmAbi),
            }

            const mockClient = createMockApiClient(mockAccount, mockAbiResponse)

            // Should not throw an error
            await lookupContractInfo('local', 'rewards.gm', {_apiClient: mockClient})

            assert(consoleLogStub.called, 'console.log should be called')
        })

        test('handles account without core_liquid_balance', async function () {
            const mockAccount = {
                last_code_update: '2024-01-01T00:00:00.000',
                ram_usage: UInt64.from(5000),
                ram_quota: UInt64.from(10000),
                // No core_liquid_balance
            }

            const mockAbiResponse = {
                account_name: Name.from('eosio.token'),
                abi: ABI.from(eosioTokenAbi),
            }

            const mockClient = createMockApiClient(mockAccount, mockAbiResponse)

            // Should not throw an error
            await lookupContractInfo('local', 'eosio.token', {_apiClient: mockClient})

            const allOutput = consoleLogStub
                .getCalls()
                .map((c) => c.args[0])
                .join('\n')
            // Should not include Balance: line since there's no balance
            assert.notInclude(allOutput, 'Balance:')
        })

        test('JSON output handles missing balance correctly', async function () {
            const mockAccount = {
                last_code_update: '2024-01-01T00:00:00.000',
                ram_usage: UInt64.from(5000),
                ram_quota: UInt64.from(10000),
            }

            const mockAbiResponse = {
                account_name: Name.from('eosio.token'),
                abi: ABI.from(eosioTokenAbi),
            }

            const mockClient = createMockApiClient(mockAccount, mockAbiResponse)

            await lookupContractInfo('local', 'eosio.token', {
                json: true,
                _apiClient: mockClient,
            })

            const output = consoleLogStub.firstCall.args[0]
            const parsed = JSON.parse(output)

            assert.equal(parsed.balance, '0')
        })
    })
})
