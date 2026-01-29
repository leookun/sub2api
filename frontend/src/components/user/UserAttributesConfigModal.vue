<template>
  <BaseDialog :show="show" :title="'用户属性配置'" width="wide" @close="emit('close')">
    <div class="space-y-4">
      <!-- Header with Add Button -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500 dark:text-dark-400">
          {{ '配置用户的自定义属性字段' }}
        </p>
        <button @click="openCreateModal" class="btn btn-primary btn-sm">
          <Icon name="plus" size="sm" class="mr-1.5" :stroke-width="2" />
          {{ '添加属性' }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <svg class="h-8 w-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>

      <!-- Empty State -->
      <div v-else-if="attributes.length === 0" class="py-12 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
        <p class="mt-2 text-sm text-gray-500 dark:text-dark-400">
          {{ '暂无自定义属性' }}
        </p>
        <p class="text-xs text-gray-400 dark:text-dark-500">
          {{ '点击上方按钮添加自定义属性' }}
        </p>
      </div>

      <!-- Attributes List -->
      <div v-else class="max-h-96 space-y-2 overflow-y-auto">
        <div
          v-for="attr in attributes"
          :key="attr.id"
          class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-dark-600 dark:bg-dark-800"
        >
          <!-- Drag Handle -->
          <div class="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" :title="'拖拽排序'">
            <Icon name="menu" size="md" />
          </div>

          <!-- Attribute Info -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900 dark:text-white">{{ attr.name }}</span>
              <span class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500 dark:bg-dark-700 dark:text-dark-400">
                {{ attr.key }}
              </span>
              <span v-if="attr.required" class="badge badge-danger text-xs">
                {{ '必填' }}
              </span>
              <span v-if="!attr.enabled" class="badge badge-gray text-xs">
                {{ '已禁用' }}
              </span>
            </div>
            <div class="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-dark-400">
              <span class="badge badge-gray">{{ t(`admin.users.attributes.types.${attr.type}`) }}</span>
              <span v-if="attr.description" class="truncate">{{ attr.description }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1">
            <button
              @click="openEditModal(attr)"
              class="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-dark-700 dark:hover:text-primary-400"
              :title="'编辑'"
            >
              <Icon name="edit" size="sm" />
            </button>
            <button
              @click="confirmDelete(attr)"
              class="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              :title="'删除'"
            >
              <Icon name="trash" size="sm" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button @click="emit('close')" class="btn btn-secondary">
          {{ '关闭' }}
        </button>
      </div>
    </template>
  </BaseDialog>

  <!-- Create/Edit Attribute Modal -->
  <BaseDialog
    :show="showEditModal"
    :title="editingAttribute ? '编辑属性' : '添加属性'"
    width="normal"
    @close="closeEditModal"
  >
    <form id="attribute-form" @submit.prevent="handleSave" class="space-y-4">
      <!-- Key -->
      <div>
        <label class="input-label">{{ '属性键' }}</label>
        <input
          v-model="form.key"
          type="text"
          required
          pattern="^[a-zA-Z][a-zA-Z0-9_]*$"
          class="input font-mono"
          :placeholder="'用于程序引用，只能包含字母、数字和下划线'"
          :disabled="!!editingAttribute"
        />
        <p class="input-hint">{{ '用于程序引用，只能包含字母、数字和下划线' }}</p>
      </div>

      <!-- Name -->
      <div>
        <label class="input-label">{{ '显示名称' }}</label>
        <input
          v-model="form.name"
          type="text"
          required
          class="input"
          :placeholder="'在表单中显示的名称'"
        />
      </div>

      <!-- Type -->
      <div>
        <label class="input-label">{{ '属性类型' }}</label>
        <Select
          v-model="form.type"
          :options="attributeTypes.map(type => ({ value: type, label: t(`admin.users.attributes.types.${type}`) }))"
        />
      </div>

      <!-- Options (for select/multi_select) -->
      <div v-if="form.type === 'select' || form.type === 'multi_select'" class="space-y-2">
        <label class="input-label">{{ '选项配置' }}</label>
        <div v-for="(option, index) in form.options" :key="index" class="flex items-center gap-2">
          <input
            v-model="option.value"
            type="text"
            class="input flex-1 font-mono text-sm"
            :placeholder="'选项值'"
            required
          />
          <input
            v-model="option.label"
            type="text"
            class="input flex-1 text-sm"
            :placeholder="'显示文本'"
            required
          />
          <button
            type="button"
            @click="removeOption(index)"
            class="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
          >
            <Icon name="x" size="sm" :stroke-width="2" />
          </button>
        </div>
        <button type="button" @click="addOption" class="btn btn-secondary btn-sm">
          <Icon name="plus" size="sm" class="mr-1" :stroke-width="2" />
          {{ '添加选项' }}
        </button>
      </div>

      <!-- Description -->
      <div>
        <label class="input-label">{{ '描述' }}</label>
        <input
          v-model="form.description"
          type="text"
          class="input"
          :placeholder="'属性的说明文字'"
        />
      </div>

      <!-- Placeholder -->
      <div>
        <label class="input-label">{{ '占位符' }}</label>
        <input
          v-model="form.placeholder"
          type="text"
          class="input"
          :placeholder="'输入框的提示文字'"
        />
      </div>

      <!-- Required & Enabled -->
      <div class="flex items-center gap-6">
        <label class="flex items-center gap-2">
          <input v-model="form.required" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-primary-600" />
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ '必填' }}</span>
        </label>
        <label class="flex items-center gap-2">
          <input v-model="form.enabled" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-primary-600" />
          <span class="text-sm text-gray-700 dark:text-gray-300">{{ '启用' }}</span>
        </label>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button @click="closeEditModal" type="button" class="btn btn-secondary">
          {{ '取消' }}
        </button>
        <button type="submit" form="attribute-form" :disabled="saving" class="btn btn-primary">
          <svg v-if="saving" class="-ml-1 mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ saving ? '保存中...' : (editingAttribute ? '更新' : '创建') }}
        </button>
      </div>
    </template>
  </BaseDialog>

  <!-- Delete Confirmation -->
  <ConfirmDialog
    :show="showDeleteDialog"
    :title="'删除属性'"
    :message="`确定要删除属性 '${deletingAttribute?.name}' 吗？所有用户的该属性值将被删除。`"
    :confirm-text="'删除'"
    :cancel-text="'取消'"
    :danger="true"
    @confirm="handleDelete"
    @cancel="showDeleteDialog = false"
  />
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { adminAPI } from '@/api/admin'
import type { UserAttributeDefinition, UserAttributeType, UserAttributeOption } from '@/types'
import BaseDialog from '@/components/common/BaseDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import Icon from '@/components/icons/Icon.vue'
import Select from '@/components/common/Select.vue'

