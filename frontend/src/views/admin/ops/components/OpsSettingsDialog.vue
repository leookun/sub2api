<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { opsAPI } from "@/api/admin/ops";
import type {
  OpsAlertRuntimeSettings,
  EmailNotificationConfig,
  AlertSeverity,
  OpsAdvancedSettings,
  OpsMetricThresholds,
} from "../types";

const appStore = useAppStore();

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const loading = ref(false);
const saving = ref(false);

// 运行时设置
const runtimeSettings = ref<OpsAlertRuntimeSettings | null>(null);
// 邮件通知配置
const emailConfig = ref<EmailNotificationConfig | null>(null);
// 高级设置
const advancedSettings = ref<OpsAdvancedSettings | null>(null);
// 指标阈值配置
const metricThresholds = ref<OpsMetricThresholds>({
  sla_percent_min: 99.5,
  ttft_p99_ms_max: 500,
  request_error_rate_percent_max: 5,
  upstream_error_rate_percent_max: 5,
});

// 加载所有配置
async function loadAllSettings() {
  loading.value = true;
  try {
    const [runtime, email, advanced, thresholds] = await Promise.all([
      opsAPI.getAlertRuntimeSettings(),
      opsAPI.getEmailNotificationConfig(),
      opsAPI.getAdvancedSettings(),
      opsAPI.getMetricThresholds(),
    ]);
    runtimeSettings.value = runtime;
    emailConfig.value = email;
    advancedSettings.value = advanced;
    // 如果后端返回了阈值，使用后端的值；否则保持默认值
    if (thresholds && Object.keys(thresholds).length > 0) {
      metricThresholds.value = {
        sla_percent_min: thresholds.sla_percent_min ?? 99.5,
        ttft_p99_ms_max: thresholds.ttft_p99_ms_max ?? 500,
        request_error_rate_percent_max:
          thresholds.request_error_rate_percent_max ?? 5,
        upstream_error_rate_percent_max:
          thresholds.upstream_error_rate_percent_max ?? 5,
      };
    }
  } catch (err: any) {
    console.error("[OpsSettingsDialog] Failed to load settings", err);
    appStore.showError(err?.response?.data?.detail || "加载设置失败");
  } finally {
    loading.value = false;
  }
}

// 监听弹窗打开
watch(
  () => props.show,
  (show) => {
    if (show) {
      loadAllSettings();
    }
  },
);

// 邮件输入
const alertRecipientInput = ref("");
const reportRecipientInput = ref("");

// 严重级别选项
const severityOptions: Array<{ value: AlertSeverity | ""; label: string }> = [
  { value: "", label: "全部级别" },
  { value: "critical", label: "严重" },
  { value: "warning", label: "警告" },
  { value: "info", label: "提示" },
];

