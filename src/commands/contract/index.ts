import * as prettier from 'prettier'
import * as ts from 'typescript'
import * as fs from 'fs'
import {abiToBlob, ContractKit} from '@wharfkit/contract'
import {generateContractClass} from './class'
import {generateImportStatement, getCoreImports} from './helpers'
import {generateActionNamesInterface, generateActionsNamespace} from './interfaces'
import {generateTableMap} from './maps'
import {generateNamespace, generateNamespaceName} from './namespace'
import {generateStructClasses} from './structs'
import {APIClient} from '@wharfkit/antelope'

const printer = ts.createPrinter()

interface CommandOptions {
    url: string
    file?: string
}

export async function generateContractFromCommand(contractName, {url, file}: CommandOptions) {
    const apiClient = new APIClient({url})
    const contractKit = new ContractKit({client: apiClient})

    log(`Fetching ABI for ${contractName}...`)
    const contract = await contractKit.load(contractName)

    log(`Generating Contract helpers for ${contractName}...`)
    const contractCode = await generateContract(contractName, contract.abi)

    log(`Generated Contract helper class for ${contractName}...`)
    if (file) {
        fs.writeFileSync(file, contractCode)
        log(`Generated Contract helper for ${contractName} saved to ${file}`)
    } else {
        log(`Generated Contract helper class:\n`)
        log(contractCode)
    }
}

export async function generateContract(contractName, abi) {
    try {
        const allAntelopeImports = [
            'ABI',
            'Action',
            'Blob',
            'Struct',
            'Name',
            ...getCoreImports(abi),
        ]
        const antelopeImports = allAntelopeImports.filter(
            (item, index) => allAntelopeImports.indexOf(item) === index
        )

        antelopeImports.sort()

        const importAntelopeStatement = generateImportStatement(
            antelopeImports,
            '@wharfkit/antelope'
        )

        const namespaceName = generateNamespaceName(contractName)

        const importContractStatement = generateImportStatement(
            ['ActionOptions', 'Contract as BaseContract', 'ContractArgs', 'PartialBy'],
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

        const exportStatement = ts.factory.createExportAssignment(
            undefined,
            false,
            ts.factory.createIdentifier(namespaceName)
        )

        // Generate types namespace
        const namespaceDeclaration = generateNamespace(namespaceName, [
            abiBlobField,
            abiField,
            classDeclaration,
            actionNamesInterface,
            actionsNamespace,
            generateNamespace('Types', structDeclarations),
            tableMap,
        ])

        const sourceFile = ts.factory.createSourceFile(
            [
                importAntelopeStatement,
                importContractStatement,
                namespaceDeclaration,
                exportStatement,
            ],
            ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
            ts.NodeFlags.None
        )

        const options = await prettier.resolveConfig(process.cwd())

        return prettier.format(printer.printFile(sourceFile), options)
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`An error occurred while generating the contract code: ${e}`)
        throw e
    }
}

function log(message) {
    process.stdout.write(`${message}\n`)
}
