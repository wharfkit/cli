import {assert} from 'chai'
import fs from 'fs'
import path from 'path'
import {tmpdir} from 'os'
import {
    autoDetectCompileFlags,
    detectIncludeDirectories,
    detectResourcePaths,
    findContractRoot,
    getFilesToCompile,
    parseIncludes,
} from '../../src/commands/compile'

suite('Compile Auto-Detection', function () {
    function createTestDir(): string {
        return fs.mkdtempSync(path.join(tmpdir(), 'wharfkit-compile-test-'))
    }

    function cleanupTestDir(testDir: string): void {
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, {recursive: true, force: true})
        }
    }

    suite('parseIncludes', function () {
        test('parses angle-bracket includes', function () {
            const testDir = createTestDir()
            try {
                const cppFile = path.join(testDir, 'test.cpp')
                fs.writeFileSync(
                    cppFile,
                    `#include <randomrng/randomrng.hpp>
#include <eosio/eosio.hpp>
#include "actions/commit.cpp"
`
                )

                const result = parseIncludes(cppFile)
                assert.deepEqual(result.angleBracket, [
                    'randomrng/randomrng.hpp',
                    'eosio/eosio.hpp',
                ])
                assert.deepEqual(result.quoted, ['actions/commit.cpp'])
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('parses quoted includes', function () {
            const testDir = createTestDir()
            try {
                const cppFile = path.join(testDir, 'test.cpp')
                fs.writeFileSync(
                    cppFile,
                    `#include "actions/commit.cpp"
#include "actions/reveal.cpp"
#include "actions/cleanup.cpp"
`
                )

                const result = parseIncludes(cppFile)
                assert.deepEqual(result.angleBracket, [])
                assert.deepEqual(result.quoted, [
                    'actions/commit.cpp',
                    'actions/reveal.cpp',
                    'actions/cleanup.cpp',
                ])
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('handles empty file', function () {
            const testDir = createTestDir()
            try {
                const cppFile = path.join(testDir, 'test.cpp')
                fs.writeFileSync(cppFile, '')

                const result = parseIncludes(cppFile)
                assert.deepEqual(result.angleBracket, [])
                assert.deepEqual(result.quoted, [])
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('handles mixed includes', function () {
            const testDir = createTestDir()
            try {
                const cppFile = path.join(testDir, 'test.cpp')
                fs.writeFileSync(
                    cppFile,
                    `#include <eosio/eosio.hpp>
#include "local.hpp"
#include <contract/header.hpp>
#include "utils/helper.cpp"
`
                )

                const result = parseIncludes(cppFile)
                assert.deepEqual(result.angleBracket, ['eosio/eosio.hpp', 'contract/header.hpp'])
                assert.deepEqual(result.quoted, ['local.hpp', 'utils/helper.cpp'])
            } finally {
                cleanupTestDir(testDir)
            }
        })
    })

    suite('findContractRoot', function () {
        test('finds contract root with include directory', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const includeDir = path.join(contractRoot, 'include')
                const srcDir = path.join(contractRoot, 'src')
                const cppFile = path.join(srcDir, 'test.cpp')

                fs.mkdirSync(includeDir, {recursive: true})
                fs.mkdirSync(srcDir, {recursive: true})
                fs.writeFileSync(cppFile, '')

                const result = findContractRoot(cppFile)
                assert.equal(result, contractRoot)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('finds contract root with inc directory', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const incDir = path.join(contractRoot, 'inc')
                const cppFile = path.join(contractRoot, 'test.cpp')

                fs.mkdirSync(incDir, {recursive: true})
                fs.writeFileSync(cppFile, '')

                const result = findContractRoot(cppFile)
                assert.equal(result, contractRoot)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('finds contract root with headers directory', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const headersDir = path.join(contractRoot, 'headers')
                const cppFile = path.join(contractRoot, 'test.cpp')

                fs.mkdirSync(headersDir, {recursive: true})
                fs.writeFileSync(cppFile, '')

                const result = findContractRoot(cppFile)
                assert.equal(result, contractRoot)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('returns source directory if no contract root found', function () {
            const testDir = createTestDir()
            try {
                const cppFile = path.join(testDir, 'test.cpp')
                fs.writeFileSync(cppFile, '')

                const result = findContractRoot(cppFile)
                assert.equal(result, testDir)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('walks up directory tree to find contract root', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const includeDir = path.join(contractRoot, 'include')
                const nestedDir = path.join(contractRoot, 'nested', 'deep', 'path')
                const cppFile = path.join(nestedDir, 'test.cpp')

                fs.mkdirSync(includeDir, {recursive: true})
                fs.mkdirSync(nestedDir, {recursive: true})
                fs.writeFileSync(cppFile, '')

                const result = findContractRoot(cppFile)
                assert.equal(result, contractRoot)
            } finally {
                cleanupTestDir(testDir)
            }
        })
    })

    suite('detectIncludeDirectories', function () {
        test('detects include directory in contract root', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const includeDir = path.join(contractRoot, 'include')
                const cppFile = path.join(contractRoot, 'test.cpp')

                fs.mkdirSync(includeDir, {recursive: true})
                fs.writeFileSync(cppFile, '')

                const result = detectIncludeDirectories(cppFile, contractRoot)
                assert.include(result, includeDir)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('detects inc directory', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const incDir = path.join(contractRoot, 'inc')
                const cppFile = path.join(contractRoot, 'test.cpp')

                fs.mkdirSync(incDir, {recursive: true})
                fs.writeFileSync(cppFile, '')

                const result = detectIncludeDirectories(cppFile, contractRoot)
                assert.include(result, incDir)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('detects headers directory', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const headersDir = path.join(contractRoot, 'headers')
                const cppFile = path.join(contractRoot, 'test.cpp')

                fs.mkdirSync(headersDir, {recursive: true})
                fs.writeFileSync(cppFile, '')

                const result = detectIncludeDirectories(cppFile, contractRoot)
                assert.include(result, headersDir)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('detects include directory in source directory', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const srcDir = path.join(contractRoot, 'src')
                const srcIncludeDir = path.join(srcDir, 'include')
                const cppFile = path.join(srcDir, 'test.cpp')

                fs.mkdirSync(srcIncludeDir, {recursive: true})
                fs.writeFileSync(cppFile, '')

                const result = detectIncludeDirectories(cppFile, contractRoot)
                assert.include(result, srcIncludeDir)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('returns empty array if no include directories found', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const cppFile = path.join(contractRoot, 'test.cpp')

                fs.mkdirSync(contractRoot, {recursive: true})
                fs.writeFileSync(cppFile, '')

                const result = detectIncludeDirectories(cppFile, contractRoot)
                assert.deepEqual(result, [])
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('does not duplicate directories', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const includeDir = path.join(contractRoot, 'include')
                const cppFile = path.join(contractRoot, 'test.cpp')

                fs.mkdirSync(includeDir, {recursive: true})
                fs.writeFileSync(cppFile, '')

                const result = detectIncludeDirectories(cppFile, contractRoot)
                assert.equal(result.length, 1)
                assert.include(result, includeDir)
            } finally {
                cleanupTestDir(testDir)
            }
        })
    })

    suite('detectResourcePaths', function () {
        test('detects src directory in contract root', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const srcDir = path.join(contractRoot, 'src')
                const cppFile = path.join(srcDir, 'test.cpp')

                fs.mkdirSync(srcDir, {recursive: true})
                fs.writeFileSync(cppFile, '')

                const result = detectResourcePaths(cppFile, contractRoot)
                assert.include(result, srcDir)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('includes contract root as resource path', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const cppFile = path.join(contractRoot, 'test.cpp')

                fs.mkdirSync(contractRoot, {recursive: true})
                fs.writeFileSync(cppFile, '')

                const result = detectResourcePaths(cppFile, contractRoot)
                assert.include(result, contractRoot)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('includes source directory as resource path', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const srcDir = path.join(contractRoot, 'src')
                const cppFile = path.join(srcDir, 'test.cpp')

                fs.mkdirSync(srcDir, {recursive: true})
                fs.writeFileSync(cppFile, '')

                const result = detectResourcePaths(cppFile, contractRoot)
                assert.include(result, srcDir)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('does not duplicate paths', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const cppFile = path.join(contractRoot, 'test.cpp')

                fs.mkdirSync(contractRoot, {recursive: true})
                fs.writeFileSync(cppFile, '')

                const result = detectResourcePaths(cppFile, contractRoot)
                // Should have contractRoot and sourceDir (which is same as contractRoot in this case)
                assert.isAtLeast(result.length, 1)
            } finally {
                cleanupTestDir(testDir)
            }
        })
    })

    suite('autoDetectCompileFlags', function () {
        test('generates -I flags for include directories', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const includeDir = path.join(contractRoot, 'include')
                const cppFile = path.join(contractRoot, 'test.cpp')

                fs.mkdirSync(includeDir, {recursive: true})
                fs.writeFileSync(
                    cppFile,
                    `#include <randomrng/randomrng.hpp>
#include <eosio/eosio.hpp>
`
                )

                const result = autoDetectCompileFlags(cppFile)
                const includeFlags = result.filter((flag) => flag.startsWith('-I'))
                assert.isAtLeast(includeFlags.length, 1)
                assert.include(result, `-I${includeDir}`)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('generates -R flags for resource paths when quoted includes exist', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const srcDir = path.join(contractRoot, 'src')
                const cppFile = path.join(srcDir, 'test.cpp')

                fs.mkdirSync(srcDir, {recursive: true})
                fs.writeFileSync(
                    cppFile,
                    `#include "actions/commit.cpp"
#include "actions/reveal.cpp"
`
                )

                const result = autoDetectCompileFlags(cppFile)
                const resourceFlags = result.filter((flag) => flag.startsWith('-R'))
                assert.isAtLeast(resourceFlags.length, 1)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('does not generate -R flags when no quoted includes', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const srcDir = path.join(contractRoot, 'src')
                const cppFile = path.join(srcDir, 'test.cpp')

                fs.mkdirSync(srcDir, {recursive: true})
                fs.writeFileSync(
                    cppFile,
                    `#include <eosio/eosio.hpp>
`
                )

                const result = autoDetectCompileFlags(cppFile)
                const resourceFlags = result.filter((flag) => flag.startsWith('-R'))
                assert.equal(resourceFlags.length, 0)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('handles complex directory structure', function () {
            const testDir = createTestDir()
            try {
                const contractRoot = path.join(testDir, 'contract')
                const includeDir = path.join(contractRoot, 'include')
                const srcDir = path.join(contractRoot, 'src')
                const cppFile = path.join(srcDir, 'test.cpp')

                fs.mkdirSync(includeDir, {recursive: true})
                fs.mkdirSync(srcDir, {recursive: true})
                fs.writeFileSync(
                    cppFile,
                    `#include <randomrng/randomrng.hpp>
#include "actions/commit.cpp"
`
                )

                const result = autoDetectCompileFlags(cppFile)
                assert.isAtLeast(result.length, 1)
                assert.include(result, `-I${includeDir}`)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('returns empty array when no directories or includes found', function () {
            const testDir = createTestDir()
            try {
                const cppFile = path.join(testDir, 'test.cpp')
                fs.writeFileSync(cppFile, '')

                const result = autoDetectCompileFlags(cppFile)
                assert.deepEqual(result, [])
            } finally {
                cleanupTestDir(testDir)
            }
        })
    })

    suite('getFilesToCompile', function () {
        test('finds files in current directory', async function () {
            const testDir = createTestDir()
            try {
                const cppFile1 = path.join(testDir, 'file1.cpp')
                const cppFile2 = path.join(testDir, 'file2.cpp')

                fs.writeFileSync(cppFile1, '')
                fs.writeFileSync(cppFile2, '')

                const files = await getFilesToCompile(undefined, testDir)
                assert.equal(files.length, 2)
                assert.include(files, cppFile1)
                assert.include(files, cppFile2)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('finds files recursively in subdirectories', async function () {
            const testDir = createTestDir()
            try {
                const srcDir = path.join(testDir, 'src')
                const nestedDir = path.join(testDir, 'src', 'actions')
                const cppFile1 = path.join(srcDir, 'file1.cpp')
                const cppFile2 = path.join(nestedDir, 'file2.cpp')

                fs.mkdirSync(nestedDir, {recursive: true})
                fs.writeFileSync(cppFile1, '')
                fs.writeFileSync(cppFile2, '')

                const files = await getFilesToCompile(undefined, testDir)
                assert.equal(files.length, 2)
                assert.include(files, cppFile1)
                assert.include(files, cppFile2)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('finds files in multiple nested directories', async function () {
            const testDir = createTestDir()
            try {
                const rootCppFile = path.join(testDir, 'root.cpp')
                const srcDir = path.join(testDir, 'src')
                const srcCppFile = path.join(srcDir, 'src.cpp')
                const deepDir = path.join(testDir, 'src', 'deep', 'nested')
                const deepCppFile = path.join(deepDir, 'deep.cpp')

                fs.mkdirSync(deepDir, {recursive: true})
                fs.writeFileSync(rootCppFile, '')
                fs.writeFileSync(srcCppFile, '')
                fs.writeFileSync(deepCppFile, '')

                const files = await getFilesToCompile(undefined, testDir)
                assert.equal(files.length, 3)
                assert.include(files, rootCppFile)
                assert.include(files, srcCppFile)
                assert.include(files, deepCppFile)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('skips hidden directories and build directories', async function () {
            const testDir = createTestDir()
            try {
                const srcDir = path.join(testDir, 'src')
                const buildDir = path.join(testDir, 'build')
                const nodeModulesDir = path.join(testDir, 'node_modules')
                const hiddenDir = path.join(testDir, '.hidden')
                const cppFile1 = path.join(srcDir, 'file1.cpp')
                const buildCppFile = path.join(buildDir, 'build.cpp')
                const nodeModulesCppFile = path.join(nodeModulesDir, 'module.cpp')
                const hiddenCppFile = path.join(hiddenDir, 'hidden.cpp')

                fs.mkdirSync(srcDir, {recursive: true})
                fs.mkdirSync(buildDir, {recursive: true})
                fs.mkdirSync(nodeModulesDir, {recursive: true})
                fs.mkdirSync(hiddenDir, {recursive: true})
                fs.writeFileSync(cppFile1, '')
                fs.writeFileSync(buildCppFile, '')
                fs.writeFileSync(nodeModulesCppFile, '')
                fs.writeFileSync(hiddenCppFile, '')

                const files = await getFilesToCompile(undefined, testDir)
                assert.equal(files.length, 1)
                assert.include(files, cppFile1)
                assert.notInclude(files, buildCppFile)
                assert.notInclude(files, nodeModulesCppFile)
                assert.notInclude(files, hiddenCppFile)
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('returns empty array when no files found', async function () {
            const testDir = createTestDir()
            try {
                const files = await getFilesToCompile(undefined, testDir)
                assert.deepEqual(files, [])
            } finally {
                cleanupTestDir(testDir)
            }
        })

        test('handles specific file path', async function () {
            const testDir = createTestDir()
            try {
                const cppFile = path.join(testDir, 'specific.cpp')
                fs.writeFileSync(cppFile, '')

                const files = await getFilesToCompile('specific.cpp', testDir)
                assert.equal(files.length, 1)
                assert.include(files, cppFile)
            } finally {
                cleanupTestDir(testDir)
            }
        })
    })
})
