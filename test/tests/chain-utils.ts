import {assert} from 'chai'
import * as os from 'os'
import {
    getConfigIni,
    getDefaultConfigDir,
    getDefaultDataDir,
    getDefaultWalletDir,
    getDevKeys,
    getGenesisJson,
    getPidFilePath,
    getPlatform,
} from '../../src/commands/chain/utils'

suite('Chain Utils', function () {
    suite('Directory Functions', function () {
        test('Returns default data directory', function () {
            const dataDir = getDefaultDataDir()
            assert.isString(dataDir)
            assert.include(dataDir, '.wharfkit')
            assert.include(dataDir, 'chain')
        })

        test('Returns default config directory', function () {
            const configDir = getDefaultConfigDir()
            assert.isString(configDir)
            assert.include(configDir, '.wharfkit')
            assert.include(configDir, 'config')
        })

        test('Returns default wallet directory', function () {
            const walletDir = getDefaultWalletDir()
            assert.isString(walletDir)
            assert.include(walletDir, '.wharfkit')
            assert.include(walletDir, 'wallet')
        })

        test('Returns PID file path', function () {
            const pidFile = getPidFilePath()
            assert.isString(pidFile)
            assert.include(pidFile, 'nodeos.pid')
        })
    })

    suite('Dev Keys', function () {
        test('Returns development keys', function () {
            const keys = getDevKeys()
            assert.isObject(keys)
            assert.property(keys, 'publicKey')
            assert.property(keys, 'privateKey')
            assert.isString(keys.publicKey)
            assert.isString(keys.privateKey)
            assert.match(keys.publicKey, /^EOS/)
            assert.equal(keys.publicKey, 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV')
            assert.equal(keys.privateKey, '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3')
        })
    })

    suite('Configuration', function () {
        test('Generates valid genesis JSON', function () {
            const genesisJson = getGenesisJson()
            assert.isString(genesisJson)

            const genesis = JSON.parse(genesisJson)
            assert.isObject(genesis)
            assert.property(genesis, 'initial_timestamp')
            assert.property(genesis, 'initial_key')
            assert.property(genesis, 'initial_configuration')
            assert.equal(
                genesis.initial_key,
                'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV'
            )
        })

        test('Generates valid config.ini', function () {
            const port = 8888
            const configIni = getConfigIni(port)

            assert.isString(configIni)
            assert.include(configIni, `http-server-address = 0.0.0.0:${port}`)
            assert.include(configIni, 'producer-name = eosio')
            assert.include(configIni, 'plugin = eosio::chain_api_plugin')
            assert.include(configIni, 'plugin = eosio::http_plugin')
        })

        test('Includes dev keys in config', function () {
            const port = 8888
            const configIni = getConfigIni(port)
            const devKeys = getDevKeys()

            assert.include(configIni, devKeys.publicKey)
            assert.include(configIni, devKeys.privateKey)
        })
    })

    suite('Platform Detection', function () {
        test('Returns platform information', function () {
            const platform = getPlatform()
            assert.isObject(platform)
            assert.property(platform, 'os')
            assert.property(platform, 'arch')
            assert.isString(platform.os)
            assert.isString(platform.arch)
        })

        test('Matches Node.js platform', function () {
            const platform = getPlatform()
            assert.equal(platform.os, os.platform())
            assert.equal(platform.arch, os.arch())
        })
    })
})
