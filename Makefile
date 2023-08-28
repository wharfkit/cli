SHELL := /bin/bash
SRC_FILES := $(shell find src -name '*.ts')
BIN := ./node_modules/.bin

lib: ${SRC_FILES} package.json tsconfig.json node_modules rollup.config.js
	@${BIN}/rollup -c && touch lib

.PHONY: test
test: node_modules
	@TS_NODE_PROJECT='./test/tsconfig.json' MOCK_DIR='./test/data/requests' \
		${BIN}/mocha ${MOCHA_OPTS} ${TEST_FILES} --no-timeout --grep '$(grep)'

.PHONY: test_generate
test_generate: node_modules clean dist
	node dist/cli.js generate eosio.token -u https://jungle4.greymass.com

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