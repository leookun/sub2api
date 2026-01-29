<template>
  <BaseDialog
    :show="show"
    :title="'批量编辑账号'"
    width="wide"
    @close="handleClose"
  >
    <form
      id="bulk-edit-account-form"
      class="space-y-5"
      @submit.prevent="handleSubmit"
    >
      <!-- Info -->
      <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <p class="text-sm text-blue-700 dark:text-blue-400">
          <svg
            class="mr-1.5 inline h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {{
            `已选择 ${accountIds.length} 个账号。只更新您勾选或填写的字段，未勾选的字段保持不变。`
          }}
        </p>
      </div>

      <!-- Base URL (API Key only) -->
      <div class="border-t border-gray-200 pt-4 dark:border-dark-600">
        <div class="mb-3 flex items-center justify-between">
          <label
            id="bulk-edit-base-url-label"
            class="input-label mb-0"
            for="bulk-edit-base-url-enabled"
          >
            Base URL
          </label>
          <input
            id="bulk-edit-base-url-enabled"
            v-model="enableBaseUrl"
            type="checkbox"
            aria-controls="bulk-edit-base-url"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
        <input
          id="bulk-edit-base-url"
          v-model="baseUrl"
          type="text"
          :disabled="!enableBaseUrl"
          class="input"
          :class="!enableBaseUrl && 'cursor-not-allowed opacity-50'"
          :placeholder="'https://api.anthropic.com 或 https://api.openai.com'"
          aria-labelledby="bulk-edit-base-url-label"
        />
        <p class="input-hint">仅适用于 API Key 账号，留空则不修改</p>
      </div>

      <!-- Model restriction -->
      <div class="border-t border-gray-200 pt-4 dark:border-dark-600">
        <div class="mb-3 flex items-center justify-between">
          <label
            id="bulk-edit-model-restriction-label"
            class="input-label mb-0"
            for="bulk-edit-model-restriction-enabled"
          >
            模型限制（可选）
          </label>
          <input
            id="bulk-edit-model-restriction-enabled"
            v-model="enableModelRestriction"
            type="checkbox"
            aria-controls="bulk-edit-model-restriction-body"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>

        <div
          id="bulk-edit-model-restriction-body"
          :class="!enableModelRestriction && 'pointer-events-none opacity-50'"
          role="group"
          aria-labelledby="bulk-edit-model-restriction-label"
        >
          <!-- Mode Toggle -->
          <div class="mb-4 flex gap-2">
            <button
              type="button"
              :class="[
                'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                modelRestrictionMode === 'whitelist'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-600 dark:text-gray-400 dark:hover:bg-dark-500',
              ]"
              @click="modelRestrictionMode = 'whitelist'"
            >
              <svg
                class="mr-1.5 inline h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              模型白名单
            </button>
            <button
              type="button"
              :class="[
                'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                modelRestrictionMode === 'mapping'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-600 dark:text-gray-400 dark:hover:bg-dark-500',
              ]"
              @click="modelRestrictionMode = 'mapping'"
            >
              <svg
                class="mr-1.5 inline h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              模型映射
            </button>
          </div>

          <!-- Whitelist Mode -->
          <div v-if="modelRestrictionMode === 'whitelist'">
            <div class="mb-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p class="text-xs text-blue-700 dark:text-blue-400">
                <svg
                  class="mr-1 inline h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                选择允许的模型。留空则支持所有模型。
              </p>
            </div>

            <!-- Model Checkbox List -->
            <div class="mb-3 grid grid-cols-2 gap-2">
              <label
                v-for="model in allModels"
                :key="model.value"
                class="flex cursor-pointer items-center rounded-lg border p-3 transition-all hover:bg-gray-50 dark:border-dark-600 dark:hover:bg-dark-700"
                :class="
                  allowedModels.includes(model.value)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200'
                "
              >
                <input
                  v-model="allowedModels"
                  type="checkbox"
                  :value="model.value"
                  class="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{
                  model.label
                }}</span>
              </label>
            </div>

            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ `已选择 ${allowedModels.length} 个模型` }}
              <span v-if="allowedModels.length === 0">{{
                "（支持所有模型）"
              }}</span>
            </p>
          </div>

          <!-- Mapping Mode -->
          <div v-else>
            <div class="mb-3 rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
              <p class="text-xs text-purple-700 dark:text-purple-400">
                <svg
                  class="mr-1 inline h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {{
                  "将请求模型映射到实际模型。左边是请求的模型，右边是发送到 API 的实际模型。"
                }}
              </p>
            </div>

            <!-- Model Mapping List -->
            <div v-if="modelMappings.length > 0" class="mb-3 space-y-2">
              <div
                v-for="(mapping, index) in modelMappings"
                :key="index"
                class="flex items-center gap-2"
              >
                <input
                  v-model="mapping.from"
                  type="text"
                  class="input flex-1"
                  :placeholder="'请求模型'"
                />
                <svg
                  class="h-4 w-4 flex-shrink-0 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
                <input
                  v-model="mapping.to"
                  type="text"
                  class="input flex-1"
                  :placeholder="'实际模型'"
                />
                <button
                  type="button"
                  class="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  @click="removeModelMapping(index)"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="button"
              class="mb-3 w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-700 dark:border-dark-500 dark:text-gray-400 dark:hover:border-dark-400 dark:hover:text-gray-300"
              @click="addModelMapping"
            >
              <svg
                class="mr-1 inline h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              添加映射
            </button>

            <!-- Quick Add Buttons -->
            <div class="flex flex-wrap gap-2">
              <button
                v-for="preset in presetMappings"
                :key="preset.label"
                type="button"
                :class="[
                  'rounded-lg px-3 py-1 text-xs transition-colors',
                  preset.color,
                ]"
                @click="addPresetMapping(preset.from, preset.to)"
              >
                + {{ preset.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Custom error codes -->
      <div class="border-t border-gray-200 pt-4 dark:border-dark-600">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <label
              id="bulk-edit-custom-error-codes-label"
              class="input-label mb-0"
              for="bulk-edit-custom-error-codes-enabled"
            >
              自定义错误码
            </label>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              仅对选中的错误码停止调度
            </p>
          </div>
          <input
            id="bulk-edit-custom-error-codes-enabled"
            v-model="enableCustomErrorCodes"
            type="checkbox"
            aria-controls="bulk-edit-custom-error-codes-body"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>

        <div
          v-if="enableCustomErrorCodes"
          id="bulk-edit-custom-error-codes-body"
          class="space-y-3"
        >
          <div class="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
            <p class="text-xs text-amber-700 dark:text-amber-400">
              <Icon
                name="exclamationTriangle"
                size="sm"
                class="mr-1 inline"
                :stroke-width="2"
              />
              仅选中的错误码会停止调度，其他错误将返回 500。
            </p>
          </div>

          <!-- Error Code Buttons -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="code in commonErrorCodes"
              :key="code.value"
              type="button"
              :class="[
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                selectedErrorCodes.includes(code.value)
                  ? 'bg-red-100 text-red-700 ring-1 ring-red-500 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-600 dark:text-gray-400 dark:hover:bg-dark-500',
              ]"
              @click="toggleErrorCode(code.value)"
            >
              {{ code.value }} {{ code.label }}
            </button>
          </div>

          <!-- Manual input -->
          <div class="flex items-center gap-2">
            <input
              id="bulk-edit-custom-error-code-input"
              v-model="customErrorCodeInput"
              type="number"
              min="100"
              max="599"
              class="input flex-1"
              :placeholder="'输入错误码 (100-599)'"
              aria-labelledby="bulk-edit-custom-error-codes-label"
              @keyup.enter="addCustomErrorCode"
            />
            <button
              type="button"
              class="btn btn-secondary px-3"
              @click="addCustomErrorCode"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          <!-- Selected codes summary -->
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="code in selectedErrorCodes.sort((a, b) => a - b)"
              :key="code"
              class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
            >
              {{ code }}
              <button
                type="button"
                class="hover:text-red-900 dark:hover:text-red-300"
                @click="removeErrorCode(code)"
              >
                <Icon
                  name="x"
                  size="xs"
                  class="h-3.5 w-3.5"
                  :stroke-width="2"
                />
              </button>
            </span>
            <span
              v-if="selectedErrorCodes.length === 0"
              class="text-xs text-gray-400"
            >
              未选择（使用默认策略）
            </span>
          </div>
        </div>
      </div>

      <!-- Intercept warmup requests (Anthropic only) -->
      <div class="border-t border-gray-200 pt-4 dark:border-dark-600">
        <div class="flex items-center justify-between">
          <div class="flex-1 pr-4">
            <label
              id="bulk-edit-intercept-warmup-label"
              class="input-label mb-0"
              for="bulk-edit-intercept-warmup-enabled"
            >
              拦截预热请求
            </label>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{
                "启用后，标题生成等预热请求将返回 mock 响应，不消耗上游 token"
              }}
            </p>
          </div>
          <input
            id="bulk-edit-intercept-warmup-enabled"
            v-model="enableInterceptWarmup"
            type="checkbox"
            aria-controls="bulk-edit-intercept-warmup-body"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
        <div
          v-if="enableInterceptWarmup"
          id="bulk-edit-intercept-warmup-body"
          class="mt-3"
        >
          <button
            type="button"
            :class="[
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              interceptWarmupRequests
                ? 'bg-primary-600'
                : 'bg-gray-200 dark:bg-dark-600',
            ]"
            @click="interceptWarmupRequests = !interceptWarmupRequests"
          >
            <span
              :class="[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                interceptWarmupRequests ? 'translate-x-5' : 'translate-x-0',
              ]"
            />
          </button>
        </div>
      </div>

      <!-- Proxy -->
      <div class="border-t border-gray-200 pt-4 dark:border-dark-600">
        <div class="mb-3 flex items-center justify-between">
          <label
            id="bulk-edit-proxy-label"
            class="input-label mb-0"
            for="bulk-edit-proxy-enabled"
          >
            代理
          </label>
          <input
            id="bulk-edit-proxy-enabled"
            v-model="enableProxy"
            type="checkbox"
            aria-controls="bulk-edit-proxy-body"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
        <div
          id="bulk-edit-proxy-body"
          :class="!enableProxy && 'pointer-events-none opacity-50'"
        >
          <ProxySelector
            v-model="proxyId"
            :proxies="proxies"
            aria-labelledby="bulk-edit-proxy-label"
          />
        </div>
      </div>

      <!-- Concurrency & Priority -->
      <div
        class="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 dark:border-dark-600 lg:grid-cols-3"
      >
        <div>
          <div class="mb-3 flex items-center justify-between">
            <label
              id="bulk-edit-concurrency-label"
              class="input-label mb-0"
              for="bulk-edit-concurrency-enabled"
            >
              并发数
            </label>
            <input
              id="bulk-edit-concurrency-enabled"
              v-model="enableConcurrency"
              type="checkbox"
              aria-controls="bulk-edit-concurrency"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </div>
          <input
            id="bulk-edit-concurrency"
            v-model.number="concurrency"
            type="number"
            min="1"
            :disabled="!enableConcurrency"
            class="input"
            :class="!enableConcurrency && 'cursor-not-allowed opacity-50'"
            aria-labelledby="bulk-edit-concurrency-label"
          />
        </div>
        <div>
          <div class="mb-3 flex items-center justify-between">
            <label
              id="bulk-edit-priority-label"
              class="input-label mb-0"
              for="bulk-edit-priority-enabled"
            >
              优先级
            </label>
            <input
              id="bulk-edit-priority-enabled"
              v-model="enablePriority"
              type="checkbox"
              aria-controls="bulk-edit-priority"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </div>
          <input
            id="bulk-edit-priority"
            v-model.number="priority"
            type="number"
            min="1"
            :disabled="!enablePriority"
            class="input"
            :class="!enablePriority && 'cursor-not-allowed opacity-50'"
            aria-labelledby="bulk-edit-priority-label"
          />
        </div>
        <div>
          <div class="mb-3 flex items-center justify-between">
            <label
              id="bulk-edit-rate-multiplier-label"
              class="input-label mb-0"
              for="bulk-edit-rate-multiplier-enabled"
            >
              账号计费倍率
            </label>
            <input
              id="bulk-edit-rate-multiplier-enabled"
              v-model="enableRateMultiplier"
              type="checkbox"
              aria-controls="bulk-edit-rate-multiplier"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
          </div>
          <input
            id="bulk-edit-rate-multiplier"
            v-model.number="rateMultiplier"
            type="number"
            min="0"
            step="0.01"
            :disabled="!enableRateMultiplier"
            class="input"
            :class="!enableRateMultiplier && 'cursor-not-allowed opacity-50'"
            aria-labelledby="bulk-edit-rate-multiplier-label"
          />
          <p class="input-hint">
            >=0，0 表示该账号计费为 0；仅影响账号计费口径
          </p>
        </div>
      </div>

      <!-- Status -->
      <div class="border-t border-gray-200 pt-4 dark:border-dark-600">
        <div class="mb-3 flex items-center justify-between">
          <label
            id="bulk-edit-status-label"
            class="input-label mb-0"
            for="bulk-edit-status-enabled"
          >
            状态
          </label>
          <input
            id="bulk-edit-status-enabled"
            v-model="enableStatus"
            type="checkbox"
            aria-controls="bulk-edit-status"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
        <div
          id="bulk-edit-status"
          :class="!enableStatus && 'pointer-events-none opacity-50'"
        >
          <Select
            v-model="status"
            :options="statusOptions"
            aria-labelledby="bulk-edit-status-label"
          />
        </div>
      </div>

      <!-- Groups -->
      <div class="border-t border-gray-200 pt-4 dark:border-dark-600">
        <div class="mb-3 flex items-center justify-between">
          <label
            id="bulk-edit-groups-label"
            class="input-label mb-0"
            for="bulk-edit-groups-enabled"
          >
            分组管理
          </label>
          <input
            id="bulk-edit-groups-enabled"
            v-model="enableGroups"
            type="checkbox"
            aria-controls="bulk-edit-groups"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        </div>
        <div
          id="bulk-edit-groups"
          :class="!enableGroups && 'pointer-events-none opacity-50'"
        >
          <GroupSelector
            v-model="groupIds"
            :groups="groups"
            aria-labelledby="bulk-edit-groups-label"
          />
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button type="button" class="btn btn-secondary" @click="handleClose">
          取消
        </button>
        <button
          type="submit"
          form="bulk-edit-account-form"
          :disabled="submitting"
          class="btn btn-primary"
        >
          <svg
            v-if="submitting"
            class="-ml-1 mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {{ submitting ? "更新中..." : "批量更新" }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useAppStore } from "@/stores/app";
