import typescript from '@rollup/plugin-typescript'
import cleanup from 'rollup-plugin-cleanup'
import json from '@rollup/plugin-json'
import shebang from 'rollup-plugin-add-shebang';

import pkg from './package.json'

const external = ['fs', ...Object.keys(pkg.dependencies)]

/** @type {import('rollup').RollupOptions} */
export default {
    input: 'src/index.ts',
    output: {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
    },
    plugins: [typescript({target: 'es6'}), json(), cleanup({extensions: ['js', 'ts']}), shebang()],
    external,
}
