import {
    Action,
    Asset,
    Bytes,
    Name,
    PermissionLevel,
    Serializer,
    Struct,
    UInt64,
} from '@wharfkit/antelope'
import {makeClient} from '@wharfkit/mock-data'
import {assert} from 'chai'

import * as RewardsGm from '$test/data/contracts/mock-rewards.gm'
import * as EosioMsig from '$test/data/contracts/mock-eosio.msig'
import {Contract as ReturnValueContract} from '$test/data/contracts/mock-testing.gm'
import {PlaceholderName, PlaceholderPermission} from '@wharfkit/signing-request'
import {Table, TableRowCursor} from '@wharfkit/contract'

const eosClient = makeClient('https://eos.greymass.com')
const jungleClient = makeClient('https://jungle4.greymass.com')
const rewardsContract = new RewardsGm.Contract({client: eosClient})
const msigContract = new EosioMsig.Contract({client: jungleClient})

suite('functionality', function () {
    suite('Contract', function () {
        suite('retrieve action', function () {
            test('untyped', function () {
                const action = rewardsContract.action('claim', {
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
                    abi: rewardsContract.abi,
                    type: Claim,
                })
                assert.isTrue(decoded.account.equals(PlaceholderName))
                assert.isNull(decoded.amount)
            })
            test('typed values', function () {
                const action = rewardsContract.action('claim', {
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
                const action = rewardsContract.action(
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
                const table = rewardsContract.table('config')
                assert.instanceOf(table, Table)

                const config = await table.get()
                assert.instanceOf(config, RewardsGm.Types.config)

                const cursor = await table.first(1)
                assert.instanceOf(cursor, TableRowCursor)
                const result = await cursor.next()
                assert.instanceOf(result[0], RewardsGm.Types.config)

                const user = await rewardsContract.table('users').get()
                assert.instanceOf(user, RewardsGm.Types.user_row)
            })

            test('eosio.msig tables', async function () {
                // Test approvals table
                const approvalsTable = msigContract.table('approvals', 'eosio.msig')
                assert.instanceOf(approvalsTable, Table)

                // Test approvals2 table
                const approvals2Table = msigContract.table('approvals2', 'eosio.msig')
                assert.instanceOf(approvals2Table, Table)

                // Test invals table
                const invalsTable = msigContract.table('invals', 'eosio.msig')
                assert.instanceOf(invalsTable, Table)

                // Test proposal table
                const proposalTable = msigContract.table('proposal', 'msigtestert1')
                assert.instanceOf(proposalTable, Table)

                // Fetch data from the tables
                await approvalsTable.get()

                await approvals2Table.get()

                const invals = await invalsTable.get()
                assert.instanceOf(invals, EosioMsig.Types.invalidation)

                await proposalTable.get('rebrand')
            })
        })
        suite('return values', function () {
            test('helper exists', async function () {
                const client = makeClient('https://jungle4.greymass.com')
                const contract = new ReturnValueContract({client})
                const result = await contract.readonly('callapi', {})
                assert.instanceOf(result.foo, UInt64)
            })
        })
    })
})
