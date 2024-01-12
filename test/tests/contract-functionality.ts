import {Action, Asset, Bytes, Name, PermissionLevel, Serializer, Struct} from '@wharfkit/antelope'
import {makeClient} from '@wharfkit/mock-data'
import {assert} from 'chai'

import * as RewardsGm from '$test/data/contracts/mock-rewards.gm'
import * as AtomicAssets from '$test/data/contracts/mock-atomicassets'
import {PlaceholderName, PlaceholderPermission} from '@wharfkit/signing-request'
import {Table, TableRowCursor} from '@wharfkit/contract'

const client = makeClient('https://eos.greymass.com')
const contract = new RewardsGm.Contract({client})
const atomicassetsContract = new AtomicAssets.Contract({client})


suite('functionality', function () {
    suite('Contract', function () {
        suite('retrieve action', function () {
            test('untyped', function () {
                const action = contract.action('claim', {
                    account: PlaceholderName,
                })
                assert.instanceOf(action, Action)
                assert.instanceOf(action.account, Name)
                assert.instanceOf(action.name, Name)
                assert.instanceOf(action.authorization[0], PermissionLevel)
                assert.instanceOf(action.data, Bytes)
                assert.isTrue(action.account.equals('rewards.gm'))
                assert.isTrue(action.name.equals('claim'))
                assert.isTrue(action.authorization[0].actor.equals(PlaceholderName))
                assert.isTrue(action.authorization[0].permission.equals(PlaceholderPermission))

                @Struct.type('claim')
                class Claim extends Struct {
                    @Struct.field(Name) account!: Name
                    @Struct.field(Asset, {optional: true}) amount?: Asset
                }
                const decoded = Serializer.decode({
                    data: action.data,
                    abi: contract.abi,
                    type: Claim,
                })
                assert.isTrue(decoded.account.equals(PlaceholderName))
                assert.isNull(decoded.amount)
            })
            test('typed values', function () {
                const action = contract.action('claim', {
                    account: Name.from('teamgreymass'),
                })
                assert.instanceOf(action, Action)
            })
            test('struct', function () {
                @Struct.type('claim')
                class Claim extends Struct {
                    @Struct.field(Name) account!: Name
                    @Struct.field(Asset, {optional: true}) amount?: Asset
                }
                const action = contract.action(
                    'claim',
                    Claim.from({
                        account: Name.from('teamgreymass'),
                    })
                )
                assert.instanceOf(action, Action)
            })
        })
        suite('retrieve table', function () {
            test('automatically typed', async function () {
                const table = contract.table('config')
                assert.instanceOf(table, Table)

                const config = await table.get()
                assert.instanceOf(config, RewardsGm.Types.config)

                const cursor = await table.first(1)
                assert.instanceOf(cursor, TableRowCursor)
                const result = await cursor.next()
                assert.instanceOf(result[0], RewardsGm.Types.config)

                const user = await contract.table('users').get()
                assert.instanceOf(user, RewardsGm.Types.user_row)
            })
        })

        suite('variants', function () {
            test('any of the acceptaed variant types can be passed to the contract', async function () {
                const actionData: any = { // casting to any so we can see the test pass without getting the type errors
                    author: 'teamgreymass',
                    collection_name: 'teamgreymass',
                    allow_notify: true,
                    authorized_accounts: [],
                    notify_accounts: [],
                    market_fee: 0,
                    data: [{
                        key: 'test',
                        // value: 'test', // this works
                        value: {
                            value: 'string', // this doesn't
                        }
                    }],
                }
                const action: Action = atomicassetsContract.action('createcol', actionData);

                console.log({decoded: action.decoded.data.data})

                assert.exists(action.decoded.data.data[0])
            });
        });
    })
})
