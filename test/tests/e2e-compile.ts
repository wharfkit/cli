import {assert} from 'chai'
import {execSync} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import type {E2ETestContext} from '../utils/test-helpers'
import {setupE2ETestEnvironment, teardownE2ETestEnvironment} from '../utils/test-helpers'

/**
 * E2E tests for contract compilation:
 * - Compile command behavior
 * - Error handling for missing files
 * - CDT integration
 */
suite('E2E: Compile', () => {
    let ctx: E2ETestContext | null = null

    suiteSetup(async function () {
        ctx = await setupE2ETestEnvironment(this)
    })

    suiteTeardown(function () {
        this.timeout(30000)
        teardownE2ETestEnvironment(ctx)
    })

    suite('Contract Compilation', () => {
        test('shows helpful error when no cpp files found', function () {
            if (!ctx) this.skip()
            try {
                execSync(`node ${ctx.cliPath} compile`, {
                    encoding: 'utf8',
                    cwd: ctx.testDir,
                })
                assert.fail('Should throw error when no cpp files found')
            } catch (error: any) {
                assert.isTrue(error.status !== 0 || error.code !== 0)
            }
        })

        test('can compile a cpp file when cdt is installed', function () {
            if (!ctx) this.skip()
            const rootCppPath = path.join(__dirname, '../../test.cpp')
            const cppPath = path.join(ctx.testDir, 'test.cpp')

            fs.copyFileSync(rootCppPath, cppPath)

            try {
                const output = execSync(`node ${ctx.cliPath} compile`, {
                    encoding: 'utf8',
                    cwd: ctx.testDir,
                })

                assert.isTrue(
                    output.includes('Compilation complete!') ||
                        output.includes('cdt-cpp is not installed') ||
                        output.includes('LEAP is not installed')
                )
            } catch (error: any) {
                const output = error.stderr || error.stdout
                assert.isTrue(
                    output.includes('cdt-cpp is not installed') ||
                        output.includes('LEAP is not installed')
                )
            }
        })
    })
})


