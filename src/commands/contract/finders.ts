import * as Antelope from '@wharfkit/antelope'
import { ABI } from "@wharfkit/antelope"
import { capitalize, extractDecorator, formatInternalType, parseType, trim } from "./helpers"
import { formatClassName } from "../../utils"

const ANTELOPE_CLASSES: string[] = []
Object.keys(Antelope).map((key) => {
    if (Antelope[key].abiName) {
        ANTELOPE_CLASSES.push(key)
    }
})

export const ANTELOPE_CLASS_MAPPINGS = {
    block_timestamp_type: 'BlockTimestamp',
}

export function findAliasType(typeString: string, abi: ABI.Def): string | undefined {
    const {type: typeStringWithoutDecorator, decorator} = extractDecorator(typeString)
    const alias = abi.types.find((type) => type.new_type_name === typeStringWithoutDecorator)

    return alias?.type && `${alias?.type}${decorator || ''}`
}

export function findAbiStruct(
    type: string,
    abi: ABI.Def,
): ABI.Struct | undefined {
    const extractDecoratorResponse = extractDecorator(type)
    const typeString = extractDecoratorResponse.type

    const aliasType = findAliasType(typeString, abi)

    let abiStruct = abi.structs.find(
        (abiType) => abiType.name === typeString || abiType.name === aliasType
    )

    return abiStruct
}

export function findVariant(
    typeString: string,
    abi: ABI.Def
): ABI.Variant | undefined {
    const {type: typeStringWithoutDecorator, decorator} = extractDecorator(typeString)

    const aliastype = findAliasType(typeStringWithoutDecorator, abi)

    return abi.variants.find(
        (variant) => variant.name === typeStringWithoutDecorator || variant.name === aliastype
    )
}

export function findAbiType(
    type: string,
    abi: ABI.Def,
    typeNamespace = ''
): {type: string; decorator?: string} {
    let typeString = parseType(trim(type))

    const aliasType = findAliasType(typeString, abi)

    if (aliasType) {
        typeString = aliasType
    }

    const extractDecoratorResponse = extractDecorator(typeString)
    typeString = extractDecoratorResponse.type
    const decorator = extractDecoratorResponse.decorator

    const abiType = [...abi.structs, ...abi.variants].find(
        (abiType) => abiType.name === typeString
    )?.name

    if (abiType) {
        return {type: `${typeNamespace}${formatClassName(abiType)}`, decorator}
    }

    return {type: typeString, decorator}
}

export function findExternalType(type: string, typeNamespace = '', abi: ABI.Def): string {
    const {type: typeString, decorator} = findType(type, abi, typeNamespace)

    return `${findCoreType(typeString) || capitalize(typeString)}${decorator === '[]' ? '[]' : ''}`
}

function findType(type: string, abi: ABI.Def, typeNamespace?: string) {
    return findAbiType(type, abi, typeNamespace)
}

export function findCoreType(type: string): string | undefined {
    const coreType = findCoreClass(type)

    if (coreType) {
        return `${coreType}Type`
    }
}

export function findCoreClass(type: string): string | undefined {
    if (ANTELOPE_CLASS_MAPPINGS[type]) {
        return ANTELOPE_CLASS_MAPPINGS[type]
    }

    const parsedType = parseType(trim(type)).split('_').join('').toLowerCase()

    return (
        ANTELOPE_CLASSES.find((antelopeClass) => parsedType === antelopeClass.toLowerCase()) ||
        ANTELOPE_CLASSES.find(
            (antelopeClass) => parsedType.replace(/[0-9]/g, '') === antelopeClass.toLowerCase()
        )
    )
}

export function findInternalType(
    type: string,
    typeNamespace: string | undefined,
    abi: ABI.Def
): string {
    const {type: typeString, decorator} = findType(type, abi, typeNamespace)

    // TODO: inside findType, namespace is prefixed, but format internal is doing the same
    return formatInternalType(typeString, typeNamespace, abi, decorator)
}