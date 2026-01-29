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

// 全局格式化函数类型声明
declare global {
  var formatNumber: (num: number | null | undefined) => string
  var formatCurrency: (amount: number | null | undefined, currency?: string) => string
  var formatCost: (amount: number, fractionDigits?: number) => string
  var formatDateTime: (date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions, localeOverride?: string) => string
  var formatDate: (date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions, localeOverride?: string) => string
  var formatDateOnly: (date: string | Date | null | undefined) => string
  var formatRelativeTime: (date: string | Date | null | undefined) => string
  var getDaysRemaining: (targetDate: string | Date | null | undefined) => string | null
}

export {}
