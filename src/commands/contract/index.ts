import * as prettier from 'prettier'
import * as ts from 'typescript'
import {abiToBlob, ContractKit} from '@wharfkit/contract'
import {generateContractClass} from './contract'
import {generateImportStatement, getCoreImports} from './helpers'
import {generateActionNamesInterface, generateActionsNamespace} from './interfaces'
import {generateTableMap} from './maps'
import {generateNamespace, generateNamespaceName} from './namespace'
import {generateStructClasses} from './structs'
import { APIClient } from '@wharfkit/antelope'

const printer = ts.createPrinter()

export async function generateContractFromParams(contractName, { url }) {
    const apiClient = new APIClient({ url })
    const contractKit = new ContractKit({ client: apiClient })
    const contract = await contractKit.load(contractName)

    return generateContract(contractName, contract.abi)
}

export async function generateContract(contractName, abi) {
    try {
        const namespaceName = generateNamespaceName(contractName)

        const importContractStatement = generateImportStatement(
            ['ActionOptions', 'Contract as BaseContract', 'ContractArgs', 'PartialBy'],
            '@wharfkit/contract'
        )

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

        const importCoreStatement = generateImportStatement(antelopeImports, '@wharfkit/antelope')

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
            [importContractStatement, importCoreStatement, namespaceDeclaration, exportStatement],
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
