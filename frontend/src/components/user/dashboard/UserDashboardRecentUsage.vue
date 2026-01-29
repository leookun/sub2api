<template>
  <div class="card">
    <div
      class="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-dark-700"
    >
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
        最近使用
      </h2>
      <span class="badge badge-gray">近 7 天</span>
    </div>
    <div class="p-6">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
      <div v-else-if="data.length === 0" class="py-8">
        <EmptyState
          :title="'暂无使用记录'"
          :description="'开始使用 API 后，您的使用历史将显示在这里。'"
        />
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="log in data"
          :key="log.id"
          class="flex items-center justify-between rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:bg-dark-800/50 dark:hover:bg-dark-800"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30"
            >
              <Icon
                name="beaker"
                size="md"
                class="text-primary-600 dark:text-primary-400"
              />
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ log.model }}
              </p>
              <p class="text-xs text-gray-500 dark:text-dark-400">
                {{ formatDateTime(log.created_at) }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold">
              <span class="text-green-600 dark:text-green-400" :title="'实际'"
                >${{ formatCost(log.actual_cost) }}</span
              >
              <span
                class="font-normal text-gray-400 dark:text-gray-500"
                :title="'标准'"
              >
                / ${{ formatCost(log.total_cost) }}</span
              >
            </p>
            <p class="text-xs text-gray-500 dark:text-dark-400">
              {{ (log.input_tokens + log.output_tokens).toLocaleString() }}
              tokens
            </p>
          </div>
        </div>

        <router-link
          to="/usage"
          class="flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          查看全部
          <Icon name="arrowRight" size="sm" />
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UsageLog } from "@/types";

defineProps<{
  data: UsageLog[];
  loading: boolean;
}>();
const formatCost = (c: number) => c.toFixed(4);
</script>
