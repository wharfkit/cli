import {assert} from 'chai'

import {ABI, APIClient, Name, Serializer} from '@wharfkit/antelope'
import {makeClient} from '@wharfkit/mock-data'

import fs from 'fs'
import {Contract} from '@wharfkit/contract'

import * as Eosio from '$test/data/contracts/mock-eosio'
import * as EosioMsig from '$test/data/contracts/mock-eosio.msig'
import * as EosioToken from '$test/data/contracts/mock-eosio.token'
import * as RewardsGm from '$test/data/contracts/mock-rewards.gm'
import * as AtomicAssets from '$test/data/contracts/mock-atomicassets'
import * as Hegemon from '$test/data/contracts/mock-hegemon.hgm'
import * as Boid from '$test/data/contracts/mock-boid'

import {generateCodegenContract, removeCodegenContracts} from '$test/utils/codegen'
import {runGenericContractTests} from './helpers/generic'

const client = makeClient('https://eos.greymass.com')

interface Code {
    mock: string
    generated: string
}

suite('codegen', async function () {
    // Contract instances
    const contracts = {
        eosio: {
            mock: Eosio,
            generated: null,
        },
        'eosio.msig': {
            mock: EosioMsig,
            generated: null,
        },
        'eosio.token': {
            mock: EosioToken,
            generated: null,
        },
        'rewards.gm': {
            mock: RewardsGm,
            generated: null,
        },
        atomicassets: {
            mock: AtomicAssets,
            generated: null,
        },
        'hegemon.hgm': {
            mock: Hegemon,
            generated: null,
        },
        boid: {
            mock: Boid,
            generated: null,
        },
    }

    // Source code
    const sources: Code[] = []

    setup(async function () {
        if (!sources.length) {
            // loop through files
            for (const testCase of Object.keys(contracts)) {
                const generated = await generateCodegenContract(testCase)
                const mock = fs
                    .readFileSync(`test/data/contracts/mock-${testCase}.ts`)
                    .toString('utf-8')

                // Push source file in for comparison
                sources.push({
                    mock,
                    generated: generated.text,
                })

                // Push contract class for testing
                contracts[testCase] = generated.import
            }
        }
    })

    test('bug', async function () {
        const data: any = {
            requirements: {
                team_id: [],
                min_power: 0,
                min_balance: 0,
                min_stake: 0,
                min_cumulative_team_contribution: 0,
            },
            actions: {
                delegated_stake: 0,
                stake_locked_additional_rounds: 0,
                nft_actions: [
                    {
                        collection_name: 'dddd',
                        schema_name: 'dddddd',
                        template_id: '3',
                        match_immutable_attributes: [
                            {
                                key: 'keyname',
                                value: 'keytest',
                            },
                        ],
                        match_mutable_attributes: [],
                        burn: false,
                        lock_rounds: 0,
                    },
                ],
                balance_payment: 0,
            },
            rewards: {
                nft_mints: [],
                balance_deposit: 0,
                delegated_stake: 0,
                stake_locked_additional_rounds: 0,
                activate_powermod_ids: [],
            },
            limits: {
                offer_quantity_remaining: 0,
                available_until_round: 0,
            },
        }

        const test = Boid.Types.offeradd.from(data)
        /**
         * The input for `team_id` was an array and comes back as an empty string
         */
        assert.equal(test.requirements.team_id, data.requirements.team_id)
        /**
         * The value of the `actions.nft_actions[0].match_immutable_attributes[0].value` was a string and comes back as an empty object
         */
        assert.equal(
            String(test.actions.nft_actions[0].match_immutable_attributes[0].value),
            'keytest'
        )
        /**
         * The input for `rewards.activated_powermod_ids` was an array and comes back as an empty string
         */
        assert.equal(test.rewards.activate_powermod_ids, data.rewards.activate_powermod_ids)
    })

    suite('Generated vs Static', function () {
        test('Contracts are identical', function () {
            for (const source of sources) {
                assert.equal(source.generated, source.mock)
            }
        })
        for (const contractKey of Object.keys(contracts)) {
            for (const testType of Object.keys(contracts[contractKey])) {
                test(`Testing contract ${contractKey} (${testType})`, function () {
                    const testModule = contracts[contractKey]
                    const testContract = testModule.Contract
                    const testContractInstance = new testContract({client})

                    // Run generic contract tests
                    runGenericContractTests(testContractInstance)

                    function assertRewardsContract(contract) {
                        assert.instanceOf(contract, Contract)
                        assert.instanceOf(contract.abi, ABI)
                        assert.isTrue(contract.abi.equals(testModule.abi))
                        assert.instanceOf(contract.account, Name)
                        assert.instanceOf(contract.client, APIClient)
                    }

                    assertRewardsContract(testContractInstance)

                    const c1 = new testContract({client})
                    assertRewardsContract(c1)

                    const c2 = new testContract({client, abi: testModule.abi})
                    assertRewardsContract(c2)

                    const c3 = new testContract({client, account: 'teamgreymass'})
                    assertRewardsContract(c3)

                    const c4 = new testContract({
                        client,
                        account: Name.from('teamgreymass'),
                    })
                    assertRewardsContract(c4)

                    const c5 = new testContract({
                        client,
                        abi: testModule.abi,
                        account: 'teamgreymass',
                    })
                    assertRewardsContract(c5)

                    assert.throws(() => new testContract({abi: testModule.abi}))
                    assert.throws(
                        () =>
                            new testContract({
                                abi: testModule.abi,
                                account: 'teamgreymass',
                            })
                    )
                    assert.throws(() => new testContract({account: 'teamgreymass'}))
                })
            }
        }
    })
    teardown(() => {
        removeCodegenContracts()
    })
})
