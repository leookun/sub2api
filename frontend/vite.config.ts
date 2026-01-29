/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import viteAppPlugin from "./src/plugins/vite-app-plugin";
import { resolve } from "path";

export default defineConfig(() => {
  return {
    plugins: [
      viteAppPlugin({
        editor: "cursor",
        componentResolvers: () => [],
        disableLodash: false, // 是否禁用 Lodash 自动导入
        disableVueQuery: true, // 是否禁用 TanStack Vue Query 自动导入
        // 自定义 AutoImport 配置
        autoImport: {
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
                "formatCost",
                "formatTokensK",
                "formatCountdown",
                "formatCountdownWithSuffix",
              ],
              "@/utils/url": ["sanitizeUrl"],
              "@/composables/useModelWhitelist": ["commonErrorCodes"],
              "@/views/admin/ops/utils/opsFormatters": ["getSeverityClass"],
            },
          ],
        },
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
