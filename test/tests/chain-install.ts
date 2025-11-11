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
            assert.property(status, 'cleos')
            assert.property(status, 'keosd')
            assert.isBoolean(status.installed)
            assert.isBoolean(status.nodeos)
            assert.isBoolean(status.cleos)
            assert.isBoolean(status.keosd)
        })

        test('Has paths if binaries are installed', async function () {
            this.timeout(5000)

            const status = await checkLeapInstallation()

            if (status.nodeos) {
                assert.property(status, 'nodeosPath')
                assert.isString(status.nodeosPath)
            }

            if (status.cleos) {
                assert.property(status, 'cleosPath')
                assert.isString(status.cleosPath)
            }

            if (status.keosd) {
                assert.property(status, 'keosdPath')
                assert.isString(status.keosdPath)
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
                assert.isTrue(status.cleos)
                assert.isTrue(status.keosd)
            }
        })
    })
})
