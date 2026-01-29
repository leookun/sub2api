<template>
  <AppLayout>
    <TablePageLayout>
      <template #actions>
        <div class="flex justify-end gap-3">
          <button
            :disabled="loading"
            class="btn btn-secondary"
            :title="'刷新'"
            @click="loadCodes"
          >
            <Icon
              name="refresh"
              size="md"
              :class="loading ? 'animate-spin' : ''"
            />
          </button>
          <button class="btn btn-primary" @click="showCreateDialog = true">
            <Icon name="plus" size="md" class="mr-1" />
            创建优惠码
          </button>
        </div>
      </template>

      <template #filters>
        <div
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="max-w-md flex-1">
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="'搜索优惠码...'"
              class="input"
              @input="handleSearch"
            />
          </div>
          <div class="flex gap-2">
            <Select
              v-model="filters.status"
              :options="filterStatusOptions"
              class="w-36"
              @change="loadCodes"
            />
          </div>
        </div>
      </template>

      <template #table>
        <DataTable :columns="columns" :data="codes" :loading="loading">
          <template #cell-code="{ value }">
            <div class="flex items-center space-x-2">
              <code
                class="font-mono text-sm text-gray-900 dark:text-gray-100"
                >{{ value }}</code
              >
              <button
                :class="[
                  'flex items-center transition-colors',
                  copiedCode === value
                    ? 'text-green-500'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                ]"
                :title="copiedCode === value ? '已复制！' : '复制到剪贴板'"
                @click="copyToClipboard(value)"
              >
                <Icon
                  v-if="copiedCode !== value"
                  name="copy"
                  size="sm"
                  :stroke-width="2"
                />
                <svg
                  v-else
                  class="h-4 w-4"
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
              </button>
            </div>
          </template>

          <template #cell-bonus_amount="{ value }">
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              ${{ value.toFixed(2) }}
            </span>
          </template>

          <template #cell-usage="{ row }">
            <span class="text-sm text-gray-600 dark:text-gray-300">
              {{ row.used_count }} /
              {{ row.max_uses === 0 ? "∞" : row.max_uses }}
            </span>
          </template>

          <template #cell-status="{ value, row }">
            <span :class="['badge', getStatusClass(value, row)]">
              {{ getStatusLabel(value, row) }}
            </span>
          </template>

          <template #cell-expires_at="{ value }">
            <span class="text-sm text-gray-500 dark:text-dark-400">
              {{ value ? formatDateTime(value) : "永不过期" }}
            </span>
          </template>

          <template #cell-created_at="{ value }">
            <span class="text-sm text-gray-500 dark:text-dark-400">
              {{ formatDateTime(value) }}
            </span>
          </template>

          <template #cell-actions="{ row }">
            <div class="flex items-center space-x-1">
              <button
                class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                :title="'复制注册链接'"
                @click="copyRegisterLink(row)"
              >
                <Icon name="link" size="sm" />
              </button>
              <button
                class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                :title="'查看使用记录'"
                @click="handleViewUsages(row)"
              >
                <Icon name="eye" size="sm" />
              </button>
              <button
                class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-dark-600 dark:hover:text-gray-300"
                :title="'编辑'"
                @click="handleEdit(row)"
              >
                <Icon name="edit" size="sm" />
              </button>
              <button
                class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                :title="'删除'"
                @click="handleDelete(row)"
              >
                <Icon name="trash" size="sm" />
              </button>
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
      </template>
    </TablePageLayout>

    <!-- Create Dialog -->
    <BaseDialog
      :show="showCreateDialog"
      :title="'创建优惠码'"
      width="normal"
      @close="showCreateDialog = false"
    >
      <form
        id="create-promo-form"
        class="space-y-4"
        @submit.prevent="handleCreate"
      >
        <div>
          <label class="input-label">
            优惠码
            <span class="ml-1 text-xs font-normal text-gray-400"
              >(留空自动生成)</span
            >
          </label>
          <input
            v-model="createForm.code"
            type="text"
            class="input font-mono uppercase"
            :placeholder="'输入优惠码或留空'"
          />
        </div>
        <div>
          <label class="input-label">赠送金额 ($)</label>
          <input
            v-model.number="createForm.bonus_amount"
            type="number"
            step="0.01"
            min="0"
            required
            class="input"
          />
        </div>
        <div>
          <label class="input-label">
            最大使用次数
            <span class="ml-1 text-xs font-normal text-gray-400"
              >(0 = 无限制)</span
            >
          </label>
          <input
            v-model.number="createForm.max_uses"
            type="number"
            min="0"
            class="input"
          />
        </div>
        <div>
          <label class="input-label">
            过期时间
            <span class="ml-1 text-xs font-normal text-gray-400">(可选)</span>
          </label>
          <input
            v-model="createForm.expires_at_str"
            type="datetime-local"
            class="input"
          />
        </div>
        <div>
          <label class="input-label">
            备注
            <span class="ml-1 text-xs font-normal text-gray-400">(可选)</span>
          </label>
          <textarea
            v-model="createForm.notes"
            rows="2"
            class="input"
            :placeholder="'可选备注信息'"
          ></textarea>
        </div>
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="btn btn-secondary"
            @click="showCreateDialog = false"
          >
            取消
          </button>
          <button
            type="submit"
            form="create-promo-form"
            :disabled="creating"
            class="btn btn-primary"
          >
            {{ creating ? "common.creating" : "创建" }}
          </button>
        </div>
      </template>
    </BaseDialog>

    <!-- Edit Dialog -->
    <BaseDialog
      :show="showEditDialog"
      :title="'编辑优惠码'"
      width="normal"
      @close="closeEditDialog"
    >
      <form
        id="edit-promo-form"
        class="space-y-4"
        @submit.prevent="handleUpdate"
      >
        <div>
          <label class="input-label">优惠码</label>
          <input
            v-model="editForm.code"
            type="text"
            class="input font-mono uppercase"
          />
        </div>
        <div>
          <label class="input-label">赠送金额 ($)</label>
          <input
            v-model.number="editForm.bonus_amount"
            type="number"
            step="0.01"
            min="0"
            required
            class="input"
          />
        </div>
        <div>
          <label class="input-label">
            最大使用次数
            <span class="ml-1 text-xs font-normal text-gray-400"
              >(0 = 无限制)</span
            >
          </label>
          <input
            v-model.number="editForm.max_uses"
            type="number"
            min="0"
            class="input"
          />
        </div>
        <div>
          <label class="input-label">状态</label>
          <Select v-model="editForm.status" :options="statusOptions" />
        </div>
        <div>
          <label class="input-label">
            过期时间
            <span class="ml-1 text-xs font-normal text-gray-400">(可选)</span>
          </label>
          <input
            v-model="editForm.expires_at_str"
            type="datetime-local"
            class="input"
          />
        </div>
        <div>
          <label class="input-label">
            备注
            <span class="ml-1 text-xs font-normal text-gray-400">(可选)</span>
          </label>
          <textarea v-model="editForm.notes" rows="2" class="input"></textarea>
        </div>
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="btn btn-secondary"
            @click="closeEditDialog"
          >
            取消
          </button>
          <button
            type="submit"
            form="edit-promo-form"
            :disabled="updating"
            class="btn btn-primary"
          >
            {{ updating ? "保存中..." : "保存" }}
          </button>
        </div>
      </template>
    </BaseDialog>

    <!-- Usages Dialog -->
    <BaseDialog
      :show="showUsagesDialog"
      :title="'使用记录'"
      width="wide"
      @close="showUsagesDialog = false"
    >
      <div v-if="usagesLoading" class="flex items-center justify-center py-8">
        <Icon name="refresh" size="lg" class="animate-spin text-gray-400" />
      </div>
      <div
        v-else-if="usages.length === 0"
        class="py-8 text-center text-gray-500 dark:text-gray-400"
      >
        暂无使用记录
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="usage in usages"
          :key="usage.id"
          class="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-dark-600"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
            >
              <Icon
                name="user"
                size="sm"
                class="text-green-600 dark:text-green-400"
              />
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ usage.user?.email || `用户 #${usage.user_id}` }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatDateTime(usage.used_at) }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <span
              class="text-sm font-medium text-green-600 dark:text-green-400"
            >
              +${{ usage.bonus_amount.toFixed(2) }}
            </span>
          </div>
        </div>
        <!-- Usages Pagination -->
        <div v-if="usagesTotal > usagesPageSize" class="mt-4">
          <Pagination
            :page="usagesPage"
            :total="usagesTotal"
            :page-size="usagesPageSize"
            :page-size-options="[10, 20, 50]"
            @update:page="handleUsagesPageChange"
            @update:page-size="
              (size: number) => {
                usagesPageSize = size;
                usagesPage = 1;
                loadUsages();
              }
            "
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end">
          <button
            type="button"
            class="btn btn-secondary"
            @click="showUsagesDialog = false"
          >
            关闭
          </button>
        </div>
      </template>
    </BaseDialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :show="showDeleteDialog"
      :title="'删除优惠码'"
      :message="'确定要删除此优惠码吗？此操作无法撤销。'"
      :confirm-text="'删除'"
      :cancel-text="'取消'"
      danger
      @confirm="confirmDelete"
      @cancel="showDeleteDialog = false"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useAppStore } from "@/stores/app";
