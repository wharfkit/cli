/* eslint-disable no-console */
import {execSync} from 'child_process'
import {existsSync, readdirSync} from 'fs'
import {join, resolve, basename, extname} from 'path'
import {platform} from 'os'
import {checkLeapInstallation} from '../chain/install'

interface CompileOptions {
    output: string
}

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

    const absoluteOutputDir = resolve(outputDir)
    ensureOutputDirectory(absoluteOutputDir)

    // Ensure cdt-cpp is installed
    await ensureCdtCppInstalled()

    console.log(`Compiling ${files.length} file(s) to ${absoluteOutputDir}\n`)

    for (const filePath of files) {
        await compileSingleFile(filePath, absoluteOutputDir)
    }

    console.log('\nCompilation complete!')
}

/**
 * Get list of files to compile
 */
async function getFilesToCompile(file: string | undefined, currentDir: string): Promise<string[]> {
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

    // Get all .cpp files in current directory
    const files = readdirSync(currentDir)
        .filter((f) => extname(f) === '.cpp')
        .map((f) => join(currentDir, f))

    return files
}

/**
 * Ensure output directory exists
 */
function ensureOutputDirectory(dir: string): void {
    if (!existsSync(dir)) {
        throw new Error(`Output directory does not exist: ${dir}`)
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
 * Compile a single C++ file to WASM using cdt-cpp
 */
async function compileSingleFile(filePath: string, outputDir: string): Promise<void> {
    const fileName = basename(filePath, '.cpp')
    const wasmOutput = join(outputDir, `${fileName}.wasm`)

    console.log(`Compiling: ${filePath}`)
    console.log(`Output: ${wasmOutput}`)

    try {
        const command = `cdt-cpp -abigen -o "${wasmOutput}" "${filePath}"`
        execSync(command, {
            stdio: 'inherit',
            cwd: process.cwd(),
        })
        console.log(`✓ Successfully compiled: ${wasmOutput}\n`)
    } catch (error: any) {
        throw new Error(
            `Failed to compile ${filePath}: ${error.message || 'Unknown error'}. Make sure cdt-cpp is installed and in your PATH.`
        )
    }
}