const appStore = useAppStore()

interface Props {
  show: boolean
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const attributeTypes: UserAttributeType[] = ['text', 'textarea', 'number', 'email', 'url', 'date', 'select', 'multi_select']

const loading = ref(false)
const saving = ref(false)
const attributes = ref<UserAttributeDefinition[]>([])
const showEditModal = ref(false)
const showDeleteDialog = ref(false)
const editingAttribute = ref<UserAttributeDefinition | null>(null)
const deletingAttribute = ref<UserAttributeDefinition | null>(null)

const form = reactive({
  key: '',
  name: '',
  type: 'text' as UserAttributeType,
  description: '',
  placeholder: '',
  required: false,
  enabled: true,
  options: [] as UserAttributeOption[]
})

const loadAttributes = async () => {
  loading.value = true
  try {
    attributes.value = await adminAPI.userAttributes.listDefinitions()
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || '加载属性列表失败')
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  editingAttribute.value = null
  form.key = ''
  form.name = ''
  form.type = 'text'
  form.description = ''
  form.placeholder = ''
  form.required = false
  form.enabled = true
  form.options = []
  showEditModal.value = true
}

const openEditModal = (attr: UserAttributeDefinition) => {
  editingAttribute.value = attr
  form.key = attr.key
  form.name = attr.name
  form.type = attr.type
  form.description = attr.description || ''
  form.placeholder = attr.placeholder || ''
  form.required = attr.required
  form.enabled = attr.enabled
  form.options = attr.options ? [...attr.options] : []
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingAttribute.value = null
}

const addOption = () => {
  form.options.push({ value: '', label: '' })
}

const removeOption = (index: number) => {
  form.options.splice(index, 1)
}

const handleSave = async () => {
  if (!form.key.trim()) {
    appStore.showError('请输入属性键')
    return
  }
  if (!form.name.trim()) {
    appStore.showError('请输入显示名称')
    return
  }
  if ((form.type === 'select' || form.type === 'multi_select') && form.options.length === 0) {
    appStore.showError('请至少添加一个选项')
    return
  }
  saving.value = true
  try {
    const data = {
      key: form.key,
      name: form.name,
      type: form.type,
      description: form.description || undefined,
      placeholder: form.placeholder || undefined,
      required: form.required,
      enabled: form.enabled,
      options: (form.type === 'select' || form.type === 'multi_select') ? form.options : undefined
    }

    if (editingAttribute.value) {
      await adminAPI.userAttributes.updateDefinition(editingAttribute.value.id, data)
      appStore.showSuccess('属性更新成功')
    } else {
      await adminAPI.userAttributes.createDefinition(data)
      appStore.showSuccess('属性创建成功')
    }

    closeEditModal()
    loadAttributes()
  } catch (error: any) {
    const msg = editingAttribute.value
      ? '更新属性失败'
      : '创建属性失败'
    appStore.showError(error.response?.data?.detail || msg)
  } finally {
    saving.value = false
  }
}

const confirmDelete = (attr: UserAttributeDefinition) => {
  deletingAttribute.value = attr
  showDeleteDialog.value = true
}

const handleDelete = async () => {
  if (!deletingAttribute.value) return

  try {
    await adminAPI.userAttributes.deleteDefinition(deletingAttribute.value.id)
    appStore.showSuccess('属性删除成功')
    showDeleteDialog.value = false
    deletingAttribute.value = null
    loadAttributes()
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || '删除属性失败')
  }
}

watch(() => props.show, (isShow) => {
  if (isShow) {
    loadAttributes()
  }
})
</script>
