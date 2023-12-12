import type {ABI} from '@wharfkit/antelope'
import ts from 'typescript'
import {parseType, removeDuplicateInterfaces} from './helpers'
import {getActionFieldFromAbi} from './structs'
import { findAbiStruct, findAliasType, findExternalType, findVariant } from './finders'

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

export type TypeInterfaceDeclaration = ts.InterfaceDeclaration | ts.TypeAliasDeclaration

export function generateActionInterface(struct, abi): { actionInterface: ts.InterfaceDeclaration, typeInterfaces: TypeInterfaceDeclaration[] } {
    const typeInterfaces: TypeInterfaceDeclaration[] = []

    const members = struct.fields.map((field) => {
        const abiVariant = findVariant(field.type, abi)

        let types
        let variantType
        const aliasType = findAliasType(field.type, abi)

        if (abiVariant) {
            types = abiVariant.types

            variantType = `${struct.name}_${field.name}_variant`;

            const variantTypeNodes = types.map((type) => 
                ts.factory.createTypeReferenceNode(findExternalType(type, 'Types.', abi))
            );
            const variantTypeAlias = ts.factory.createTypeAliasDeclaration(
                undefined,
                [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                variantType,
                undefined,
                ts.factory.createUnionTypeNode(variantTypeNodes)
            );

            typeInterfaces.push(variantTypeAlias)
        } else {
            types = [field.type]
        }

        const internalType = (variantType || aliasType) && `Types.${variantType || aliasType}`

        types.forEach((type) => {
            const typeStruct = findAbiStruct(type, abi)

            if (typeStruct) {
                const interfaces = generateActionInterface(typeStruct, abi)
                
                typeInterfaces.push(interfaces.actionInterface, ...interfaces.typeInterfaces)
            }
        })

        const typeReferenceNode = ts.factory.createTypeReferenceNode(
            internalType || findParamTypeString(field.type, 'Types.', abi)
        )

        return ts.factory.createPropertySignature(
            undefined,
            field.name,
            field.optional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
            typeReferenceNode
        )
    })

    const actionInterface = ts.factory.createInterfaceDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        struct.name,
        undefined,
        undefined,
        members
    )

    return { actionInterface, typeInterfaces: removeDuplicateInterfaces(typeInterfaces) }
}

export function generateActionsNamespace(abi: ABI.Def): ts.ModuleDeclaration {
    const actionStructsWithFields = getActionFieldFromAbi(abi)

    const typeInterfaces: TypeInterfaceDeclaration[] = []

    const interfaces = abi.actions.map((action) => {
        const actionStruct = actionStructsWithFields.find(
            (actionStructWithField) => actionStructWithField.name === action.type
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
