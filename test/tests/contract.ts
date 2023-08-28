import {makeClient, mockPrivateKey, mockSession} from '@wharfkit/mock-data'
import {assert} from 'chai'

import ContractKit, {Contract, ContractArgs, Table} from '@wharfkit/contract'

import {ProducerInfo} from '$test/data/structs/eosio'
import {ABI, Action, Asset, Name, PrivateKey, Serializer} from '@wharfkit/antelope'
import {PlaceholderAuth} from '@wharfkit/signing-request'
import {runGenericContractTests} from './helpers/generic'

const mockClient = makeClient('https://jungle4.greymass.com')

const systemContractArgs: ContractArgs = {
    abi: {version: 'eosio::abi/1.2'},
    account: 'eosio',
    client: mockClient,
}

const mockPublicKey = String(PrivateKey.from(mockPrivateKey).toPublic())

// eosio::newaccount
const newAccountData = {
    creator: PlaceholderAuth.actor,
    name: 'foo',
    owner: {
        accounts: [],
        keys: [
            {
                key: mockPublicKey,
                weight: 1,
            },
        ],
        threshold: 1,
        waits: [],
    },
    active: {
        accounts: [],
        keys: [
            {
                key: mockPublicKey,
                weight: 1,
            },
        ],
        threshold: 1,
        waits: [],
    },
}

// eosio::buyrambytes
const buyRamBytesData = {
    payer: PlaceholderAuth.actor,
    receiver: 'foo',
    bytes: 8192,
}

// eosio::delegatebw
const delegateBwData = {
    from: PlaceholderAuth.actor,
    receiver: 'foo',
    stake_net_quantity: '1.0000 EOS',
    stake_cpu_quantity: '1.0000 EOS',
    transfer: false,
}

// eosio.token::transfer
const transferData = {
    from: PlaceholderAuth.actor,
    to: 'foo',
    quantity: '1.0000 EOS',
    memo: 'initial balance',
}

const mockKit = new ContractKit({
    client: mockClient,
})

