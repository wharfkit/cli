import type {ABI} from '@wharfkit/antelope'
import ts from 'typescript'
import {findAbiStruct, findExternalType, parseType, removeDuplicateInterfaces} from './helpers'
import {getActionFieldFromAbi} from './structs'

export function generateActionNamesInterface(abi: ABI.Def): ts.InterfaceDeclaration {
    // Generate property signatures for each action
    const members = abi.actions.map((action) => {
        const actionName = String(action.name)
        const actionNameKey = actionName.includes('.') ? `'${actionName}'` : actionName

        return ts.factory.createPropertySignature(
            undefined,
            actionNameKey,
            undefined,
            ts.factory.createTypeReferenceNode(`ActionParams.${actionName}`)
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

export function generateActionInterface(struct, abi): { actionInterface: ts.InterfaceDeclaration, typeInterfaces: ts.InterfaceDeclaration[] } {
    const typeInterfaces: ts.InterfaceDeclaration[] = []

    const members = struct.fields.map((field) => {
        const typeReferenceNode = ts.factory.createTypeReferenceNode(
            findParamTypeString(field.type, 'Types.', abi)
        )

        // We need to check for types and variants. We also need to add core types that may be used in structs that are
        // used in action params (the check will have to recursivly look for those structs). Optionally, we can add all
        // core types and have eslint remove them.
        if (field.type === 'blockchain_parameters_v1') {
            console.log({type: field.type})
        }

        const typeStruct = findAbiStruct(field.type, abi)

        if (typeStruct) {
            const interfaces = generateActionInterface(typeStruct, abi)
            
            typeInterfaces.push(interfaces.actionInterface, ...interfaces.typeInterfaces)
        }

        return ts.factory.createPropertySignature(
            undefined,
            field.name.toLowerCase(),
            field.optional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
            typeReferenceNode
        )
    })

    const actionInterface = ts.factory.createInterfaceDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        struct.structName || struct.name,
        undefined,
        undefined,
        members
    )

    return { actionInterface, typeInterfaces: removeDuplicateInterfaces(typeInterfaces) }
}

export function generateActionsNamespace(abi: ABI.Def): ts.ModuleDeclaration {
    const actionStructsWithFields = getActionFieldFromAbi(abi)

    const typeInterfaces: ts.InterfaceDeclaration[] = []

    const interfaces = abi.actions.map((action) => {
        const actionStruct = actionStructsWithFields.find(
            (actionStructWithField) => actionStructWithField.structName === action.type
        )

        const interfaces = generateActionInterface(actionStruct, abi)

        if (interfaces.actionInterface) {
            typeInterfaces.push(...interfaces.typeInterfaces)
        }
            
        return interfaces.actionInterface
    })

    const actionParamsTypes = ts.factory.createModuleDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier('Types'),
        ts.factory.createModuleBlock(
            removeDuplicateInterfaces(typeInterfaces)
        ),
        ts.NodeFlags.Namespace
    )

    return ts.factory.createModuleDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier('ActionParams'),
        ts.factory.createModuleBlock([actionParamsTypes, ...interfaces]),
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
