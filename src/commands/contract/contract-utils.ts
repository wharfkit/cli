/**
 * Shared utility functions for contract code generation.
 * These are extracted to avoid circular dependencies between helpers.ts and finders.ts.
 */

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

export function capitalize(string: string) {
    if (typeof string !== 'string' || string.length === 0) {
        return ''
    }

    return string.charAt(0).toUpperCase() + string.slice(1)
}

export function cleanupType(type: string): string {
    return extractDecorator(parseType(trim(type))).type
}

