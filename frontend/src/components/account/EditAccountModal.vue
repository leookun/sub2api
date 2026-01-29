<template>
  <BaseDialog
    :show="show"
    :title="'编辑账号'"
    width="normal"
    @close="handleClose"
  >
    <form
      v-if="account"
      id="edit-account-form"
      class="space-y-5"
      @submit.prevent="handleSubmit"
    >
      <div>
        <label class="input-label">名称</label>
        <input
          v-model="form.name"
          type="text"
          required
          class="input"
          data-tour="edit-account-form-name"
        />
      </div>
      <div>
        <label class="input-label">备注</label>
        <textarea
          v-model="form.notes"
          rows="3"
          class="input"
          :placeholder="'请输入备注'"
        ></textarea>
        <p class="input-hint">备注可选</p>
      </div>

      <!-- API Key fields (only for apikey type) -->
      <div v-if="account.type === 'apikey'" class="space-y-4">
        <div>
          <label class="input-label">Base URL</label>
          <input
            v-model="editBaseUrl"
            type="text"
            class="input"
            :placeholder="
              account.platform === 'openai'
                ? 'https://api.openai.com'
                : account.platform === 'gemini'
                  ? 'https://generativelanguage.googleapis.com'
                  : 'https://api.anthropic.com'
            "
          />
          <p class="input-hint">{{ baseUrlHint }}</p>
        </div>
        <div>
          <label class="input-label">API Key</label>
          <input
            v-model="editApiKey"
            type="password"
            class="input font-mono"
            :placeholder="
              account.platform === 'openai'
                ? 'sk-proj-...'
                : account.platform === 'gemini'
                  ? 'AIza...'
                  : 'sk-ant-...'
            "
          />
          <p class="input-hint">留空以保持当前密钥</p>
        </div>

        <!-- Model Restriction Section (不适用于 Gemini) -->
        <div
          v-if="account.platform !== 'gemini'"
          class="border-t border-gray-200 pt-4 dark:border-dark-600"
        >
          <label class="input-label">模型限制（可选）</label>

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
            <ModelWhitelistSelector
              v-model="allowedModels"
              :platform="account?.platform || 'anthropic'"
            />
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

        <!-- Custom Error Codes Section -->
        <div class="border-t border-gray-200 pt-4 dark:border-dark-600">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <label class="input-label mb-0">自定义错误码</label>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                仅对选中的错误码停止调度
              </p>
            </div>
            <button
              type="button"
              :class="[
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                customErrorCodesEnabled
                  ? 'bg-primary-600'
                  : 'bg-gray-200 dark:bg-dark-600',
              ]"
              @click="customErrorCodesEnabled = !customErrorCodesEnabled"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  customErrorCodesEnabled ? 'translate-x-5' : 'translate-x-0',
                ]"
              />
            </button>
          </div>

          <div v-if="customErrorCodesEnabled" class="space-y-3">
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
                v-model.number="customErrorCodeInput"
                type="number"
                min="100"
                max="599"
                class="input flex-1"
                :placeholder="'输入错误码 (100-599)'"
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
                  <Icon name="x" size="sm" :stroke-width="2" />
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

        <!-- Gemini 模型说明 -->
        <div
          v-if="account.platform === 'gemini'"
          class="border-t border-gray-200 pt-4 dark:border-dark-600"
        >
          <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <div class="flex items-start gap-3">
              <svg
                class="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
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
              <div>
                <p class="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Gemini 直接转发模型
                </p>
                <p class="mt-1 text-xs text-blue-700 dark:text-blue-400">
                  {{
                    "所有模型请求将直接转发至 Gemini API，不进行模型限制或映射。"
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Temp Unschedulable Rules -->
      <div class="border-t border-gray-200 pt-4 dark:border-dark-600 space-y-4">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <label class="input-label mb-0">临时不可调度</label>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              当错误码与关键词同时匹配时，账号会在指定时间内被临时禁用。
            </p>
          </div>
          <button
            type="button"
            :class="[
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              tempUnschedEnabled
                ? 'bg-primary-600'
                : 'bg-gray-200 dark:bg-dark-600',
            ]"
            @click="tempUnschedEnabled = !tempUnschedEnabled"
          >
            <span
              :class="[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                tempUnschedEnabled ? 'translate-x-5' : 'translate-x-0',
              ]"
            />
          </button>
        </div>

        <div v-if="tempUnschedEnabled" class="space-y-3">
          <div class="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <p class="text-xs text-blue-700 dark:text-blue-400">
              <Icon
                name="exclamationTriangle"
                size="sm"
                class="mr-1 inline"
                :stroke-width="2"
              />
              规则按顺序匹配，需同时满足错误码与关键词。
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button
              v-for="preset in tempUnschedPresets"
              :key="preset.label"
              type="button"
              class="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200 dark:bg-dark-600 dark:text-gray-300 dark:hover:bg-dark-500"
              @click="addTempUnschedRule(preset.rule)"
            >
              + {{ preset.label }}
            </button>
          </div>

          <div v-if="tempUnschedRules.length > 0" class="space-y-3">
            <div
              v-for="(rule, index) in tempUnschedRules"
              :key="index"
              class="rounded-lg border border-gray-200 p-3 dark:border-dark-600"
            >
              <div class="mb-2 flex items-center justify-between">
                <span
                  class="text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  {{ `规则 #${index + 1}` }}
                </span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    :disabled="index === 0"
                    class="rounded p-1 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-gray-200"
                    @click="moveTempUnschedRule(index, -1)"
                  >
                    <Icon name="chevronUp" size="sm" :stroke-width="2" />
                  </button>
                  <button
                    type="button"
                    :disabled="index === tempUnschedRules.length - 1"
                    class="rounded p-1 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-gray-200"
                    @click="moveTempUnschedRule(index, 1)"
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="rounded p-1 text-red-500 transition-colors hover:text-red-600"
                    @click="removeTempUnschedRule(index)"
                  >
                    <Icon name="x" size="sm" :stroke-width="2" />
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label class="input-label">错误码</label>
                  <input
                    v-model.number="rule.error_code"
                    type="number"
                    min="100"
                    max="599"
                    class="input"
                    :placeholder="'例如 429'"
                  />
                </div>
                <div>
                  <label class="input-label">持续时间（分钟）</label>
                  <input
                    v-model.number="rule.duration_minutes"
                    type="number"
                    min="1"
                    class="input"
                    :placeholder="'例如 30'"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label class="input-label">关键词</label>
                  <input
                    v-model="rule.keywords"
                    type="text"
                    class="input"
                    :placeholder="'例如 overloaded, too many requests'"
                  />
                  <p class="input-hint">
                    多个关键词用逗号分隔，匹配时必须命中其中之一。
                  </p>
                </div>
                <div class="sm:col-span-2">
                  <label class="input-label">描述</label>
                  <input
                    v-model="rule.description"
                    type="text"
                    class="input"
                    :placeholder="'可选，便于记忆规则用途'"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-700 dark:border-dark-500 dark:text-gray-400 dark:hover:border-dark-400 dark:hover:text-gray-300"
            @click="addTempUnschedRule()"
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
            添加规则
          </button>
        </div>
      </div>

      <!-- Intercept Warmup Requests (Anthropic only) -->
      <div
        v-if="account?.platform === 'anthropic'"
        class="border-t border-gray-200 pt-4 dark:border-dark-600"
      >
        <div class="flex items-center justify-between">
          <div>
            <label class="input-label mb-0">拦截预热请求</label>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{
                "启用后，标题生成等预热请求将返回 mock 响应，不消耗上游 token"
              }}
            </p>
          </div>
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

      <div>
        <label class="input-label">代理</label>
        <ProxySelector v-model="form.proxy_id" :proxies="proxies" />
      </div>

      <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div>
          <label class="input-label">并发数</label>
          <input
            v-model.number="form.concurrency"
            type="number"
            min="1"
            class="input"
          />
        </div>
        <div>
          <label class="input-label">优先级</label>
          <input
            v-model.number="form.priority"
            type="number"
            min="1"
            class="input"
            data-tour="account-form-priority"
          />
        </div>
        <div>
          <label class="input-label">账号计费倍率</label>
          <input
            v-model.number="form.rate_multiplier"
            type="number"
            min="0"
            step="0.001"
            class="input"
          />
          <p class="input-hint">
            >=0，0 表示该账号计费为 0；仅影响账号计费口径
          </p>
        </div>
      </div>
      <div class="border-t border-gray-200 pt-4 dark:border-dark-600">
        <label class="input-label">过期时间</label>
        <input v-model="expiresAtInput" type="datetime-local" class="input" />
        <p class="input-hint">留空表示不过期</p>
      </div>

      <div>
        <div class="flex items-center justify-between">
          <div>
            <label class="input-label mb-0">过期自动暂停调度</label>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              启用后，账号过期将自动暂停调度
            </p>
          </div>
          <button
            type="button"
            :class="[
              'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              autoPauseOnExpired
                ? 'bg-primary-600'
                : 'bg-gray-200 dark:bg-dark-600',
            ]"
            @click="autoPauseOnExpired = !autoPauseOnExpired"
          >
            <span
              :class="[
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                autoPauseOnExpired ? 'translate-x-5' : 'translate-x-0',
              ]"
            />
          </button>
        </div>
      </div>

      <!-- Quota Control Section (Anthropic OAuth/SetupToken only) -->
      <div
        v-if="
          account?.platform === 'anthropic' &&
          (account?.type === 'oauth' || account?.type === 'setup-token')
        "
        class="border-t border-gray-200 pt-4 dark:border-dark-600 space-y-4"
      >
        <div class="mb-3">
          <h3 class="input-label mb-0 text-base font-semibold">配额控制</h3>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            仅适用于 Anthropic OAuth/Setup Token 账号
          </p>
        </div>

        <!-- Window Cost Limit -->
        <div class="rounded-lg border border-gray-200 p-4 dark:border-dark-600">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <label class="input-label mb-0">5h窗口费用控制</label>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                限制账号在5小时窗口内的费用使用
              </p>
            </div>
            <button
              type="button"
              :class="[
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                windowCostEnabled
                  ? 'bg-primary-600'
                  : 'bg-gray-200 dark:bg-dark-600',
              ]"
              @click="windowCostEnabled = !windowCostEnabled"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  windowCostEnabled ? 'translate-x-5' : 'translate-x-0',
                ]"
              />
            </button>
          </div>

          <div v-if="windowCostEnabled" class="grid grid-cols-2 gap-4">
            <div>
              <label class="input-label">费用阈值</label>
              <div class="relative">
                <span
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                  >$</span
                >
                <input
                  v-model.number="windowCostLimit"
                  type="number"
                  min="0"
                  step="1"
                  class="input pl-7"
                  :placeholder="'50'"
                />
              </div>
              <p class="input-hint">达到阈值后不参与新请求调度</p>
            </div>
            <div>
              <label class="input-label">粘性预留额度</label>
              <div class="relative">
                <span
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                  >$</span
                >
                <input
                  v-model.number="windowCostStickyReserve"
                  type="number"
                  min="0"
                  step="1"
                  class="input pl-7"
                  :placeholder="'10'"
                />
              </div>
              <p class="input-hint">为粘性会话预留的额外额度</p>
            </div>
          </div>
        </div>

        <!-- Session Limit -->
        <div class="rounded-lg border border-gray-200 p-4 dark:border-dark-600">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <label class="input-label mb-0">会话数量控制</label>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                限制同时活跃的会话数量
              </p>
            </div>
            <button
              type="button"
              :class="[
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                sessionLimitEnabled
                  ? 'bg-primary-600'
                  : 'bg-gray-200 dark:bg-dark-600',
              ]"
              @click="sessionLimitEnabled = !sessionLimitEnabled"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  sessionLimitEnabled ? 'translate-x-5' : 'translate-x-0',
                ]"
              />
            </button>
          </div>

          <div v-if="sessionLimitEnabled" class="grid grid-cols-2 gap-4">
            <div>
              <label class="input-label">最大会话数</label>
              <input
                v-model.number="maxSessions"
                type="number"
                min="1"
                step="1"
                class="input"
                :placeholder="'3'"
              />
              <p class="input-hint">同时活跃的最大会话数量</p>
            </div>
            <div>
              <label class="input-label">空闲超时</label>
              <div class="relative">
                <input
                  v-model.number="sessionIdleTimeout"
                  type="number"
                  min="1"
                  step="1"
                  class="input pr-12"
                  :placeholder="'5'"
                />
                <span
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
                  >分钟</span
                >
              </div>
              <p class="input-hint">会话空闲超时后自动释放</p>
            </div>
          </div>
        </div>

        <!-- TLS Fingerprint -->
        <div class="rounded-lg border border-gray-200 p-4 dark:border-dark-600">
          <div class="flex items-center justify-between">
            <div>
              <label class="input-label mb-0">TLS 指纹模拟</label>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                模拟 Node.js/Claude Code 客户端的 TLS 指纹
              </p>
            </div>
            <button
              type="button"
              :class="[
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                tlsFingerprintEnabled
                  ? 'bg-primary-600'
                  : 'bg-gray-200 dark:bg-dark-600',
              ]"
              @click="tlsFingerprintEnabled = !tlsFingerprintEnabled"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  tlsFingerprintEnabled ? 'translate-x-5' : 'translate-x-0',
                ]"
              />
            </button>
          </div>
        </div>

        <!-- Session ID Masking -->
        <div class="rounded-lg border border-gray-200 p-4 dark:border-dark-600">
          <div class="flex items-center justify-between">
            <div>
              <label class="input-label mb-0">会话 ID 伪装</label>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{
                  "启用后将在 15 分钟内固定 metadata.user_id 中的 session ID，使上游认为请求来自同一会话"
                }}
              </p>
            </div>
            <button
              type="button"
              :class="[
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                sessionIdMaskingEnabled
                  ? 'bg-primary-600'
                  : 'bg-gray-200 dark:bg-dark-600',
              ]"
              @click="sessionIdMaskingEnabled = !sessionIdMaskingEnabled"
            >
              <span
                :class="[
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  sessionIdMaskingEnabled ? 'translate-x-5' : 'translate-x-0',
                ]"
              />
            </button>
          </div>
        </div>
      </div>

      <div class="border-t border-gray-200 pt-4 dark:border-dark-600">
        <div>
          <label class="input-label">状态</label>
          <Select v-model="form.status" :options="statusOptions" />
        </div>

        <!-- Mixed Scheduling (only for antigravity accounts, read-only in edit mode) -->
        <div
          v-if="account?.platform === 'antigravity'"
          class="flex items-center gap-2"
        >
          <label class="flex cursor-not-allowed items-center gap-2 opacity-60">
            <input
              v-model="mixedScheduling"
              type="checkbox"
              disabled
              class="h-4 w-4 cursor-not-allowed rounded border-gray-300 text-primary-500 focus:ring-primary-500 dark:border-dark-500"
            />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              在 /v1/messages 中使用
            </span>
          </label>
          <div class="group relative">
            <span
              class="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-200 text-xs text-gray-500 hover:bg-gray-300 dark:bg-dark-600 dark:text-gray-400 dark:hover:bg-dark-500"
            >
              ?
            </span>
            <!-- Tooltip（向下显示避免被弹窗裁剪） -->
            <div
              class="pointer-events-none absolute left-0 top-full z-[100] mt-1.5 w-72 rounded bg-gray-900 px-3 py-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-gray-700"
            >
              {{
                "！！注意！！ Antigravity Claude 和 Anthropic Claude 无法在同个上下文中使用，如果你同时有 Anthropic 账号和 Antigravity 账号，开启此选项会导致经常 400 报错。开启后，请用分组功能做好 Antigravity 账号和 Anthropic 账号的隔离。一定要弄明白再开启！！"
              }}
              <div
                class="absolute bottom-full left-3 border-4 border-transparent border-b-gray-900 dark:border-b-gray-700"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Group Selection - 仅标准模式显示 -->
      <GroupSelector
        v-if="!authStore.isSimpleMode"
        v-model="form.group_ids"
        :groups="groups"
        :platform="account?.platform"
        :mixed-scheduling="mixedScheduling"
        data-tour="account-form-groups"
      />
    </form>

    <template #footer>
      <div v-if="account" class="flex justify-end gap-3">
        <button type="button" class="btn btn-secondary" @click="handleClose">
          取消
        </button>
        <button
          type="submit"
          form="edit-account-form"
          :disabled="submitting"
          class="btn btn-primary"
          data-tour="account-form-submit"
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
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {{ submitting ? "更新中..." : "更新" }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { adminAPI } from "@/api/admin";
import type { Account, Proxy, AdminGroup } from "@/types";
import {
  formatDateTimeLocalInput,
  parseDateTimeLocalInput,
} from "@/utils/format";
import {
  getPresetMappingsByPlatform,
  buildModelMappingObject,
} from "@/composables/useModelWhitelist";

interface Props {
  show: boolean;
  account: Account | null;
  proxies: Proxy[];
  groups: AdminGroup[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const appStore = useAppStore();
const authStore = useAuthStore();

// Platform-specific hint for Base URL
const baseUrlHint = computed(() => {
  if (!props.account) return "留空使用官方 Anthropic API";
  if (props.account.platform === "openai") return "留空使用官方 OpenAI API";
  if (props.account.platform === "gemini") return "留空使用官方 Gemini API";
  return "留空使用官方 Anthropic API";
});

// Model mapping type
interface ModelMapping {
  from: string;
  to: string;
}

interface TempUnschedRuleForm {
  error_code: number | null;
  keywords: string;
  duration_minutes: number | null;
  description: string;
}

// State
const submitting = ref(false);
const editBaseUrl = ref("https://api.anthropic.com");
const editApiKey = ref("");
const modelMappings = ref<ModelMapping[]>([]);
const modelRestrictionMode = ref<"whitelist" | "mapping">("whitelist");
const allowedModels = ref<string[]>([]);
const customErrorCodesEnabled = ref(false);
const selectedErrorCodes = ref<number[]>([]);
const customErrorCodeInput = ref<number | null>(null);
const interceptWarmupRequests = ref(false);
const autoPauseOnExpired = ref(false);
const mixedScheduling = ref(false); // For antigravity accounts: enable mixed scheduling
const tempUnschedEnabled = ref(false);
const tempUnschedRules = ref<TempUnschedRuleForm[]>([]);

// Quota control state (Anthropic OAuth/SetupToken only)
const windowCostEnabled = ref(false);
const windowCostLimit = ref<number | null>(null);
const windowCostStickyReserve = ref<number | null>(null);
const sessionLimitEnabled = ref(false);
const maxSessions = ref<number | null>(null);
const sessionIdleTimeout = ref<number | null>(null);
const tlsFingerprintEnabled = ref(false);
const sessionIdMaskingEnabled = ref(false);

// Computed: current preset mappings based on platform
const presetMappings = computed(() =>
  getPresetMappingsByPlatform(props.account?.platform || "anthropic"),
);
const tempUnschedPresets = computed(() => [
  {
    label: "529 过载",
    rule: {
      error_code: 529,
      keywords: "overloaded, too many",
      duration_minutes: 60,
      description: "服务过载 - 暂停 60 分钟",
    },
  },
  {
    label: "429 限流",
    rule: {
      error_code: 429,
      keywords: "rate limit, too many requests",
      duration_minutes: 10,
      description: "触发限流 - 暂停 10 分钟",
    },
  },
  {
    label: "503 维护",
    rule: {
      error_code: 503,
      keywords: "unavailable, maintenance",
      duration_minutes: 30,
      description: "服务不可用 - 暂停 30 分钟",
    },
  },
]);

// Computed: default base URL based on platform
const defaultBaseUrl = computed(() => {
  if (props.account?.platform === "openai") return "https://api.openai.com";
  if (props.account?.platform === "gemini")
    return "https://generativelanguage.googleapis.com";
  return "https://api.anthropic.com";
});

const form = reactive({
  name: "",
  notes: "",
  proxy_id: null as number | null,
  concurrency: 1,
  priority: 1,
  rate_multiplier: 1,
  status: "active" as "active" | "inactive",
  group_ids: [] as number[],
  expires_at: null as number | null,
});

const statusOptions = computed(() => [
  { value: "active", label: "启用" },
  { value: "inactive", label: "禁用" },
]);

const expiresAtInput = computed({
  get: () => formatDateTimeLocal(form.expires_at),
  set: (value: string) => {
    form.expires_at = parseDateTimeLocal(value);
  },
});

// Watchers
watch(
  () => props.account,
  (newAccount) => {
    if (newAccount) {
      form.name = newAccount.name;
      form.notes = newAccount.notes || "";
      form.proxy_id = newAccount.proxy_id;
      form.concurrency = newAccount.concurrency;
      form.priority = newAccount.priority;
      form.rate_multiplier = newAccount.rate_multiplier ?? 1;
      form.status = newAccount.status as "active" | "inactive";
      form.group_ids = newAccount.group_ids || [];
      form.expires_at = newAccount.expires_at ?? null;

      // Load intercept warmup requests setting (applies to all account types)
      const credentials = newAccount.credentials as
        | Record<string, unknown>
        | undefined;
      interceptWarmupRequests.value =
        credentials?.intercept_warmup_requests === true;
      autoPauseOnExpired.value = newAccount.auto_pause_on_expired === true;

      // Load mixed scheduling setting (only for antigravity accounts)
      const extra = newAccount.extra as Record<string, unknown> | undefined;
      mixedScheduling.value = extra?.mixed_scheduling === true;

      // Load quota control settings (Anthropic OAuth/SetupToken only)
      loadQuotaControlSettings(newAccount);

      loadTempUnschedRules(credentials);

      // Initialize API Key fields for apikey type
      if (newAccount.type === "apikey" && newAccount.credentials) {
        const credentials = newAccount.credentials as Record<string, unknown>;
        const platformDefaultUrl =
          newAccount.platform === "openai"
            ? "https://api.openai.com"
            : newAccount.platform === "gemini"
              ? "https://generativelanguage.googleapis.com"
              : "https://api.anthropic.com";
        editBaseUrl.value =
          (credentials.base_url as string) || platformDefaultUrl;

        // Load model mappings and detect mode
        const existingMappings = credentials.model_mapping as
          | Record<string, string>
          | undefined;
        if (existingMappings && typeof existingMappings === "object") {
          const entries = Object.entries(existingMappings);

          // Detect if this is whitelist mode (all from === to) or mapping mode
          const isWhitelistMode =
            entries.length > 0 && entries.every(([from, to]) => from === to);

          if (isWhitelistMode) {
            // Whitelist mode: populate allowedModels
            modelRestrictionMode.value = "whitelist";
            allowedModels.value = entries.map(([from]) => from);
            modelMappings.value = [];
          } else {
            // Mapping mode: populate modelMappings
            modelRestrictionMode.value = "mapping";
            modelMappings.value = entries.map(([from, to]) => ({ from, to }));
            allowedModels.value = [];
          }
        } else {
          // No mappings: default to whitelist mode with empty selection (allow all)
          modelRestrictionMode.value = "whitelist";
          modelMappings.value = [];
          allowedModels.value = [];
        }

        // Load custom error codes
        customErrorCodesEnabled.value =
          credentials.custom_error_codes_enabled === true;
        const existingErrorCodes = credentials.custom_error_codes as
          | number[]
          | undefined;
        if (existingErrorCodes && Array.isArray(existingErrorCodes)) {
          selectedErrorCodes.value = [...existingErrorCodes];
        } else {
          selectedErrorCodes.value = [];
        }
      } else {
        const platformDefaultUrl =
          newAccount.platform === "openai"
            ? "https://api.openai.com"
            : newAccount.platform === "gemini"
              ? "https://generativelanguage.googleapis.com"
              : "https://api.anthropic.com";
        editBaseUrl.value = platformDefaultUrl;
        modelRestrictionMode.value = "whitelist";
        modelMappings.value = [];
        allowedModels.value = [];
        customErrorCodesEnabled.value = false;
        selectedErrorCodes.value = [];
      }
      editApiKey.value = "";
    }
  },
  { immediate: true },
);

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

// Error code toggle helper
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

// Add custom error code from input
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

// Remove error code
const removeErrorCode = (code: number) => {
  const index = selectedErrorCodes.value.indexOf(code);
  if (index !== -1) {
    selectedErrorCodes.value.splice(index, 1);
  }
};

const addTempUnschedRule = (preset?: TempUnschedRuleForm) => {
  if (preset) {
    tempUnschedRules.value.push({ ...preset });
    return;
  }
  tempUnschedRules.value.push({
    error_code: null,
    keywords: "",
    duration_minutes: 30,
    description: "",
  });
};

const removeTempUnschedRule = (index: number) => {
  tempUnschedRules.value.splice(index, 1);
};

const moveTempUnschedRule = (index: number, direction: number) => {
  const target = index + direction;
  if (target < 0 || target >= tempUnschedRules.value.length) return;
  const rules = tempUnschedRules.value;
  const current = rules[index];
  rules[index] = rules[target];
  rules[target] = current;
};

const buildTempUnschedRules = (rules: TempUnschedRuleForm[]) => {
  const out: Array<{
    error_code: number;
    keywords: string[];
    duration_minutes: number;
    description: string;
  }> = [];

  for (const rule of rules) {
    const errorCode = Number(rule.error_code);
    const duration = Number(rule.duration_minutes);
    const keywords = splitTempUnschedKeywords(rule.keywords);
    if (!Number.isFinite(errorCode) || errorCode < 100 || errorCode > 599) {
      continue;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      continue;
    }
    if (keywords.length === 0) {
      continue;
    }
    out.push({
      error_code: Math.trunc(errorCode),
      keywords,
      duration_minutes: Math.trunc(duration),
      description: rule.description.trim(),
    });
  }

  return out;
};

const applyTempUnschedConfig = (credentials: Record<string, unknown>) => {
  if (!tempUnschedEnabled.value) {
    delete credentials.temp_unschedulable_enabled;
    delete credentials.temp_unschedulable_rules;
    return true;
  }

  const rules = buildTempUnschedRules(tempUnschedRules.value);
  if (rules.length === 0) {
    appStore.showError("请至少填写一条包含错误码、关键词和时长的规则。");
    return false;
  }

  credentials.temp_unschedulable_enabled = true;
  credentials.temp_unschedulable_rules = rules;
  return true;
};

function loadTempUnschedRules(credentials?: Record<string, unknown>) {
  tempUnschedEnabled.value = credentials?.temp_unschedulable_enabled === true;
  const rawRules = credentials?.temp_unschedulable_rules;
  if (!Array.isArray(rawRules)) {
    tempUnschedRules.value = [];
    return;
  }

  tempUnschedRules.value = rawRules.map((rule) => {
    const entry = rule as Record<string, unknown>;
    return {
      error_code: toPositiveNumber(entry.error_code),
      keywords: formatTempUnschedKeywords(entry.keywords),
      duration_minutes: toPositiveNumber(entry.duration_minutes),
      description:
        typeof entry.description === "string" ? entry.description : "",
    };
  });
}

// Load quota control settings from account (Anthropic OAuth/SetupToken only)
function loadQuotaControlSettings(account: Account) {
  // Reset all quota control state first
  windowCostEnabled.value = false;
  windowCostLimit.value = null;
  windowCostStickyReserve.value = null;
  sessionLimitEnabled.value = false;
  maxSessions.value = null;
  sessionIdleTimeout.value = null;
  tlsFingerprintEnabled.value = false;
  sessionIdMaskingEnabled.value = false;

  // Only applies to Anthropic OAuth/SetupToken accounts
  if (
    account.platform !== "anthropic" ||
    (account.type !== "oauth" && account.type !== "setup-token")
  ) {
    return;
  }

  // Load from extra field (via backend DTO fields)
  if (account.window_cost_limit != null && account.window_cost_limit > 0) {
    windowCostEnabled.value = true;
    windowCostLimit.value = account.window_cost_limit;
    windowCostStickyReserve.value = account.window_cost_sticky_reserve ?? 10;
  }

  if (account.max_sessions != null && account.max_sessions > 0) {
    sessionLimitEnabled.value = true;
    maxSessions.value = account.max_sessions;
    sessionIdleTimeout.value = account.session_idle_timeout_minutes ?? 5;
  }

  // Load TLS fingerprint setting
  if (account.enable_tls_fingerprint === true) {
    tlsFingerprintEnabled.value = true;
  }

  // Load session ID masking setting
  if (account.session_id_masking_enabled === true) {
    sessionIdMaskingEnabled.value = true;
  }
}

function formatTempUnschedKeywords(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .join(", ");
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

const splitTempUnschedKeywords = (value: string) => {
  return value
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

function toPositiveNumber(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    return null;
  }
  return Math.trunc(num);
}

const formatDateTimeLocal = formatDateTimeLocalInput;
const parseDateTimeLocal = parseDateTimeLocalInput;

// Methods
const handleClose = () => {
  emit("close");
};

const handleSubmit = async () => {
  if (!props.account) return;

  submitting.value = true;
  try {
    const updatePayload: Record<string, unknown> = { ...form };
    // 后端期望 proxy_id: 0 表示清除代理，而不是 null
    if (updatePayload.proxy_id === null) {
      updatePayload.proxy_id = 0;
    }
    if (form.expires_at === null) {
      updatePayload.expires_at = 0;
    }
    updatePayload.auto_pause_on_expired = autoPauseOnExpired.value;

    // For apikey type, handle credentials update
    if (props.account.type === "apikey") {
      const currentCredentials =
        (props.account.credentials as Record<string, unknown>) || {};
      const newBaseUrl = editBaseUrl.value.trim() || defaultBaseUrl.value;
      const modelMapping = buildModelMappingObject(
        modelRestrictionMode.value,
        allowedModels.value,
        modelMappings.value,
      );

      // Always update credentials for apikey type to handle model mapping changes
      const newCredentials: Record<string, unknown> = {
        base_url: newBaseUrl,
      };

      // Handle API key
      if (editApiKey.value.trim()) {
        // User provided a new API key
        newCredentials.api_key = editApiKey.value.trim();
      } else if (currentCredentials.api_key) {
        // Preserve existing api_key
        newCredentials.api_key = currentCredentials.api_key;
      } else {
        appStore.showError("API Key 是必需的");
        submitting.value = false;
        return;
      }

      // Add model mapping if configured
      if (modelMapping) {
        newCredentials.model_mapping = modelMapping;
      }

      // Add custom error codes if enabled
      if (customErrorCodesEnabled.value) {
        newCredentials.custom_error_codes_enabled = true;
        newCredentials.custom_error_codes = [...selectedErrorCodes.value];
      }

      // Add intercept warmup requests setting
      if (interceptWarmupRequests.value) {
        newCredentials.intercept_warmup_requests = true;
      }
      if (!applyTempUnschedConfig(newCredentials)) {
        submitting.value = false;
        return;
      }

      updatePayload.credentials = newCredentials;
    } else {
      // For oauth/setup-token types, only update intercept_warmup_requests if changed
      const currentCredentials =
        (props.account.credentials as Record<string, unknown>) || {};
      const newCredentials: Record<string, unknown> = { ...currentCredentials };

      if (interceptWarmupRequests.value) {
        newCredentials.intercept_warmup_requests = true;
      } else {
        delete newCredentials.intercept_warmup_requests;
      }
      if (!applyTempUnschedConfig(newCredentials)) {
        submitting.value = false;
        return;
      }

      updatePayload.credentials = newCredentials;
    }

    // For antigravity accounts, handle mixed_scheduling in extra
    if (props.account.platform === "antigravity") {
      const currentExtra =
        (props.account.extra as Record<string, unknown>) || {};
      const newExtra: Record<string, unknown> = { ...currentExtra };
      if (mixedScheduling.value) {
        newExtra.mixed_scheduling = true;
      } else {
        delete newExtra.mixed_scheduling;
      }
      updatePayload.extra = newExtra;
    }

    // For Anthropic OAuth/SetupToken accounts, handle quota control settings in extra
    if (
      props.account.platform === "anthropic" &&
      (props.account.type === "oauth" || props.account.type === "setup-token")
    ) {
      const currentExtra =
        (props.account.extra as Record<string, unknown>) || {};
      const newExtra: Record<string, unknown> = { ...currentExtra };

      // Window cost limit settings
      if (
        windowCostEnabled.value &&
        windowCostLimit.value != null &&
        windowCostLimit.value > 0
      ) {
        newExtra.window_cost_limit = windowCostLimit.value;
        newExtra.window_cost_sticky_reserve =
          windowCostStickyReserve.value ?? 10;
      } else {
        delete newExtra.window_cost_limit;
        delete newExtra.window_cost_sticky_reserve;
      }

      // Session limit settings
      if (
        sessionLimitEnabled.value &&
        maxSessions.value != null &&
        maxSessions.value > 0
      ) {
        newExtra.max_sessions = maxSessions.value;
        newExtra.session_idle_timeout_minutes = sessionIdleTimeout.value ?? 5;
      } else {
        delete newExtra.max_sessions;
        delete newExtra.session_idle_timeout_minutes;
      }

      // TLS fingerprint setting
      if (tlsFingerprintEnabled.value) {
        newExtra.enable_tls_fingerprint = true;
      } else {
        delete newExtra.enable_tls_fingerprint;
      }

      // Session ID masking setting
      if (sessionIdMaskingEnabled.value) {
        newExtra.session_id_masking_enabled = true;
      } else {
        delete newExtra.session_id_masking_enabled;
      }

      updatePayload.extra = newExtra;
    }

    await adminAPI.accounts.update(props.account.id, updatePayload);
    appStore.showSuccess("账号更新成功");
    emit("updated");
    handleClose();
  } catch (error: any) {
    appStore.showError(
      error.response?.data?.message ||
        error.response?.data?.detail ||
        "更新账号失败",
    );
  } finally {
    submitting.value = false;
  }
};
</script>
