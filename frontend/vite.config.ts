/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import viteAppPlugin from "vite-vue-app-plugin";
import AutoImport from "unplugin-auto-import/vite";
import { resolve } from "path";
export default defineConfig(() => {
  return {
    plugins: [
      viteAppPlugin({
        componentResolvers: () => [],
        disableLegacy: false, // 是否禁用传统浏览器支持
        disableLodash: false, // 是否禁用 Lodash 自动导入
        disableVueQuery: true, // 是否禁用 TanStack Vue Query 自动导入
      }),
      // 自动导入格式化函数
      AutoImport({
        dts: "auto-import-format.d.ts",
        vueTemplate: true,
        imports: [
          {
            "@/utils/format": [
              "formatNumber",
              "formatCurrency",
              "formatCostFixed",
              "formatDateTime",
              "formatDate",
              "formatDateOnly",
              "formatRelativeTime",
              "formatCountdown",
              "formatCountdownWithSuffix",
              "getDaysRemaining"
            ],
          },
        ],
      }),
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: "../backend/internal/web/dist",
      emptyOutDir: true,
    },
  };
});
