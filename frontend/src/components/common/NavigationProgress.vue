<script setup lang="ts">
/**
 * 导航进度条组件
 * 在页面顶部显示加载进度，提供导航反馈
 */
import { computed } from "vue";
import { useNavigationLoadingState } from "@/composables/useNavigationLoading";

const { isLoading } = useNavigationLoadingState();

// 进度条可见性
const isVisible = computed(() => isLoading.value);
</script>

<template>
  <Transition name="progress-fade">
    <div
      v-show="isVisible"
      class="navigation-progress"
      role="progressbar"
      aria-label="Loading"
      aria-valuenow="0"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="navigation-progress-bar" />
    </div>
  </Transition>
</template>
