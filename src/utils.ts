/* eslint-disable no-console */
import {APIClient, FetchProvider} from '@wharfkit/antelope'
import {capitalize} from '@wharfkit/contract'
import fetch from 'node-fetch'
import * as qrcode from 'qrcode-terminal'

type logLevel = 'info' | 'debug'

export function makeClient(url: string): APIClient {
    const provider = new FetchProvider(url, {fetch})
    return new APIClient({provider})
}

export function log(message, level: logLevel = 'debug') {
    if (level === 'info' || process.env.WHARFKIT_DEBUG) {
        process.stdout.write(`${message}\n`)
    }
}

export function capitalizeName(text: string) {
    return text
        .split(/[._]/)
        .map((part) => capitalize(part))
        .join('')
}

export function formatClassName(name: string) {
    return name.split(/[.]/).join('')
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
