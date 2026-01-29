/// <reference types="vite/client" />
/// <reference types="vitest/config" />
interface ImportMetaEnv {
  // 更多环境变量…
}
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
