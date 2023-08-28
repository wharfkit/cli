import typescript from '@rollup/plugin-typescript'
import cleanup from 'rollup-plugin-cleanup'
import json from '@rollup/plugin-json'

import pkg from './package.json'

const external = ['fs', ...Object.keys(pkg.dependencies)]

// Add shebang + disable experimental fetch warning
const banner = `
#!/usr/bin/env node
process.removeAllListeners('warning')
`.trim()

/** @type {import('rollup').RollupOptions} */
export default {
    input: 'src/index.ts',
    output: {
        banner,
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
    },
    plugins: [typescript({target: 'es6'}), json(), cleanup({extensions: ['js', 'ts']})],
    external,
}
