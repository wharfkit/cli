import type {Action, Checksum256Type, NameType} from '@wharfkit/antelope'
import {
    ABI,
    Blob,
    Bytes,
    Checksum256,
    Name,
    Struct,
    TimePoint,
    TimePointSec,
    UInt16,
    UInt32,
    UInt8,
    VarUInt,
} from '@wharfkit/antelope'
import type {ActionOptions, ContractArgs, PartialBy, Table} from '@wharfkit/contract'
import {Contract as BaseContract} from '@wharfkit/contract'
export const abiBlob = Blob.from(
    'DmVvc2lvOjphYmkvMS4xABAGYWN0aW9uAAQHYWNjb3VudARuYW1lBG5hbWUEbmFtZQ1hdXRob3JpemF0aW9uEnBlcm1pc3Npb25fbGV2ZWxbXQRkYXRhBWJ5dGVzCGFwcHJvdmFsAAIFbGV2ZWwQcGVybWlzc2lvbl9sZXZlbAR0aW1lCnRpbWVfcG9pbnQOYXBwcm92YWxzX2luZm8ABAd2ZXJzaW9uBXVpbnQ4DXByb3Bvc2FsX25hbWUEbmFtZRNyZXF1ZXN0ZWRfYXBwcm92YWxzCmFwcHJvdmFsW10ScHJvdmlkZWRfYXBwcm92YWxzCmFwcHJvdmFsW10HYXBwcm92ZQAECHByb3Bvc2VyBG5hbWUNcHJvcG9zYWxfbmFtZQRuYW1lBWxldmVsEHBlcm1pc3Npb25fbGV2ZWwNcHJvcG9zYWxfaGFzaAxjaGVja3N1bTI1NiQGY2FuY2VsAAMIcHJvcG9zZXIEbmFtZQ1wcm9wb3NhbF9uYW1lBG5hbWUIY2FuY2VsZXIEbmFtZQRleGVjAAMIcHJvcG9zZXIEbmFtZQ1wcm9wb3NhbF9uYW1lBG5hbWUIZXhlY3V0ZXIEbmFtZQlleHRlbnNpb24AAgR0eXBlBnVpbnQxNgRkYXRhBWJ5dGVzCmludmFsaWRhdGUAAQdhY2NvdW50BG5hbWUMaW52YWxpZGF0aW9uAAIHYWNjb3VudARuYW1lFmxhc3RfaW52YWxpZGF0aW9uX3RpbWUKdGltZV9wb2ludBJvbGRfYXBwcm92YWxzX2luZm8AAw1wcm9wb3NhbF9uYW1lBG5hbWUTcmVxdWVzdGVkX2FwcHJvdmFscxJwZXJtaXNzaW9uX2xldmVsW10ScHJvdmlkZWRfYXBwcm92YWxzEnBlcm1pc3Npb25fbGV2ZWxbXRBwZXJtaXNzaW9uX2xldmVsAAIFYWN0b3IEbmFtZQpwZXJtaXNzaW9uBG5hbWUIcHJvcG9zYWwAAw1wcm9wb3NhbF9uYW1lBG5hbWUScGFja2VkX3RyYW5zYWN0aW9uBWJ5dGVzEmVhcmxpZXN0X2V4ZWNfdGltZQx0aW1lX3BvaW50PyQHcHJvcG9zZQAECHByb3Bvc2VyBG5hbWUNcHJvcG9zYWxfbmFtZQRuYW1lCXJlcXVlc3RlZBJwZXJtaXNzaW9uX2xldmVsW10DdHJ4C3RyYW5zYWN0aW9uC3RyYW5zYWN0aW9uEnRyYW5zYWN0aW9uX2hlYWRlcgMUY29udGV4dF9mcmVlX2FjdGlvbnMIYWN0aW9uW10HYWN0aW9ucwhhY3Rpb25bXRZ0cmFuc2FjdGlvbl9leHRlbnNpb25zC2V4dGVuc2lvbltdEnRyYW5zYWN0aW9uX2hlYWRlcgAGCmV4cGlyYXRpb24OdGltZV9wb2ludF9zZWMNcmVmX2Jsb2NrX251bQZ1aW50MTYQcmVmX2Jsb2NrX3ByZWZpeAZ1aW50MzITbWF4X25ldF91c2FnZV93b3Jkcwl2YXJ1aW50MzIQbWF4X2NwdV91c2FnZV9tcwV1aW50OAlkZWxheV9zZWMJdmFydWludDMyCXVuYXBwcm92ZQADCHByb3Bvc2VyBG5hbWUNcHJvcG9zYWxfbmFtZQRuYW1lBWxldmVsEHBlcm1pc3Npb25fbGV2ZWwGAAAAQG16azUHYXBwcm92ZcQDLS0tCnNwZWNfdmVyc2lvbjogIjAuMi4wIgp0aXRsZTogQXBwcm92ZSBQcm9wb3NlZCBUcmFuc2FjdGlvbgpzdW1tYXJ5OiAne3tub3dyYXAgbGV2ZWwuYWN0b3J9fSBhcHByb3ZlcyB0aGUge3tub3dyYXAgcHJvcG9zYWxfbmFtZX19IHByb3Bvc2FsJwppY29uOiBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vRU9TLU5hdGlvbi9lb3Npby5tc2lnL21hc3Rlci9jb250cmFjdHMvaWNvbnMvbXVsdGlzaWcucG5nIzRmYjQxZDNjZjAyZDBkZDJkMzVhMjkzMDhlOTNjMmQ4MjZlYzc3MGQ2YmI1MjBkYjY2OGY1MzA3NjRiZTcxNTMKLS0tCgp7e2xldmVsLmFjdG9yfX0gYXBwcm92ZXMgdGhlIHt7cHJvcG9zYWxfbmFtZX19IHByb3Bvc2FsIHByb3Bvc2VkIGJ5IHt7cHJvcG9zZXJ9fSB3aXRoIHRoZSB7e2xldmVsLnBlcm1pc3Npb259fSBwZXJtaXNzaW9uIG9mIHt7bGV2ZWwuYWN0b3J9fS4AAAAARIWmQQZjYW5jZWyAAy0tLQpzcGVjX3ZlcnNpb246ICIwLjIuMCIKdGl0bGU6IENhbmNlbCBQcm9wb3NlZCBUcmFuc2FjdGlvbgpzdW1tYXJ5OiAne3tub3dyYXAgY2FuY2VsZXJ9fSBjYW5jZWxzIHRoZSB7e25vd3JhcCBwcm9wb3NhbF9uYW1lfX0gcHJvcG9zYWwnCmljb246IGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9FT1MtTmF0aW9uL2Vvc2lvLm1zaWcvbWFzdGVyL2NvbnRyYWN0cy9pY29ucy9tdWx0aXNpZy5wbmcjNGZiNDFkM2NmMDJkMGRkMmQzNWEyOTMwOGU5M2MyZDgyNmVjNzcwZDZiYjUyMGRiNjY4ZjUzMDc2NGJlNzE1MwotLS0KCnt7Y2FuY2VsZXJ9fSBjYW5jZWxzIHRoZSB7e3Byb3Bvc2FsX25hbWV9fSBwcm9wb3NhbCBzdWJtaXR0ZWQgYnkge3twcm9wb3Nlcn19LgAAAAAAgFRXBGV4ZWPIAy0tLQpzcGVjX3ZlcnNpb246ICIwLjIuMCIKdGl0bGU6IEV4ZWN1dGUgUHJvcG9zZWQgVHJhbnNhY3Rpb24Kc3VtbWFyeTogJ3t7bm93cmFwIGV4ZWN1dGVyfX0gZXhlY3V0ZXMgdGhlIHt7bm93cmFwIHByb3Bvc2FsX25hbWV9fSBwcm9wb3NhbCcKaWNvbjogaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL0VPUy1OYXRpb24vZW9zaW8ubXNpZy9tYXN0ZXIvY29udHJhY3RzL2ljb25zL211bHRpc2lnLnBuZyM0ZmI0MWQzY2YwMmQwZGQyZDM1YTI5MzA4ZTkzYzJkODI2ZWM3NzBkNmJiNTIwZGI2NjhmNTMwNzY0YmU3MTUzCi0tLQoKe3tleGVjdXRlcn19IGV4ZWN1dGVzIHRoZSB7e3Byb3Bvc2FsX25hbWV9fSBwcm9wb3NhbCBzdWJtaXR0ZWQgYnkge3twcm9wb3Nlcn19IGlmIHRoZSBtaW5pbXVtIHJlcXVpcmVkIGFwcHJvdmFscyBmb3IgdGhlIHByb3Bvc2FsIGhhdmUgYmVlbiBzZWN1cmVkLgCAyia5aPZ0CmludmFsaWRhdGX+Ai0tLQpzcGVjX3ZlcnNpb246ICIwLjIuMCIKdGl0bGU6IEludmFsaWRhdGUgQWxsIEFwcHJvdmFscwpzdW1tYXJ5OiAne3tub3dyYXAgYWNjb3VudH19IGludmFsaWRhdGVzIGFwcHJvdmFscyBvbiBvdXRzdGFuZGluZyBwcm9wb3NhbHMnCmljb246IGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9FT1MtTmF0aW9uL2Vvc2lvLm1zaWcvbWFzdGVyL2NvbnRyYWN0cy9pY29ucy9tdWx0aXNpZy5wbmcjNGZiNDFkM2NmMDJkMGRkMmQzNWEyOTMwOGU5M2MyZDgyNmVjNzcwZDZiYjUyMGRiNjY4ZjUzMDc2NGJlNzE1MwotLS0KCnt7YWNjb3VudH19IGludmFsaWRhdGVzIGFsbCBhcHByb3ZhbHMgb24gcHJvcG9zYWxzIHdoaWNoIGhhdmUgbm90IHlldCBleGVjdXRlZC4AAABAYVrprQdwcm9wb3NlqgUtLS0Kc3BlY192ZXJzaW9uOiAiMC4yLjAiCnRpdGxlOiBQcm9wb3NlIFRyYW5zYWN0aW9uCnN1bW1hcnk6ICd7e25vd3JhcCBwcm9wb3Nlcn19IGNyZWF0ZXMgdGhlIHt7bm93cmFwIHByb3Bvc2FsX25hbWV9fScKaWNvbjogaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL0VPUy1OYXRpb24vZW9zaW8ubXNpZy9tYXN0ZXIvY29udHJhY3RzL2ljb25zL211bHRpc2lnLnBuZyM0ZmI0MWQzY2YwMmQwZGQyZDM1YTI5MzA4ZTkzYzJkODI2ZWM3NzBkNmJiNTIwZGI2NjhmNTMwNzY0YmU3MTUzCi0tLQoKe3twcm9wb3Nlcn19IGNyZWF0ZXMgdGhlIHt7cHJvcG9zYWxfbmFtZX19IHByb3Bvc2FsIGZvciB0aGUgZm9sbG93aW5nIHRyYW5zYWN0aW9uOgp7e3RvX2pzb24gdHJ4fX0KClRoZSBwcm9wb3NhbCByZXF1ZXN0cyBhcHByb3ZhbHMgZnJvbSB0aGUgZm9sbG93aW5nIGFjY291bnRzIGF0IHRoZSBzcGVjaWZpZWQgcGVybWlzc2lvbiBsZXZlbHM6Cnt7I2VhY2ggcmVxdWVzdGVkfX0KICAgKyB7e3RoaXMucGVybWlzc2lvbn19IHBlcm1pc3Npb24gb2Yge3t0aGlzLmFjdG9yfX0Ke3svZWFjaH19CgpJZiB0aGUgcHJvcG9zZWQgdHJhbnNhY3Rpb24gaXMgbm90IGV4ZWN1dGVkIHByaW9yIHRvIHt7dHJ4LmV4cGlyYXRpb259fSwgdGhlIHByb3Bvc2FsIHdpbGwgYXV0b21hdGljYWxseSBleHBpcmUuAABQm95azdQJdW5hcHByb3Zl/QMtLS0Kc3BlY192ZXJzaW9uOiAiMC4yLjAiCnRpdGxlOiBVbmFwcHJvdmUgUHJvcG9zZWQgVHJhbnNhY3Rpb24Kc3VtbWFyeTogJ3t7bm93cmFwIGxldmVsLmFjdG9yfX0gcmV2b2tlcyB0aGUgYXBwcm92YWwgcHJldmlvdXNseSBwcm92aWRlZCB0byB7e25vd3JhcCBwcm9wb3NhbF9uYW1lfX0gcHJvcG9zYWwnCmljb246IGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9FT1MtTmF0aW9uL2Vvc2lvLm1zaWcvbWFzdGVyL2NvbnRyYWN0cy9pY29ucy9tdWx0aXNpZy5wbmcjNGZiNDFkM2NmMDJkMGRkMmQzNWEyOTMwOGU5M2MyZDgyNmVjNzcwZDZiYjUyMGRiNjY4ZjUzMDc2NGJlNzE1MwotLS0KCnt7bGV2ZWwuYWN0b3J9fSByZXZva2VzIHRoZSBhcHByb3ZhbCBwcmV2aW91c2x5IHByb3ZpZGVkIGF0IHRoZWlyIHt7bGV2ZWwucGVybWlzc2lvbn19IHBlcm1pc3Npb24gbGV2ZWwgZnJvbSB0aGUge3twcm9wb3NhbF9uYW1lfX0gcHJvcG9zYWwgcHJvcG9zZWQgYnkge3twcm9wb3Nlcn19LgQAAMDRbHprNQNpNjQAABJvbGRfYXBwcm92YWxzX2luZm8AgMDRbHprNQNpNjQAAA5hcHByb3ZhbHNfaW5mbwAAAADgaPZ0A2k2NAAADGludmFsaWRhdGlvbgAAANFgWumtA2k2NAAACHByb3Bvc2FsAAAAAAA='
)
export const abi = ABI.from(abiBlob)
export class Contract extends BaseContract {
    constructor(args: PartialBy<ContractArgs, 'abi' | 'account'>) {
        super({
            client: args.client,
            abi: abi,
            account: Name.from('eosio.msig'),
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
export interface ActionNameParams {
    approve: ActionParams.Approve
    cancel: ActionParams.Cancel
    exec: ActionParams.Exec
    invalidate: ActionParams.Invalidate
    propose: ActionParams.Propose
    unapprove: ActionParams.Unapprove
}
export namespace ActionParams {
    export interface Approve {
        proposer: NameType
        proposal_name: NameType
        level: Types.permission_level
        proposal_hash?: Checksum256Type
    }
    export interface Cancel {
        proposer: NameType
        proposal_name: NameType
        canceler: NameType
    }
    export interface Exec {
        proposer: NameType
        proposal_name: NameType
        executer: NameType
    }
    export interface Invalidate {
        account: NameType
    }
    export interface Propose {
        proposer: NameType
        proposal_name: NameType
        requested: Types.permission_level[]
        trx: Types.transaction
    }
    export interface Unapprove {
        proposer: NameType
        proposal_name: NameType
        level: Types.permission_level
    }
}
export namespace Types {
    @Struct.type('permission_level')
    export class permission_level extends Struct {
        @Struct.field(Name)
        Actor!: Name
        @Struct.field(Name)
        Permission!: Name
    }
    @Struct.type('action')
    export class action extends Struct {
        @Struct.field(Name)
        Account!: Name
        @Struct.field(Name)
        Name!: Name
        @Struct.field(permission_level, {array: true})
        Authorization!: permission_level[]
        @Struct.field(Bytes)
        Data!: Bytes
    }
    @Struct.type('approval')
    export class approval extends Struct {
        @Struct.field(permission_level)
        Level!: permission_level
        @Struct.field(TimePoint)
        Time!: TimePoint
    }
    @Struct.type('approvals_info')
    export class approvals_info extends Struct {
        @Struct.field(UInt8)
        Version!: UInt8
        @Struct.field(Name)
        Proposal_name!: Name
        @Struct.field(approval, {array: true})
        Requested_approvals!: approval[]
        @Struct.field(approval, {array: true})
        Provided_approvals!: approval[]
    }
    @Struct.type('approve')
    export class approve extends Struct {
        @Struct.field(Name)
        Proposer!: Name
        @Struct.field(Name)
        Proposal_name!: Name
        @Struct.field(permission_level)
        Level!: permission_level
        @Struct.field(Checksum256, {optional: true})
        Proposal_hash?: Checksum256
    }
    @Struct.type('cancel')
    export class cancel extends Struct {
        @Struct.field(Name)
        Proposer!: Name
        @Struct.field(Name)
        Proposal_name!: Name
        @Struct.field(Name)
        Canceler!: Name
    }
    @Struct.type('exec')
    export class exec extends Struct {
        @Struct.field(Name)
        Proposer!: Name
        @Struct.field(Name)
        Proposal_name!: Name
        @Struct.field(Name)
        Executer!: Name
    }
    @Struct.type('extension')
    export class extension extends Struct {
        @Struct.field(UInt16)
        Type!: UInt16
        @Struct.field(Bytes)
        Data!: Bytes
    }
    @Struct.type('invalidate')
    export class invalidate extends Struct {
        @Struct.field(Name)
        Account!: Name
    }
    @Struct.type('invalidation')
    export class invalidation extends Struct {
        @Struct.field(Name)
        Account!: Name
        @Struct.field(TimePoint)
        Last_invalidation_time!: TimePoint
    }
    @Struct.type('old_approvals_info')
    export class old_approvals_info extends Struct {
        @Struct.field(Name)
        Proposal_name!: Name
        @Struct.field(permission_level, {array: true})
        Requested_approvals!: permission_level[]
        @Struct.field(permission_level, {array: true})
        Provided_approvals!: permission_level[]
    }
    @Struct.type('proposal')
    export class proposal extends Struct {
        @Struct.field(Name)
        Proposal_name!: Name
        @Struct.field(Bytes)
        Packed_transaction!: Bytes
        @Struct.field(TimePoint, {optional: true})
        Earliest_exec_time?: TimePoint
    }
    @Struct.type('transaction')
    export class transaction extends Struct {
        @Struct.field(action, {array: true})
        Context_free_actions!: action[]
        @Struct.field(action, {array: true})
        Actions!: action[]
        @Struct.field(extension, {array: true})
        Transaction_extensions!: extension[]
    }
    @Struct.type('propose')
    export class propose extends Struct {
        @Struct.field(Name)
        Proposer!: Name
        @Struct.field(Name)
        Proposal_name!: Name
        @Struct.field(permission_level, {array: true})
        Requested!: permission_level[]
        @Struct.field(transaction)
        Trx!: transaction
    }
    @Struct.type('transaction_header')
    export class transaction_header extends Struct {
        @Struct.field(TimePointSec)
        Expiration!: TimePointSec
        @Struct.field(UInt16)
        Ref_block_num!: UInt16
        @Struct.field(UInt32)
        Ref_block_prefix!: UInt32
        @Struct.field(VarUInt)
        Max_net_usage_words!: VarUInt
        @Struct.field(UInt8)
        Max_cpu_usage_ms!: UInt8
        @Struct.field(VarUInt)
        Delay_sec!: VarUInt
    }
    @Struct.type('unapprove')
    export class unapprove extends Struct {
        @Struct.field(Name)
        Proposer!: Name
        @Struct.field(Name)
        Proposal_name!: Name
        @Struct.field(permission_level)
        Level!: permission_level
    }
}
export const TableMap = {
    approvals: Types.old_approvals_info,
    approvals2: Types.approvals_info,
    invals: Types.invalidation,
    proposal: Types.proposal,
}
export interface TableTypes {
    approvals: Types.old_approvals_info
    approvals2: Types.approvals_info
    invals: Types.invalidation
    proposal: Types.proposal
}
export type RowType<T> = T extends keyof TableTypes ? TableTypes[T] : any
export type ActionNames = keyof ActionNameParams
export type TableNames = keyof TableTypes
