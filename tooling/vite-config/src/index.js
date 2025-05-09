const { defu } = require('defu')
const vue = require('@vitejs/plugin-vue2')

function withConfig(viteConfig) {
  return defu(viteConfig, {
    // https://vitejs.dev/config/
    resolve: {
      extensions: ['.ts', '.vue'],
    },
    build: {
      emptyOutDir: false,
      rollupOptions: {
        // make sure to externalize deps that shouldn't be bundled
        // into your library
        external: ['vue', '@vue/composition-api', '@vue2-flow/core'], // Ajoutez @vue/composition-api si vous l'utilisez
        output: {
          dir: './dist',
          // Provide global variables to use in the UMD build
          // for externalized deps
          globals: {
            vue: 'Vue',
            '@vue/composition-api': 'VueCompositionAPI',
            '@vue2-flow/core': 'VueFlowCore',
          },
        },
      },
    },
    plugins: [
      vue({
        reactivityTransform: true,
      }),
    ],
  })
}

module.exports = {
  withConfig,
}
