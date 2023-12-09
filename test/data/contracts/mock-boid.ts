import type {
    Action,
    BytesType,
    Int32Type,
    NameType,
    PublicKeyType,
    SignatureType,
    UInt16Type,
    UInt32Type,
    UInt64Type,
    UInt8Type,
} from '@wharfkit/antelope'
import {
    ABI,
    Asset,
    Blob,
    Bytes,
    Float32,
    Float64,
    Int16,
    Int32,
    Int64,
    Int8,
    Name,
    PublicKey,
    Signature,
    Struct,
    UInt16,
    UInt32,
    UInt64,
    UInt8,
    Variant,
} from '@wharfkit/antelope'
import type {ActionOptions, ContractArgs, PartialBy, Table} from '@wharfkit/contract'
import {Contract as BaseContract} from '@wharfkit/contract'
export const abiBlob = Blob.from(
    'DmVvc2lvOjphYmkvMS4yAGQHQWNjb3VudAAKB2JvaWRfaWQEbmFtZQZvd25lcnMGbmFtZVtdBGF1dGgLQWNjb3VudEF1dGgIc3BvbnNvcnMGbmFtZVtdBXN0YWtlDEFjY291bnRTdGFrZQVwb3dlcgxBY2NvdW50UG93ZXIEdGVhbQtBY2NvdW50VGVhbQdiYWxhbmNlBnVpbnQzMgtuZnRfYmFsYW5jZQZ1aW50MTYLcmVjb3ZlcmFibGUEYm9vbAtBY2NvdW50QXV0aAACBGtleXMMcHVibGljX2tleVtdBW5vbmNlBXVpbnQ4DkFjY291bnRCb29zdGVyAAQOcHdyX211bHRpcGxpZXIFdWludDgRcHdyX2FkZF9wZXJfcm91bmQGdWludDE2DWV4cGlyZXNfcm91bmQGdWludDE2F2FnZ3JlZ2F0ZV9wd3JfcmVtYWluaW5nBnVpbnQzMg1BY2NvdW50Q3JlYXRlAAMHYm9pZF9pZARuYW1lBGtleXMMcHVibGljX2tleVtdBm93bmVycwZuYW1lW10MQWNjb3VudFBvd2VyAAUSbGFzdF9jbGFpbWVkX3JvdW5kBnVpbnQxNhBsYXN0X2FkZGVkX3JvdW5kBnVpbnQxNgZyYXRpbmcGdWludDMyB2hpc3RvcnkIdWludDE2W10EbW9kcxBBY2NvdW50Qm9vc3RlcltdDEFjY291bnRTdGFrZQADCXVuc3Rha2luZw5Ub2tlblVuc3Rha2VbXQtzZWxmX3N0YWtlZAZ1aW50MzIYcmVjZWl2ZWRfZGVsZWdhdGVkX3N0YWtlBnVpbnQxNgtBY2NvdW50VGVhbQAEB3RlYW1faWQFdWludDgPbGFzdF9lZGl0X3JvdW5kBnVpbnQxNg10ZWFtX3RheF9tdWx0BXVpbnQ4HHRlYW1fY3VtdWxhdGl2ZV9jb250cmlidXRpb24GdWludDMyCEFjY3RNZXRhAAIHYm9pZF9pZARuYW1lBG1ldGEFYnl0ZXMGQWN0aW9uAAQHYWNjb3VudARuYW1lBG5hbWUEbmFtZQ1hdXRob3JpemF0aW9uEVBlcm1pc3Npb25MZXZlbFtdBGRhdGEFYnl0ZXMPQXRvbWljQXR0cmlidXRlAAIDa2V5BnN0cmluZwV2YWx1ZQtBdG9taWNWYWx1ZQxBdG9taWNGb3JtYXQAAgRuYW1lBnN0cmluZwR0eXBlBnN0cmluZwRBdXRoAAEMYm9pZF9pZF9hdXRoBG5hbWUHQm9vc3RlcgAFBm1vZF9pZAV1aW50OA5wd3JfbXVsdGlwbGllcgV1aW50OBFwd3JfYWRkX3Blcl9yb3VuZAZ1aW50MTYbZXhwaXJlX2FmdGVyX2VsYXBzZWRfcm91bmRzBnVpbnQxNhZhZ2dyZWdhdGVfcHdyX2NhcGFjaXR5BnVpbnQzMgZDb25maWcADAdhY2NvdW50DUNvbmZpZ0FjY291bnQFcG93ZXILQ29uZmlnUG93ZXIEbWludApDb25maWdNaW50BHRlYW0KQ29uZmlnVGVhbQVzdGFrZQtDb25maWdTdGFrZQR0aW1lCkNvbmZpZ1RpbWUEYXV0aApDb25maWdBdXRoA25mdAlDb25maWdOZnQGcGF1c2VkBGJvb2wOYWxsb3dfZGVwb3NpdHMEYm9vbBFhbGxvd193aXRoZHJhd2FscwRib29sD3JlY292ZXJ5QWNjb3VudARuYW1lDUNvbmZpZ0FjY291bnQACQxpbnZpdGVfcHJpY2UGdWludDMyFnByZW1pdW1fcHVyY2hhc2VfcHJpY2UGdWludDMyEm1heF9wcmVtaXVtX3ByZWZpeAV1aW50OAptYXhfb3duZXJzBXVpbnQ4DG1heF9ib29zdGVycwV1aW50OBBzdWZmaXhfd2hpdGVsaXN0Bm5hbWVbXRRyZW1vdmVfc3BvbnNvcl9wcmljZQZ1aW50MzIYc3BvbnNvcl9tYXhfaW52aXRlX2NvZGVzBXVpbnQ4GWludml0ZV9jb2RlX2V4cGlyZV9yb3VuZHMGdWludDE2CkNvbmZpZ0F1dGgABRVrZXlfYWN0aW9uc193aGl0ZWxpc3QGbmFtZVtdFWtleV9hY2NvdW50X21heF9zdGFrZQZ1aW50MzIXa2V5X2FjY291bnRfbWF4X2JhbGFuY2UGdWludDMyEGFjY291bnRfbWF4X2tleXMFdWludDgad29ya2VyX21heF9iaWxsX3Blcl9hY3Rpb24GdWludDMyCkNvbmZpZ01pbnQAAhhyb3VuZF9wb3dlcmVkX3N0YWtlX211bHQHZmxvYXQzMhByb3VuZF9wb3dlcl9tdWx0B2Zsb2F0MzIJQ29uZmlnTmZ0AAIUYm9pZF9pZF9tYXhpbXVtX25mdHMGdWludDE2FXdoaXRlbGlzdF9jb2xsZWN0aW9ucwZuYW1lW10LQ29uZmlnUG93ZXIABRBzcG9uc29yX3RheF9tdWx0B2Zsb2F0MzIScG93ZXJlZF9zdGFrZV9tdWx0B2Zsb2F0MzIcY2xhaW1fbWF4aW11bV9lbGFwc2VkX3JvdW5kcwZ1aW50MTYQc29mdF9tYXhfcHdyX2FkZAZ1aW50MTYUaGlzdG9yeV9zbG90c19sZW5ndGgFdWludDgLQ29uZmlnU3Rha2UAAg51bnN0YWtlX3JvdW5kcwV1aW50OB1leHRyYV9zdGFrZV9taW5fbG9ja2VkX3JvdW5kcwV1aW50OApDb25maWdUZWFtAAYRY2hhbmdlX21pbl9yb3VuZHMGdWludDE2FGVkaXRfdGVhbV9taW5fcm91bmRzBnVpbnQxNhh0ZWFtX2VkaXRfbWF4X3BjdF9jaGFuZ2UGdWludDE2DWJ1eV90ZWFtX2Nvc3QGdWludDMyFG93bmVyX3N0YWtlX3JlcXVpcmVkBnVpbnQzMidvd25lcl9mdXR1cmVfc3Rha2VfbG9ja19yb3VuZHNfcmVxdWlyZWQGdWludDE2CkNvbmZpZ1RpbWUAAhxyb3VuZHNfc3RhcnRfc2VjX3NpbmNlX2Vwb2NoBnVpbnQzMhByb3VuZF9sZW5ndGhfc2VjBnVpbnQzMg5FeHRlbmRlZFN5bWJvbAACA3N5bQZzeW1ib2wIY29udHJhY3QEbmFtZQZHbG9iYWwAAwpjaGFpbl9uYW1lBG5hbWULdG90YWxfcG93ZXIGdWludDY0G2xhc3RfaW5mbGF0aW9uX2FkanVzdF9yb3VuZAZ1aW50MTYGSW52aXRlAAMLaW52aXRlX2NvZGUGdWludDY0A2tleQpwdWJsaWNfa2V5DWNyZWF0ZWRfcm91bmQGdWludDE2B01pbnRMb2cABwpwb3dlcl9taW50BnVpbnQzMhJwb3dlcmVkX3N0YWtlX21pbnQGdWludDMyDmFjY291bnRfZWFybmVkBnVpbnQzMgh0ZWFtX2N1dAZ1aW50MzIRdGVhbV9vd25lcl9lYXJuZWQGdWludDMyDm92ZXJzdGFrZV9taW50BnVpbnQzMgV0b3RhbAZ1aW50MzIDTkZUAAIIYXNzZXRfaWQGdWludDY0EmxvY2tlZF91bnRpbF9yb3VuZAZ1aW50MTYHTkZUTWludAACFW1pbnRfcmVjZWl2ZXJfYm9pZF9pZARuYW1lF21pbnRfcXVhbnRpdHlfcmVtYWluaW5nBnVpbnQxNglOZnRBY3Rpb24ABw9jb2xsZWN0aW9uX25hbWUEbmFtZQtzY2hlbWFfbmFtZQRuYW1lC3RlbXBsYXRlX2lkBWludDMyGm1hdGNoX2ltbXV0YWJsZV9hdHRyaWJ1dGVzEUF0b21pY0F0dHJpYnV0ZVtdGG1hdGNoX211dGFibGVfYXR0cmlidXRlcxFBdG9taWNBdHRyaWJ1dGVbXQRidXJuBGJvb2wLbG9ja19yb3VuZHMGdWludDE2B05mdE1pbnQABhBtaW50X3RlbXBsYXRlX2lkBWludDMyEG1pbnRfc2NoZW1hX25hbWUEbmFtZRRtaW50X2NvbGxlY3Rpb25fbmFtZQRuYW1lDmltbXV0YWJsZV9kYXRhEUF0b21pY0F0dHJpYnV0ZVtdDG11dGFibGVfZGF0YRFBdG9taWNBdHRyaWJ1dGVbXQhxdWFudGl0eQV1aW50OAVPZmZlcgAGCG9mZmVyX2lkBnVpbnQ2NAxyZXF1aXJlbWVudHMRT2ZmZXJSZXF1aXJlbWVudHMHYWN0aW9ucwtPZmZlckFjdGlvbgdyZXdhcmRzDE9mZmVyUmV3YXJkcwZsaW1pdHMLT2ZmZXJMaW1pdHMNdG90YWxfY2xhaW1lZAZ1aW50MzILT2ZmZXJBY3Rpb24ABA9kZWxlZ2F0ZWRfc3Rha2UGdWludDE2HnN0YWtlX2xvY2tlZF9hZGRpdGlvbmFsX3JvdW5kcwZ1aW50MTYLbmZ0X2FjdGlvbnMLTmZ0QWN0aW9uW10PYmFsYW5jZV9wYXltZW50BnVpbnQzMgtPZmZlckxpbWl0cwACGG9mZmVyX3F1YW50aXR5X3JlbWFpbmluZwZ1aW50MzIVYXZhaWxhYmxlX3VudGlsX3JvdW5kBnVpbnQxNhFPZmZlclJlcXVpcmVtZW50cwAFB3RlYW1faWQFYnl0ZXMJbWluX3Bvd2VyBnVpbnQxNgttaW5fYmFsYW5jZQZ1aW50MzIJbWluX3N0YWtlBnVpbnQzMiBtaW5fY3VtdWxhdGl2ZV90ZWFtX2NvbnRyaWJ1dGlvbgZ1aW50MzIMT2ZmZXJSZXdhcmRzAAUJbmZ0X21pbnRzCU5mdE1pbnRbXQ9iYWxhbmNlX2RlcG9zaXQGdWludDMyD2RlbGVnYXRlZF9zdGFrZQZ1aW50MTYec3Rha2VfbG9ja2VkX2FkZGl0aW9uYWxfcm91bmRzBnVpbnQxNhVhY3RpdmF0ZV9wb3dlcm1vZF9pZHMFYnl0ZXMPUGVybWlzc2lvbkxldmVsAAIFYWN0b3IEbmFtZQpwZXJtaXNzaW9uBG5hbWUNUG93ZXJDbGFpbUxvZwAEBmJlZm9yZQZ1aW50MzIFYWZ0ZXIGdWludDMyDWZyb21fYm9vc3RlcnMGdWludDMyDmVsYXBzZWRfcm91bmRzBnVpbnQxNgdTcG9uc29yAAYPc3BvbnNvcl9ib2lkX2lkBG5hbWUPaW52aXRlc19iYWxhbmNlBnVpbnQxNhZpbnZpdGVfY29kZXNfdW5jbGFpbWVkBnVpbnQxNhRpbnZpdGVfY29kZXNfY2xhaW1lZAZ1aW50MzISc3BvbnNvcmVkX3VwZ3JhZGVzBnVpbnQzMhV1cGdyYWRlc190b3RhbF9lYXJuZWQGdWludDMyBVN0YWtlAAUIc3Rha2VfaWQGdWludDY0DGZyb21fYm9pZF9pZARuYW1lCnRvX2JvaWRfaWQEbmFtZQ5zdGFrZV9xdWFudGl0eQZ1aW50MTYSbG9ja2VkX3VudGlsX3JvdW5kBnVpbnQxNgRUZWFtAAwHdGVhbV9pZAZ1aW50MTYHYmFsYW5jZQZ1aW50MzIFc3Rha2UMQWNjb3VudFN0YWtlBW93bmVyBG5hbWUIbWFuYWdlcnMGbmFtZVtdEG1pbl9wd3JfdGF4X211bHQFdWludDgOb3duZXJfY3V0X211bHQFdWludDgNdXJsX3NhZmVfbmFtZQZzdHJpbmcFcG93ZXIGdWludDY0B21lbWJlcnMGdWludDMyD2xhc3RfZWRpdF9yb3VuZAZ1aW50MTYEbWV0YQVieXRlcwxUb2tlblVuc3Rha2UAAhZyZWRlZW1hYmxlX2FmdGVyX3JvdW5kBnVpbnQxNghxdWFudGl0eQZ1aW50MzILYWNjb3VudC5hZGQABAdib2lkX2lkBG5hbWUGb3duZXJzBm5hbWVbXQhzcG9uc29ycwZuYW1lW10Ea2V5cwxwdWJsaWNfa2V5W10LYWNjb3VudC5idXkAAg1wYXllcl9ib2lkX2lkBG5hbWULbmV3X2FjY291bnQNQWNjb3VudENyZWF0ZQxhY2NvdW50LmVkaXQAAgdib2lkX2lkBG5hbWUEbWV0YQVieXRlcwxhY2NvdW50LmZyZWUAAQdib2lkX2lkBG5hbWULYWNjb3VudC5tb2QAAgdib2lkX2lkBG5hbWUYcmVjZWl2ZWRfZGVsZWdhdGVkX3N0YWtlBnVpbnQxNgphY2NvdW50LnJtAAEHYm9pZF9pZARuYW1lDGFjY291bnRzLmNscgAABGF1dGgABQdib2lkX2lkBG5hbWUHYWN0aW9ucwhBY3Rpb25bXQNzaWcJc2lnbmF0dXJlCGtleUluZGV4BWludDMyD2V4cGlyZXNfdXRjX3NlYwZ1aW50MzILYXV0aC5hZGRrZXkAAgdib2lkX2lkBG5hbWUDa2V5CnB1YmxpY19rZXkKYXV0aC5jbGVhcgAACWF1dGguaW5pdAAACmF1dGgucm1rZXkAAgdib2lkX2lkBG5hbWUIa2V5SW5kZXgFaW50MzILYm9vc3Rlci5hZGQAAgdib2lkX2lkBG5hbWUGbW9kX2lkBXVpbnQ4C2Jvb3N0ZXIubmV3AAEDbW9kB0Jvb3N0ZXIKYm9vc3Rlci5ybQACB2JvaWRfaWQEbmFtZQ1ib29zdGVyX2luZGV4B2ludDMyW10MY29uZmlnLmNsZWFyAAAKY29uZmlnLnNldAABBmNvbmZpZwZDb25maWcMZ2xvYmFsLmNoYWluAAEKY2hhaW5fbmFtZQRuYW1lDGdsb2JhbC5jbGVhcgAACmdsb2JhbC5zZXQAAQpnbG9iYWxEYXRhBkdsb2JhbAxpbnRlcm5hbHhmZXIABAxmcm9tX2JvaWRfaWQEbmFtZQp0b19ib2lkX2lkBG5hbWUIcXVhbnRpdHkGdWludDMyBG1lbW8Gc3RyaW5nCmludml0ZS5hZGQAAwdib2lkX2lkBG5hbWULaW52aXRlX2NvZGUGdWludDY0A2tleQpwdWJsaWNfa2V5Cmludml0ZS5idXkAAgdib2lkX2lkBG5hbWUIcXVhbnRpdHkGdWludDE2DGludml0ZS5jbGFpbQAED3Nwb25zb3JfYm9pZF9pZARuYW1lC2ludml0ZV9jb2RlBnVpbnQ2NANzaWcJc2lnbmF0dXJlC25ld19hY2NvdW50DUFjY291bnRDcmVhdGUJaW52aXRlLnJtAAIPc3BvbnNvcl9ib2lkX2lkBG5hbWULaW52aXRlX2NvZGUGdWludDY0CWxvZ3B3cmFkZAAGB2JvaWRfaWQEbmFtZQhyZWNlaXZlZAZ1aW50MTYOZnJvbV9tdWx0X21vZHMGdWludDE2E2RpdmVydGVkX3RvX3Nwb25zb3IGdWludDE2D3Bvd2VyX2luY3JlYXNlZAZ1aW50MTYFb3JpZ24EbmFtZQtsb2dwd3JjbGFpbQADB2JvaWRfaWQEbmFtZQVwb3dlcg1Qb3dlckNsYWltTG9nBG1pbnQHTWludExvZwptZXRhLmNsZWFuAAAEbWludAACAnRvBG5hbWUOd2hvbGVfcXVhbnRpdHkGdWludDMyCG5mdC5sb2NrAAMHYm9pZF9pZARuYW1lCGFzc2V0X2lkBnVpbnQ2NBJsb2NrZWRfdW50aWxfcm91bmQGdWludDE2DG5mdC5yZWNlaXZlcgACB2JvaWRfaWQEbmFtZQ1taW50X3F1YW50aXR5BnVpbnQxNgxuZnQud2l0aGRyYXcAAwdib2lkX2lkBG5hbWUJYXNzZXRfaWRzCHVpbnQ2NFtdAnRvBG5hbWUIbmZ0LnhmZXIAAwxmcm9tX2JvaWRfaWQEbmFtZQp0b19ib2lkX2lkBG5hbWUJYXNzZXRfaWRzCHVpbnQ2NFtdCW9mZmVyLmFkZAAEDHJlcXVpcmVtZW50cxFPZmZlclJlcXVpcmVtZW50cwdhY3Rpb25zC09mZmVyQWN0aW9uB3Jld2FyZHMMT2ZmZXJSZXdhcmRzBmxpbWl0cwtPZmZlckxpbWl0cwtvZmZlci5jbGFpbQADB2JvaWRfaWQEbmFtZQhvZmZlcl9pZAZ1aW50NjQXcmVxdWlyZWRfbmZ0X2FjdGlvbl9pZHMIdWludDY0W10Lb2ZmZXIuY2xlYW4AAAhvZmZlci5ybQABCG9mZmVyX2lkBnVpbnQ2NAlvd25lci5hZGQAAgdib2lkX2lkBG5hbWUFb3duZXIEbmFtZQhvd25lci5ybQACB2JvaWRfaWQEbmFtZQVvd25lcgRuYW1lCXBvd2VyLmFkZAACB2JvaWRfaWQEbmFtZQVwb3dlcgZ1aW50MTYLcG93ZXIuY2xhaW0AAQdib2lkX2lkBG5hbWUMcm1kZWxlZ3N0YWtlAAEIc3Rha2VfaWQGdWludDY0CnNwb25zb3Iucm0AAQ9zcG9uc29yX2JvaWRfaWQEbmFtZQtzcG9uc29yLnNldAABA3JvdwdTcG9uc29yBXN0YWtlAAIHYm9pZF9pZARuYW1lCHF1YW50aXR5BnVpbnQzMgtzdGFrZS5kZWxlZwAEDGZyb21fYm9pZF9pZARuYW1lCnRvX2JvaWRfaWQEbmFtZQ5zdGFrZV9xdWFudGl0eQZ1aW50MTYQbG9ja191bnRpbF9yb3VuZAZ1aW50MTYLdGVhbS5jaGFuZ2UAAwdib2lkX2lkBG5hbWULbmV3X3RlYW1faWQFdWludDgQbmV3X3B3cl90YXhfbXVsdAV1aW50OAt0ZWFtLmNyZWF0ZQAEBW93bmVyBG5hbWUQbWluX3B3cl90YXhfbXVsdAV1aW50OA5vd25lcl9jdXRfbXVsdAV1aW50OA11cmxfc2FmZV9uYW1lBnN0cmluZwl0ZWFtLmVkaXQABwd0ZWFtX2lkBXVpbnQ4BW93bmVyBG5hbWUIbWFuYWdlcnMGbmFtZVtdEG1pbl9wd3JfdGF4X211bHQFdWludDgOb3duZXJfY3V0X211bHQFdWludDgNdXJsX3NhZmVfbmFtZQZzdHJpbmcEbWV0YQVieXRlcwd0ZWFtLnJtAAEHdGVhbV9pZAV1aW50OAt0ZWFtLnNldG1lbQACB3RlYW1faWQFdWludDgLbmV3X21lbWJlcnMGdWludDMyC3RlYW0uc2V0cHdyAAIHdGVhbV9pZAV1aW50OAluZXdfcG93ZXIGdWludDMyDHRlYW0udGF4cmF0ZQACB2JvaWRfaWQEbmFtZRBuZXdfcHdyX3RheF9tdWx0BXVpbnQ4CXRoaXNyb3VuZAAAC3Vuc3Rha2UuZW5kAAEHYm9pZF9pZARuYW1lDHVuc3Rha2UuaW5pdAACB2JvaWRfaWQEbmFtZQhxdWFudGl0eQZ1aW50MzIMdW5zdGFrZS5zdG9wAAEHYm9pZF9pZARuYW1lDHVuc3RrZS5kZWxlZwABCHN0YWtlX2lkBnVpbnQ2NAh3aXRoZHJhdwADB2JvaWRfaWQEbmFtZQhxdWFudGl0eQZ1aW50MzICdG8EbmFtZTsAUjIgT00RMgthY2NvdW50LmFkZAAAvD4gT00RMgthY2NvdW50LmJ1eQCQXVIgT00RMgxhY2NvdW50LmVkaXQAoNRdIE9NETIMYWNjb3VudC5mcmVlAAASlSBPTREyC2FjY291bnQubW9kAACAvCBPTREyCmFjY291bnQucm0AcCMCOE9NETIMYWNjb3VudHMuY2xyAAAAAAAA0LI2BGF1dGgAALyCKRnQsjYLYXV0aC5hZGRrZXkAAMA1KiLQsjYKYXV0aC5jbGVhcgAAAMhuOtCyNglhdXRoLmluaXQAAIBXUF7QsjYKYXV0aC5ybWtleQAAUjLgqowpPQtib29zdGVyLmFkZAAAuJrgqowpPQtib29zdGVyLm5ldwAAgLzgqowpPQpib29zdGVyLnJtAHCNiggwtyZFDGNvbmZpZy5jbGVhcgAAQFYYMLcmRQpjb25maWcuc2V0ADCdaQhEc2hkDGdsb2JhbC5jaGFpbgBwjYoIRHNoZAxnbG9iYWwuY2xlYXIAAEBWGERzaGQKZ2xvYmFsLnNldABw1erRzKvydAxpbnRlcm5hbHhmZXIAAEBKBqjs9nQKaW52aXRlLmFkZAAAgNcHqOz2dAppbnZpdGUuYnV5ACCdiQio7PZ0DGludml0ZS5jbGFpbQAAAJAXqOz2dAlpbnZpdGUucm0AAABIyVxeGY0JbG9ncHdyYWRkAACkMxFdXhmNC2xvZ3B3cmNsYWltAADANCoiYLKSCm1ldGEuY2xlYW4AAAAAAACQp5MEbWludAAAAAAQ0QjymghuZnQubG9jawBw1XYKqQvymgxuZnQucmVjZWl2ZXIAwM1NLTsO8poMbmZ0LndpdGhkcmF3AAAAAFetDvKaCG5mdC54ZmVyAAAASMmAq9aiCW9mZmVyLmFkZAAApDMRgavWogtvZmZlci5jbGFpbQAAplERgavWogtvZmZlci5jbGVhbgAAAADygqvWoghvZmZlci5ybQAAAEjJgKsmpwlvd25lci5hZGQAAAAA8oKrJqcIb3duZXIucm0AAABIyYCrOK0JcG93ZXIuYWRkAACkMxGBqzitC3Bvd2VyLmNsYWltAKCgyZipqJK8DHJtZGVsZWdzdGFrZQAAgLzgUjxpxQpzcG9uc29yLnJtAACywuBSPGnFC3Nwb25zb3Iuc2V0AAAAAAAABU3GBXN0YWtlAACYiioBBU3GC3N0YWtlLmRlbGVnAAAUm6YhII3KC3RlYW0uY2hhbmdlAABUNuoiII3KC3RlYW0uY3JlYXRlAAAAyC4pII3KCXRlYW0uZWRpdAAAAABAXiCNygd0ZWFtLnJtAACkkllhII3KC3RlYW0uc2V0bWVtAAAur1lhII3KC3RlYW0uc2V0cHdyAKCyud1kII3KDHRlYW0udGF4cmF0ZQAAAEhT04tdywl0aGlzcm91bmQAANJUQEGT8dQLdW5zdGFrZS5lbmQAkN10QEGT8dQMdW5zdGFrZS5pbml0AFBpxkBBk/HUDHVuc3Rha2Uuc3RvcADAVFQJKJjx1Ax1bnN0a2UuZGVsZWcAAAAA3NzUsuMId2l0aGRyYXcADQAAADhPTREyA2k2NAAAB0FjY291bnQAAAAmK5kRMgNpNjQAAAhBY2N0TWV0YQAAAAAA0LI2A2k2NAAABEF1dGgAAAD4qowpPQNpNjQAAAdCb29zdGVyAAAAADC3JkUDaTY0AAAGQ29uZmlnAAAAAERzaGQDaTY0AAAGR2xvYmFsAAAAAKvs9nQDaTY0AAAGSW52aXRlAAAAIE8n85oDaTY0AAAHTkZUTWludAAAAAAAgPOaA2k2NAAAA05GVAAAAADgq9aiA2k2NAAABU9mZmVyAAAA+FI8acUDaTY0AAAHU3BvbnNvcgAAAABgBU3GA2k2NAAABVN0YWtlAAAAAAAsjcoDaTY0AAAEVGVhbQAAAAELQXRvbWljVmFsdWUWBGludDgFaW50MTYFaW50MzIFaW50NjQFdWludDgGdWludDE2BnVpbnQzMgZ1aW50NjQHZmxvYXQzMgdmbG9hdDY0BnN0cmluZwZpbnQ4W10HaW50MTZbXQdpbnQzMltdB2ludDY0W10FYnl0ZXMIdWludDE2W10IdWludDMyW10IdWludDY0W10JZmxvYXQzMltdCWZsb2F0NjRbXQhzdHJpbmdbXQA='
)
export const abi = ABI.from(abiBlob)
export class Contract extends BaseContract {
    constructor(args: PartialBy<ContractArgs, 'abi' | 'account'>) {
        super({
            client: args.client,
            abi: abi,
            account: Name.from('boid'),
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
    'account.add': ActionParams.AccountAdd
    'account.buy': ActionParams.AccountBuy
    'account.edit': ActionParams.AccountEdit
    'account.free': ActionParams.AccountFree
    'account.mod': ActionParams.AccountMod
    'account.rm': ActionParams.AccountRm
    'accounts.clr': ActionParams.AccountsClr
    auth: ActionParams.Auth
    'auth.addkey': ActionParams.AuthAddkey
    'auth.clear': ActionParams.AuthClear
    'auth.init': ActionParams.AuthInit
    'auth.rmkey': ActionParams.AuthRmkey
    'booster.add': ActionParams.BoosterAdd
    'booster.new': ActionParams.BoosterNew
    'booster.rm': ActionParams.BoosterRm
    'config.clear': ActionParams.ConfigClear
    'config.set': ActionParams.ConfigSet
    'global.chain': ActionParams.GlobalChain
    'global.clear': ActionParams.GlobalClear
    'global.set': ActionParams.GlobalSet
    internalxfer: ActionParams.Internalxfer
    'invite.add': ActionParams.InviteAdd
    'invite.buy': ActionParams.InviteBuy
    'invite.claim': ActionParams.InviteClaim
    'invite.rm': ActionParams.InviteRm
    logpwradd: ActionParams.Logpwradd
    logpwrclaim: ActionParams.Logpwrclaim
    'meta.clean': ActionParams.MetaClean
    mint: ActionParams.Mint
    'nft.lock': ActionParams.NftLock
    'nft.receiver': ActionParams.NftReceiver
    'nft.withdraw': ActionParams.NftWithdraw
    'nft.xfer': ActionParams.NftXfer
    'offer.add': ActionParams.OfferAdd
    'offer.claim': ActionParams.OfferClaim
    'offer.clean': ActionParams.OfferClean
    'offer.rm': ActionParams.OfferRm
    'owner.add': ActionParams.OwnerAdd
    'owner.rm': ActionParams.OwnerRm
    'power.add': ActionParams.PowerAdd
    'power.claim': ActionParams.PowerClaim
    rmdelegstake: ActionParams.Rmdelegstake
    'sponsor.rm': ActionParams.SponsorRm
    'sponsor.set': ActionParams.SponsorSet
    stake: ActionParams.Stake
    'stake.deleg': ActionParams.StakeDeleg
    'team.change': ActionParams.TeamChange
    'team.create': ActionParams.TeamCreate
    'team.edit': ActionParams.TeamEdit
    'team.rm': ActionParams.TeamRm
    'team.setmem': ActionParams.TeamSetmem
    'team.setpwr': ActionParams.TeamSetpwr
    'team.taxrate': ActionParams.TeamTaxrate
    thisround: ActionParams.Thisround
    'unstake.end': ActionParams.UnstakeEnd
    'unstake.init': ActionParams.UnstakeInit
    'unstake.stop': ActionParams.UnstakeStop
    'unstke.deleg': ActionParams.UnstkeDeleg
    withdraw: ActionParams.Withdraw
}
export namespace ActionParams {
    export interface AccountAdd {
        boid_id: NameType
        owners: NameType[]
        sponsors: NameType[]
        keys: PublicKeyType[]
    }
    export interface AccountBuy {
        payer_boid_id: NameType
        new_account: Types.AccountCreate
    }
    export interface AccountEdit {
        boid_id: NameType
        meta: BytesType
    }
    export interface AccountFree {
        boid_id: NameType
    }
    export interface AccountMod {
        boid_id: NameType
        received_delegated_stake: UInt16Type
    }
    export interface AccountRm {
        boid_id: NameType
    }
    export interface AccountsClr {}
    export interface Auth {
        boid_id: NameType
        actions: Types.Action[]
        sig: SignatureType
        keyindex: Int32Type
        expires_utc_sec: UInt32Type
    }
    export interface AuthAddkey {
        boid_id: NameType
        key: PublicKeyType
    }
    export interface AuthClear {}
    export interface AuthInit {}
    export interface AuthRmkey {
        boid_id: NameType
        keyindex: Int32Type
    }
    export interface BoosterAdd {
        boid_id: NameType
        mod_id: UInt8Type
    }
    export interface BoosterNew {
        mod: Types.Booster
    }
    export interface BoosterRm {
        boid_id: NameType
        booster_index: Int32Type[]
    }
    export interface ConfigClear {}
    export interface ConfigSet {
        config: Types.Config
    }
    export interface GlobalChain {
        chain_name: NameType
    }
    export interface GlobalClear {}
    export interface GlobalSet {
        globaldata: Types.Global
    }
    export interface Internalxfer {
        from_boid_id: NameType
        to_boid_id: NameType
        quantity: UInt32Type
        memo: string
    }
    export interface InviteAdd {
        boid_id: NameType
        invite_code: UInt64Type
        key: PublicKeyType
    }
    export interface InviteBuy {
        boid_id: NameType
        quantity: UInt16Type
    }
    export interface InviteClaim {
        sponsor_boid_id: NameType
        invite_code: UInt64Type
        sig: SignatureType
        new_account: Types.AccountCreate
    }
    export interface InviteRm {
        sponsor_boid_id: NameType
        invite_code: UInt64Type
    }
    export interface Logpwradd {
        boid_id: NameType
        received: UInt16Type
        from_mult_mods: UInt16Type
        diverted_to_sponsor: UInt16Type
        power_increased: UInt16Type
        orign: NameType
    }
    export interface Logpwrclaim {
        boid_id: NameType
        power: Types.PowerClaimLog
        mint: Types.MintLog
    }
    export interface MetaClean {}
    export interface Mint {
        to: NameType
        whole_quantity: UInt32Type
    }
    export interface NftLock {
        boid_id: NameType
        asset_id: UInt64Type
        locked_until_round: UInt16Type
    }
    export interface NftReceiver {
        boid_id: NameType
        mint_quantity: UInt16Type
    }
    export interface NftWithdraw {
        boid_id: NameType
        asset_ids: UInt64Type[]
        to: NameType
    }
    export interface NftXfer {
        from_boid_id: NameType
        to_boid_id: NameType
        asset_ids: UInt64Type[]
    }
    export interface OfferAdd {
        requirements: Types.OfferRequirements
        actions: Types.OfferAction
        rewards: Types.OfferRewards
        limits: Types.OfferLimits
    }
    export interface OfferClaim {
        boid_id: NameType
        offer_id: UInt64Type
        required_nft_action_ids: UInt64Type[]
    }
    export interface OfferClean {}
    export interface OfferRm {
        offer_id: UInt64Type
    }
    export interface OwnerAdd {
        boid_id: NameType
        owner: NameType
    }
    export interface OwnerRm {
        boid_id: NameType
        owner: NameType
    }
    export interface PowerAdd {
        boid_id: NameType
        power: UInt16Type
    }
    export interface PowerClaim {
        boid_id: NameType
    }
    export interface Rmdelegstake {
        stake_id: UInt64Type
    }
    export interface SponsorRm {
        sponsor_boid_id: NameType
    }
    export interface SponsorSet {
        row: Types.Sponsor
    }
    export interface Stake {
        boid_id: NameType
        quantity: UInt32Type
    }
    export interface StakeDeleg {
        from_boid_id: NameType
        to_boid_id: NameType
        stake_quantity: UInt16Type
        lock_until_round: UInt16Type
    }
    export interface TeamChange {
        boid_id: NameType
        new_team_id: UInt8Type
        new_pwr_tax_mult: UInt8Type
    }
    export interface TeamCreate {
        owner: NameType
        min_pwr_tax_mult: UInt8Type
        owner_cut_mult: UInt8Type
        url_safe_name: string
    }
    export interface TeamEdit {
        team_id: UInt8Type
        owner: NameType
        managers: NameType[]
        min_pwr_tax_mult: UInt8Type
        owner_cut_mult: UInt8Type
        url_safe_name: string
        meta: BytesType
    }
    export interface TeamRm {
        team_id: UInt8Type
    }
    export interface TeamSetmem {
        team_id: UInt8Type
        new_members: UInt32Type
    }
    export interface TeamSetpwr {
        team_id: UInt8Type
        new_power: UInt32Type
    }
    export interface TeamTaxrate {
        boid_id: NameType
        new_pwr_tax_mult: UInt8Type
    }
    export interface Thisround {}
    export interface UnstakeEnd {
        boid_id: NameType
    }
    export interface UnstakeInit {
        boid_id: NameType
        quantity: UInt32Type
    }
    export interface UnstakeStop {
        boid_id: NameType
    }
    export interface UnstkeDeleg {
        stake_id: UInt64Type
    }
    export interface Withdraw {
        boid_id: NameType
        quantity: UInt32Type
        to: NameType
    }
}
export namespace Types {
    @Variant.type('AtomicValue', [
        Int8,
        Int16,
        Int32,
        Int64,
        UInt8,
        UInt16,
        UInt32,
        UInt64,
        Float32,
        Float64,
        'string',
        {type: Int8, array: true},
        {type: Int16, array: true},
        {type: Int32, array: true},
        {type: Int64, array: true},
        Bytes,
        {type: UInt16, array: true},
        {type: UInt32, array: true},
        {type: UInt64, array: true},
        {type: Float32, array: true},
        {type: Float64, array: true},
        'string[]',
    ])
    export class AtomicValue extends Variant {
        value!:
            | Int8
            | Int16
            | Int32
            | Int64
            | UInt8
            | UInt16
            | UInt32
            | UInt64
            | Float32
            | Float64
            | string
            | Int8[]
            | Int16[]
            | Int32[]
            | Int64[]
            | Bytes
            | UInt16[]
            | UInt32[]
            | UInt64[]
            | Float32[]
            | Float64[]
            | string[]
    }
    @Struct.type('AccountAuth')
    export class AccountAuth extends Struct {
        @Struct.field(PublicKey, {array: true})
        Keys!: PublicKey[]
        @Struct.field(UInt8)
        Nonce!: UInt8
    }
    @Struct.type('TokenUnstake')
    export class TokenUnstake extends Struct {
        @Struct.field(UInt16)
        Redeemable_after_round!: UInt16
        @Struct.field(UInt32)
        Quantity!: UInt32
    }
    @Struct.type('AccountStake')
    export class AccountStake extends Struct {
        @Struct.field(TokenUnstake, {array: true})
        Unstaking!: TokenUnstake[]
        @Struct.field(UInt32)
        Self_staked!: UInt32
        @Struct.field(UInt16)
        Received_delegated_stake!: UInt16
    }
    @Struct.type('AccountBooster')
    export class AccountBooster extends Struct {
        @Struct.field(UInt8)
        Pwr_multiplier!: UInt8
        @Struct.field(UInt16)
        Pwr_add_per_round!: UInt16
        @Struct.field(UInt16)
        Expires_round!: UInt16
        @Struct.field(UInt32)
        Aggregate_pwr_remaining!: UInt32
    }
    @Struct.type('AccountPower')
    export class AccountPower extends Struct {
        @Struct.field(UInt16)
        Last_claimed_round!: UInt16
        @Struct.field(UInt16)
        Last_added_round!: UInt16
        @Struct.field(UInt32)
        Rating!: UInt32
        @Struct.field(UInt16, {array: true})
        History!: UInt16[]
        @Struct.field(AccountBooster, {array: true})
        Mods!: AccountBooster[]
    }
    @Struct.type('AccountTeam')
    export class AccountTeam extends Struct {
        @Struct.field(UInt8)
        Team_id!: UInt8
        @Struct.field(UInt16)
        Last_edit_round!: UInt16
        @Struct.field(UInt8)
        Team_tax_mult!: UInt8
        @Struct.field(UInt32)
        Team_cumulative_contribution!: UInt32
    }
    @Struct.type('Account')
    export class Account extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(Name, {array: true})
        Owners!: Name[]
        @Struct.field(AccountAuth)
        Auth!: AccountAuth
        @Struct.field(Name, {array: true})
        Sponsors!: Name[]
        @Struct.field(AccountStake)
        Stake!: AccountStake
        @Struct.field(AccountPower)
        Power!: AccountPower
        @Struct.field(AccountTeam)
        Team!: AccountTeam
        @Struct.field(UInt32)
        Balance!: UInt32
        @Struct.field(UInt16)
        Nft_balance!: UInt16
        @Struct.field('bool')
        Recoverable!: boolean
    }
    @Struct.type('AccountCreate')
    export class AccountCreate extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(PublicKey, {array: true})
        Keys!: PublicKey[]
        @Struct.field(Name, {array: true})
        Owners!: Name[]
    }
    @Struct.type('AcctMeta')
    export class AcctMeta extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(Bytes)
        Meta!: Bytes
    }
    @Struct.type('PermissionLevel')
    export class PermissionLevel extends Struct {
        @Struct.field(Name)
        Actor!: Name
        @Struct.field(Name)
        Permission!: Name
    }
    @Struct.type('Action')
    export class Action extends Struct {
        @Struct.field(Name)
        Account!: Name
        @Struct.field(Name)
        Name!: Name
        @Struct.field(PermissionLevel, {array: true})
        Authorization!: PermissionLevel[]
        @Struct.field(Bytes)
        Data!: Bytes
    }
    @Struct.type('AtomicAttribute')
    export class AtomicAttribute extends Struct {
        @Struct.field('string')
        Key!: string
        @Struct.field(AtomicValue)
        Value!: AtomicValue
    }
    @Struct.type('AtomicFormat')
    export class AtomicFormat extends Struct {
        @Struct.field('string')
        Name!: string
        @Struct.field('string')
        Type!: string
    }
    @Struct.type('Auth')
    export class Auth extends Struct {
        @Struct.field(Name)
        Boid_id_auth!: Name
    }
    @Struct.type('Booster')
    export class Booster extends Struct {
        @Struct.field(UInt8)
        Mod_id!: UInt8
        @Struct.field(UInt8)
        Pwr_multiplier!: UInt8
        @Struct.field(UInt16)
        Pwr_add_per_round!: UInt16
        @Struct.field(UInt16)
        Expire_after_elapsed_rounds!: UInt16
        @Struct.field(UInt32)
        Aggregate_pwr_capacity!: UInt32
    }
    @Struct.type('ConfigAccount')
    export class ConfigAccount extends Struct {
        @Struct.field(UInt32)
        Invite_price!: UInt32
        @Struct.field(UInt32)
        Premium_purchase_price!: UInt32
        @Struct.field(UInt8)
        Max_premium_prefix!: UInt8
        @Struct.field(UInt8)
        Max_owners!: UInt8
        @Struct.field(UInt8)
        Max_boosters!: UInt8
        @Struct.field(Name, {array: true})
        Suffix_whitelist!: Name[]
        @Struct.field(UInt32)
        Remove_sponsor_price!: UInt32
        @Struct.field(UInt8)
        Sponsor_max_invite_codes!: UInt8
        @Struct.field(UInt16)
        Invite_code_expire_rounds!: UInt16
    }
    @Struct.type('ConfigPower')
    export class ConfigPower extends Struct {
        @Struct.field(Float32)
        Sponsor_tax_mult!: Float32
        @Struct.field(Float32)
        Powered_stake_mult!: Float32
        @Struct.field(UInt16)
        Claim_maximum_elapsed_rounds!: UInt16
        @Struct.field(UInt16)
        Soft_max_pwr_add!: UInt16
        @Struct.field(UInt8)
        History_slots_length!: UInt8
    }
    @Struct.type('ConfigMint')
    export class ConfigMint extends Struct {
        @Struct.field(Float32)
        Round_powered_stake_mult!: Float32
        @Struct.field(Float32)
        Round_power_mult!: Float32
    }
    @Struct.type('ConfigTeam')
    export class ConfigTeam extends Struct {
        @Struct.field(UInt16)
        Change_min_rounds!: UInt16
        @Struct.field(UInt16)
        Edit_team_min_rounds!: UInt16
        @Struct.field(UInt16)
        Team_edit_max_pct_change!: UInt16
        @Struct.field(UInt32)
        Buy_team_cost!: UInt32
        @Struct.field(UInt32)
        Owner_stake_required!: UInt32
        @Struct.field(UInt16)
        Owner_future_stake_lock_rounds_required!: UInt16
    }
    @Struct.type('ConfigStake')
    export class ConfigStake extends Struct {
        @Struct.field(UInt8)
        Unstake_rounds!: UInt8
        @Struct.field(UInt8)
        Extra_stake_min_locked_rounds!: UInt8
    }
    @Struct.type('ConfigTime')
    export class ConfigTime extends Struct {
        @Struct.field(UInt32)
        Rounds_start_sec_since_epoch!: UInt32
        @Struct.field(UInt32)
        Round_length_sec!: UInt32
    }
    @Struct.type('ConfigAuth')
    export class ConfigAuth extends Struct {
        @Struct.field(Name, {array: true})
        Key_actions_whitelist!: Name[]
        @Struct.field(UInt32)
        Key_account_max_stake!: UInt32
        @Struct.field(UInt32)
        Key_account_max_balance!: UInt32
        @Struct.field(UInt8)
        Account_max_keys!: UInt8
        @Struct.field(UInt32)
        Worker_max_bill_per_action!: UInt32
    }
    @Struct.type('ConfigNft')
    export class ConfigNft extends Struct {
        @Struct.field(UInt16)
        Boid_id_maximum_nfts!: UInt16
        @Struct.field(Name, {array: true})
        Whitelist_collections!: Name[]
    }
    @Struct.type('Config')
    export class Config extends Struct {
        @Struct.field(ConfigAccount)
        Account!: ConfigAccount
        @Struct.field(ConfigPower)
        Power!: ConfigPower
        @Struct.field(ConfigMint)
        Mint!: ConfigMint
        @Struct.field(ConfigTeam)
        Team!: ConfigTeam
        @Struct.field(ConfigStake)
        Stake!: ConfigStake
        @Struct.field(ConfigTime)
        Time!: ConfigTime
        @Struct.field(ConfigAuth)
        Auth!: ConfigAuth
        @Struct.field(ConfigNft)
        Nft!: ConfigNft
        @Struct.field('bool')
        Paused!: boolean
        @Struct.field('bool')
        Allow_deposits!: boolean
        @Struct.field('bool')
        Allow_withdrawals!: boolean
        @Struct.field(Name)
        RecoveryAccount!: Name
    }
    @Struct.type('ExtendedSymbol')
    export class ExtendedSymbol extends Struct {
        @Struct.field(Asset.Symbol)
        Sym!: Asset.Symbol
        @Struct.field(Name)
        Contract!: Name
    }
    @Struct.type('Global')
    export class Global extends Struct {
        @Struct.field(Name)
        Chain_name!: Name
        @Struct.field(UInt64)
        Total_power!: UInt64
        @Struct.field(UInt16)
        Last_inflation_adjust_round!: UInt16
    }
    @Struct.type('Invite')
    export class Invite extends Struct {
        @Struct.field(UInt64)
        Invite_code!: UInt64
        @Struct.field(PublicKey)
        Key!: PublicKey
        @Struct.field(UInt16)
        Created_round!: UInt16
    }
    @Struct.type('MintLog')
    export class MintLog extends Struct {
        @Struct.field(UInt32)
        Power_mint!: UInt32
        @Struct.field(UInt32)
        Powered_stake_mint!: UInt32
        @Struct.field(UInt32)
        Account_earned!: UInt32
        @Struct.field(UInt32)
        Team_cut!: UInt32
        @Struct.field(UInt32)
        Team_owner_earned!: UInt32
        @Struct.field(UInt32)
        Overstake_mint!: UInt32
        @Struct.field(UInt32)
        Total!: UInt32
    }
    @Struct.type('NFT')
    export class NFT extends Struct {
        @Struct.field(UInt64)
        Asset_id!: UInt64
        @Struct.field(UInt16)
        Locked_until_round!: UInt16
    }
    @Struct.type('NFTMint')
    export class NFTMint extends Struct {
        @Struct.field(Name)
        Mint_receiver_boid_id!: Name
        @Struct.field(UInt16)
        Mint_quantity_remaining!: UInt16
    }
    @Struct.type('NftAction')
    export class NftAction extends Struct {
        @Struct.field(Name)
        Collection_name!: Name
        @Struct.field(Name)
        Schema_name!: Name
        @Struct.field(Int32)
        Template_id!: Int32
        @Struct.field(AtomicAttribute, {array: true})
        Match_immutable_attributes!: AtomicAttribute[]
        @Struct.field(AtomicAttribute, {array: true})
        Match_mutable_attributes!: AtomicAttribute[]
        @Struct.field('bool')
        Burn!: boolean
        @Struct.field(UInt16)
        Lock_rounds!: UInt16
    }
    @Struct.type('NftMint')
    export class NftMint extends Struct {
        @Struct.field(Int32)
        Mint_template_id!: Int32
        @Struct.field(Name)
        Mint_schema_name!: Name
        @Struct.field(Name)
        Mint_collection_name!: Name
        @Struct.field(AtomicAttribute, {array: true})
        Immutable_data!: AtomicAttribute[]
        @Struct.field(AtomicAttribute, {array: true})
        Mutable_data!: AtomicAttribute[]
        @Struct.field(UInt8)
        Quantity!: UInt8
    }
    @Struct.type('OfferRequirements')
    export class OfferRequirements extends Struct {
        @Struct.field(Bytes)
        Team_id!: Bytes
        @Struct.field(UInt16)
        Min_power!: UInt16
        @Struct.field(UInt32)
        Min_balance!: UInt32
        @Struct.field(UInt32)
        Min_stake!: UInt32
        @Struct.field(UInt32)
        Min_cumulative_team_contribution!: UInt32
    }
    @Struct.type('OfferAction')
    export class OfferAction extends Struct {
        @Struct.field(UInt16)
        Delegated_stake!: UInt16
        @Struct.field(UInt16)
        Stake_locked_additional_rounds!: UInt16
        @Struct.field(NftAction, {array: true})
        Nft_actions!: NftAction[]
        @Struct.field(UInt32)
        Balance_payment!: UInt32
    }
    @Struct.type('OfferRewards')
    export class OfferRewards extends Struct {
        @Struct.field(NftMint, {array: true})
        Nft_mints!: NftMint[]
        @Struct.field(UInt32)
        Balance_deposit!: UInt32
        @Struct.field(UInt16)
        Delegated_stake!: UInt16
        @Struct.field(UInt16)
        Stake_locked_additional_rounds!: UInt16
        @Struct.field(Bytes)
        Activate_powermod_ids!: Bytes
    }
    @Struct.type('OfferLimits')
    export class OfferLimits extends Struct {
        @Struct.field(UInt32)
        Offer_quantity_remaining!: UInt32
        @Struct.field(UInt16)
        Available_until_round!: UInt16
    }
    @Struct.type('Offer')
    export class Offer extends Struct {
        @Struct.field(UInt64)
        Offer_id!: UInt64
        @Struct.field(OfferRequirements)
        Requirements!: OfferRequirements
        @Struct.field(OfferAction)
        Actions!: OfferAction
        @Struct.field(OfferRewards)
        Rewards!: OfferRewards
        @Struct.field(OfferLimits)
        Limits!: OfferLimits
        @Struct.field(UInt32)
        Total_claimed!: UInt32
    }
    @Struct.type('PowerClaimLog')
    export class PowerClaimLog extends Struct {
        @Struct.field(UInt32)
        Before!: UInt32
        @Struct.field(UInt32)
        After!: UInt32
        @Struct.field(UInt32)
        From_boosters!: UInt32
        @Struct.field(UInt16)
        Elapsed_rounds!: UInt16
    }
    @Struct.type('Sponsor')
    export class Sponsor extends Struct {
        @Struct.field(Name)
        Sponsor_boid_id!: Name
        @Struct.field(UInt16)
        Invites_balance!: UInt16
        @Struct.field(UInt16)
        Invite_codes_unclaimed!: UInt16
        @Struct.field(UInt32)
        Invite_codes_claimed!: UInt32
        @Struct.field(UInt32)
        Sponsored_upgrades!: UInt32
        @Struct.field(UInt32)
        Upgrades_total_earned!: UInt32
    }
    @Struct.type('Stake')
    export class Stake extends Struct {
        @Struct.field(UInt64)
        Stake_id!: UInt64
        @Struct.field(Name)
        From_boid_id!: Name
        @Struct.field(Name)
        To_boid_id!: Name
        @Struct.field(UInt16)
        Stake_quantity!: UInt16
        @Struct.field(UInt16)
        Locked_until_round!: UInt16
    }
    @Struct.type('Team')
    export class Team extends Struct {
        @Struct.field(UInt16)
        Team_id!: UInt16
        @Struct.field(UInt32)
        Balance!: UInt32
        @Struct.field(AccountStake)
        Stake!: AccountStake
        @Struct.field(Name)
        Owner!: Name
        @Struct.field(Name, {array: true})
        Managers!: Name[]
        @Struct.field(UInt8)
        Min_pwr_tax_mult!: UInt8
        @Struct.field(UInt8)
        Owner_cut_mult!: UInt8
        @Struct.field('string')
        Url_safe_name!: string
        @Struct.field(UInt64)
        Power!: UInt64
        @Struct.field(UInt32)
        Members!: UInt32
        @Struct.field(UInt16)
        Last_edit_round!: UInt16
        @Struct.field(Bytes)
        Meta!: Bytes
    }
    @Struct.type('account.add')
    export class accountadd extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(Name, {array: true})
        Owners!: Name[]
        @Struct.field(Name, {array: true})
        Sponsors!: Name[]
        @Struct.field(PublicKey, {array: true})
        Keys!: PublicKey[]
    }
    @Struct.type('account.buy')
    export class accountbuy extends Struct {
        @Struct.field(Name)
        Payer_boid_id!: Name
        @Struct.field(AccountCreate)
        New_account!: AccountCreate
    }
    @Struct.type('account.edit')
    export class accountedit extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(Bytes)
        Meta!: Bytes
    }
    @Struct.type('account.free')
    export class accountfree extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
    }
    @Struct.type('account.mod')
    export class accountmod extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt16)
        Received_delegated_stake!: UInt16
    }
    @Struct.type('account.rm')
    export class accountrm extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
    }
    @Struct.type('accounts.clr')
    export class accountsclr extends Struct {}
    @Struct.type('auth')
    export class auth extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(Action, {array: true})
        Actions!: Action[]
        @Struct.field(Signature)
        Sig!: Signature
        @Struct.field(Int32)
        KeyIndex!: Int32
        @Struct.field(UInt32)
        Expires_utc_sec!: UInt32
    }
    @Struct.type('auth.addkey')
    export class authaddkey extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(PublicKey)
        Key!: PublicKey
    }
    @Struct.type('auth.clear')
    export class authclear extends Struct {}
    @Struct.type('auth.init')
    export class authinit extends Struct {}
    @Struct.type('auth.rmkey')
    export class authrmkey extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(Int32)
        KeyIndex!: Int32
    }
    @Struct.type('booster.add')
    export class boosteradd extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt8)
        Mod_id!: UInt8
    }
    @Struct.type('booster.new')
    export class boosternew extends Struct {
        @Struct.field(Booster)
        Mod!: Booster
    }
    @Struct.type('booster.rm')
    export class boosterrm extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(Int32, {array: true})
        Booster_index!: Int32[]
    }
    @Struct.type('config.clear')
    export class configclear extends Struct {}
    @Struct.type('config.set')
    export class configset extends Struct {
        @Struct.field(Config)
        Config!: Config
    }
    @Struct.type('global.chain')
    export class globalchain extends Struct {
        @Struct.field(Name)
        Chain_name!: Name
    }
    @Struct.type('global.clear')
    export class globalclear extends Struct {}
    @Struct.type('global.set')
    export class globalset extends Struct {
        @Struct.field(Global)
        GlobalData!: Global
    }
    @Struct.type('internalxfer')
    export class internalxfer extends Struct {
        @Struct.field(Name)
        From_boid_id!: Name
        @Struct.field(Name)
        To_boid_id!: Name
        @Struct.field(UInt32)
        Quantity!: UInt32
        @Struct.field('string')
        Memo!: string
    }
    @Struct.type('invite.add')
    export class inviteadd extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt64)
        Invite_code!: UInt64
        @Struct.field(PublicKey)
        Key!: PublicKey
    }
    @Struct.type('invite.buy')
    export class invitebuy extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt16)
        Quantity!: UInt16
    }
    @Struct.type('invite.claim')
    export class inviteclaim extends Struct {
        @Struct.field(Name)
        Sponsor_boid_id!: Name
        @Struct.field(UInt64)
        Invite_code!: UInt64
        @Struct.field(Signature)
        Sig!: Signature
        @Struct.field(AccountCreate)
        New_account!: AccountCreate
    }
    @Struct.type('invite.rm')
    export class inviterm extends Struct {
        @Struct.field(Name)
        Sponsor_boid_id!: Name
        @Struct.field(UInt64)
        Invite_code!: UInt64
    }
    @Struct.type('logpwradd')
    export class logpwradd extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt16)
        Received!: UInt16
        @Struct.field(UInt16)
        From_mult_mods!: UInt16
        @Struct.field(UInt16)
        Diverted_to_sponsor!: UInt16
        @Struct.field(UInt16)
        Power_increased!: UInt16
        @Struct.field(Name)
        Orign!: Name
    }
    @Struct.type('logpwrclaim')
    export class logpwrclaim extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(PowerClaimLog)
        Power!: PowerClaimLog
        @Struct.field(MintLog)
        Mint!: MintLog
    }
    @Struct.type('meta.clean')
    export class metaclean extends Struct {}
    @Struct.type('mint')
    export class mint extends Struct {
        @Struct.field(Name)
        To!: Name
        @Struct.field(UInt32)
        Whole_quantity!: UInt32
    }
    @Struct.type('nft.lock')
    export class nftlock extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt64)
        Asset_id!: UInt64
        @Struct.field(UInt16)
        Locked_until_round!: UInt16
    }
    @Struct.type('nft.receiver')
    export class nftreceiver extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt16)
        Mint_quantity!: UInt16
    }
    @Struct.type('nft.withdraw')
    export class nftwithdraw extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt64, {array: true})
        Asset_ids!: UInt64[]
        @Struct.field(Name)
        To!: Name
    }
    @Struct.type('nft.xfer')
    export class nftxfer extends Struct {
        @Struct.field(Name)
        From_boid_id!: Name
        @Struct.field(Name)
        To_boid_id!: Name
        @Struct.field(UInt64, {array: true})
        Asset_ids!: UInt64[]
    }
    @Struct.type('offer.add')
    export class offeradd extends Struct {
        @Struct.field(OfferRequirements)
        Requirements!: OfferRequirements
        @Struct.field(OfferAction)
        Actions!: OfferAction
        @Struct.field(OfferRewards)
        Rewards!: OfferRewards
        @Struct.field(OfferLimits)
        Limits!: OfferLimits
    }
    @Struct.type('offer.claim')
    export class offerclaim extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt64)
        Offer_id!: UInt64
        @Struct.field(UInt64, {array: true})
        Required_nft_action_ids!: UInt64[]
    }
    @Struct.type('offer.clean')
    export class offerclean extends Struct {}
    @Struct.type('offer.rm')
    export class offerrm extends Struct {
        @Struct.field(UInt64)
        Offer_id!: UInt64
    }
    @Struct.type('owner.add')
    export class owneradd extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(Name)
        Owner!: Name
    }
    @Struct.type('owner.rm')
    export class ownerrm extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(Name)
        Owner!: Name
    }
    @Struct.type('power.add')
    export class poweradd extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt16)
        Power!: UInt16
    }
    @Struct.type('power.claim')
    export class powerclaim extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
    }
    @Struct.type('rmdelegstake')
    export class rmdelegstake extends Struct {
        @Struct.field(UInt64)
        Stake_id!: UInt64
    }
    @Struct.type('sponsor.rm')
    export class sponsorrm extends Struct {
        @Struct.field(Name)
        Sponsor_boid_id!: Name
    }
    @Struct.type('sponsor.set')
    export class sponsorset extends Struct {
        @Struct.field(Sponsor)
        Row!: Sponsor
    }
    @Struct.type('stake')
    export class stake extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt32)
        Quantity!: UInt32
    }
    @Struct.type('stake.deleg')
    export class stakedeleg extends Struct {
        @Struct.field(Name)
        From_boid_id!: Name
        @Struct.field(Name)
        To_boid_id!: Name
        @Struct.field(UInt16)
        Stake_quantity!: UInt16
        @Struct.field(UInt16)
        Lock_until_round!: UInt16
    }
    @Struct.type('team.change')
    export class teamchange extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt8)
        New_team_id!: UInt8
        @Struct.field(UInt8)
        New_pwr_tax_mult!: UInt8
    }
    @Struct.type('team.create')
    export class teamcreate extends Struct {
        @Struct.field(Name)
        Owner!: Name
        @Struct.field(UInt8)
        Min_pwr_tax_mult!: UInt8
        @Struct.field(UInt8)
        Owner_cut_mult!: UInt8
        @Struct.field('string')
        Url_safe_name!: string
    }
    @Struct.type('team.edit')
    export class teamedit extends Struct {
        @Struct.field(UInt8)
        Team_id!: UInt8
        @Struct.field(Name)
        Owner!: Name
        @Struct.field(Name, {array: true})
        Managers!: Name[]
        @Struct.field(UInt8)
        Min_pwr_tax_mult!: UInt8
        @Struct.field(UInt8)
        Owner_cut_mult!: UInt8
        @Struct.field('string')
        Url_safe_name!: string
        @Struct.field(Bytes)
        Meta!: Bytes
    }
    @Struct.type('team.rm')
    export class teamrm extends Struct {
        @Struct.field(UInt8)
        Team_id!: UInt8
    }
    @Struct.type('team.setmem')
    export class teamsetmem extends Struct {
        @Struct.field(UInt8)
        Team_id!: UInt8
        @Struct.field(UInt32)
        New_members!: UInt32
    }
    @Struct.type('team.setpwr')
    export class teamsetpwr extends Struct {
        @Struct.field(UInt8)
        Team_id!: UInt8
        @Struct.field(UInt32)
        New_power!: UInt32
    }
    @Struct.type('team.taxrate')
    export class teamtaxrate extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt8)
        New_pwr_tax_mult!: UInt8
    }
    @Struct.type('thisround')
    export class thisround extends Struct {}
    @Struct.type('unstake.end')
    export class unstakeend extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
    }
    @Struct.type('unstake.init')
    export class unstakeinit extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt32)
        Quantity!: UInt32
    }
    @Struct.type('unstake.stop')
    export class unstakestop extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
    }
    @Struct.type('unstke.deleg')
    export class unstkedeleg extends Struct {
        @Struct.field(UInt64)
        Stake_id!: UInt64
    }
    @Struct.type('withdraw')
    export class withdraw extends Struct {
        @Struct.field(Name)
        Boid_id!: Name
        @Struct.field(UInt32)
        Quantity!: UInt32
        @Struct.field(Name)
        To!: Name
    }
}
export const TableMap = {
    accounts: Types.Account,
    acctmeta: Types.AcctMeta,
    auth: Types.Auth,
    boosters: Types.Booster,
    config: Types.Config,
    global: Types.Global,
    invites: Types.Invite,
    nftmint: Types.NFTMint,
    nfts: Types.NFT,
    offers: Types.Offer,
    sponsors: Types.Sponsor,
    stakes: Types.Stake,
    teams: Types.Team,
}
export interface TableTypes {
    accounts: Types.Account
    acctmeta: Types.AcctMeta
    auth: Types.Auth
    boosters: Types.Booster
    config: Types.Config
    global: Types.Global
    invites: Types.Invite
    nftmint: Types.NFTMint
    nfts: Types.NFT
    offers: Types.Offer
    sponsors: Types.Sponsor
    stakes: Types.Stake
    teams: Types.Team
}
export type RowType<T> = T extends keyof TableTypes ? TableTypes[T] : any
export type ActionNames = keyof ActionNameParams
export type TableNames = keyof TableTypes
