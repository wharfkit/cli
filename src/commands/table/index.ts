/* eslint-disable no-console */
import {Command} from 'commander'
import {getDefaultChain} from '../chain/utils'
import {lookupTable} from '../chain/interact'

/**
 * Create the table command that uses the default chain
 */
export function createTableCommand(): Command {
    const table = new Command('table')
    table
        .description(
            'Lookup table data using the default chain (set with: wharfkit chain set <chain>)'
        )
        .argument('<tableName>', 'Table to lookup (format: contract::table)')
        .argument('[extraFields...]', 'Additional fields')
        .option('--filter <filter>', 'Filter the table data')
        .option('--scope <scope>', 'The contract/scope of the table')
        .option('--limit <limit>', 'Limit the number of rows displayed', '4')
        .option('--all', 'Display all columns')
        .option('--fields <fields>', 'Comma-separated list of fields/columns to display')
        .option('--columns', 'List available columns')
        .option('--json', 'Output as JSON')
        .action(async (tableName, extraFields, options) => {
            const chainName = await getDefaultChain()

            // If user provided spaced fields like "--fields a, b", 'b' ends up in extras.
            if (options.fields && extraFields && extraFields.length > 0) {
                options.fields = [options.fields, ...extraFields].join(' ')
            }

            await lookupTable(chainName, tableName, options)
        })

    return table
}
