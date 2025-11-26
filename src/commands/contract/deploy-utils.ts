/* eslint-disable no-console */
import * as readline from 'readline'
import type {APIClient, Name} from '@wharfkit/antelope'
import {Action, Asset, Serializer, Struct} from '@wharfkit/antelope'
import {SigningRequest} from '@wharfkit/signing-request'
import * as qrcode from 'qrcode-terminal'

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
    costInTokens: Asset
    currentRamBytes: number
    currentRamAvailable: number
    tokenBalance: Asset
    hasEnoughRam: boolean
    hasEnoughTokens: boolean
    ramToBuy: number
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
    // Add a 10% buffer for overhead
    const buffer = Math.ceil((setcodeRam + setabiRam) * 0.1)
    return setcodeRam + setabiRam + buffer
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
 */
export async function getRamPrice(
    client: APIClient
): Promise<{pricePerByte: number; symbol: string}> {
    const rammarket = await client.v1.chain.get_table_rows({
        code: 'eosio',
        scope: 'eosio',
        table: 'rammarket',
        limit: 1,
    })

    if (rammarket.rows.length === 0) {
        throw new Error('Could not fetch RAM market data')
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

    return {pricePerByte, symbol}
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
        } catch (e) {
            coreBalance = Asset.from(`0.0000 ${symbol}`)
        }

        return {
            ramQuota,
            ramUsage,
            ramAvailable: ramQuota - ramUsage,
            coreBalance,
        }
    } catch (error) {
        // Account might not exist yet
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
 */
export async function analyzeRamRequirements(
    client: APIClient,
    accountName: string,
    wasmSize: number,
    abiSize: number
): Promise<RamInfo> {
    const ramBytesNeeded = calculateRamNeeded(wasmSize, abiSize)
    const {pricePerByte, symbol} = await getRamPrice(client)
    const resources = await getAccountResources(client, accountName, symbol)

    const ramToBuy = Math.max(0, ramBytesNeeded - resources.ramAvailable)
    const costInTokens = calculateRamCost(ramToBuy, pricePerByte, symbol)

    const hasEnoughRam = resources.ramAvailable >= ramBytesNeeded
    const hasEnoughTokens = hasEnoughRam || resources.coreBalance.value >= costInTokens.value

    return {
        pricePerByte,
        ramBytesNeeded,
        costInTokens,
        currentRamBytes: resources.ramQuota,
        currentRamAvailable: resources.ramAvailable,
        tokenBalance: resources.coreBalance,
        hasEnoughRam,
        hasEnoughTokens,
        ramToBuy,
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

    // Create transfer action with placeholder authorization
    const transferAction = Action.from({
        account: 'eosio.token',
        name: 'transfer',
        authorization: [
            {
                actor: '............1', // Placeholder for signing wallet
                permission: '............2', // Placeholder for permission
            },
        ],
        data: {
            from: '............1', // Placeholder
            to: toAccount,
            quantity: String(amount),
            memo,
        },
    })

    // Encode action data
    const tokenAbi = await client.v1.chain.get_abi('eosio.token')
    if (!tokenAbi.abi) {
        throw new Error('Could not fetch eosio.token ABI')
    }
    const encodedData = Serializer.encode({
        object: transferAction.data,
        abi: tokenAbi.abi,
        type: 'transfer',
    })

    const request = await SigningRequest.create(
        {
            actions: [
                {
                    account: 'eosio.token',
                    name: 'transfer',
                    authorization: [
                        {
                            actor: '............1',
                            permission: '............2',
                        },
                    ],
                    data: encodedData.array,
                },
            ],
            chainId,
        },
        {
            abiProvider: {
                getAbi: async (account: Name) => {
                    const response = await client.v1.chain.get_abi(String(account))
                    if (!response.abi) {
                        throw new Error(`Could not fetch ABI for ${account}`)
                    }
                    return response.abi
                },
            },
        }
    )

    const encodedUri = request.encode()
    const uri = `esr://${encodedUri.slice(4)}` // Convert esr: to esr://

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

    // Get eosio ABI for buyrambytes
    const eosioAbi = await client.v1.chain.get_abi('eosio')
    if (!eosioAbi.abi) {
        throw new Error('Could not fetch eosio ABI')
    }

    // Create buyram action
    const buyramData = {
        payer: '............1', // Placeholder
        receiver,
        quant: String(amount),
    }

    const encodedData = Serializer.encode({
        object: buyramData,
        abi: eosioAbi.abi,
        type: 'buyram',
    })

    const request = await SigningRequest.create(
        {
            actions: [
                {
                    account: 'eosio',
                    name: 'buyram',
                    authorization: [
                        {
                            actor: '............1',
                            permission: '............2',
                        },
                    ],
                    data: encodedData.array,
                },
            ],
            chainId,
        },
        {
            abiProvider: {
                getAbi: async (account: Name) => {
                    const response = await client.v1.chain.get_abi(String(account))
                    if (!response.abi) {
                        throw new Error(`Could not fetch ABI for ${account}`)
                    }
                    return response.abi
                },
            },
        }
    )

    const encodedUri = request.encode()
    const uri = `esr://${encodedUri.slice(4)}`

    return {uri, encodedUri}
}

/**
 * Display QR code and link in terminal
 */
export function displayQRCode(uri: string, title: string): void {
    console.log(`\n${title}`)
    console.log('─'.repeat(60))
    console.log(`\nLink: ${uri}`)
    console.log('\nScan this QR code with your wallet app:\n')
    qrcode.generate(uri, {small: true})
    console.log('─'.repeat(60))
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
    console.log(`   Target: ${targetBalance}`)
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
    console.log(`RAM needed for deployment: ${formatBytes(ramInfo.ramBytesNeeded)}`)
    console.log(`Current RAM available: ${formatBytes(ramInfo.currentRamAvailable)}`)
    console.log(`RAM to purchase: ${formatBytes(ramInfo.ramToBuy)}`)
    console.log(`Estimated cost: ${ramInfo.costInTokens}`)
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
