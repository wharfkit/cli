/* eslint-disable no-console */
import {WalletPluginPrivateKey} from '@wharfkit/wallet-plugin-privatekey'
import {executeCommand, getDevKeys, getPlatform} from './utils'
import {NonInteractiveConsoleUI} from '../../utils/wharfkit-ui'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'

const LEAP_VERSION = 'v5.0.3'
const LEAP_REPO = 'https://github.com/AntelopeIO/leap'

export interface InstallationStatus {
    installed: boolean
    nodeos: boolean
    nodeosPath?: string
    version?: string
    wharfkit: {
        consoleRenderer: boolean
        walletPlugin: boolean
    }
}

/**
 * Get the directory where LEAP will be cloned and built
 */
function getLeapBuildDir(): string {
    return path.join(os.homedir(), '.wharfkit', 'leap-build')
}

/**
 * Check if LEAP is installed
 */
export async function checkLeapInstallation(): Promise<InstallationStatus> {
    const status: InstallationStatus = {
        installed: false,
        nodeos: false,
        wharfkit: {
            consoleRenderer: false,
            walletPlugin: false,
        },
    }

    // Check nodeos
    try {
        const {stdout} = await executeCommand('which nodeos')
        status.nodeosPath = stdout.trim()
        status.nodeos = true
    } catch {
        // nodeos not found
    }

    status.wharfkit.consoleRenderer = checkConsoleRenderer()
    status.wharfkit.walletPlugin = checkWalletPlugin()

    // Get version if nodeos is installed
    if (status.nodeos) {
        try {
            const {stdout} = await executeCommand('nodeos --version')
            const versionMatch = stdout.match(/v?(\d+\.\d+\.\d+)/)
            if (versionMatch) {
                status.version = versionMatch[1]
            }
        } catch {
            // Version check failed
        }
    }

    status.installed =
        status.nodeos && status.wharfkit.consoleRenderer && status.wharfkit.walletPlugin

    return status
}

/**
 * Ensure directory exists
 */
async function ensureBuildDir(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, {recursive: true})
    }
}

/**
 * Clone and checkout LEAP repository
 */
async function cloneLeapRepo(buildDir: string): Promise<void> {
    const leapDir = path.join(buildDir, 'leap')

    // Check if already cloned
    if (fs.existsSync(path.join(leapDir, '.git'))) {
        console.log('LEAP repository already cloned, updating...')
        try {
            await executeCommand(`cd ${leapDir} && git fetch --all --tags`)
            await executeCommand(`cd ${leapDir} && git checkout ${LEAP_VERSION}`)
            await executeCommand(`cd ${leapDir} && git pull || true`)
            await executeCommand(`cd ${leapDir} && git submodule update --init --recursive`)
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to update LEAP repository: ${message}`)
        }
    } else {
        console.log('Cloning LEAP repository...')
        try {
            await executeCommand(`git clone --recursive ${LEAP_REPO} ${leapDir}`)
            await executeCommand(`cd ${leapDir} && git fetch --all --tags`)
            await executeCommand(`cd ${leapDir} && git checkout ${LEAP_VERSION}`)
            await executeCommand(`cd ${leapDir} && git submodule update --init --recursive`)
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error)
            throw new Error(`Failed to clone LEAP repository: ${message}`)
        }
    }
}

/**
 * Build LEAP from source
 */
async function buildLeap(buildDir: string, numJobs?: number): Promise<void> {
    const leapDir = path.join(buildDir, 'leap')
    const leapBuildDir = path.join(leapDir, 'build')

    // Create build directory
    await ensureBuildDir(leapBuildDir)

    const jobs = numJobs || Math.max(1, Math.floor(os.cpus().length / 2))
    console.log(`Building LEAP with ${jobs} parallel jobs (this may take a while)...`)

    try {
        const {os: platform} = getPlatform()

        if (platform === 'darwin') {
            // macOS build - use llvm from Homebrew
            const llvmPrefix = await getLlvmPrefix()
            await executeCommand(
                `cd ${leapBuildDir} && cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_PREFIX_PATH=${llvmPrefix} ..`
            )
        } else {
            // Linux build
            await executeCommand(
                `cd ${leapBuildDir} && cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_PREFIX_PATH=/usr/lib/llvm-11 ..`
            )
        }

        await executeCommand(`cd ${leapBuildDir} && make -j ${jobs}`)
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to build LEAP: ${message}`)
    }
}

