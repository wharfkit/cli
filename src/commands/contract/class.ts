import type {ABI} from '@wharfkit/antelope'
import * as ts from 'typescript'

import {generateClassDeclaration} from './helpers'

export async function generateContractClass(contractName: string, abi: ABI.Def) {
    // Prepare the member fields of the class
    const classMembers: ts.ClassElement[] = []

    // Generate the `constructor` member
    const constructorParams: ts.ParameterDeclaration[] = [
        ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            'args',
            undefined,
            ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('PartialBy'), [
                ts.factory.createTypeReferenceNode(
                    ts.factory.createIdentifier('ContractArgs'),
                    undefined
                ),
                ts.factory.createUnionTypeNode([
                    ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral('abi')),
                    ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral('account')),
                ]),
            ]),
            undefined
        ),
    ]

    const constructorBody = ts.factory.createBlock(
        [generateConstructorFunction(contractName)],
        true
    )

    const constructorMember = ts.factory.createConstructorDeclaration(
        undefined,
        constructorParams,
        constructorBody
    )

    classMembers.push(constructorMember)

    if (abi.actions.length) {
        const actionMethod = generateActionMethod()

        classMembers.push(actionMethod)
    }

    if (abi.action_results.length) {
        const readonlyMethod = generateReadonlyMethod()
        classMembers.push(readonlyMethod)
    }

    if (abi.tables.length) {
        const tableMethod = generateTableMethod()

        classMembers.push(tableMethod)
    }

    // Construct class declaration
    const classDeclaration = generateClassDeclaration('Contract', classMembers, {
        parent: 'BaseContract',
        export: true,
    })

    return {classDeclaration}
}

function generateConstructorFunction(contractName) {
    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(ts.factory.createSuper(), undefined, [
            ts.factory.createObjectLiteralExpression(
                [
                    ts.factory.createPropertyAssignment(
                        'client',
                        ts.factory.createPropertyAccessExpression(
                            ts.factory.createIdentifier('args'),
                            'client'
                        )
                    ),
                    ts.factory.createPropertyAssignment('abi', ts.factory.createIdentifier('abi')),
                    ts.factory.createPropertyAssignment(
                        'account',
                        ts.factory.createBinaryExpression(
                            ts.factory.createPropertyAccessExpression(
                                ts.factory.createIdentifier('args'),
                                'account'
                            ),
                            ts.factory.createToken(ts.SyntaxKind.BarBarToken),
                            ts.factory.createCallExpression(
                                ts.factory.createPropertyAccessExpression(
                                    ts.factory.createIdentifier('Name'),
                                    'from'
                                ),
                                undefined,
                                [ts.factory.createStringLiteral(contractName)]
                            )
                        )
                    ),
                ],
                true
            ),
        ])
    )
}

function generateActionMethod(): ts.MethodDeclaration {
    const typeParameter = ts.factory.createTypeParameterDeclaration(
        undefined,
        'T',
        ts.factory.createTypeReferenceNode('ActionNames')
    )

    // 3. Create the function parameters.
    const nameParameter = ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        'name',
        undefined,
        ts.factory.createTypeReferenceNode('T'),
        undefined
    )

    const dataParameter = ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        'data',
        undefined,
        ts.factory.createTypeReferenceNode('ActionNameParams[T]'),
        undefined
    )

    const optionsParameter = ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        'options',
        ts.factory.createToken(ts.SyntaxKind.QuestionToken),
        ts.factory.createTypeReferenceNode('ActionOptions'),
        undefined
    )

    // 4. Generate the function body.
    const methodBody = ts.factory.createBlock(
        [
            ts.factory.createReturnStatement(
                ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(
                        ts.factory.createSuper(),
                        ts.factory.createIdentifier('action')
                    ),
                    undefined,
                    [
                        ts.factory.createIdentifier('name'),
                        ts.factory.createIdentifier('data'),
                        ts.factory.createIdentifier('options'),
                    ]
                )
            ),
        ],
        true
    )

    return ts.factory.createMethodDeclaration(
        undefined,
        undefined,
        'action',
        undefined,
        [typeParameter],
        [nameParameter, dataParameter, optionsParameter],
        ts.factory.createTypeReferenceNode('Action'),
        methodBody
    )
}

