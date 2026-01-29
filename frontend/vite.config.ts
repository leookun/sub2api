/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import viteAppPlugin from "vite-vue-app-plugin";
import AutoImport from "unplugin-auto-import/vite";
import { resolve } from "path";
export default defineConfig(() => {
  return {
    plugins: [
      viteAppPlugin({
        editor: "cursor",
        componentResolvers: () => [],
        disableLegacy: false, // 是否禁用传统浏览器支持
        disableLodash: false, // 是否禁用 Lodash 自动导入
        disableVueQuery: true, // 是否禁用 TanStack Vue Query 自动导入
      }),
      // 自动导入项目工具函数
      AutoImport({
        dts: "auto-import-utils.d.ts",
        imports: [
          {
            "@/utils/format": [
              "formatRelativeTime",
              "formatNumber",
              "formatCurrency",
              "formatBytes",
              "formatDate",
              "formatDateOnly",
              "formatDateTime",
              "formatDateTimeLocalInput",
              "parseDateTimeLocalInput",
              "formatTime",
              "formatNumberLocaleString",
              "formatCostFixed",
              "formatTokensK",
              "formatCountdown",
              "formatCountdownWithSuffix",
            ],
            "@/utils/url": ["sanitizeUrl"],
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