import { useClipboard } from "@/composables/useClipboard";
import { adminAPI } from "@/api/admin";
import type { PromoCode, PromoCodeUsage } from "@/types";
import type { Column } from "@/components/common/types";

const appStore = useAppStore();
const { copyToClipboard: clipboardCopy } = useClipboard();

// State
const codes = ref<PromoCode[]>([]);
const loading = ref(false);
const creating = ref(false);
const updating = ref(false);
const searchQuery = ref("");
const copiedCode = ref<string | null>(null);

const filters = reactive({
  status: "",
});

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0,
});

// Dialogs
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const showUsagesDialog = ref(false);

const editingCode = ref<PromoCode | null>(null);
const deletingCode = ref<PromoCode | null>(null);

// Usages
const usages = ref<PromoCodeUsage[]>([]);
const usagesLoading = ref(false);
const currentViewingCode = ref<PromoCode | null>(null);
const usagesPage = ref(1);
const usagesPageSize = ref(20);
const usagesTotal = ref(0);

// Forms
const createForm = reactive({
  code: "",
  bonus_amount: 1,
  max_uses: 0,
  expires_at_str: "",
  notes: "",
});

const editForm = reactive({
  code: "",
  bonus_amount: 0,
  max_uses: 0,
  status: "active" as "active" | "disabled",
  expires_at_str: "",
  notes: "",
});

