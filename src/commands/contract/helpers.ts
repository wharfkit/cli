import type {ABI} from '@wharfkit/antelope'
import * as ts from 'typescript'
import {formatClassName} from '../../utils'
import {findAbiType, findCoreClass, findCoreType} from './finders'
import { TypeInterfaceDeclaration } from './interfaces'

export function getCoreImports(abi: ABI.Def) {
    const coreImports: string[] = []
    const coreTypes: string[] = []

    for (const struct of abi.structs) {
        const structIsActionParams = !!abi.actions.find((action) => action.type === struct.name)

        for (const field of struct.fields) {
            const fieldTypeWithoutDecorator = extractDecorator(field.type).type
            const fieldTypeIsStruct = abi.structs.find(
                (abiStruct) => abiStruct.name === fieldTypeWithoutDecorator
            )

            // We don't need to import any core classes if the field type is a struct
            if (fieldTypeIsStruct) {
                continue
            }

            const {type} = findAbiType(field.type, abi)

            const coreClass = findCoreClassImport(type)

            if (coreClass) {
                coreImports.push(coreClass)
            }

            // We don't need to add action types unless the struct is an action param
            if (!structIsActionParams) {
                continue
            }

            const coreType = findCoreType(type)

            if (coreType) {
                coreTypes.push(coreType)
            }
        }
    }

    if (abi.variants.length != 0) {
        coreImports.push('Variant')
        for (const variant of abi.variants) {
            variant.types.forEach((typeString) => {
                const {type: abiType} = findAbiType(typeString, abi)
                const coreClass = findCoreClassImport(abiType)
                if (coreClass) {
                    coreImports.push(coreClass)
                }
            })
        }
    }

    return {
        classes: coreImports.filter((value, index, self) => self.indexOf(value) === index),
        types: coreTypes
            .filter((value, index, self) => self.indexOf(value) === index)
            .filter((type) => !coreImports.includes(type)),
    }
}

export function findCoreClassImport(type: string) {
    if (type === 'symbol') {
        return 'Asset'
    }

    return findCoreClass(type)
}

export function generateClassDeclaration(
    name: string,
    members: ts.ClassElement[],
    options: {parent?: string; export?: boolean; decorator?: ts.Decorator} = {}
) {
    const heritageClauses: ts.HeritageClause[] = []
    if (options.parent) {
        heritageClauses.push(
            ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
                ts.factory.createExpressionWithTypeArguments(
                    ts.factory.createIdentifier(options.parent),
                    undefined
                ),
            ])
        )
    }
    const modifiers: ts.ModifierLike[] = []
    if (options.export === true) {
        modifiers.push(ts.factory.createToken(ts.SyntaxKind.ExportKeyword))
    }
    if (options.decorator) {
        modifiers.push(options.decorator)
    }
    const classDeclaration = ts.factory.createClassDeclaration(
        modifiers,
        ts.factory.createIdentifier(name),
        undefined, // type parameters
        heritageClauses,
        members
    )
    return classDeclaration
}

export function generateImportStatement(classes, path, type = false): ts.ImportDeclaration {
    return ts.factory.createImportDeclaration(
        undefined, // modifiers
        ts.factory.createImportClause(
            type, // isTypeOnly
            undefined, // name
            ts.factory.createNamedImports(
                classes.map((className) =>
                    ts.factory.createImportSpecifier(
                        false,
                        undefined, // propertyName
                        ts.factory.createIdentifier(className) // name
                    )
                )
            ) // namedBindings
        ),
        ts.factory.createStringLiteral(path) // moduleSpecifier
    )
}

export function generateInterface(
    interfaceName: string,
    isExport = false,
    members: ts.TypeElement[]
): ts.InterfaceDeclaration {
    const modifiers = isExport ? [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)] : []

    return ts.factory.createInterfaceDeclaration(
        modifiers,
        ts.factory.createIdentifier(interfaceName),
        undefined, // typeParameters
        [], // heritageClauses
        members
    )
}

export function formatInternalType(
    typeString: string,
    namespace = '',
    abi: ABI.Def,
    decorator = ''
): string {
    const structNames = [...abi.structs, ...abi.variants].map((struct) => struct.name.toLowerCase())

    let type

    if (structNames.includes(typeString.toLowerCase())) {
        type = `${namespace}${formatClassName(typeString)}`
    } else {
        type = findCoreClass(typeString) || capitalize(typeString)
    }

    return `${type}${decorator}`
}

const decorators = ['?', '[]']
export function extractDecorator(type: string): {type: string; decorator?: string} {
    for (const decorator of decorators) {
        if (type.includes(decorator)) {
            type = type.replace(decorator, '')

            return {type, decorator}
        }
    }

    return {type}
}

export function cleanupType(type: string): string {
    return extractDecorator(parseType(trim(type))).type
}

export function parseType(type: string): string {
    type = type.replace('$', '')

    if (type === 'String') {
        return 'string'
    }

    if (type === 'String[]') {
        return 'string[]'
    }

    if (type === 'Boolean') {
        return 'boolean'
    }

    if (type === 'Boolean[]') {
        return 'boolean[]'
    }

    return type
}

export function trim(string: string) {
    return string.replace(/\s/g, '')
}

export function capitalize(string) {
    if (typeof string !== 'string' || string.length === 0) {
        return ''
    }

    return string.charAt(0).toUpperCase() + string.slice(1)
}

export function removeDuplicateInterfaces(interfaces: TypeInterfaceDeclaration[]): TypeInterfaceDeclaration[] {
    const seen: string[] = [];

    return interfaces.filter(interfaceDeclaration => {
        const name = String(interfaceDeclaration.name.escapedText);

        if (seen.includes(name)) {
            return false;
        }
        seen.push(name);
        return true;
    });
}
