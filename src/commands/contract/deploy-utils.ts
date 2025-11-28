/* eslint-disable no-console */
import * as readline from 'readline'
import type {APIClient} from '@wharfkit/antelope'
import {ABI, Asset, Struct} from '@wharfkit/antelope'
import {PlaceholderName, PlaceholderPermission, SigningRequest} from '@wharfkit/signing-request'

/**
 * RAM market row structure
 */
@Struct.type('rammarket')
export class RamMarketRow extends Struct {
    @Struct.field(Asset) supply!: Asset
    @Struct.field(Asset) base!: Asset
    @Struct.field(Asset) quote!: Asset
}

/**
 * Connector structure for RAM market
 */
@Struct.type('connector')
export class Connector extends Struct {
    @Struct.field(Asset) balance!: Asset
    @Struct.field('float64') weight!: number
}

/**
 * Exchange state structure
 */
@Struct.type('exchange_state')
export class ExchangeState extends Struct {
    @Struct.field(Asset) supply!: Asset
    @Struct.field(Connector) base!: Connector
    @Struct.field(Connector) quote!: Connector
}

export interface RamInfo {
    pricePerByte: number
    ramBytesNeeded: number
    existingContractRam: number // RAM used by existing contract code (will be freed on update)
    deltaRamNeeded: number // Actual new RAM needed (ramBytesNeeded - existingContractRam)
    costInTokens: Asset
    currentRamBytes: number
    currentRamAvailable: number
    tokenBalance: Asset
    hasEnoughRam: boolean
    hasEnoughTokens: boolean
    ramToBuy: number
    hasSystemContract: boolean // Whether the chain has full system contracts (RAM market)
    isUpdate: boolean // Whether this is an update to existing contract
}

export interface AccountResources {
    ramQuota: number
    ramUsage: number
    ramAvailable: number
    coreBalance: Asset
}

/**
 * Calculate RAM needed for contract deployment
 * setcode requires approximately 10x the WASM size
 * setabi requires approximately the ABI size
 */
export function calculateRamNeeded(wasmSize: number, abiSize: number): number {
    // setcode action requires roughly 10x the WASM file size
    const setcodeRam = wasmSize * 10
    // setabi action requires roughly the ABI file size
    const setabiRam = abiSize
    // Add a 1% buffer for overhead
    const buffer = Math.ceil((setcodeRam + setabiRam) * 0.01)
    return setcodeRam + setabiRam + buffer
}

/**
 * Get existing contract RAM usage
 * When updating a contract, the existing code RAM will be freed and replaced
 * Returns 0 if no contract exists
 */
export async function getExistingContractRam(
    client: APIClient,
    accountName: string
): Promise<number> {
    try {
        // Get the API URL from the client's provider
        const baseUrl = (client.provider as {url?: string}).url

        if (!baseUrl) {
            return 0
        }

        // Use fetch to call get_raw_code_and_abi endpoint directly
        // as wharfkit APIClient doesn't have this method built-in
        const response = await fetch(`${baseUrl}/v1/chain/get_raw_code_and_abi`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({account_name: accountName}),
        })

        if (!response.ok) {
            return 0
        }

        const data = (await response.json()) as {wasm?: string; abi?: string}

        // Check if there's existing code
        if (!data.wasm || data.wasm.length === 0) {
            return 0
        }

        // Decode base64 to get actual sizes
        const wasmBytes = Buffer.from(data.wasm, 'base64')
        const abiBytes = data.abi ? Buffer.from(data.abi, 'base64') : Buffer.alloc(0)

        // Calculate RAM used by existing contract using same formula
        return calculateRamNeeded(wasmBytes.length, abiBytes.length)
    } catch {
        // Account might not exist or have no code
        return 0
    }
}

/**
 * Get the core token symbol for a chain
 */
export async function getCoreSymbol(client: APIClient): Promise<string> {
    try {
        // Try to get from rammarket which has the quote symbol
        const rammarket = await client.v1.chain.get_table_rows({
            code: 'eosio',
            scope: 'eosio',
            table: 'rammarket',
            limit: 1,
        })
        if (rammarket.rows.length > 0) {
            const state = rammarket.rows[0]
            // Extract symbol from quote balance (e.g., "1000.0000 EOS")
            const quoteStr = state.quote?.balance || state.quote
            if (typeof quoteStr === 'string') {
                const parts = quoteStr.split(' ')
                if (parts.length === 2) {
                    return parts[1]
                }
            }
        }
    } catch (e) {
        // Ignore errors, use default
    }
    return 'EOS'
}

