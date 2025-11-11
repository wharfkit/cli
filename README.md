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

### Compiling Smart Contracts

The CLI includes a `compile` command to compile C++ contract files to WASM format using the CDT (Contract Development Toolkit) that comes with LEAP.

#### Prerequisites

The compile command requires LEAP to be installed (which includes the CDT compiler). You can install it automatically by running:

```bash
wharfkit chain local start
```

#### Usage

**Compile a single file:**
```bash
wharfkit wharfkit compile mycontract.cpp
```

**Compile all .cpp files in the current directory:**
```bash
wharfkit wharfkit compile
```

**Specify output directory:**
```bash
wharfkit wharfkit compile mycontract.cpp -o ./build
```

#### Output

By default, compiled WASM files are output to the current directory. You can specify a different output directory using the `-o` or `--output` flag.

For example:
```bash
wharfkit wharfkit compile -o ./build
```

This will compile all .cpp files in the current directory and save the resulting .wasm files to the `./build` directory.

#### Options

```
-o, --output <directory>  Output directory for compiled WASM files (default: ".")
-h, --help                display help for command
```

### Managing a Local Blockchain

The CLI includes tools to quickly set up and manage a local LEAP blockchain for development and testing.

#### Quick Start

Start a local blockchain with one command (automatically installs LEAP if needed):

```bash
wharfkit chain local start
```

This will:
- ✅ Automatically detect and install LEAP (nodeos/cleos) if not present
- ✅ Create necessary configuration and data directories
- ✅ Start nodeos with sensible defaults for development
- ✅ Set up a dev wallet with pre-configured keys
- ✅ Begin producing blocks immediately

#### Available Commands

**Start the local chain:**
```bash
# Basic start
wharfkit chain local start

# Start with clean state (reset blockchain data)
wharfkit chain local start --clean

# Start on a custom port (default: 8888)
wharfkit chain local start --port 9000
```

**Check chain status:**
```bash
wharfkit chain local status
```

Shows:
- Running status and PID
- Chain URL and data directory
- Current head block number

**View chain logs:**
```bash
# Show last 50 log lines (includes block production)
wharfkit chain local logs

# Follow logs in real-time
wharfkit chain local logs --follow

# Show only errors and warnings
wharfkit chain local logs --errors

# Follow only errors and warnings
wharfkit chain local logs --follow --errors
```

**Stop the chain:**
```bash
wharfkit chain local stop
```

**Check LEAP installation:**
```bash
wharfkit chain check
```

Shows which LEAP binaries are installed and their versions.

#### Development Keys

The local chain comes with pre-configured development keys:

```
Public Key:  EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV
Private Key: 5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3
```

These are automatically imported into the dev wallet.

#### Configuration

- **Chain URL:** `http://127.0.0.1:8888` (or custom port)
- **Data Directory:** `~/.wharfkit/chain`
- **Config Directory:** `~/.wharfkit/config`
- **Wallet Directory:** `~/.wharfkit/wallet`

#### Troubleshooting

If the chain fails to start:
1. Check logs: `wharfkit chain local logs --errors`
2. Clean state: `wharfkit chain local start --clean`
3. Verify LEAP: `wharfkit chain check`

---

Made with ☕️ & ❤️ by [Greymass](https://greymass.com).
