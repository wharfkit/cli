import type {ABI} from '@wharfkit/antelope'
import ts from 'typescript'
import {parseType, removeCommas, removeDuplicateInterfaces} from './helpers'
import {findFieldTypeString, getActionFieldFromAbi, type StructData} from './structs'
import {findAbiStruct, findExternalType, findTypeFromAlias, findVariant} from './finders'

export function generateActionNamesInterface(abi: ABI.Def): ts.InterfaceDeclaration {
    // Generate property signatures for each action
    const members = abi.actions.map((action) => {
        const actionName = String(action.name)
        const actionNameKey = actionName.includes('.') ? `'${actionName}'` : actionName

        return ts.factory.createPropertySignature(
            undefined,
            actionNameKey,
            undefined,
            ts.factory.createTypeReferenceNode(`ActionParams.${removeCommas(actionName)}`)
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

export function generateActionInterface(
    struct: any,
    abi: ABI.Def,
    allStructData: StructData[]
): {actionInterface: ts.InterfaceDeclaration; typeInterfaces: TypeInterfaceDeclaration[]} {
    const typeInterfaces: TypeInterfaceDeclaration[] = []

    const structName = typeof struct.name === 'string' ? struct.name : ''

    const members = struct.fields.map((field) => {
        const abiVariant = findVariant(field.type, abi)

        let types
        let variantType
        const aliasType = findTypeFromAlias(field.type, abi)

        if (abiVariant) {
            types = abiVariant.types

            const variantTypeNodes = types.map((type) =>
                ts.factory.createTypeReferenceNode(parseType(findExternalType(type, 'Type.', abi)))
            )

            const allTypeNodes = [
                ...variantTypeNodes,
                ts.factory.createTypeReferenceNode(`Types.${abiVariant.name}`),
            ]

            const variantTypeAlias = ts.factory.createTypeAliasDeclaration(
                [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                abiVariant.name,
                undefined,
                ts.factory.createUnionTypeNode(allTypeNodes)
            )
            typeInterfaces.push(variantTypeAlias)
        } else {
            types = [field.type]
        }

        const variantName = variantType && `Type.${variantType}`

        types.forEach((type) => {
            const typeStruct = findAbiStruct(type, abi)

            if (typeStruct) {
                const interfaces = generateActionInterface(typeStruct, abi, allStructData)
                typeInterfaces.push(interfaces.actionInterface, ...interfaces.typeInterfaces)
            }
        })

        const typeReferenceNode = ts.factory.createTypeReferenceNode(
            variantName || findParamTypeString(aliasType || field.type, 'Type.', abi)
        )

        let isOptional = false
        const fieldName = field.name
        const processedStruct = allStructData.find((s) => s.name === structName)
        if (processedStruct) {
            const processedField = processedStruct.fields.find((f) => f.name === fieldName)
            if (processedField) {
                isOptional = processedField.optional
            }
        }

        return ts.factory.createPropertySignature(
            undefined,
            fieldName,
            isOptional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
            typeReferenceNode
        )
    })

    const actionInterface = ts.factory.createInterfaceDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        structName ? removeCommas(structName) : ts.createIdentifier('UnknownStruct'),
        undefined,
        undefined,
        members
    )

    return {actionInterface, typeInterfaces: removeDuplicateInterfaces(typeInterfaces)}
}

export function generateActionsNamespace(abi: ABI.Def): ts.Statement {
    const actionStructsWithFields = getActionFieldFromAbi(abi)

    const typeInterfaces: TypeInterfaceDeclaration[] = []

    const actionParamInterfaces = abi.actions
        .map((action) => {
            const actionStruct = actionStructsWithFields.find(
                (actionStructWithField) => actionStructWithField.name === action.type
            )

            if (!actionStruct) {
                return undefined
            }

            const interfaces = generateActionInterface(actionStruct, abi, actionStructsWithFields)

            if (interfaces.actionInterface) {
                typeInterfaces.push(...interfaces.typeInterfaces)
            }

            return interfaces.actionInterface
        })
        .filter((iface): iface is ts.InterfaceDeclaration => !!iface)

    const actionParamsTypes = ts.factory.createModuleDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier('Type'),
        ts.factory.createModuleBlock(removeDuplicateInterfaces(typeInterfaces)),
        ts.NodeFlags.Namespace
    )

    const actionParamsNamespace = ts.factory.createModuleDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier('ActionParams'),
        ts.factory.createModuleBlock([actionParamsTypes, ...actionParamInterfaces]),
        ts.NodeFlags.Namespace
    )

    return actionParamsNamespace
}

function findParamTypeString(typeString: string, namespace = '', abi: ABI.Def): string {
    const fieldType = findExternalType(typeString, namespace, abi)

    if (fieldType === 'Symbol_code') {
        return 'Asset.SymbolCodeType'
    }

    if (fieldType === 'Symbol_code[]') {
        return 'Asset.SymbolCodeType[]'
    }

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

export function generateActionReturnValuesInterface(abi: ABI.Def): ts.InterfaceDeclaration {
    const actionResults: ABI.ActionResult[] = abi.action_results
    const members = actionResults.map((result) => {
        return ts.factory.createPropertySignature(
            undefined,
            String(result.name),
            undefined,
            ts.factory.createTypeReferenceNode(
                findFieldTypeString(result.result_type, 'Types.', abi),
                undefined
            )
        )
    })

    return ts.factory.createInterfaceDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        'ActionReturnValues',
        undefined,
        undefined,
        members
    )
}

export function generateActionReturnNamesType(): ts.TypeAliasDeclaration {
    return ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        'ActionReturnNames',
        undefined,
        ts.factory.createTypeOperatorNode(
            ts.SyntaxKind.KeyOfKeyword,
            ts.factory.createTypeReferenceNode('ActionReturnValues', undefined)
        )
    )
}
