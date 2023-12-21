import type {
    Action,
    AssetType,
    Float64Type,
    Int8Type,
    NameType,
    TimePointType,
    UInt32Type,
    UInt64Type,
    UInt8Type,
} from '@wharfkit/antelope'
import {
    ABI,
    Asset,
    Blob,
    Checksum256,
    Float64,
    Int8,
    Name,
    Struct,
    TimePoint,
    UInt32,
    UInt64,
    UInt8,
} from '@wharfkit/antelope'
import type {ActionOptions, ContractArgs, PartialBy, Table} from '@wharfkit/contract'
import {Contract as BaseContract} from '@wharfkit/contract'
export const abiBlob = Blob.from(
    'DmVvc2lvOjphYmkvMS4yCQhBY3Rpdml0eQV1aW50OBZCX3BhaXJfdWludDMyX3VpbnQ2NF9FEnBhaXJfdWludDMyX3VpbnQ2NBhCX3BhaXJfdWludDY0X0NyZXdSb2xlX0UUcGFpcl91aW50NjRfQ3Jld1JvbGUIQ29vbGRvd24FdWludDgIQ3Jld1JvbGUFdWludDgKRW50aXR5VHlwZQV1aW50OBFFcXVpcGFibGVJdGVtVHlwZQV1aW50OAdSTkdUeXBlBXVpbnQ4BFJvbGUFdWludDh1C2FkZGJ1aWxkaW5nAAMMZ2FtZWFzc2V0X2lkBnVpbnQ2NAd0aWxlX2lkBnVpbnQ2NAVvd25lcgRuYW1lCmFkZGRlcG9zaXQAAhByZXNvdXJjZV90eXBlX2lkBnVpbnQ2NBBsb2NhdGlvbl90aWxlX2lkBnVpbnQ2NAphZGRmYWN0aW9uAAQCaWQGdWludDY0BG5hbWUGc3RyaW5nBGNvZGUEbmFtZQ5mbGFnX2Fzc2V0X3VybAZzdHJpbmcMYWRkaW52ZW50b3J5AAIGcGxheWVyBG5hbWULaW5ncmVkaWVudHMYQl9wYWlyX3VpbnQzMl91aW50NjRfRVtdBmFkZG1hcAAHCGFyZWFfbWFwBG5hbWUEbmFtZQZzdHJpbmcEY29kZQRuYW1lCWFzc2V0X3VybAZzdHJpbmcHcl9jb2xvcgV1aW50OAdnX2NvbG9yBXVpbnQ4B2JfY29sb3IFdWludDgJYWRkcGxhbmV0AAoCaWQGdWludDY0CGFyZWFfbWFwBG5hbWUHcV9jb29yZARpbnQ4B3JfY29vcmQEaW50OARuYW1lBnN0cmluZwRjb2RlBG5hbWUJYXNzZXRfdXJsBnN0cmluZwdyX2NvbG9yBXVpbnQ4B2dfY29sb3IFdWludDgHYl9jb2xvcgV1aW50OAlhZGRyZWdpb24ABAJpZAZ1aW50NjQIYXJlYV9tYXAEbmFtZQRuYW1lBnN0cmluZwRjb2RlBG5hbWULYWRkcmVzb3VyY2UABQJpZAZ1aW50NjQMZ2FtZWFzc2V0X2lkBnVpbnQ2NARuYW1lBnN0cmluZwlhc3NldF91cmwGc3RyaW5nCmRpZmZpY3VsdHkGdWludDMyCmFkZHRlcnJhaW4ABgJpZAZ1aW50NjQEdHlwZQZzdHJpbmcObWFwX2Fzc2V0X3VybHMIc3RyaW5nW10UYmFja2dyb3VuZF9hc3NldF91cmwGc3RyaW5nDmJ1aWxkaW5nX3Nsb3RzBXVpbnQ4B2VmZmVjdHMIdWludDY0W10HYWRkdGlsZQAGAmlkBnVpbnQ2NAhhcmVhX21hcARuYW1lCXJlZ2lvbl9pZAZ1aW50NjQHcV9jb29yZARpbnQ4B3JfY29vcmQEaW50OAx0ZXJyYWluX3R5cGUGdWludDY0B2FkZHVuaXQAAgx1bml0X3R5cGVfaWQGdWludDY0BW93bmVyBG5hbWUKYWRkdmVoaWNsZQADDGdhbWVhc3NldF9pZAZ1aW50NjQHdGlsZV9pZAZ1aW50NjQFb3duZXIEbmFtZQZiYXR0bGUABgJpZAZ1aW50NjQQbG9jYXRpb25fdGlsZV9pZAZ1aW50NjQUYXR0YWNraW5nX2ZhY3Rpb25faWQGdWludDY0FGRlZmVuZGluZ19mYWN0aW9uX2lkBnVpbnQ2NAxiYXR0bGVfc3RhcnQKdGltZV9wb2ludAxiYXR0bGVfcm91bmQGdWludDMyCmJhdHRsZXVuaXQACgJpZAZ1aW50NjQFb3duZXIEbmFtZQliYXR0bGVfaWQGdWludDY0C2V4dGVybmFsX2lkBnVpbnQ2NApmYWN0aW9uX2lkBnVpbnQ2NAJocAZ1aW50MzIGbWF4X2hwBnVpbnQzMgxpc19jaGFyYWN0ZXIEYm9vbAtpc19nYXJyaXNvbgRib29sD3JldHJlYXRfdG9fdGlsZQZ1aW50NjQIYnVpbGRpbmcACgJpZAZ1aW50NjQMZ2FtZWFzc2V0X2lkBnVpbnQ2NAVvd25lcgRuYW1lEGlzX293bmVyX2ZhY3Rpb24EYm9vbAhkaXNhYmxlZARib29sAmhwBnVpbnQzMgZtYXhfaHAGdWludDMyEGxvY2F0aW9uX3RpbGVfaWQGdWludDY0C25leHRfdXBrZWVwCnRpbWVfcG9pbnQJaW52ZW50b3J5GEJfcGFpcl91aW50MzJfdWludDY0X0VbXQpjYWxjZW5lcmd5AAEMY2hhcmFjdGVyX2lkBnVpbnQ2NAljaGFyYWN0ZXIAGQJpZAZ1aW50NjQKZmlyc3RfbmFtZQZzdHJpbmcLbWlkZGxlX25hbWUGc3RyaW5nCWxhc3RfbmFtZQZzdHJpbmcJYXNzZXRfdXJsBnN0cmluZwZlbmVyZ3kHZmxvYXQ2NAptYXhfZW5lcmd5B2Zsb2F0NjQFb3duZXIEbmFtZRBsYXN0X2FjdGlvbl90aW1lCnRpbWVfcG9pbnQNdGltZV9sYXN0X2ZlZAp0aW1lX3BvaW50DXRvb2xfZXF1aXBwZWQGdWludDY0DmFybW9yX2VxdWlwcGVkBnVpbnQ2NBVtZWxlZV93ZWFwb25fZXF1aXBwZWQGdWludDY0FnJhbmdlZF93ZWFwb25fZXF1aXBwZWQGdWludDY0EG9uX2JvYXJkX3ZlaGljbGUGdWludDY0DmFjdGl2ZV9lZmZlY3RzCHVpbnQ2NFtdE2Jhc2VfY2hhcmFjdGVyX3JvbGUEUm9sZRJtaWRfY2hhcmFjdGVyX3JvbGUEUm9sZQ5jaGFyYWN0ZXJfcm9sZQRSb2xlEGV4cGVyaWVuY2VfbGV2ZWwGdWludDMyEWV4cGVyaWVuY2VfcG9pbnRzBnVpbnQzMgJocAZ1aW50MzIGbWF4X2hwBnVpbnQzMgVhbGl2ZQRib29sFnRlbXBvcmFsX2RlamFfdnVfc2NvcmUFdWludDgFY2xlYXIAAAljbGVhcnByaW0AAgp0YWJsZV9uYW1lBG5hbWUFc2NvcGUEbmFtZQljbGVhcnNlYzEAAwp0YWJsZV9uYW1lBG5hbWUJaW5kZXhfbnVtBXVpbnQ4BXNjb3BlBG5hbWUJY2xlYXJzZWMyAAMKdGFibGVfbmFtZQRuYW1lCWluZGV4X251bQV1aW50OAVzY29wZQRuYW1lCWNvbWJhdGFudAAECXBsYXllcl9pZAZ1aW50NjQJYmF0dGxlX2lkBnVpbnQ2NApmYWN0aW9uX2lkBnVpbnQ2NA9yZXRyZWF0X3RvX3RpbGUGdWludDY0CGNvb2xkb3duAAMNY29vbGRvd25fdHlwZQhDb29sZG93bgx0aW1lX3N0YXJ0ZWQKdGltZV9wb2ludBFjb29sZG93bl9kdXJhdGlvbgZ1aW50MzIKY3JlYXRlY2hhcgABBnBsYXllcgRuYW1lBGNyZXcAAwxjaGFyYWN0ZXJfaWQGdWludDY0DHNwYWNlc2hpcF9pZAZ1aW50NjQEcm9sZQhDcmV3Um9sZQNkYXkABAlkYXlfc3RhcnQKdGltZV9wb2ludAdkYXlfZW5kCnRpbWVfcG9pbnQUdG90YWxfYWN0aXZlX3BsYXllcnMGdWludDMyDGVuZXJneV9zcGVudAdmbG9hdDY0B2RlcG9zaXQAAwJpZAZ1aW50NjQQcmVzb3VyY2VfdHlwZV9pZAZ1aW50NjQQbG9jYXRpb25fdGlsZV9pZAZ1aW50NjQKZGV0b2tlbml6ZQACBnBsYXllcgRuYW1lCHJlc291cmNlBWFzc2V0C2Rpc2NhcmRjaGFyAAEMY2hhcmFjdGVyX2lkBnVpbnQ2NAlkb2FkZG1hdHMAAwxjaGFyYWN0ZXJfaWQGdWludDY0CnByb2plY3RfaWQGdWludDY0CW1hdGVyaWFscxJwYWlyX3VpbnQzMl91aW50NjQJZG9hZGRwcm9qAAIMY2hhcmFjdGVyX2lkBnVpbnQ2NAxibHVlcHJpbnRfaWQGdWludDY0B2RvYnVpbGQAAgxjaGFyYWN0ZXJfaWQGdWludDY0CnByb2plY3RfaWQGdWludDY0DGRvY2FuY2VscHJvagACDGNoYXJhY3Rlcl9pZAZ1aW50NjQKcHJvamVjdF9pZAZ1aW50NjQIZG9jb21iYXQAAgZwbGF5ZXIEbmFtZQpmYWN0aW9uX2lkBnVpbnQ2NAlkb2NvbnF1ZXIAAgZwbGF5ZXIEbmFtZQ50YXJnZXRfdGlsZV9pZAZ1aW50NjQJZG9jb250cm9sAAEMY2hhcmFjdGVyX2lkBnVpbnQ2NAdkb2NyYWZ0AAIMY2hhcmFjdGVyX2lkBnVpbnQ2NAlyZWNpcGVfaWQGdWludDY0DGRvY3JlYXRlc2hpcAACDGNoYXJhY3Rlcl9pZAZ1aW50NjQLc2hpcG1vZHVsZXMIdWludDY0W10MZG9kZW1vYmlsaXplAAIGcGxheWVyBG5hbWUFdW5pdHMIdWludDY0W10JZG9kZXZlbG9wAAEMY2hhcmFjdGVyX2lkBnVpbnQ2NAlkb2Rpc2JhbmQAAgZwbGF5ZXIEbmFtZQd1bml0X2lkBnVpbnQ2NAtkb2Rpc2VtYmFyawABDGNoYXJhY3Rlcl9pZAZ1aW50NjQJZG9kcm9wb2ZmAAIGcGxheWVyBG5hbWUFaXRlbXMScGFpcl91aW50MzJfdWludDY0BWRvZWF0AAEMY2hhcmFjdGVyX2lkBnVpbnQ2NAhkb2VtYmFyawACDGNoYXJhY3Rlcl9pZAZ1aW50NjQKdmVoaWNsZV9pZAZ1aW50NjQLZG9lbnRlcnNoaXAAAgZwbGF5ZXIEbmFtZQxzcGFjZXNoaXBfaWQGdWludDY0B2RvZXF1aXAAAgxjaGFyYWN0ZXJfaWQGdWludDY0DGdhbWVhc3NldF9pZAZ1aW50NjQGZG9naXZlAAMFb3duZXIEbmFtZQlyZWNpcGllbnQEbmFtZQVpdGVtcxhCX3BhaXJfdWludDMyX3VpbnQ2NF9FW10GZG9oZWFsAAMMY2hhcmFjdGVyX2lkBnVpbnQ2NApwYXRpZW50X2lkBnVpbnQ2NAxpc19jaGFyYWN0ZXIEYm9vbAxkb2pvaW5iYXR0bGUAAgZwbGF5ZXIEbmFtZQliYXR0bGVfaWQGdWludDY0BmRvbGFuZAACDHNwYWNlc2hpcF9pZAZ1aW50NjQHdGlsZV9pZAZ1aW50NjQIZG9sYXVuY2gAAQxzcGFjZXNoaXBfaWQGdWludDY0C2RvbGVhdmVzaGlwAAEGcGxheWVyBG5hbWUGZG9sb2FkAAMGcGxheWVyBG5hbWUKdmVoaWNsZV9pZAZ1aW50NjQFaXRlbXMScGFpcl91aW50MzJfdWludDY0CmRvbW9iaWxpemUAAgZwbGF5ZXIEbmFtZQV1bml0cwh1aW50NjRbXQZkb21vdmUAAgZwbGF5ZXIEbmFtZRNkZXN0aW5hdGlvbl90aWxlX2lkBnVpbnQ2NApkb21vdmVzaGlwAAIMc3BhY2VzaGlwX2lkBnVpbnQ2NAd0aWxlX2lkBnVpbnQ2NAtkb3BheXVwa2VlcAADDGNoYXJhY3Rlcl9pZAZ1aW50NjQEdHlwZQpFbnRpdHlUeXBlBmVudGl0eQZ1aW50NjQIZG9waWNrdXAAAgZwbGF5ZXIEbmFtZQVpdGVtcxJwYWlyX3VpbnQzMl91aW50NjQIZG9yZXBhaXIAAwxjaGFyYWN0ZXJfaWQGdWludDY0CWVudGl0eV9pZAZ1aW50NjQEdHlwZQpFbnRpdHlUeXBlCmRvcmVzZWFyY2gAAgxjaGFyYWN0ZXJfaWQGdWludDY0DXRlY2hub2xvZ3lfaWQGdWludDY0CWRvcmV0cmVhdAACBnBsYXllcgRuYW1lE2Rlc3RpbmF0aW9uX3RpbGVfaWQGdWludDY0B2RvdHJhaW4AAwxjaGFyYWN0ZXJfaWQGdWludDY0CXJlY2lwZV9pZAZ1aW50NjQIbW9iaWxpemUEYm9vbApkb3RyYW5zZmVyAAMJZW50aXR5X2lkBnVpbnQ2NAR0eXBlCkVudGl0eVR5cGUJbmV3X293bmVyBG5hbWUJZG91bmVxdWlwAAIMY2hhcmFjdGVyX2lkBnVpbnQ2NAlpdGVtX3R5cGURRXF1aXBhYmxlSXRlbVR5cGUIZG91bmxvYWQAAwZwbGF5ZXIEbmFtZQp2ZWhpY2xlX2lkBnVpbnQ2NAVpdGVtcxJwYWlyX3VpbnQzMl91aW50NjQGZG93b3JrAAIMY2hhcmFjdGVyX2lkBnVpbnQ2NAhhY3Rpdml0eQhBY3Rpdml0eQtlbGVjdHJlc3VsdAADCmZhY3Rpb25faWQGdWludDY0BmxlYWRlcgZ1aW50NjQIb2ZmaWNlcnMIdWludDY0W10GZW5kZGF5AAAIZW5kZXBvY2gAAAdmYWN0aW9uABkCaWQGdWludDY0BG5hbWUGc3RyaW5nBGNvZGUEbmFtZQ5mbGFnX2Fzc2V0X3VybAZzdHJpbmcJYWN0aXZhdGVkBGJvb2wGbGVhZGVyBnVpbnQ2NAhvZmZpY2Vycwh1aW50NjRbXQ10b3RhbF9wbGF5ZXJzBnVpbnQzMhFtaW5pbmdfY2hhcmFjdGVycwh1aW50NjRbXRZlbmdpbmVlcmluZ19jaGFyYWN0ZXJzCHVpbnQ2NFtdEmZhcm1pbmdfY2hhcmFjdGVycwh1aW50NjRbXRRsb2dpc3RpY3NfY2hhcmFjdGVycwh1aW50NjRbXRZoZWFsdGhfY2FyZV9jaGFyYWN0ZXJzCHVpbnQ2NFtdE2NvbW1lcmNlX2NoYXJhY3RlcnMIdWludDY0W10YY2l2aWxfc2VydmljZV9jaGFyYWN0ZXJzCHVpbnQ2NFtdF2ludGVsbGlnZW5jZV9jaGFyYWN0ZXJzCHVpbnQ2NFtdE21pbGl0YXJ5X2NoYXJhY3RlcnMIdWludDY0W10TcmVzZWFyY2hfY2hhcmFjdGVycwh1aW50NjRbXRFlbmVyZ3lfY2hhcmFjdGVycwh1aW50NjRbXRlpbmZyYXN0cnVjdHVyZV9jaGFyYWN0ZXJzCHVpbnQ2NFtdFW9wZXJhdGlvbnNfY2hhcmFjdGVycwh1aW50NjRbXRVnb3Zlcm5hbmNlX2NoYXJhY3RlcnMIdWludDY0W10UZGlwbG9tYWN5X2NoYXJhY3RlcnMIdWludDY0W10JZGF5X3N0YXRzA2RheQ5hY3RpdmVfZWZmZWN0cwh1aW50NjRbXQZnbG9iYWwAEwtnYW1lX21hc3RlcgRuYW1lDGdhbWVfc3RhcnRlZAp0aW1lX3BvaW50CGdhbWVfZW5kCnRpbWVfcG9pbnQNY3VycmVudF9lcG9jaAV1aW50OA5jdXJyZW50X3BlcmlvZAV1aW50OA1jdXJyZW50X2N5Y2xlBXVpbnQ4C2N1cnJlbnRfZGF5BXVpbnQ4CnRvdGFsX2RheXMGdWludDMyDHRvdGFsX2VuZXJneQdmbG9hdDY0DXRvdGFsX3BsYXllcnMGdWludDMyEHRvdGFsX2NoYXJhY3RlcnMGdWludDMyFWxhc3Rfb3JhY2xlX3RpbWVzdGFtcAp0aW1lX3BvaW50EGxhc3Rfb3JhY2xlX2hhc2gLY2hlY2tzdW0yNTYJZGF5X3N0YXRzA2RheQ1pbmRfZGF5X3N0YXRzA2RheR9wbGF5ZXJzX2luZmxhdGlvbl9idWNrZXRfYWN0aXZlBGJvb2wgZmFjdGlvbnNfaW5mbGF0aW9uX2J1Y2tldF9hY3RpdmUEYm9vbB9yZWdpb25zX2luZmxhdGlvbl9idWNrZXRfYWN0aXZlBGJvb2wfcGxhbmV0c19pbmZsYXRpb25fYnVja2V0X2FjdGl2ZQRib29sC2dyYW50c3BvaWxzAAMLYmVuZWZpY2lhcnkEbmFtZQllbnRpdHlfaWQGdWludDY0C2VudGl0eV90eXBlCkVudGl0eVR5cGUGaGFzaGVzAAYCaWQGdWludDY0BW93bmVyBG5hbWUKbXVsdGlwYXJ0eQtjaGVja3N1bTI1NgRoYXNoC2NoZWNrc3VtMjU2BnJldmVhbAZzdHJpbmcJdGltZXN0YW1wCnRpbWVfcG9pbnQEaW5pdAABBWVwb2NoBXVpbnQ4C2pvaW5mYWN0aW9uAAIGcGxheWVyBG5hbWUKZmFjdGlvbl9pZAZ1aW50NjQIa2lsbGNoYXIAAQxjaGFyYWN0ZXJfaWQGdWludDY0A21hcAAICGFyZWFfbWFwBG5hbWUEbmFtZQZzdHJpbmcEY29kZQRuYW1lCWFzc2V0X3VybAZzdHJpbmcJZGF5X3N0YXRzA2RheQdyX2NvbG9yBXVpbnQ4B2dfY29sb3IFdWludDgHYl9jb2xvcgV1aW50OAttc2lnc3VjY2VzcwABCHNxdWFkX2lkBnVpbnQ2NBJwYWlyX3VpbnQzMl91aW50NjQAAgVmaXJzdAZ1aW50MzIGc2Vjb25kBnVpbnQ2NBRwYWlyX3VpbnQ2NF9DcmV3Um9sZQACBWZpcnN0BnVpbnQ2NAZzZWNvbmQIQ3Jld1JvbGUJcGFzc2VuZ2VyAAIGcGxheWVyBG5hbWUMc3BhY2VzaGlwX2lkBnVpbnQ2NAZwbGFuZXQADAJpZAZ1aW50NjQEbmFtZQZzdHJpbmcEY29kZQRuYW1lB3FfY29vcmQEaW50OAdyX2Nvb3JkBGludDgJYXNzZXRfdXJsBnN0cmluZwhhcmVhX21hcARuYW1lCWRheV9zdGF0cwNkYXkPY29udHJvbF9mYWN0aW9uBnVpbnQ2NAdyX2NvbG9yBXVpbnQ4B2dfY29sb3IFdWludDgHYl9jb2xvcgV1aW50OAZwbGF5ZXIAEgJpZAZ1aW50NjQFb3duZXIEbmFtZQlhc3NldF91cmwGc3RyaW5nD2NoYXJhY3Rlcl9zbG90cwV1aW50OBByZXB1dGF0aW9uX2xldmVsBXVpbnQ4EGV4cGVyaWVuY2VfbGV2ZWwGdWludDMyEWV4cGVyaWVuY2VfcG9pbnRzBnVpbnQzMgljb29sZG93bnMKY29vbGRvd25bXQ5hY3RpdmVfcHJvamVjdAZ1aW50NjQHZmFjdGlvbgZ1aW50NjQZYmFzZV9mYWN0aW9uX3ZvdGluZ19wb3dlcgdmbG9hdDY0Em1heF9pbnZlbnRvcnlfc2l6ZQZ1aW50MzIJaW52ZW50b3J5GEJfcGFpcl91aW50MzJfdWludDY0X0VbXQhjdXJyZW5jeQVhc3NldAxsYXN0X3Jlc3Bhd24KdGltZV9wb2ludBBsb2NhdGlvbl90aWxlX2lkBnVpbnQ2NBVvcHRlZF9vdXRfb2ZfcG9saXRpY3MEYm9vbA9tb2JpbGl6ZWRfdW5pdHMGdWludDMyCnByaW1hcnlrZXkAAgV0YWJsZQRuYW1lCG5leHRfa2V5BnVpbnQ2NARwcm9jAAEFY291bnQGdWludDMyB3Byb2plY3QACQJpZAZ1aW50NjQMYmx1ZXByaW50X2lkBnVpbnQ2NBBsb2NhdGlvbl90aWxlX2lkBnVpbnQ2NBBsYXN0X2FjdGlvbl90aW1lCnRpbWVfcG9pbnQJbWF0ZXJpYWxzGEJfcGFpcl91aW50MzJfdWludDY0X0VbXQR3b3JrBnVpbnQzMgVvd25lcgRuYW1lEGlzX293bmVyX2ZhY3Rpb24EYm9vbAtpc19idWlsZGluZwRib29sBnJlZ2lvbgAGAmlkBnVpbnQ2NAhhcmVhX21hcARuYW1lBG5hbWUGc3RyaW5nBGNvZGUEbmFtZQlkYXlfc3RhdHMDZGF5D2NvbnRyb2xfZmFjdGlvbgZ1aW50NjQJcmVncGxheWVyAAIGcGxheWVyBG5hbWUTb3B0X291dF9vZl9wb2xpdGljcwRib29sC3Jlc29sdmVybmdzAAEFY291bnQGdWludDMyCHJlc291cmNlAAUCaWQGdWludDY0DGdhbWVhc3NldF9pZAZ1aW50NjQEbmFtZQZzdHJpbmcKZGlmZmljdWx0eQZ1aW50MzIJYXNzZXRfdXJsBnN0cmluZwlyZXN0b3JlaHAAAQxjaGFyYWN0ZXJfaWQGdWludDY0CnJldml2ZWNoYXIAAgxjaGFyYWN0ZXJfaWQGdWludDY0BXBheWVyBG5hbWUKcm5ncmVxdWVzdAAHAmlkBnVpbnQ2NAdjcmVhdGVkCnRpbWVfcG9pbnQJZXhlY3V0aW9uCnRpbWVfcG9pbnQLZXh0ZXJuYWxfaWQGdWludDY0EGlzX2NoYXJhY3Rlcl9ybmcEYm9vbAhybmdfdHlwZQdSTkdUeXBlBnJlc3VsdAtjaGVja3N1bTI1NgVycHJvZwAFAmlkBnVpbnQ2NA10ZWNobm9sb2d5X2lkBnVpbnQ2NApmYWN0aW9uX2lkBnVpbnQ2NAd0cmVlX2lkBnVpbnQ2NA9yZXNlYXJjaF9wb2ludHMHZmxvYXQ2NAxzZXRjaGFyYWN0ZXIAAQFjCWNoYXJhY3RlcgdzZXRjcmV3AAIMc3BhY2VzaGlwX2lkBnVpbnQ2NARjcmV3GkJfcGFpcl91aW50NjRfQ3Jld1JvbGVfRVtdBXNldGdtAAEGcGxheWVyBG5hbWULc2V0b3BlcmF0b3IAAgxzcGFjZXNoaXBfaWQGdWludDY0DXNoaXBfb3BlcmF0b3IEbmFtZQlzZXRwbGF5ZXIAAQFwBnBsYXllcglzZXR0aWxlY3cABAd0aWxlX2lkBnVpbnQ2NAdjb250cm9sB2Zsb2F0NjQId2lsZG5lc3MHZmxvYXQ2NBZjb250cm9sbGluZ19mYWN0aW9uX2lkBnVpbnQ2NApzaGlwbW9kdWxlAAoCaWQGdWludDY0BW93bmVyBG5hbWUQaXNfb3duZXJfZmFjdGlvbgRib29sDHNwYWNlc2hpcF9pZAZ1aW50NjQMZ2FtZWFzc2V0X2lkBnVpbnQ2NBBsb2NhdGlvbl90aWxlX2lkBnVpbnQ2NAJocAZ1aW50MzIGbWF4X2hwBnVpbnQzMgtuZXh0X3Vwa2VlcAp0aW1lX3BvaW50CGRpc2FibGVkBGJvb2wJc3BhY2VzaGlwAAgCaWQGdWludDY0BW93bmVyBG5hbWUNc2hpcF9vcGVyYXRvcgRuYW1lEGlzX293bmVyX2ZhY3Rpb24EYm9vbBBsb2NhdGlvbl90aWxlX2lkBnVpbnQ2NA5tYXhfcGFzc2VuZ2VycwZ1aW50MzISbWF4X2ludmVudG9yeV9zaXplBnVpbnQzMglpbnZlbnRvcnkYQl9wYWlyX3VpbnQzMl91aW50NjRfRVtdBXNxdWFkAAQCaWQGdWludDY0CmZhY3Rpb25faWQGdWludDY0Dm1zaWdfc3VjY2VlZGVkBGJvb2wOY2hhcmFjdGVyX3JvbGUEUm9sZQpzdGFydGVwb2NoAAAHdGVycmFpbgAHAmlkBnVpbnQ2NAR0eXBlBnN0cmluZw5tYXBfYXNzZXRfdXJscwhzdHJpbmdbXRRiYWNrZ3JvdW5kX2Fzc2V0X3VybAZzdHJpbmcOYnVpbGRpbmdfc2xvdHMFdWludDgMcGxheWVyX3Nsb3RzBXVpbnQ4B2VmZmVjdHMIdWludDY0W10EdGVzdAAABHRpbGUADwJpZAZ1aW50NjQIYXJlYV9tYXAEbmFtZQlyZWdpb25faWQGdWludDY0B3FfY29vcmQEaW50OAdyX2Nvb3JkBGludDgMdGVycmFpbl90eXBlBnVpbnQ2NA9jb250cm9sX2ZhY3Rpb24GdWludDY0B2NvbnRyb2wHZmxvYXQ2NAh3aWxkbmVzcwdmbG9hdDY0EnRpbWVfc2luY2VfcmVmcmVzaAp0aW1lX3BvaW50Em1heF9pbnZlbnRvcnlfc2l6ZQZ1aW50MzINcGxheWVyc19jb3VudAZ1aW50MzIJaW52ZW50b3J5GEJfcGFpcl91aW50MzJfdWludDY0X0VbXQ5hY3RpdmVfZWZmZWN0cwh1aW50NjRbXRBnYXJyaXNvbmVkX3VuaXRzBnVpbnQzMgt0aW1lZGVmZmVjdAAFAmlkBnVpbnQ2NAllZmZlY3RfaWQGdWludDY0CWVudGl0eV9pZAZ1aW50NjQEdHlwZQV1aW50OAZleHBpcnkKdGltZV9wb2ludAh0b2tlbml6ZQACBnBsYXllcgRuYW1lCHJlc291cmNlBWFzc2V0BHVuaXQACwJpZAZ1aW50NjQMdW5pdF90eXBlX2lkBnVpbnQ2NApmYWN0aW9uX2lkBnVpbnQ2NAVvd25lcgRuYW1lAmhwBnVpbnQzMgZtYXhfaHAGdWludDMyCW1vYmlsaXplZARib29sHWxhc3RfbW9iaWxpemF0aW9uX2FjdGlvbl90aW1lCnRpbWVfcG9pbnQQbG9jYXRpb25fdGlsZV9pZAZ1aW50NjQLbmV4dF91cGtlZXAKdGltZV9wb2ludA5hY3RpdmVfZWZmZWN0cwh1aW50NjRbXQt1cGRhdGVjaGFycwABBWNvdW50BnVpbnQzMgl1cGRhdGVybmcAAAp1cGRhdGV0aWxlAAEHdGlsZV9pZAZ1aW50NjQLdXBkYXRldGlsZXMAAQVjb3VudAZ1aW50MzILdXBncmFkZWNoYXIAAgxjaGFyYWN0ZXJfaWQGdWludDY0CG5ld19yb2xlBFJvbGUHdmVoaWNsZQALAmlkBnVpbnQ2NAxnYW1lYXNzZXRfaWQGdWludDY0BW93bmVyBG5hbWUQaXNfb3duZXJfZmFjdGlvbgRib29sAmhwBnVpbnQzMgZtYXhfaHAGdWludDMyEGxvY2F0aW9uX3RpbGVfaWQGdWludDY0C25leHRfdXBrZWVwCnRpbWVfcG9pbnQIZGlzYWJsZWQEYm9vbApwYXNzZW5nZXJzCHVpbnQ2NFtdCWludmVudG9yeRhCX3BhaXJfdWludDMyX3VpbnQ2NF9FW11VANh0KTp9UjILYWRkYnVpbGRpbmcAAEB2mFaVUjIKYWRkZGVwb3NpdAAAwKQuI7NSMgphZGRmYWN0aW9uAOAvzVPt6VIyDGFkZGludmVudG9yeQAAAAAAVCNTMgZhZGRtYXAA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'
)
export const abi = ABI.from(abiBlob)
export class Contract extends BaseContract {
    constructor(args: PartialBy<ContractArgs, 'abi' | 'account'>) {
        super({
            client: args.client,
            abi: abi,
            account: args.account || Name.from('hegemon.hgm'),
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
    addbuilding: ActionParams.addbuilding
    adddeposit: ActionParams.adddeposit
    addfaction: ActionParams.addfaction
    addinventory: ActionParams.addinventory
    addmap: ActionParams.addmap
    addplanet: ActionParams.addplanet
    addregion: ActionParams.addregion
    addresource: ActionParams.addresource
    addterrain: ActionParams.addterrain
    addtile: ActionParams.addtile
    addunit: ActionParams.addunit
    addvehicle: ActionParams.addvehicle
    calcenergy: ActionParams.calcenergy
    clear: ActionParams.clear
    clearprim: ActionParams.clearprim
    clearsec1: ActionParams.clearsec1
    clearsec2: ActionParams.clearsec2
    createchar: ActionParams.createchar
    detokenize: ActionParams.detokenize
    discardchar: ActionParams.discardchar
    doaddmats: ActionParams.doaddmats
    doaddproj: ActionParams.doaddproj
    dobuild: ActionParams.dobuild
    docancelproj: ActionParams.docancelproj
    docombat: ActionParams.docombat
    doconquer: ActionParams.doconquer
    docontrol: ActionParams.docontrol
    docraft: ActionParams.docraft
    docreateship: ActionParams.docreateship
    dodemobilize: ActionParams.dodemobilize
    dodevelop: ActionParams.dodevelop
    dodisband: ActionParams.dodisband
    dodisembark: ActionParams.dodisembark
    dodropoff: ActionParams.dodropoff
    doeat: ActionParams.doeat
    doembark: ActionParams.doembark
    doentership: ActionParams.doentership
    doequip: ActionParams.doequip
    dogive: ActionParams.dogive
    doheal: ActionParams.doheal
    dojoinbattle: ActionParams.dojoinbattle
    doland: ActionParams.doland
    dolaunch: ActionParams.dolaunch
    doleaveship: ActionParams.doleaveship
    doload: ActionParams.doload
    domobilize: ActionParams.domobilize
    domove: ActionParams.domove
    domoveship: ActionParams.domoveship
    dopayupkeep: ActionParams.dopayupkeep
    dopickup: ActionParams.dopickup
    dorepair: ActionParams.dorepair
    doresearch: ActionParams.doresearch
    doretreat: ActionParams.doretreat
    dotrain: ActionParams.dotrain
    dotransfer: ActionParams.dotransfer
    dounequip: ActionParams.dounequip
    dounload: ActionParams.dounload
    dowork: ActionParams.dowork
    electresult: ActionParams.electresult
    endday: ActionParams.endday
    endepoch: ActionParams.endepoch
    grantspoils: ActionParams.grantspoils
    init: ActionParams.init
    joinfaction: ActionParams.joinfaction
    killchar: ActionParams.killchar
    msigsuccess: ActionParams.msigsuccess
    proc: ActionParams.proc
    regplayer: ActionParams.regplayer
    resolverngs: ActionParams.resolverngs
    restorehp: ActionParams.restorehp
    revivechar: ActionParams.revivechar
    setcharacter: ActionParams.setcharacter
    setcrew: ActionParams.setcrew
    setgm: ActionParams.setgm
    setoperator: ActionParams.setoperator
    setplayer: ActionParams.setplayer
    settilecw: ActionParams.settilecw
    startepoch: ActionParams.startepoch
    test: ActionParams.test
    tokenize: ActionParams.tokenize
    updatechars: ActionParams.updatechars
    updaterng: ActionParams.updaterng
    updatetile: ActionParams.updatetile
    updatetiles: ActionParams.updatetiles
    upgradechar: ActionParams.upgradechar
}
export namespace ActionParams {
    export namespace Type {
        export interface pair_uint32_uint64 {
            first: UInt32Type
            second: UInt64Type
        }
        export interface character {
            id: UInt64Type
            first_name: string
            middle_name: string
            last_name: string
            asset_url: string
            energy: Float64Type
            max_energy: Float64Type
            owner: NameType
            last_action_time: TimePointType
            time_last_fed: TimePointType
            tool_equipped: UInt64Type
            armor_equipped: UInt64Type
            melee_weapon_equipped: UInt64Type
            ranged_weapon_equipped: UInt64Type
            on_board_vehicle: UInt64Type
            active_effects: UInt64Type[]
            base_character_role: UInt8Type
            mid_character_role: UInt8Type
            character_role: UInt8Type
            experience_level: UInt32Type
            experience_points: UInt32Type
            hp: UInt32Type
            max_hp: UInt32Type
            alive: boolean
            temporal_deja_vu_score: UInt8Type
        }
        export interface pair_uint64_CrewRole {
            first: UInt64Type
            second: UInt8Type
        }
        export interface player {
            id: UInt64Type
            owner: NameType
            asset_url: string
            character_slots: UInt8Type
            reputation_level: UInt8Type
            experience_level: UInt32Type
            experience_points: UInt32Type
            cooldowns: Type.cooldown[]
            active_project: UInt64Type
            faction: UInt64Type
            base_faction_voting_power: Float64Type
            max_inventory_size: UInt32Type
            inventory: Type.pair_uint32_uint64
            currency: AssetType
            last_respawn: TimePointType
            location_tile_id: UInt64Type
            opted_out_of_politics: boolean
            mobilized_units: UInt32Type
        }
        export interface cooldown {
            cooldown_type: UInt8Type
            time_started: TimePointType
            cooldown_duration: UInt32Type
        }
    }
    export interface addbuilding {
        gameasset_id: UInt64Type
        tile_id: UInt64Type
        owner: NameType
    }
    export interface adddeposit {
        resource_type_id: UInt64Type
        location_tile_id: UInt64Type
    }
    export interface addfaction {
        id: UInt64Type
        name: string
        code: NameType
        flag_asset_url: string
    }
    export interface addinventory {
        player: NameType
        ingredients: Type.pair_uint32_uint64
    }
    export interface addmap {
        area_map: NameType
        name: string
        code: NameType
        asset_url: string
        r_color: UInt8Type
        g_color: UInt8Type
        b_color: UInt8Type
    }
    export interface addplanet {
        id: UInt64Type
        area_map: NameType
        q_coord: Int8Type
        r_coord: Int8Type
        name: string
        code: NameType
        asset_url: string
        r_color: UInt8Type
        g_color: UInt8Type
        b_color: UInt8Type
    }
    export interface addregion {
        id: UInt64Type
        area_map: NameType
        name: string
        code: NameType
    }
    export interface addresource {
        id: UInt64Type
        gameasset_id: UInt64Type
        name: string
        asset_url: string
        difficulty: UInt32Type
    }
    export interface addterrain {
        id: UInt64Type
        type: string
        map_asset_urls: string[]
        background_asset_url: string
        building_slots: UInt8Type
        effects: UInt64Type[]
    }
    export interface addtile {
        id: UInt64Type
        area_map: NameType
        region_id: UInt64Type
        q_coord: Int8Type
        r_coord: Int8Type
        terrain_type: UInt64Type
    }
    export interface addunit {
        unit_type_id: UInt64Type
        owner: NameType
    }
    export interface addvehicle {
        gameasset_id: UInt64Type
        tile_id: UInt64Type
        owner: NameType
    }
    export interface calcenergy {
        character_id: UInt64Type
    }
    export interface clear {}
    export interface clearprim {
        table_name: NameType
        scope: NameType
    }
    export interface clearsec1 {
        table_name: NameType
        index_num: UInt8Type
        scope: NameType
    }
    export interface clearsec2 {
        table_name: NameType
        index_num: UInt8Type
        scope: NameType
    }
    export interface createchar {
        player: NameType
    }
    export interface detokenize {
        player: NameType
        resource: AssetType
    }
    export interface discardchar {
        character_id: UInt64Type
    }
    export interface doaddmats {
        character_id: UInt64Type
        project_id: UInt64Type
        materials: Type.pair_uint32_uint64
    }
    export interface doaddproj {
        character_id: UInt64Type
        blueprint_id: UInt64Type
    }
    export interface dobuild {
        character_id: UInt64Type
        project_id: UInt64Type
    }
    export interface docancelproj {
        character_id: UInt64Type
        project_id: UInt64Type
    }
    export interface docombat {
        player: NameType
        faction_id: UInt64Type
    }
    export interface doconquer {
        player: NameType
        target_tile_id: UInt64Type
    }
    export interface docontrol {
        character_id: UInt64Type
    }
    export interface docraft {
        character_id: UInt64Type
        recipe_id: UInt64Type
    }
    export interface docreateship {
        character_id: UInt64Type
        shipmodules: UInt64Type[]
    }
    export interface dodemobilize {
        player: NameType
        units: UInt64Type[]
    }
    export interface dodevelop {
        character_id: UInt64Type
    }
    export interface dodisband {
        player: NameType
        unit_id: UInt64Type
    }
    export interface dodisembark {
        character_id: UInt64Type
    }
    export interface dodropoff {
        player: NameType
        items: Type.pair_uint32_uint64
    }
    export interface doeat {
        character_id: UInt64Type
    }
    export interface doembark {
        character_id: UInt64Type
        vehicle_id: UInt64Type
    }
    export interface doentership {
        player: NameType
        spaceship_id: UInt64Type
    }
    export interface doequip {
        character_id: UInt64Type
        gameasset_id: UInt64Type
    }
    export interface dogive {
        owner: NameType
        recipient: NameType
        items: Type.pair_uint32_uint64
    }
    export interface doheal {
        character_id: UInt64Type
        patient_id: UInt64Type
        is_character: boolean
    }
    export interface dojoinbattle {
        player: NameType
        battle_id: UInt64Type
    }
    export interface doland {
        spaceship_id: UInt64Type
        tile_id: UInt64Type
    }
    export interface dolaunch {
        spaceship_id: UInt64Type
    }
    export interface doleaveship {
        player: NameType
    }
    export interface doload {
        player: NameType
        vehicle_id: UInt64Type
        items: Type.pair_uint32_uint64
    }
    export interface domobilize {
        player: NameType
        units: UInt64Type[]
    }
    export interface domove {
        player: NameType
        destination_tile_id: UInt64Type
    }
    export interface domoveship {
        spaceship_id: UInt64Type
        tile_id: UInt64Type
    }
    export interface dopayupkeep {
        character_id: UInt64Type
        type: UInt8Type
        entity: UInt64Type
    }
    export interface dopickup {
        player: NameType
        items: Type.pair_uint32_uint64
    }
    export interface dorepair {
        character_id: UInt64Type
        entity_id: UInt64Type
        type: UInt8Type
    }
    export interface doresearch {
        character_id: UInt64Type
        technology_id: UInt64Type
    }
    export interface doretreat {
        player: NameType
        destination_tile_id: UInt64Type
    }
    export interface dotrain {
        character_id: UInt64Type
        recipe_id: UInt64Type
        mobilize: boolean
    }
    export interface dotransfer {
        entity_id: UInt64Type
        type: UInt8Type
        new_owner: NameType
    }
    export interface dounequip {
        character_id: UInt64Type
        item_type: UInt8Type
    }
    export interface dounload {
        player: NameType
        vehicle_id: UInt64Type
        items: Type.pair_uint32_uint64
    }
    export interface dowork {
        character_id: UInt64Type
        activity: UInt8Type
    }
    export interface electresult {
        faction_id: UInt64Type
        leader: UInt64Type
        officers: UInt64Type[]
    }
    export interface endday {}
    export interface endepoch {}
    export interface grantspoils {
        beneficiary: NameType
        entity_id: UInt64Type
        entity_type: UInt8Type
    }
    export interface init {
        epoch: UInt8Type
    }
    export interface joinfaction {
        player: NameType
        faction_id: UInt64Type
    }
    export interface killchar {
        character_id: UInt64Type
    }
    export interface msigsuccess {
        squad_id: UInt64Type
    }
    export interface proc {
        count: UInt32Type
    }
    export interface regplayer {
        player: NameType
        opt_out_of_politics: boolean
    }
    export interface resolverngs {
        count: UInt32Type
    }
    export interface restorehp {
        character_id: UInt64Type
    }
    export interface revivechar {
        character_id: UInt64Type
        payer: NameType
    }
    export interface setcharacter {
        c: Type.character
    }
    export interface setcrew {
        spaceship_id: UInt64Type
        crew: Type.pair_uint64_CrewRole
    }
    export interface setgm {
        player: NameType
    }
    export interface setoperator {
        spaceship_id: UInt64Type
        ship_operator: NameType
    }
    export interface setplayer {
        p: Type.player
    }
    export interface settilecw {
        tile_id: UInt64Type
        control: Float64Type
        wildness: Float64Type
        controlling_faction_id: UInt64Type
    }
    export interface startepoch {}
    export interface test {}
    export interface tokenize {
        player: NameType
        resource: AssetType
    }
    export interface updatechars {
        count: UInt32Type
    }
    export interface updaterng {}
    export interface updatetile {
        tile_id: UInt64Type
    }
    export interface updatetiles {
        count: UInt32Type
    }
    export interface upgradechar {
        character_id: UInt64Type
        new_role: UInt8Type
    }
}
export namespace Types {
    @Struct.type('addbuilding')
    export class addbuilding extends Struct {
        @Struct.field(UInt64)
        gameasset_id!: UInt64
        @Struct.field(UInt64)
        tile_id!: UInt64
        @Struct.field(Name)
        owner!: Name
    }
    @Struct.type('adddeposit')
    export class adddeposit extends Struct {
        @Struct.field(UInt64)
        resource_type_id!: UInt64
        @Struct.field(UInt64)
        location_tile_id!: UInt64
    }
    @Struct.type('addfaction')
    export class addfaction extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field('string')
        name!: string
        @Struct.field(Name)
        code!: Name
        @Struct.field('string')
        flag_asset_url!: string
    }
    @Struct.type('pair_uint32_uint64')
    export class pair_uint32_uint64 extends Struct {
        @Struct.field(UInt32)
        first!: UInt32
        @Struct.field(UInt64)
        second!: UInt64
    }
    @Struct.type('addinventory')
    export class addinventory extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(pair_uint32_uint64, {array: true})
        ingredients!: pair_uint32_uint64[]
    }
    @Struct.type('addmap')
    export class addmap extends Struct {
        @Struct.field(Name)
        area_map!: Name
        @Struct.field('string')
        name!: string
        @Struct.field(Name)
        code!: Name
        @Struct.field('string')
        asset_url!: string
        @Struct.field(UInt8)
        r_color!: UInt8
        @Struct.field(UInt8)
        g_color!: UInt8
        @Struct.field(UInt8)
        b_color!: UInt8
    }
    @Struct.type('addplanet')
    export class addplanet extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(Name)
        area_map!: Name
        @Struct.field(Int8)
        q_coord!: Int8
        @Struct.field(Int8)
        r_coord!: Int8
        @Struct.field('string')
        name!: string
        @Struct.field(Name)
        code!: Name
        @Struct.field('string')
        asset_url!: string
        @Struct.field(UInt8)
        r_color!: UInt8
        @Struct.field(UInt8)
        g_color!: UInt8
        @Struct.field(UInt8)
        b_color!: UInt8
    }
    @Struct.type('addregion')
    export class addregion extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(Name)
        area_map!: Name
        @Struct.field('string')
        name!: string
        @Struct.field(Name)
        code!: Name
    }
    @Struct.type('addresource')
    export class addresource extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        gameasset_id!: UInt64
        @Struct.field('string')
        name!: string
        @Struct.field('string')
        asset_url!: string
        @Struct.field(UInt32)
        difficulty!: UInt32
    }
    @Struct.type('addterrain')
    export class addterrain extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field('string')
        type!: string
        @Struct.field('string', {array: true})
        map_asset_urls!: string[]
        @Struct.field('string')
        background_asset_url!: string
        @Struct.field(UInt8)
        building_slots!: UInt8
        @Struct.field(UInt64, {array: true})
        effects!: UInt64[]
    }
    @Struct.type('addtile')
    export class addtile extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(Name)
        area_map!: Name
        @Struct.field(UInt64)
        region_id!: UInt64
        @Struct.field(Int8)
        q_coord!: Int8
        @Struct.field(Int8)
        r_coord!: Int8
        @Struct.field(UInt64)
        terrain_type!: UInt64
    }
    @Struct.type('addunit')
    export class addunit extends Struct {
        @Struct.field(UInt64)
        unit_type_id!: UInt64
        @Struct.field(Name)
        owner!: Name
    }
    @Struct.type('addvehicle')
    export class addvehicle extends Struct {
        @Struct.field(UInt64)
        gameasset_id!: UInt64
        @Struct.field(UInt64)
        tile_id!: UInt64
        @Struct.field(Name)
        owner!: Name
    }
    @Struct.type('battle')
    export class battle extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        location_tile_id!: UInt64
        @Struct.field(UInt64)
        attacking_faction_id!: UInt64
        @Struct.field(UInt64)
        defending_faction_id!: UInt64
        @Struct.field(TimePoint)
        battle_start!: TimePoint
        @Struct.field(UInt32)
        battle_round!: UInt32
    }
    @Struct.type('battleunit')
    export class battleunit extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(Name)
        owner!: Name
        @Struct.field(UInt64)
        battle_id!: UInt64
        @Struct.field(UInt64)
        external_id!: UInt64
        @Struct.field(UInt64)
        faction_id!: UInt64
        @Struct.field(UInt32)
        hp!: UInt32
        @Struct.field(UInt32)
        max_hp!: UInt32
        @Struct.field('bool')
        is_character!: boolean
        @Struct.field('bool')
        is_garrison!: boolean
        @Struct.field(UInt64)
        retreat_to_tile!: UInt64
    }
    @Struct.type('building')
    export class building extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        gameasset_id!: UInt64
        @Struct.field(Name)
        owner!: Name
        @Struct.field('bool')
        is_owner_faction!: boolean
        @Struct.field('bool')
        disabled!: boolean
        @Struct.field(UInt32)
        hp!: UInt32
        @Struct.field(UInt32)
        max_hp!: UInt32
        @Struct.field(UInt64)
        location_tile_id!: UInt64
        @Struct.field(TimePoint)
        next_upkeep!: TimePoint
        @Struct.field(pair_uint32_uint64, {array: true})
        inventory!: pair_uint32_uint64[]
    }
    @Struct.type('calcenergy')
    export class calcenergy extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('character')
    export class character extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field('string')
        first_name!: string
        @Struct.field('string')
        middle_name!: string
        @Struct.field('string')
        last_name!: string
        @Struct.field('string')
        asset_url!: string
        @Struct.field(Float64)
        energy!: Float64
        @Struct.field(Float64)
        max_energy!: Float64
        @Struct.field(Name)
        owner!: Name
        @Struct.field(TimePoint)
        last_action_time!: TimePoint
        @Struct.field(TimePoint)
        time_last_fed!: TimePoint
        @Struct.field(UInt64)
        tool_equipped!: UInt64
        @Struct.field(UInt64)
        armor_equipped!: UInt64
        @Struct.field(UInt64)
        melee_weapon_equipped!: UInt64
        @Struct.field(UInt64)
        ranged_weapon_equipped!: UInt64
        @Struct.field(UInt64)
        on_board_vehicle!: UInt64
        @Struct.field(UInt64, {array: true})
        active_effects!: UInt64[]
        @Struct.field(UInt8)
        base_character_role!: UInt8
        @Struct.field(UInt8)
        mid_character_role!: UInt8
        @Struct.field(UInt8)
        character_role!: UInt8
        @Struct.field(UInt32)
        experience_level!: UInt32
        @Struct.field(UInt32)
        experience_points!: UInt32
        @Struct.field(UInt32)
        hp!: UInt32
        @Struct.field(UInt32)
        max_hp!: UInt32
        @Struct.field('bool')
        alive!: boolean
        @Struct.field(UInt8)
        temporal_deja_vu_score!: UInt8
    }
    @Struct.type('clear')
    export class clear extends Struct {}
    @Struct.type('clearprim')
    export class clearprim extends Struct {
        @Struct.field(Name)
        table_name!: Name
        @Struct.field(Name)
        scope!: Name
    }
    @Struct.type('clearsec1')
    export class clearsec1 extends Struct {
        @Struct.field(Name)
        table_name!: Name
        @Struct.field(UInt8)
        index_num!: UInt8
        @Struct.field(Name)
        scope!: Name
    }
    @Struct.type('clearsec2')
    export class clearsec2 extends Struct {
        @Struct.field(Name)
        table_name!: Name
        @Struct.field(UInt8)
        index_num!: UInt8
        @Struct.field(Name)
        scope!: Name
    }
    @Struct.type('combatant')
    export class combatant extends Struct {
        @Struct.field(UInt64)
        player_id!: UInt64
        @Struct.field(UInt64)
        battle_id!: UInt64
        @Struct.field(UInt64)
        faction_id!: UInt64
        @Struct.field(UInt64)
        retreat_to_tile!: UInt64
    }
    @Struct.type('cooldown')
    export class cooldown extends Struct {
        @Struct.field(UInt8)
        cooldown_type!: UInt8
        @Struct.field(TimePoint)
        time_started!: TimePoint
        @Struct.field(UInt32)
        cooldown_duration!: UInt32
    }
    @Struct.type('createchar')
    export class createchar extends Struct {
        @Struct.field(Name)
        player!: Name
    }
    @Struct.type('crew')
    export class crew extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        spaceship_id!: UInt64
        @Struct.field(UInt8)
        role!: UInt8
    }
    @Struct.type('day')
    export class day extends Struct {
        @Struct.field(TimePoint)
        day_start!: TimePoint
        @Struct.field(TimePoint)
        day_end!: TimePoint
        @Struct.field(UInt32)
        total_active_players!: UInt32
        @Struct.field(Float64)
        energy_spent!: Float64
    }
    @Struct.type('deposit')
    export class deposit extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        resource_type_id!: UInt64
        @Struct.field(UInt64)
        location_tile_id!: UInt64
    }
    @Struct.type('detokenize')
    export class detokenize extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(Asset)
        resource!: Asset
    }
    @Struct.type('discardchar')
    export class discardchar extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('doaddmats')
    export class doaddmats extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        project_id!: UInt64
        @Struct.field(pair_uint32_uint64)
        materials!: pair_uint32_uint64
    }
    @Struct.type('doaddproj')
    export class doaddproj extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        blueprint_id!: UInt64
    }
    @Struct.type('dobuild')
    export class dobuild extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        project_id!: UInt64
    }
    @Struct.type('docancelproj')
    export class docancelproj extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        project_id!: UInt64
    }
    @Struct.type('docombat')
    export class docombat extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        faction_id!: UInt64
    }
    @Struct.type('doconquer')
    export class doconquer extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        target_tile_id!: UInt64
    }
    @Struct.type('docontrol')
    export class docontrol extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('docraft')
    export class docraft extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        recipe_id!: UInt64
    }
    @Struct.type('docreateship')
    export class docreateship extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64, {array: true})
        shipmodules!: UInt64[]
    }
    @Struct.type('dodemobilize')
    export class dodemobilize extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64, {array: true})
        units!: UInt64[]
    }
    @Struct.type('dodevelop')
    export class dodevelop extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('dodisband')
    export class dodisband extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        unit_id!: UInt64
    }
    @Struct.type('dodisembark')
    export class dodisembark extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('dodropoff')
    export class dodropoff extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(pair_uint32_uint64)
        items!: pair_uint32_uint64
    }
    @Struct.type('doeat')
    export class doeat extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('doembark')
    export class doembark extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        vehicle_id!: UInt64
    }
    @Struct.type('doentership')
    export class doentership extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        spaceship_id!: UInt64
    }
    @Struct.type('doequip')
    export class doequip extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        gameasset_id!: UInt64
    }
    @Struct.type('dogive')
    export class dogive extends Struct {
        @Struct.field(Name)
        owner!: Name
        @Struct.field(Name)
        recipient!: Name
        @Struct.field(pair_uint32_uint64, {array: true})
        items!: pair_uint32_uint64[]
    }
    @Struct.type('doheal')
    export class doheal extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        patient_id!: UInt64
        @Struct.field('bool')
        is_character!: boolean
    }
    @Struct.type('dojoinbattle')
    export class dojoinbattle extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        battle_id!: UInt64
    }
    @Struct.type('doland')
    export class doland extends Struct {
        @Struct.field(UInt64)
        spaceship_id!: UInt64
        @Struct.field(UInt64)
        tile_id!: UInt64
    }
    @Struct.type('dolaunch')
    export class dolaunch extends Struct {
        @Struct.field(UInt64)
        spaceship_id!: UInt64
    }
    @Struct.type('doleaveship')
    export class doleaveship extends Struct {
        @Struct.field(Name)
        player!: Name
    }
    @Struct.type('doload')
    export class doload extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        vehicle_id!: UInt64
        @Struct.field(pair_uint32_uint64)
        items!: pair_uint32_uint64
    }
    @Struct.type('domobilize')
    export class domobilize extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64, {array: true})
        units!: UInt64[]
    }
    @Struct.type('domove')
    export class domove extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        destination_tile_id!: UInt64
    }
    @Struct.type('domoveship')
    export class domoveship extends Struct {
        @Struct.field(UInt64)
        spaceship_id!: UInt64
        @Struct.field(UInt64)
        tile_id!: UInt64
    }
    @Struct.type('dopayupkeep')
    export class dopayupkeep extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt8)
        type!: UInt8
        @Struct.field(UInt64)
        entity!: UInt64
    }
    @Struct.type('dopickup')
    export class dopickup extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(pair_uint32_uint64)
        items!: pair_uint32_uint64
    }
    @Struct.type('dorepair')
    export class dorepair extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        entity_id!: UInt64
        @Struct.field(UInt8)
        type!: UInt8
    }
    @Struct.type('doresearch')
    export class doresearch extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        technology_id!: UInt64
    }
    @Struct.type('doretreat')
    export class doretreat extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        destination_tile_id!: UInt64
    }
    @Struct.type('dotrain')
    export class dotrain extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        recipe_id!: UInt64
        @Struct.field('bool')
        mobilize!: boolean
    }
    @Struct.type('dotransfer')
    export class dotransfer extends Struct {
        @Struct.field(UInt64)
        entity_id!: UInt64
        @Struct.field(UInt8)
        type!: UInt8
        @Struct.field(Name)
        new_owner!: Name
    }
    @Struct.type('dounequip')
    export class dounequip extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt8)
        item_type!: UInt8
    }
    @Struct.type('dounload')
    export class dounload extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        vehicle_id!: UInt64
        @Struct.field(pair_uint32_uint64)
        items!: pair_uint32_uint64
    }
    @Struct.type('dowork')
    export class dowork extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt8)
        activity!: UInt8
    }
    @Struct.type('electresult')
    export class electresult extends Struct {
        @Struct.field(UInt64)
        faction_id!: UInt64
        @Struct.field(UInt64)
        leader!: UInt64
        @Struct.field(UInt64, {array: true})
        officers!: UInt64[]
    }
    @Struct.type('endday')
    export class endday extends Struct {}
    @Struct.type('endepoch')
    export class endepoch extends Struct {}
    @Struct.type('faction')
    export class faction extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field('string')
        name!: string
        @Struct.field(Name)
        code!: Name
        @Struct.field('string')
        flag_asset_url!: string
        @Struct.field('bool')
        activated!: boolean
        @Struct.field(UInt64)
        leader!: UInt64
        @Struct.field(UInt64, {array: true})
        officers!: UInt64[]
        @Struct.field(UInt32)
        total_players!: UInt32
        @Struct.field(UInt64, {array: true})
        mining_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        engineering_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        farming_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        logistics_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        health_care_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        commerce_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        civil_service_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        intelligence_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        military_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        research_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        energy_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        infrastructure_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        operations_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        governance_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        diplomacy_characters!: UInt64[]
        @Struct.field(day)
        day_stats!: day
        @Struct.field(UInt64, {array: true})
        active_effects!: UInt64[]
    }
    @Struct.type('global')
    export class global extends Struct {
        @Struct.field(Name)
        game_master!: Name
        @Struct.field(TimePoint)
        game_started!: TimePoint
        @Struct.field(TimePoint)
        game_end!: TimePoint
        @Struct.field(UInt8)
        current_epoch!: UInt8
        @Struct.field(UInt8)
        current_period!: UInt8
        @Struct.field(UInt8)
        current_cycle!: UInt8
        @Struct.field(UInt8)
        current_day!: UInt8
        @Struct.field(UInt32)
        total_days!: UInt32
        @Struct.field(Float64)
        total_energy!: Float64
        @Struct.field(UInt32)
        total_players!: UInt32
        @Struct.field(UInt32)
        total_characters!: UInt32
        @Struct.field(TimePoint)
        last_oracle_timestamp!: TimePoint
        @Struct.field(Checksum256)
        last_oracle_hash!: Checksum256
        @Struct.field(day)
        day_stats!: day
        @Struct.field(day)
        ind_day_stats!: day
        @Struct.field('bool')
        players_inflation_bucket_active!: boolean
        @Struct.field('bool')
        factions_inflation_bucket_active!: boolean
        @Struct.field('bool')
        regions_inflation_bucket_active!: boolean
        @Struct.field('bool')
        planets_inflation_bucket_active!: boolean
    }
    @Struct.type('grantspoils')
    export class grantspoils extends Struct {
        @Struct.field(Name)
        beneficiary!: Name
        @Struct.field(UInt64)
        entity_id!: UInt64
        @Struct.field(UInt8)
        entity_type!: UInt8
    }
    @Struct.type('hashes')
    export class hashes extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(Name)
        owner!: Name
        @Struct.field(Checksum256)
        multiparty!: Checksum256
        @Struct.field(Checksum256)
        hash!: Checksum256
        @Struct.field('string')
        reveal!: string
        @Struct.field(TimePoint)
        timestamp!: TimePoint
    }
    @Struct.type('init')
    export class init extends Struct {
        @Struct.field(UInt8)
        epoch!: UInt8
    }
    @Struct.type('joinfaction')
    export class joinfaction extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        faction_id!: UInt64
    }
    @Struct.type('killchar')
    export class killchar extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('map')
    export class map extends Struct {
        @Struct.field(Name)
        area_map!: Name
        @Struct.field('string')
        name!: string
        @Struct.field(Name)
        code!: Name
        @Struct.field('string')
        asset_url!: string
        @Struct.field(day)
        day_stats!: day
        @Struct.field(UInt8)
        r_color!: UInt8
        @Struct.field(UInt8)
        g_color!: UInt8
        @Struct.field(UInt8)
        b_color!: UInt8
    }
    @Struct.type('msigsuccess')
    export class msigsuccess extends Struct {
        @Struct.field(UInt64)
        squad_id!: UInt64
    }
    @Struct.type('pair_uint64_CrewRole')
    export class pair_uint64_CrewRole extends Struct {
        @Struct.field(UInt64)
        first!: UInt64
        @Struct.field(UInt8)
        second!: UInt8
    }
    @Struct.type('passenger')
    export class passenger extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        spaceship_id!: UInt64
    }
    @Struct.type('planet')
    export class planet extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field('string')
        name!: string
        @Struct.field(Name)
        code!: Name
        @Struct.field(Int8)
        q_coord!: Int8
        @Struct.field(Int8)
        r_coord!: Int8
        @Struct.field('string')
        asset_url!: string
        @Struct.field(Name)
        area_map!: Name
        @Struct.field(day)
        day_stats!: day
        @Struct.field(UInt64)
        control_faction!: UInt64
        @Struct.field(UInt8)
        r_color!: UInt8
        @Struct.field(UInt8)
        g_color!: UInt8
        @Struct.field(UInt8)
        b_color!: UInt8
    }
    @Struct.type('player')
    export class player extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(Name)
        owner!: Name
        @Struct.field('string')
        asset_url!: string
        @Struct.field(UInt8)
        character_slots!: UInt8
        @Struct.field(UInt8)
        reputation_level!: UInt8
        @Struct.field(UInt32)
        experience_level!: UInt32
        @Struct.field(UInt32)
        experience_points!: UInt32
        @Struct.field(cooldown, {array: true})
        cooldowns!: cooldown[]
        @Struct.field(UInt64)
        active_project!: UInt64
        @Struct.field(UInt64)
        faction!: UInt64
        @Struct.field(Float64)
        base_faction_voting_power!: Float64
        @Struct.field(UInt32)
        max_inventory_size!: UInt32
        @Struct.field(pair_uint32_uint64, {array: true})
        inventory!: pair_uint32_uint64[]
        @Struct.field(Asset)
        currency!: Asset
        @Struct.field(TimePoint)
        last_respawn!: TimePoint
        @Struct.field(UInt64)
        location_tile_id!: UInt64
        @Struct.field('bool')
        opted_out_of_politics!: boolean
        @Struct.field(UInt32)
        mobilized_units!: UInt32
    }
    @Struct.type('primarykey')
    export class primarykey extends Struct {
        @Struct.field(Name)
        table!: Name
        @Struct.field(UInt64)
        next_key!: UInt64
    }
    @Struct.type('proc')
    export class proc extends Struct {
        @Struct.field(UInt32)
        count!: UInt32
    }
    @Struct.type('project')
    export class project extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        blueprint_id!: UInt64
        @Struct.field(UInt64)
        location_tile_id!: UInt64
        @Struct.field(TimePoint)
        last_action_time!: TimePoint
        @Struct.field(pair_uint32_uint64, {array: true})
        materials!: pair_uint32_uint64[]
        @Struct.field(UInt32)
        work!: UInt32
        @Struct.field(Name)
        owner!: Name
        @Struct.field('bool')
        is_owner_faction!: boolean
        @Struct.field('bool')
        is_building!: boolean
    }
    @Struct.type('region')
    export class region extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(Name)
        area_map!: Name
        @Struct.field('string')
        name!: string
        @Struct.field(Name)
        code!: Name
        @Struct.field(day)
        day_stats!: day
        @Struct.field(UInt64)
        control_faction!: UInt64
    }
    @Struct.type('regplayer')
    export class regplayer extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field('bool')
        opt_out_of_politics!: boolean
    }
    @Struct.type('resolverngs')
    export class resolverngs extends Struct {
        @Struct.field(UInt32)
        count!: UInt32
    }
    @Struct.type('resource')
    export class resource extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        gameasset_id!: UInt64
        @Struct.field('string')
        name!: string
        @Struct.field(UInt32)
        difficulty!: UInt32
        @Struct.field('string')
        asset_url!: string
    }
    @Struct.type('restorehp')
    export class restorehp extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('revivechar')
    export class revivechar extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(Name)
        payer!: Name
    }
    @Struct.type('rngrequest')
    export class rngrequest extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(TimePoint)
        created!: TimePoint
        @Struct.field(TimePoint)
        execution!: TimePoint
        @Struct.field(UInt64)
        external_id!: UInt64
        @Struct.field('bool')
        is_character_rng!: boolean
        @Struct.field(UInt8)
        rng_type!: UInt8
        @Struct.field(Checksum256)
        result!: Checksum256
    }
    @Struct.type('rprog')
    export class rprog extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        technology_id!: UInt64
        @Struct.field(UInt64)
        faction_id!: UInt64
        @Struct.field(UInt64)
        tree_id!: UInt64
        @Struct.field(Float64)
        research_points!: Float64
    }
    @Struct.type('setcharacter')
    export class setcharacter extends Struct {
        @Struct.field(character)
        c!: character
    }
    @Struct.type('setcrew')
    export class setcrew extends Struct {
        @Struct.field(UInt64)
        spaceship_id!: UInt64
        @Struct.field(pair_uint64_CrewRole, {array: true})
        crew!: pair_uint64_CrewRole[]
    }
    @Struct.type('setgm')
    export class setgm extends Struct {
        @Struct.field(Name)
        player!: Name
    }
    @Struct.type('setoperator')
    export class setoperator extends Struct {
        @Struct.field(UInt64)
        spaceship_id!: UInt64
        @Struct.field(Name)
        ship_operator!: Name
    }
    @Struct.type('setplayer')
    export class setplayer extends Struct {
        @Struct.field(player)
        p!: player
    }
    @Struct.type('settilecw')
    export class settilecw extends Struct {
        @Struct.field(UInt64)
        tile_id!: UInt64
        @Struct.field(Float64)
        control!: Float64
        @Struct.field(Float64)
        wildness!: Float64
        @Struct.field(UInt64)
        controlling_faction_id!: UInt64
    }
    @Struct.type('shipmodule')
    export class shipmodule extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(Name)
        owner!: Name
        @Struct.field('bool')
        is_owner_faction!: boolean
        @Struct.field(UInt64)
        spaceship_id!: UInt64
        @Struct.field(UInt64)
        gameasset_id!: UInt64
        @Struct.field(UInt64)
        location_tile_id!: UInt64
        @Struct.field(UInt32)
        hp!: UInt32
        @Struct.field(UInt32)
        max_hp!: UInt32
        @Struct.field(TimePoint)
        next_upkeep!: TimePoint
        @Struct.field('bool')
        disabled!: boolean
    }
    @Struct.type('spaceship')
    export class spaceship extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(Name)
        owner!: Name
        @Struct.field(Name)
        ship_operator!: Name
        @Struct.field('bool')
        is_owner_faction!: boolean
        @Struct.field(UInt64)
        location_tile_id!: UInt64
        @Struct.field(UInt32)
        max_passengers!: UInt32
        @Struct.field(UInt32)
        max_inventory_size!: UInt32
        @Struct.field(pair_uint32_uint64, {array: true})
        inventory!: pair_uint32_uint64[]
    }
    @Struct.type('squad')
    export class squad extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        faction_id!: UInt64
        @Struct.field('bool')
        msig_succeeded!: boolean
        @Struct.field(UInt8)
        character_role!: UInt8
    }
    @Struct.type('startepoch')
    export class startepoch extends Struct {}
    @Struct.type('terrain')
    export class terrain extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field('string')
        type!: string
        @Struct.field('string', {array: true})
        map_asset_urls!: string[]
        @Struct.field('string')
        background_asset_url!: string
        @Struct.field(UInt8)
        building_slots!: UInt8
        @Struct.field(UInt8)
        player_slots!: UInt8
        @Struct.field(UInt64, {array: true})
        effects!: UInt64[]
    }
    @Struct.type('test')
    export class test extends Struct {}
    @Struct.type('tile')
    export class tile extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(Name)
        area_map!: Name
        @Struct.field(UInt64)
        region_id!: UInt64
        @Struct.field(Int8)
        q_coord!: Int8
        @Struct.field(Int8)
        r_coord!: Int8
        @Struct.field(UInt64)
        terrain_type!: UInt64
        @Struct.field(UInt64)
        control_faction!: UInt64
        @Struct.field(Float64)
        control!: Float64
        @Struct.field(Float64)
        wildness!: Float64
        @Struct.field(TimePoint)
        time_since_refresh!: TimePoint
        @Struct.field(UInt32)
        max_inventory_size!: UInt32
        @Struct.field(UInt32)
        players_count!: UInt32
        @Struct.field(pair_uint32_uint64, {array: true})
        inventory!: pair_uint32_uint64[]
        @Struct.field(UInt64, {array: true})
        active_effects!: UInt64[]
        @Struct.field(UInt32)
        garrisoned_units!: UInt32
    }
    @Struct.type('timedeffect')
    export class timedeffect extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        effect_id!: UInt64
        @Struct.field(UInt64)
        entity_id!: UInt64
        @Struct.field(UInt8)
        type!: UInt8
        @Struct.field(TimePoint)
        expiry!: TimePoint
    }
    @Struct.type('tokenize')
    export class tokenize extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(Asset)
        resource!: Asset
    }
    @Struct.type('unit')
    export class unit extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        unit_type_id!: UInt64
        @Struct.field(UInt64)
        faction_id!: UInt64
        @Struct.field(Name)
        owner!: Name
        @Struct.field(UInt32)
        hp!: UInt32
        @Struct.field(UInt32)
        max_hp!: UInt32
        @Struct.field('bool')
        mobilized!: boolean
        @Struct.field(TimePoint)
        last_mobilization_action_time!: TimePoint
        @Struct.field(UInt64)
        location_tile_id!: UInt64
        @Struct.field(TimePoint)
        next_upkeep!: TimePoint
        @Struct.field(UInt64, {array: true})
        active_effects!: UInt64[]
    }
    @Struct.type('updatechars')
    export class updatechars extends Struct {
        @Struct.field(UInt32)
        count!: UInt32
    }
    @Struct.type('updaterng')
    export class updaterng extends Struct {}
    @Struct.type('updatetile')
    export class updatetile extends Struct {
        @Struct.field(UInt64)
        tile_id!: UInt64
    }
    @Struct.type('updatetiles')
    export class updatetiles extends Struct {
        @Struct.field(UInt32)
        count!: UInt32
    }
    @Struct.type('upgradechar')
    export class upgradechar extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt8)
        new_role!: UInt8
    }
    @Struct.type('vehicle')
    export class vehicle extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        gameasset_id!: UInt64
        @Struct.field(Name)
        owner!: Name
        @Struct.field('bool')
        is_owner_faction!: boolean
        @Struct.field(UInt32)
        hp!: UInt32
        @Struct.field(UInt32)
        max_hp!: UInt32
        @Struct.field(UInt64)
        location_tile_id!: UInt64
        @Struct.field(TimePoint)
        next_upkeep!: TimePoint
        @Struct.field('bool')
        disabled!: boolean
        @Struct.field(UInt64, {array: true})
        passengers!: UInt64[]
        @Struct.field(pair_uint32_uint64, {array: true})
        inventory!: pair_uint32_uint64[]
    }
}
export const TableMap = {
    battles: Types.battle,
    battleunits: Types.battleunit,
    buildings: Types.building,
    characters: Types.character,
    chareffects: Types.timedeffect,
    combatants: Types.combatant,
    crews: Types.crew,
    deposits: Types.deposit,
    factions: Types.faction,
    global: Types.global,
    hashes: Types.hashes,
    maps: Types.map,
    passengers: Types.passenger,
    planets: Types.planet,
    players: Types.player,
    primarykeys: Types.primarykey,
    projects: Types.project,
    regions: Types.region,
    resources: Types.resource,
    rngrequests: Types.rngrequest,
    rprogs: Types.rprog,
    shipmodules: Types.shipmodule,
    spaceships: Types.spaceship,
    squads: Types.squad,
    terrains: Types.terrain,
    tileeffects: Types.timedeffect,
    tiles: Types.tile,
    units: Types.unit,
    vehicles: Types.vehicle,
}
export interface TableTypes {
    battles: Types.battle
    battleunits: Types.battleunit
    buildings: Types.building
    characters: Types.character
    chareffects: Types.timedeffect
    combatants: Types.combatant
    crews: Types.crew
    deposits: Types.deposit
    factions: Types.faction
    global: Types.global
    hashes: Types.hashes
    maps: Types.map
    passengers: Types.passenger
    planets: Types.planet
    players: Types.player
    primarykeys: Types.primarykey
    projects: Types.project
    regions: Types.region
    resources: Types.resource
    rngrequests: Types.rngrequest
    rprogs: Types.rprog
    shipmodules: Types.shipmodule
    spaceships: Types.spaceship
    squads: Types.squad
    terrains: Types.terrain
    tileeffects: Types.timedeffect
    tiles: Types.tile
    units: Types.unit
    vehicles: Types.vehicle
}
export type RowType<T> = T extends keyof TableTypes ? TableTypes[T] : any
export type ActionNames = keyof ActionNameParams
export type TableNames = keyof TableTypes
