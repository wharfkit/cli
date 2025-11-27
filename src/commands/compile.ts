/* eslint-disable no-console */
import {Command} from 'commander'
import {execSync} from 'child_process'
import {existsSync, mkdirSync, readdirSync, readFileSync, statSync} from 'fs'
import {basename, dirname, extname, isAbsolute, join, normalize, relative, resolve} from 'path'
import {checkLeapInstallation} from './chain/install'

/**
 * Compile a single C++ file or all .cpp files in the current directory
 * @param file - Optional file path to compile. If not provided, compiles all .cpp files in current directory
 * @param outputDir - Output directory for compiled WASM files
 */
export async function compileContract(file: string | undefined, outputDir: string): Promise<void> {
    const currentDir = process.cwd()
    const files = await getFilesToCompile(file, currentDir)

    if (files.length === 0) {
        console.log('No C++ files found to compile.')
        return
    }

    // Resolve output directory to absolute path, handling both relative and absolute paths
    const absoluteOutputDir = isAbsolute(outputDir)
        ? normalize(outputDir)
        : normalize(resolve(outputDir))
    ensureOutputDirectory(absoluteOutputDir)

    // Ensure cdt-cpp is installed
    await ensureCdtCppInstalled()

    console.log(`Compiling ${files.length} file(s)...\n`)

    for (const filePath of files) {
        await compileSingleFile(filePath, currentDir, absoluteOutputDir)
    }

    console.log('\nCompilation complete!')
}

/**
 * Recursively find all .cpp files in a directory
 */
function findCppFilesRecursive(dir: string, files: string[] = []): string[] {
    try {
        const entries = readdirSync(dir, {withFileTypes: true})

        for (const entry of entries) {
            const fullPath = join(dir, entry.name)

            // Skip hidden directories and common build/output directories
            if (entry.isDirectory()) {
                if (
                    entry.name.startsWith('.') ||
                    entry.name === 'node_modules' ||
                    entry.name === 'build' ||
                    entry.name === 'dist' ||
                    entry.name === 'lib'
                ) {
                    continue
                }
                findCppFilesRecursive(fullPath, files)
            } else if (entry.isFile() && extname(entry.name) === '.cpp') {
                files.push(fullPath)
            }
        }
    } catch {
        // Ignore permission errors and other filesystem errors
    }

    return files
}

/**
 * Get list of files to compile
 */
