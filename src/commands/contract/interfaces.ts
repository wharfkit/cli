import type {ABI} from '@wharfkit/antelope'
import ts from 'typescript'
import {capitalize} from '@wharfkit/contract'
import {findExternalType} from './helpers'
import {getActionFieldFromAbi} from './structs'

export function generateActionNamesInterface(abi: ABI.Def): ts.InterfaceDeclaration {
    // Generate property signatures for each action
    const members = abi.actions.map((action) => {
        const actionName = String(action.name)
        const actionNameCapitalized = capitalize(actionName)

        return ts.factory.createPropertySignature(
            undefined,
            actionName,
            undefined,
            ts.factory.createTypeReferenceNode(`ActionParams.${actionNameCapitalized}`)
        )
    })

    return ts.factory.createInterfaceDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        'ActionNameParams',
        undefined,
        undefined,
        members
    )
}

export function generateActionInterface(actionStruct, abi): ts.InterfaceDeclaration {
    const members = actionStruct.fields.map((field) => {
        const typeReferenceNode = ts.factory.createTypeReferenceNode(
            findParamTypeString(field.type, 'Types.', abi)
        )

        return ts.factory.createPropertySignature(
            undefined,
            field.name.toLowerCase(),
            field.optional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
            typeReferenceNode
        )
    })

    return ts.factory.createInterfaceDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        capitalize(actionStruct.structName),
        undefined,
        undefined,
        members
    )
}

export function generateActionsNamespace(abi: ABI.Def): ts.ModuleDeclaration {
    const actionStructsWithFields = getActionFieldFromAbi(abi)

    const interfaces = abi.actions.map((action) => {
        const actionStruct = actionStructsWithFields.find(
            (actionStructWithField) => actionStructWithField.structName === action.type
        )
        return generateActionInterface(actionStruct, abi)
    })

    return ts.factory.createModuleDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier('ActionParams'),
        ts.factory.createModuleBlock(interfaces),
        ts.NodeFlags.Namespace
    )
}

function findParamTypeString(typeString: string, namespace: string | null, abi: ABI.Def): string {
    const fieldType = findExternalType(typeString, abi, namespace ? namespace : undefined)

    if (fieldType === 'Symbol') {
        return 'Asset.SymbolType'
    }

    if (fieldType === 'Bool') {
        return 'boolean'
    }

    if (['String', 'Boolean', 'Number'].includes(fieldType)) {
        return fieldType.toLowerCase()
    }

    return fieldType
}
