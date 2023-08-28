import {ABI} from '@wharfkit/antelope'
import * as ts from 'typescript'
import {findAbiType} from './helpers'

export function generateTableMap(abi: ABI.Def): ts.VariableStatement {
    // Map over tables to create the object properties
    const tableProperties = abi.tables.map((table) =>
        ts.factory.createPropertyAssignment(
            JSON.stringify(table.name),
            ts.factory.createIdentifier(findAbiType(table.type, abi, 'Types.') || table.type)
        )
    )

    // Create the TableMap structure
    const tableMap = ts.factory.createObjectLiteralExpression(tableProperties, true)

    // Declare the variable
    return ts.factory.createVariableStatement(
        undefined,
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
