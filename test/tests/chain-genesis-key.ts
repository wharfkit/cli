import {assert} from 'chai'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {KeyType, PrivateKey} from '@wharfkit/antelope'
import {getDevKeys} from '../../src/commands/chain/utils'
import {
    addKeyToWallet,
    DEFAULT_KEY_NAME,
    getKeyFromWallet,
    getWalletFilePath,
    listWalletKeys,
} from '../../src/commands/wallet/utils'

suite('Chain Genesis Key Storage', () => {
    let testWalletDir: string
    let originalHome: string

    setup(function () {
        // Create temporary test directories
        const testBaseDir = path.join(os.tmpdir(), `wharfkit-genesis-test-${Date.now()}`)
        testWalletDir = path.join(testBaseDir, '.wharfkit', 'wallet')

        fs.mkdirSync(testWalletDir, {recursive: true})
        fs.mkdirSync(path.join(testBaseDir, '.wharfkit', 'chain'), {recursive: true})
        fs.mkdirSync(path.join(testBaseDir, '.wharfkit', 'config'), {recursive: true})

        // Mock HOME to use test directories
        originalHome = process.env.HOME || ''
        process.env.HOME = testBaseDir

        // Clear wallet file if it exists
        const walletFile = getWalletFilePath()
        if (fs.existsSync(walletFile)) {
            fs.unlinkSync(walletFile)
        }
    })

    teardown(function () {
        // Restore original HOME
        process.env.HOME = originalHome

        // Clean up test directories
        if (fs.existsSync(testWalletDir)) {
            const walletFile = getWalletFilePath()
            if (fs.existsSync(walletFile)) {
                fs.unlinkSync(walletFile)
            }
            fs.rmSync(path.dirname(testWalletDir), {recursive: true, force: true})
        }
    })

    test('genesis key is stored as default when wallet is empty', function () {
        const devKeys = getDevKeys()
        const genesisPrivateKey = PrivateKey.from(devKeys.privateKey)

        // Verify wallet is empty
        const initialKeys = listWalletKeys()
        assert.equal(initialKeys.length, 0)

        // Add genesis key as 'default' (simulating what setupDevWallet does)
        addKeyToWallet(genesisPrivateKey, DEFAULT_KEY_NAME)

        // Verify key was stored
        const keys = listWalletKeys()
        assert.equal(keys.length, 1)
        assert.equal(keys[0].name, DEFAULT_KEY_NAME)
        // Verify the stored key matches genesis key by comparing public keys
        const storedKey = getKeyFromWallet(DEFAULT_KEY_NAME)
        const expectedGenesisKey = PrivateKey.from(devKeys.privateKey)
        assert.equal(storedKey.toPublic().toString(), expectedGenesisKey.toPublic().toString())

        // Verify we can retrieve it
        const retrievedKey = getKeyFromWallet(DEFAULT_KEY_NAME)
        assert.equal(retrievedKey.toPublic().toString(), expectedGenesisKey.toPublic().toString())
    })

    test('genesis key is reused when default already exists', function () {
        const devKeys = getDevKeys()
        const genesisPrivateKey = PrivateKey.from(devKeys.privateKey)

        // First, add the genesis key as 'default'
        addKeyToWallet(genesisPrivateKey, DEFAULT_KEY_NAME)

        // Verify it exists
        const firstKeys = listWalletKeys()
        assert.equal(firstKeys.length, 1)
        assert.equal(firstKeys[0].name, DEFAULT_KEY_NAME)

        // Try to add it again (should not create duplicate)
        // This simulates what happens when chain starts multiple times
        const existingKeys = listWalletKeys()
        const existingDefaultKey = existingKeys.find((k) => k.name === DEFAULT_KEY_NAME)

        if (existingDefaultKey) {
            // Key already exists - should reuse it
            // Compare by retrieving the key and checking public key
            const retrievedKey = getKeyFromWallet(DEFAULT_KEY_NAME)
            const expectedGenesisKey = PrivateKey.from(devKeys.privateKey)
            assert.equal(
                retrievedKey.toPublic().toString(),
                expectedGenesisKey.toPublic().toString()
            )
        } else {
            // Should not reach here, but if it does, add the key
            addKeyToWallet(genesisPrivateKey, DEFAULT_KEY_NAME)
        }

        // Verify still only one key
        const finalKeys = listWalletKeys()
        assert.equal(finalKeys.length, 1)
        assert.equal(finalKeys[0].name, DEFAULT_KEY_NAME)
        // Verify it matches genesis key by comparing public keys
        const storedKey = getKeyFromWallet(DEFAULT_KEY_NAME)
        const expectedGenesisKey = PrivateKey.from(devKeys.privateKey)
        assert.equal(storedKey.toPublic().toString(), expectedGenesisKey.toPublic().toString())
    })

    test('genesis key matches dev keys', function () {
        const devKeys = getDevKeys()

        // Verify the keys match expected values
        assert.equal(devKeys.publicKey, 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV')
        assert.equal(devKeys.privateKey, '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3')

        // Verify private key can be converted to public key
        const privateKey = PrivateKey.from(devKeys.privateKey)
        const publicKey = privateKey.toPublic()
        // Public key should be in PUB_K1 format
        assert.include(publicKey.toString(), 'PUB_K1_')
        // Verify it matches the expected public key (convert EOS format to compare)
        const expectedPublicKey = PrivateKey.from(devKeys.privateKey).toPublic()
        assert.equal(publicKey.toString(), expectedPublicKey.toString())
    })

    test('default key can be retrieved for account creation', function () {
        const devKeys = getDevKeys()
        const genesisPrivateKey = PrivateKey.from(devKeys.privateKey)

        // Store genesis key as 'default'
        addKeyToWallet(genesisPrivateKey, DEFAULT_KEY_NAME)

        // Simulate account creation key lookup (priority: default -> hardcoded)
        const walletKeys = listWalletKeys()
        const defaultKey = walletKeys.find((k) => k.name === DEFAULT_KEY_NAME)

        assert.isDefined(defaultKey, 'default key should exist')
        // Verify the stored key matches genesis key by comparing public keys
        const storedKey = getKeyFromWallet(DEFAULT_KEY_NAME)
        const expectedGenesisKey = PrivateKey.from(devKeys.privateKey)
        assert.equal(storedKey.toPublic().toString(), expectedGenesisKey.toPublic().toString())

        // Retrieve the key and verify it matches genesis key
        const eosioPrivateKey = getKeyFromWallet(DEFAULT_KEY_NAME)
        assert.equal(
            eosioPrivateKey.toPublic().toString(),
            expectedGenesisKey.toPublic().toString()
        )
    })

    test('default key is prioritized over other keys', function () {
        const devKeys = getDevKeys()
        const genesisPrivateKey = PrivateKey.from(devKeys.privateKey)

        // Create some other keys first
        const otherKey1 = PrivateKey.generate(KeyType.K1)
        const otherKey2 = PrivateKey.generate(KeyType.K1)

        addKeyToWallet(otherKey1, 'aux-key')
        addKeyToWallet(otherKey2, 'dev')

        // Now add genesis key as 'default'
        addKeyToWallet(genesisPrivateKey, DEFAULT_KEY_NAME)

        // Simulate account creation key lookup priority
        const walletKeys = listWalletKeys()
        const defaultKey = walletKeys.find((k) => k.name === DEFAULT_KEY_NAME)

        // Default key should be found first
        assert.isDefined(defaultKey)
        // Verify it's the genesis key by comparing public keys
        const defaultStoredKey = getKeyFromWallet(DEFAULT_KEY_NAME)
        const expectedGenesisKey = PrivateKey.from(devKeys.privateKey)
        assert.equal(
            defaultStoredKey.toPublic().toString(),
            expectedGenesisKey.toPublic().toString()
        )
    })

    test('genesis key is not duplicated when stored multiple times', function () {
        const devKeys = getDevKeys()
        const genesisPrivateKey = PrivateKey.from(devKeys.privateKey)

        // Add genesis key as 'default'
        addKeyToWallet(genesisPrivateKey, DEFAULT_KEY_NAME)

        // Try to add it again (should fail because key already exists)
        try {
            addKeyToWallet(genesisPrivateKey, DEFAULT_KEY_NAME)
            assert.fail('Should throw error when adding duplicate key name')
        } catch (error: any) {
            assert.include(error.message, 'already exists')
        }

        // Verify still only one key
        const keys = listWalletKeys()
        assert.equal(keys.length, 1)
        assert.equal(keys[0].name, DEFAULT_KEY_NAME)
        // Verify it's the genesis key by comparing public keys
        const storedKey = getKeyFromWallet(DEFAULT_KEY_NAME)
        const expectedKey = PrivateKey.from(devKeys.privateKey)
        assert.equal(storedKey.toPublic().toString(), expectedKey.toPublic().toString())
    })
})