/**
 * Get RAM price from the rammarket table using Bancor algorithm
 * Falls back to default values for local chains without system contracts
 */
export async function getRamPrice(
    client: APIClient
): Promise<{pricePerByte: number; symbol: string; hasSystemContract: boolean}> {
    try {
        const rammarket = await client.v1.chain.get_table_rows({
            code: 'eosio',
            scope: 'eosio',
            table: 'rammarket',
            limit: 1,
        })

        if (rammarket.rows.length === 0) {
            // No RAM market data, this is a simple local chain
            return {pricePerByte: 0.00000001, symbol: 'SYS', hasSystemContract: false}
        }

        const state = rammarket.rows[0]

        // Parse base (RAM) and quote (tokens) from the market
        // Base is RAM bytes, Quote is the token (e.g., EOS)
        let baseBalance: number
        let quoteBalance: number
        let symbol = 'EOS'

        // Handle different response formats
        if (state.base?.balance) {
            // Format: { balance: "123456789 RAM", weight: "0.50000000000000000" }
            const baseStr = state.base.balance
            baseBalance = parseFloat(baseStr.split(' ')[0])
            const quoteStr = state.quote.balance
            const quoteParts = quoteStr.split(' ')
            quoteBalance = parseFloat(quoteParts[0])
            symbol = quoteParts[1] || 'EOS'
        } else {
            // Simpler format
            baseBalance = parseFloat(state.base)
            quoteBalance = parseFloat(state.quote)
        }

        // Bancor formula: price = quote_balance / base_balance
        const pricePerByte = quoteBalance / baseBalance

        return {pricePerByte, symbol, hasSystemContract: true}
    } catch {
        // RAM market might not exist on local chains, use default values
        // This allows deployment to proceed on simple local chains
        return {pricePerByte: 0.00000001, symbol: 'SYS', hasSystemContract: false}
    }
}

/**
 * Get account resources (RAM and token balance)
 */
export async function getAccountResources(
    client: APIClient,
    accountName: string,
    symbol: string
): Promise<AccountResources> {
    try {
        const accountInfo = await client.v1.chain.get_account(accountName)

        const ramQuota = Number(accountInfo.ram_quota)
        const ramUsage = Number(accountInfo.ram_usage)

        // Get core token balance
        let coreBalance: Asset
        try {
            const balances = await client.v1.chain.get_currency_balance('eosio.token', accountName)
            const matchingBalance = balances.find((b) => String(b).includes(symbol))
            coreBalance = matchingBalance || Asset.from(`0.0000 ${symbol}`)
        } catch {
            // eosio.token might not exist on local chains, default to zero balance
            coreBalance = Asset.from(`0.0000 ${symbol}`)
        }

        return {
            ramQuota,
            ramUsage,
            ramAvailable: ramQuota - ramUsage,
            coreBalance,
        }
    } catch {
        // Account might not exist yet or other API errors
        return {
            ramQuota: 0,
            ramUsage: 0,
            ramAvailable: 0,
            coreBalance: Asset.from(`0.0000 ${symbol}`),
        }
    }
}

/**
 * Calculate total RAM cost for a given number of bytes
 */
export function calculateRamCost(bytesNeeded: number, pricePerByte: number, symbol: string): Asset {
    // Add 0.5% fee for RAM purchase
    const ramCostRaw = bytesNeeded * pricePerByte * 1.005
    // Round up to 4 decimal places
    const ramCost = Math.ceil(ramCostRaw * 10000) / 10000
    return Asset.from(`${ramCost.toFixed(4)} ${symbol}`)
}

/**
 * Analyze RAM requirements for deployment
 * When updating an existing contract, calculates the delta RAM needed
 * (existing contract RAM will be freed when replaced)
 */
