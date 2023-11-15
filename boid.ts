import type {
    Action,
    BytesType,
    Float64,
    Int16,
    Int32Type,
    Int64,
    Int8,
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
    Int32,
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
import type {ActionOptions, ContractArgs, PartialBy} from '@wharfkit/contract'
import {Contract as BaseContract} from '@wharfkit/contract'
export const abiBlob = Blob.from(
    'DmVvc2lvOjphYmkvMS4yAGQHQWNjb3VudAAKB2JvaWRfaWQEbmFtZQZvd25lcnMGbmFtZVtdBGF1dGgLQWNjb3VudEF1dGgIc3BvbnNvcnMGbmFtZVtdBXN0YWtlDEFjY291bnRTdGFrZQVwb3dlcgxBY2NvdW50UG93ZXIEdGVhbQtBY2NvdW50VGVhbQdiYWxhbmNlBnVpbnQzMgtuZnRfYmFsYW5jZQZ1aW50MTYLcmVjb3ZlcmFibGUEYm9vbAtBY2NvdW50QXV0aAACBGtleXMMcHVibGljX2tleVtdBW5vbmNlBXVpbnQ4DkFjY291bnRCb29zdGVyAAQOcHdyX211bHRpcGxpZXIFdWludDgRcHdyX2FkZF9wZXJfcm91bmQGdWludDE2DWV4cGlyZXNfcm91bmQGdWludDE2F2FnZ3JlZ2F0ZV9wd3JfcmVtYWluaW5nBnVpbnQzMg1BY2NvdW50Q3JlYXRlAAMHYm9pZF9pZARuYW1lBGtleXMMcHVibGljX2tleVtdBm93bmVycwZuYW1lW10MQWNjb3VudFBvd2VyAAUSbGFzdF9jbGFpbWVkX3JvdW5kBnVpbnQxNhBsYXN0X2FkZGVkX3JvdW5kBnVpbnQxNgZyYXRpbmcGdWludDMyB2hpc3RvcnkIdWludDE2W10EbW9kcxBBY2NvdW50Qm9vc3RlcltdDEFjY291bnRTdGFrZQADCXVuc3Rha2luZw5Ub2tlblVuc3Rha2VbXQtzZWxmX3N0YWtlZAZ1aW50MzIYcmVjZWl2ZWRfZGVsZWdhdGVkX3N0YWtlBnVpbnQxNgtBY2NvdW50VGVhbQAEB3RlYW1faWQFdWludDgPbGFzdF9lZGl0X3JvdW5kBnVpbnQxNg10ZWFtX3RheF9tdWx0BXVpbnQ4HHRlYW1fY3VtdWxhdGl2ZV9jb250cmlidXRpb24GdWludDMyCEFjY3RNZXRhAAIHYm9pZF9pZARuYW1lBG1ldGEFYnl0ZXMGQWN0aW9uAAQHYWNjb3VudARuYW1lBG5hbWUEbmFtZQ1hdXRob3JpemF0aW9uEVBlcm1pc3Npb25MZXZlbFtdBGRhdGEFYnl0ZXMPQXRvbWljQXR0cmlidXRlAAIDa2V5BnN0cmluZwV2YWx1ZQtBdG9taWNWYWx1ZQxBdG9taWNGb3JtYXQAAgRuYW1lBnN0cmluZwR0eXBlBnN0cmluZwRBdXRoAAEMYm9pZF9pZF9hdXRoBG5hbWUHQm9vc3RlcgAFBm1vZF9pZAV1aW50OA5wd3JfbXVsdGlwbGllcgV1aW50OBFwd3JfYWRkX3Blcl9yb3VuZAZ1aW50MTYbZXhwaXJlX2FmdGVyX2VsYXBzZWRfcm91bmRzBnVpbnQxNhZhZ2dyZWdhdGVfcHdyX2NhcGFjaXR5BnVpbnQzMgZDb25maWcADAdhY2NvdW50DUNvbmZpZ0FjY291bnQFcG93ZXILQ29uZmlnUG93ZXIEbWludApDb25maWdNaW50BHRlYW0KQ29uZmlnVGVhbQVzdGFrZQtDb25maWdTdGFrZQR0aW1lCkNvbmZpZ1RpbWUEYXV0aApDb25maWdBdXRoA25mdAlDb25maWdOZnQGcGF1c2VkBGJvb2wOYWxsb3dfZGVwb3NpdHMEYm9vbBFhbGxvd193aXRoZHJhd2FscwRib29sD3JlY292ZXJ5QWNjb3VudARuYW1lDUNvbmZpZ0FjY291bnQACQxpbnZpdGVfcHJpY2UGdWludDMyFnByZW1pdW1fcHVyY2hhc2VfcHJpY2UGdWludDMyEm1heF9wcmVtaXVtX3ByZWZpeAV1aW50OAptYXhfb3duZXJzBXVpbnQ4DG1heF9ib29zdGVycwV1aW50OBBzdWZmaXhfd2hpdGVsaXN0Bm5hbWVbXRRyZW1vdmVfc3BvbnNvcl9wcmljZQZ1aW50MzIYc3BvbnNvcl9tYXhfaW52aXRlX2NvZGVzBXVpbnQ4GWludml0ZV9jb2RlX2V4cGlyZV9yb3VuZHMGdWludDE2CkNvbmZpZ0F1dGgABRVrZXlfYWN0aW9uc193aGl0ZWxpc3QGbmFtZVtdFWtleV9hY2NvdW50X21heF9zdGFrZQZ1aW50MzIXa2V5X2FjY291bnRfbWF4X2JhbGFuY2UGdWludDMyEGFjY291bnRfbWF4X2tleXMFdWludDgad29ya2VyX21heF9iaWxsX3Blcl9hY3Rpb24GdWludDMyCkNvbmZpZ01pbnQAAhhyb3VuZF9wb3dlcmVkX3N0YWtlX211bHQHZmxvYXQzMhByb3VuZF9wb3dlcl9tdWx0B2Zsb2F0MzIJQ29uZmlnTmZ0AAIUYm9pZF9pZF9tYXhpbXVtX25mdHMGdWludDE2FXdoaXRlbGlzdF9jb2xsZWN0aW9ucwZuYW1lW10LQ29uZmlnUG93ZXIABRBzcG9uc29yX3RheF9tdWx0B2Zsb2F0MzIScG93ZXJlZF9zdGFrZV9tdWx0B2Zsb2F0MzIcY2xhaW1fbWF4aW11bV9lbGFwc2VkX3JvdW5kcwZ1aW50MTYQc29mdF9tYXhfcHdyX2FkZAZ1aW50MTYUaGlzdG9yeV9zbG90c19sZW5ndGgFdWludDgLQ29uZmlnU3Rha2UAAg51bnN0YWtlX3JvdW5kcwV1aW50OB1leHRyYV9zdGFrZV9taW5fbG9ja2VkX3JvdW5kcwV1aW50OApDb25maWdUZWFtAAYRY2hhbmdlX21pbl9yb3VuZHMGdWludDE2FGVkaXRfdGVhbV9taW5fcm91bmRzBnVpbnQxNhh0ZWFtX2VkaXRfbWF4X3BjdF9jaGFuZ2UGdWludDE2DWJ1eV90ZWFtX2Nvc3QGdWludDMyFG93bmVyX3N0YWtlX3JlcXVpcmVkBnVpbnQzMidvd25lcl9mdXR1cmVfc3Rha2VfbG9ja19yb3VuZHNfcmVxdWlyZWQGdWludDE2CkNvbmZpZ1RpbWUAAhxyb3VuZHNfc3RhcnRfc2VjX3NpbmNlX2Vwb2NoBnVpbnQzMhByb3VuZF9sZW5ndGhfc2VjBnVpbnQzMg5FeHRlbmRlZFN5bWJvbAACA3N5bQZzeW1ib2wIY29udHJhY3QEbmFtZQZHbG9iYWwAAwpjaGFpbl9uYW1lBG5hbWULdG90YWxfcG93ZXIGdWludDY0G2xhc3RfaW5mbGF0aW9uX2FkanVzdF9yb3VuZAZ1aW50MTYGSW52aXRlAAMLaW52aXRlX2NvZGUGdWludDY0A2tleQpwdWJsaWNfa2V5DWNyZWF0ZWRfcm91bmQGdWludDE2B01pbnRMb2cABwpwb3dlcl9taW50BnVpbnQzMhJwb3dlcmVkX3N0YWtlX21pbnQGdWludDMyDmFjY291bnRfZWFybmVkBnVpbnQzMgh0ZWFtX2N1dAZ1aW50MzIRdGVhbV9vd25lcl9lYXJuZWQGdWludDMyDm92ZXJzdGFrZV9taW50BnVpbnQzMgV0b3RhbAZ1aW50MzIDTkZUAAIIYXNzZXRfaWQGdWludDY0EmxvY2tlZF91bnRpbF9yb3VuZAZ1aW50MTYHTkZUTWludAACFW1pbnRfcmVjZWl2ZXJfYm9pZF9pZARuYW1lF21pbnRfcXVhbnRpdHlfcmVtYWluaW5nBnVpbnQxNglOZnRBY3Rpb24ABw9jb2xsZWN0aW9uX25hbWUEbmFtZQtzY2hlbWFfbmFtZQRuYW1lC3RlbXBsYXRlX2lkBWludDMyGm1hdGNoX2ltbXV0YWJsZV9hdHRyaWJ1dGVzEUF0b21pY0F0dHJpYnV0ZVtdGG1hdGNoX211dGFibGVfYXR0cmlidXRlcxFBdG9taWNBdHRyaWJ1dGVbXQRidXJuBGJvb2wLbG9ja19yb3VuZHMGdWludDE2B05mdE1pbnQABhBtaW50X3RlbXBsYXRlX2lkBWludDMyEG1pbnRfc2NoZW1hX25hbWUEbmFtZRRtaW50X2NvbGxlY3Rpb25fbmFtZQRuYW1lDmltbXV0YWJsZV9kYXRhEUF0b21pY0F0dHJpYnV0ZVtdDG11dGFibGVfZGF0YRFBdG9taWNBdHRyaWJ1dGVbXQhxdWFudGl0eQV1aW50OAVPZmZlcgAGCG9mZmVyX2lkBnVpbnQ2NAxyZXF1aXJlbWVudHMRT2ZmZXJSZXF1aXJlbWVudHMHYWN0aW9ucwtPZmZlckFjdGlvbgdyZXdhcmRzDE9mZmVyUmV3YXJkcwZsaW1pdHMLT2ZmZXJMaW1pdHMNdG90YWxfY2xhaW1lZAZ1aW50MzILT2ZmZXJBY3Rpb24ABA9kZWxlZ2F0ZWRfc3Rha2UGdWludDE2HnN0YWtlX2xvY2tlZF9hZGRpdGlvbmFsX3JvdW5kcwZ1aW50MTYLbmZ0X2FjdGlvbnMLTmZ0QWN0aW9uW10PYmFsYW5jZV9wYXltZW50BnVpbnQzMgtPZmZlckxpbWl0cwACGG9mZmVyX3F1YW50aXR5X3JlbWFpbmluZwZ1aW50MzIVYXZhaWxhYmxlX3VudGlsX3JvdW5kBnVpbnQxNhFPZmZlclJlcXVpcmVtZW50cwAFB3RlYW1faWQFYnl0ZXMJbWluX3Bvd2VyBnVpbnQxNgttaW5fYmFsYW5jZQZ1aW50MzIJbWluX3N0YWtlBnVpbnQzMiBtaW5fY3VtdWxhdGl2ZV90ZWFtX2NvbnRyaWJ1dGlvbgZ1aW50MzIMT2ZmZXJSZXdhcmRzAAUJbmZ0X21pbnRzCU5mdE1pbnRbXQ9iYWxhbmNlX2RlcG9zaXQGdWludDMyD2RlbGVnYXRlZF9zdGFrZQZ1aW50MTYec3Rha2VfbG9ja2VkX2FkZGl0aW9uYWxfcm91bmRzBnVpbnQxNhVhY3RpdmF0ZV9wb3dlcm1vZF9pZHMFYnl0ZXMPUGVybWlzc2lvbkxldmVsAAIFYWN0b3IEbmFtZQpwZXJtaXNzaW9uBG5hbWUNUG93ZXJDbGFpbUxvZwAEBmJlZm9yZQZ1aW50MzIFYWZ0ZXIGdWludDMyDWZyb21fYm9vc3RlcnMGdWludDMyDmVsYXBzZWRfcm91bmRzBnVpbnQxNgdTcG9uc29yAAYPc3BvbnNvcl9ib2lkX2lkBG5hbWUPaW52aXRlc19iYWxhbmNlBnVpbnQxNhZpbnZpdGVfY29kZXNfdW5jbGFpbWVkBnVpbnQxNhRpbnZpdGVfY29kZXNfY2xhaW1lZAZ1aW50MzISc3BvbnNvcmVkX3VwZ3JhZGVzBnVpbnQzMhV1cGdyYWRlc190b3RhbF9lYXJuZWQGdWludDMyBVN0YWtlAAUIc3Rha2VfaWQGdWludDY0DGZyb21fYm9pZF9pZARuYW1lCnRvX2JvaWRfaWQEbmFtZQ5zdGFrZV9xdWFudGl0eQZ1aW50MTYSbG9ja2VkX3VudGlsX3JvdW5kBnVpbnQxNgRUZWFtAAwHdGVhbV9pZAZ1aW50MTYHYmFsYW5jZQZ1aW50MzIFc3Rha2UMQWNjb3VudFN0YWtlBW93bmVyBG5hbWUIbWFuYWdlcnMGbmFtZVtdEG1pbl9wd3JfdGF4X211bHQFdWludDgOb3duZXJfY3V0X211bHQFdWludDgNdXJsX3NhZmVfbmFtZQZzdHJpbmcFcG93ZXIGdWludDY0B21lbWJlcnMGdWludDMyD2xhc3RfZWRpdF9yb3VuZAZ1aW50MTYEbWV0YQVieXRlcwxUb2tlblVuc3Rha2UAAhZyZWRlZW1hYmxlX2FmdGVyX3JvdW5kBnVpbnQxNghxdWFudGl0eQZ1aW50MzILYWNjb3VudC5hZGQABAdib2lkX2lkBG5hbWUGb3duZXJzBm5hbWVbXQhzcG9uc29ycwZuYW1lW10Ea2V5cwxwdWJsaWNfa2V5W10LYWNjb3VudC5idXkAAg1wYXllcl9ib2lkX2lkBG5hbWULbmV3X2FjY291bnQNQWNjb3VudENyZWF0ZQxhY2NvdW50LmVkaXQAAgdib2lkX2lkBG5hbWUEbWV0YQVieXRlcwxhY2NvdW50LmZyZWUAAQdib2lkX2lkBG5hbWULYWNjb3VudC5tb2QAAgdib2lkX2lkBG5hbWUYcmVjZWl2ZWRfZGVsZWdhdGVkX3N0YWtlBnVpbnQxNgphY2NvdW50LnJtAAEHYm9pZF9pZARuYW1lDGFjY291bnRzLmNscgAABGF1dGgABQdib2lkX2lkBG5hbWUHYWN0aW9ucwhBY3Rpb25bXQNzaWcJc2lnbmF0dXJlCGtleUluZGV4BWludDMyD2V4cGlyZXNfdXRjX3NlYwZ1aW50MzILYXV0aC5hZGRrZXkAAgdib2lkX2lkBG5hbWUDa2V5CnB1YmxpY19rZXkKYXV0aC5jbGVhcgAACWF1dGguaW5pdAAACmF1dGgucm1rZXkAAgdib2lkX2lkBG5hbWUIa2V5SW5kZXgFaW50MzILYm9vc3Rlci5hZGQAAgdib2lkX2lkBG5hbWUGbW9kX2lkBXVpbnQ4C2Jvb3N0ZXIubmV3AAEDbW9kB0Jvb3N0ZXIKYm9vc3Rlci5ybQACB2JvaWRfaWQEbmFtZQ1ib29zdGVyX2luZGV4B2ludDMyW10MY29uZmlnLmNsZWFyAAAKY29uZmlnLnNldAABBmNvbmZpZwZDb25maWcMZ2xvYmFsLmNoYWluAAEKY2hhaW5fbmFtZQRuYW1lDGdsb2JhbC5jbGVhcgAACmdsb2JhbC5zZXQAAQpnbG9iYWxEYXRhBkdsb2JhbAxpbnRlcm5hbHhmZXIABAxmcm9tX2JvaWRfaWQEbmFtZQp0b19ib2lkX2lkBG5hbWUIcXVhbnRpdHkGdWludDMyBG1lbW8Gc3RyaW5nCmludml0ZS5hZGQAAwdib2lkX2lkBG5hbWULaW52aXRlX2NvZGUGdWludDY0A2tleQpwdWJsaWNfa2V5Cmludml0ZS5idXkAAgdib2lkX2lkBG5hbWUIcXVhbnRpdHkGdWludDE2DGludml0ZS5jbGFpbQAED3Nwb25zb3JfYm9pZF9pZARuYW1lC2ludml0ZV9jb2RlBnVpbnQ2NANzaWcJc2lnbmF0dXJlC25ld19hY2NvdW50DUFjY291bnRDcmVhdGUJaW52aXRlLnJtAAIPc3BvbnNvcl9ib2lkX2lkBG5hbWULaW52aXRlX2NvZGUGdWludDY0CWxvZ3B3cmFkZAAGB2JvaWRfaWQEbmFtZQhyZWNlaXZlZAZ1aW50MTYOZnJvbV9tdWx0X21vZHMGdWludDE2E2RpdmVydGVkX3RvX3Nwb25zb3IGdWludDE2D3Bvd2VyX2luY3JlYXNlZAZ1aW50MTYFb3JpZ24EbmFtZQtsb2dwd3JjbGFpbQADB2JvaWRfaWQEbmFtZQVwb3dlcg1Qb3dlckNsYWltTG9nBG1pbnQHTWludExvZwptZXRhLmNsZWFuAAAEbWludAACAnRvBG5hbWUOd2hvbGVfcXVhbnRpdHkGdWludDMyCG5mdC5sb2NrAAMHYm9pZF9pZARuYW1lCGFzc2V0X2lkBnVpbnQ2NBJsb2NrZWRfdW50aWxfcm91bmQGdWludDE2DG5mdC5yZWNlaXZlcgACB2JvaWRfaWQEbmFtZQ1taW50X3F1YW50aXR5BnVpbnQxNgxuZnQud2l0aGRyYXcAAwdib2lkX2lkBG5hbWUJYXNzZXRfaWRzCHVpbnQ2NFtdAnRvBG5hbWUIbmZ0LnhmZXIAAwxmcm9tX2JvaWRfaWQEbmFtZQp0b19ib2lkX2lkBG5hbWUJYXNzZXRfaWRzCHVpbnQ2NFtdCW9mZmVyLmFkZAAEDHJlcXVpcmVtZW50cxFPZmZlclJlcXVpcmVtZW50cwdhY3Rpb25zC09mZmVyQWN0aW9uB3Jld2FyZHMMT2ZmZXJSZXdhcmRzBmxpbWl0cwtPZmZlckxpbWl0cwtvZmZlci5jbGFpbQADB2JvaWRfaWQEbmFtZQhvZmZlcl9pZAZ1aW50NjQXcmVxdWlyZWRfbmZ0X2FjdGlvbl9pZHMIdWludDY0W10Lb2ZmZXIuY2xlYW4AAAhvZmZlci5ybQABCG9mZmVyX2lkBnVpbnQ2NAlvd25lci5hZGQAAgdib2lkX2lkBG5hbWUFb3duZXIEbmFtZQhvd25lci5ybQACB2JvaWRfaWQEbmFtZQVvd25lcgRuYW1lCXBvd2VyLmFkZAACB2JvaWRfaWQEbmFtZQVwb3dlcgZ1aW50MTYLcG93ZXIuY2xhaW0AAQdib2lkX2lkBG5hbWUMcm1kZWxlZ3N0YWtlAAEIc3Rha2VfaWQGdWludDY0CnNwb25zb3Iucm0AAQ9zcG9uc29yX2JvaWRfaWQEbmFtZQtzcG9uc29yLnNldAABA3JvdwdTcG9uc29yBXN0YWtlAAIHYm9pZF9pZARuYW1lCHF1YW50aXR5BnVpbnQzMgtzdGFrZS5kZWxlZwAEDGZyb21fYm9pZF9pZARuYW1lCnRvX2JvaWRfaWQEbmFtZQ5zdGFrZV9xdWFudGl0eQZ1aW50MTYQbG9ja191bnRpbF9yb3VuZAZ1aW50MTYLdGVhbS5jaGFuZ2UAAwdib2lkX2lkBG5hbWULbmV3X3RlYW1faWQFdWludDgQbmV3X3B3cl90YXhfbXVsdAV1aW50OAt0ZWFtLmNyZWF0ZQAEBW93bmVyBG5hbWUQbWluX3B3cl90YXhfbXVsdAV1aW50OA5vd25lcl9jdXRfbXVsdAV1aW50OA11cmxfc2FmZV9uYW1lBnN0cmluZwl0ZWFtLmVkaXQABwd0ZWFtX2lkBXVpbnQ4BW93bmVyBG5hbWUIbWFuYWdlcnMGbmFtZVtdEG1pbl9wd3JfdGF4X211bHQFdWludDgOb3duZXJfY3V0X211bHQFdWludDgNdXJsX3NhZmVfbmFtZQZzdHJpbmcEbWV0YQVieXRlcwd0ZWFtLnJtAAEHdGVhbV9pZAV1aW50OAt0ZWFtLnNldG1lbQACB3RlYW1faWQFdWludDgLbmV3X21lbWJlcnMGdWludDMyC3RlYW0uc2V0cHdyAAIHdGVhbV9pZAV1aW50OAluZXdfcG93ZXIGdWludDMyDHRlYW0udGF4cmF0ZQACB2JvaWRfaWQEbmFtZRBuZXdfcHdyX3RheF9tdWx0BXVpbnQ4CXRoaXNyb3VuZAAAC3Vuc3Rha2UuZW5kAAEHYm9pZF9pZARuYW1lDHVuc3Rha2UuaW5pdAACB2JvaWRfaWQEbmFtZQhxdWFudGl0eQZ1aW50MzIMdW5zdGFrZS5zdG9wAAEHYm9pZF9pZARuYW1lDHVuc3RrZS5kZWxlZwABCHN0YWtlX2lkBnVpbnQ2NAh3aXRoZHJhdwADB2JvaWRfaWQEbmFtZQhxdWFudGl0eQZ1aW50MzICdG8EbmFtZTsAUjIgT00RMgthY2NvdW50LmFkZAAAvD4gT00RMgthY2NvdW50LmJ1eQCQXVIgT00RMgxhY2NvdW50LmVkaXQAoNRdIE9NETIMYWNjb3VudC5mcmVlAAASlSBPTREyC2FjY291bnQubW9kAACAvCBPTREyCmFjY291bnQucm0AcCMCOE9NETIMYWNjb3VudHMuY2xyAAAAAAAA0LI2BGF1dGgAALyCKRnQsjYLYXV0aC5hZGRrZXkAAMA1KiLQsjYKYXV0aC5jbGVhcgAAAMhuOtCyNglhdXRoLmluaXQAAIBXUF7QsjYKYXV0aC5ybWtleQAAUjLgqowpPQtib29zdGVyLmFkZAAAuJrgqowpPQtib29zdGVyLm5ldwAAgLzgqowpPQpib29zdGVyLnJtAHCNiggwtyZFDGNvbmZpZy5jbGVhcgAAQFYYMLcmRQpjb25maWcuc2V0ADCdaQhEc2hkDGdsb2JhbC5jaGFpbgBwjYoIRHNoZAxnbG9iYWwuY2xlYXIAAEBWGERzaGQKZ2xvYmFsLnNldABw1erRzKvydAxpbnRlcm5hbHhmZXIAAEBKBqjs9nQKaW52aXRlLmFkZAAAgNcHqOz2dAppbnZpdGUuYnV5ACCdiQio7PZ0DGludml0ZS5jbGFpbQAAAJAXqOz2dAlpbnZpdGUucm0AAABIyVxeGY0JbG9ncHdyYWRkAACkMxFdXhmNC2xvZ3B3cmNsYWltAADANCoiYLKSCm1ldGEuY2xlYW4AAAAAAACQp5MEbWludAAAAAAQ0QjymghuZnQubG9jawBw1XYKqQvymgxuZnQucmVjZWl2ZXIAwM1NLTsO8poMbmZ0LndpdGhkcmF3AAAAAFetDvKaCG5mdC54ZmVyAAAASMmAq9aiCW9mZmVyLmFkZAAApDMRgavWogtvZmZlci5jbGFpbQAAplERgavWogtvZmZlci5jbGVhbgAAAADygqvWoghvZmZlci5ybQAAAEjJgKsmpwlvd25lci5hZGQAAAAA8oKrJqcIb3duZXIucm0AAABIyYCrOK0JcG93ZXIuYWRkAACkMxGBqzitC3Bvd2VyLmNsYWltAKCgyZipqJK8DHJtZGVsZWdzdGFrZQAAgLzgUjxpxQpzcG9uc29yLnJtAACywuBSPGnFC3Nwb25zb3Iuc2V0AAAAAAAABU3GBXN0YWtlAACYiioBBU3GC3N0YWtlLmRlbGVnAAAUm6YhII3KC3RlYW0uY2hhbmdlAABUNuoiII3KC3RlYW0uY3JlYXRlAAAAyC4pII3KCXRlYW0uZWRpdAAAAABAXiCNygd0ZWFtLnJtAACkkllhII3KC3RlYW0uc2V0bWVtAAAur1lhII3KC3RlYW0uc2V0cHdyAKCyud1kII3KDHRlYW0udGF4cmF0ZQAAAEhT04tdywl0aGlzcm91bmQAANJUQEGT8dQLdW5zdGFrZS5lbmQAkN10QEGT8dQMdW5zdGFrZS5pbml0AFBpxkBBk/HUDHVuc3Rha2Uuc3RvcADAVFQJKJjx1Ax1bnN0a2UuZGVsZWcAAAAA3NzUsuMId2l0aGRyYXcADQAAADhPTREyA2k2NAAAB0FjY291bnQAAAAmK5kRMgNpNjQAAAhBY2N0TWV0YQAAAAAA0LI2A2k2NAAABEF1dGgAAAD4qowpPQNpNjQAAAdCb29zdGVyAAAAADC3JkUDaTY0AAAGQ29uZmlnAAAAAERzaGQDaTY0AAAGR2xvYmFsAAAAAKvs9nQDaTY0AAAGSW52aXRlAAAAIE8n85oDaTY0AAAHTkZUTWludAAAAAAAgPOaA2k2NAAAA05GVAAAAADgq9aiA2k2NAAABU9mZmVyAAAA+FI8acUDaTY0AAAHU3BvbnNvcgAAAABgBU3GA2k2NAAABVN0YWtlAAAAAAAsjcoDaTY0AAAEVGVhbQAAAAELQXRvbWljVmFsdWUWBGludDgFaW50MTYFaW50MzIFaW50NjQFdWludDgGdWludDE2BnVpbnQzMgZ1aW50NjQHZmxvYXQzMgdmbG9hdDY0BnN0cmluZwZpbnQ4W10HaW50MTZbXQdpbnQzMltdB2ludDY0W10FYnl0ZXMIdWludDE2W10IdWludDMyW10IdWludDY0W10JZmxvYXQzMltdCWZsb2F0NjRbXQhzdHJpbmdbXQ=='
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
    action<
        T extends
            | 'account.add'
            | 'account.buy'
            | 'account.edit'
            | 'account.free'
            | 'account.mod'
            | 'account.rm'
            | 'accounts.clr'
            | 'auth'
            | 'auth.addkey'
            | 'auth.clear'
            | 'auth.init'
            | 'auth.rmkey'
            | 'booster.add'
            | 'booster.new'
            | 'booster.rm'
            | 'config.clear'
            | 'config.set'
            | 'global.chain'
            | 'global.clear'
            | 'global.set'
            | 'internalxfer'
            | 'invite.add'
            | 'invite.buy'
            | 'invite.claim'
            | 'invite.rm'
            | 'logpwradd'
            | 'logpwrclaim'
            | 'meta.clean'
            | 'mint'
            | 'nft.lock'
            | 'nft.receiver'
            | 'nft.withdraw'
            | 'nft.xfer'
            | 'offer.add'
            | 'offer.claim'
            | 'offer.clean'
            | 'offer.rm'
            | 'owner.add'
            | 'owner.rm'
            | 'power.add'
            | 'power.claim'
            | 'rmdelegstake'
            | 'sponsor.rm'
            | 'sponsor.set'
            | 'stake'
            | 'stake.deleg'
            | 'team.change'
            | 'team.create'
            | 'team.edit'
            | 'team.rm'
            | 'team.setmem'
            | 'team.setpwr'
            | 'team.taxrate'
            | 'thisround'
            | 'unstake.end'
            | 'unstake.init'
            | 'unstake.stop'
            | 'unstke.deleg'
            | 'withdraw'
    >(name: T, data: ActionNameParams[T], options?: ActionOptions): Action {
        return super.action(name, data, options)
    }
    table<
        T extends
            | 'accounts'
            | 'acctmeta'
            | 'auth'
            | 'boosters'
            | 'config'
            | 'global'
            | 'invites'
            | 'nftmint'
            | 'nfts'
            | 'offers'
            | 'sponsors'
            | 'stakes'
            | 'teams'
    >(name: T, scope?: NameType) {
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
    @Struct.type('Account')
    export class Account extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(Name, {array: true})
        owners!: Name[]
        @Struct.field(AccountAuth)
        auth!: AccountAuth
        @Struct.field(Name, {array: true})
        sponsors!: Name[]
        @Struct.field(AccountStake)
        stake!: AccountStake
        @Struct.field(AccountPower)
        power!: AccountPower
        @Struct.field(AccountTeam)
        team!: AccountTeam
        @Struct.field(UInt32)
        balance!: UInt32
        @Struct.field(UInt16)
        nft_balance!: UInt16
        @Struct.field('bool')
        recoverable!: boolean
    }
    @Struct.type('AccountAuth')
    export class AccountAuth extends Struct {
        @Struct.field(PublicKey, {array: true})
        keys!: PublicKey[]
        @Struct.field(UInt8)
        nonce!: UInt8
    }
    @Struct.type('AccountBooster')
    export class AccountBooster extends Struct {
        @Struct.field(UInt8)
        pwr_multiplier!: UInt8
        @Struct.field(UInt16)
        pwr_add_per_round!: UInt16
        @Struct.field(UInt16)
        expires_round!: UInt16
        @Struct.field(UInt32)
        aggregate_pwr_remaining!: UInt32
    }
    @Struct.type('AccountCreate')
    export class AccountCreate extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(PublicKey, {array: true})
        keys!: PublicKey[]
        @Struct.field(Name, {array: true})
        owners!: Name[]
    }
    @Struct.type('AccountPower')
    export class AccountPower extends Struct {
        @Struct.field(UInt16)
        last_claimed_round!: UInt16
        @Struct.field(UInt16)
        last_added_round!: UInt16
        @Struct.field(UInt32)
        rating!: UInt32
        @Struct.field(UInt16, {array: true})
        history!: UInt16[]
        @Struct.field(AccountBooster, {array: true})
        mods!: AccountBooster[]
    }
    @Struct.type('AccountStake')
    export class AccountStake extends Struct {
        @Struct.field(TokenUnstake, {array: true})
        unstaking!: TokenUnstake[]
        @Struct.field(UInt32)
        self_staked!: UInt32
        @Struct.field(UInt16)
        received_delegated_stake!: UInt16
    }
    @Struct.type('AccountTeam')
    export class AccountTeam extends Struct {
        @Struct.field(UInt8)
        team_id!: UInt8
        @Struct.field(UInt16)
        last_edit_round!: UInt16
        @Struct.field(UInt8)
        team_tax_mult!: UInt8
        @Struct.field(UInt32)
        team_cumulative_contribution!: UInt32
    }
    @Struct.type('AcctMeta')
    export class AcctMeta extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(Bytes)
        meta!: Bytes
    }
    @Struct.type('Action')
    export class Action extends Struct {
        @Struct.field(Name)
        account!: Name
        @Struct.field(Name)
        name!: Name
        @Struct.field(PermissionLevel, {array: true})
        authorization!: PermissionLevel[]
        @Struct.field(Bytes)
        data!: Bytes
    }
    @Struct.type('AtomicAttribute')
    export class AtomicAttribute extends Struct {
        @Struct.field('string')
        key!: string
        @Struct.field(Variant)
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
    @Struct.type('AtomicFormat')
    export class AtomicFormat extends Struct {
        @Struct.field('string')
        name!: string
        @Struct.field('string')
        type!: string
    }
    @Struct.type('Auth')
    export class Auth extends Struct {
        @Struct.field(Name)
        boid_id_auth!: Name
    }
    @Struct.type('Booster')
    export class Booster extends Struct {
        @Struct.field(UInt8)
        mod_id!: UInt8
        @Struct.field(UInt8)
        pwr_multiplier!: UInt8
        @Struct.field(UInt16)
        pwr_add_per_round!: UInt16
        @Struct.field(UInt16)
        expire_after_elapsed_rounds!: UInt16
        @Struct.field(UInt32)
        aggregate_pwr_capacity!: UInt32
    }
    @Struct.type('Config')
    export class Config extends Struct {
        @Struct.field(ConfigAccount)
        account!: ConfigAccount
        @Struct.field(ConfigPower)
        power!: ConfigPower
        @Struct.field(ConfigMint)
        mint!: ConfigMint
        @Struct.field(ConfigTeam)
        team!: ConfigTeam
        @Struct.field(ConfigStake)
        stake!: ConfigStake
        @Struct.field(ConfigTime)
        time!: ConfigTime
        @Struct.field(ConfigAuth)
        auth!: ConfigAuth
        @Struct.field(ConfigNft)
        nft!: ConfigNft
        @Struct.field('bool')
        paused!: boolean
        @Struct.field('bool')
        allow_deposits!: boolean
        @Struct.field('bool')
        allow_withdrawals!: boolean
        @Struct.field(Name)
        recoveryaccount!: Name
    }
    @Struct.type('ConfigAccount')
    export class ConfigAccount extends Struct {
        @Struct.field(UInt32)
        invite_price!: UInt32
        @Struct.field(UInt32)
        premium_purchase_price!: UInt32
        @Struct.field(UInt8)
        max_premium_prefix!: UInt8
        @Struct.field(UInt8)
        max_owners!: UInt8
        @Struct.field(UInt8)
        max_boosters!: UInt8
        @Struct.field(Name, {array: true})
        suffix_whitelist!: Name[]
        @Struct.field(UInt32)
        remove_sponsor_price!: UInt32
        @Struct.field(UInt8)
        sponsor_max_invite_codes!: UInt8
        @Struct.field(UInt16)
        invite_code_expire_rounds!: UInt16
    }
    @Struct.type('ConfigAuth')
    export class ConfigAuth extends Struct {
        @Struct.field(Name, {array: true})
        key_actions_whitelist!: Name[]
        @Struct.field(UInt32)
        key_account_max_stake!: UInt32
        @Struct.field(UInt32)
        key_account_max_balance!: UInt32
        @Struct.field(UInt8)
        account_max_keys!: UInt8
        @Struct.field(UInt32)
        worker_max_bill_per_action!: UInt32
    }
    @Struct.type('ConfigMint')
    export class ConfigMint extends Struct {
        @Struct.field(Float32)
        round_powered_stake_mult!: Float32
        @Struct.field(Float32)
        round_power_mult!: Float32
    }
    @Struct.type('ConfigNft')
    export class ConfigNft extends Struct {
        @Struct.field(UInt16)
        boid_id_maximum_nfts!: UInt16
        @Struct.field(Name, {array: true})
        whitelist_collections!: Name[]
    }
    @Struct.type('ConfigPower')
    export class ConfigPower extends Struct {
        @Struct.field(Float32)
        sponsor_tax_mult!: Float32
        @Struct.field(Float32)
        powered_stake_mult!: Float32
        @Struct.field(UInt16)
        claim_maximum_elapsed_rounds!: UInt16
        @Struct.field(UInt16)
        soft_max_pwr_add!: UInt16
        @Struct.field(UInt8)
        history_slots_length!: UInt8
    }
    @Struct.type('ConfigStake')
    export class ConfigStake extends Struct {
        @Struct.field(UInt8)
        unstake_rounds!: UInt8
        @Struct.field(UInt8)
        extra_stake_min_locked_rounds!: UInt8
    }
    @Struct.type('ConfigTeam')
    export class ConfigTeam extends Struct {
        @Struct.field(UInt16)
        change_min_rounds!: UInt16
        @Struct.field(UInt16)
        edit_team_min_rounds!: UInt16
        @Struct.field(UInt16)
        team_edit_max_pct_change!: UInt16
        @Struct.field(UInt32)
        buy_team_cost!: UInt32
        @Struct.field(UInt32)
        owner_stake_required!: UInt32
        @Struct.field(UInt16)
        owner_future_stake_lock_rounds_required!: UInt16
    }
    @Struct.type('ConfigTime')
    export class ConfigTime extends Struct {
        @Struct.field(UInt32)
        rounds_start_sec_since_epoch!: UInt32
        @Struct.field(UInt32)
        round_length_sec!: UInt32
    }
    @Struct.type('ExtendedSymbol')
    export class ExtendedSymbol extends Struct {
        @Struct.field(Asset)
        sym!: Asset
        @Struct.field(Name)
        contract!: Name
    }
    @Struct.type('Global')
    export class Global extends Struct {
        @Struct.field(Name)
        chain_name!: Name
        @Struct.field(UInt64)
        total_power!: UInt64
        @Struct.field(UInt16)
        last_inflation_adjust_round!: UInt16
    }
    @Struct.type('Invite')
    export class Invite extends Struct {
        @Struct.field(UInt64)
        invite_code!: UInt64
        @Struct.field(PublicKey)
        key!: PublicKey
        @Struct.field(UInt16)
        created_round!: UInt16
    }
    @Struct.type('MintLog')
    export class MintLog extends Struct {
        @Struct.field(UInt32)
        power_mint!: UInt32
        @Struct.field(UInt32)
        powered_stake_mint!: UInt32
        @Struct.field(UInt32)
        account_earned!: UInt32
        @Struct.field(UInt32)
        team_cut!: UInt32
        @Struct.field(UInt32)
        team_owner_earned!: UInt32
        @Struct.field(UInt32)
        overstake_mint!: UInt32
        @Struct.field(UInt32)
        total!: UInt32
    }
    @Struct.type('NFT')
    export class NFT extends Struct {
        @Struct.field(UInt64)
        asset_id!: UInt64
        @Struct.field(UInt16)
        locked_until_round!: UInt16
    }
    @Struct.type('NFTMint')
    export class NFTMint extends Struct {
        @Struct.field(Name)
        mint_receiver_boid_id!: Name
        @Struct.field(UInt16)
        mint_quantity_remaining!: UInt16
    }
    @Struct.type('NftAction')
    export class NftAction extends Struct {
        @Struct.field(Name)
        collection_name!: Name
        @Struct.field(Name)
        schema_name!: Name
        @Struct.field(Int32)
        template_id!: Int32
        @Struct.field(AtomicAttribute, {array: true})
        match_immutable_attributes!: AtomicAttribute[]
        @Struct.field(AtomicAttribute, {array: true})
        match_mutable_attributes!: AtomicAttribute[]
        @Struct.field('bool')
        burn!: boolean
        @Struct.field(UInt16)
        lock_rounds!: UInt16
    }
    @Struct.type('NftMint')
    export class NftMint extends Struct {
        @Struct.field(Int32)
        mint_template_id!: Int32
        @Struct.field(Name)
        mint_schema_name!: Name
        @Struct.field(Name)
        mint_collection_name!: Name
        @Struct.field(AtomicAttribute, {array: true})
        immutable_data!: AtomicAttribute[]
        @Struct.field(AtomicAttribute, {array: true})
        mutable_data!: AtomicAttribute[]
        @Struct.field(UInt8)
        quantity!: UInt8
    }
    @Struct.type('Offer')
    export class Offer extends Struct {
        @Struct.field(UInt64)
        offer_id!: UInt64
        @Struct.field(OfferRequirements)
        requirements!: OfferRequirements
        @Struct.field(OfferAction)
        actions!: OfferAction
        @Struct.field(OfferRewards)
        rewards!: OfferRewards
        @Struct.field(OfferLimits)
        limits!: OfferLimits
        @Struct.field(UInt32)
        total_claimed!: UInt32
    }
    @Struct.type('OfferAction')
    export class OfferAction extends Struct {
        @Struct.field(UInt16)
        delegated_stake!: UInt16
        @Struct.field(UInt16)
        stake_locked_additional_rounds!: UInt16
        @Struct.field(NftAction, {array: true})
        nft_actions!: NftAction[]
        @Struct.field(UInt32)
        balance_payment!: UInt32
    }
    @Struct.type('OfferLimits')
    export class OfferLimits extends Struct {
        @Struct.field(UInt32)
        offer_quantity_remaining!: UInt32
        @Struct.field(UInt16)
        available_until_round!: UInt16
    }
    @Struct.type('OfferRequirements')
    export class OfferRequirements extends Struct {
        @Struct.field(Bytes)
        team_id!: Bytes
        @Struct.field(UInt16)
        min_power!: UInt16
        @Struct.field(UInt32)
        min_balance!: UInt32
        @Struct.field(UInt32)
        min_stake!: UInt32
        @Struct.field(UInt32)
        min_cumulative_team_contribution!: UInt32
    }
    @Struct.type('OfferRewards')
    export class OfferRewards extends Struct {
        @Struct.field(NftMint, {array: true})
        nft_mints!: NftMint[]
        @Struct.field(UInt32)
        balance_deposit!: UInt32
        @Struct.field(UInt16)
        delegated_stake!: UInt16
        @Struct.field(UInt16)
        stake_locked_additional_rounds!: UInt16
        @Struct.field(Bytes)
        activate_powermod_ids!: Bytes
    }
    @Struct.type('PermissionLevel')
    export class PermissionLevel extends Struct {
        @Struct.field(Name)
        actor!: Name
        @Struct.field(Name)
        permission!: Name
    }
    @Struct.type('PowerClaimLog')
    export class PowerClaimLog extends Struct {
        @Struct.field(UInt32)
        before!: UInt32
        @Struct.field(UInt32)
        after!: UInt32
        @Struct.field(UInt32)
        from_boosters!: UInt32
        @Struct.field(UInt16)
        elapsed_rounds!: UInt16
    }
    @Struct.type('Sponsor')
    export class Sponsor extends Struct {
        @Struct.field(Name)
        sponsor_boid_id!: Name
        @Struct.field(UInt16)
        invites_balance!: UInt16
        @Struct.field(UInt16)
        invite_codes_unclaimed!: UInt16
        @Struct.field(UInt32)
        invite_codes_claimed!: UInt32
        @Struct.field(UInt32)
        sponsored_upgrades!: UInt32
        @Struct.field(UInt32)
        upgrades_total_earned!: UInt32
    }
    @Struct.type('Stake')
    export class Stake extends Struct {
        @Struct.field(UInt64)
        stake_id!: UInt64
        @Struct.field(Name)
        from_boid_id!: Name
        @Struct.field(Name)
        to_boid_id!: Name
        @Struct.field(UInt16)
        stake_quantity!: UInt16
        @Struct.field(UInt16)
        locked_until_round!: UInt16
    }
    @Struct.type('Team')
    export class Team extends Struct {
        @Struct.field(UInt16)
        team_id!: UInt16
        @Struct.field(UInt32)
        balance!: UInt32
        @Struct.field(AccountStake)
        stake!: AccountStake
        @Struct.field(Name)
        owner!: Name
        @Struct.field(Name, {array: true})
        managers!: Name[]
        @Struct.field(UInt8)
        min_pwr_tax_mult!: UInt8
        @Struct.field(UInt8)
        owner_cut_mult!: UInt8
        @Struct.field('string')
        url_safe_name!: string
        @Struct.field(UInt64)
        power!: UInt64
        @Struct.field(UInt32)
        members!: UInt32
        @Struct.field(UInt16)
        last_edit_round!: UInt16
        @Struct.field(Bytes)
        meta!: Bytes
    }
    @Struct.type('TokenUnstake')
    export class TokenUnstake extends Struct {
        @Struct.field(UInt16)
        redeemable_after_round!: UInt16
        @Struct.field(UInt32)
        quantity!: UInt32
    }
    @Struct.type('account.add')
    export class AccountAdd extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(Name, {array: true})
        owners!: Name[]
        @Struct.field(Name, {array: true})
        sponsors!: Name[]
        @Struct.field(PublicKey, {array: true})
        keys!: PublicKey[]
    }
    @Struct.type('account.buy')
    export class AccountBuy extends Struct {
        @Struct.field(Name)
        payer_boid_id!: Name
        @Struct.field(AccountCreate)
        new_account!: AccountCreate
    }
    @Struct.type('account.edit')
    export class AccountEdit extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(Bytes)
        meta!: Bytes
    }
    @Struct.type('account.free')
    export class AccountFree extends Struct {
        @Struct.field(Name)
        boid_id!: Name
    }
    @Struct.type('account.mod')
    export class AccountMod extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt16)
        received_delegated_stake!: UInt16
    }
    @Struct.type('account.rm')
    export class AccountRm extends Struct {
        @Struct.field(Name)
        boid_id!: Name
    }
    @Struct.type('accounts.clr')
    export class AccountsClr extends Struct {}
    @Struct.type('auth')
    export class Auth extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(Action, {array: true})
        actions!: Action[]
        @Struct.field(Signature)
        sig!: Signature
        @Struct.field(Int32)
        keyindex!: Int32
        @Struct.field(UInt32)
        expires_utc_sec!: UInt32
    }
    @Struct.type('auth.addkey')
    export class AuthAddkey extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(PublicKey)
        key!: PublicKey
    }
    @Struct.type('auth.clear')
    export class AuthClear extends Struct {}
    @Struct.type('auth.init')
    export class AuthInit extends Struct {}
    @Struct.type('auth.rmkey')
    export class AuthRmkey extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(Int32)
        keyindex!: Int32
    }
    @Struct.type('booster.add')
    export class BoosterAdd extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt8)
        mod_id!: UInt8
    }
    @Struct.type('booster.new')
    export class BoosterNew extends Struct {
        @Struct.field(Booster)
        mod!: Booster
    }
    @Struct.type('booster.rm')
    export class BoosterRm extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(Int32, {array: true})
        booster_index!: Int32[]
    }
    @Struct.type('config.clear')
    export class ConfigClear extends Struct {}
    @Struct.type('config.set')
    export class ConfigSet extends Struct {
        @Struct.field(Config)
        config!: Config
    }
    @Struct.type('global.chain')
    export class GlobalChain extends Struct {
        @Struct.field(Name)
        chain_name!: Name
    }
    @Struct.type('global.clear')
    export class GlobalClear extends Struct {}
    @Struct.type('global.set')
    export class GlobalSet extends Struct {
        @Struct.field(Global)
        globaldata!: Global
    }
    @Struct.type('internalxfer')
    export class Internalxfer extends Struct {
        @Struct.field(Name)
        from_boid_id!: Name
        @Struct.field(Name)
        to_boid_id!: Name
        @Struct.field(UInt32)
        quantity!: UInt32
        @Struct.field('string')
        memo!: string
    }
    @Struct.type('invite.add')
    export class InviteAdd extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt64)
        invite_code!: UInt64
        @Struct.field(PublicKey)
        key!: PublicKey
    }
    @Struct.type('invite.buy')
    export class InviteBuy extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt16)
        quantity!: UInt16
    }
    @Struct.type('invite.claim')
    export class InviteClaim extends Struct {
        @Struct.field(Name)
        sponsor_boid_id!: Name
        @Struct.field(UInt64)
        invite_code!: UInt64
        @Struct.field(Signature)
        sig!: Signature
        @Struct.field(AccountCreate)
        new_account!: AccountCreate
    }
    @Struct.type('invite.rm')
    export class InviteRm extends Struct {
        @Struct.field(Name)
        sponsor_boid_id!: Name
        @Struct.field(UInt64)
        invite_code!: UInt64
    }
    @Struct.type('logpwradd')
    export class Logpwradd extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt16)
        received!: UInt16
        @Struct.field(UInt16)
        from_mult_mods!: UInt16
        @Struct.field(UInt16)
        diverted_to_sponsor!: UInt16
        @Struct.field(UInt16)
        power_increased!: UInt16
        @Struct.field(Name)
        orign!: Name
    }
    @Struct.type('logpwrclaim')
    export class Logpwrclaim extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(PowerClaimLog)
        power!: PowerClaimLog
        @Struct.field(MintLog)
        mint!: MintLog
    }
    @Struct.type('meta.clean')
    export class MetaClean extends Struct {}
    @Struct.type('mint')
    export class Mint extends Struct {
        @Struct.field(Name)
        to!: Name
        @Struct.field(UInt32)
        whole_quantity!: UInt32
    }
    @Struct.type('nft.lock')
    export class NftLock extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt64)
        asset_id!: UInt64
        @Struct.field(UInt16)
        locked_until_round!: UInt16
    }
    @Struct.type('nft.receiver')
    export class NftReceiver extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt16)
        mint_quantity!: UInt16
    }
    @Struct.type('nft.withdraw')
    export class NftWithdraw extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt64, {array: true})
        asset_ids!: UInt64[]
        @Struct.field(Name)
        to!: Name
    }
    @Struct.type('nft.xfer')
    export class NftXfer extends Struct {
        @Struct.field(Name)
        from_boid_id!: Name
        @Struct.field(Name)
        to_boid_id!: Name
        @Struct.field(UInt64, {array: true})
        asset_ids!: UInt64[]
    }
    @Struct.type('offer.add')
    export class OfferAdd extends Struct {
        @Struct.field(OfferRequirements)
        requirements!: OfferRequirements
        @Struct.field(OfferAction)
        actions!: OfferAction
        @Struct.field(OfferRewards)
        rewards!: OfferRewards
        @Struct.field(OfferLimits)
        limits!: OfferLimits
    }
    @Struct.type('offer.claim')
    export class OfferClaim extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt64)
        offer_id!: UInt64
        @Struct.field(UInt64, {array: true})
        required_nft_action_ids!: UInt64[]
    }
    @Struct.type('offer.clean')
    export class OfferClean extends Struct {}
    @Struct.type('offer.rm')
    export class OfferRm extends Struct {
        @Struct.field(UInt64)
        offer_id!: UInt64
    }
    @Struct.type('owner.add')
    export class OwnerAdd extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(Name)
        owner!: Name
    }
    @Struct.type('owner.rm')
    export class OwnerRm extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(Name)
        owner!: Name
    }
    @Struct.type('power.add')
    export class PowerAdd extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt16)
        power!: UInt16
    }
    @Struct.type('power.claim')
    export class PowerClaim extends Struct {
        @Struct.field(Name)
        boid_id!: Name
    }
    @Struct.type('rmdelegstake')
    export class Rmdelegstake extends Struct {
        @Struct.field(UInt64)
        stake_id!: UInt64
    }
    @Struct.type('sponsor.rm')
    export class SponsorRm extends Struct {
        @Struct.field(Name)
        sponsor_boid_id!: Name
    }
    @Struct.type('sponsor.set')
    export class SponsorSet extends Struct {
        @Struct.field(Sponsor)
        row!: Sponsor
    }
    @Struct.type('stake')
    export class Stake extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt32)
        quantity!: UInt32
    }
    @Struct.type('stake.deleg')
    export class StakeDeleg extends Struct {
        @Struct.field(Name)
        from_boid_id!: Name
        @Struct.field(Name)
        to_boid_id!: Name
        @Struct.field(UInt16)
        stake_quantity!: UInt16
        @Struct.field(UInt16)
        lock_until_round!: UInt16
    }
    @Struct.type('team.change')
    export class TeamChange extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt8)
        new_team_id!: UInt8
        @Struct.field(UInt8)
        new_pwr_tax_mult!: UInt8
    }
    @Struct.type('team.create')
    export class TeamCreate extends Struct {
        @Struct.field(Name)
        owner!: Name
        @Struct.field(UInt8)
        min_pwr_tax_mult!: UInt8
        @Struct.field(UInt8)
        owner_cut_mult!: UInt8
        @Struct.field('string')
        url_safe_name!: string
    }
    @Struct.type('team.edit')
    export class TeamEdit extends Struct {
        @Struct.field(UInt8)
        team_id!: UInt8
        @Struct.field(Name)
        owner!: Name
        @Struct.field(Name, {array: true})
        managers!: Name[]
        @Struct.field(UInt8)
        min_pwr_tax_mult!: UInt8
        @Struct.field(UInt8)
        owner_cut_mult!: UInt8
        @Struct.field('string')
        url_safe_name!: string
        @Struct.field(Bytes)
        meta!: Bytes
    }
    @Struct.type('team.rm')
    export class TeamRm extends Struct {
        @Struct.field(UInt8)
        team_id!: UInt8
    }
    @Struct.type('team.setmem')
    export class TeamSetmem extends Struct {
        @Struct.field(UInt8)
        team_id!: UInt8
        @Struct.field(UInt32)
        new_members!: UInt32
    }
    @Struct.type('team.setpwr')
    export class TeamSetpwr extends Struct {
        @Struct.field(UInt8)
        team_id!: UInt8
        @Struct.field(UInt32)
        new_power!: UInt32
    }
    @Struct.type('team.taxrate')
    export class TeamTaxrate extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt8)
        new_pwr_tax_mult!: UInt8
    }
    @Struct.type('thisround')
    export class Thisround extends Struct {}
    @Struct.type('unstake.end')
    export class UnstakeEnd extends Struct {
        @Struct.field(Name)
        boid_id!: Name
    }
    @Struct.type('unstake.init')
    export class UnstakeInit extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt32)
        quantity!: UInt32
    }
    @Struct.type('unstake.stop')
    export class UnstakeStop extends Struct {
        @Struct.field(Name)
        boid_id!: Name
    }
    @Struct.type('unstke.deleg')
    export class UnstkeDeleg extends Struct {
        @Struct.field(UInt64)
        stake_id!: UInt64
    }
    @Struct.type('withdraw')
    export class Withdraw extends Struct {
        @Struct.field(Name)
        boid_id!: Name
        @Struct.field(UInt32)
        quantity!: UInt32
        @Struct.field(Name)
        to!: Name
    }
}
const TableMap = {
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
