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
  keys                          Generate a new set of public and private keys
  account [options]             Create a new account with an optional public key
  generate [options] <account>  Generate Contract Kit code for the named smart contract
  chain                         Manage local LEAP blockchain
  wharfkit                      Compile C++ contract files
  wallet                        Manage local wallet and sign transactions
  help [command]                display help for command
```

### Managing Wallet Keys

The CLI includes a secure wallet system for managing private keys and signing transactions locally.

#### Creating Keys

Create a new wallet key with default encryption:

```bash
wharfkit wallet create
```

Create a key with a custom name and password:

```bash
wharfkit wallet create --name mykey --password
```

When the `--password` flag is used, you'll be prompted to enter and confirm a password. Otherwise, keys are encrypted with a default password (not stored in plain text).

#### Listing Keys

View all keys in your wallet:

```bash
wharfkit wallet keys
```

Output example:
```
Found 2 key(s) in wallet:

1. default
   Public Key: PUB_K1_5TXDWwucfSa9Ghh49di3vxthzUcLSDE5yuxEMCJvw29Jpjq4mp
   Created: 11/10/2025, 10:25:34 PM

2. mykey
   Public Key: PUB_K1_8KL3xG2WPZQAVd1ze2eY3Fgzr9DWF9hDhjusYgPegfHeNQDeF1
   Created: 11/10/2025, 10:25:47 PM
```

#### Creating Additional Keys

Create additional keys in your wallet:

```bash
# With auto-generated name
wharfkit wallet keys create

# With custom name
wharfkit wallet keys create --name production

# With custom password
wharfkit wallet keys create --name production --password
```

#### Signing Transactions

Sign a transaction using a key from your wallet:

```bash
# Sign with default key (uses 'default' key or first available)
wharfkit wallet sign transaction.json

# Sign with specific key
wharfkit wallet sign transaction.json --key mykey

# Sign with password-protected key
wharfkit wallet sign transaction.json --key production --password

# Save signed transaction to file
wharfkit wallet sign transaction.json --output signed.json
```

The transaction can be provided as:
- A path to a JSON file containing the transaction
- A JSON string directly on the command line

Example transaction format:
```json
{
  "expiration": "2025-11-11T00:00:00",
  "ref_block_num": 12345,
  "ref_block_prefix": 67890,
  "max_net_usage_words": 0,
  "max_cpu_usage_ms": 0,
  "delay_sec": 0,
  "context_free_actions": [],
  "actions": [
    {
      "account": "eosio.token",
      "name": "transfer",
      "authorization": [
        {
          "actor": "testaccount",
          "permission": "active"
        }
      ],
      "data": "..."
    }
  ],
  "transaction_extensions": []
}
```

#### Security Notes

- All keys are stored encrypted in `~/.wharfkit/wallet/keys.json`
- Keys are **never** stored in plain text
- If no password is provided, a default encryption password is used
- For production use, always use custom passwords with the `--password` flag
- The wallet file has restrictive permissions (0600) to prevent unauthorized access

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
