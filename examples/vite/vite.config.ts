import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";
import AutoImport from "unplugin-auto-import/vite";

export default defineConfig({
  resolve: {
    dedupe: ["vue"],
  },
  plugins: [vue()],
  define: {
    // This is necessary in Vue 2 codebases. It is automatic in Vue 3
    __VUE_PROD_DEVTOOLS__: "false",
  },
});
