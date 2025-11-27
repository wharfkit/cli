import {assert} from 'chai'
import {execSync} from 'child_process'
import * as path from 'path'
import {isNodeosAvailable} from '../../utils/test-helpers'

/**
 * E2E tests for CLI command structure:
 * - Verifies commands exist and have correct help text
 * - Tests command hierarchy
 *
 * Note: These tests don't require a running chain, but we still
 * check for nodeos availability to match other E2E test behavior.
 */
suite('E2E: CLI Structure', () => {
    const cliPath = path.join(__dirname, '../../../lib/cli.js')

    suiteSetup(function () {
        if (!isNodeosAvailable()) {
            // eslint-disable-next-line no-console
            console.log('Skipping E2E tests: nodeos is not available in PATH')
            this.skip()
        }
    })

    suite('Command Structure', () => {
        test('wallet command has correct subcommands', function () {
            const output = execSync(`node ${cliPath} wallet --help`, {encoding: 'utf8'})

            assert.include(output, 'create')
            assert.include(output, 'keys')
            assert.include(output, 'account')
            assert.include(output, 'transact')
        })

        test('wallet account command has create subcommand', function () {
            const output = execSync(`node ${cliPath} wallet account --help`, {encoding: 'utf8'})

            assert.include(output, 'create')
            assert.include(output, 'Create a new account on the blockchain')
        })

        test('contract deploy command works', function () {
            const output = execSync(`node ${cliPath} contract deploy --help`, {encoding: 'utf8'})

            assert.include(output, 'Deploy a compiled contract')
            assert.include(output, '--account')
            assert.include(output, '--url')
            assert.include(output, '--key')
        })

        test('dev command is at top level', function () {
            const output = execSync(`node ${cliPath} dev --help`, {encoding: 'utf8'})

            assert.include(output, 'Start local chain and watch for changes')
            assert.include(output, '--account')
            assert.include(output, '--port')
            assert.include(output, '--clean')
        })

        test('compile command is at top level', function () {
            const output = execSync(`node ${cliPath} compile --help`, {encoding: 'utf8'})

            assert.include(output, 'Compile C++ contract files')
            assert.include(output, '--output')
        })

        test('wallet keys command has add subcommand', function () {
            const output = execSync(`node ${cliPath} wallet keys --help`, {encoding: 'utf8'})

            assert.include(output, 'add')
            assert.include(output, 'create')
            assert.include(output, 'Add an existing private key')
        })
    })
})

