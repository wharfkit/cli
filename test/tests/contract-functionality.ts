import {Action, Asset, Bytes, Name, PermissionLevel, Serializer, Struct} from '@wharfkit/antelope'
import {makeClient} from '@wharfkit/mock-data'
import {assert} from 'chai'

import * as RewardsGm from '$test/data/contracts/mock-rewards.gm'
import * as Boid from '$test/data/contracts/mock-boid'
import {PlaceholderName, PlaceholderPermission} from '@wharfkit/signing-request'
import {Table, TableRowCursor} from '@wharfkit/contract'

const client = makeClient('https://eos.greymass.com')
const contract = new RewardsGm.Contract({client})

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
    })
    test('boid-test', async function () {
        const contract = new Boid.Contract({client})
        // Create a sample action and serialize it
        // This is to simulate what would be returned from an API call
        const nftmint: Boid.ActionParams.Base.NftMint = {
            mint_template_id: 0,
            mint_schema_name: 'wharf',
            mint_collection_name: 'test',
            immutable_data: [
                {
                    key: 'foo',
                    value: ['string', 'bar'],
                },
            ],
            mutable_data: [],
            quantity: 1,
        }

        const rewards: Boid.ActionParams.Base.OfferRewards = {
            activate_powermod_ids: Bytes.fromString('FFFF', 'hex'),
            balance_deposit: 0,
            delegated_stake: 0,
            nft_mints: [nftmint],
            stake_locked_additional_rounds: 0,
        }

        const requirements: Boid.ActionParams.Base.OfferRequirements = {
            min_balance: 0,
            min_cumulative_team_contribution: 0,
            min_power: 0,
            min_stake: 0,
            team_id: Bytes.fromString('FFFF', 'hex'),
        }

        const actions: Boid.ActionParams.Base.OfferAction = {
            balance_payment: 0,
            delegated_stake: 0,
            nft_actions: [],
            stake_locked_additional_rounds: 0,
        }

        const limits: Boid.ActionParams.Base.OfferLimits = {
            available_until_round: 0,
            offer_quantity_remaining: 0,
        }

        const data: Boid.ActionParams.offeradd = {
            actions,
            limits,
            requirements,
            rewards,
        }

        console.log(JSON.stringify(data, null, 2))

        const serializedAction = contract.action('offer.add', data)
        console.log(JSON.stringify(serializedAction, null, 2))

        // Now decode that action data using the ABI
        // This is what the client would do with the response from the API
        const retrievedActionData = Serializer.decode({
            data: serializedAction.data,
            abi: contract.abi,
            type: Boid.Types.offeradd,
        })
        console.log(retrievedActionData.rewards.nft_mints[0].immutable_data[0])

        // { key: 'foo', value: [ 'string', 'bar' ] }

        // If the developer wanted to perform that action again
        // The following commented out approach should work, but does not
        // const action = contract.action('createcol', retrievedActionData)

        // Instead the developer must recast the data
        const recreatedAction = contract.action(
            'offer.add',
            Serializer.objectify(retrievedActionData)
        )
        console.log(JSON.stringify(recreatedAction, null, 2))

        assert.isTrue(serializedAction.equals(recreatedAction))
        // const action2 = contract.action('createcol', test)
    })
})
