/* eslint-disable no-console */
import {executeCommand, getPlatform} from './utils'

export interface InstallationStatus {
    installed: boolean
    nodeos: boolean
    cleos: boolean
    keosd: boolean
    nodeosPath?: string
    cleosPath?: string
    keosdPath?: string
    version?: string
}

/**
 * Check if LEAP is installed
 */
export async function checkLeapInstallation(): Promise<InstallationStatus> {
    const status: InstallationStatus = {
        installed: false,
        nodeos: false,
        cleos: false,
        keosd: false,
    }

    // Check nodeos
    try {
        const {stdout} = await executeCommand('which nodeos')
        status.nodeosPath = stdout.trim()
        status.nodeos = true
    } catch {
        // nodeos not found
    }

    // Check cleos
    try {
        const {stdout} = await executeCommand('which cleos')
        status.cleosPath = stdout.trim()
        status.cleos = true
    } catch {
        // cleos not found
    }

    // Check keosd
    try {
        const {stdout} = await executeCommand('which keosd')
        status.keosdPath = stdout.trim()
        status.keosd = true
    } catch {
        // keosd not found
    }

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

    status.installed = status.nodeos && status.cleos && status.keosd

    return status
}

/**
 * Install LEAP on macOS using Homebrew
 */
async function installLeapMacOS(): Promise<void> {
    console.log('Installing LEAP on macOS using Homebrew...')

    // Check if Homebrew is installed
    try {
        await executeCommand('which brew')
    } catch {
        throw new Error(
            'Homebrew is not installed. Please install it from https://brew.sh/ and try again.'
        )
    }

    // Tap AntelopeIO
    console.log('Adding AntelopeIO tap...')
    try {
        await executeCommand('brew tap antelopeio/leap')
    } catch (error: any) {
        throw new Error(`Failed to add AntelopeIO tap: ${error.message}`)
    }

    // Install LEAP
    console.log('Installing LEAP (this may take a few minutes)...')
    try {
        await executeCommand('brew install leap')
    } catch (error: any) {
        throw new Error(`Failed to install LEAP: ${error.message}`)
    }

    console.log('LEAP installed successfully!')
}

/**
 * Install LEAP on Linux using apt
 */
async function installLeapLinux(): Promise<void> {
    console.log('Installing LEAP on Linux using apt...')

    // Detect distribution
    let distro = 'ubuntu'
    let version = '22.04'

    try {
        const {stdout} = await executeCommand('lsb_release -is')
        distro = stdout.trim().toLowerCase()
    } catch {
        console.log('Could not detect distribution, assuming Ubuntu')
    }

    try {
        const {stdout} = await executeCommand('lsb_release -rs')
        version = stdout.trim()
    } catch {
        console.log('Could not detect version, assuming 22.04')
    }

    // Add AntelopeIO repository
    console.log('Adding AntelopeIO repository...')
    try {
        await executeCommand(
            'wget -qO - https://apt.antelope.io/repos/antelope.gpg.key | sudo apt-key add -'
        )
        await executeCommand(
            `echo "deb [arch=amd64] https://apt.antelope.io ${distro} ${version}" | sudo tee /etc/apt/sources.list.d/antelope.list`
        )
    } catch (error: any) {
        throw new Error(`Failed to add AntelopeIO repository: ${error.message}`)
    }

    // Update package list
    console.log('Updating package list...')
    try {
        await executeCommand('sudo apt-get update')
    } catch (error: any) {
        throw new Error(`Failed to update package list: ${error.message}`)
    }

    // Install LEAP
    console.log('Installing LEAP (this may take a few minutes)...')
    try {
        await executeCommand('sudo apt-get install -y leap')
    } catch (error: any) {
        throw new Error(`Failed to install LEAP: ${error.message}`)
    }

    console.log('LEAP installed successfully!')
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

    console.log('LEAP is not installed, installing automatically...')

    if (!status.nodeos) {
        console.log('  - nodeos is not installed')
    }
    if (!status.cleos) {
        console.log('  - cleos is not installed')
    }
    if (!status.keosd) {
        console.log('  - keosd is not installed')
    }

    await installLeap()
}
