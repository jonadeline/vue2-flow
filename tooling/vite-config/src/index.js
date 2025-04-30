const { defu } = require("defu");
const vue = require("@vitejs/plugin-vue2");

function withConfig(viteConfig) {
  return defu(viteConfig, {
    // https://vitejs.dev/config/
    resolve: {
      extensions: [".ts", ".vue"],
    },
    build: {
      minify: false,
      emptyOutDir: false,
      rollupOptions: {
        // make sure to externalize deps that shouldn't be bundled
        // into your library
        external: ["vue", "@vue-flow2/core"],
        output: {
          dir: "./dist",
          // Provide global variables to use in the UMD build
          // for externalized deps
          globals: {
            vue: "Vue",
            "@vue-flow2/core": "VueFlowCore",
          },
        },
      },
    },
    plugins: [
      vue({
        reactivityTransform: true,
      }),
    ],
  });
}

module.exports = {
  withConfig,
};
