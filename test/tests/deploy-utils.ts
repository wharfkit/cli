import {assert} from 'chai'
import {Asset} from '@wharfkit/antelope'
import {
    calculateRamCost,
    calculateRamNeeded,
    formatBytes,
} from '../../src/commands/contract/deploy-utils'

suite('deploy-utils', function () {
    suite('calculateRamNeeded', function () {
        test('calculates RAM for small contract', function () {
            // 1KB WASM + 500 bytes ABI
            const wasmSize = 1024
            const abiSize = 500

            const ramNeeded = calculateRamNeeded(wasmSize, abiSize)

            // setcode requires 10x WASM, setabi requires ABI size
            // Then 1% buffer is added
            // Formula in code: setcodeRam + setabiRam + ceil((setcodeRam + setabiRam) * 0.01)
            const setcodeRam = wasmSize * 10
            const setabiRam = abiSize
            const buffer = Math.ceil((setcodeRam + setabiRam) * 0.01)
            const expected = setcodeRam + setabiRam + buffer
            assert.equal(ramNeeded, expected)
        })

        test('calculates RAM for medium contract', function () {
            // 50KB WASM + 10KB ABI
            const wasmSize = 50 * 1024
            const abiSize = 10 * 1024

            const ramNeeded = calculateRamNeeded(wasmSize, abiSize)

            // setcode needs 10x WASM, setabi needs ABI size, plus 1% buffer
            const setcodeRam = wasmSize * 10
            const setabiRam = abiSize
            const buffer = Math.ceil((setcodeRam + setabiRam) * 0.01)
            const expected = setcodeRam + setabiRam + buffer
            assert.equal(ramNeeded, expected)
        })

        test('calculates RAM for large contract', function () {
            // 200KB WASM + 50KB ABI
            const wasmSize = 200 * 1024
            const abiSize = 50 * 1024

            const ramNeeded = calculateRamNeeded(wasmSize, abiSize)

            const setcodeRam = wasmSize * 10
            const setabiRam = abiSize
            const buffer = Math.ceil((setcodeRam + setabiRam) * 0.01)
            const expected = setcodeRam + setabiRam + buffer
            assert.equal(ramNeeded, expected)
            // Should be around 2.1MB
            assert.isAbove(ramNeeded, 2 * 1024 * 1024)
        })
    })

    suite('calculateRamCost', function () {
        test('calculates cost for small amount of RAM', function () {
            // 10KB of RAM at 0.001 EOS per byte
            const bytesNeeded = 10 * 1024
            const pricePerByte = 0.0001
            const symbol = 'EOS'

            const cost = calculateRamCost(bytesNeeded, pricePerByte, symbol)

            // Expected: 10240 * 0.0001 * 1.005 (0.5% fee) = 1.02912
            assert.instanceOf(cost, Asset)
            assert.include(String(cost), 'EOS')
            // Value should be close to 1.03 (with fee)
            assert.isAbove(cost.value, 1)
            assert.isBelow(cost.value, 1.1)
        })

        test('uses correct symbol', function () {
            const bytesNeeded = 1000
            const pricePerByte = 0.0001
            const symbol = 'WAX'

            const cost = calculateRamCost(bytesNeeded, pricePerByte, symbol)

            assert.include(String(cost), 'WAX')
        })

        test('handles zero bytes', function () {
            const cost = calculateRamCost(0, 0.0001, 'EOS')
            assert.equal(cost.value, 0)
        })
    })

    suite('formatBytes', function () {
        test('formats bytes', function () {
            assert.equal(formatBytes(500), '500 bytes')
            assert.equal(formatBytes(1023), '1023 bytes')
        })

        test('formats kilobytes', function () {
            assert.equal(formatBytes(1024), '1.00 KB')
            assert.equal(formatBytes(2048), '2.00 KB')
            assert.equal(formatBytes(10240), '10.00 KB')
            assert.equal(formatBytes(1536), '1.50 KB')
        })

        test('formats megabytes', function () {
            assert.equal(formatBytes(1024 * 1024), '1.00 MB')
            assert.equal(formatBytes(2 * 1024 * 1024), '2.00 MB')
            assert.equal(formatBytes(1.5 * 1024 * 1024), '1.50 MB')
        })

        test('handles edge cases', function () {
            assert.equal(formatBytes(0), '0 bytes')
            assert.equal(formatBytes(1), '1 bytes')
        })
    })
})
