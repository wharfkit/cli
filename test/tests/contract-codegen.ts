import {assert} from 'chai'

import {ABI, APIClient, Name} from '@wharfkit/antelope'
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
import * as PayrollBoid from '$test/data/contracts/mock-payroll.boid'
import * as GreymassTesting from '$test/data/contracts/mock-testing.gm'
import * as Unicove2 from '$test/data/contracts/mock-unicove2.gm'

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
        'payroll.boid': {
            mock: PayrollBoid,
            generated: null,
        },
        'testing.gm': {
            mock: GreymassTesting,
            generated: null,
        },
        'unicove2.gm': {
            mock: Unicove2,
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