export async function analyzeRamRequirements(
    client: APIClient,
    accountName: string,
    wasmSize: number,
    abiSize: number
): Promise<RamInfo> {
    const ramBytesNeeded = calculateRamNeeded(wasmSize, abiSize)
    const {pricePerByte, symbol, hasSystemContract} = await getRamPrice(client)
    const resources = await getAccountResources(client, accountName, symbol)

    // Check for existing contract - its RAM will be freed when we update
    const existingContractRam = await getExistingContractRam(client, accountName)
    const isUpdate = existingContractRam > 0

    // Calculate actual delta RAM needed (new - existing, minimum 0)
    // When updating, the existing contract RAM is freed and replaced
    const deltaRamNeeded = Math.max(0, ramBytesNeeded - existingContractRam)

    // Only need to buy RAM for the delta beyond what's available
    const ramToBuy = Math.max(0, deltaRamNeeded - resources.ramAvailable)
    const costInTokens = calculateRamCost(ramToBuy, pricePerByte, symbol)

    // On chains without system contracts, RAM is essentially free/unlimited
    const hasEnoughRam = !hasSystemContract || resources.ramAvailable >= deltaRamNeeded
    const hasEnoughTokens = hasEnoughRam || resources.coreBalance.value >= costInTokens.value

    return {
        pricePerByte,
        ramBytesNeeded,
        existingContractRam,
        deltaRamNeeded,
        costInTokens,
        currentRamBytes: resources.ramQuota,
        currentRamAvailable: resources.ramAvailable,
        tokenBalance: resources.coreBalance,
        hasEnoughRam,
        hasEnoughTokens,
        ramToBuy,
        hasSystemContract,
        isUpdate,
    }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} bytes`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Prompt user for confirmation
 */
export async function promptConfirmation(message: string): Promise<boolean> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        })

        rl.question(`${message} (y/n): `, (answer) => {
            rl.close()
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
        })
    })
}

/**
 * Create an ESR (EOSIO Signing Request) for transferring tokens
 */
export async function createTransferESR(
    client: APIClient,
    toAccount: string,
    amount: Asset,
    memo: string
): Promise<{uri: string; encodedUri: string}> {
    const info = await client.v1.chain.get_info()
    const chainId = String(info.chain_id)

    // Fetch the eosio.token ABI for serialization
    const tokenAbiResponse = await client.v1.chain.get_abi('eosio.token')
    if (!tokenAbiResponse.abi) {
        throw new Error('Could not fetch eosio.token ABI')
    }
    const tokenAbi = ABI.from(tokenAbiResponse.abi)

    // Create the signing request with placeholders for the signing wallet
    const request = await SigningRequest.create(
        {
            action: {
                account: 'eosio.token',
                name: 'transfer',
                authorization: [
                    {
                        actor: PlaceholderName,
                        permission: PlaceholderPermission,
                    },
                ],
                data: {
                    from: PlaceholderName,
                    to: toAccount,
                    quantity: String(amount),
                    memo,
                },
            },
            chainId,
        },
        {
            abiProvider: {
                getAbi: async () => tokenAbi,
            },
        }
    )

    const encodedUri = request.encode()
    // Normalize to esr:// format
    let uri = encodedUri
    if (uri.startsWith('esr://')) {
        // Already correct format
    } else if (uri.startsWith('esr:')) {
        uri = `esr://${uri.slice(4)}`
    }

    return {uri, encodedUri}
}

/**
 * Create an ESR for buying RAM
 */
export async function createBuyRamESR(
    client: APIClient,
    receiver: string,
    amount: Asset
): Promise<{uri: string; encodedUri: string}> {
    const info = await client.v1.chain.get_info()
    const chainId = String(info.chain_id)

    // Get eosio ABI for buyram
    const eosioAbiResponse = await client.v1.chain.get_abi('eosio')
    if (!eosioAbiResponse.abi) {
        throw new Error('Could not fetch eosio ABI')
    }
    const eosioAbi = ABI.from(eosioAbiResponse.abi)

    // Create the signing request with placeholders
    const request = await SigningRequest.create(
        {
            action: {
                account: 'eosio',
                name: 'buyram',
                authorization: [
                    {
                        actor: PlaceholderName,
                        permission: PlaceholderPermission,
                    },
                ],
                data: {
                    payer: PlaceholderName,
                    receiver,
                    quant: String(amount),
                },
            },
            chainId,
        },
        {
            abiProvider: {
                getAbi: async () => eosioAbi,
            },
        }
    )

    const encodedUri = request.encode()
    // Normalize to esr:// format
    let uri = encodedUri
    if (uri.startsWith('esr://')) {
        // Already correct format
    } else if (uri.startsWith('esr:')) {
        uri = `esr://${uri.slice(4)}`
    }

    return {uri, encodedUri}
}

/**
 * Wait for account balance to reach a target
 */
