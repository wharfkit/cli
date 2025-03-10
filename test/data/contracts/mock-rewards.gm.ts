import type {
    Action,
    AssetType,
    Float64Type,
    NameType,
    TimePointType,
    UInt16Type,
} from '@wharfkit/antelope'
import {ABI, Asset, Blob, Float64, Name, Struct, TimePoint, UInt16} from '@wharfkit/antelope'
import type {ActionOptions, ContractArgs, PartialBy, Table} from '@wharfkit/contract'
import {Contract as BaseContract} from '@wharfkit/contract'
export const abiBlob = Blob.from(
    'DmVvc2lvOjphYmkvMS4yAAoHYWRkdXNlcgACB2FjY291bnQEbmFtZQZ3ZWlnaHQGdWludDE2BWNsYWltAAIHYWNjb3VudARuYW1lBmFtb3VudAZhc3NldD8GY29uZmlnAAMMdG9rZW5fc3ltYm9sBnN5bWJvbA5vcmFjbGVfYWNjb3VudARuYW1lDG9yYWNsZV9wYWlycw1vcmFjbGVfcGFpcltdCWNvbmZpZ3VyZQADDHRva2VuX3N5bWJvbAZzeW1ib2wOb3JhY2xlX2FjY291bnQEbmFtZQxvcmFjbGVfcGFpcnMNb3JhY2xlX3BhaXJbXQdkZWx1c2VyAAEHYWNjb3VudARuYW1lC29yYWNsZV9wYWlyAAIEbmFtZQRuYW1lCXByZWNpc2lvbgZ1aW50MTYKcHJpY2VfaW5mbwADBHBhaXIGc3RyaW5nBXByaWNlB2Zsb2F0NjQJdGltZXN0YW1wCnRpbWVfcG9pbnQHcmVjZWlwdAADB2FjY291bnQEbmFtZQZhbW91bnQFYXNzZXQGdGlja2VyDHByaWNlX2luZm9bXQp1cGRhdGV1c2VyAAIHYWNjb3VudARuYW1lBndlaWdodAZ1aW50MTYIdXNlcl9yb3cAAwdhY2NvdW50BG5hbWUGd2VpZ2h0BnVpbnQxNgdiYWxhbmNlBWFzc2V0BgAAAOAqrFMyB2FkZHVzZXKVAi0tLQpzcGVjX3ZlcnNpb246ICIwLjIuMCIKdGl0bGU6IEFkZCB1c2VyCnN1bW1hcnk6ICdBZGQgbmV3IHVzZXIge3tub3dyYXAgYWNjb3VudH19JwppY29uOiBodHRwczovL2FsbW9zdC5kaWdpdGFsL2ltYWdlcy9taXNjX2ljb24ucG5nIzZmNWVhOTc4YjA0ZDAzZTAxOGIzNzlhMmJhYzRjMTBiNWE4ZmUwY2Q1ZTZlMTVjODg4MjhkYzk4NmJlOTZjZmYKLS0tCgp7e2FjY291bnR9fSBpcyBhZGRlZCB0byB0aGUgcmV3YXJkcyBzaGFyaW5nIGxpc3Qgd2l0aCB3ZWlnaHQge3t3ZWlnaHR9fS4AAAAAAOlMRAVjbGFpbfYCLS0tCnNwZWNfdmVyc2lvbjogIjAuMi4wIgp0aXRsZTogQ2xhaW0Kc3VtbWFyeTogJ0NsYWltIHJld2FyZHMgZm9yIHt7bm93cmFwIGFjY291bnR9fScKaWNvbjogaHR0cHM6Ly9hbG1vc3QuZGlnaXRhbC9pbWFnZXMvY2xhaW1faWNvbi5wbmcjYmI1OTdmNGFjYzEzMDU5MjU5MTJlMThlN2I0Y2Y3MDhkMWZhZWMyYWE4OGI3YTUzZDg3OTY5ZTA0NTE2OGVjZgotLS0KCnt7I2lmX2hhc192YWx1ZSBhbW91bnR9fQogICAge3thY2NvdW50fX0gY2xhaW1zIHt7YW1vdW50fX0gZnJvbSB0aGVpciByZXdhcmRzIGJhbGFuY2UuCnt7ZWxzZX19CiAgICB7e2FjY291bnR9fSBjbGFpbXMgdGhlaXIgZW50aXJlIHJld2FyZHMgYmFsYW5jZS4Ke3svaWZfaGFzX3ZhbHVlfX0AAFBXM7cmRQljb25maWd1cmUAAAAA4Cqso0oHZGVsdXNlcsQCLS0tCnNwZWNfdmVyc2lvbjogIjAuMi4wIgp0aXRsZTogRGVsZXRlIHVzZXIKc3VtbWFyeTogJ0RlbGV0ZSB1c2VyIHt7bm93cmFwIGFjY291bnR9fScKaWNvbjogaHR0cHM6Ly9hbG1vc3QuZGlnaXRhbC9pbWFnZXMvbWlzY19pY29uLnBuZyM2ZjVlYTk3OGIwNGQwM2UwMThiMzc5YTJiYWM0YzEwYjVhOGZlMGNkNWU2ZTE1Yzg4ODI4ZGM5ODZiZTk2Y2ZmCi0tLQoKe3thY2NvdW50fX0gaXMgaXMgcmVtb3ZlZCBmcm9tIHRoZSByZXdhcmRzIHNoYXJpbmcgbGlzdC4KClVzZXJzIGNhbiBvbmx5IGJlIHJlbW92ZWQgaWYgdGhlaXIgcmV3YXJkcyBiYWxhbmNlIGlzIHplcm8uAAAAIFenkLoHcmVjZWlwdAAAwFVYq2xS1Qp1cGRhdGV1c2VygAItLS0Kc3BlY192ZXJzaW9uOiAiMC4yLjAiCnRpdGxlOiBVcGRhdGUgdXNlcgpzdW1tYXJ5OiAnVXBkYXRlIHVzZXIge3tub3dyYXAgYWNjb3VudH19JwppY29uOiBodHRwczovL2FsbW9zdC5kaWdpdGFsL2ltYWdlcy9taXNjX2ljb24ucG5nIzZmNWVhOTc4YjA0ZDAzZTAxOGIzNzlhMmJhYzRjMTBiNWE4ZmUwY2Q1ZTZlMTVjODg4MjhkYzk4NmJlOTZjZmYKLS0tCgp7e2FjY291bnR9fSBpcyB1cGRhdGVkIHRvIGhhdmUgd2VpZ2h0IHt7d2VpZ2h0fX0uAgAAAAAwtyZFA2k2NAAABmNvbmZpZwAAAAAAfBXWA2k2NAAACHVzZXJfcm93AAAAAAA='
)
export const abi = ABI.from(abiBlob)
export namespace Types {
    @Struct.type('adduser')
    export class adduser extends Struct {
        @Struct.field(Name)
        declare account: Name
        @Struct.field(UInt16)
        declare weight: UInt16
    }
    @Struct.type('claim')
    export class claim extends Struct {
        @Struct.field(Name)
        declare account: Name
        @Struct.field(Asset, {optional: true})
        declare amount?: Asset
    }
    @Struct.type('oracle_pair')
    export class oracle_pair extends Struct {
        @Struct.field(Name)
        declare name: Name
        @Struct.field(UInt16)
        declare precision: UInt16
    }
    @Struct.type('config')
    export class config extends Struct {
        @Struct.field(Asset.Symbol)
        declare token_symbol: Asset.Symbol
        @Struct.field(Name)
        declare oracle_account: Name
        @Struct.field(oracle_pair, {array: true})
        declare oracle_pairs: oracle_pair[]
    }
    @Struct.type('configure')
    export class configure extends Struct {
        @Struct.field(Asset.Symbol)
        declare token_symbol: Asset.Symbol
        @Struct.field(Name)
        declare oracle_account: Name
        @Struct.field(oracle_pair, {array: true})
        declare oracle_pairs: oracle_pair[]
    }
    @Struct.type('deluser')
    export class deluser extends Struct {
        @Struct.field(Name)
        declare account: Name
    }
    @Struct.type('price_info')
    export class price_info extends Struct {
        @Struct.field('string')
        declare pair: string
        @Struct.field(Float64)
        declare price: Float64
        @Struct.field(TimePoint)
        declare timestamp: TimePoint
    }
    @Struct.type('receipt')
    export class receipt extends Struct {
        @Struct.field(Name)
        declare account: Name
        @Struct.field(Asset)
        declare amount: Asset
        @Struct.field(price_info, {array: true})
        declare ticker: price_info[]
    }
    @Struct.type('updateuser')
    export class updateuser extends Struct {
        @Struct.field(Name)
        declare account: Name
        @Struct.field(UInt16)
        declare weight: UInt16
    }
    @Struct.type('user_row')
    export class user_row extends Struct {
        @Struct.field(Name)
        declare account: Name
        @Struct.field(UInt16)
        declare weight: UInt16
        @Struct.field(Asset)
        declare balance: Asset
    }
}
export const TableMap = {
    config: Types.config,
    users: Types.user_row,
}
export interface TableTypes {
    config: Types.config
    users: Types.user_row
}
export type RowType<T> = T extends keyof TableTypes ? TableTypes[T] : any
export type TableNames = keyof TableTypes
export namespace ActionParams {
    export namespace Type {
        export interface oracle_pair {
            name: NameType
            precision: UInt16Type
        }
        export interface price_info {
            pair: string
            price: Float64Type
            timestamp: TimePointType
        }
    }
    export interface adduser {
        account: NameType
        weight: UInt16Type
    }
    export interface claim {
        account: NameType
        amount?: AssetType
    }
    export interface configure {
        token_symbol: Asset.SymbolType
        oracle_account: NameType
        oracle_pairs: Type.oracle_pair[]
    }
    export interface deluser {
        account: NameType
    }
    export interface receipt {
        account: NameType
        amount: AssetType
        ticker: Type.price_info[]
    }
    export interface updateuser {
        account: NameType
        weight: UInt16Type
    }
}
export interface ActionNameParams {
    adduser: ActionParams.adduser
    claim: ActionParams.claim
    configure: ActionParams.configure
    deluser: ActionParams.deluser
    receipt: ActionParams.receipt
    updateuser: ActionParams.updateuser
}
export type ActionNames = keyof ActionNameParams
export class Contract extends BaseContract {
    constructor(args: PartialBy<ContractArgs, 'abi' | 'account'>) {
        super({
            client: args.client,
            abi: abi,
            account: args.account || Name.from('rewards.gm'),
        })
    }
    action<T extends ActionNames>(
        name: T,
        data: ActionNameParams[T],
        options?: ActionOptions
    ): Action {
        return super.action(name, data, options)
    }
    table<T extends TableNames>(name: T, scope?: NameType): Table<RowType<T>> {
        return super.table(name, scope, TableMap[name])
    }
}