// Options
const filterStatusOptions = computed(() => [
  { value: "", label: "全部状态" },
  { value: "active", label: "启用" },
  { value: "disabled", label: "禁用" },
]);

const statusOptions = computed(() => [
  { value: "active", label: "启用" },
  { value: "disabled", label: "禁用" },
]);

const columns = computed<Column[]>(() => [
  { key: "code", label: "优惠码" },
  { key: "bonus_amount", label: "赠送金额", sortable: true },
  { key: "usage", label: "使用量" },
  { key: "status", label: "状态", sortable: true },
  { key: "expires_at", label: "过期时间", sortable: true },
  { key: "created_at", label: "创建时间", sortable: true },
  { key: "actions", label: "操作" },
]);

// Helpers
const getStatusClass = (status: string, row: PromoCode) => {
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return "badge-danger";
  }
  if (row.max_uses > 0 && row.used_count >= row.max_uses) {
    return "badge-gray";
  }
  return status === "active" ? "badge-success" : "badge-gray";
};

const getStatusLabel = (status: string, row: PromoCode) => {
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return "已过期";
  }
  if (row.max_uses > 0 && row.used_count >= row.max_uses) {
    return "已用完";
  }
  return status === "active" ? "启用" : "禁用";
};

// API calls
let abortController: AbortController | null = null;

const loadCodes = async () => {
  if (abortController) {
    abortController.abort();
  }
  const currentController = new AbortController();
  abortController = currentController;
  loading.value = true;

  try {
    const response = await adminAPI.promo.list(
      pagination.page,
      pagination.page_size,
      {
        status: filters.status || undefined,
        search: searchQuery.value || undefined,
      },
    );
    if (currentController.signal.aborted) return;

    codes.value = response.items;
    pagination.total = response.total;
  } catch (error: any) {
    if (currentController.signal.aborted || error?.name === "AbortError")
      return;
    appStore.showError("加载优惠码失败");
    console.error("Error loading promo codes:", error);
  } finally {
    if (
      abortController === currentController &&
      !currentController.signal.aborted
    ) {
      loading.value = false;
      abortController = null;
    }
  }
};

