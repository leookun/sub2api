<template>
  <div class="flex flex-wrap items-center gap-3">
    <slot name="before"></slot>
    <button @click="$emit('refresh')" :disabled="loading" class="btn btn-secondary">
      <Icon name="refresh" size="md" :class="[loading ? 'animate-spin' : '']" />
    </button>
    <slot name="after"></slot>
    <button @click="$emit('sync')" class="btn btn-secondary">{{ '从 CRS 同步' }}</button>
    <button @click="$emit('create')" class="btn btn-primary">{{ '添加账号' }}</button>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/components/icons/Icon.vue'

defineProps(['loading'])
defineEmits(['refresh', 'sync', 'create'])

</script>
