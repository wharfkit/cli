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
import type {ActionOptions, ContractArgs, PartialBy} from '@wharfkit/contract'
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
            account: Name.from('hegemon.hgm'),
        })
    }
    action<
        T extends
            | 'addbuilding'
            | 'adddeposit'
            | 'addfaction'
            | 'addinventory'
            | 'addmap'
            | 'addplanet'
            | 'addregion'
            | 'addresource'
            | 'addterrain'
            | 'addtile'
            | 'addunit'
            | 'addvehicle'
            | 'calcenergy'
            | 'clear'
            | 'clearprim'
            | 'clearsec1'
            | 'clearsec2'
            | 'createchar'
            | 'detokenize'
            | 'discardchar'
            | 'doaddmats'
            | 'doaddproj'
            | 'dobuild'
            | 'docancelproj'
            | 'docombat'
            | 'doconquer'
            | 'docontrol'
            | 'docraft'
            | 'docreateship'
            | 'dodemobilize'
            | 'dodevelop'
            | 'dodisband'
            | 'dodisembark'
            | 'dodropoff'
            | 'doeat'
            | 'doembark'
            | 'doentership'
            | 'doequip'
            | 'dogive'
            | 'doheal'
            | 'dojoinbattle'
            | 'doland'
            | 'dolaunch'
            | 'doleaveship'
            | 'doload'
            | 'domobilize'
            | 'domove'
            | 'domoveship'
            | 'dopayupkeep'
            | 'dopickup'
            | 'dorepair'
            | 'doresearch'
            | 'doretreat'
            | 'dotrain'
            | 'dotransfer'
            | 'dounequip'
            | 'dounload'
            | 'dowork'
            | 'electresult'
            | 'endday'
            | 'endepoch'
            | 'grantspoils'
            | 'init'
            | 'joinfaction'
            | 'killchar'
            | 'msigsuccess'
            | 'proc'
            | 'regplayer'
            | 'resolverngs'
            | 'restorehp'
            | 'revivechar'
            | 'setcharacter'
            | 'setcrew'
            | 'setgm'
            | 'setoperator'
            | 'setplayer'
            | 'settilecw'
            | 'startepoch'
            | 'test'
            | 'tokenize'
            | 'updatechars'
            | 'updaterng'
            | 'updatetile'
            | 'updatetiles'
            | 'upgradechar'
    >(name: T, data: ActionNameParams[T], options?: ActionOptions): Action {
        return super.action(name, data, options)
    }
    table<
        T extends
            | 'battles'
            | 'battleunits'
            | 'buildings'
            | 'characters'
            | 'chareffects'
            | 'combatants'
            | 'crews'
            | 'deposits'
            | 'factions'
            | 'global'
            | 'hashes'
            | 'maps'
            | 'passengers'
            | 'planets'
            | 'players'
            | 'primarykeys'
            | 'projects'
            | 'regions'
            | 'resources'
            | 'rngrequests'
            | 'rprogs'
            | 'shipmodules'
            | 'spaceships'
            | 'squads'
            | 'terrains'
            | 'tileeffects'
            | 'tiles'
            | 'units'
            | 'vehicles'
    >(name: T, scope?: NameType) {
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
        ingredients: Types.PairUint32Uint64[]
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
        materials: Types.PairUint32Uint64
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
        items: Types.PairUint32Uint64
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
        items: Types.PairUint32Uint64[]
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
        items: Types.PairUint32Uint64
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
        items: Types.PairUint32Uint64
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
        items: Types.PairUint32Uint64
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
        c: Types.Character
    }
    export interface Setcrew {
        spaceship_id: UInt64Type
        crew: Types.PairUint64CrewRole[]
    }
    export interface Setgm {
        player: NameType
    }
    export interface Setoperator {
        spaceship_id: UInt64Type
        ship_operator: NameType
    }
    export interface Setplayer {
        p: Types.Player
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
    export class Addbuilding extends Struct {
        @Struct.field(UInt64)
        gameasset_id!: UInt64
        @Struct.field(UInt64)
        tile_id!: UInt64
        @Struct.field(Name)
        owner!: Name
    }
    @Struct.type('adddeposit')
    export class Adddeposit extends Struct {
        @Struct.field(UInt64)
        resource_type_id!: UInt64
        @Struct.field(UInt64)
        location_tile_id!: UInt64
    }
    @Struct.type('addfaction')
    export class Addfaction extends Struct {
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
    export class PairUint32Uint64 extends Struct {
        @Struct.field(UInt32)
        first!: UInt32
        @Struct.field(UInt64)
        second!: UInt64
    }
    @Struct.type('addinventory')
    export class Addinventory extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(PairUint32Uint64, {array: true})
        ingredients!: PairUint32Uint64[]
    }
    @Struct.type('addmap')
    export class Addmap extends Struct {
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
    export class Addplanet extends Struct {
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
    export class Addregion extends Struct {
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
    export class Addresource extends Struct {
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
    export class Addterrain extends Struct {
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
    export class Addtile extends Struct {
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
    export class Addunit extends Struct {
        @Struct.field(UInt64)
        unit_type_id!: UInt64
        @Struct.field(Name)
        owner!: Name
    }
    @Struct.type('addvehicle')
    export class Addvehicle extends Struct {
        @Struct.field(UInt64)
        gameasset_id!: UInt64
        @Struct.field(UInt64)
        tile_id!: UInt64
        @Struct.field(Name)
        owner!: Name
    }
    @Struct.type('battle')
    export class Battle extends Struct {
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
    export class Battleunit extends Struct {
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
    export class Building extends Struct {
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
        @Struct.field(PairUint32Uint64, {array: true})
        inventory!: PairUint32Uint64[]
    }
    @Struct.type('calcenergy')
    export class Calcenergy extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('character')
    export class Character extends Struct {
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
    export class Clear extends Struct {}
    @Struct.type('clearprim')
    export class Clearprim extends Struct {
        @Struct.field(Name)
        table_name!: Name
        @Struct.field(Name)
        scope!: Name
    }
    @Struct.type('clearsec1')
    export class Clearsec1 extends Struct {
        @Struct.field(Name)
        table_name!: Name
        @Struct.field(UInt8)
        index_num!: UInt8
        @Struct.field(Name)
        scope!: Name
    }
    @Struct.type('clearsec2')
    export class Clearsec2 extends Struct {
        @Struct.field(Name)
        table_name!: Name
        @Struct.field(UInt8)
        index_num!: UInt8
        @Struct.field(Name)
        scope!: Name
    }
    @Struct.type('combatant')
    export class Combatant extends Struct {
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
    export class Cooldown extends Struct {
        @Struct.field(UInt8)
        cooldown_type!: UInt8
        @Struct.field(TimePoint)
        time_started!: TimePoint
        @Struct.field(UInt32)
        cooldown_duration!: UInt32
    }
    @Struct.type('createchar')
    export class Createchar extends Struct {
        @Struct.field(Name)
        player!: Name
    }
    @Struct.type('crew')
    export class Crew extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        spaceship_id!: UInt64
        @Struct.field(UInt8)
        role!: UInt8
    }
    @Struct.type('day')
    export class Day extends Struct {
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
    export class Deposit extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        resource_type_id!: UInt64
        @Struct.field(UInt64)
        location_tile_id!: UInt64
    }
    @Struct.type('detokenize')
    export class Detokenize extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(Asset)
        resource!: Asset
    }
    @Struct.type('discardchar')
    export class Discardchar extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('doaddmats')
    export class Doaddmats extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        project_id!: UInt64
        @Struct.field(PairUint32Uint64)
        materials!: PairUint32Uint64
    }
    @Struct.type('doaddproj')
    export class Doaddproj extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        blueprint_id!: UInt64
    }
    @Struct.type('dobuild')
    export class Dobuild extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        project_id!: UInt64
    }
    @Struct.type('docancelproj')
    export class Docancelproj extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        project_id!: UInt64
    }
    @Struct.type('docombat')
    export class Docombat extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        faction_id!: UInt64
    }
    @Struct.type('doconquer')
    export class Doconquer extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        target_tile_id!: UInt64
    }
    @Struct.type('docontrol')
    export class Docontrol extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('docraft')
    export class Docraft extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        recipe_id!: UInt64
    }
    @Struct.type('docreateship')
    export class Docreateship extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64, {array: true})
        shipmodules!: UInt64[]
    }
    @Struct.type('dodemobilize')
    export class Dodemobilize extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64, {array: true})
        units!: UInt64[]
    }
    @Struct.type('dodevelop')
    export class Dodevelop extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('dodisband')
    export class Dodisband extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        unit_id!: UInt64
    }
    @Struct.type('dodisembark')
    export class Dodisembark extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('dodropoff')
    export class Dodropoff extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(PairUint32Uint64)
        items!: PairUint32Uint64
    }
    @Struct.type('doeat')
    export class Doeat extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('doembark')
    export class Doembark extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        vehicle_id!: UInt64
    }
    @Struct.type('doentership')
    export class Doentership extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        spaceship_id!: UInt64
    }
    @Struct.type('doequip')
    export class Doequip extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        gameasset_id!: UInt64
    }
    @Struct.type('dogive')
    export class Dogive extends Struct {
        @Struct.field(Name)
        owner!: Name
        @Struct.field(Name)
        recipient!: Name
        @Struct.field(PairUint32Uint64, {array: true})
        items!: PairUint32Uint64[]
    }
    @Struct.type('doheal')
    export class Doheal extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        patient_id!: UInt64
        @Struct.field('bool')
        is_character!: boolean
    }
    @Struct.type('dojoinbattle')
    export class Dojoinbattle extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        battle_id!: UInt64
    }
    @Struct.type('doland')
    export class Doland extends Struct {
        @Struct.field(UInt64)
        spaceship_id!: UInt64
        @Struct.field(UInt64)
        tile_id!: UInt64
    }
    @Struct.type('dolaunch')
    export class Dolaunch extends Struct {
        @Struct.field(UInt64)
        spaceship_id!: UInt64
    }
    @Struct.type('doleaveship')
    export class Doleaveship extends Struct {
        @Struct.field(Name)
        player!: Name
    }
    @Struct.type('doload')
    export class Doload extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        vehicle_id!: UInt64
        @Struct.field(PairUint32Uint64)
        items!: PairUint32Uint64
    }
    @Struct.type('domobilize')
    export class Domobilize extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64, {array: true})
        units!: UInt64[]
    }
    @Struct.type('domove')
    export class Domove extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        destination_tile_id!: UInt64
    }
    @Struct.type('domoveship')
    export class Domoveship extends Struct {
        @Struct.field(UInt64)
        spaceship_id!: UInt64
        @Struct.field(UInt64)
        tile_id!: UInt64
    }
    @Struct.type('dopayupkeep')
    export class Dopayupkeep extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt8)
        type!: UInt8
        @Struct.field(UInt64)
        entity!: UInt64
    }
    @Struct.type('dopickup')
    export class Dopickup extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(PairUint32Uint64)
        items!: PairUint32Uint64
    }
    @Struct.type('dorepair')
    export class Dorepair extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        entity_id!: UInt64
        @Struct.field(UInt8)
        type!: UInt8
    }
    @Struct.type('doresearch')
    export class Doresearch extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        technology_id!: UInt64
    }
    @Struct.type('doretreat')
    export class Doretreat extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        destination_tile_id!: UInt64
    }
    @Struct.type('dotrain')
    export class Dotrain extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt64)
        recipe_id!: UInt64
        @Struct.field('bool')
        mobilize!: boolean
    }
    @Struct.type('dotransfer')
    export class Dotransfer extends Struct {
        @Struct.field(UInt64)
        entity_id!: UInt64
        @Struct.field(UInt8)
        type!: UInt8
        @Struct.field(Name)
        new_owner!: Name
    }
    @Struct.type('dounequip')
    export class Dounequip extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt8)
        item_type!: UInt8
    }
    @Struct.type('dounload')
    export class Dounload extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        vehicle_id!: UInt64
        @Struct.field(PairUint32Uint64)
        items!: PairUint32Uint64
    }
    @Struct.type('dowork')
    export class Dowork extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt8)
        activity!: UInt8
    }
    @Struct.type('electresult')
    export class Electresult extends Struct {
        @Struct.field(UInt64)
        faction_id!: UInt64
        @Struct.field(UInt64)
        leader!: UInt64
        @Struct.field(UInt64, {array: true})
        officers!: UInt64[]
    }
    @Struct.type('endday')
    export class Endday extends Struct {}
    @Struct.type('endepoch')
    export class Endepoch extends Struct {}
    @Struct.type('faction')
    export class Faction extends Struct {
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
        @Struct.field(Day)
        day_stats!: Day
        @Struct.field(UInt64, {array: true})
        active_effects!: UInt64[]
    }
    @Struct.type('global')
    export class Global extends Struct {
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
        @Struct.field(Day)
        day_stats!: Day
        @Struct.field(Day)
        ind_day_stats!: Day
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
    export class Grantspoils extends Struct {
        @Struct.field(Name)
        beneficiary!: Name
        @Struct.field(UInt64)
        entity_id!: UInt64
        @Struct.field(UInt8)
        entity_type!: UInt8
    }
    @Struct.type('hashes')
    export class Hashes extends Struct {
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
    export class Init extends Struct {
        @Struct.field(UInt8)
        epoch!: UInt8
    }
    @Struct.type('joinfaction')
    export class Joinfaction extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        faction_id!: UInt64
    }
    @Struct.type('killchar')
    export class Killchar extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('map')
    export class Map extends Struct {
        @Struct.field(Name)
        area_map!: Name
        @Struct.field('string')
        name!: string
        @Struct.field(Name)
        code!: Name
        @Struct.field('string')
        asset_url!: string
        @Struct.field(Day)
        day_stats!: Day
        @Struct.field(UInt8)
        r_color!: UInt8
        @Struct.field(UInt8)
        g_color!: UInt8
        @Struct.field(UInt8)
        b_color!: UInt8
    }
    @Struct.type('msigsuccess')
    export class Msigsuccess extends Struct {
        @Struct.field(UInt64)
        squad_id!: UInt64
    }
    @Struct.type('pair_uint64_CrewRole')
    export class PairUint64CrewRole extends Struct {
        @Struct.field(UInt64)
        first!: UInt64
        @Struct.field(UInt8)
        second!: UInt8
    }
    @Struct.type('passenger')
    export class Passenger extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(UInt64)
        spaceship_id!: UInt64
    }
    @Struct.type('planet')
    export class Planet extends Struct {
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
        @Struct.field(Day)
        day_stats!: Day
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
    export class Player extends Struct {
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
        @Struct.field(Cooldown, {array: true})
        cooldowns!: Cooldown[]
        @Struct.field(UInt64)
        active_project!: UInt64
        @Struct.field(UInt64)
        faction!: UInt64
        @Struct.field(Float64)
        base_faction_voting_power!: Float64
        @Struct.field(UInt32)
        max_inventory_size!: UInt32
        @Struct.field(PairUint32Uint64, {array: true})
        inventory!: PairUint32Uint64[]
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
    export class Primarykey extends Struct {
        @Struct.field(Name)
        table!: Name
        @Struct.field(UInt64)
        next_key!: UInt64
    }
    @Struct.type('proc')
    export class Proc extends Struct {
        @Struct.field(UInt32)
        count!: UInt32
    }
    @Struct.type('project')
    export class Project extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(UInt64)
        blueprint_id!: UInt64
        @Struct.field(UInt64)
        location_tile_id!: UInt64
        @Struct.field(TimePoint)
        last_action_time!: TimePoint
        @Struct.field(PairUint32Uint64, {array: true})
        materials!: PairUint32Uint64[]
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
    export class Region extends Struct {
        @Struct.field(UInt64)
        id!: UInt64
        @Struct.field(Name)
        area_map!: Name
        @Struct.field('string')
        name!: string
        @Struct.field(Name)
        code!: Name
        @Struct.field(Day)
        day_stats!: Day
        @Struct.field(UInt64)
        control_faction!: UInt64
    }
    @Struct.type('regplayer')
    export class Regplayer extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field('bool')
        opt_out_of_politics!: boolean
    }
    @Struct.type('resolverngs')
    export class Resolverngs extends Struct {
        @Struct.field(UInt32)
        count!: UInt32
    }
    @Struct.type('resource')
    export class Resource extends Struct {
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
    export class Restorehp extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
    }
    @Struct.type('revivechar')
    export class Revivechar extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(Name)
        payer!: Name
    }
    @Struct.type('rngrequest')
    export class Rngrequest extends Struct {
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
    export class Rprog extends Struct {
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
    export class Setcharacter extends Struct {
        @Struct.field(Character)
        c!: Character
    }
    @Struct.type('setcrew')
    export class Setcrew extends Struct {
        @Struct.field(UInt64)
        spaceship_id!: UInt64
        @Struct.field(PairUint64CrewRole, {array: true})
        crew!: PairUint64CrewRole[]
    }
    @Struct.type('setgm')
    export class Setgm extends Struct {
        @Struct.field(Name)
        player!: Name
    }
    @Struct.type('setoperator')
    export class Setoperator extends Struct {
        @Struct.field(UInt64)
        spaceship_id!: UInt64
        @Struct.field(Name)
        ship_operator!: Name
    }
    @Struct.type('setplayer')
    export class Setplayer extends Struct {
        @Struct.field(Player)
        p!: Player
    }
    @Struct.type('settilecw')
    export class Settilecw extends Struct {
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
    export class Shipmodule extends Struct {
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
    export class Spaceship extends Struct {
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
        @Struct.field(PairUint32Uint64, {array: true})
        inventory!: PairUint32Uint64[]
    }
    @Struct.type('squad')
    export class Squad extends Struct {
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
    export class Startepoch extends Struct {}
    @Struct.type('terrain')
    export class Terrain extends Struct {
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
    export class Test extends Struct {}
    @Struct.type('tile')
    export class Tile extends Struct {
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
        @Struct.field(PairUint32Uint64, {array: true})
        inventory!: PairUint32Uint64[]
        @Struct.field(UInt64, {array: true})
        active_effects!: UInt64[]
        @Struct.field(UInt32)
        garrisoned_units!: UInt32
    }
    @Struct.type('timedeffect')
    export class Timedeffect extends Struct {
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
    export class Tokenize extends Struct {
        @Struct.field(Name)
        player!: Name
        @Struct.field(Asset)
        resource!: Asset
    }
    @Struct.type('unit')
    export class Unit extends Struct {
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
    export class Updatechars extends Struct {
        @Struct.field(UInt32)
        count!: UInt32
    }
    @Struct.type('updaterng')
    export class Updaterng extends Struct {}
    @Struct.type('updatetile')
    export class Updatetile extends Struct {
        @Struct.field(UInt64)
        tile_id!: UInt64
    }
    @Struct.type('updatetiles')
    export class Updatetiles extends Struct {
        @Struct.field(UInt32)
        count!: UInt32
    }
    @Struct.type('upgradechar')
    export class Upgradechar extends Struct {
        @Struct.field(UInt64)
        character_id!: UInt64
        @Struct.field(UInt8)
        new_role!: UInt8
    }
    @Struct.type('vehicle')
    export class Vehicle extends Struct {
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
        @Struct.field(PairUint32Uint64, {array: true})
        inventory!: PairUint32Uint64[]
    }
}
const TableMap = {
    battles: Types.Battle,
    battleunits: Types.Battleunit,
    buildings: Types.Building,
    characters: Types.Character,
    chareffects: Types.Timedeffect,
    combatants: Types.Combatant,
    crews: Types.Crew,
    deposits: Types.Deposit,
    factions: Types.Faction,
    global: Types.Global,
    hashes: Types.Hashes,
    maps: Types.Map,
    passengers: Types.Passenger,
    planets: Types.Planet,
    players: Types.Player,
    primarykeys: Types.Primarykey,
    projects: Types.Project,
    regions: Types.Region,
    resources: Types.Resource,
    rngrequests: Types.Rngrequest,
    rprogs: Types.Rprog,
    shipmodules: Types.Shipmodule,
    spaceships: Types.Spaceship,
    squads: Types.Squad,
    terrains: Types.Terrain,
    tileeffects: Types.Timedeffect,
    tiles: Types.Tile,
    units: Types.Unit,
    vehicles: Types.Vehicle,
}