suite('Contract', async function () {
    let systemContract: Contract
    let tokenContract: Contract

    setup(async function () {
        if (!systemContract) {
            systemContract = await mockKit.load('eosio')
        }
        if (!tokenContract) {
            tokenContract = await mockKit.load('eosio.token')
        }
    })

    suite('Contract', () => {
        suite('construct', function () {
            test('typed', function () {
                const contract = new Contract({
                    ...systemContractArgs,
                    abi: ABI.from(systemContractArgs.abi),
                    account: Name.from(systemContractArgs.account),
                })
                assert.instanceOf(contract, Contract)
            })
            test('untyped', function () {
                const contract = new Contract(systemContractArgs)
                assert.instanceOf(contract, Contract)
            })
        })

        suite('specific contract', function () {
            suite('system contract', function () {
                suite('generic tests', async () => {
                    runGenericContractTests(systemContract)
                })
                suite('tableNames', function () {
                    test('validate for contract', function () {
                        assert.lengthOf(systemContract.tableNames, 26)
                        assert.isTrue(systemContract.tableNames.includes('voters'))
                    })
                })
                suite('table', function () {
                    test('should accept rowType', async function () {
                        const table = systemContract.table<ProducerInfo>(
                            'producers',
                            undefined,
                            ProducerInfo
                        )
                        assert.instanceOf(table, Table)
                        const producer = await table.get('lioninjungle')
                        assert.instanceOf(producer, ProducerInfo)
                        assert.instanceOf(producer.owner, Name)
                        assert.isTrue(producer.owner.equals('lioninjungle'))
                    })
                })
                suite('actions', function () {
                    test('create array of actions', async function () {
                        const actions: Action[] = [
                            ...systemContract.actions([
                                {
                                    name: 'newaccount',
                                    data: newAccountData,
                                },
                                {
                                    name: 'buyrambytes',
                                    data: {
                                        payer: PlaceholderAuth.actor,
                                        receiver: 'foo',
                                        bytes: 8192,
                                    },
                                },
                                {
                                    name: 'delegatebw',
                                    data: delegateBwData,
                                },
                            ]),
                        ]
                        assert.lengthOf(actions, 3)
                        assert.isTrue(actions[0].account.equals('eosio'))
                        assert.isTrue(actions[0].name.equals('newaccount'))
                        assert.lengthOf(actions[0].authorization, 1)
                        assert.isTrue(actions[0].authorization[0].equals(PlaceholderAuth))
                        assert.isTrue(actions[1].account.equals('eosio'))
                        assert.isTrue(actions[1].name.equals('buyrambytes'))
                        assert.lengthOf(actions[1].authorization, 1)
                        assert.isTrue(actions[1].authorization[0].equals(PlaceholderAuth))
                        assert.isTrue(actions[2].account.equals('eosio'))
                        assert.isTrue(actions[2].name.equals('delegatebw'))
                        assert.lengthOf(actions[2].authorization, 1)
                        assert.isTrue(actions[2].authorization[0].equals(PlaceholderAuth))
                        const result = await mockSession.transact({actions})
                        if (!result.transaction) {
                            throw new Error('expected transaction')
                        }
                        assert.lengthOf(result.transaction.actions, 3)
                    })
                    suite('override', function () {
                        test('authorization (all)', function () {
                            const actions: Action[] = systemContract.actions(
                                [
                                    {
                                        name: 'newaccount',
                                        data: newAccountData,
                                    },
                                    {
                                        name: 'buyrambytes',
                                        data: buyRamBytesData,
                                    },
                                    {
                                        name: 'delegatebw',
                                        data: delegateBwData,
                                    },
                                ],
                                {
                                    authorization: [{actor: 'foo', permission: 'bar'}],
                                }
                            )
                            assert.lengthOf(actions, 3)
                            assert.isTrue(actions[0].authorization[0].actor.equals('foo'))
                            assert.isTrue(actions[0].authorization[0].permission.equals('bar'))
                            assert.lengthOf(actions[0].authorization, 1)
                            assert.isTrue(actions[1].authorization[0].actor.equals('foo'))
                            assert.isTrue(actions[1].authorization[0].permission.equals('bar'))
                            assert.lengthOf(actions[1].authorization, 1)
                            assert.isTrue(actions[2].authorization[0].actor.equals('foo'))
                            assert.isTrue(actions[2].authorization[0].permission.equals('bar'))
                            assert.lengthOf(actions[2].authorization, 1)
                        })
                        test('authorization (individual)', function () {
                            const actions: Action[] = systemContract.actions([
                                {
                                    name: 'newaccount',
                                    data: newAccountData,
                                },
                                {
                                    name: 'buyrambytes',
                                    data: buyRamBytesData,
                                    authorization: [{actor: 'foo', permission: 'bar'}],
                                },
                                {
                                    name: 'delegatebw',
                                    data: delegateBwData,
                                },
                            ])
                            assert.lengthOf(actions, 3)
                            assert.isTrue(actions[0].authorization[0].equals(PlaceholderAuth))
                            assert.lengthOf(actions[0].authorization, 1)
                            assert.isTrue(actions[1].authorization[0].actor.equals('foo'))
                            assert.isTrue(actions[1].authorization[0].permission.equals('bar'))
                            assert.lengthOf(actions[1].authorization, 1)
                            assert.isTrue(actions[2].authorization[0].equals(PlaceholderAuth))
                            assert.lengthOf(actions[2].authorization, 1)
                        })
                    })
                })
                suite('actionNames', function () {
                    test('validate for contract', function () {
                        assert.isArray(systemContract.actionNames)
                        assert.lengthOf(systemContract.actionNames, 62)
                        assert.isTrue(systemContract.actionNames.includes('newaccount'))
                    })
                })
            })
            suite('token contract', function () {
                suite('generic tests', async () => {
                    runGenericContractTests(tokenContract)
                })
                suite('action', function () {
                    suite('load', function () {
                        test('using Name', function () {
                            const action = tokenContract.action(Name.from('transfer'), transferData)
                            assert.instanceOf(action, Action)
                            assert.isTrue(action.account.equals('eosio.token'))
                            assert.isTrue(action.name.equals('transfer'))
                            assert.isTrue(
                                action.authorization[0].equals({
                                    actor: PlaceholderAuth.actor,
                                    permission: PlaceholderAuth.permission,
                                })
                            )
                            const encoded = Serializer.encode({
                                object: transferData,
                                type: 'transfer',
                                abi: tokenContract.abi,
                            })
                            assert.isTrue(action.data.equals(encoded))
                        })
                        test('using string', function () {
                            const action = tokenContract.action('transfer', transferData)
                            assert.instanceOf(action, Action)
                            assert.isTrue(action.account.equals('eosio.token'))
                            assert.isTrue(action.name.equals('transfer'))
                        })
                        test('defaults to placeholders', function () {
                            const action = tokenContract.action('transfer', transferData)
                            assert.isTrue(action.authorization[0].equals(PlaceholderAuth))
                        })
                    })
                    suite('throws', function () {
                        test('with incomplete action data', async function () {
                            assert.throws(() =>
                                tokenContract.action('transfer', {
                                    from: 'foo',
                                    to: 'bar',
                                    quantity: '1.0000 EOS',
                                })
                            )
                        })
                        test('with invalid action data', async function () {
                            assert.throws(() =>
                                tokenContract.action('transfer', {
                                    ...transferData,
                                    to: Asset.from('1.0000 EOS'),
                                })
                            )
                        })
                        test('with invalid name', async function () {
                            assert.throws(() => tokenContract.action('foo', transferData))
                        })
                    })
                    suite('overrides', function () {
                        test('authorization', async function () {
                            const action = tokenContract.action('transfer', transferData, {
                                authorization: [
                                    {
                                        actor: 'foo',
                                        permission: 'bar',
                                    },
                                ],
                            })
                            assert.isTrue(
                                action.authorization[0].equals({
                                    actor: 'foo',
                                    permission: 'bar',
                                })
                            )
                        })
                    })
                })
            })
        })

        suite('ricardian', () => {
            test('returns ricardian contract', async function () {
                const kit = new ContractKit({
                    client: makeClient('https://eos.greymass.com'),
                })
                const contract = await kit.load('eosio.token')
                const ricardian = await contract.ricardian('transfer')
                assert.isString(ricardian)
            })
            test('throws for unknown action', async function () {
                let error
                try {
                    await tokenContract.ricardian('foo')
                } catch (err) {
                    error = err
                }
                assert.instanceOf(error, Error)
            })
            test('throws for an undefined ricardian', async function () {
                let error
                try {
                    await tokenContract.ricardian('transfer')
                } catch (err) {
                    error = err
                }
                assert.instanceOf(error, Error)
            })
        })
    })
})
