<template>
  <AppLayout>
    <TablePageLayout>
      <template #actions>
        <div class="flex justify-end gap-3">
          <button
          @click="loadCodes"
          :disabled="loading"
          class="btn btn-secondary"
          :title="'刷新'"
        >
          <Icon name="refresh" size="md" :class="loading ? 'animate-spin' : ''" />
        </button>
        <button @click="showGenerateDialog = true" class="btn btn-primary">
          {{ '生成兑换码' }}
        </button>
        </div>
      </template>

      <template #filters>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="max-w-md flex-1">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="'搜索兑换码...'"
            class="input"
            @input="handleSearch"
          />
          </div>
          <div class="flex gap-2">
          <Select
            v-model="filters.type"
            :options="filterTypeOptions"
            class="w-36"
            @change="loadCodes"
          />
          <Select
            v-model="filters.status"
            :options="filterStatusOptions"
            class="w-36"
            @change="loadCodes"
          />
          <button @click="handleExportCodes" class="btn btn-secondary">
            {{ '导出 CSV' }}
          </button>
          </div>
        </div>
      </template>

      <template #table>
        <DataTable :columns="columns" :data="codes" :loading="loading">
          <template #cell-code="{ value }">
            <div class="flex items-center space-x-2">
              <code class="font-mono text-sm text-gray-900 dark:text-gray-100">{{ value }}</code>
              <button
                @click="copyToClipboard(value)"
                :class="[
                  'flex items-center transition-colors',
                  copiedCode === value
                    ? 'text-green-500'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                ]"
                :title="copiedCode === value ? '已复制！' : '复制到剪贴板'"
              >
                <Icon v-if="copiedCode !== value" name="copy" size="sm" :stroke-width="2" />
                <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
            </div>
          </template>

          <template #cell-type="{ value }">
            <span
              :class="[
                'badge',
                value === 'balance'
                  ? 'badge-success'
                  : value === 'subscription'
                    ? 'badge-warning'
                    : 'badge-primary'
              ]"
            >
              {{ t('admin.redeem.types.' + value) }}
            </span>
          </template>

          <template #cell-value="{ value, row }">
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              <template v-if="row.type === 'balance'">${{ value.toFixed(2) }}</template>
              <template v-else-if="row.type === 'subscription'">
                {{ row.validity_days || 30 }} {{ '天' }}
                <span v-if="row.group" class="ml-1 text-xs text-gray-500 dark:text-gray-400"
                  >({{ row.group.name }})</span
                >
              </template>
              <template v-else>{{ value }}</template>
            </span>
          </template>

          <template #cell-status="{ value }">
            <span
              :class="[
                'badge',
                value === 'unused'
                  ? 'badge-success'
                  : value === 'used'
                    ? 'badge-gray'
                    : 'badge-danger'
              ]"
            >
              {{ t('admin.redeem.status.' + value) }}
            </span>
          </template>

          <template #cell-used_by="{ value }">
            <span class="text-sm text-gray-500 dark:text-dark-400">
              {{ value ? `用户 #${value}` : '-' }}
            </span>
          </template>

          <template #cell-used_at="{ value }">
            <span class="text-sm text-gray-500 dark:text-dark-400">{{
              value ? formatDateTime(value) : '-'
            }}</span>
          </template>

          <template #cell-actions="{ row }">
            <div class="flex items-center space-x-2">
              <button
                v-if="row.status === 'unused'"
                @click="handleDelete(row)"
                class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span class="text-xs">{{ '删除' }}</span>
              </button>
              <span v-else class="text-gray-400 dark:text-dark-500">-</span>
            </div>
          </template>
        </DataTable>
      </template>

      <template #pagination>
        <Pagination
          v-if="pagination.total > 0"
          :page="pagination.page"
          :total="pagination.total"
          :page-size="pagination.page_size"
          @update:page="handlePageChange"
          @update:pageSize="handlePageSizeChange"
        />

        <!-- Batch Actions -->
        <div v-if="filters.status === 'unused'" class="flex justify-end">
          <button @click="showDeleteUnusedDialog = true" class="btn btn-danger">
            {{ '删除全部未使用' }}
          </button>
        </div>
      </template>
    </TablePageLayout>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :show="showDeleteDialog"
      :title="'删除'"
      :message="'确定要删除此兑换码吗？此操作无法撤销。'"
      :confirm-text="'删除'"
      :cancel-text="'取消'"
      danger
      @confirm="confirmDelete"
      @cancel="showDeleteDialog = false"
    />

    <!-- Delete Unused Codes Dialog -->
    <ConfirmDialog
      :show="showDeleteUnusedDialog"
      :title="'删除全部未使用'"
      :message="'确定要删除全部未使用的兑换码吗？此操作无法撤销。'"
      :confirm-text="'全部删除'"
      :cancel-text="'取消'"
      danger
      @confirm="confirmDeleteUnused"
      @cancel="showDeleteUnusedDialog = false"
    />

    <!-- Generate Codes Dialog -->
    <Teleport to="body">
      <div v-if="showGenerateDialog" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" @click="showGenerateDialog = false"></div>
        <div
          class="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-dark-800"
        >
          <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {{ '生成兑换码' }}
          </h2>
          <form @submit.prevent="handleGenerateCodes" class="space-y-4">
            <div>
              <label class="input-label">{{ '类型' }}</label>
              <Select v-model="generateForm.type" :options="typeOptions" />
            </div>
            <!-- 余额/并发类型：显示数值输入 -->
            <div v-if="generateForm.type !== 'subscription'">
              <label class="input-label">
                {{
                  generateForm.type === 'balance'
                    ? '金额 ($)'
                    : '面值'
                }}
              </label>
              <input
                v-model.number="generateForm.value"
                type="number"
                :step="generateForm.type === 'balance' ? '0.01' : '1'"
                :min="generateForm.type === 'balance' ? '0.01' : '1'"
                required
                class="input"
              />
            </div>
            <!-- 订阅类型：显示分组选择和有效天数 -->
            <template v-if="generateForm.type === 'subscription'">
              <div>
                <label class="input-label">{{ '选择分组' }}</label>
                <Select
                  v-model="generateForm.group_id"
                  :options="subscriptionGroupOptions"
                  :placeholder="'选择订阅分组'"
                >
                  <template #selected="{ option }">
                    <GroupBadge
                      v-if="option"
                      :name="(option as unknown as GroupOption).label"
                      :platform="(option as unknown as GroupOption).platform"
                      :subscription-type="(option as unknown as GroupOption).subscriptionType"
                      :rate-multiplier="(option as unknown as GroupOption).rate"
                    />
                    <span v-else class="text-gray-400">{{
                      '选择订阅分组'
                    }}</span>
                  </template>
                  <template #option="{ option, selected }">
                    <GroupOptionItem
                      :name="(option as unknown as GroupOption).label"
                      :platform="(option as unknown as GroupOption).platform"
                      :subscription-type="(option as unknown as GroupOption).subscriptionType"
                      :rate-multiplier="(option as unknown as GroupOption).rate"
                      :description="(option as unknown as GroupOption).description"
                      :selected="selected"
                    />
                  </template>
                </Select>
              </div>
              <div>
                <label class="input-label">{{ '有效天数' }}</label>
                <input
                  v-model.number="generateForm.validity_days"
                  type="number"
                  min="1"
                  max="365"
                  required
                  class="input"
                />
              </div>
            </template>
            <div>
              <label class="input-label">{{ '数量' }}</label>
              <input
                v-model.number="generateForm.count"
                type="number"
                min="1"
                max="100"
                required
                class="input"
              />
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" @click="showGenerateDialog = false" class="btn btn-secondary">
                {{ '取消' }}
              </button>
              <button type="submit" :disabled="generating" class="btn btn-primary">
                {{ generating ? '生成中...' : '生成' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Generated Codes Result Dialog -->
    <Teleport to="body">
      <div v-if="showResultDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="closeResultDialog"></div>
        <div class="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-dark-800">
          <!-- Header -->
          <div
            class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-dark-600"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
              >
                <svg
                  class="h-5 w-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                  {{ '生成成功' }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ `已创建 ${generatedCodes.length} 个兑换码` }}
                </p>
              </div>
            </div>
            <button
              @click="closeResultDialog"
              class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-dark-700 dark:hover:text-gray-300"
            >
              <Icon name="x" size="md" :stroke-width="2" />
            </button>
          </div>
          <!-- Content -->
          <div class="p-5">
            <div class="relative">
              <textarea
                readonly
                :value="generatedCodesText"
                :style="{ height: textareaHeight }"
                class="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-gray-800 focus:outline-none dark:border-dark-600 dark:bg-dark-700 dark:text-gray-200"
              ></textarea>
            </div>
          </div>
          <!-- Footer -->
          <div
            class="flex justify-end gap-2 rounded-b-xl border-t border-gray-200 bg-gray-50 px-5 py-4 dark:border-dark-600 dark:bg-dark-700/50"
          >
            <button
              @click="copyGeneratedCodes"
              :class="[
                'btn flex items-center gap-2 transition-all',
                copiedAll ? 'btn-success' : 'btn-secondary'
              ]"
            >
              <Icon v-if="!copiedAll" name="copy" size="sm" :stroke-width="2" />
              <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {{ copiedAll ? '已复制！' : '全部复制' }}
            </button>
            <button @click="downloadGeneratedCodes" class="btn btn-primary flex items-center gap-2">
              <Icon name="download" size="sm" :stroke-width="2" />
              {{ '下载' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useClipboard } from '@/composables/useClipboard'
import { adminAPI } from '@/api/admin'
import { formatDateTime } from '@/utils/format'
import type { RedeemCode, RedeemCodeType, Group, GroupPlatform, SubscriptionType } from '@/types'
import type { Column } from '@/components/common/types'
import AppLayout from '@/components/layout/AppLayout.vue'
import TablePageLayout from '@/components/layout/TablePageLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import Select from '@/components/common/Select.vue'
import GroupBadge from '@/components/common/GroupBadge.vue'
import GroupOptionItem from '@/components/common/GroupOptionItem.vue'
import Icon from '@/components/icons/Icon.vue'

const appStore = useAppStore()
const { copyToClipboard: clipboardCopy } = useClipboard()

interface GroupOption {
  value: number
  label: string
  description: string | null
  platform: GroupPlatform
  subscriptionType: SubscriptionType
  rate: number
}

const showGenerateDialog = ref(false)
const showResultDialog = ref(false)
const generatedCodes = ref<RedeemCode[]>([])
const subscriptionGroups = ref<Group[]>([])

// 订阅类型分组选项
const subscriptionGroupOptions = computed(() => {
  return subscriptionGroups.value
    .filter((g) => g.subscription_type === 'subscription')
    .map((g) => ({
      value: g.id,
      label: g.name,
      description: g.description,
      platform: g.platform,
      subscriptionType: g.subscription_type,
      rate: g.rate_multiplier
    }))
})

const generatedCodesText = computed(() => {
  return generatedCodes.value.map((code) => code.code).join('\n')
})

const textareaHeight = computed(() => {
  const lineCount = generatedCodes.value.length
  const lineHeight = 24 // approximate line height in px
  const padding = 24 // top + bottom padding
  const minHeight = 60
  const maxHeight = 240
  const calculatedHeight = Math.min(
    Math.max(lineCount * lineHeight + padding, minHeight),
    maxHeight
  )
  return `${calculatedHeight}px`
})

const copiedAll = ref(false)

const closeResultDialog = () => {
  showResultDialog.value = false
  generatedCodes.value = []
  copiedAll.value = false
}

const copyGeneratedCodes = async () => {
  try {
    await navigator.clipboard.writeText(generatedCodesText.value)
    copiedAll.value = true
    setTimeout(() => {
      copiedAll.value = false
    }, 2000)
  } catch (error) {
    appStore.showError('复制失败')
  }
}

const downloadGeneratedCodes = () => {
  const blob = new Blob([generatedCodesText.value], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `redeem-codes-${new Date().toISOString().split('T')[0]}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const columns = computed<Column[]>(() => [
  { key: 'code', label: '兑换码' },
  { key: 'type', label: '类型', sortable: true },
  { key: 'value', label: '面值', sortable: true },
  { key: 'status', label: '状态', sortable: true },
  { key: 'used_by', label: '使用者' },
  { key: 'used_at', label: '使用时间', sortable: true },
  { key: 'actions', label: '操作' }
])

const typeOptions = computed(() => [
  { value: 'balance', label: '余额' },
  { value: 'concurrency', label: '并发数' },
  { value: 'subscription', label: '订阅' }
])

const filterTypeOptions = computed(() => [
  { value: '', label: '全部类型' },
  { value: 'balance', label: '余额' },
  { value: 'concurrency', label: '并发数' },
  { value: 'subscription', label: '订阅' }
])

const filterStatusOptions = computed(() => [
  { value: '', label: '全部状态' },
  { value: 'unused', label: '未使用' },
  { value: 'used', label: '已使用' },
  { value: 'expired', label: '已过期' }
])

const codes = ref<RedeemCode[]>([])
const loading = ref(false)
const generating = ref(false)
const searchQuery = ref('')
const filters = reactive({
  type: '',
  status: ''
})
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0,
  pages: 0
})

let abortController: AbortController | null = null

const showDeleteDialog = ref(false)
const showDeleteUnusedDialog = ref(false)
const deletingCode = ref<RedeemCode | null>(null)
const copiedCode = ref<string | null>(null)

const generateForm = reactive({
  type: 'balance' as RedeemCodeType,
  value: 10,
  count: 1,
  group_id: null as number | null,
  validity_days: 30
})

const loadCodes = async () => {
  if (abortController) {
    abortController.abort()
  }
  const currentController = new AbortController()
  abortController = currentController
  loading.value = true
  try {
    const response = await adminAPI.redeem.list(
      pagination.page,
      pagination.page_size,
      {
        type: filters.type as RedeemCodeType,
        status: filters.status as any,
        search: searchQuery.value || undefined
      },
      {
        signal: currentController.signal
      }
    )
    if (currentController.signal.aborted) {
      return
    }
    codes.value = response.items
    pagination.total = response.total
    pagination.pages = response.pages
  } catch (error: any) {
    if (
      currentController.signal.aborted ||
      error?.name === 'AbortError' ||
      error?.code === 'ERR_CANCELED'
    ) {
      return
    }
    appStore.showError('加载兑换码列表失败')
    console.error('Error loading redeem codes:', error)
  } finally {
    if (abortController === currentController && !currentController.signal.aborted) {
      loading.value = false
      abortController = null
    }
  }
}

let searchTimeout: ReturnType<typeof setTimeout>
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.page = 1
    loadCodes()
  }, 300)
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadCodes()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.page_size = pageSize
  pagination.page = 1
  loadCodes()
}

const handleGenerateCodes = async () => {
  // 订阅类型必须选择分组
  if (generateForm.type === 'subscription' && !generateForm.group_id) {
    appStore.showError('请选择订阅分组')
    return
  }

  generating.value = true
  try {
    const result = await adminAPI.redeem.generate(
      generateForm.count,
      generateForm.type,
      generateForm.value,
      generateForm.type === 'subscription' ? generateForm.group_id : undefined,
      generateForm.type === 'subscription' ? generateForm.validity_days : undefined
    )
    showGenerateDialog.value = false
    generatedCodes.value = result
    showResultDialog.value = true
    // 重置表单
    generateForm.group_id = null
    generateForm.validity_days = 30
    loadCodes()
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || '生成兑换码失败')
    console.error('Error generating codes:', error)
  } finally {
    generating.value = false
  }
}

const copyToClipboard = async (text: string) => {
  const success = await clipboardCopy(text, '已复制！')
  if (success) {
    copiedCode.value = text
    setTimeout(() => {
      copiedCode.value = null
    }, 2000)
  }
}

const handleExportCodes = async () => {
  try {
    const blob = await adminAPI.redeem.exportCodes({
      type: filters.type as RedeemCodeType,
      status: filters.status as any
    })

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `redeem-codes-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    appStore.showSuccess('兑换码导出成功')
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || '导出兑换码失败')
    console.error('Error exporting codes:', error)
  }
}

const handleDelete = (code: RedeemCode) => {
  deletingCode.value = code
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!deletingCode.value) return

  try {
    await adminAPI.redeem.delete(deletingCode.value.id)
    appStore.showSuccess('兑换码删除成功')
    showDeleteDialog.value = false
    deletingCode.value = null
    loadCodes()
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || '删除兑换码失败')
    console.error('Error deleting code:', error)
  }
}

const confirmDeleteUnused = async () => {
  try {
    // Get all unused codes and delete them
    const unusedCodesResponse = await adminAPI.redeem.list(1, 1000, { status: 'unused' })
    const unusedCodeIds = unusedCodesResponse.items.map((code) => code.id)

    if (unusedCodeIds.length === 0) {
      appStore.showInfo('没有未使用的兑换码可删除')
      showDeleteUnusedDialog.value = false
      return
    }

    const result = await adminAPI.redeem.batchDelete(unusedCodeIds)
    appStore.showSuccess(`成功删除 ${result.deleted} 个未使用的兑换码`)
    showDeleteUnusedDialog.value = false
    loadCodes()
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || '删除未使用的兑换码失败')
    console.error('Error deleting unused codes:', error)
  }
}

// 加载订阅类型分组
const loadSubscriptionGroups = async () => {
  try {
    const groups = await adminAPI.groups.getAll()
    subscriptionGroups.value = groups
  } catch (error) {
    console.error('Error loading subscription groups:', error)
  }
}

onMounted(() => {
  loadCodes()
  loadSubscriptionGroups()
})

onUnmounted(() => {
  clearTimeout(searchTimeout)
  abortController?.abort()
})
</script>
