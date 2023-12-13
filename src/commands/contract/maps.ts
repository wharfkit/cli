import type {ABI} from '@wharfkit/antelope'
import * as ts from 'typescript'
import {findAbiType} from './finders'

export function generateTableMap(abi: ABI.Def): ts.VariableStatement {
    // Map over tables to create the object properties
    const tableProperties = abi.tables.map((table) =>
        ts.factory.createPropertyAssignment(
            JSON.stringify(table.name),
            ts.factory.createIdentifier(findAbiType(table.type, abi, 'Types.')?.type || table.type)
        )
    )

    // Create the TableMap structure
    const tableMap = ts.factory.createObjectLiteralExpression(tableProperties, true)

    // Declare the variable
    return ts.factory.createVariableStatement(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createVariableDeclarationList(
            [
                ts.factory.createVariableDeclaration(
                    ts.factory.createIdentifier('TableMap'),
                    undefined,
                    undefined,
                    tableMap
                ),
            ],
            ts.NodeFlags.Const
        )
    )
}

export function generateTableTypesInterface(abi: ABI.Def): ts.InterfaceDeclaration {
    // Generate interface members
    const members = abi.tables.map((table) =>
        ts.factory.createPropertySignature(
            undefined,
            JSON.stringify(table.name),
            undefined,
            ts.factory.createTypeReferenceNode(
                findAbiType(table.type, abi, 'Types.')?.type || table.type
            )
        )
    )

    // Create the interface declaration
    const interfaceDeclaration = ts.factory.createInterfaceDeclaration(
        undefined,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier('TableTypes'),
        undefined,
        undefined,
        members
    )

    return interfaceDeclaration
}
