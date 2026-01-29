/* eslint-disable */
import viteTailwindcssPlugin from "@tailwindcss/vite";
import viteVuePlugin from "@vitejs/plugin-vue";
import viteVueJsxPlugin from "@vitejs/plugin-vue-jsx";
import { codeInspectorPlugin as vitePluginVueInspector } from "code-inspector-plugin";
import * as lodash from "lodash-es";
import viteAutoImportPlugin from "unplugin-auto-import/vite";
import * as resolvers from "unplugin-vue-components/resolvers";
import viteAutoImportComponentLibraryPlugin from "unplugin-vue-components/vite";
import viteTopLevelAwaitPlugin from "vite-plugin-top-level-await";
import viteSvgLoaderPlugin from "vite-svg-loader";
/* eslint-enable */

/** 导入映射类型 */
type ImportsMap = Record<string, (string | [string, string])[]>;

export interface ViteAppPluginOptions {
  /** 组件解析器函数 */
  componentResolvers: (resolvers: any) => any[];
  /** 是否禁用 Lodash 自动导入 */
  disableLodash?: boolean;
  /** 是否禁用 TanStack Vue Query 自动导入 */
  disableVueQuery?: boolean;
  /** 编辑器类型 */
  editor?: "cursor" | "code";
  /** 自定义 AutoImport 配置 */
  autoImport?: {
    /** dts 文件名 */
    dts?: string;
    /** 额外的导入配置 */
    imports?: ImportsMap[];
  };
}

/**
 * vite-vue-app-plugin
 * 整合了常用的 Vite 插件配置
 */
export default function viteAppPlugin(option: ViteAppPluginOptions) {
  const isDev = process.env.NODE_ENV === "development";
  const componentResolvers = option.componentResolvers;
  const disableLodash = !!option.disableLodash;
  const disableVueQuery = !!option.disableVueQuery;
  const customAutoImport = option.autoImport || {};

  // 自定义插件：在构建时移除 debugger
  const removeDebuggerPlugin = () => ({
    name: "remove-debugger",
    config(config: any, { command }: { command: string }) {
      if (command === "build") {
        config.build = config.build || {};
        config.build.minify = "terser";
        config.build.terserOptions = {
          compress: {
            drop_debugger: true,
            drop_console: false, // 保留 console 语句
          },
          ...(config.build.terserOptions || {}),
        };
      }
    },
  });

  return [
    /**https://inspector.fe-dev.cn/ */
    isDev &&
      vitePluginVueInspector({
        bundler: "vite",
        editor: option.editor || "cursor",
        hotKeys: ["ctrlKey"],
      }),
    removeDebuggerPlugin(),
    viteTopLevelAwaitPlugin(),
    viteVuePlugin({
      template: {
        compilerOptions: {},
      },
    }),
    viteVueJsxPlugin({
      enableObjectSlots: true,
    }),
    viteAutoImportComponentLibraryPlugin({
      dts: "auto-import-components.d.ts",
      resolvers: componentResolvers(resolvers),
    }),
    // 库的自动导入
    viteAutoImportPlugin({
      dts: "auto-import-libs.d.ts",
      vueTemplate: true,
      imports: [
        "vue",
        "vue-router",
        {
          "@tanstack/vue-query": disableVueQuery
            ? []
            : ["useQuery", "useQueryClient", "useMutation"],
          "lodash-es": disableLodash
            ? []
            : Object.keys(lodash).map((key) => [key, `_${key}`]),
        },
        // 合并自定义导入
        ...(customAutoImport.imports || []),
      ],
    }),
    viteSvgLoaderPlugin({
      defaultImport: "url",
    }),
    viteTailwindcssPlugin(),
  ].filter(Boolean);
}
