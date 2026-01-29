<template>
  <BaseDialog
    :show="show"
    :title="'清理使用记录'"
    width="wide"
    @close="handleClose"
  >
    <div class="space-y-4">
      <UsageFilters
        v-model="localFilters"
        v-model:start-date="localStartDate"
        v-model:end-date="localEndDate"
        :exporting="false"
        :show-actions="false"
        @change="noop"
      />

      <div
        class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      >
        {{ "清理不可恢复，且会影响历史统计回看。" }}
      </div>

      <div class="rounded-xl border border-gray-200 p-4 dark:border-dark-700">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {{ "最近清理任务" }}
          </h4>
          <button type="button" class="btn btn-ghost btn-sm" @click="loadTasks">
            {{ "刷新" }}
          </button>
        </div>

        <div class="mt-3 space-y-2">
          <div
            v-if="tasksLoading"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            {{ "正在加载任务..." }}
          </div>
          <div
            v-else-if="tasks.length === 0"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            {{ "暂无清理任务" }}
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="task in tasks"
              :key="task.id"
              class="flex flex-col gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-600 dark:border-dark-700 dark:text-gray-300"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span
                    :class="statusClass(task.status)"
                    class="rounded-full px-2 py-0.5 text-xs font-semibold"
                  >
                    {{ statusLabel(task.status) }}
                  </span>
                  <span class="text-xs text-gray-400">#{{ task.id }}</span>
                  <button
                    v-if="canCancel(task)"
                    type="button"
                    class="btn btn-ghost btn-xs text-rose-600 hover:text-rose-700 dark:text-rose-300"
                    @click="openCancelConfirm(task)"
                  >
                    {{ "取消任务" }}
                  </button>
                </div>
                <div class="text-xs text-gray-400">
                  {{ formatDateTime(task.created_at) }}
                </div>
              </div>
              <div
                class="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400"
              >
                <span>{{ "时间范围" }}: {{ formatRange(task) }}</span>
                <span
                  >{{ "删除数量" }}:
                  {{ task.deleted_rows.toLocaleString() }}</span
                >
              </div>
              <div v-if="task.error_message" class="text-xs text-rose-500">
                {{ task.error_message }}
              </div>
            </div>
          </div>
        </div>

        <Pagination
          v-if="tasksTotal > tasksPageSize"
          class="mt-4"
          :total="tasksTotal"
          :page="tasksPage"
          :page-size="tasksPageSize"
          :page-size-options="[5]"
          :show-page-size-selector="false"
          :show-jump="true"
          @update:page="handleTaskPageChange"
          @update:pageSize="handleTaskPageSizeChange"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button type="button" class="btn btn-secondary" @click="handleClose">
          {{ "取消" }}
        </button>
        <button
          type="button"
          class="btn btn-danger"
          :disabled="submitting"
          @click="openConfirm"
        >
          {{ submitting ? "提交中..." : "提交清理" }}
        </button>
      </div>
    </template>
  </BaseDialog>

  <ConfirmDialog
    :show="confirmVisible"
    :title="'确认清理'"
    :message="'确定要提交清理任务吗？清理不可恢复。'"
    :confirm-text="'确认清理'"
    danger
    @confirm="submitCleanup"
    @cancel="confirmVisible = false"
  />

  <ConfirmDialog
    :show="cancelConfirmVisible"
    :title="'确认取消'"
    :message="'确定要取消该清理任务吗？'"
    :confirm-text="'确认取消'"
    danger
    @confirm="cancelTask"
    @cancel="cancelConfirmVisible = false"
  />
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import { useAppStore } from "@/stores/app";
import { adminUsageAPI } from "@/api/admin/usage";
import type {
  AdminUsageQueryParams,
  UsageCleanupTask,
  CreateUsageCleanupTaskRequest,
} from "@/api/admin/usage";

interface Props {
  show: boolean;
  filters: AdminUsageQueryParams;
  startDate: string;
  endDate: string;
}

const props = defineProps<Props>();
const emit = defineEmits(["close"]);

const appStore = useAppStore();

const localFilters = ref<AdminUsageQueryParams>({});
const localStartDate = ref("");
const localEndDate = ref("");

const tasks = ref<UsageCleanupTask[]>([]);
const tasksLoading = ref(false);
const tasksPage = ref(1);
const tasksPageSize = ref(5);
const tasksTotal = ref(0);
const submitting = ref(false);
const confirmVisible = ref(false);
const cancelConfirmVisible = ref(false);
const canceling = ref(false);
const cancelTarget = ref<UsageCleanupTask | null>(null);
let pollTimer: number | null = null;

const noop = () => {};

const resetFilters = () => {
  localFilters.value = { ...props.filters };
  localStartDate.value = props.startDate;
  localEndDate.value = props.endDate;
  localFilters.value.start_date = localStartDate.value;
  localFilters.value.end_date = localEndDate.value;
  tasksPage.value = 1;
  tasksTotal.value = 0;
};

