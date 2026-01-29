<template>
  <div class="flex flex-wrap items-center gap-3">
    <slot name="before"></slot>
    <button
      :disabled="loading"
      class="btn btn-secondary"
      @click="$emit('refresh')"
    >
      <Icon name="refresh" size="md" :class="[loading ? 'animate-spin' : '']" />
    </button>
    <slot name="after"></slot>
    <button class="btn btn-secondary" @click="$emit('sync')">
      从 CRS 同步
    </button>
    <button class="btn btn-primary" @click="$emit('create')">添加账号</button>
  </div>
</template>

<script setup lang="ts">
defineProps(["loading"]);
defineEmits(["refresh", "sync", "create"]);
</script>
