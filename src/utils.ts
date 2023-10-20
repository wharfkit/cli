import {APIClient, FetchProvider} from '@wharfkit/antelope'
import fetch from 'node-fetch'

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
