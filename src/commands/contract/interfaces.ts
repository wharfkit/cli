import type {ABI} from '@wharfkit/antelope'
import ts from 'typescript'
import {findExternalType, parseType} from './helpers'
import {getActionFieldFromAbi} from './structs'
import {capitalizeName} from '../../utils'

export function generateActionNamesInterface(abi: ABI.Def): ts.InterfaceDeclaration {
    // Generate property signatures for each action
    const members = abi.actions.map((action) => {
        const actionName = String(action.name)
        const actionNameKey = actionName.includes('.') ? `'${actionName}'` : actionName

        const actionNameCapitalized = capitalizeName(actionName)

        return ts.factory.createPropertySignature(
            undefined,
            actionNameKey,
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
        capitalizeName(actionStruct.structName),
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

function findParamTypeString(typeString: string, namespace = '', abi: ABI.Def): string {
    const fieldType = findExternalType(typeString, namespace, abi)

    if (fieldType === 'Symbol') {
        return 'Asset.SymbolType'
    }

    if (fieldType === 'Symbol[]') {
        return 'Asset.SymbolType[]'
    }

    if (fieldType === 'Bool[]') {
        return 'boolean[]'
    }

    if (fieldType === 'Bool') {
        return 'boolean'
    }

    return parseType(fieldType)
}
