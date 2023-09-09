# @wharfkit/cli

The @wharfkit command line tool.

## Installation

This command line tool currently requires the use of nodejs version 18 or above (due to its usage of built-in fetch).

It can be run using `npx`:

```bash
npx @wharfkit/cli help
```

or installed globally and run as `wharfkit`:

```
npm install -g @wharfkit/cli

wharfkit help
```

## Usage

Once installed, simply run `wharfkit` to see a list of available commands.

```bash
Usage: wharfkit [options] [command]

Wharf Command Line Utilities

Options:
  -V, --version                 output the version number
  -h, --help                    display help for command

Commands:
  generate [options] <account>  Generate Contract Kit code for the named smart contract
  help [command]                display help for command
```

### Generating Contract Code

The cli tool is capable of generating Typescript code based on a deployed smart contract for use in your application.

```bash
npx @wharfkit/cli generate [options] <account>
```

To generate the code for the `eosio.token` contract on the Jungle 4 testnet:

```bash
npx @wharfkit/cli generate -u https://jungle4.greymass.com eosio.token 
```

This will output the code directly into the console window similar to [this example code](https://github.com/wharfkit/cli/blob/master/test/data/contracts/mock-eosio.token.ts). 

If you'd prefer to save this as a file, use the `-f` flag followed by a filename:

```bash
npx @wharfkit/cli generate -u https://jungle4.greymass.com eosio.token -f tokencontract.ts
```

To see a full list of options for the `generate` command, run the `help` command against it:

```
npx @wharfkit/cli help generate
```

---

Made with ☕️ & ❤️ by [Greymass](https://greymass.com).