/**
 * Get LLVM prefix path on macOS
 */
async function getLlvmPrefix(): Promise<string> {
    try {
        const {stdout} = await executeCommand('brew --prefix llvm@11')
        return stdout.trim()
    } catch {
        // Try llvm without version
        try {
            const {stdout} = await executeCommand('brew --prefix llvm')
            return stdout.trim()
        } catch {
            return '/usr/local/opt/llvm'
        }
    }
}

/**
 * Install built LEAP binaries
 */
async function installBuiltLeap(buildDir: string): Promise<void> {
    const leapDir = path.join(buildDir, 'leap')
    const leapBuildDir = path.join(leapDir, 'build')
    const binDir = path.join(leapBuildDir, 'bin')

    console.log('Installing LEAP binaries...')

    const binaries = ['nodeos', 'cleos', 'keosd', 'leap-util']
    const targetDir = '/usr/local/bin'

    try {
        const {os: platform} = getPlatform()

        // First, try to copy binaries directly (works if user owns /usr/local/bin)
        try {
            for (const binary of binaries) {
                const src = path.join(binDir, binary)
                const dest = path.join(targetDir, binary)
                if (fs.existsSync(src)) {
                    await fs.promises.copyFile(src, dest)
                    await fs.promises.chmod(dest, 0o755)
                }
            }
            console.log('Binaries copied to /usr/local/bin')
            return
        } catch {
            // Direct copy failed, try sudo methods
            console.log('Direct copy failed, trying with elevated permissions...')
        }

        if (platform === 'darwin') {
            // On macOS, use make install with sudo
            await executeCommand(`cd ${leapBuildDir} && sudo make install`)
        } else {
            // On Linux, install the .deb package if available, otherwise make install
            try {
                const {stdout} = await executeCommand(
                    `ls ${leapBuildDir}/leap*.deb 2>/dev/null | head -1`
                )
                if (stdout.trim()) {
                    await executeCommand(`sudo apt-get install -y ${stdout.trim()}`)
                } else {
                    await executeCommand(`cd ${leapBuildDir} && sudo make install`)
                }
            } catch {
                await executeCommand(`cd ${leapBuildDir} && sudo make install`)
            }
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to install LEAP: ${message}`)
    }
}

/**
 * Install LEAP on macOS by building from source
 */
async function installLeapMacOS(): Promise<void> {
    console.log('Installing LEAP on macOS by building from source...')

    // Check if Homebrew is installed
    try {
        await executeCommand('which brew')
    } catch {
        throw new Error(
            'Homebrew is not installed. Please install it from https://brew.sh/ and try again.'
        )
    }

    // Install build dependencies
    console.log('Installing build dependencies...')
    try {
        await executeCommand('brew install cmake git llvm@11 gmp curl python3 numpy || true')
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to install dependencies: ${message}`)
    }

    const buildDir = getLeapBuildDir()
    await ensureBuildDir(buildDir)

    // Clone repository
    await cloneLeapRepo(buildDir)

    // Build from source
    await buildLeap(buildDir)

    // Install
    await installBuiltLeap(buildDir)

    console.log('LEAP installed successfully!')
}

/**
 * Get Ubuntu version for determining LLVM version
 */
async function getUbuntuVersion(): Promise<string> {
    try {
        const {stdout} = await executeCommand('lsb_release -rs')
        return stdout.trim()
    } catch {
        return '22.04'
    }
}

/**
 * Install LEAP on Linux by building from source
 */
async function installLeapLinux(): Promise<void> {
    console.log('Installing LEAP on Linux by building from source...')

    const ubuntuVersion = await getUbuntuVersion()
    const majorVersion = parseInt(ubuntuVersion.split('.')[0], 10)

    // Update package list
    console.log('Updating package list...')
    try {
        await executeCommand('sudo apt-get update')
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to update package list: ${message}`)
    }

    // Install build dependencies
    console.log('Installing build dependencies...')
    try {
        await executeCommand(`sudo apt-get install -y \
            build-essential \
            cmake \
            git \
            libcurl4-openssl-dev \
            libgmp-dev \
            llvm-11-dev \
            python3-numpy \
            file \
            zlib1g-dev`)

        // On Ubuntu 20.04, install gcc-10 for C++20 support
        if (majorVersion === 20) {
            await executeCommand('sudo apt-get install -y g++-10')
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to install dependencies: ${message}`)
    }

    const buildDir = getLeapBuildDir()
    await ensureBuildDir(buildDir)

    // Clone repository
    await cloneLeapRepo(buildDir)

    // Build from source (with Ubuntu 20.04 specific compiler flags)
    await buildLeapLinux(buildDir, majorVersion)

    // Install
    await installBuiltLeap(buildDir)

    console.log('LEAP installed successfully!')
}

