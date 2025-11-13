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
  generate [options] <account>  Generate Contract Kit code for the named smart contract
  chain                         Manage local LEAP blockchain
  compile [options] [file]      Compile C++ contract files
  deploy [options] [wasm]       Deploy a compiled contract to the blockchain
  dev [options]                 Start local chain and watch for changes
  wallet                        Manage wallet, accounts, and sign transactions
  help [command]                display help for command
```

### Creating Accounts

Create new accounts on the local blockchain (requires local chain to be running).

#### Create Account with Auto-generated Name

```bash
wharfkit wallet account create
```

This will:
1. Generate a random 12-character account name
2. Generate a new key pair for the account
3. Create the account on the blockchain using the dev keys
4. Allocate RAM (8192 bytes) and stake CPU/NET (1.0000 SYS each)
5. Automatically store the private key in your wallet with the account name

#### Create Account with Custom Name

```bash
wharfkit wallet account create --name mycontract
```

#### Create Account on Remote Chain

```bash
wharfkit wallet account create --url https://jungle4.greymass.com --name myaccount
```

**Note:** The account creation command uses Wharf Session Kit and automatically stores the generated key in your wallet with the account name. This makes it seamless to deploy contracts later - just use `wharfkit deploy --account mycontract` and it will automatically find and use the right key!

### Managing Wallet Keys

The CLI includes a secure wallet system for managing private keys, creating accounts, and signing transactions locally.

The `wallet` command is your central hub for all key and account management.

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
    wharfkit wallet transact transaction.json

# Sign with specific key
    wharfkit wallet transact transaction.json --key mykey

# Sign with password-protected key
    wharfkit wallet transact transaction.json --key production --password

# Save signed transaction to file
    wharfkit wallet transact transaction.json --output signed.json

# Sign and broadcast to a local node
    wharfkit wallet transact transaction.json --broadcast --url http://127.0.0.1:8888
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
wharfkit compile mycontract.cpp
```

**Compile all .cpp files in the current directory:**
```bash
wharfkit compile
```

**Specify output directory:**
```bash
wharfkit compile mycontract.cpp -o ./build
```

#### Output

By default, compiled WASM files are output to the current directory. You can specify a different output directory using the `-o` or `--output` flag.

For example:
```bash
wharfkit compile -o ./build
```

This will compile all .cpp files in the current directory and save the resulting .wasm files to the `./build` directory.

#### Options

```
-o, --output <directory>  Output directory for compiled WASM files (default: ".")
-h, --help                display help for command
```

### Deploying Contracts

Deploy compiled smart contracts to a blockchain.

#### Deploy a Specific WASM File

```bash
wharfkit deploy mycontract.wasm
```

The command will automatically look for the corresponding `.abi` file alongside the WASM file.

#### Deploy with Custom Account Name

```bash
wharfkit deploy mycontract.wasm --account myaccount
```

#### Deploy to a Specific Blockchain

```bash
# Deploy to local chain (default)
wharfkit deploy mycontract.wasm

# Deploy to a remote chain
wharfkit deploy mycontract.wasm --url https://jungle4.greymass.com
```

#### Auto-detect WASM File

If you have only one `.wasm` file in your current directory, you can omit the filename:

```bash
wharfkit deploy
```

#### Deploy Options

```
-a, --account <name>  Contract account name (default: derived from filename)
-u, --url <url>       Blockchain API URL (default: http://127.0.0.1:8888)
-h, --help            display help for command
```

**Note:** Deploy uses Wharf Session Kit with your wallet keys. The deployment key is automatically selected:
1. First, tries to find a wallet key with the same name as the account
2. Falls back to the 'default' key if available
3. Uses the first available key as a last resort

To ensure smooth deployment, create an account first with `wharfkit wallet account create`, which automatically stores the key in your wallet.

### Development Mode

The `dev` command provides a complete development workflow: it starts a local blockchain and automatically compiles and deploys your contract whenever you make changes to your C++ files.

#### Start Development Mode

```bash
wharfkit dev
```

This will:
1. ✅ Start a local LEAP blockchain (if not already running)
2. ✅ Compile all `.cpp` files in the current directory
3. ✅ Deploy the compiled contract using Wharf Session Kit
4. ✅ Watch for changes to `.cpp`, `.hpp`, and `.h` files
5. ✅ Automatically recompile and redeploy on changes

#### Development Mode with Options

```bash
# Start with a clean blockchain state
wharfkit dev --clean

# Specify contract account name
wharfkit dev --account mycontract

# Use a custom port
wharfkit dev --port 9000

# Combine options
wharfkit dev --clean --account mycontract --port 9000
```

#### Dev Mode Options

```
-a, --account <name>  Contract account name (default: derived from filename)
-p, --port <port>     Port for local blockchain (default: 8888)
-c, --clean           Start with a clean blockchain state
-h, --help            display help for command
```

#### Development Workflow

The typical development workflow is:

1. Navigate to your contract directory:
   ```bash
   cd my-contract
   ```

2. Start development mode:
   ```bash
   wharfkit dev
   ```

3. Edit your contract files (`.cpp`, `.hpp`)
   - The contract will automatically recompile and redeploy
   - Watch the console for compilation and deployment status

4. Test your contract using WharfKit sessions or your preferred tools

5. Stop development mode with `Ctrl+C`

**Note:** Development mode is designed for rapid iteration during development. For production deployments, use `wharfkit compile` followed by `wharfkit deploy` with appropriate production settings.

### Managing a Local Blockchain

The CLI includes tools to quickly set up and manage a local LEAP blockchain for development and testing.

#### Quick Start

Start a local blockchain with one command (automatically installs LEAP if needed):

```bash
wharfkit chain local start
```

This will:
- ✅ Automatically detect and install LEAP (nodeos) if not present
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