import { adminAPI } from "@/api/admin";
import type { Proxy, AdminGroup } from "@/types";

interface Props {
  show: boolean;
  accountIds: number[];
  proxies: Proxy[];
  groups: AdminGroup[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const appStore = useAppStore();

// Model mapping type
interface ModelMapping {
  from: string;
  to: string;
}

// State - field enable flags
const enableBaseUrl = ref(false);
const enableModelRestriction = ref(false);
const enableCustomErrorCodes = ref(false);
const enableInterceptWarmup = ref(false);
const enableProxy = ref(false);
const enableConcurrency = ref(false);
const enablePriority = ref(false);
const enableRateMultiplier = ref(false);
const enableStatus = ref(false);
const enableGroups = ref(false);

// State - field values
const submitting = ref(false);
const baseUrl = ref("");
const modelRestrictionMode = ref<"whitelist" | "mapping">("whitelist");
const allowedModels = ref<string[]>([]);
const modelMappings = ref<ModelMapping[]>([]);
const selectedErrorCodes = ref<number[]>([]);
const customErrorCodeInput = ref<number | null>(null);
const interceptWarmupRequests = ref(false);
const proxyId = ref<number | null>(null);
const concurrency = ref(1);
const priority = ref(1);
const rateMultiplier = ref(1);
const status = ref<"active" | "inactive">("active");
const groupIds = ref<number[]>([]);

// All models list (combined Anthropic + OpenAI)
const allModels = [
  { value: "claude-opus-4-5-20251101", label: "Claude Opus 4.5" },
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
  { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
  { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  { value: "claude-3-opus-20240229", label: "Claude 3 Opus" },
  { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
  { value: "gpt-5.2-2025-12-11", label: "GPT-5.2" },
  { value: "gpt-5.2-codex", label: "GPT-5.2 Codex" },
  { value: "gpt-5.1-codex-max", label: "GPT-5.1 Codex Max" },
  { value: "gpt-5.1-codex", label: "GPT-5.1 Codex" },
  { value: "gpt-5.1-2025-11-13", label: "GPT-5.1" },
  { value: "gpt-5.1-codex-mini", label: "GPT-5.1 Codex Mini" },
  { value: "gpt-5-2025-08-07", label: "GPT-5" },
];

// Preset mappings (combined Anthropic + OpenAI)
const presetMappings = [
  {
    label: "Sonnet 4",
    from: "claude-sonnet-4-20250514",
    to: "claude-sonnet-4-20250514",
    color:
      "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    label: "Sonnet 4.5",
    from: "claude-sonnet-4-5-20250929",
    to: "claude-sonnet-4-5-20250929",
    color:
      "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  {
    label: "Opus 4.5",
    from: "claude-opus-4-5-20251101",
    to: "claude-opus-4-5-20251101",
    color:
      "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    label: "Opus->Sonnet",
    from: "claude-opus-4-5-20251101",
    to: "claude-sonnet-4-5-20250929",
    color:
      "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    label: "GPT-5.2",
    from: "gpt-5.2-2025-12-11",
    to: "gpt-5.2-2025-12-11",
    color:
      "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    label: "GPT-5.2 Codex",
    from: "gpt-5.2-codex",
    to: "gpt-5.2-codex",
    color:
      "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    label: "Max->Codex",
    from: "gpt-5.1-codex-max",
    to: "gpt-5.1-codex",
    color:
      "bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400",
  },
];

// Common HTTP error codes
const commonErrorCodes = [
  { value: 401, label: "Unauthorized" },
  { value: 403, label: "Forbidden" },
  { value: 429, label: "Rate Limit" },
  { value: 500, label: "Server Error" },
  { value: 502, label: "Bad Gateway" },
  { value: 503, label: "Unavailable" },
  { value: 529, label: "Overloaded" },
];

const statusOptions = computed(() => [
  { value: "active", label: "启用" },
  { value: "inactive", label: "禁用" },
]);

// Model mapping helpers
const addModelMapping = () => {
  modelMappings.value.push({ from: "", to: "" });
};

const removeModelMapping = (index: number) => {
  modelMappings.value.splice(index, 1);
};

const addPresetMapping = (from: string, to: string) => {
  const exists = modelMappings.value.some((m) => m.from === from);
  if (exists) {
    appStore.showInfo(`模型 ${from} 的映射已存在`);
    return;
  }
  modelMappings.value.push({ from, to });
};

// Error code helpers
const toggleErrorCode = (code: number) => {
  const index = selectedErrorCodes.value.indexOf(code);
  if (index === -1) {
    // Adding code - check for 429/529 warning
    if (code === 429) {
      if (
        !confirm(
          "429 已有内置的限流处理机制。添加到自定义错误码后，将直接停止调度而非临时限流。确定要添加吗？",
        )
      ) {
        return;
      }
    } else if (code === 529) {
      if (
        !confirm(
          "529 已有内置的过载处理机制。添加到自定义错误码后，将直接停止调度而非临时标记过载。确定要添加吗？",
        )
      ) {
        return;
      }
    }
    selectedErrorCodes.value.push(code);
  } else {
    selectedErrorCodes.value.splice(index, 1);
  }
};

const addCustomErrorCode = () => {
  const code = customErrorCodeInput.value;
  if (code === null || code < 100 || code > 599) {
    appStore.showError("请输入有效的 HTTP 错误码 (100-599)");
    return;
  }
  if (selectedErrorCodes.value.includes(code)) {
    appStore.showInfo("该错误码已被选中");
    return;
  }
  // Check for 429/529 warning
  if (code === 429) {
    if (
      !confirm(
        "429 已有内置的限流处理机制。添加到自定义错误码后，将直接停止调度而非临时限流。确定要添加吗？",
      )
    ) {
      return;
    }
  } else if (code === 529) {
    if (
      !confirm(
        "529 已有内置的过载处理机制。添加到自定义错误码后，将直接停止调度而非临时标记过载。确定要添加吗？",
      )
    ) {
      return;
    }
  }
  selectedErrorCodes.value.push(code);
  customErrorCodeInput.value = null;
};

const removeErrorCode = (code: number) => {
  const index = selectedErrorCodes.value.indexOf(code);
  if (index !== -1) {
    selectedErrorCodes.value.splice(index, 1);
  }
};

const buildModelMappingObject = (): Record<string, string> | null => {
  const mapping: Record<string, string> = {};

  if (modelRestrictionMode.value === "whitelist") {
    for (const model of allowedModels.value) {
      mapping[model] = model;
    }
  } else {
    for (const m of modelMappings.value) {
      const from = m.from.trim();
      const to = m.to.trim();
      if (from && to) {
        mapping[from] = to;
      }
    }
  }

  return Object.keys(mapping).length > 0 ? mapping : null;
};

const buildUpdatePayload = (): Record<string, unknown> | null => {
  const updates: Record<string, unknown> = {};
  const credentials: Record<string, unknown> = {};
  let credentialsChanged = false;

  if (enableProxy.value) {
    // 后端期望 proxy_id: 0 表示清除代理，而不是 null
    updates.proxy_id = proxyId.value === null ? 0 : proxyId.value;
  }

  if (enableConcurrency.value) {
    updates.concurrency = concurrency.value;
  }

  if (enablePriority.value) {
    updates.priority = priority.value;
  }

  if (enableRateMultiplier.value) {
    updates.rate_multiplier = rateMultiplier.value;
  }

  if (enableStatus.value) {
    updates.status = status.value;
  }

  if (enableGroups.value) {
    updates.group_ids = groupIds.value;
  }

  if (enableBaseUrl.value) {
    const baseUrlValue = baseUrl.value.trim();
    if (baseUrlValue) {
      credentials.base_url = baseUrlValue;
      credentialsChanged = true;
    }
  }

  if (enableModelRestriction.value) {
    const modelMapping = buildModelMappingObject();
    if (modelMapping) {
      credentials.model_mapping = modelMapping;
      credentialsChanged = true;
    }
  }

  if (enableCustomErrorCodes.value) {
    credentials.custom_error_codes_enabled = true;
    credentials.custom_error_codes = [...selectedErrorCodes.value];
    credentialsChanged = true;
  }

  if (enableInterceptWarmup.value) {
    credentials.intercept_warmup_requests = interceptWarmupRequests.value;
    credentialsChanged = true;
  }

  if (credentialsChanged) {
    updates.credentials = credentials;
  }

  return Object.keys(updates).length > 0 ? updates : null;
};

const handleClose = () => {
  emit("close");
};

const handleSubmit = async () => {
  if (props.accountIds.length === 0) {
    appStore.showError("请选择要编辑的账号");
    return;
  }

  const hasAnyFieldEnabled =
    enableBaseUrl.value ||
    enableModelRestriction.value ||
    enableCustomErrorCodes.value ||
    enableInterceptWarmup.value ||
    enableProxy.value ||
    enableConcurrency.value ||
    enablePriority.value ||
    enableRateMultiplier.value ||
    enableStatus.value ||
    enableGroups.value;

  if (!hasAnyFieldEnabled) {
    appStore.showError("请至少选择一个要更新的字段");
    return;
  }

  const updates = buildUpdatePayload();
  if (!updates) {
    appStore.showError("请至少选择一个要更新的字段");
    return;
  }

  submitting.value = true;

  try {
    const res = await adminAPI.accounts.bulkUpdate(props.accountIds, updates);
    const success = res.success || 0;
    const failed = res.failed || 0;

    if (success > 0 && failed === 0) {
      appStore.showSuccess(`成功更新 ${success} 个账号`);
    } else if (success > 0) {
      appStore.showError(`部分更新成功：成功 {success} 个，失败 {failed} 个`);
    } else {
      appStore.showError("批量更新失败");
    }

    if (success > 0) {
      emit("updated");
      handleClose();
    }
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || "批量更新失败");
    console.error("Error bulk updating accounts:", error);
  } finally {
    submitting.value = false;
  }
};

// Reset form when modal closes
watch(
  () => props.show,
  (newShow) => {
    if (!newShow) {
      // Reset all enable flags
      enableBaseUrl.value = false;
      enableModelRestriction.value = false;
      enableCustomErrorCodes.value = false;
      enableInterceptWarmup.value = false;
      enableProxy.value = false;
      enableConcurrency.value = false;
      enablePriority.value = false;
      enableRateMultiplier.value = false;
      enableStatus.value = false;
      enableGroups.value = false;

      // Reset all values
      baseUrl.value = "";
      modelRestrictionMode.value = "whitelist";
      allowedModels.value = [];
      modelMappings.value = [];
      selectedErrorCodes.value = [];
      customErrorCodeInput.value = null;
      interceptWarmupRequests.value = false;
      proxyId.value = null;
      concurrency.value = 1;
      priority.value = 1;
      rateMultiplier.value = 1;
      status.value = "active";
      groupIds.value = [];
    }
  },
);
</script>
