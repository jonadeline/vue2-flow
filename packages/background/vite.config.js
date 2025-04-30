import { resolve } from 'node:path'
import { withConfig } from '@tooling/vite-config'

export default withConfig({
  build: {
    lib: {
      formats: ['es', 'cjs', 'iife'],
      entry: resolve(__dirname, 'src/index.js'),
      fileName: 'vue-flow-background',
      name: 'VueFlowBackground',
    },
  },
})
