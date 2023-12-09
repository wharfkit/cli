import type {
    Action,
    AssetType,
    Float64Type,
    Int8Type,
    NameType,
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
    addbuilding: ActionParams.Addbuilding
    adddeposit: ActionParams.Adddeposit
    addfaction: ActionParams.Addfaction
    addinventory: ActionParams.Addinventory
    addmap: ActionParams.Addmap
    addplanet: ActionParams.Addplanet
    addregion: ActionParams.Addregion
    addresource: ActionParams.Addresource
    addterrain: ActionParams.Addterrain
    addtile: ActionParams.Addtile
    addunit: ActionParams.Addunit
    addvehicle: ActionParams.Addvehicle
    calcenergy: ActionParams.Calcenergy
    clear: ActionParams.Clear
    clearprim: ActionParams.Clearprim
    clearsec1: ActionParams.Clearsec1
    clearsec2: ActionParams.Clearsec2
    createchar: ActionParams.Createchar
    detokenize: ActionParams.Detokenize
    discardchar: ActionParams.Discardchar
    doaddmats: ActionParams.Doaddmats
    doaddproj: ActionParams.Doaddproj
    dobuild: ActionParams.Dobuild
    docancelproj: ActionParams.Docancelproj
    docombat: ActionParams.Docombat
    doconquer: ActionParams.Doconquer
    docontrol: ActionParams.Docontrol
    docraft: ActionParams.Docraft
    docreateship: ActionParams.Docreateship
    dodemobilize: ActionParams.Dodemobilize
    dodevelop: ActionParams.Dodevelop
    dodisband: ActionParams.Dodisband
    dodisembark: ActionParams.Dodisembark
    dodropoff: ActionParams.Dodropoff
    doeat: ActionParams.Doeat
    doembark: ActionParams.Doembark
    doentership: ActionParams.Doentership
    doequip: ActionParams.Doequip
    dogive: ActionParams.Dogive
    doheal: ActionParams.Doheal
    dojoinbattle: ActionParams.Dojoinbattle
    doland: ActionParams.Doland
    dolaunch: ActionParams.Dolaunch
    doleaveship: ActionParams.Doleaveship
    doload: ActionParams.Doload
    domobilize: ActionParams.Domobilize
    domove: ActionParams.Domove
    domoveship: ActionParams.Domoveship
    dopayupkeep: ActionParams.Dopayupkeep
    dopickup: ActionParams.Dopickup
    dorepair: ActionParams.Dorepair
    doresearch: ActionParams.Doresearch
    doretreat: ActionParams.Doretreat
    dotrain: ActionParams.Dotrain
    dotransfer: ActionParams.Dotransfer
    dounequip: ActionParams.Dounequip
    dounload: ActionParams.Dounload
    dowork: ActionParams.Dowork
    electresult: ActionParams.Electresult
    endday: ActionParams.Endday
    endepoch: ActionParams.Endepoch
    grantspoils: ActionParams.Grantspoils
    init: ActionParams.Init
    joinfaction: ActionParams.Joinfaction
    killchar: ActionParams.Killchar
    msigsuccess: ActionParams.Msigsuccess
    proc: ActionParams.Proc
    regplayer: ActionParams.Regplayer
    resolverngs: ActionParams.Resolverngs
    restorehp: ActionParams.Restorehp
    revivechar: ActionParams.Revivechar
    setcharacter: ActionParams.Setcharacter
    setcrew: ActionParams.Setcrew
    setgm: ActionParams.Setgm
    setoperator: ActionParams.Setoperator
    setplayer: ActionParams.Setplayer
    settilecw: ActionParams.Settilecw
    startepoch: ActionParams.Startepoch
    test: ActionParams.Test
    tokenize: ActionParams.Tokenize
    updatechars: ActionParams.Updatechars
    updaterng: ActionParams.Updaterng
    updatetile: ActionParams.Updatetile
    updatetiles: ActionParams.Updatetiles
    upgradechar: ActionParams.Upgradechar
}
export namespace ActionParams {
    export interface Addbuilding {
        gameasset_id: UInt64Type
        tile_id: UInt64Type
        owner: NameType
    }
    export interface Adddeposit {
        resource_type_id: UInt64Type
        location_tile_id: UInt64Type
    }
    export interface Addfaction {
        id: UInt64Type
        name: string
        code: NameType
        flag_asset_url: string
    }
    export interface Addinventory {
        player: NameType
        ingredients: Types.pair_uint32_uint64[]
    }
    export interface Addmap {
        area_map: NameType
        name: string
        code: NameType
        asset_url: string
        r_color: UInt8Type
        g_color: UInt8Type
        b_color: UInt8Type
    }
    export interface Addplanet {
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
    export interface Addregion {
        id: UInt64Type
        area_map: NameType
        name: string
        code: NameType
    }
    export interface Addresource {
        id: UInt64Type
        gameasset_id: UInt64Type
        name: string
        asset_url: string
        difficulty: UInt32Type
    }
    export interface Addterrain {
        id: UInt64Type
        type: string
        map_asset_urls: string[]
        background_asset_url: string
        building_slots: UInt8Type
        effects: UInt64Type[]
    }
    export interface Addtile {
        id: UInt64Type
        area_map: NameType
        region_id: UInt64Type
        q_coord: Int8Type
        r_coord: Int8Type
        terrain_type: UInt64Type
    }
    export interface Addunit {
        unit_type_id: UInt64Type
        owner: NameType
    }
    export interface Addvehicle {
        gameasset_id: UInt64Type
        tile_id: UInt64Type
        owner: NameType
    }
    export interface Calcenergy {
        character_id: UInt64Type
    }
    export interface Clear {}
    export interface Clearprim {
        table_name: NameType
        scope: NameType
    }
    export interface Clearsec1 {
        table_name: NameType
        index_num: UInt8Type
        scope: NameType
    }
    export interface Clearsec2 {
        table_name: NameType
        index_num: UInt8Type
        scope: NameType
    }
    export interface Createchar {
        player: NameType
    }
    export interface Detokenize {
        player: NameType
        resource: AssetType
    }
    export interface Discardchar {
        character_id: UInt64Type
    }
    export interface Doaddmats {
        character_id: UInt64Type
        project_id: UInt64Type
        materials: Types.pair_uint32_uint64
    }
    export interface Doaddproj {
        character_id: UInt64Type
        blueprint_id: UInt64Type
    }
    export interface Dobuild {
        character_id: UInt64Type
        project_id: UInt64Type
    }
    export interface Docancelproj {
        character_id: UInt64Type
        project_id: UInt64Type
    }
    export interface Docombat {
        player: NameType
        faction_id: UInt64Type
    }
    export interface Doconquer {
        player: NameType
        target_tile_id: UInt64Type
    }
    export interface Docontrol {
        character_id: UInt64Type
    }
    export interface Docraft {
        character_id: UInt64Type
        recipe_id: UInt64Type
    }
    export interface Docreateship {
        character_id: UInt64Type
        shipmodules: UInt64Type[]
    }
    export interface Dodemobilize {
        player: NameType
        units: UInt64Type[]
    }
    export interface Dodevelop {
        character_id: UInt64Type
    }
    export interface Dodisband {
        player: NameType
        unit_id: UInt64Type
    }
    export interface Dodisembark {
        character_id: UInt64Type
    }
    export interface Dodropoff {
        player: NameType
        items: Types.pair_uint32_uint64
    }
    export interface Doeat {
        character_id: UInt64Type
    }
    export interface Doembark {
        character_id: UInt64Type
        vehicle_id: UInt64Type
    }
    export interface Doentership {
        player: NameType
        spaceship_id: UInt64Type
    }
    export interface Doequip {
        character_id: UInt64Type
        gameasset_id: UInt64Type
    }
    export interface Dogive {
        owner: NameType
        recipient: NameType
        items: Types.pair_uint32_uint64[]
    }
    export interface Doheal {
        character_id: UInt64Type
        patient_id: UInt64Type
        is_character: boolean
    }
    export interface Dojoinbattle {
        player: NameType
        battle_id: UInt64Type
    }
    export interface Doland {
        spaceship_id: UInt64Type
        tile_id: UInt64Type
    }
    export interface Dolaunch {
        spaceship_id: UInt64Type
    }
    export interface Doleaveship {
        player: NameType
    }
    export interface Doload {
        player: NameType
        vehicle_id: UInt64Type
        items: Types.pair_uint32_uint64
    }
    export interface Domobilize {
        player: NameType
        units: UInt64Type[]
    }
    export interface Domove {
        player: NameType
        destination_tile_id: UInt64Type
    }
    export interface Domoveship {
        spaceship_id: UInt64Type
        tile_id: UInt64Type
    }
    export interface Dopayupkeep {
        character_id: UInt64Type
        type: UInt8Type
        entity: UInt64Type
    }
    export interface Dopickup {
        player: NameType
        items: Types.pair_uint32_uint64
    }
    export interface Dorepair {
        character_id: UInt64Type
        entity_id: UInt64Type
        type: UInt8Type
    }
    export interface Doresearch {
        character_id: UInt64Type
        technology_id: UInt64Type
    }
    export interface Doretreat {
        player: NameType
        destination_tile_id: UInt64Type
    }
    export interface Dotrain {
        character_id: UInt64Type
        recipe_id: UInt64Type
        mobilize: boolean
    }
    export interface Dotransfer {
        entity_id: UInt64Type
        type: UInt8Type
        new_owner: NameType
    }
    export interface Dounequip {
        character_id: UInt64Type
        item_type: UInt8Type
    }
    export interface Dounload {
        player: NameType
        vehicle_id: UInt64Type
        items: Types.pair_uint32_uint64
    }
    export interface Dowork {
        character_id: UInt64Type
        activity: UInt8Type
    }
    export interface Electresult {
        faction_id: UInt64Type
        leader: UInt64Type
        officers: UInt64Type[]
    }
    export interface Endday {}
    export interface Endepoch {}
    export interface Grantspoils {
        beneficiary: NameType
        entity_id: UInt64Type
        entity_type: UInt8Type
    }
    export interface Init {
        epoch: UInt8Type
    }
    export interface Joinfaction {
        player: NameType
        faction_id: UInt64Type
    }
    export interface Killchar {
        character_id: UInt64Type
    }
    export interface Msigsuccess {
        squad_id: UInt64Type
    }
    export interface Proc {
        count: UInt32Type
    }
    export interface Regplayer {
        player: NameType
        opt_out_of_politics: boolean
    }
    export interface Resolverngs {
        count: UInt32Type
    }
    export interface Restorehp {
        character_id: UInt64Type
    }
    export interface Revivechar {
        character_id: UInt64Type
        payer: NameType
    }
    export interface Setcharacter {
        c: Types.character
    }
    export interface Setcrew {
        spaceship_id: UInt64Type
        crew: Types.pair_uint64_CrewRole[]
    }
    export interface Setgm {
        player: NameType
    }
    export interface Setoperator {
        spaceship_id: UInt64Type
        ship_operator: NameType
    }
    export interface Setplayer {
        p: Types.player
    }
    export interface Settilecw {
        tile_id: UInt64Type
        control: Float64Type
        wildness: Float64Type
        controlling_faction_id: UInt64Type
    }
    export interface Startepoch {}
    export interface Test {}
    export interface Tokenize {
        player: NameType
        resource: AssetType
    }
    export interface Updatechars {
        count: UInt32Type
    }
    export interface Updaterng {}
    export interface Updatetile {
        tile_id: UInt64Type
    }
    export interface Updatetiles {
        count: UInt32Type
    }
    export interface Upgradechar {
        character_id: UInt64Type
        new_role: UInt8Type
    }
}
export namespace Types {
    @Struct.type('addbuilding')
    export class addbuilding extends Struct {
        @Struct.field(UInt64)
        Gameasset_id!: UInt64
        @Struct.field(UInt64)
        Tile_id!: UInt64
        @Struct.field(Name)
        Owner!: Name
    }
    @Struct.type('adddeposit')
    export class adddeposit extends Struct {
        @Struct.field(UInt64)
        Resource_type_id!: UInt64
        @Struct.field(UInt64)
        Location_tile_id!: UInt64
    }
    @Struct.type('addfaction')
    export class addfaction extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field('string')
        Name!: string
        @Struct.field(Name)
        Code!: Name
        @Struct.field('string')
        Flag_asset_url!: string
    }
    @Struct.type('pair_uint32_uint64')
    export class pair_uint32_uint64 extends Struct {
        @Struct.field(UInt32)
        First!: UInt32
        @Struct.field(UInt64)
        Second!: UInt64
    }
    @Struct.type('addinventory')
    export class addinventory extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(pair_uint32_uint64, {array: true})
        Ingredients!: pair_uint32_uint64[]
    }
    @Struct.type('addmap')
    export class addmap extends Struct {
        @Struct.field(Name)
        Area_map!: Name
        @Struct.field('string')
        Name!: string
        @Struct.field(Name)
        Code!: Name
        @Struct.field('string')
        Asset_url!: string
        @Struct.field(UInt8)
        R_color!: UInt8
        @Struct.field(UInt8)
        G_color!: UInt8
        @Struct.field(UInt8)
        B_color!: UInt8
    }
    @Struct.type('addplanet')
    export class addplanet extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(Name)
        Area_map!: Name
        @Struct.field(Int8)
        Q_coord!: Int8
        @Struct.field(Int8)
        R_coord!: Int8
        @Struct.field('string')
        Name!: string
        @Struct.field(Name)
        Code!: Name
        @Struct.field('string')
        Asset_url!: string
        @Struct.field(UInt8)
        R_color!: UInt8
        @Struct.field(UInt8)
        G_color!: UInt8
        @Struct.field(UInt8)
        B_color!: UInt8
    }
    @Struct.type('addregion')
    export class addregion extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(Name)
        Area_map!: Name
        @Struct.field('string')
        Name!: string
        @Struct.field(Name)
        Code!: Name
    }
    @Struct.type('addresource')
    export class addresource extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(UInt64)
        Gameasset_id!: UInt64
        @Struct.field('string')
        Name!: string
        @Struct.field('string')
        Asset_url!: string
        @Struct.field(UInt32)
        Difficulty!: UInt32
    }
    @Struct.type('addterrain')
    export class addterrain extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field('string')
        Type!: string
        @Struct.field('string', {array: true})
        Map_asset_urls!: string[]
        @Struct.field('string')
        Background_asset_url!: string
        @Struct.field(UInt8)
        Building_slots!: UInt8
        @Struct.field(UInt64, {array: true})
        Effects!: UInt64[]
    }
    @Struct.type('addtile')
    export class addtile extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(Name)
        Area_map!: Name
        @Struct.field(UInt64)
        Region_id!: UInt64
        @Struct.field(Int8)
        Q_coord!: Int8
        @Struct.field(Int8)
        R_coord!: Int8
        @Struct.field(UInt64)
        Terrain_type!: UInt64
    }
    @Struct.type('addunit')
    export class addunit extends Struct {
        @Struct.field(UInt64)
        Unit_type_id!: UInt64
        @Struct.field(Name)
        Owner!: Name
    }
    @Struct.type('addvehicle')
    export class addvehicle extends Struct {
        @Struct.field(UInt64)
        Gameasset_id!: UInt64
        @Struct.field(UInt64)
        Tile_id!: UInt64
        @Struct.field(Name)
        Owner!: Name
    }
    @Struct.type('battle')
    export class battle extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(UInt64)
        Location_tile_id!: UInt64
        @Struct.field(UInt64)
        Attacking_faction_id!: UInt64
        @Struct.field(UInt64)
        Defending_faction_id!: UInt64
        @Struct.field(TimePoint)
        Battle_start!: TimePoint
        @Struct.field(UInt32)
        Battle_round!: UInt32
    }
    @Struct.type('battleunit')
    export class battleunit extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(Name)
        Owner!: Name
        @Struct.field(UInt64)
        Battle_id!: UInt64
        @Struct.field(UInt64)
        External_id!: UInt64
        @Struct.field(UInt64)
        Faction_id!: UInt64
        @Struct.field(UInt32)
        Hp!: UInt32
        @Struct.field(UInt32)
        Max_hp!: UInt32
        @Struct.field('bool')
        Is_character!: boolean
        @Struct.field('bool')
        Is_garrison!: boolean
        @Struct.field(UInt64)
        Retreat_to_tile!: UInt64
    }
    @Struct.type('building')
    export class building extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(UInt64)
        Gameasset_id!: UInt64
        @Struct.field(Name)
        Owner!: Name
        @Struct.field('bool')
        Is_owner_faction!: boolean
        @Struct.field('bool')
        Disabled!: boolean
        @Struct.field(UInt32)
        Hp!: UInt32
        @Struct.field(UInt32)
        Max_hp!: UInt32
        @Struct.field(UInt64)
        Location_tile_id!: UInt64
        @Struct.field(TimePoint)
        Next_upkeep!: TimePoint
        @Struct.field(pair_uint32_uint64, {array: true})
        Inventory!: pair_uint32_uint64[]
    }
    @Struct.type('calcenergy')
    export class calcenergy extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
    }
    @Struct.type('character')
    export class character extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field('string')
        First_name!: string
        @Struct.field('string')
        Middle_name!: string
        @Struct.field('string')
        Last_name!: string
        @Struct.field('string')
        Asset_url!: string
        @Struct.field(Float64)
        Energy!: Float64
        @Struct.field(Float64)
        Max_energy!: Float64
        @Struct.field(Name)
        Owner!: Name
        @Struct.field(TimePoint)
        Last_action_time!: TimePoint
        @Struct.field(TimePoint)
        Time_last_fed!: TimePoint
        @Struct.field(UInt64)
        Tool_equipped!: UInt64
        @Struct.field(UInt64)
        Armor_equipped!: UInt64
        @Struct.field(UInt64)
        Melee_weapon_equipped!: UInt64
        @Struct.field(UInt64)
        Ranged_weapon_equipped!: UInt64
        @Struct.field(UInt64)
        On_board_vehicle!: UInt64
        @Struct.field(UInt64, {array: true})
        Active_effects!: UInt64[]
        @Struct.field(UInt8)
        Base_character_role!: UInt8
        @Struct.field(UInt8)
        Mid_character_role!: UInt8
        @Struct.field(UInt8)
        Character_role!: UInt8
        @Struct.field(UInt32)
        Experience_level!: UInt32
        @Struct.field(UInt32)
        Experience_points!: UInt32
        @Struct.field(UInt32)
        Hp!: UInt32
        @Struct.field(UInt32)
        Max_hp!: UInt32
        @Struct.field('bool')
        Alive!: boolean
        @Struct.field(UInt8)
        Temporal_deja_vu_score!: UInt8
    }
    @Struct.type('clear')
    export class clear extends Struct {}
    @Struct.type('clearprim')
    export class clearprim extends Struct {
        @Struct.field(Name)
        Table_name!: Name
        @Struct.field(Name)
        Scope!: Name
    }
    @Struct.type('clearsec1')
    export class clearsec1 extends Struct {
        @Struct.field(Name)
        Table_name!: Name
        @Struct.field(UInt8)
        Index_num!: UInt8
        @Struct.field(Name)
        Scope!: Name
    }
    @Struct.type('clearsec2')
    export class clearsec2 extends Struct {
        @Struct.field(Name)
        Table_name!: Name
        @Struct.field(UInt8)
        Index_num!: UInt8
        @Struct.field(Name)
        Scope!: Name
    }
    @Struct.type('combatant')
    export class combatant extends Struct {
        @Struct.field(UInt64)
        Player_id!: UInt64
        @Struct.field(UInt64)
        Battle_id!: UInt64
        @Struct.field(UInt64)
        Faction_id!: UInt64
        @Struct.field(UInt64)
        Retreat_to_tile!: UInt64
    }
    @Struct.type('cooldown')
    export class cooldown extends Struct {
        @Struct.field(UInt8)
        Cooldown_type!: UInt8
        @Struct.field(TimePoint)
        Time_started!: TimePoint
        @Struct.field(UInt32)
        Cooldown_duration!: UInt32
    }
    @Struct.type('createchar')
    export class createchar extends Struct {
        @Struct.field(Name)
        Player!: Name
    }
    @Struct.type('crew')
    export class crew extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt64)
        Spaceship_id!: UInt64
        @Struct.field(UInt8)
        Role!: UInt8
    }
    @Struct.type('day')
    export class day extends Struct {
        @Struct.field(TimePoint)
        Day_start!: TimePoint
        @Struct.field(TimePoint)
        Day_end!: TimePoint
        @Struct.field(UInt32)
        Total_active_players!: UInt32
        @Struct.field(Float64)
        Energy_spent!: Float64
    }
    @Struct.type('deposit')
    export class deposit extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(UInt64)
        Resource_type_id!: UInt64
        @Struct.field(UInt64)
        Location_tile_id!: UInt64
    }
    @Struct.type('detokenize')
    export class detokenize extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(Asset)
        Resource!: Asset
    }
    @Struct.type('discardchar')
    export class discardchar extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
    }
    @Struct.type('doaddmats')
    export class doaddmats extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt64)
        Project_id!: UInt64
        @Struct.field(pair_uint32_uint64)
        Materials!: pair_uint32_uint64
    }
    @Struct.type('doaddproj')
    export class doaddproj extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt64)
        Blueprint_id!: UInt64
    }
    @Struct.type('dobuild')
    export class dobuild extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt64)
        Project_id!: UInt64
    }
    @Struct.type('docancelproj')
    export class docancelproj extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt64)
        Project_id!: UInt64
    }
    @Struct.type('docombat')
    export class docombat extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(UInt64)
        Faction_id!: UInt64
    }
    @Struct.type('doconquer')
    export class doconquer extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(UInt64)
        Target_tile_id!: UInt64
    }
    @Struct.type('docontrol')
    export class docontrol extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
    }
    @Struct.type('docraft')
    export class docraft extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt64)
        Recipe_id!: UInt64
    }
    @Struct.type('docreateship')
    export class docreateship extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt64, {array: true})
        Shipmodules!: UInt64[]
    }
    @Struct.type('dodemobilize')
    export class dodemobilize extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(UInt64, {array: true})
        Units!: UInt64[]
    }
    @Struct.type('dodevelop')
    export class dodevelop extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
    }
    @Struct.type('dodisband')
    export class dodisband extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(UInt64)
        Unit_id!: UInt64
    }
    @Struct.type('dodisembark')
    export class dodisembark extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
    }
    @Struct.type('dodropoff')
    export class dodropoff extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(pair_uint32_uint64)
        Items!: pair_uint32_uint64
    }
    @Struct.type('doeat')
    export class doeat extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
    }
    @Struct.type('doembark')
    export class doembark extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt64)
        Vehicle_id!: UInt64
    }
    @Struct.type('doentership')
    export class doentership extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(UInt64)
        Spaceship_id!: UInt64
    }
    @Struct.type('doequip')
    export class doequip extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt64)
        Gameasset_id!: UInt64
    }
    @Struct.type('dogive')
    export class dogive extends Struct {
        @Struct.field(Name)
        Owner!: Name
        @Struct.field(Name)
        Recipient!: Name
        @Struct.field(pair_uint32_uint64, {array: true})
        Items!: pair_uint32_uint64[]
    }
    @Struct.type('doheal')
    export class doheal extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt64)
        Patient_id!: UInt64
        @Struct.field('bool')
        Is_character!: boolean
    }
    @Struct.type('dojoinbattle')
    export class dojoinbattle extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(UInt64)
        Battle_id!: UInt64
    }
    @Struct.type('doland')
    export class doland extends Struct {
        @Struct.field(UInt64)
        Spaceship_id!: UInt64
        @Struct.field(UInt64)
        Tile_id!: UInt64
    }
    @Struct.type('dolaunch')
    export class dolaunch extends Struct {
        @Struct.field(UInt64)
        Spaceship_id!: UInt64
    }
    @Struct.type('doleaveship')
    export class doleaveship extends Struct {
        @Struct.field(Name)
        Player!: Name
    }
    @Struct.type('doload')
    export class doload extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(UInt64)
        Vehicle_id!: UInt64
        @Struct.field(pair_uint32_uint64)
        Items!: pair_uint32_uint64
    }
    @Struct.type('domobilize')
    export class domobilize extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(UInt64, {array: true})
        Units!: UInt64[]
    }
    @Struct.type('domove')
    export class domove extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(UInt64)
        Destination_tile_id!: UInt64
    }
    @Struct.type('domoveship')
    export class domoveship extends Struct {
        @Struct.field(UInt64)
        Spaceship_id!: UInt64
        @Struct.field(UInt64)
        Tile_id!: UInt64
    }
    @Struct.type('dopayupkeep')
    export class dopayupkeep extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt8)
        Type!: UInt8
        @Struct.field(UInt64)
        Entity!: UInt64
    }
    @Struct.type('dopickup')
    export class dopickup extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(pair_uint32_uint64)
        Items!: pair_uint32_uint64
    }
    @Struct.type('dorepair')
    export class dorepair extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt64)
        Entity_id!: UInt64
        @Struct.field(UInt8)
        Type!: UInt8
    }
    @Struct.type('doresearch')
    export class doresearch extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt64)
        Technology_id!: UInt64
    }
    @Struct.type('doretreat')
    export class doretreat extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(UInt64)
        Destination_tile_id!: UInt64
    }
    @Struct.type('dotrain')
    export class dotrain extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt64)
        Recipe_id!: UInt64
        @Struct.field('bool')
        Mobilize!: boolean
    }
    @Struct.type('dotransfer')
    export class dotransfer extends Struct {
        @Struct.field(UInt64)
        Entity_id!: UInt64
        @Struct.field(UInt8)
        Type!: UInt8
        @Struct.field(Name)
        New_owner!: Name
    }
    @Struct.type('dounequip')
    export class dounequip extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt8)
        Item_type!: UInt8
    }
    @Struct.type('dounload')
    export class dounload extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(UInt64)
        Vehicle_id!: UInt64
        @Struct.field(pair_uint32_uint64)
        Items!: pair_uint32_uint64
    }
    @Struct.type('dowork')
    export class dowork extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt8)
        Activity!: UInt8
    }
    @Struct.type('electresult')
    export class electresult extends Struct {
        @Struct.field(UInt64)
        Faction_id!: UInt64
        @Struct.field(UInt64)
        Leader!: UInt64
        @Struct.field(UInt64, {array: true})
        Officers!: UInt64[]
    }
    @Struct.type('endday')
    export class endday extends Struct {}
    @Struct.type('endepoch')
    export class endepoch extends Struct {}
    @Struct.type('faction')
    export class faction extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field('string')
        Name!: string
        @Struct.field(Name)
        Code!: Name
        @Struct.field('string')
        Flag_asset_url!: string
        @Struct.field('bool')
        Activated!: boolean
        @Struct.field(UInt64)
        Leader!: UInt64
        @Struct.field(UInt64, {array: true})
        Officers!: UInt64[]
        @Struct.field(UInt32)
        Total_players!: UInt32
        @Struct.field(UInt64, {array: true})
        Mining_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        Engineering_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        Farming_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        Logistics_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        Health_care_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        Commerce_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        Civil_service_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        Intelligence_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        Military_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        Research_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        Energy_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        Infrastructure_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        Operations_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        Governance_characters!: UInt64[]
        @Struct.field(UInt64, {array: true})
        Diplomacy_characters!: UInt64[]
        @Struct.field(day)
        Day_stats!: day
        @Struct.field(UInt64, {array: true})
        Active_effects!: UInt64[]
    }
    @Struct.type('global')
    export class global extends Struct {
        @Struct.field(Name)
        Game_master!: Name
        @Struct.field(TimePoint)
        Game_started!: TimePoint
        @Struct.field(TimePoint)
        Game_end!: TimePoint
        @Struct.field(UInt8)
        Current_epoch!: UInt8
        @Struct.field(UInt8)
        Current_period!: UInt8
        @Struct.field(UInt8)
        Current_cycle!: UInt8
        @Struct.field(UInt8)
        Current_day!: UInt8
        @Struct.field(UInt32)
        Total_days!: UInt32
        @Struct.field(Float64)
        Total_energy!: Float64
        @Struct.field(UInt32)
        Total_players!: UInt32
        @Struct.field(UInt32)
        Total_characters!: UInt32
        @Struct.field(TimePoint)
        Last_oracle_timestamp!: TimePoint
        @Struct.field(Checksum256)
        Last_oracle_hash!: Checksum256
        @Struct.field(day)
        Day_stats!: day
        @Struct.field(day)
        Ind_day_stats!: day
        @Struct.field('bool')
        Players_inflation_bucket_active!: boolean
        @Struct.field('bool')
        Factions_inflation_bucket_active!: boolean
        @Struct.field('bool')
        Regions_inflation_bucket_active!: boolean
        @Struct.field('bool')
        Planets_inflation_bucket_active!: boolean
    }
    @Struct.type('grantspoils')
    export class grantspoils extends Struct {
        @Struct.field(Name)
        Beneficiary!: Name
        @Struct.field(UInt64)
        Entity_id!: UInt64
        @Struct.field(UInt8)
        Entity_type!: UInt8
    }
    @Struct.type('hashes')
    export class hashes extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(Name)
        Owner!: Name
        @Struct.field(Checksum256)
        Multiparty!: Checksum256
        @Struct.field(Checksum256)
        Hash!: Checksum256
        @Struct.field('string')
        Reveal!: string
        @Struct.field(TimePoint)
        Timestamp!: TimePoint
    }
    @Struct.type('init')
    export class init extends Struct {
        @Struct.field(UInt8)
        Epoch!: UInt8
    }
    @Struct.type('joinfaction')
    export class joinfaction extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(UInt64)
        Faction_id!: UInt64
    }
    @Struct.type('killchar')
    export class killchar extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
    }
    @Struct.type('map')
    export class map extends Struct {
        @Struct.field(Name)
        Area_map!: Name
        @Struct.field('string')
        Name!: string
        @Struct.field(Name)
        Code!: Name
        @Struct.field('string')
        Asset_url!: string
        @Struct.field(day)
        Day_stats!: day
        @Struct.field(UInt8)
        R_color!: UInt8
        @Struct.field(UInt8)
        G_color!: UInt8
        @Struct.field(UInt8)
        B_color!: UInt8
    }
    @Struct.type('msigsuccess')
    export class msigsuccess extends Struct {
        @Struct.field(UInt64)
        Squad_id!: UInt64
    }
    @Struct.type('pair_uint64_CrewRole')
    export class pair_uint64_CrewRole extends Struct {
        @Struct.field(UInt64)
        First!: UInt64
        @Struct.field(UInt8)
        Second!: UInt8
    }
    @Struct.type('passenger')
    export class passenger extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(UInt64)
        Spaceship_id!: UInt64
    }
    @Struct.type('planet')
    export class planet extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field('string')
        Name!: string
        @Struct.field(Name)
        Code!: Name
        @Struct.field(Int8)
        Q_coord!: Int8
        @Struct.field(Int8)
        R_coord!: Int8
        @Struct.field('string')
        Asset_url!: string
        @Struct.field(Name)
        Area_map!: Name
        @Struct.field(day)
        Day_stats!: day
        @Struct.field(UInt64)
        Control_faction!: UInt64
        @Struct.field(UInt8)
        R_color!: UInt8
        @Struct.field(UInt8)
        G_color!: UInt8
        @Struct.field(UInt8)
        B_color!: UInt8
    }
    @Struct.type('player')
    export class player extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(Name)
        Owner!: Name
        @Struct.field('string')
        Asset_url!: string
        @Struct.field(UInt8)
        Character_slots!: UInt8
        @Struct.field(UInt8)
        Reputation_level!: UInt8
        @Struct.field(UInt32)
        Experience_level!: UInt32
        @Struct.field(UInt32)
        Experience_points!: UInt32
        @Struct.field(cooldown, {array: true})
        Cooldowns!: cooldown[]
        @Struct.field(UInt64)
        Active_project!: UInt64
        @Struct.field(UInt64)
        Faction!: UInt64
        @Struct.field(Float64)
        Base_faction_voting_power!: Float64
        @Struct.field(UInt32)
        Max_inventory_size!: UInt32
        @Struct.field(pair_uint32_uint64, {array: true})
        Inventory!: pair_uint32_uint64[]
        @Struct.field(Asset)
        Currency!: Asset
        @Struct.field(TimePoint)
        Last_respawn!: TimePoint
        @Struct.field(UInt64)
        Location_tile_id!: UInt64
        @Struct.field('bool')
        Opted_out_of_politics!: boolean
        @Struct.field(UInt32)
        Mobilized_units!: UInt32
    }
    @Struct.type('primarykey')
    export class primarykey extends Struct {
        @Struct.field(Name)
        Table!: Name
        @Struct.field(UInt64)
        Next_key!: UInt64
    }
    @Struct.type('proc')
    export class proc extends Struct {
        @Struct.field(UInt32)
        Count!: UInt32
    }
    @Struct.type('project')
    export class project extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(UInt64)
        Blueprint_id!: UInt64
        @Struct.field(UInt64)
        Location_tile_id!: UInt64
        @Struct.field(TimePoint)
        Last_action_time!: TimePoint
        @Struct.field(pair_uint32_uint64, {array: true})
        Materials!: pair_uint32_uint64[]
        @Struct.field(UInt32)
        Work!: UInt32
        @Struct.field(Name)
        Owner!: Name
        @Struct.field('bool')
        Is_owner_faction!: boolean
        @Struct.field('bool')
        Is_building!: boolean
    }
    @Struct.type('region')
    export class region extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(Name)
        Area_map!: Name
        @Struct.field('string')
        Name!: string
        @Struct.field(Name)
        Code!: Name
        @Struct.field(day)
        Day_stats!: day
        @Struct.field(UInt64)
        Control_faction!: UInt64
    }
    @Struct.type('regplayer')
    export class regplayer extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field('bool')
        Opt_out_of_politics!: boolean
    }
    @Struct.type('resolverngs')
    export class resolverngs extends Struct {
        @Struct.field(UInt32)
        Count!: UInt32
    }
    @Struct.type('resource')
    export class resource extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(UInt64)
        Gameasset_id!: UInt64
        @Struct.field('string')
        Name!: string
        @Struct.field(UInt32)
        Difficulty!: UInt32
        @Struct.field('string')
        Asset_url!: string
    }
    @Struct.type('restorehp')
    export class restorehp extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
    }
    @Struct.type('revivechar')
    export class revivechar extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(Name)
        Payer!: Name
    }
    @Struct.type('rngrequest')
    export class rngrequest extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(TimePoint)
        Created!: TimePoint
        @Struct.field(TimePoint)
        Execution!: TimePoint
        @Struct.field(UInt64)
        External_id!: UInt64
        @Struct.field('bool')
        Is_character_rng!: boolean
        @Struct.field(UInt8)
        Rng_type!: UInt8
        @Struct.field(Checksum256)
        Result!: Checksum256
    }
    @Struct.type('rprog')
    export class rprog extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(UInt64)
        Technology_id!: UInt64
        @Struct.field(UInt64)
        Faction_id!: UInt64
        @Struct.field(UInt64)
        Tree_id!: UInt64
        @Struct.field(Float64)
        Research_points!: Float64
    }
    @Struct.type('setcharacter')
    export class setcharacter extends Struct {
        @Struct.field(character)
        C!: character
    }
    @Struct.type('setcrew')
    export class setcrew extends Struct {
        @Struct.field(UInt64)
        Spaceship_id!: UInt64
        @Struct.field(pair_uint64_CrewRole, {array: true})
        Crew!: pair_uint64_CrewRole[]
    }
    @Struct.type('setgm')
    export class setgm extends Struct {
        @Struct.field(Name)
        Player!: Name
    }
    @Struct.type('setoperator')
    export class setoperator extends Struct {
        @Struct.field(UInt64)
        Spaceship_id!: UInt64
        @Struct.field(Name)
        Ship_operator!: Name
    }
    @Struct.type('setplayer')
    export class setplayer extends Struct {
        @Struct.field(player)
        P!: player
    }
    @Struct.type('settilecw')
    export class settilecw extends Struct {
        @Struct.field(UInt64)
        Tile_id!: UInt64
        @Struct.field(Float64)
        Control!: Float64
        @Struct.field(Float64)
        Wildness!: Float64
        @Struct.field(UInt64)
        Controlling_faction_id!: UInt64
    }
    @Struct.type('shipmodule')
    export class shipmodule extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(Name)
        Owner!: Name
        @Struct.field('bool')
        Is_owner_faction!: boolean
        @Struct.field(UInt64)
        Spaceship_id!: UInt64
        @Struct.field(UInt64)
        Gameasset_id!: UInt64
        @Struct.field(UInt64)
        Location_tile_id!: UInt64
        @Struct.field(UInt32)
        Hp!: UInt32
        @Struct.field(UInt32)
        Max_hp!: UInt32
        @Struct.field(TimePoint)
        Next_upkeep!: TimePoint
        @Struct.field('bool')
        Disabled!: boolean
    }
    @Struct.type('spaceship')
    export class spaceship extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(Name)
        Owner!: Name
        @Struct.field(Name)
        Ship_operator!: Name
        @Struct.field('bool')
        Is_owner_faction!: boolean
        @Struct.field(UInt64)
        Location_tile_id!: UInt64
        @Struct.field(UInt32)
        Max_passengers!: UInt32
        @Struct.field(UInt32)
        Max_inventory_size!: UInt32
        @Struct.field(pair_uint32_uint64, {array: true})
        Inventory!: pair_uint32_uint64[]
    }
    @Struct.type('squad')
    export class squad extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(UInt64)
        Faction_id!: UInt64
        @Struct.field('bool')
        Msig_succeeded!: boolean
        @Struct.field(UInt8)
        Character_role!: UInt8
    }
    @Struct.type('startepoch')
    export class startepoch extends Struct {}
    @Struct.type('terrain')
    export class terrain extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field('string')
        Type!: string
        @Struct.field('string', {array: true})
        Map_asset_urls!: string[]
        @Struct.field('string')
        Background_asset_url!: string
        @Struct.field(UInt8)
        Building_slots!: UInt8
        @Struct.field(UInt8)
        Player_slots!: UInt8
        @Struct.field(UInt64, {array: true})
        Effects!: UInt64[]
    }
    @Struct.type('test')
    export class test extends Struct {}
    @Struct.type('tile')
    export class tile extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(Name)
        Area_map!: Name
        @Struct.field(UInt64)
        Region_id!: UInt64
        @Struct.field(Int8)
        Q_coord!: Int8
        @Struct.field(Int8)
        R_coord!: Int8
        @Struct.field(UInt64)
        Terrain_type!: UInt64
        @Struct.field(UInt64)
        Control_faction!: UInt64
        @Struct.field(Float64)
        Control!: Float64
        @Struct.field(Float64)
        Wildness!: Float64
        @Struct.field(TimePoint)
        Time_since_refresh!: TimePoint
        @Struct.field(UInt32)
        Max_inventory_size!: UInt32
        @Struct.field(UInt32)
        Players_count!: UInt32
        @Struct.field(pair_uint32_uint64, {array: true})
        Inventory!: pair_uint32_uint64[]
        @Struct.field(UInt64, {array: true})
        Active_effects!: UInt64[]
        @Struct.field(UInt32)
        Garrisoned_units!: UInt32
    }
    @Struct.type('timedeffect')
    export class timedeffect extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(UInt64)
        Effect_id!: UInt64
        @Struct.field(UInt64)
        Entity_id!: UInt64
        @Struct.field(UInt8)
        Type!: UInt8
        @Struct.field(TimePoint)
        Expiry!: TimePoint
    }
    @Struct.type('tokenize')
    export class tokenize extends Struct {
        @Struct.field(Name)
        Player!: Name
        @Struct.field(Asset)
        Resource!: Asset
    }
    @Struct.type('unit')
    export class unit extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(UInt64)
        Unit_type_id!: UInt64
        @Struct.field(UInt64)
        Faction_id!: UInt64
        @Struct.field(Name)
        Owner!: Name
        @Struct.field(UInt32)
        Hp!: UInt32
        @Struct.field(UInt32)
        Max_hp!: UInt32
        @Struct.field('bool')
        Mobilized!: boolean
        @Struct.field(TimePoint)
        Last_mobilization_action_time!: TimePoint
        @Struct.field(UInt64)
        Location_tile_id!: UInt64
        @Struct.field(TimePoint)
        Next_upkeep!: TimePoint
        @Struct.field(UInt64, {array: true})
        Active_effects!: UInt64[]
    }
    @Struct.type('updatechars')
    export class updatechars extends Struct {
        @Struct.field(UInt32)
        Count!: UInt32
    }
    @Struct.type('updaterng')
    export class updaterng extends Struct {}
    @Struct.type('updatetile')
    export class updatetile extends Struct {
        @Struct.field(UInt64)
        Tile_id!: UInt64
    }
    @Struct.type('updatetiles')
    export class updatetiles extends Struct {
        @Struct.field(UInt32)
        Count!: UInt32
    }
    @Struct.type('upgradechar')
    export class upgradechar extends Struct {
        @Struct.field(UInt64)
        Character_id!: UInt64
        @Struct.field(UInt8)
        New_role!: UInt8
    }
    @Struct.type('vehicle')
    export class vehicle extends Struct {
        @Struct.field(UInt64)
        Id!: UInt64
        @Struct.field(UInt64)
        Gameasset_id!: UInt64
        @Struct.field(Name)
        Owner!: Name
        @Struct.field('bool')
        Is_owner_faction!: boolean
        @Struct.field(UInt32)
        Hp!: UInt32
        @Struct.field(UInt32)
        Max_hp!: UInt32
        @Struct.field(UInt64)
        Location_tile_id!: UInt64
        @Struct.field(TimePoint)
        Next_upkeep!: TimePoint
        @Struct.field('bool')
        Disabled!: boolean
        @Struct.field(UInt64, {array: true})
        Passengers!: UInt64[]
        @Struct.field(pair_uint32_uint64, {array: true})
        Inventory!: pair_uint32_uint64[]
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
