import {Action, Bytes, Name, UInt64} from '@wharfkit/antelope'
import {assert} from 'chai'

import type {ActionDataType, Contract} from '@wharfkit/contract'
import {Table} from '@wharfkit/contract'

// Mocks data for the first action defined in the contract for testing purposes
export function getMockParams(contract: Contract): ActionDataType {
    switch (String(contract.account)) {
        case 'eosio': {
            return {
                feature_digest: '331f0fae3454c34ed2c5e84aeaf6143ce8e0b0678a6d57c25349363a4d590f41',
            }
        }
        case 'eosio.msig': {
            return {
                proposer: 'foo',
                proposal_name: 'bar',
                level: {
                    actor: 'foo',
                    permission: 'active',
                },
            }
        }
        case 'eosio.token': {
            return {
                owner: 'foo',
                symbol: '4,EOS',
            }
        }
        case 'rewards.gm': {
            return {
                account: 'foo',
                weight: 1,
            }
        }
        case 'atomicassets': {
            return {
                asset_id: '12345',
                new_owner: 'new_owner_account',
                offer_id: UInt64.from(54321),
            }
        }
        case 'hegemon.hgm': {
            return {
                gameasset_id: UInt64.from(98765),
                tile_id: UInt64.from(56789),
                owner: 'owner_account_name',
            }
        }
        case 'boid': {
            return {
                boid_id: 'foo',
                owners: ['foo'],
                sponsors: ['foo'],
                keys: ['PUB_K1_6RrvujLQN1x5Tacbep1KAk8zzKpSThAQXBCKYFfGUYeACcSRFs'],
            }
        }
        case 'payroll.boid': {
            return {
                payrollConfig: {
                    minClaimFrequencySec: 1,
                    receiverAccount: 'foo',
                    treasuryAccount: 'bar',
                    meta: Bytes.from('meta', 'utf8').toString('hex'),
                    paused: false,
                    startTime: new Date('2021-01-01T00:00:00Z'),
                    finishTime: new Date('2021-01-01T00:00:00Z'),
                    total: '1.0000 BOID',
                },
            }
        }
        case 'testing.gm': {
            return {
                oracle: 'foo',
                epoch: 1,
                commit: 'bar',
            }
        }
        case 'unicove2.gm': {
            return {
                account: 'foo',
            }
        }
        default: {
            throw new Error(`getMockParams not implemented for ${contract.account}`)
        }
    }
}

export function runGenericContractTests(contract: Contract) {
    // suite: tableNames
    // contains tables
    assert.isArray(contract.tableNames)
    assert.isTrue(contract.tableNames.length > 0)

    // suite: table
    // load table using Name
    const tableName = Name.from(contract.tableNames[0])
    const table = contract.table(tableName)
    assert.instanceOf(table, Table)
    assert.isTrue(table.name.equals(tableName))

    // load table using string
    const tableName2 = contract.tableNames[0]
    const table2 = contract.table(tableName2)
    assert.instanceOf(table2, Table)
    assert.isTrue(table2.name.equals(tableName2))

    // throws on invalid name
    assert.throws(() => contract.table('foo'))

    // suite: actionNames
    // contains actions
    assert.isArray(contract.actionNames)
    assert.isTrue(contract.actionNames.length > 0)

    // suite: action
    // load action using Name
    const actionName = Name.from(contract.actionNames[0])
    const params = getMockParams(contract)
    const action = contract.action(actionName, params)
    assert.instanceOf(action, Action)
    assert.isTrue(action.name.equals(actionName))

    // load action using string
    const actionName2 = contract.actionNames[0]
    const params2 = getMockParams(contract)
    const action2 = contract.action(actionName2, params2)
    assert.instanceOf(action2, Action)
    assert.isTrue(action2.name.equals(actionName2))

    // throws on invalid name
    assert.throws(() => contract.action('foo', {}))
}
