<template>
  <BaseDialog
    :show="show"
    :title="'从 CRS 同步账号'"
    width="normal"
    close-on-click-outside
    @close="handleClose"
  >
    <form id="sync-from-crs-form" class="space-y-4" @submit.prevent="handleSync">
      <div class="text-sm text-gray-600 dark:text-dark-300">
        {{ '将 claude-relay-service（CRS）中的账号同步到当前系统（不会在浏览器侧直接请求 CRS）。' }}
      </div>
      <div
        class="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 dark:bg-dark-700/60 dark:text-dark-400"
      >
        已有账号仅同步 CRS
        返回的字段，缺失字段保持原值；凭据按键合并，不会清空未下发的键；未勾选"同步代理"时保留原有代理。
      </div>
      <div
        class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-600 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
      >
        {{ '⚠️ 注意：CRS 版本必须 ≥ v1.1.240 才支持此功能' }}
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div>
          <label class="input-label">{{ 'CRS 服务地址' }}</label>
          <input
            v-model="form.base_url"
            type="text"
            class="input"
            :placeholder="'例如：http://127.0.0.1:3000'"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="input-label">{{ '用户名' }}</label>
            <input v-model="form.username" type="text" class="input" autocomplete="username" />
          </div>
          <div>
            <label class="input-label">{{ '密码' }}</label>
            <input
              v-model="form.password"
              type="password"
              class="input"
              autocomplete="current-password"
            />
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-300">
          <input
            v-model="form.sync_proxies"
            type="checkbox"
            class="rounded border-gray-300 dark:border-dark-600"
          />
          {{ '同时同步代理（按 host/port/账号匹配或自动创建）' }}
        </label>
      </div>

      <div
        v-if="result"
        class="space-y-2 rounded-xl border border-gray-200 p-4 dark:border-dark-700"
      >
        <div class="text-sm font-medium text-gray-900 dark:text-white">
          {{ '同步结果' }}
        </div>
        <div class="text-sm text-gray-700 dark:text-dark-300">
          {{ syncResultSummary }}
        </div>

        <div v-if="errorItems.length" class="mt-2">
          <div class="text-sm font-medium text-red-600 dark:text-red-400">
            {{ '错误/跳过详情' }}
          </div>
          <div
            class="mt-2 max-h-48 overflow-auto rounded-lg bg-gray-50 p-3 font-mono text-xs dark:bg-dark-800"
          >
            <div v-for="(item, idx) in errorItems" :key="idx" class="whitespace-pre-wrap">
              {{ item.kind }} {{ item.crs_account_id }} — {{ item.action
              }}{{ item.error ? `: ${item.error}` : '' }}
            </div>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button class="btn btn-secondary" type="button" :disabled="syncing" @click="handleClose">
          {{ '取消' }}
        </button>
        <button
          class="btn btn-primary"
          type="submit"
          form="sync-from-crs-form"
          :disabled="syncing"
        >
          {{ syncing ? '同步中...' : '开始同步' }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { adminAPI } from '@/api/admin'

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'synced'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const appStore = useAppStore()

const syncing = ref(false)
const result = ref<Awaited<ReturnType<typeof adminAPI.accounts.syncFromCrs>> | null>(null)

const form = reactive({
  base_url: '',
  username: '',
  password: '',
  sync_proxies: true
})

const errorItems = computed(() => {
  if (!result.value?.items) return []
  return result.value.items.filter((i) => i.action === 'failed' || i.action === 'skipped')
})

// Computed: sync result summary
const syncResultSummary = computed(() => {
  if (!result.value) return ''
  const { created, updated, skipped, failed } = result.value
  return `创建 ${created} 个，更新 ${updated} 个，跳过 ${skipped} 个，失败 ${failed} 个`
})

watch(
  () => props.show,
  (open) => {
    if (open) {
      result.value = null
    }
  }
)

const handleClose = () => {
  // 防止在同步进行中关闭对话框
  if (syncing.value) {
    return
  }
  emit('close')
}

const handleSync = async () => {
  if (!form.base_url.trim() || !form.username.trim() || !form.password.trim()) {
    appStore.showError('请填写服务地址、用户名和密码')
    return
  }

  syncing.value = true
  try {
    const res = await adminAPI.accounts.syncFromCrs({
      base_url: form.base_url.trim(),
      username: form.username.trim(),
      password: form.password,
      sync_proxies: form.sync_proxies
    })
    result.value = res

    if (res.failed > 0) {
      appStore.showError(`同步完成，但有 ${res.failed} 个失败`)
    } else {
      appStore.showSuccess(`同步完成：创建 ${res.created} 个，更新 ${res.updated} 个`)
      emit('synced')
    }
  } catch (error: any) {
    appStore.showError(error?.message || '同步失败')
  } finally {
    syncing.value = false
  }
}
</script>
