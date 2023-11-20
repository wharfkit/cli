import type {NameType} from '@wharfkit/antelope'
import {APIClient, Checksum256, Name, Struct} from '@wharfkit/antelope'
import type {ContractArgs, PartialBy, Table} from '@wharfkit/contract'
import {Contract as BaseContract} from '@wharfkit/contract'

import {abi} from './mock-eosio'

export class Contract extends BaseContract {
    constructor(args: PartialBy<ContractArgs, 'abi' | 'account'>) {
        super({
            client: args.client,
            abi: abi,
            account: Name.from('eosio'),
        })
    }
    table<T extends keyof typeof TableMap>(name: T, scope?: NameType): Table<(typeof TableMap)[T]> {
        return super.table<(typeof TableMap)[T]>(name, scope, TableMap[name])
    }
}

export namespace Types {
    @Struct.type('abi_hash')
    export class abi_hash extends Struct {
        @Struct.field(Name)
        owner!: Name
        @Struct.field(Checksum256)
        hash!: Checksum256
    }
}

const TableMap = {
    abihash: Types.abi_hash,
}

const contract = new Contract({client: new APIClient({url: 'https://eos.greymass.com'})})

const table = contract.table('abihash') // <-- This needs to be a Table<Types.abi_hash>

console.log(table)
