SHELL := /bin/bash
SRC_FILES := $(shell find src -name '*.ts')
TEST_FILES := $(shell find test/tests -name '*.ts')
MOCHA_OPTS := -u tdd -r ts-node/register -r tsconfig-paths/register --extension ts
BIN := ./node_modules/.bin

lib: ${SRC_FILES} package.json tsconfig.json node_modules rollup.config.js
	@${BIN}/rollup -c && touch lib

.PHONY: test
test: node_modules
	@TS_NODE_PROJECT='./test/tsconfig.json' MOCK_DIR='./test/data/requests' \
		${BIN}/mocha ${MOCHA_OPTS} ${TEST_FILES} --no-timeout --grep '$(grep)'

.PHONY: ci-test
ci-test: node_modules
	@TS_NODE_PROJECT='./test/tsconfig.json' MOCK_DIR='./test/data/requests' \
		${BIN}/nyc ${NYC_OPTS} --reporter=text \
		${BIN}/mocha ${MOCHA_OPTS} -R list ${TEST_FILES} --no-timeout

.PHONY: test_generate
test_generate: node_modules clean lib
	node lib/cli.js generate eosio.token -u https://jungle4.greymass.com

.PHONY: update_mock_contracts
update_mock_contracts: node_modules clean lib
	# node lib/cli.js generate atomicassets -u https://jungle4.greymass.com -j test/data/abis/atomicassets.json -f test/data/contracts/mock-atomicassets.ts -e .eslintrc
	# node lib/cli.js generate boid -u https://jungle4.greymass.com -j test/data/abis/boid.json -f test/data/contracts/mock-boid.ts -e .eslintrc
	# node lib/cli.js generate payroll.boid -u https://telos.api.animus.is -j test/data/abis/payroll.boid.json -f test/data/contracts/mock-payroll.boid.ts -e .eslintrc
	# node lib/cli.js generate eosio -u https://jungle4.greymass.com -j test/data/abis/eosio.json -f test/data/contracts/mock-eosio.ts -e .eslintrc
	# node lib/cli.js generate eosio.msig -u https://jungle4.greymass.com -j test/data/abis/eosio.msig.json -f test/data/contracts/mock-eosio.msig.ts -e .eslintrc
	# node lib/cli.js generate eosio.token -u https://jungle4.greymass.com -j test/data/abis/eosio.token.json -f test/data/contracts/mock-eosio.token.ts -e .eslintrc
	# node lib/cli.js generate hegemon.hgm -u https://jungle4.greymass.com -j test/data/abis/hegemon.hgm.json -f test/data/contracts/mock-hegemon.hgm.ts -e .eslintrc
	# node lib/cli.js generate rewards.gm -u https://jungle4.greymass.com -j test/data/abis/rewards.gm.json -f test/data/contracts/mock-rewards.gm.ts -e .eslintrc
	# node lib/cli.js generate testing.gm -u https://jungle4.greymass.com -j test/data/abis/testing.gm.json -f test/data/contracts/mock-testing.gm.ts -e .eslintrc
	node lib/cli.js generate unicove2.gm -u https://jungle4.greymass.com -j test/data/abis/unicove2.gm.json -f test/data/contracts/mock-unicove2.gm.ts -e .eslintrc

.PHONY: update_mock_abis
update_mock_abis:
	@mkdir -p test/data/abis
	@echo "Downloading mock ABIs..."
	@curl -s -X POST -H "Content-Type: application/json" -d '{"account_name":"atomicassets"}' https://eos.greymass.com/v1/chain/get_abi | (command -v jq >/dev/null && jq '.abi // {}' || python -c "import sys, json; data = json.load(sys.stdin); print(json.dumps(data.get('abi', {}), indent=4))") > test/data/abis/atomicassets.json
	@curl -s -X POST -H "Content-Type: application/json" -d '{"account_name":"boid"}' https://eos.greymass.com/v1/chain/get_abi | (command -v jq >/dev/null && jq '.abi // {}' || python -c "import sys, json; data = json.load(sys.stdin); print(json.dumps(data.get('abi', {}), indent=4))") > test/data/abis/boid.json
	@curl -s -X POST -H "Content-Type: application/json" -d '{"account_name":"payroll.boid"}' https://telos.api.animus.is/v1/chain/get_abi | (command -v jq >/dev/null && jq '.abi // {}' || python -c "import sys, json; data = json.load(sys.stdin); print(json.dumps(data.get('abi', {}), indent=4))") > test/data/abis/payroll.boid.json
	@curl -s -X POST -H "Content-Type: application/json" -d '{"account_name":"eosio"}' https://eos.greymass.com/v1/chain/get_abi | (command -v jq >/dev/null && jq '.abi // {}' || python -c "import sys, json; data = json.load(sys.stdin); print(json.dumps(data.get('abi', {}), indent=4))") > test/data/abis/eosio.json
	@curl -s -X POST -H "Content-Type: application/json" -d '{"account_name":"eosio.msig"}' https://jungle4.greymass.com/v1/chain/get_abi | (command -v jq >/dev/null && jq '.abi // {}' || python -c "import sys, json; data = json.load(sys.stdin); print(json.dumps(data.get('abi', {}), indent=4))") > test/data/abis/eosio.msig.json
	@curl -s -X POST -H "Content-Type: application/json" -d '{"account_name":"eosio.token"}' https://eos.greymass.com/v1/chain/get_abi | (command -v jq >/dev/null && jq '.abi // {}' || python -c "import sys, json; data = json.load(sys.stdin); print(json.dumps(data.get('abi', {}), indent=4))") > test/data/abis/eosio.token.json
	@curl -s -X POST -H "Content-Type: application/json" -d '{"account_name":"hegemon.hgm"}' https://ux5.goldenplatform.com/v1/chain/get_abi | (command -v jq >/dev/null && jq '.abi // {}' || python -c "import sys, json; data = json.load(sys.stdin); print(json.dumps(data.get('abi', {}), indent=4))") > test/data/abis/hegemon.hgm.json
	@curl -s -X POST -H "Content-Type: application/json" -d '{"account_name":"rewards.gm"}' https://eos.greymass.com/v1/chain/get_abi | (command -v jq >/dev/null && jq '.abi // {}' || python -c "import sys, json; data = json.load(sys.stdin); print(json.dumps(data.get('abi', {}), indent=4))") > test/data/abis/rewards.gm.json
	@curl -s -X POST -H "Content-Type: application/json" -d '{"account_name":"testing.gm"}' https://jungle4.greymass.com/v1/chain/get_abi | (command -v jq >/dev/null && jq '.abi // {}' || python -c "import sys, json; data = json.load(sys.stdin); print(json.dumps(data.get('abi', {}), indent=4))") > test/data/abis/testing.gm.json
	@curl -s -X POST -H "Content-Type: application/json" -d '{"account_name":"unicove2.gm"}' https://jungle4.greymass.com/v1/chain/get_abi | (command -v jq >/dev/null && jq '.abi // {}' || python -c "import sys, json; data = json.load(sys.stdin); print(json.dumps(data.get('abi', {}), indent=4))") > test/data/abis/unicove2.gm.json
	@echo "All mock ABIs updated successfully"

.PHONY: check
check: node_modules
	@${BIN}/eslint src test --ext .ts --max-warnings 0 --format unix && echo "Ok"

.PHONY: format
format: node_modules
	@${BIN}/eslint src test --ext .ts --fix

node_modules:
	yarn install --non-interactive --frozen-lockfile --ignore-scripts

.PHONY: clean
clean:
	rm -rf lib/

.PHONY: distclean
distclean: clean
	rm -rf node_modules/
