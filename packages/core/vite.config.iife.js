import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import replace from '@rollup/plugin-replace'
import pkg from './package.json'

export default defineConfig({
  resolve: {
    extensions: ['.js', '.vue'],
  },
  build: {
    minify: false,
    emptyOutDir: false,
    lib: {
      formats: ['iife'],
      entry: resolve(__dirname, 'src/index.js'),
      fileName: 'vue-flow-core',
      name: 'VueFlowCore',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue', '@vueuse/core', '@vue2-flow/core'],
      output: {
        format: 'iife',
        dir: './dist',
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  plugins: [
    vue(),
    replace({
      __ENV__: 'production',
      __VUE_FLOW_VERSION__: JSON.stringify(pkg.version),
      preventAssignment: true,
    }),
  ],
})
