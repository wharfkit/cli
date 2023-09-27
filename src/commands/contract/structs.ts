import type {ABI} from '@wharfkit/session'
import ts from 'typescript'
import {capitalize} from '@wharfkit/contract'
import {extractDecorator, findInternalType, generateStructClassName, parseType} from './helpers'

interface FieldType {
    name: string
    type: string
    optional: boolean
}

interface StructData {
    structName: string
    fields: FieldType[]
}

interface TypeAlias {
    new_type_name: string
    type: string
}

export function generateStructClasses(abi) {
    const structs = getActionFieldFromAbi(abi)
    const orderedStructs = orderStructs(structs, abi.types)

    const structMembers: ts.ClassDeclaration[] = []

    for (const struct of orderedStructs) {
        structMembers.push(generateStruct(struct, abi, true))
    }

    return structMembers
}

export function getActionFieldFromAbi(abi: any): StructData[] {
    const structTypes: {structName: string; fields: FieldType[]}[] = []

    if (abi && abi.structs) {
        for (const struct of abi.structs) {
            const fields: FieldType[] = []

            for (const field of struct.fields) {
                fields.push({
                    name: capitalize(field.name),
                    type: parseType(field.type),
                    optional: field.type.endsWith('?') || field.type.endsWith('$'),
                })
            }

            structTypes.push({structName: struct.name, fields})
        }
    }

    return structTypes
}

export function generateStruct(struct, abi, isExport = false): ts.ClassDeclaration {
    const decorators = [
        ts.factory.createDecorator(
            ts.factory.createCallExpression(ts.factory.createIdentifier('Struct.type'), undefined, [
                ts.factory.createStringLiteral(struct.structName),
            ])
        ),
    ]

    const members: ts.ClassElement[] = []

    for (const field of struct.fields) {
        members.push(generateField(field, undefined, abi))
    }

    return ts.factory.createClassDeclaration(
        isExport
            ? [...decorators, ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)]
            : decorators,
        ts.factory.createIdentifier(generateStructClassName(struct.structName)),
        undefined, // typeParameters
        [
            ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
                ts.factory.createExpressionWithTypeArguments(
                    ts.factory.createIdentifier('Struct'),
                    []
                ),
            ]),
        ], // heritageClauses
        members
    )
}

export function generateField(
    field: FieldType,
    namespace: string | undefined,
    abi: ABI.Def
): ts.PropertyDeclaration {
    const fieldName = field.name.toLowerCase()

    const isArray = field.type.endsWith('[]')

    // Start with the main type argument
    const decoratorArguments: (ts.ObjectLiteralExpression | ts.StringLiteral | ts.Identifier)[] = [
        findFieldStructType(field.type, namespace, abi),
    ]

    // Build the options object if needed
    const optionsProps: ts.ObjectLiteralElementLike[] = []

    if (isArray) {
        optionsProps.push(
            ts.factory.createPropertyAssignment(
                ts.factory.createIdentifier('array'),
                ts.factory.createTrue()
            )
        )
    }

    if (field.optional) {
        optionsProps.push(
            ts.factory.createPropertyAssignment(
                ts.factory.createIdentifier('optional'),
                ts.factory.createTrue()
            )
        )
    }

    // If there are options, create the object and add to decorator arguments
    if (optionsProps.length > 0) {
        const optionsObject = ts.factory.createObjectLiteralExpression(optionsProps)
        decoratorArguments.push(optionsObject)
    }

    const decorators = [
        ts.factory.createDecorator(
            ts.factory.createCallExpression(
                ts.factory.createIdentifier('Struct.field'),
                undefined,
                decoratorArguments
            )
        ),
    ]

    let typeReferenceNode: ts.TypeReferenceNode | ts.UnionTypeNode

    const structTypeString = findFieldStructTypeString(field.type, namespace, abi)

    if (structTypeString.includes(' | ')) {
        typeReferenceNode = ts.factory.createUnionTypeNode(
            structTypeString.split(' | ').map((type) => {
                return ts.factory.createTypeReferenceNode(
                    ts.factory.createIdentifier(type),
                    undefined
                )
            })
        )
    } else {
        typeReferenceNode = ts.factory.createTypeReferenceNode(
            extractDecorator(structTypeString).type
        )
    }

    let typeNode: ts.TypeNode

    if (isArray) {
        typeNode = ts.factory.createArrayTypeNode(typeReferenceNode)
    } else {
        typeNode = typeReferenceNode
    }

    return ts.factory.createPropertyDeclaration(
        decorators,
        ts.factory.createIdentifier(fieldName),
        ts.factory.createToken(
            field.optional ? ts.SyntaxKind.QuestionToken : ts.SyntaxKind.ExclamationToken
        ),
        typeNode,
        undefined // initializer
    )
}

function orderStructs(structs, typeAliases: TypeAlias[] = []) {
    const orderedStructs: StructData[] = []

    for (const struct of structs) {
        orderedStructs.push(...findDependencies(struct, structs, typeAliases))
        orderedStructs.push(struct)
    }

    return orderedStructs.filter((struct, index, self) => {
        return index === self.findIndex((s) => s.structName === struct.structName)
    })
}

function findDependencies(
    struct: StructData,
    allStructs: StructData[],
    typeAliases: TypeAlias[]
): StructData[] {
    const dependencies: StructData[] = []

    for (const field of struct.fields) {
        const {type: fieldType} = extractDecorator(field.type)

        let dependencyStruct = allStructs.find(
            (struct) => struct.structName === fieldType.toLowerCase()
        )

        if (!dependencyStruct) {
            const typeAlias = typeAliases.find(
                (typeAlias) => typeAlias.new_type_name.toLowerCase() === fieldType.toLowerCase()
            )

            const typeAliasString = typeAlias && extractDecorator(typeAlias.type).type

            dependencyStruct = typeAliasString
                ? allStructs.find(
                      (struct) => struct.structName.toLowerCase() === typeAliasString.toLowerCase()
                  )
                : undefined
        }

        if (dependencyStruct) {
            dependencies.push(...findDependencies(dependencyStruct, allStructs, typeAliases))
            dependencies.push(dependencyStruct)
        }
    }

    return dependencies
}

function findFieldStructType(
    typeString: string,
    namespace: string | undefined,
    abi: ABI.Def
): ts.Identifier | ts.StringLiteral {
    const fieldTypeString = extractDecorator(
        findFieldStructTypeString(typeString, namespace, abi)
    ).type

    if (fieldTypeString.includes(' | ')) {
        return ts.factory.createIdentifier('Variant')
    }

    if (['string', 'boolean', 'number'].includes(fieldTypeString.toLowerCase())) {
        return ts.factory.createStringLiteral(formatFieldString(fieldTypeString))
    }

    return ts.factory.createIdentifier(fieldTypeString)
}

function findFieldStructTypeString(
    typeString: string,
    namespace: string | undefined,
    abi: ABI.Def
): string {
    const fieldType = findInternalType(typeString, namespace, abi)

    if (['String', 'Number'].includes(fieldType)) {
        return fieldType.toLowerCase()
    }

    if (fieldType === 'Bool') {
        return 'boolean'
    }

    if (fieldType === 'Symbol') {
        return 'Asset.Symbol'
    }

    return fieldType
}

function formatFieldString(typeString: string): string {
    if (typeString === 'boolean') {
        return 'bool'
    }

    return typeString
}
