<template>
  <div v-if="selectedIds.length > 0" class="mb-4 flex items-center justify-between p-3 bg-primary-50 rounded-lg dark:bg-primary-900/20">
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm font-medium text-primary-900 dark:text-primary-100">
        {{ `已选择 ${selectedIds.length} 个账号` }}
      </span>
      <button
        class="text-xs font-medium text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
        @click="$emit('select-page')"
      >
        {{ '本页全选' }}
      </button>
      <span class="text-gray-300 dark:text-primary-800">•</span>
      <button
        class="text-xs font-medium text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
        @click="$emit('clear')"
      >
        {{ '清除选择' }}
      </button>
    </div>
    <div class="flex gap-2">
      <button class="btn btn-danger btn-sm" @click="$emit('delete')">{{ '批量删除' }}</button>
      <button class="btn btn-success btn-sm" @click="$emit('toggle-schedulable', true)">{{ '批量启用调度' }}</button>
      <button class="btn btn-warning btn-sm" @click="$emit('toggle-schedulable', false)">{{ '批量停止调度' }}</button>
      <button class="btn btn-primary btn-sm" @click="$emit('edit')">{{ '批量编辑账号' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps(['selectedIds']); defineEmits(['delete', 'edit', 'clear', 'select-page', 'toggle-schedulable']); </script>