<template>
  <div class="flex flex-wrap items-center gap-3">
    <SearchInput
      :model-value="searchQuery"
      :placeholder="'搜索账号...'"
      class="w-full sm:w-64"
      @update:model-value="$emit('update:searchQuery', $event)"
      @search="$emit('change')"
    />
    <Select :model-value="filters.platform" class="w-40" :options="pOpts" @update:model-value="updatePlatform" @change="$emit('change')" />
    <Select :model-value="filters.type" class="w-40" :options="tOpts" @update:model-value="updateType" @change="$emit('change')" />
    <Select :model-value="filters.status" class="w-40" :options="sOpts" @update:model-value="updateStatus" @change="$emit('change')" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';  import Select from '@/components/common/Select.vue'; import SearchInput from '@/components/common/SearchInput.vue'
const props = defineProps(['searchQuery', 'filters']); const emit = defineEmits(['update:searchQuery', 'update:filters', 'change']); const updatePlatform = (value: string | number | boolean | null) => { emit('update:filters', { ...props.filters, platform: value }) }
const updateType = (value: string | number | boolean | null) => { emit('update:filters', { ...props.filters, type: value }) }
const updateStatus = (value: string | number | boolean | null) => { emit('update:filters', { ...props.filters, status: value }) }
const pOpts = computed(() => [{ value: '', label: '全部平台' }, { value: 'anthropic', label: 'Anthropic' }, { value: 'openai', label: 'OpenAI' }, { value: 'gemini', label: 'Gemini' }, { value: 'antigravity', label: 'Antigravity' }])
const tOpts = computed(() => [{ value: '', label: '全部类型' }, { value: 'oauth', label: 'OAuth' }, { value: 'setup-token', label: 'Setup Token' }, { value: 'apikey', label: 'API Key' }])
const sOpts = computed(() => [{ value: '', label: '全部状态' }, { value: 'active', label: '正常' }, { value: 'inactive', label: '停用' }, { value: 'error', label: '错误' }])
</script>