const startPolling = () => {
  stopPolling();
  pollTimer = window.setInterval(() => {
    loadTasks();
  }, 10000);
};

const stopPolling = () => {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
};

const handleClose = () => {
  stopPolling();
  confirmVisible.value = false;
  cancelConfirmVisible.value = false;
  canceling.value = false;
  cancelTarget.value = null;
  submitting.value = false;
  emit("close");
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: "待执行",
    running: "执行中",
    succeeded: "已完成",
    failed: "失败",
    canceled: "已取消",
  };
  return map[status] || status;
};

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    pending:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    running: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
    succeeded:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
    failed: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
    canceled: "bg-gray-200 text-gray-600 dark:bg-dark-600 dark:text-gray-300",
  };
  return map[status] || "bg-gray-100 text-gray-600";
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatRange = (task: UsageCleanupTask) => {
  const start = formatDateTime(task.filters.start_time);
  const end = formatDateTime(task.filters.end_time);
  return `${start} ~ ${end}`;
};

const getUserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
};

const loadTasks = async () => {
  if (!props.show) return;
  tasksLoading.value = true;
  try {
    const res = await adminUsageAPI.listCleanupTasks({
      page: tasksPage.value,
      page_size: tasksPageSize.value,
    });
    tasks.value = res.items || [];
    tasksTotal.value = res.total || 0;
    if (res.page) {
      tasksPage.value = res.page;
    }
    if (res.page_size) {
      tasksPageSize.value = res.page_size;
    }
  } catch (error) {
    console.error("Failed to load cleanup tasks:", error);
    appStore.showError("加载清理任务失败");
  } finally {
    tasksLoading.value = false;
  }
};

const handleTaskPageChange = (page: number) => {
  tasksPage.value = page;
  loadTasks();
};

const handleTaskPageSizeChange = (size: number) => {
  if (!Number.isFinite(size) || size <= 0) return;
  tasksPageSize.value = size;
  tasksPage.value = 1;
  loadTasks();
};

const openConfirm = () => {
  confirmVisible.value = true;
};

const canCancel = (task: UsageCleanupTask) => {
  return task.status === "pending" || task.status === "running";
};

const openCancelConfirm = (task: UsageCleanupTask) => {
  cancelTarget.value = task;
  cancelConfirmVisible.value = true;
};

const buildPayload = (): CreateUsageCleanupTaskRequest | null => {
  if (!localStartDate.value || !localEndDate.value) {
    appStore.showError("请选择时间范围");
    return null;
  }

  const payload: CreateUsageCleanupTaskRequest = {
    start_date: localStartDate.value,
    end_date: localEndDate.value,
    timezone: getUserTimezone(),
  };

  if (localFilters.value.user_id && localFilters.value.user_id > 0) {
    payload.user_id = localFilters.value.user_id;
  }
  if (localFilters.value.api_key_id && localFilters.value.api_key_id > 0) {
    payload.api_key_id = localFilters.value.api_key_id;
  }
  if (localFilters.value.account_id && localFilters.value.account_id > 0) {
    payload.account_id = localFilters.value.account_id;
  }
  if (localFilters.value.group_id && localFilters.value.group_id > 0) {
    payload.group_id = localFilters.value.group_id;
  }
  if (localFilters.value.model) {
    payload.model = localFilters.value.model;
  }
  if (
    localFilters.value.stream !== null &&
    localFilters.value.stream !== undefined
  ) {
    payload.stream = localFilters.value.stream;
  }
  if (
    localFilters.value.billing_type !== null &&
    localFilters.value.billing_type !== undefined
  ) {
    payload.billing_type = localFilters.value.billing_type;
  }

  return payload;
};

const submitCleanup = async () => {
  const payload = buildPayload();
  if (!payload) {
    confirmVisible.value = false;
    return;
  }
  submitting.value = true;
  confirmVisible.value = false;
  try {
    await adminUsageAPI.createCleanupTask(payload);
    appStore.showSuccess("清理任务已创建");
    loadTasks();
  } catch (error) {
    console.error("Failed to create cleanup task:", error);
    appStore.showError("创建清理任务失败");
  } finally {
    submitting.value = false;
  }
};

const cancelTask = async () => {
  const task = cancelTarget.value;
  if (!task) {
    cancelConfirmVisible.value = false;
    return;
  }
  canceling.value = true;
  cancelConfirmVisible.value = false;
  try {
    await adminUsageAPI.cancelCleanupTask(task.id);
    appStore.showSuccess("清理任务已取消");
    loadTasks();
  } catch (error) {
    console.error("Failed to cancel cleanup task:", error);
    appStore.showError("取消清理任务失败");
  } finally {
    canceling.value = false;
    cancelTarget.value = null;
  }
};

watch(
  () => props.show,
  (show) => {
    if (show) {
      resetFilters();
      loadTasks();
      startPolling();
    } else {
      stopPolling();
    }
  },
);

onUnmounted(() => {
  stopPolling();
});
</script>
