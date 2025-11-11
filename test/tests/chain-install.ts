import {assert} from 'chai'
import {checkLeapInstallation} from '../../src/commands/chain/install'

suite('Chain Install', function () {
    suite('LEAP Installation Check', function () {
        test('Checks LEAP installation status', async function () {
            this.timeout(5000)

            const status = await checkLeapInstallation()

            assert.isObject(status)
            assert.property(status, 'installed')
            assert.property(status, 'nodeos')
            assert.property(status, 'wharfkit')
            assert.isBoolean(status.installed)
            assert.isBoolean(status.nodeos)
            assert.isObject(status.wharfkit)
            assert.property(status.wharfkit, 'consoleRenderer')
            assert.property(status.wharfkit, 'walletPlugin')
            assert.isBoolean(status.wharfkit.consoleRenderer)
            assert.isBoolean(status.wharfkit.walletPlugin)
        })

        test('Has paths if binaries are installed', async function () {
            this.timeout(5000)

            const status = await checkLeapInstallation()

            if (status.nodeos) {
                assert.property(status, 'nodeosPath')
                assert.isString(status.nodeosPath)
            }
        })

        test('Has version if nodeos is installed', async function () {
            this.timeout(5000)

            const status = await checkLeapInstallation()

            if (status.nodeos) {
                assert.property(status, 'version')
                assert.isString(status.version)
                assert.match(status.version!, /\d+\.\d+\.\d+/)
            }
        })

        test('Marks installed as true only if all binaries exist', async function () {
            this.timeout(5000)

            const status = await checkLeapInstallation()

            if (status.installed) {
                assert.isTrue(status.nodeos)
                assert.isTrue(status.wharfkit.consoleRenderer)
                assert.isTrue(status.wharfkit.walletPlugin)
            }
        })
    })
})
