// import {Contract, GetTableRowsOptions, Table, TableCursor} from '@wharfkit/contract'
// import {
//     APIClient,
//     Asset,
//     AssetType,
//     Checksum256,
//     Checksum256Type,
//     Float64,
//     Float64Type,
//     Name,
//     NameType,
//     Session,
//     Struct,
//     TimePoint,
//     TimePointSec,
//     TimePointType,
//     TransactResult,
//     UInt128,
//     UInt128Type,
//     UInt16,
//     UInt16Type,
//     UInt32,
//     UInt32Type,
//     UInt64,
//     UInt64Type,
//     UInt8,
//     UInt8Type,
// } from '@wharfkit/session'

// export namespace _EosioToken {
//     export namespace actions {
//         export function close(
//             closeParams: _EosioToken.types.CloseParams,
//             session: Session
//         ): Promise<TransactResult> {
//             const contract = Contract.from({name: 'eosio.token'})
//             return contract.call('close', _EosioToken.types.Close.from(closeParams), session)
//         }
//         export function create(
//             createParams: _EosioToken.types.CreateParams,
//             session: Session
//         ): Promise<TransactResult> {
//             const contract = Contract.from({name: 'eosio.token'})
//             return contract.call('create', _EosioToken.types.Create.from(createParams), session)
//         }
//         export function issue(
//             issueParams: _EosioToken.types.IssueParams,
//             session: Session
//         ): Promise<TransactResult> {
//             const contract = Contract.from({name: 'eosio.token'})
//             return contract.call('issue', _EosioToken.types.Issue.from(issueParams), session)
//         }
//         export function open(
//             openParams: _EosioToken.types.OpenParams,
//             session: Session
//         ): Promise<TransactResult> {
//             const contract = Contract.from({name: 'eosio.token'})
//             return contract.call('open', _EosioToken.types.Open.from(openParams), session)
//         }
//         export function retire(
//             retireParams: _EosioToken.types.RetireParams,
//             session: Session
//         ): Promise<TransactResult> {
//             const contract = Contract.from({name: 'eosio.token'})
//             return contract.call('retire', _EosioToken.types.Retire.from(retireParams), session)
//         }
//         export function transfer(
//             transferParams: _EosioToken.types.TransferParams,
//             session: Session
//         ): Promise<TransactResult> {
//             const contract = Contract.from({name: 'eosio.token'})
//             return contract.call(
//                 'transfer',
//                 _EosioToken.types.Transfer.from(transferParams),
//                 session
//             )
//         }
//     }
// }
// export namespace _EosioToken {
//     export namespace tables {
//         export class accounts {
//             static fieldToIndex = {balance: {type: 'balance', index_position: 'primary'}}
//             static query(
//                 queryParams: _EosioToken.types.AccountsQueryParams,
//                 getTableRowsOptions: GetTableRowsOptions,
//                 client: APIClient
//             ): TableCursor<_EosioToken.types.Account> {
//                 const accountsTable = Table.from({
//                     contract: Contract.from({name: 'eosio.token', client: client}),
//                     name: 'accounts',
//                     rowType: _EosioToken.types.Account,
//                     fieldToIndex: accounts.fieldToIndex,
//                 })
//                 return accountsTable.query(queryParams, getTableRowsOptions)
//             }
//             static get(
//                 queryParams: _EosioToken.types.AccountsFindQueryParams,
//                 client: APIClient
//             ): Promise<_EosioToken.types.Account> {
//                 const accountsTable = Table.from({
//                     contract: Contract.from({name: 'eosio.token', client: client}),
//                     name: 'accounts',
//                     rowType: _EosioToken.types.Account,
//                     fieldToIndex: accounts.fieldToIndex,
//                 })
//                 return accountsTable.get(queryParams)
//             }
//             static first(limit: number, client: APIClient): TableCursor<_EosioToken.types.Account> {
//                 const accountsTable = Table.from({
//                     contract: Contract.from({name: 'eosio.token', client: client}),
//                     name: 'accounts',
//                     rowType: _EosioToken.types.Account,
//                     fieldToIndex: accounts.fieldToIndex,
//                 })
//                 return accountsTable.first(limit)
//             }
//             static cursor(client: APIClient): TableCursor<_EosioToken.types.Account> {
//                 const accountsTable = Table.from({
//                     contract: Contract.from({name: 'eosio.token', client: client}),
//                     name: 'accounts',
//                     rowType: _EosioToken.types.Account,
//                     fieldToIndex: accounts.fieldToIndex,
//                 })
//                 return accountsTable.cursor()
//             }
//             static all(client: APIClient): Promise<_EosioToken.types.Account[]> {
//                 const accountsTable = Table.from({
//                     contract: Contract.from({name: 'eosio.token', client: client}),
//                     name: 'accounts',
//                     rowType: _EosioToken.types.Account,
//                     fieldToIndex: accounts.fieldToIndex,
//                 })
//                 return accountsTable.all()
//             }
//         }
//         export class stat {
//             static fieldToIndex = {supply: {type: 'supply', index_position: 'primary'}}
//             static query(
//                 queryParams: _EosioToken.types.StatQueryParams,
//                 getTableRowsOptions: GetTableRowsOptions,
//                 client: APIClient
//             ): TableCursor<_EosioToken.types.Currency_stats> {
//                 const statTable = Table.from({
//                     contract: Contract.from({name: 'eosio.token', client: client}),
//                     name: 'stat',
//                     rowType: _EosioToken.types.Currency_stats,
//                     fieldToIndex: stat.fieldToIndex,
//                 })
//                 return statTable.query(queryParams, getTableRowsOptions)
//             }
//             static get(
//                 queryParams: _EosioToken.types.StatFindQueryParams,
//                 client: APIClient
//             ): Promise<_EosioToken.types.Currency_stats> {
//                 const statTable = Table.from({
//                     contract: Contract.from({name: 'eosio.token', client: client}),
//                     name: 'stat',
//                     rowType: _EosioToken.types.Currency_stats,
//                     fieldToIndex: stat.fieldToIndex,
//                 })
//                 return statTable.get(queryParams)
//             }
//             static first(
//                 limit: number,
//                 client: APIClient
//             ): TableCursor<_EosioToken.types.Currency_stats> {
//                 const statTable = Table.from({
//                     contract: Contract.from({name: 'eosio.token', client: client}),
//                     name: 'stat',
//                     rowType: _EosioToken.types.Currency_stats,
//                     fieldToIndex: stat.fieldToIndex,
//                 })
//                 return statTable.first(limit)
//             }
//             static cursor(client: APIClient): TableCursor<_EosioToken.types.Currency_stats> {
//                 const statTable = Table.from({
//                     contract: Contract.from({name: 'eosio.token', client: client}),
//                     name: 'stat',
//                     rowType: _EosioToken.types.Currency_stats,
//                     fieldToIndex: stat.fieldToIndex,
//                 })
//                 return statTable.cursor()
//             }
//             static all(client: APIClient): Promise<_EosioToken.types.Currency_stats[]> {
//                 const statTable = Table.from({
//                     contract: Contract.from({name: 'eosio.token', client: client}),
//                     name: 'stat',
//                     rowType: _EosioToken.types.Currency_stats,
//                     fieldToIndex: stat.fieldToIndex,
//                 })
//                 return statTable.all()
//             }
//         }
//     }
// }
// export namespace _EosioToken {
//     export namespace types {
//         export interface CloseParams {
//             owner: NameType
//             symbol: symbol
//         }
//         export interface CreateParams {
//             issuer: NameType
//             maximum_supply: AssetType
//         }
//         export interface IssueParams {
//             to: NameType
//             quantity: AssetType
//             memo: string
//         }
//         export interface OpenParams {
//             owner: NameType
//             symbol: symbol
//             ram_payer: NameType
//         }
//         export interface RetireParams {
//             quantity: AssetType
//             memo: string
//         }
//         export interface TransferParams {
//             from: NameType
//             to: NameType
//             quantity: AssetType
//             memo: string
//         }
//         export interface AccountsQueryParams {
//             balance?: {
//                 from: AssetType
//                 to: AssetType
//             }
//         }
//         export interface AccountsFindQueryParams {
//             balance?: AssetType
//         }
//         export interface StatQueryParams {
//             supply?: {
//                 from: AssetType
//                 to: AssetType
//             }
//             max_supply?: {
//                 from: AssetType
//                 to: AssetType
//             }
//             issuer?: {
//                 from: NameType
//                 to: NameType
//             }
//         }
//         export interface StatFindQueryParams {
//             supply?: AssetType
//             max_supply?: AssetType
//             issuer?: NameType
//         }
//         @Struct.type('account')
//         export class Account extends Struct {
//             @Struct.field('asset')
//             declare balance: Asset
//         }
//         @Struct.type('close')
//         export class Close extends Struct {
//             @Struct.field('name')
//             declare owner: Name
//             @Struct.field('symbol')
//             declare symbol: symbol
//         }
//         @Struct.type('create')
//         export class Create extends Struct {
//             @Struct.field('name')
//             declare issuer: Name
//             @Struct.field('asset')
//             declare maximum_supply: Asset
//         }
//         @Struct.type('currency_stats')
//         export class Currency_stats extends Struct {
//             @Struct.field('asset')
//             declare supply: Asset
//             @Struct.field('asset')
//             declare max_supply: Asset
//             @Struct.field('name')
//             declare issuer: Name
//         }
//         @Struct.type('issue')
//         export class Issue extends Struct {
//             @Struct.field('name')
//             declare to: Name
//             @Struct.field('asset')
//             declare quantity: Asset
//             @Struct.field('string')
//             declare memo: string
//         }
//         @Struct.type('open')
//         export class Open extends Struct {
//             @Struct.field('name')
//             declare owner: Name
//             @Struct.field('symbol')
//             declare symbol: symbol
//             @Struct.field('name')
//             declare ram_payer: Name
//         }
//         @Struct.type('retire')
//         export class Retire extends Struct {
//             @Struct.field('asset')
//             declare quantity: Asset
//             @Struct.field('string')
//             declare memo: string
//         }
//         @Struct.type('transfer')
//         export class Transfer extends Struct {
//             @Struct.field('name')
//             declare from: Name
//             @Struct.field('name')
//             declare to: Name
//             @Struct.field('asset')
//             declare quantity: Asset
//             @Struct.field('string')
//             declare memo: string
//         }
//     }
// }
