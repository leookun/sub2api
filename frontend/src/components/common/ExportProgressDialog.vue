<template>
  <BaseDialog
    :show="show"
    :title="'导出中...'"
    width="narrow"
    @close="handleCancel"
  >
    <div class="space-y-4">
      <div class="text-sm text-gray-600 dark:text-gray-400">
        正在导出数据...
      </div>
      <div
        class="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300"
      >
        <span>{{ `已导出 {current}/{total} 条` }}</span>
        <span class="font-medium text-gray-900 dark:text-white"
          >{{ normalizedProgress }}%</span
        >
      </div>
      <div class="h-2 w-full rounded-full bg-gray-200 dark:bg-dark-700">
        <div
          role="progressbar"
          :aria-valuenow="normalizedProgress"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`${'正在导出数据...'}: ${normalizedProgress}%`"
          class="h-2 rounded-full bg-primary-600 transition-all"
          :style="{ width: `${normalizedProgress}%` }"
        ></div>
      </div>
      <div
        v-if="estimatedTime"
        class="text-xs text-gray-500 dark:text-gray-400"
        aria-live="polite"
        aria-atomic="true"
      >
        {{ `预计剩余时间：${estimatedTime}` }}
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-200 dark:hover:bg-dark-600 dark:focus:ring-offset-dark-800"
        @click="handleCancel"
      >
        取消导出
      </button>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  show: boolean;
  progress: number;
  current: number;
  total: number;
  estimatedTime: string;
}

interface Emits {
  (e: "cancel"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const normalizedProgress = computed(() => {
  const value = Number.isFinite(props.progress) ? props.progress : 0;
  return Math.min(100, Math.max(0, Math.round(value)));
});

const handleCancel = () => {
  emit("cancel");
};
</script>
