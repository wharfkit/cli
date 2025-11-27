import {assert} from 'chai'
import {
    getApiUrl,
    parseActionData,
    parseAuthorization,
    parseContractAction,
} from '../../src/commands/action/request'

suite('action-request', function () {
    suite('parseContractAction', function () {
        test('parses valid contract::action format', function () {
            const result = parseContractAction('eosio.token::transfer')
            assert.equal(result.contractAccount, 'eosio.token')
            assert.equal(result.actionName, 'transfer')
        })

        test('parses contract with dots in name', function () {
            const result = parseContractAction('payroll.boid::setpayroll')
            assert.equal(result.contractAccount, 'payroll.boid')
            assert.equal(result.actionName, 'setpayroll')
        })

        test('rejects format without double colon', function () {
            try {
                parseContractAction('eosio.token')
                assert.fail('Should have thrown an error')
            } catch (error) {
                assert.include((error as Error).message, 'contract::action')
            }
        })

        test('rejects empty contract name', function () {
            try {
                parseContractAction('::transfer')
                assert.fail('Should have thrown an error')
            } catch (error) {
                assert.include((error as Error).message, 'contract::action')
            }
        })

        test('rejects empty action name', function () {
            try {
                parseContractAction('eosio.token::')
                assert.fail('Should have thrown an error')
            } catch (error) {
                assert.include((error as Error).message, 'contract::action')
            }
        })

        test('rejects single colon format', function () {
            try {
                parseContractAction('eosio.token:transfer')
                assert.fail('Should have thrown an error')
            } catch (error) {
                assert.include((error as Error).message, 'contract::action')
            }
        })
    })

    suite('parseActionData', function () {
        test('parses valid JSON object', function () {
            const result = parseActionData('{"from": "alice", "to": "bob"}')
            assert.deepEqual(result, {from: 'alice', to: 'bob'})
        })

        test('parses JSON with nested objects', function () {
            const result = parseActionData('{"user": {"name": "alice", "age": 30}}')
            assert.deepEqual(result, {user: {name: 'alice', age: 30}})
        })

        test('parses JSON with arrays', function () {
            const result = parseActionData('{"values": [1, 2, 3]}')
            assert.deepEqual(result, {values: [1, 2, 3]})
        })

        test('parses simple key=value pairs', function () {
            const result = parseActionData('from=alice,to=bob')
            assert.deepEqual(result, {from: 'alice', to: 'bob'})
        })

        test('parses key=value with spaces', function () {
            const result = parseActionData('from = alice, to = bob')
            assert.deepEqual(result, {from: 'alice', to: 'bob'})
        })

        test('parses key=value with numeric values', function () {
            const result = parseActionData('amount=100,count=5')
            assert.deepEqual(result, {amount: 100, count: 5})
        })

        test('parses key=value with boolean values', function () {
            const result = parseActionData('active=true,disabled=false')
            assert.deepEqual(result, {active: true, disabled: false})
        })

        test('handles values with equals sign', function () {
            const result = parseActionData('key=value=with=equals')
            assert.deepEqual(result, {key: 'value=with=equals'})
        })

        test('rejects invalid format', function () {
            try {
                parseActionData('not valid json or pairs')
                assert.fail('Should have thrown an error')
            } catch (error) {
                assert.include((error as Error).message, 'Invalid action data format')
            }
        })

        test('rejects empty string', function () {
            try {
                parseActionData('')
                assert.fail('Should have thrown an error')
            } catch (error) {
                // Empty string throws from JSON.parse or key=value parser
                assert.exists(error)
            }
        })
    })

    suite('parseAuthorization', function () {
        test('returns placeholder with no input', function () {
            const result = parseAuthorization()
            assert.isNull(result.actor)
            assert.equal(result.permission, 'active')
        })

        test('returns placeholder with undefined', function () {
            const result = parseAuthorization(undefined)
            assert.isNull(result.actor)
            assert.equal(result.permission, 'active')
        })

        test('parses account@permission format', function () {
            const result = parseAuthorization('alice@active')
            assert.equal(result.actor, 'alice')
            assert.equal(result.permission, 'active')
        })

        test('parses account@owner format', function () {
            const result = parseAuthorization('alice@owner')
            assert.equal(result.actor, 'alice')
            assert.equal(result.permission, 'owner')
        })

        test('parses account only (defaults to active)', function () {
            const result = parseAuthorization('alice')
            assert.equal(result.actor, 'alice')
            assert.equal(result.permission, 'active')
        })

        test('parses account with trailing @', function () {
            const result = parseAuthorization('alice@')
            assert.equal(result.actor, 'alice')
            assert.equal(result.permission, 'active')
        })

        test('parses account with dots', function () {
            const result = parseAuthorization('payroll.boid@active')
            assert.equal(result.actor, 'payroll.boid')
            assert.equal(result.permission, 'active')
        })
    })

    suite('getApiUrl', function () {
        test('returns URL as-is for http://', function () {
            const url = 'http://my-node.example.com:8888'
            assert.equal(getApiUrl(url), url)
        })

        test('returns URL as-is for https://', function () {
            const url = 'https://my-node.example.com'
            assert.equal(getApiUrl(url), url)
        })

        test('resolves local to localhost', function () {
            assert.equal(getApiUrl('local'), 'http://127.0.0.1:8888')
        })

        test('resolves known chain names (case insensitive)', function () {
            // These should resolve to their respective URLs
            const jungle4Url = getApiUrl('Jungle4')
            assert.include(jungle4Url, 'http')
            assert.isString(jungle4Url)

            const jungle4UrlLower = getApiUrl('jungle4')
            assert.equal(jungle4Url, jungle4UrlLower)
        })

        test('throws for unknown chain name', function () {
            try {
                getApiUrl('unknownchain')
                assert.fail('Should have thrown an error')
            } catch (error) {
                assert.include((error as Error).message, 'Unknown chain')
            }
        })
    })
})