// 验证邮箱
function isValidEmailAddress(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 添加收件人
function addRecipient(target: "alert" | "report") {
  if (!emailConfig.value) return;
  const raw = (
    target === "alert" ? alertRecipientInput.value : reportRecipientInput.value
  ).trim();
  if (!raw) return;

  if (!isValidEmailAddress(raw)) {
    appStore.showError("请输入有效的邮箱地址");
    return;
  }

  const normalized = raw.toLowerCase();
  const list =
    target === "alert"
      ? emailConfig.value.alert.recipients
      : emailConfig.value.report.recipients;
  if (!list.includes(normalized)) {
    list.push(normalized);
  }
  if (target === "alert") alertRecipientInput.value = "";
  else reportRecipientInput.value = "";
}

// 移除收件人
function removeRecipient(target: "alert" | "report", email: string) {
  if (!emailConfig.value) return;
  const list =
    target === "alert"
      ? emailConfig.value.alert.recipients
      : emailConfig.value.report.recipients;
  const idx = list.indexOf(email);
  if (idx >= 0) list.splice(idx, 1);
}

// 验证
const validation = computed(() => {
  const errors: string[] = [];

  // 验证运行时设置
  if (runtimeSettings.value) {
    const evalSeconds = runtimeSettings.value.evaluation_interval_seconds;
    if (
      !Number.isFinite(evalSeconds) ||
      evalSeconds < 1 ||
      evalSeconds > 86400
    ) {
      errors.push("评估间隔必须在 1 到 86400 秒之间");
    }
  }

  // 验证邮件配置
  if (emailConfig.value) {
    if (
      emailConfig.value.alert.enabled &&
      emailConfig.value.alert.recipients.length === 0
    ) {
      errors.push("已启用告警邮件，但未配置任何收件人");
    }
    if (
      emailConfig.value.report.enabled &&
      emailConfig.value.report.recipients.length === 0
    ) {
      errors.push("已启用报告邮件，但未配置任何收件人");
    }
  }

  // 验证高级设置
  if (advancedSettings.value) {
    const {
      error_log_retention_days,
      minute_metrics_retention_days,
      hourly_metrics_retention_days,
    } = advancedSettings.value.data_retention;
    if (error_log_retention_days < 1 || error_log_retention_days > 365) {
      errors.push("保留天数必须在1-365天之间");
    }
    if (
      minute_metrics_retention_days < 1 ||
      minute_metrics_retention_days > 365
    ) {
      errors.push("保留天数必须在1-365天之间");
    }
    if (
      hourly_metrics_retention_days < 1 ||
      hourly_metrics_retention_days > 365
    ) {
      errors.push("保留天数必须在1-365天之间");
    }
  }

  // 验证指标阈值
  if (
    metricThresholds.value.sla_percent_min != null &&
    (metricThresholds.value.sla_percent_min < 0 ||
      metricThresholds.value.sla_percent_min > 100)
  ) {
    errors.push("SLA最低百分比必须在0-100之间");
  }
  if (
    metricThresholds.value.ttft_p99_ms_max != null &&
    metricThresholds.value.ttft_p99_ms_max < 0
  ) {
    errors.push("TTFT P99最大值必须大于等于0");
  }
  if (
    metricThresholds.value.request_error_rate_percent_max != null &&
    (metricThresholds.value.request_error_rate_percent_max < 0 ||
      metricThresholds.value.request_error_rate_percent_max > 100)
  ) {
    errors.push("请求错误率最大值必须在0-100之间");
  }
  if (
    metricThresholds.value.upstream_error_rate_percent_max != null &&
    (metricThresholds.value.upstream_error_rate_percent_max < 0 ||
      metricThresholds.value.upstream_error_rate_percent_max > 100)
  ) {
    errors.push("上游错误率最大值必须在0-100之间");
  }

  return { valid: errors.length === 0, errors };
});

// 保存所有配置
async function saveAllSettings() {
  if (!validation.value.valid) {
    appStore.showError(validation.value.errors[0]);
    return;
  }

  saving.value = true;
  try {
    await Promise.all([
      runtimeSettings.value
        ? opsAPI.updateAlertRuntimeSettings(runtimeSettings.value)
        : Promise.resolve(),
      emailConfig.value
        ? opsAPI.updateEmailNotificationConfig(emailConfig.value)
        : Promise.resolve(),
      advancedSettings.value
        ? opsAPI.updateAdvancedSettings(advancedSettings.value)
        : Promise.resolve(),
      opsAPI.updateMetricThresholds(metricThresholds.value),
    ]);
    appStore.showSuccess("运维监控设置保存成功");
    emit("saved");
    emit("close");
  } catch (err: any) {
    console.error("[OpsSettingsDialog] Failed to save settings", err);
    appStore.showError(
      err?.response?.data?.message ||
        err?.response?.data?.detail ||
        "保存设置失败",
    );
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseDialog
    :show="show"
    :title="'运维监控设置'"
    width="extra-wide"
    @close="emit('close')"
  >
    <div v-if="loading" class="py-10 text-center text-sm text-gray-500">
      加载中...
    </div>

    <div
      v-else-if="runtimeSettings && emailConfig && advancedSettings"
      class="space-y-6"
    >
      <!-- 验证错误 -->
      <div
        v-if="!validation.valid"
        class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200"
      >
        <div class="font-bold">请先修正以下问题</div>
        <ul class="mt-1 list-disc space-y-1 pl-4">
          <li v-for="msg in validation.errors" :key="msg">{{ msg }}</li>
        </ul>
      </div>

      <!-- 数据采集频率 -->
      <div class="rounded-2xl bg-gray-50 p-4 dark:bg-dark-700/50">
        <h4 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          数据采集
        </h4>
        <div>
          <label class="input-label">评估间隔（秒）</label>
          <input
            v-model.number="runtimeSettings.evaluation_interval_seconds"
            type="number"
            min="1"
            max="86400"
            class="input"
          />
          <p class="mt-1 text-xs text-gray-500">
            检测任务的执行频率，建议保持默认
          </p>
        </div>
      </div>

      <!-- 预警配置 -->
      <div class="rounded-2xl bg-gray-50 p-4 dark:bg-dark-700/50">
        <h4 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          预警配置
        </h4>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="font-medium text-gray-900 dark:text-white">{{
                "开启预警"
              }}</label>
            </div>
            <Toggle v-model="emailConfig.alert.enabled" />
          </div>

          <div v-if="emailConfig.alert.enabled">
            <label class="input-label">预警接收邮箱</label>
            <div class="flex gap-2">
              <input
                v-model="alertRecipientInput"
                type="email"
                class="input"
                :placeholder="'输入邮箱地址'"
                @keydown.enter.prevent="addRecipient('alert')"
              />
              <button
                class="btn btn-secondary whitespace-nowrap"
                type="button"
                @click="addRecipient('alert')"
              >
                添加
              </button>
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="email in emailConfig.alert.recipients"
                :key="email"
                class="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {{ email }}
                <button
                  type="button"
                  class="text-blue-700/80 hover:text-blue-900"
                  @click="removeRecipient('alert', email)"
                >
                  ×
                </button>
              </span>
            </div>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              若为空，系统将使用第一个管理员邮箱作为默认收件人
            </p>
          </div>

          <div v-if="emailConfig.alert.enabled">
            <label class="input-label">最低级别</label>
            <Select
              v-model="emailConfig.alert.min_severity"
              :options="severityOptions"
            />
          </div>
        </div>
      </div>

      <!-- 评估报告配置 -->
      <div class="rounded-2xl bg-gray-50 p-4 dark:bg-dark-700/50">
        <h4 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          评估报告配置
        </h4>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <label class="font-medium text-gray-900 dark:text-white">{{
                "开启评估报告"
              }}</label>
            </div>
            <Toggle v-model="emailConfig.report.enabled" />
          </div>

          <div v-if="emailConfig.report.enabled">
            <label class="input-label">评估报告接收邮箱</label>
            <div class="flex gap-2">
              <input
                v-model="reportRecipientInput"
                type="email"
                class="input"
                :placeholder="'输入邮箱地址'"
                @keydown.enter.prevent="addRecipient('report')"
              />
              <button
                class="btn btn-secondary whitespace-nowrap"
                type="button"
                @click="addRecipient('report')"
              >
                添加
              </button>
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              <span
                v-for="email in emailConfig.report.recipients"
                :key="email"
                class="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              >
                {{ email }}
                <button
                  type="button"
                  class="text-blue-700/80 hover:text-blue-900"
                  @click="removeRecipient('report', email)"
                >
                  ×
                </button>
              </span>
            </div>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              若为空，系统将使用第一个管理员邮箱作为默认收件人
            </p>
          </div>

          <div
            v-if="emailConfig.report.enabled"
            class="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div class="flex items-center justify-between">
              <label
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >每日摘要</label
              >
              <Toggle v-model="emailConfig.report.daily_summary_enabled" />
            </div>
            <div v-if="emailConfig.report.daily_summary_enabled">
              <input
                v-model="emailConfig.report.daily_summary_schedule"
                type="text"
                class="input"
                placeholder="0 9 * * *"
              />
            </div>
            <div class="flex items-center justify-between">
              <label
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >每周摘要</label
              >
              <Toggle v-model="emailConfig.report.weekly_summary_enabled" />
            </div>
            <div v-if="emailConfig.report.weekly_summary_enabled">
              <input
                v-model="emailConfig.report.weekly_summary_schedule"
                type="text"
                class="input"
                placeholder="0 9 * * 1"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 指标阈值配置 -->
      <div class="rounded-2xl bg-gray-50 p-4 dark:bg-dark-700/50">
        <h4 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          指标阈值配置
        </h4>
        <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
          配置各项指标的告警阈值，超出阈值时将以红色显示
        </p>

        <div class="space-y-4">
          <div>
            <label class="input-label">SLA最低百分比</label>
            <input
              v-model.number="metricThresholds.sla_percent_min"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="input"
            />
            <p class="mt-1 text-xs text-gray-500">
              SLA低于此值时显示为红色（默认：99.5%）
            </p>
          </div>

          <div>
            <label class="input-label">TTFT P99最大值（毫秒）</label>
            <input
              v-model.number="metricThresholds.ttft_p99_ms_max"
              type="number"
              min="0"
              step="50"
              class="input"
            />
            <p class="mt-1 text-xs text-gray-500">
              TTFT P99高于此值时显示为红色（默认：500ms）
            </p>
          </div>

          <div>
            <label class="input-label">请求错误率最大值（%）</label>
            <input
              v-model.number="metricThresholds.request_error_rate_percent_max"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="input"
            />
            <p class="mt-1 text-xs text-gray-500">
              请求错误率高于此值时显示为红色（默认：5%）
            </p>
          </div>

          <div>
            <label class="input-label">上游错误率最大值（%）</label>
            <input
              v-model.number="metricThresholds.upstream_error_rate_percent_max"
              type="number"
              min="0"
              max="100"
              step="0.1"
              class="input"
            />
            <p class="mt-1 text-xs text-gray-500">
              上游错误率高于此值时显示为红色（默认：5%）
            </p>
          </div>
        </div>
      </div>

      <!-- 高级设置 -->
      <details class="rounded-2xl bg-gray-50 dark:bg-dark-700/50">
        <summary
          class="cursor-pointer p-4 text-sm font-semibold text-gray-900 dark:text-white"
        >
          高级设置
        </summary>
        <div class="space-y-4 px-4 pb-4">
          <!-- 数据保留策略 -->
          <div class="space-y-3">
            <h5 class="text-xs font-semibold text-gray-700 dark:text-gray-300">
              数据保留策略
            </h5>

            <div class="flex items-center justify-between">
              <label
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >启用数据清理</label
              >
              <Toggle
                v-model="advancedSettings.data_retention.cleanup_enabled"
              />
            </div>

            <div v-if="advancedSettings.data_retention.cleanup_enabled">
              <label class="input-label">清理计划（Cron）</label>
              <input
                v-model="advancedSettings.data_retention.cleanup_schedule"
                type="text"
                class="input"
                placeholder="0 2 * * *"
              />
              <p class="mt-1 text-xs text-gray-500">
                例如：0 2 * * * 表示每天凌晨2点
              </p>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label class="input-label">错误日志保留天数</label>
                <input
                  v-model.number="
                    advancedSettings.data_retention.error_log_retention_days
                  "
                  type="number"
                  min="1"
                  max="365"
                  class="input"
                />
              </div>
              <div>
                <label class="input-label">分钟指标保留天数</label>
                <input
                  v-model.number="
                    advancedSettings.data_retention
                      .minute_metrics_retention_days
                  "
                  type="number"
                  min="1"
                  max="365"
                  class="input"
                />
              </div>
              <div>
                <label class="input-label">小时指标保留天数</label>
                <input
                  v-model.number="
                    advancedSettings.data_retention
                      .hourly_metrics_retention_days
                  "
                  type="number"
                  min="1"
                  max="365"
                  class="input"
                />
              </div>
            </div>
            <p class="text-xs text-gray-500">
              建议保留7-90天，过长会占用存储空间
            </p>
          </div>

          <!-- 预聚合任务 -->
          <div class="space-y-3">
            <h5 class="text-xs font-semibold text-gray-700 dark:text-gray-300">
              预聚合任务
            </h5>

            <div class="flex items-center justify-between">
              <div>
                <label
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >启用预聚合任务</label
                >
                <p class="mt-1 text-xs text-gray-500">
                  预聚合可提升长时间窗口查询性能
                </p>
              </div>
              <Toggle
                v-model="advancedSettings.aggregation.aggregation_enabled"
              />
            </div>
          </div>

          <!-- Error Filtering -->
          <div class="space-y-3">
            <h5 class="text-xs font-semibold text-gray-700 dark:text-gray-300">
              错误过滤
            </h5>

            <div class="flex items-center justify-between">
              <div>
                <label
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >忽略 count_tokens 错误</label
                >
                <p class="mt-1 text-xs text-gray-500">
                  启用后，count_tokens 请求的错误将不会写入错误日志。
                </p>
              </div>
              <Toggle v-model="advancedSettings.ignore_count_tokens_errors" />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >忽略客户端断连错误</label
                >
                <p class="mt-1 text-xs text-gray-500">
                  {{
                    "启用后，客户端主动断开连接（context canceled）的错误将不会写入错误日志。"
                  }}
                </p>
              </div>
              <Toggle v-model="advancedSettings.ignore_context_canceled" />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <label
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >忽略无可用账号错误</label
                >
                <p class="mt-1 text-xs text-gray-500">
                  {{
                    "启用后，“No available accounts” 错误将不会写入错误日志（不推荐，这通常是配置问题）。"
                  }}
                </p>
              </div>
              <Toggle v-model="advancedSettings.ignore_no_available_accounts" />
            </div>
          </div>

          <!-- Auto Refresh -->
          <div class="space-y-3">
            <h5 class="text-xs font-semibold text-gray-700 dark:text-gray-300">
              自动刷新
            </h5>

            <div class="flex items-center justify-between">
              <div>
                <label
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >启用自动刷新</label
                >
                <p class="mt-1 text-xs text-gray-500">
                  自动刷新仪表板数据，启用后会定期拉取最新数据。
                </p>
              </div>
              <Toggle v-model="advancedSettings.auto_refresh_enabled" />
            </div>

            <div v-if="advancedSettings.auto_refresh_enabled">
              <label class="input-label">刷新间隔</label>
              <Select
                v-model="advancedSettings.auto_refresh_interval_seconds"
                :options="[
                  { value: 15, label: '15 秒' },
                  { value: 30, label: '30 秒' },
                  { value: 60, label: '60 秒' },
                ]"
              />
            </div>
          </div>
        </div>
      </details>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <button class="btn btn-secondary" @click="emit('close')">取消</button>
        <button
          class="btn btn-primary"
          :disabled="saving || !validation.valid"
          @click="saveAllSettings"
        >
          {{ saving ? "保存中..." : "保存" }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>
