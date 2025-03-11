import * as ts from 'typescript'

export function generateRowType(): ts.TypeAliasDeclaration {
    // Create the type parameter 'T'
    const typeParameter = ts.factory.createTypeParameterDeclaration(
        undefined,
        ts.factory.createIdentifier('T'),
        undefined,
        undefined
    )

    // Create the conditional type 'T extends keyof TableTypes ? TableTypes[T] : any'
    const conditionalType = ts.factory.createConditionalTypeNode(
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('T')),
        ts.factory.createTypeOperatorNode(
            ts.SyntaxKind.KeyOfKeyword,
            ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('TableTypes'))
        ),
        ts.factory.createIndexedAccessTypeNode(
            ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('TableTypes')),
            ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('T'))
        ),
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
    )

    // Create the type alias declaration 'type RowType<T> = ...'
    const typeAliasDeclaration = ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        'RowType',
        [typeParameter],
        conditionalType
    )

    return typeAliasDeclaration
}

export function generateTablesTypeAlias(): ts.TypeAliasDeclaration {
    // Create the 'keyof TableTypes' type
    const keyofTableTypes = ts.factory.createTypeOperatorNode(
        ts.SyntaxKind.KeyOfKeyword,
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('TableTypes'))
    )

    // Create the type alias declaration 'type Tables = ...'
    const typeAliasDeclaration = ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        'Tables',
        undefined,
        keyofTableTypes
    )

    return typeAliasDeclaration
}

export function generateActionsTypeAlias(): ts.TypeAliasDeclaration {
    // Create the 'keyof ActionNameParams' type
    const keyofActionNameParams = ts.factory.createTypeOperatorNode(
        ts.SyntaxKind.KeyOfKeyword,
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('ActionNameParams'))
    )

    // Create the type alias declaration 'type Actions = ...'
    const typeAliasDeclaration = ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        'Actions',
        undefined,
        keyofActionNameParams
    )

    return typeAliasDeclaration
}

export function generateActionNamesTypeAlias(): ts.TypeAliasDeclaration {
    // Create the 'keyof ActionNameParams' type
    const keyofActionNameParams = ts.factory.createTypeOperatorNode(
        ts.SyntaxKind.KeyOfKeyword,
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('ActionNameParams'))
    )

    // Create the type alias declaration 'type ActionNames = keyof ActionNameParams'
    const typeAliasDeclaration = ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        'ActionNames',
        undefined,
        keyofActionNameParams
    )

    return typeAliasDeclaration
}

export function generateTableNamesTypeAlias(): ts.TypeAliasDeclaration {
    // Create the 'keyof TableTypes' type
    const keyofTableTypes = ts.factory.createTypeOperatorNode(
        ts.SyntaxKind.KeyOfKeyword,
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('TableTypes'))
    )

    // Create the type alias declaration 'type TableNames = keyof TableTypes'
    const typeAliasDeclaration = ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        'TableNames',
        undefined,
        keyofTableTypes
    )

    return typeAliasDeclaration
}

export function generateTableNameTypeAlias(): ts.TypeAliasDeclaration {
    // Create the type alias declaration 'type TableName = string'
    const typeAliasDeclaration = ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        'TableName',
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
    )

    return typeAliasDeclaration
}

export function generateSerializerTypeAlias(): ts.TypeAliasDeclaration {
    // Create the type alias declaration 'type Serializer = any'
    const typeAliasDeclaration = ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        'Serializer',
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
    )

    return typeAliasDeclaration
}