function generateReadonlyMethod(): ts.MethodDeclaration {
    // Create the generic type parameter 'T' with a constraint to 'ActionReturnNames'
    const typeParameter = ts.factory.createTypeParameterDeclaration(
        undefined,
        'T',
        ts.factory.createTypeReferenceNode('ActionReturnNames')
    )

    // Create the function parameters.
    const nameParameter = ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        'name',
        undefined,
        ts.factory.createTypeReferenceNode('T'),
        undefined
    )

    const dataParameter = ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        'data',
        undefined,
        ts.factory.createIndexedAccessTypeNode(
            ts.factory.createTypeReferenceNode('ActionNameParams'),
            ts.factory.createTypeReferenceNode('T')
        ),
        undefined
    )

    // Generate the function body.
    const methodBody = ts.factory.createBlock(
        [
            ts.factory.createReturnStatement(
                ts.factory.createAsExpression(
                    ts.factory.createAsExpression(
                        ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(
                                ts.factory.createSuper(),
                                'readonly'
                            ),
                            undefined,
                            [
                                ts.factory.createIdentifier('name'),
                                ts.factory.createIdentifier('data'),
                            ]
                        ),
                        ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword)
                    ),
                    ts.factory.createIndexedAccessTypeNode(
                        ts.factory.createTypeReferenceNode('ActionReturnValues'),
                        ts.factory.createTypeReferenceNode('T')
                    )
                )
            ),
        ],
        true
    )

    // Create the method declaration
    return ts.factory.createMethodDeclaration(
        undefined,
        undefined,
        'readonly',
        undefined,
        [typeParameter],
        [nameParameter, dataParameter],
        ts.factory.createIndexedAccessTypeNode(
            ts.factory.createTypeReferenceNode('ActionReturnValues'),
            ts.factory.createTypeReferenceNode('T')
        ),
        methodBody
    )
}

export function generateTableMethod(): ts.MethodDeclaration {
    // Create the generic type parameter 'T' with a constraint to 'tables'
    const typeParameter = ts.factory.createTypeParameterDeclaration(
        undefined,
        ts.factory.createIdentifier('T'),
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('TableNames')),
        undefined
    )

    // Create the parameters for the method
    const nameParameter = ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        ts.factory.createIdentifier('name'),
        undefined,
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('T')),
        undefined
    )

    const scopeParameter = ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        ts.factory.createIdentifier('scope'),
        ts.factory.createToken(ts.SyntaxKind.QuestionToken),
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('NameType')),
        undefined
    )

    // Create the method return type 'Table<RowType<T>>'
    const returnType = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('Table'), [
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('RowType'), [
            ts.factory.createTypeReferenceNode(ts.factory.createIdentifier('T')),
        ]),
    ])

    // Generate the function body
    const methodBody = ts.factory.createBlock(
        [
            ts.factory.createReturnStatement(
                ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(
                        ts.factory.createSuper(),
                        ts.factory.createIdentifier('table')
                    ),
                    undefined,
                    [
                        ts.factory.createIdentifier('name'),
                        ts.factory.createIdentifier('scope'),
                        ts.factory.createElementAccessExpression(
                            ts.factory.createIdentifier('TableMap'),
                            ts.factory.createIdentifier('name')
                        ),
                    ]
                )
            ),
        ],
        true
    )

    // Create the method declaration
    const methodDeclaration = ts.factory.createMethodDeclaration(
        undefined, // decorators
        undefined, // modifiers
        undefined, // asterisk token
        ts.factory.createIdentifier('table'), // method name
        undefined, // question token
        [typeParameter], // type parameters
        [nameParameter, scopeParameter], // parameters
        returnType, // return type
        methodBody // body
    )

    return methodDeclaration
}
