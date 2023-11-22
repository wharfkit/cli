import * as ts from 'typescript';

export function generateRowType(): ts.TypeAliasDeclaration {
    // Create the type parameter 'T'
    const typeParameter = ts.factory.createTypeParameterDeclaration(
        undefined,
        ts.factory.createIdentifier('T'),
        undefined,
        undefined
    );

    // Create the conditional type 'T extends keyof TableTypes ? TableTypes[T] : any'
    const conditionalType = ts.factory.createConditionalTypeNode(
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('T')),
        ts.factory.createTypeOperatorNode(ts.SyntaxKind.KeyOfKeyword, ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('TableTypes'))),
        ts.factory.createIndexedAccessTypeNode(
            ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('TableTypes')),
            ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('T'))
        ),
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
    );

    // Create the type alias declaration 'type RowType<T> = ...'
    const typeAliasDeclaration = ts.factory.createTypeAliasDeclaration(
        undefined,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier('RowType'),
        [typeParameter],
        conditionalType
    );

    return typeAliasDeclaration;
}

export function generateTablesTypeAlias(): ts.TypeAliasDeclaration {
    // Create the 'keyof TableTypes' type
    const keyofTableTypes = ts.factory.createTypeOperatorNode(
        ts.SyntaxKind.KeyOfKeyword, 
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('TableTypes'))
    );

    // Create the type alias declaration 'type tables = keyof TableTypes'
    const typeAliasDeclaration = ts.factory.createTypeAliasDeclaration(
        undefined, // decorators
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)], // modifiers
        ts.factory.createIdentifier('tables'), // name
        [], // type parameters
        keyofTableTypes // type
    );

    return typeAliasDeclaration;
}

export function generateActionsTypeAlias(): ts.TypeAliasDeclaration {
    // Create the 'keyof ActionNameParams' type
    const keyofActionNameParams = ts.factory.createTypeOperatorNode(
        ts.SyntaxKind.KeyOfKeyword,
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('ActionNameParams'))
    );

    // Create the type alias declaration 'type actions = keyof ActionNameParams'
    const typeAliasDeclaration = ts.factory.createTypeAliasDeclaration(
        undefined, // decorators
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)], // modifiers
        ts.factory.createIdentifier('actions'), // name
        [], // type parameters
        keyofActionNameParams // type
    );

    return typeAliasDeclaration;
}