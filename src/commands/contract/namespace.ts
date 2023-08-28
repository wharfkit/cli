import * as ts from 'typescript'

import {capitalize} from '@wharfkit/contract'

// Generates a namespace name for a contract (eg. _EosioToken for eosio.token)
export function generateNamespaceName(contractName: string) {
    return contractName
        .split('.')
        .map((namePart) => capitalize(namePart))
        .join('')
}

export function generateNamespace(
    namespaceName: string,
    children,
    isExport = true
): ts.ModuleDeclaration {
    return ts.factory.createModuleDeclaration(
        isExport ? [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)] : [], // modifiers
        ts.factory.createIdentifier(namespaceName),
        ts.factory.createModuleBlock(children),
        ts.NodeFlags.Namespace
    )
}