/**
 * Build LEAP on Linux with version-specific settings
 */
async function buildLeapLinux(buildDir: string, ubuntuMajorVersion: number): Promise<void> {
    const leapDir = path.join(buildDir, 'leap')
    const leapBuildDir = path.join(leapDir, 'build')

    // Create build directory
    await ensureBuildDir(leapBuildDir)

    const jobs = Math.max(1, Math.floor(os.cpus().length / 2))
    console.log(`Building LEAP with ${jobs} parallel jobs (this may take a while)...`)

    try {
        if (ubuntuMajorVersion === 20) {
            // Ubuntu 20.04 needs gcc-10 specified
            await executeCommand(
                `cd ${leapBuildDir} && cmake \
                    -DCMAKE_C_COMPILER=gcc-10 \
                    -DCMAKE_CXX_COMPILER=g++-10 \
                    -DCMAKE_BUILD_TYPE=Release \
                    -DCMAKE_PREFIX_PATH=/usr/lib/llvm-11 ..`
            )
        } else {
            // Ubuntu 22.04+ has gcc-11 by default
            await executeCommand(
                `cd ${leapBuildDir} && cmake \
                    -DCMAKE_BUILD_TYPE=Release \
                    -DCMAKE_PREFIX_PATH=/usr/lib/llvm-11 ..`
            )
        }

        await executeCommand(`cd ${leapBuildDir} && make -j ${jobs}`)
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to build LEAP: ${message}`)
    }
}

/**
 * Install LEAP based on platform
 */
export async function installLeap(): Promise<void> {
    const {os} = getPlatform()

    switch (os) {
        case 'darwin':
            await installLeapMacOS()
            break
        case 'linux':
            await installLeapLinux()
            break
        default:
            throw new Error(
                `Automatic installation is not supported on ${os}. ` +
                    'Please install LEAP manually from https://github.com/AntelopeIO/leap/releases'
            )
    }

    // Verify installation
    const status = await checkLeapInstallation()
    if (!status.installed) {
        throw new Error('Installation completed but LEAP binaries are not available in PATH')
    }

    console.log(`LEAP ${status.version} is now installed and ready to use!`)
}

/**
 * Ensure LEAP is installed, install automatically if not found
 */
export async function ensureLeapInstalled(): Promise<void> {
    const status = await checkLeapInstallation()

    if (status.installed) {
        console.log(`LEAP ${status.version} is already installed`)
        return
    }

    // In CI mode, skip auto-installation and just check if nodeos is available
    if (process.env.GITHUB_CI) {
        if (!status.nodeos) {
            throw new Error(
                'LEAP is not installed and auto-installation is disabled in CI mode. ' +
                    'Please install LEAP manually or ensure nodeos is available in PATH.'
            )
        }
        // If nodeos is available, continue even if other components are missing
        console.log(`LEAP nodeos is available (version: ${status.version || 'unknown'})`)
        return
    }

    console.log('LEAP is not installed, installing automatically...')

    if (!status.nodeos) {
        console.log('  - nodeos is not installed')
    }
    if (!status.wharfkit.consoleRenderer) {
        console.log('  - WharfKit console renderer is unavailable')
    }
    if (!status.wharfkit.walletPlugin) {
        console.log('  - WharfKit private key wallet plugin is unavailable')
    }

    await installLeap()
}

function checkConsoleRenderer(): boolean {
    try {
        new NonInteractiveConsoleUI()
        return true
    } catch {
        return false
    }
}

function checkWalletPlugin(): boolean {
    try {
        const devKeys = getDevKeys()
        new WalletPluginPrivateKey(devKeys.privateKey)
        return true
    } catch {
        return false
    }
}
