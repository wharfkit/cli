import {ABI} from '@wharfkit/antelope'
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
        undefined,
        constructorParams,
        constructorBody
    )

    classMembers.push(constructorMember)

    if (abi.actions.length) {
        const actionMethod = generateActionMethod(abi)

        classMembers.push(actionMethod)
    }

    if (abi.tables.length) {
        const tableMethod = generateTableMethod(abi)

        classMembers.push(tableMethod)
    }

    // Construct class declaration
    const classDeclaration = generateClassDeclaration('Contract', classMembers, {
        parent: 'BaseContract',
        export: true,
    })

    return {classDeclaration}
}

function generateConstructorFunction(contractName): ts.ExpressionStatement {
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
                        ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(
                                ts.factory.createIdentifier('Name'),
                                'from'
                            ),
                            undefined,
                            [ts.factory.createStringLiteral(contractName)]
                        )
                    ),
                ],
                true
            ),
        ])
    )
}

function generateActionMethod(abi: ABI.Def): ts.MethodDeclaration {
    const typeParameter = ts.factory.createTypeParameterDeclaration(
        'T',
        ts.factory.createUnionTypeNode(
            abi.actions.map((action) =>
                ts.factory.createLiteralTypeNode(
                    ts.factory.createStringLiteral(String(action.name))
                )
            )
        )
    )

    // 3. Create the function parameters.
    const nameParameter = ts.factory.createParameterDeclaration(
        undefined,
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
        undefined,
        'data',
        undefined,
        ts.factory.createTypeReferenceNode('ActionNameParams[T]'),
        undefined
    )

    const optionsParameter = ts.factory.createParameterDeclaration(
        undefined,
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
        undefined,
        'action',
        undefined,
        [typeParameter],
        [nameParameter, dataParameter, optionsParameter],
        ts.factory.createTypeReferenceNode('Action'),
        methodBody
    )
}

function generateTableMethod(abi: ABI.Def): ts.MethodDeclaration {
    const typeParameter = ts.factory.createTypeParameterDeclaration(
        'T',
        ts.factory.createUnionTypeNode(
            abi.tables.map((table) =>
                ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(String(table.name)))
            )
        )
    )

    // 3. Create the function parameters.
    const nameParameter = ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        'name',
        undefined,
        ts.factory.createTypeReferenceNode('T'),
        undefined
    )

    const scopeParameter = ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        'scope',
        ts.factory.createToken(ts.SyntaxKind.QuestionToken),
        ts.factory.createTypeReferenceNode('NameType'),
        undefined
    )

    // 4. Generate the function body.
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
                        ts.factory.createIdentifier('TableMap[name]'),
                    ]
                )
            ),
        ],
        true
    )

    return ts.factory.createMethodDeclaration(
        undefined,
        undefined,
        undefined,
        'table',
        undefined,
        [typeParameter],
        [nameParameter, scopeParameter],
        undefined,
        methodBody
    )
}
