<template>
  <div
    :class="[
      'flex flex-col gap-6',
      isMobile ? 'mobile-mode' : '',
      'h-[calc(100vh-64px-4rem)]',
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
          isMobile ? 'h-auto border-none bg-transparent shadow-none' : '',
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