let searchTimeout: ReturnType<typeof setTimeout>;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.page = 1;
    loadCodes();
  }, 300);
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  loadCodes();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.page_size = pageSize;
  pagination.page = 1;
  loadCodes();
};

const copyToClipboard = async (text: string) => {
  const success = await clipboardCopy(text, "已复制！");
  if (success) {
    copiedCode.value = text;
    setTimeout(() => {
      copiedCode.value = null;
    }, 2000);
  }
};

// Create
const handleCreate = async () => {
  creating.value = true;
  try {
    await adminAPI.promo.create({
      code: createForm.code || undefined,
      bonus_amount: createForm.bonus_amount,
      max_uses: createForm.max_uses,
      expires_at: createForm.expires_at_str
        ? Math.floor(new Date(createForm.expires_at_str).getTime() / 1000)
        : undefined,
      notes: createForm.notes || undefined,
    });
    appStore.showSuccess("优惠码创建成功");
    showCreateDialog.value = false;
    resetCreateForm();
    loadCodes();
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || "创建优惠码失败");
  } finally {
    creating.value = false;
  }
};

const resetCreateForm = () => {
  createForm.code = "";
  createForm.bonus_amount = 1;
  createForm.max_uses = 0;
  createForm.expires_at_str = "";
  createForm.notes = "";
};

// Edit
const handleEdit = (code: PromoCode) => {
  editingCode.value = code;
  editForm.code = code.code;
  editForm.bonus_amount = code.bonus_amount;
  editForm.max_uses = code.max_uses;
  editForm.status = code.status;
  editForm.expires_at_str = code.expires_at
    ? new Date(code.expires_at).toISOString().slice(0, 16)
    : "";
  editForm.notes = code.notes || "";
  showEditDialog.value = true;
};

const closeEditDialog = () => {
  showEditDialog.value = false;
  editingCode.value = null;
};

const handleUpdate = async () => {
  if (!editingCode.value) return;

  updating.value = true;
  try {
    await adminAPI.promo.update(editingCode.value.id, {
      code: editForm.code,
      bonus_amount: editForm.bonus_amount,
      max_uses: editForm.max_uses,
      status: editForm.status,
      expires_at: editForm.expires_at_str
        ? Math.floor(new Date(editForm.expires_at_str).getTime() / 1000)
        : 0,
      notes: editForm.notes,
    });
    appStore.showSuccess("优惠码更新成功");
    closeEditDialog();
    loadCodes();
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || "更新优惠码失败");
  } finally {
    updating.value = false;
  }
};

// Copy Register Link
const copyRegisterLink = async (code: PromoCode) => {
  const baseUrl = window.location.origin;
  const registerLink = `${baseUrl}/register?promo=${encodeURIComponent(code.code)}`;

  try {
    await navigator.clipboard.writeText(registerLink);
    appStore.showSuccess("注册链接已复制到剪贴板");
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = registerLink;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    appStore.showSuccess("注册链接已复制到剪贴板");
  }
};

// Delete
const handleDelete = (code: PromoCode) => {
  deletingCode.value = code;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!deletingCode.value) return;

  try {
    await adminAPI.promo.delete(deletingCode.value.id);
    appStore.showSuccess("优惠码删除成功");
    showDeleteDialog.value = false;
    deletingCode.value = null;
    loadCodes();
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || "删除优惠码失败");
  }
};

// View Usages
const handleViewUsages = async (code: PromoCode) => {
  currentViewingCode.value = code;
  showUsagesDialog.value = true;
  usagesPage.value = 1;
  await loadUsages();
};

const loadUsages = async () => {
  if (!currentViewingCode.value) return;
  usagesLoading.value = true;
  usages.value = [];

  try {
    const response = await adminAPI.promo.getUsages(
      currentViewingCode.value.id,
      usagesPage.value,
      usagesPageSize.value,
    );
    usages.value = response.items;
    usagesTotal.value = response.total;
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || "加载使用记录失败");
  } finally {
    usagesLoading.value = false;
  }
};

const handleUsagesPageChange = (page: number) => {
  usagesPage.value = page;
  loadUsages();
};

onMounted(() => {
  loadCodes();
});

onUnmounted(() => {
  clearTimeout(searchTimeout);
  abortController?.abort();
});
</script>
