import type {
    Action,
    AssetType,
    BytesType,
    NameType,
    UInt32Type,
    UInt64Type,
} from '@wharfkit/antelope'
import {
    ABI,
    Asset,
    Blob,
    Bytes,
    Name,
    Struct,
    TimePointSec,
    UInt32,
    UInt64,
} from '@wharfkit/antelope'
import type {ActionOptions, ContractArgs, PartialBy, Table} from '@wharfkit/contract'
import {Contract as BaseContract} from '@wharfkit/contract'
export const abiBlob = Blob.from(
    'DmVvc2lvOjphYmkvMS4yAAkHUGF5cm9sbAALAmlkBnVpbnQ2NAV0b3RhbAVhc3NldARwYWlkBWFzc2V0CXN0YXJ0VGltZQ50aW1lX3BvaW50X3NlYwpmaW5pc2hUaW1lDnRpbWVfcG9pbnRfc2VjCmxhc3RQYXlvdXQOdGltZV9wb2ludF9zZWMUbWluQ2xhaW1GcmVxdWVuY3lTZWMGdWludDMyD3JlY2VpdmVyQWNjb3VudARuYW1lD3RyZWFzdXJ5QWNjb3VudARuYW1lBnBhdXNlZARib29sBG1ldGEFYnl0ZXMNUGF5cm9sbENvbmZpZwAIBXRvdGFsBWFzc2V0CXN0YXJ0VGltZQ50aW1lX3BvaW50X3NlYwpmaW5pc2hUaW1lDnRpbWVfcG9pbnRfc2VjFG1pbkNsYWltRnJlcXVlbmN5U2VjBnVpbnQzMg9yZWNlaXZlckFjY291bnQEbmFtZQ90cmVhc3VyeUFjY291bnQEbmFtZQRtZXRhBWJ5dGVzBnBhdXNlZARib29sD1Rva2Vuc1doaXRlbGlzdAACA3N5bQZzeW1ib2wIY29udHJhY3QEbmFtZQtwYXlyb2xsLmFkZAABDXBheXJvbGxDb25maWcNUGF5cm9sbENvbmZpZwxwYXlyb2xsLmVkaXQABglwYXlyb2xsSWQGdWludDY0BXBhdXNlBGJvb2wUbWluQ2xhaW1GcmVxdWVuY3lTZWMGdWludDMyD3JlY2VpdmVyQWNjb3VudARuYW1lD3RyZWFzdXJ5QWNjb3VudARuYW1lBG1ldGEFYnl0ZXMLcGF5cm9sbC5wYXkAAQlwYXlyb2xsSWQGdWludDY0CnBheXJvbGwucm0AAQlwYXlyb2xsSWQGdWludDY0C3Rva2Vud2wuYWRkAAIDc3ltBnN5bWJvbAhjb250cmFjdARuYW1lCnRva2Vud2wucm0AAQNzeW0Lc3ltYm9sX2NvZGUGAFIyIEZ6vakLcGF5cm9sbC5hZGQAkF1SIEZ6vakMcGF5cm9sbC5lZGl0AAC8qSBGer2pC3BheXJvbGwucGF5AACAvCBGer2pCnBheXJvbGwucm0AAFIyIPKpIM0LdG9rZW53bC5hZGQAAIC8IPKpIM0KdG9rZW53bC5ybQACAAAAOEZ6vakDaTY0AAAHUGF5cm9sbAAAACDyqSDNA2k2NAAAD1Rva2Vuc1doaXRlbGlzdAAAAAAA'
)
export const abi = ABI.from(abiBlob)
export namespace Types {
    @Struct.type('Payroll')
    export class Payroll extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(Asset)
        total!: Asset
        @Struct.field(Asset)
        paid!: Asset
        @Struct.field(TimePointSec)
        startTime!: TimePointSec
        @Struct.field(TimePointSec)
        finishTime!: TimePointSec
        @Struct.field(TimePointSec)
        lastPayout!: TimePointSec
        @Struct.field(UInt32)
        minClaimFrequencySec!: UInt32
        @Struct.field(Name)
        receiverAccount!: Name
        @Struct.field(Name)
        treasuryAccount!: Name
        @Struct.field('bool')
        paused!: boolean
        @Struct.field(Bytes)
        meta!: Bytes
    }
    @Struct.type('PayrollConfig')
    export class PayrollConfig extends Struct {
        @Struct.field(Asset)
        total!: Asset
        @Struct.field(TimePointSec)
        startTime!: TimePointSec
        @Struct.field(TimePointSec)
        finishTime!: TimePointSec
        @Struct.field(UInt32)
        minClaimFrequencySec!: UInt32
        @Struct.field(Name)
        receiverAccount!: Name
        @Struct.field(Name)
        treasuryAccount!: Name
        @Struct.field(Bytes)
        meta!: Bytes
        @Struct.field('bool')
        paused!: boolean
    }
    @Struct.type('TokensWhitelist')
    export class TokensWhitelist extends Struct {
        @Struct.field(Asset.Symbol)
        sym!: Asset.Symbol
        @Struct.field(Name)
        contract!: Name
    }
    @Struct.type('payroll.add')
    export class payrolladd extends Struct {
        @Struct.field(PayrollConfig)
        payrollConfig!: PayrollConfig
    }
    @Struct.type('payroll.edit')
    export class payrolledit extends Struct {
        @Struct.field(UInt64)
        payrollId!: UInt64
        @Struct.field('bool')
        pause!: boolean
        @Struct.field(UInt32)
        minClaimFrequencySec!: UInt32
        @Struct.field(Name)
        receiverAccount!: Name
        @Struct.field(Name)
        treasuryAccount!: Name
        @Struct.field(Bytes)
        meta!: Bytes
    }
    @Struct.type('payroll.pay')
    export class payrollpay extends Struct {
        @Struct.field(UInt64)
        payrollId!: UInt64
    }
    @Struct.type('payroll.rm')
    export class payrollrm extends Struct {
        @Struct.field(UInt64)
        payrollId!: UInt64
    }
    @Struct.type('tokenwl.add')
    export class tokenwladd extends Struct {
        @Struct.field(Asset.Symbol)
        sym!: Asset.Symbol
        @Struct.field(Name)
        contract!: Name
    }
    @Struct.type('tokenwl.rm')
    export class tokenwlrm extends Struct {
        @Struct.field(Asset.SymbolCode)
        sym!: Asset.SymbolCode
    }
}
export const TableMap = {
    payrolls: Types.Payroll,
    tokenwl: Types.TokensWhitelist,
}
export interface TableTypes {
    payrolls: Types.Payroll
    tokenwl: Types.TokensWhitelist
}
export type RowType<T> = T extends keyof TableTypes ? TableTypes[T] : any
export type TableNames = keyof TableTypes
export namespace ActionParams {
    export namespace Type {
        export interface PayrollConfig {
            total: AssetType
            startTime: TimePointSec
            finishTime: TimePointSec
            minClaimFrequencySec: UInt32Type
            receiverAccount: NameType
            treasuryAccount: NameType
            meta: BytesType
            paused: boolean
        }
    }
    export interface payrolladd {
        payrollConfig: Type.PayrollConfig
    }
    export interface payrolledit {
        payrollId: UInt64Type
        pause: boolean
        minClaimFrequencySec: UInt32Type
        receiverAccount: NameType
        treasuryAccount: NameType
        meta: BytesType
    }
    export interface payrollpay {
        payrollId: UInt64Type
    }
    export interface payrollrm {
        payrollId: UInt64Type
    }
    export interface tokenwladd {
        sym: Asset.SymbolType
        contract: NameType
    }
    export interface tokenwlrm {
        sym: Asset.SymbolCodeType
    }
}
export interface ActionNameParams {
    'payroll.add': ActionParams.payrolladd
    'payroll.edit': ActionParams.payrolledit
    'payroll.pay': ActionParams.payrollpay
    'payroll.rm': ActionParams.payrollrm
    'tokenwl.add': ActionParams.tokenwladd
    'tokenwl.rm': ActionParams.tokenwlrm
}
export type ActionNames = keyof ActionNameParams
export class Contract extends BaseContract {
    constructor(args: PartialBy<ContractArgs, 'abi' | 'account'>) {
        super({
            client: args.client,
            abi: abi,
            account: args.account || Name.from('payroll.boid'),
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
