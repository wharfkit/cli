import {babel} from '@rollup/plugin-babel'
import {nodeResolve} from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import fs from 'fs'

const pkg = JSON.parse(fs.readFileSync('./package.json'))
const external = Object.keys(pkg.dependencies || {}).concat(['fs/promises'])

const extensions = ['.js', '.ts']

export default {
    input: 'src/index.ts',
    output: {
        file: './dist/cli.js',
        format: 'cjs',
        banner: '#!/usr/bin/env node',
        inlineDynamicImports: true,
    },
    external,
    plugins: [
        nodeResolve({
            extensions,
            modulesOnly: true,
        }),
        json(),
        babel({
            exclude: ['node_modules/**'],
            babelHelpers: 'bundled',
            extensions,
        }),
    ],
}
