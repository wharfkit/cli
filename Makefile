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
	node lib/cli.js generate atomicassets -u https://jungle4.greymass.com -j test/data/abis/atomicassets.json -f test/data/contracts/mock-atomicassets.ts -e .eslintrc
	node lib/cli.js generate boid -u https://jungle4.greymass.com -j test/data/abis/boid.json -f test/data/contracts/mock-boid.ts -e .eslintrc
	node lib/cli.js generate eosio -u https://jungle4.greymass.com -j test/data/abis/eosio.json -f test/data/contracts/mock-eosio.ts -e .eslintrc
	node lib/cli.js generate eosio.msig -u https://jungle4.greymass.com -j test/data/abis/eosio.msig.json -f test/data/contracts/mock-eosio.msig.ts -e .eslintrc
	node lib/cli.js generate eosio.token -u https://jungle4.greymass.com -j test/data/abis/eosio.token.json -f test/data/contracts/mock-eosio.token.ts -e .eslintrc
	node lib/cli.js generate hegemon.hgm -u https://jungle4.greymass.com -j test/data/abis/hegemon.hgm.json -f test/data/contracts/mock-hegemon.hgm.ts -e .eslintrc
	node lib/cli.js generate rewards.gm -u https://jungle4.greymass.com -j test/data/abis/rewards.gm.json -f test/data/contracts/mock-rewards.gm.ts -e .eslintrc
	node lib/cli.js generate testing.gm -u https://jungle4.greymass.com -j test/data/abis/testing.gm.json -f test/data/contracts/mock-testing.gm.ts -e .eslintrc

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
