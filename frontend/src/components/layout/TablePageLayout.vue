<template>
  <div
    :class="[
      'flex flex-col gap-6',
      isMobile ? 'mobile-mode' : '',
      'h-[calc(100vh-64px-4rem)]'
    ]"
  >
    <!-- 固定区域:操作按钮 -->
    <div v-if="$slots.actions" class="flex-shrink-0">
      <slot name="actions" />
    </div>

    <!-- 固定区域:搜索和过滤器 -->
    <div v-if="$slots.filters" class="flex-shrink-0">
      <slot name="filters" />
    </div>

    <!-- 滚动区域:表格 -->
    <div class="flex min-h-0 flex-1 flex-col">
      <div
        :class="[
          'card flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-dark-700 dark:bg-dark-800',
          isMobile ? 'h-auto border-none bg-transparent shadow-none' : ''
        ]"
      >
        <slot name="table" />
      </div>
    </div>

    <!-- 固定区域:分页器 -->
    <div v-if="$slots.pagination" class="flex-shrink-0">
      <slot name="pagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const isMobile = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024;
};

onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkMobile);
});
</script>

<style scoped>
@import "tailwindcss";

@theme {
  --color-dark-50: #f8fafc;
  --color-dark-100: #f1f5f9;
  --color-dark-200: #e2e8f0;
  --color-dark-300: #cbd5e1;
  --color-dark-400: #94a3b8;
  --color-dark-500: #64748b;
  --color-dark-600: #475569;
  --color-dark-700: #334155;
  --color-dark-800: #1e293b;
  --color-dark-900: #0f172a;
  --color-dark-950: #020617;

  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
  --color-primary-950: #172554;

  --color-accent-400: #fbbf24;
  --color-accent-500: #f59e0b;
  --color-accent-600: #d97706;

  --shadow-glass: 0 8px 32px rgb(0 0 0 / 0.08);
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-card-hover: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  --animate-scale-in: scale-in 0.2s ease-out;
  --animate-slide-in-right: slide-in-right 0.3s ease-out;

  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes slide-in-right {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
}

/* 表格滚动容器 - 增强版表体滚动方案 */
.table-scroll-container {
  @apply flex flex-col overflow-hidden h-full bg-white dark:bg-dark-800 rounded-2xl border border-gray-200 dark:border-dark-700 shadow-sm;
}

.table-scroll-container :deep(.table-wrapper) {
  @apply flex-1 overflow-x-auto overflow-y-auto;
  /* 确保横向滚动条显示在最底部 */
  scrollbar-gutter: stable;
}

.table-scroll-container :deep(table) {
  @apply w-full;
  min-width: max-content; /* 关键：确保表格宽度根据内容撑开，从而触发横向滚动 */
  display: table; /* 使用标准 table 布局以支持 sticky 列 */
}

.table-scroll-container :deep(thead) {
  @apply bg-gray-50/80 dark:bg-dark-800/80 backdrop-blur-sm;
}

.table-scroll-container :deep(tbody) {
  /* 保持默认 table-row-group 显示，不使用 block */
}

.table-scroll-container :deep(th) {
  /* 表头高度和文字加粗优化 */
  @apply px-5 py-4 text-left text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-dark-700;
  @apply uppercase tracking-wider; /* 让表头更有设计感 */
}

.table-scroll-container :deep(td) {
  @apply px-5 py-4 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-dark-800;
}

/* 移动端：恢复正常滚动 */
.mobile-mode .table-scroll-container {
  @apply h-auto overflow-visible border-none shadow-none bg-transparent;
}

.mobile-mode .layout-section-scrollable {
  @apply flex-none min-h-fit;
}

.mobile-mode .table-scroll-container :deep(.table-wrapper) {
  @apply overflow-visible;
}

.mobile-mode .table-scroll-container :deep(table) {
  @apply flex-none;
  display: table;
  min-width: 100%;
}
</style>