export async function getFilesToCompile(
    file: string | undefined,
    currentDir: string
): Promise<string[]> {
    if (file) {
        const filePath = resolve(currentDir, file)
        if (!existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`)
        }
        if (extname(filePath) !== '.cpp') {
            throw new Error(`File must be a C++ file (.cpp): ${filePath}`)
        }
        return [filePath]
    }

    // Recursively find all .cpp files in current directory and subdirectories
    const files = findCppFilesRecursive(currentDir)

    return files
}

/**
 * Ensure output directory exists, create it if it doesn't
 */
function ensureOutputDirectory(dir: string): void {
    if (!existsSync(dir)) {
        mkdirSync(dir, {recursive: true})
    }
}

/**
 * Check if cdt-cpp is installed and install if necessary
 * First checks if LEAP is installed (includes cdt), then checks PATH
 */
async function ensureCdtCppInstalled(): Promise<void> {
    if (isCdtCppInstalled()) {
        return
    }

    // Check if LEAP is installed, which includes cdt-cpp
    const leapStatus = await checkLeapInstallation()
    if (leapStatus.installed) {
        console.log('Note: LEAP is installed, which includes cdt-cpp')
        if (!isCdtCppInstalled()) {
            throw new Error(
                'cdt-cpp not found in PATH. Make sure LEAP is properly installed or add it to your PATH.'
            )
        }
        return
    }

    console.log('cdt-cpp not found. LEAP should be installed to get cdt-cpp.')
    console.log('Install LEAP with: wharfkit chain local start\n')
    throw new Error('cdt-cpp is not available. Please install LEAP first.')
}

/**
 * Check if cdt-cpp is available in PATH
 */
function isCdtCppInstalled(): boolean {
    try {
        execSync('which cdt-cpp', {stdio: 'pipe'})
        return true
    } catch {
        return false
    }
}

/**
 * Find the contract root directory by walking up from the source file
 * Looks for common contract directory structures
 */
export function findContractRoot(sourceFile: string): string {
    let currentDir = dirname(resolve(sourceFile))
    const root = resolve('/')

    // Walk up the directory tree looking for contract structure indicators
    while (currentDir !== root) {
        // Check for common contract directory patterns
        const hasInclude = existsSync(join(currentDir, 'include'))
        const hasSrc = existsSync(join(currentDir, 'src'))
        const hasInc = existsSync(join(currentDir, 'inc'))
        const hasHeaders = existsSync(join(currentDir, 'headers'))

        // If we find include directories or src directory, this might be the contract root
        if (hasInclude || hasSrc || hasInc || hasHeaders) {
            return currentDir
        }

        // Also check if current directory contains .cpp files (might be contract root)
        try {
            const files = readdirSync(currentDir)
            const hasCppFiles = files.some((f) => extname(f) === '.cpp')
            if (hasCppFiles && (hasInclude || hasInc || hasHeaders)) {
                return currentDir
            }
        } catch {
            // Ignore permission errors
        }

        currentDir = dirname(currentDir)
    }

    // If no contract root found, return the source file's directory
    return dirname(resolve(sourceFile))
}

/**
 * Auto-detect include directories
 */
export function detectIncludeDirectories(sourceFile: string, contractRoot: string): string[] {
    const sourceDir = dirname(resolve(sourceFile))
    const includeDirs: string[] = []

    // Common include directory patterns
    const patterns = [
        join(contractRoot, 'include'),
        join(contractRoot, 'inc'),
        join(contractRoot, 'headers'),
        join(sourceDir, 'include'),
        join(sourceDir, 'inc'),
        join(sourceDir, 'headers'),
    ]

    for (const dir of patterns) {
        if (existsSync(dir) && statSync(dir).isDirectory()) {
            const normalized = resolve(dir)
            if (!includeDirs.includes(normalized)) {
                includeDirs.push(normalized)
            }
        }
    }

    return includeDirs
}

/**
 * Auto-detect resource paths (for quoted includes like #include "actions/commit.cpp")
 */
export function detectResourcePaths(sourceFile: string, contractRoot: string): string[] {
    const sourceDir = dirname(resolve(sourceFile))
    const resourcePaths: string[] = []

    // Common resource directory patterns
    const patterns = [
        join(contractRoot, 'src'),
        join(sourceDir, 'src'),
        contractRoot, // Root itself might contain resources
        sourceDir, // Source directory might contain resources
    ]

    for (const dir of patterns) {
        if (existsSync(dir) && statSync(dir).isDirectory()) {
            const normalized = resolve(dir)
            if (!resourcePaths.includes(normalized)) {
                resourcePaths.push(normalized)
            }
        }
    }

    return resourcePaths
}

/**
 * Parse #include statements from source file
 */
export function parseIncludes(sourceFile: string): {angleBracket: string[]; quoted: string[]} {
    const content = readFileSync(sourceFile, 'utf8')
    const angleBracket: string[] = []
    const quoted: string[] = []

    // Match #include <...> and #include "..."
    const includeRegex = /#include\s+[<"]([^>"]+)[>"]/g
    let match

    while ((match = includeRegex.exec(content)) !== null) {
        const includePath = match[1]
        if (match[0].includes('<')) {
            angleBracket.push(includePath)
        } else {
            quoted.push(includePath)
        }
    }

    return {angleBracket, quoted}
}

/**
 * Auto-detect compilation flags based on source file and directory structure
 */
export function autoDetectCompileFlags(sourceFile: string): string[] {
    const contractRoot = findContractRoot(sourceFile)
    const includeDirs = detectIncludeDirectories(sourceFile, contractRoot)
    const resourcePaths = detectResourcePaths(sourceFile, contractRoot)
    const includes = parseIncludes(sourceFile)

    const flags: string[] = []

    // Add include directories (-I flag) if they exist
    // These are needed for angle-bracket includes like <randomrng/randomrng.hpp>
    if (includeDirs.length > 0) {
        for (const dir of includeDirs) {
            flags.push(`-I${dir}`)
        }
    }

    // Add resource paths (-R flag) for quoted includes like "actions/commit.cpp"
    // Only add if there are actually quoted includes in the source
    if (resourcePaths.length > 0 && includes.quoted.length > 0) {
        for (const path of resourcePaths) {
            flags.push(`-R${path}`)
        }
    }

    return flags
}

/**
 * Compile a single C++ file to WASM using cdt-cpp
 */
async function compileSingleFile(
    filePath: string,
    currentDir: string,
    outputDir: string
): Promise<void> {
    const fileName = basename(filePath, '.cpp')
    const contractRoot = findContractRoot(filePath)
    const contractRootSrc = join(contractRoot, 'src')
    const sourceFileAbsolute = resolve(filePath)

    // Check if source file is inside a src/ directory relative to contract root
    // If so, strip the src/ prefix from output path
    let relativePath: string
    if (existsSync(contractRootSrc) && sourceFileAbsolute.startsWith(resolve(contractRootSrc))) {
        // File is in src/ directory, calculate path relative to contract root
        const pathFromContractRoot = relative(contractRoot, filePath)
        // Strip 'src/' prefix if present
        if (pathFromContractRoot.startsWith('src/')) {
            relativePath = pathFromContractRoot.substring(4) // Remove 'src/' prefix
        } else {
            relativePath = pathFromContractRoot
        }
    } else {
        // Use path relative to current directory (preserve structure)
        // But if the relative path goes outside currentDir (starts with ..),
        // just use the filename to avoid path issues
        const relPath = relative(currentDir, filePath)
        if (relPath.startsWith('..')) {
            // If path goes outside current directory, just use filename
            relativePath = basename(filePath, '.cpp')
        } else {
            relativePath = relPath
        }
    }

    const relativeDir = dirname(relativePath)

    // Calculate output path
    let wasmOutput: string
    if (relativeDir === '.' || relativeDir === '') {
        // File should be output directly in output directory
        wasmOutput = join(outputDir, `${fileName}.wasm`)
    } else {
        // File is in a subdirectory, preserve the structure (but without src/ prefix if stripped)
        // Normalize the path to prevent issues with relative paths containing '..'
        const outputSubDir = normalize(join(outputDir, relativeDir))
        // Ensure the output subdirectory exists
        if (!existsSync(outputSubDir)) {
            mkdirSync(outputSubDir, {recursive: true})
        }
        wasmOutput = join(outputSubDir, `${fileName}.wasm`)
    }

    // Calculate ABI output path (same location as WASM, but with .abi extension)
    const abiOutput = wasmOutput.replace(/\.wasm$/, '.abi')

    console.log(`Compiling: ${filePath}`)
    console.log(`Output: ${wasmOutput}`)

    // Auto-detect compilation flags
    const autoFlags = autoDetectCompileFlags(filePath)
    if (autoFlags.length > 0) {
        console.log(`Auto-detected flags: ${autoFlags.join(' ')}`)
    }

    try {
        const flagsStr = autoFlags.length > 0 ? `${autoFlags.join(' ')} ` : ''
        const command = `cdt-cpp -abigen -abigen_output="${abiOutput}" ${flagsStr}-o "${wasmOutput}" "${filePath}"`
        execSync(command, {
            stdio: 'inherit',
            cwd: process.cwd(),
        })
        console.log(`✓ Successfully compiled: ${wasmOutput}\n`)
    } catch (error: any) {
        throw new Error(
            `Failed to compile ${filePath}: ${
                error.message || 'Unknown error'
            }. Make sure cdt-cpp is installed and in your PATH.`
        )
    }
}

/**
 * Create the compile command
 */
export function createCompileCommand(): Command {
    const compile = new Command('compile')
    compile
        .description(
            'Compile C++ contract files (single file or all .cpp files in current directory)'
        )
        .argument('[file]', 'Optional file to compile (compiles all .cpp files if not specified)')
        .option('-o, --output <directory>', 'Output directory for compiled WASM files', '.')
        .action(async (file, options) => {
            try {
                await compileContract(file, options.output)
            } catch (error: any) {
                console.error(`Error: ${error.message}`)
                process.exit(1)
            }
        })

    return compile
}