export async function waitForBalance(
    client: APIClient,
    accountName: string,
    targetBalance: Asset,
    pollInterval: number = 5000,
    timeout: number = 300000 // 5 minutes
): Promise<boolean> {
    const startTime = Date.now()
    const symbol = String(targetBalance).split(' ')[1]

    console.log(`\n⏳ Waiting for funds... (polling every ${pollInterval / 1000}s)`)
    console.log(`   Needed: ${targetBalance}`)
    console.log('   Press Ctrl+C to cancel\n')

    while (Date.now() - startTime < timeout) {
        try {
            const balances = await client.v1.chain.get_currency_balance('eosio.token', accountName)
            const currentBalance = balances.find((b) => String(b).includes(symbol))

            if (currentBalance && Asset.from(currentBalance).value >= targetBalance.value) {
                console.log(`\n✅ Funds received! Current balance: ${currentBalance}`)
                return true
            }

            process.stdout.write(
                `\r   Current balance: ${currentBalance || `0.0000 ${symbol}`} | ` +
                    `Elapsed: ${Math.floor((Date.now() - startTime) / 1000)}s`
            )
        } catch (e) {
            // Account might not exist yet, continue polling
        }

        await sleep(pollInterval)
    }

    console.log('\n\n⏱️  Timeout waiting for funds')
    return false
}

/**
 * Wait for account RAM to reach a target
 */
export async function waitForRam(
    client: APIClient,
    accountName: string,
    targetRamBytes: number,
    pollInterval: number = 5000,
    timeout: number = 300000 // 5 minutes
): Promise<boolean> {
    const startTime = Date.now()

    console.log(`\n⏳ Waiting for RAM... (polling every ${pollInterval / 1000}s)`)
    console.log(`   Target: ${formatBytes(targetRamBytes)} available`)
    console.log('   Press Ctrl+C to cancel\n')

    while (Date.now() - startTime < timeout) {
        try {
            const accountInfo = await client.v1.chain.get_account(accountName)
            const ramAvailable = Number(accountInfo.ram_quota) - Number(accountInfo.ram_usage)

            if (ramAvailable >= targetRamBytes) {
                console.log(`\n✅ RAM available! Current: ${formatBytes(ramAvailable)}`)
                return true
            }

            process.stdout.write(
                `\r   Current RAM available: ${formatBytes(ramAvailable)} | ` +
                    `Elapsed: ${Math.floor((Date.now() - startTime) / 1000)}s`
            )
        } catch (e) {
            // Account might not exist yet
        }

        await sleep(pollInterval)
    }

    console.log('\n\n⏱️  Timeout waiting for RAM')
    return false
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Display RAM analysis summary
 */
export function displayRamAnalysis(ramInfo: RamInfo, accountName: string): void {
    console.log('\n📊 RAM Analysis')
    console.log('─'.repeat(50))
    console.log(`Account: ${accountName}`)

    if (ramInfo.isUpdate) {
        console.log(`📦 Updating existing contract`)
        console.log(`   New contract RAM: ${formatBytes(ramInfo.ramBytesNeeded)}`)
        console.log(`   Existing contract RAM: ${formatBytes(ramInfo.existingContractRam)}`)
        console.log(`   Delta RAM needed: ${formatBytes(ramInfo.deltaRamNeeded)}`)
    } else {
        console.log(`📦 New contract deployment`)
        console.log(`   RAM needed: ${formatBytes(ramInfo.ramBytesNeeded)}`)
    }

    console.log(`Current RAM available: ${formatBytes(ramInfo.currentRamAvailable)}`)

    if (!ramInfo.hasSystemContract) {
        console.log('─'.repeat(50))
        console.log('ℹ️  Local chain without system contracts - RAM management not required')
        return
    }

    if (ramInfo.ramToBuy > 0) {
        console.log(`RAM to purchase: ${formatBytes(ramInfo.ramToBuy)}`)
        console.log(`Estimated cost: ${ramInfo.costInTokens}`)
    }
    console.log(`Current balance: ${ramInfo.tokenBalance}`)
    console.log(
        `Price per KB: ${(ramInfo.pricePerByte * 1024).toFixed(4)} ${
            String(ramInfo.costInTokens).split(' ')[1]
        }`
    )
    console.log('─'.repeat(50))

    if (ramInfo.hasEnoughRam) {
        console.log('✅ Account has sufficient RAM for deployment')
    } else if (ramInfo.hasEnoughTokens) {
        console.log('✅ Account has sufficient tokens to purchase required RAM')
    } else {
        console.log('❌ Account needs more tokens to purchase required RAM')
    }
}
