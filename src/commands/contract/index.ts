import * as eslint from 'eslint'
import * as fs from 'fs'
import * as prettier from 'prettier'
import * as ts from 'typescript'

import type {ABI} from '@wharfkit/session'
import type {ABIDef} from '@wharfkit/antelope'
import {abiToBlob, ContractKit} from '@wharfkit/contract'

import {log, makeClient} from '../../utils'
import {generateContractClass} from './class'
import {generateImportStatement, getCoreImports} from './helpers'
import {generateActionNamesInterface, generateActionsNamespace} from './interfaces'
import {generateTableMap, generateTableTypesInterface} from './maps'
import {generateNamespace} from './namespace'
import {generateStructClasses} from './structs'
import {generateActionsTypeAlias, generateRowType, generateTablesTypeAlias} from './types'

const printer = ts.createPrinter()

interface CommandOptions {
    url: string
    file?: string
    json?: string
    eslintrc?: string
}

export async function generateContractFromCommand(
    contractName,
    {url, file, json, eslintrc}: CommandOptions
) {
    let abi: ABIDef | undefined

    if (json) {
        log(`Loading ABI from ${json}...`)

        const abiString = fs.readFileSync(json, 'utf8')

        abi = JSON.parse(abiString)
    } else {
        log(`Fetching ABI for ${contractName}...`)
    }

    const contractKit = new ContractKit(
        {client: makeClient(url)},
        {
            abis: abi
                ? [
                      {
                          name: contractName,
                          abi,
                      },
                  ]
                : undefined,
        }
    )

    const contract = await contractKit.load(contractName)

    log(`Generating Contract helpers for ${contractName}...`)
    const contractCode = await generateContract(contractName, contract.abi, eslintrc)

    log(`Generated Contract helper class for ${contractName}...`)
    if (file) {
        fs.writeFileSync(file, contractCode)
        log(`Generated Contract helper for ${contractName} saved to ${file}`)
    } else {
        log(`Generated Contract helper class:\n`)
        log(contractCode, 'info')
    }
}

export async function generateContract(contractName: string, abi: ABI, eslintrc?: string) {
    try {
        const {classes, types} = getCoreImports(abi)

        const allAntelopeTypeImports = ['Action', ...types]

        const importAntelopeTypesStatement = generateImportStatement(
            cleanupImports(allAntelopeTypeImports),
            '@wharfkit/antelope',
            true
        )

        const allAntelopeClassImports = ['ABI', 'Blob', 'Struct', 'Name', ...classes]

        const importAntelopeClassesStatement = generateImportStatement(
            cleanupImports(allAntelopeClassImports),
            '@wharfkit/antelope'
        )

        const importContractTypesStatement = generateImportStatement(
            ['ActionOptions', 'ContractArgs', 'PartialBy', 'Table'],
            '@wharfkit/contract',
            true
        )

        const importContractClassStatement = generateImportStatement(
            ['Contract as BaseContract'],
            '@wharfkit/contract'
        )

        const {classDeclaration} = await generateContractClass(contractName, abi)

        const actionNamesInterface = generateActionNamesInterface(abi)

        const actionsNamespace = generateActionsNamespace(abi)

        // Iterate through structs and create struct classes with fields
        const structDeclarations = generateStructClasses(abi)

        // Encode the ABI as a binary hex string
        const abiBlob = abiToBlob(abi)

        // Generate `abiBlob` field
        const abiBlobField = ts.factory.createVariableStatement(
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            ts.factory.createVariableDeclarationList(
                [
                    ts.factory.createVariableDeclaration(
                        'abiBlob',
                        undefined,
                        undefined,
                        ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(
                                ts.factory.createIdentifier('Blob'),
                                ts.factory.createIdentifier('from')
                            ),
                            undefined,
                            [ts.factory.createStringLiteral(String(abiBlob))]
                        )
                    ),
                ],
                ts.NodeFlags.Const
            )
        )

        // Generate `abiBlob` field
        const abiField = ts.factory.createVariableStatement(
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            ts.factory.createVariableDeclarationList(
                [
                    ts.factory.createVariableDeclaration(
                        'abi',
                        undefined,
                        undefined,
                        ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(
                                ts.factory.createIdentifier('ABI'),
                                ts.factory.createIdentifier('from')
                            ),
                            undefined,
                            [ts.factory.createIdentifier('abiBlob')]
                        )
                    ),
                ],
                ts.NodeFlags.Const
            )
        )

        const tableMap = generateTableMap(abi)
        const tableTypes = generateTableTypesInterface(abi)

        const tablesTypeAlias = generateTablesTypeAlias()
        const actionsTypeAlias = generateActionsTypeAlias()
        const rowTypeAlias = generateRowType()

        const sourceFile = ts.factory.createSourceFile(
            [
                importAntelopeTypesStatement,
                importAntelopeClassesStatement,
                importContractTypesStatement,
                importContractClassStatement,
                abiBlobField,
                abiField,
                classDeclaration,
                actionNamesInterface,
                actionsNamespace,
                generateNamespace('Types', structDeclarations),
                tableMap,
                tableTypes,
                rowTypeAlias,
                actionsTypeAlias,
                tablesTypeAlias,
            ],
            ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
            ts.NodeFlags.None
        )

        return runPrettier(printer.printFile(sourceFile), eslintrc)
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`An error occurred while generating the contract code: ${e}`)
        throw e
    }
}

async function runPrettier(codeText: string, eslintrc?: string): Promise<string> {
    // First prettier and then eslint fix, cause prettier result cann't pass eslint check
    const prettiered = prettier.format(codeText, {
        arrowParens: 'always',
        bracketSpacing: false,
        endOfLine: 'lf',
        printWidth: 100,
        semi: false,
        singleQuote: true,
        tabWidth: 4,
        trailingComma: 'es5',
        parser: 'typescript',
    })

    const linter = new eslint.ESLint({
        useEslintrc: false,
        fix: true,
        baseConfig: {},
        overrideConfigFile: eslintrc ? eslintrc : null,
    })
    const results = await linter.lintText(prettiered)
    return results[0].output ? results[0].output : prettiered
}

function cleanupImports(imports: string[]) {
    imports = imports.filter((item, index) => imports.indexOf(item) === index)

    imports.sort()

    return imports
}
