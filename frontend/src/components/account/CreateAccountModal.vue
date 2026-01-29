<template>
  <BaseDialog
    :show="show"
    :title="'添加账号'"
    width="normal"
    @close="handleClose"
  >
    <!-- Step Indicator for OAuth accounts -->
    <div v-if="isOAuthFlow" class="mb-6 flex items-center justify-center">
      <div class="flex items-center space-x-4">
        <div class="flex items-center">
          <div
            :class="[
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
              step >= 1
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-500 dark:bg-dark-600',
            ]"
          >
            1
          </div>
          <span
            class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >{{ "授权方式" }}</span
          >
        </div>
        <div class="h-0.5 w-8 bg-gray-300 dark:bg-dark-600" />
        <div class="flex items-center">
          <div
            :class="[
              'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
              step >= 2
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-500 dark:bg-dark-600',
            ]"
          >
            2
          </div>
          <span
            class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >{{ oauthStepTitle }}</span
          >
        </div>
      </div>
    </div>

    <!-- Step 1: Basic Info -->
    <form
      v-if="step === 1"
      id="create-account-form"
      class="space-y-5"
      @submit.prevent="handleSubmit"
    >
      <div>
        <label class="input-label">{{ "账号名称" }}</label>
        <input
          v-model="form.name"
          type="text"
          required
          class="input"
          :placeholder="'请输入账号名称'"
          data-tour="account-form-name"
        />
      </div>
      <div>
        <label class="input-label">{{ "备注" }}</label>
        <textarea
          v-model="form.notes"
          rows="3"
          class="input"
          :placeholder="'请输入备注'"
        ></textarea>
        <p class="input-hint">{{ "备注可选" }}</p>
      </div>

      <!-- Platform Selection - Segmented Control Style -->
      <div>
        <label class="input-label">{{ "平台" }}</label>
        <div
          class="mt-2 flex rounded-lg bg-gray-100 p-1 dark:bg-dark-700"
          data-tour="account-form-platform"
        >
          <button
            type="button"
            :class="[
              'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
              form.platform === 'anthropic'
                ? 'bg-white text-orange-600 shadow-sm dark:bg-dark-600 dark:text-orange-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
            ]"
            @click="form.platform = 'anthropic'"
          >
            <Icon name="sparkles" size="sm" />
            Anthropic
          </button>
          <button
            type="button"
            :class="[
              'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
              form.platform === 'openai'
                ? 'bg-white text-green-600 shadow-sm dark:bg-dark-600 dark:text-green-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
            ]"
            @click="form.platform = 'openai'"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
            OpenAI
          </button>
          <button
            type="button"
            :class="[
              'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
              form.platform === 'gemini'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-dark-600 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
            ]"
            @click="form.platform = 'gemini'"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z"
              />
            </svg>
            Gemini
          </button>
          <button
            type="button"
            :class="[
              'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all',
              form.platform === 'antigravity'
                ? 'bg-white text-purple-600 shadow-sm dark:bg-dark-600 dark:text-purple-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
            ]"
            @click="form.platform = 'antigravity'"
          >
            <Icon name="cloud" size="sm" />
            Antigravity
          </button>
        </div>
      </div>

      <!-- Account Type Selection (Anthropic) -->
      <div v-if="form.platform === 'anthropic'">
        <label class="input-label">{{ "账号类型" }}</label>
        <div class="mt-2 grid grid-cols-2 gap-3" data-tour="account-form-type">
          <button
            type="button"
            :class="[
              'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
              accountCategory === 'oauth-based'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                : 'border-gray-200 hover:border-orange-300 dark:border-dark-600 dark:hover:border-orange-700',
            ]"
            @click="accountCategory = 'oauth-based'"
          >
            <div
              :class="[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                accountCategory === 'oauth-based'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-500 dark:bg-dark-600 dark:text-gray-400',
              ]"
            >
              <Icon name="sparkles" size="sm" />
            </div>
            <div>
              <span
                class="block text-sm font-medium text-gray-900 dark:text-white"
                >{{ "Claude Code" }}</span
              >
              <span class="text-xs text-gray-500 dark:text-gray-400">{{
                "OAuth / Setup Token"
              }}</span>
            </div>
          </button>

          <button
            type="button"
            :class="[
              'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
              accountCategory === 'apikey'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 hover:border-purple-300 dark:border-dark-600 dark:hover:border-purple-700',
            ]"
            @click="accountCategory = 'apikey'"
          >
            <div
              :class="[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                accountCategory === 'apikey'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-500 dark:bg-dark-600 dark:text-gray-400',
              ]"
            >
              <Icon name="key" size="sm" />
            </div>
            <div>
              <span
                class="block text-sm font-medium text-gray-900 dark:text-white"
                >{{ "Claude Console" }}</span
              >
              <span class="text-xs text-gray-500 dark:text-gray-400">{{
                "API Key"
              }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Account Type Selection (OpenAI) -->
      <div v-if="form.platform === 'openai'">
        <label class="input-label">{{ "账号类型" }}</label>
        <div class="mt-2 grid grid-cols-2 gap-3" data-tour="account-form-type">
          <button
            type="button"
            :class="[
              'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
              accountCategory === 'oauth-based'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-200 hover:border-green-300 dark:border-dark-600 dark:hover:border-green-700',
            ]"
            @click="accountCategory = 'oauth-based'"
          >
            <div
              :class="[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                accountCategory === 'oauth-based'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-500 dark:bg-dark-600 dark:text-gray-400',
              ]"
            >
              <Icon name="key" size="sm" />
            </div>
            <div>
              <span
                class="block text-sm font-medium text-gray-900 dark:text-white"
                >OAuth</span
              >
              <span class="text-xs text-gray-500 dark:text-gray-400">{{
                "ChatGPT OAuth"
              }}</span>
            </div>
          </button>

          <button
            type="button"
            :class="[
              'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
              accountCategory === 'apikey'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 hover:border-purple-300 dark:border-dark-600 dark:hover:border-purple-700',
            ]"
            @click="accountCategory = 'apikey'"
          >
            <div
              :class="[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                accountCategory === 'apikey'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-500 dark:bg-dark-600 dark:text-gray-400',
              ]"
            >
              <Icon name="key" size="sm" />
            </div>
            <div>
              <span
                class="block text-sm font-medium text-gray-900 dark:text-white"
                >API Key</span
              >
              <span class="text-xs text-gray-500 dark:text-gray-400">{{
                "Responses API"
              }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Account Type Selection (Gemini) -->
      <div v-if="form.platform === 'gemini'">
        <div class="flex items-center justify-between">
          <label class="input-label">{{ "账号类型" }}</label>
          <button
            type="button"
            class="flex items-center gap-1 rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            @click="showGeminiHelpDialog = true"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
            {{ "使用帮助" }}
          </button>
        </div>
        <div class="mt-2 grid grid-cols-2 gap-3" data-tour="account-form-type">
          <button
            type="button"
            :class="[
              'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
              accountCategory === 'oauth-based'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 hover:border-blue-300 dark:border-dark-600 dark:hover:border-blue-700',
            ]"
            @click="accountCategory = 'oauth-based'"
          >
            <div
              :class="[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                accountCategory === 'oauth-based'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-500 dark:bg-dark-600 dark:text-gray-400',
              ]"
            >
              <Icon name="key" size="sm" />
            </div>
            <div>
              <span
                class="block text-sm font-medium text-gray-900 dark:text-white"
              >
                {{ "OAuth 授权（Gemini）" }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ "使用 Google 账号授权，并选择 OAuth 子类型。" }}
              </span>
            </div>
          </button>

          <button
            type="button"
            :class="[
              'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
              accountCategory === 'apikey'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 hover:border-purple-300 dark:border-dark-600 dark:hover:border-purple-700',
            ]"
            @click="accountCategory = 'apikey'"
          >
            <div
              :class="[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                accountCategory === 'apikey'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-500 dark:bg-dark-600 dark:text-gray-400',
              ]"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1721.75 8.25z"
                />
              </svg>
            </div>
            <div>
              <span
                class="block text-sm font-medium text-gray-900 dark:text-white"
              >
                {{ "API 密钥（AI Studio）" }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ "最快接入方式，使用 AIza API Key。" }}
              </span>
            </div>
          </button>
        </div>

        <div
          v-if="accountCategory === 'apikey'"
          class="mt-3 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs text-purple-800 dark:border-purple-800/40 dark:bg-purple-900/20 dark:text-purple-200"
        >
          <p>{{ "适合轻量测试。免费层限流严格，数据可能用于训练。" }}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <a
              :href="geminiHelpLinks.apiKey"
              class="font-medium text-blue-600 hover:underline dark:text-blue-400"
              target="_blank"
              rel="noreferrer"
            >
              {{ "获取 API Key" }}
            </a>
          </div>
        </div>

        <!-- OAuth Type Selection (only show when oauth-based is selected) -->
        <div v-if="accountCategory === 'oauth-based'" class="mt-4">
          <label class="input-label">{{ "OAuth 类型" }}</label>
          <div class="mt-2 grid grid-cols-2 gap-3">
            <!-- Google One OAuth -->
            <button
              type="button"
              :class="[
                'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
                geminiOAuthType === 'google_one'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 hover:border-purple-300 dark:border-dark-600 dark:hover:border-purple-700',
              ]"
              @click="handleSelectGeminiOAuthType('google_one')"
            >
              <div
                :class="[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  geminiOAuthType === 'google_one'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-dark-600 dark:text-gray-400',
                ]"
              >
                <Icon name="user" size="sm" />
              </div>
              <div class="min-w-0">
                <span
                  class="block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Google One
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  个人账号，享受 Google One 订阅配额
                </span>
                <div class="mt-2 flex flex-wrap gap-1">
                  <span
                    class="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                  >
                    推荐个人用户
                  </span>
                  <span
                    class="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  >
                    无需 GCP
                  </span>
                </div>
              </div>
            </button>

            <!-- GCP Code Assist OAuth -->
            <button
              type="button"
              :class="[
                'flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
                geminiOAuthType === 'code_assist'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-blue-300 dark:border-dark-600 dark:hover:border-blue-700',
              ]"
              @click="handleSelectGeminiOAuthType('code_assist')"
            >
              <div
                :class="[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  geminiOAuthType === 'code_assist'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-dark-600 dark:text-gray-400',
                ]"
              >
                <Icon name="cloud" size="sm" />
              </div>
              <div class="min-w-0">
                <span
                  class="block text-sm font-medium text-gray-900 dark:text-white"
                >
                  GCP Code Assist
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  企业级，需要 GCP 项目
                </span>
                <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  需要激活 GCP 项目并绑定信用卡
                  <a
                    :href="geminiHelpLinks.gcpProject"
                    class="ml-1 text-blue-600 hover:underline dark:text-blue-400"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {{ "创建项目" }}
                  </a>
                </div>
                <div class="mt-2 flex flex-wrap gap-1">
                  <span
                    class="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                  >
                    企业用户
                  </span>
                  <span
                    class="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  >
                    高并发
                  </span>
                </div>
              </div>
            </button>
          </div>

          <!-- Advanced Options Toggle -->
          <div class="mt-3">
            <button
              type="button"
              class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              @click="showAdvancedOAuth = !showAdvancedOAuth"
            >
              <svg
                :class="[
                  'h-4 w-4 transition-transform',
                  showAdvancedOAuth ? 'rotate-90' : '',
                ]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span
                >{{ showAdvancedOAuth ? "隐藏" : "显示" }}高级选项（自建 OAuth
                Client）</span
              >
            </button>
          </div>

          <!-- Custom OAuth Client (Advanced) -->
          <div v-if="showAdvancedOAuth" class="mt-3 group relative">
            <button
              type="button"
              :disabled="!geminiAIStudioOAuthEnabled"
              :class="[
                'flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
                !geminiAIStudioOAuthEnabled
                  ? 'cursor-not-allowed opacity-60'
                  : '',
                geminiOAuthType === 'ai_studio'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-gray-200 hover:border-amber-300 dark:border-dark-600 dark:hover:border-amber-700',
              ]"
              @click="handleSelectGeminiOAuthType('ai_studio')"
            >
              <div
                :class="[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  geminiOAuthType === 'ai_studio'
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-dark-600 dark:text-gray-400',
                ]"
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
              </div>
              <div class="min-w-0">
                <span
                  class="block text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ "自定义授权（AI Studio OAuth）" }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {{ "使用管理员预设的 OAuth 客户端，适合组织管理。" }}
                </span>
                <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ "需管理员配置 Client ID 并加入测试用户白名单。" }}
                </div>
                <div class="mt-2 flex flex-wrap gap-1">
                  <span
                    class="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  >
                    {{ "组织管理" }}
                  </span>
                  <span
                    class="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  >
                    {{ "需要管理员" }}
                  </span>
                </div>
              </div>
              <span
                v-if="!geminiAIStudioOAuthEnabled"
                class="ml-auto shrink-0 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              >
                {{ "未配置" }}
              </span>
            </button>

            <div
              v-if="!geminiAIStudioOAuthEnabled"
              class="pointer-events-none absolute right-0 top-full z-50 mt-2 w-80 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
            >
              {{
                "AI Studio OAuth 未配置：请先设置 GEMINI_OAUTH_CLIENT_ID / GEMINI_OAUTH_CLIENT_SECRET，并在 Google OAuth Client 添加 Redirect URI：http://localhost:1455/auth/callback（Consent Screen scopes 需包含 https://www.googleapis.com/auth/generative-language.retriever）"
              }}
            </div>
          </div>
        </div>

        <!-- Tier selection (used as fallback when auto-detection is unavailable/fails) -->
        <div class="mt-4">
          <label class="input-label">{{ "账号等级" }}</label>
          <div class="mt-2">
            <select
              v-if="geminiOAuthType === 'google_one'"
              v-model="geminiTierGoogleOne"
              class="input"
            >
              <option value="google_one_free">{{ "Google One Free" }}</option>
              <option value="google_ai_pro">{{ "Google One Pro" }}</option>
              <option value="google_ai_ultra">{{ "Google One Ultra" }}</option>
            </select>

            <select
              v-else-if="geminiOAuthType === 'code_assist'"
              v-model="geminiTierGcp"
              class="input"
            >
              <option value="gcp_standard">{{ "GCP Standard" }}</option>
              <option value="gcp_enterprise">{{ "GCP Enterprise" }}</option>
            </select>

            <select v-else v-model="geminiTierAIStudio" class="input">
              <option value="aistudio_free">{{ "Google AI Free" }}</option>
              <option value="aistudio_paid">
                {{ "Google AI Pay-as-you-go" }}
              </option>
            </select>
          </div>
          <p class="input-hint">
            {{
              "提示：系统会优先尝试自动识别账号等级；若自动识别不可用或失败，则使用你选择的等级作为回退（本地模拟配额）。"
            }}
          </p>
        </div>
      </div>

      <!-- Account Type Selection (Antigravity - OAuth only) -->
      <div v-if="form.platform === 'antigravity'">
        <label class="input-label">{{ "账号类型" }}</label>
        <div class="mt-2">
          <div
            class="flex items-center gap-3 rounded-lg border-2 border-purple-500 bg-purple-50 p-3 dark:bg-purple-900/20"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500 text-white"
            >
              <Icon name="key" size="sm" />
            </div>
            <div>
              <span
                class="block text-sm font-medium text-gray-900 dark:text-white"
                >OAuth</span
              >
              <span class="text-xs text-gray-500 dark:text-gray-400">{{
                "Antigravity OAuth"
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Method (only for Anthropic OAuth-based type) -->
      <div v-if="form.platform === 'anthropic' && isOAuthFlow">
        <label class="input-label">{{ "添加方式" }}</label>
        <div class="mt-2 flex gap-4">
          <label class="flex cursor-pointer items-center">
            <input
              v-model="addMethod"
              type="radio"
              value="oauth"
              class="mr-2 text-primary-600 focus:ring-primary-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{
              "OAuth"
            }}</span>
          </label>
          <label class="flex cursor-pointer items-center">
            <input
              v-model="addMethod"
              type="radio"
              value="setup-token"
              class="mr-2 text-primary-600 focus:ring-primary-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{
              "Setup Token（长期有效）"
            }}</span>
          </label>
        </div>
      </div>

      <!-- API Key input (only for apikey type) -->
      <div v-if="form.type === 'apikey'" class="space-y-4">
        <div>
          <label class="input-label">{{ "Base URL" }}</label>
          <input
            v-model="apiKeyBaseUrl"
            type="text"
            class="input"
            :placeholder="
              form.platform === 'openai'
                ? 'https://api.openai.com'
                : form.platform === 'gemini'
                  ? 'https://generativelanguage.googleapis.com'
                  : 'https://api.anthropic.com'
            "
          />
          <p class="input-hint">{{ baseUrlHint }}</p>
        </div>
        <div>
          <label class="input-label">{{ "API Key *" }}</label>
          <input
            v-model="apiKeyValue"
            type="password"
            required
            class="input font-mono"
            :placeholder="
              form.platform === 'openai'
                ? 'sk-proj-...'
                : form.platform === 'gemini'
                  ? 'AIza...'
                  : 'sk-ant-...'
            "
          />
          <p class="input-hint">{{ apiKeyHint }}</p>
        </div>

        <!-- Gemini API Key tier selection -->
        <div v-if="form.platform === 'gemini'">
          <label class="input-label">{{ "账号等级" }}</label>
          <select v-model="geminiTierAIStudio" class="input">
            <option value="aistudio_free">{{ "Google AI Free" }}</option>
            <option value="aistudio_paid">
              {{ "Google AI Pay-as-you-go" }}
            </option>
          </select>
          <p class="input-hint">
            {{
              "AI Studio 的配额是按模型分别限流（Pro/Flash 独立）。若已绑卡（按量付费），请选 Pay-as-you-go。"
            }}
          </p>
        </div>

        <!-- Model Restriction Section (不适用于 Gemini) -->
        <div
          v-if="form.platform !== 'gemini'"
          class="border-t border-gray-200 pt-4 dark:border-dark-600"
        >
          <label class="input-label">{{ "模型限制（可选）" }}</label>

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
              {{ "模型白名单" }}
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
              {{ "模型映射" }}
            </button>
          </div>

          <!-- Whitelist Mode -->
          <div v-if="modelRestrictionMode === 'whitelist'">
            <ModelWhitelistSelector
              v-model="allowedModels"
              :platform="form.platform"
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
              {{ "添加映射" }}
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
        <div
          v-if="form.platform !== 'gemini'"
          class="border-t border-gray-200 pt-4 dark:border-dark-600"
        >
          <div class="mb-3 flex items-center justify-between">
            <div>
              <label class="input-label mb-0">{{ "自定义错误码" }}</label>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ "仅对选中的错误码停止调度" }}
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
                {{ "仅选中的错误码会停止调度，其他错误将返回 500。" }}
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
                {{ "未选择（使用默认策略）" }}
              </span>
            </div>
          </div>
        </div>

        <!-- Gemini 模型说明 -->
        <div
          v-if="form.platform === 'gemini'"
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
                  {{ "Gemini 直接转发模型" }}
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
            <label class="input-label mb-0">{{ "临时不可调度" }}</label>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ "当错误码与关键词同时匹配时，账号会在指定时间内被临时禁用。" }}
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
              {{ "规则按顺序匹配，需同时满足错误码与关键词。" }}
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
                  <label class="input-label">{{ "错误码" }}</label>
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
                  <label class="input-label">{{ "持续时间（分钟）" }}</label>
                  <input
                    v-model.number="rule.duration_minutes"
                    type="number"
                    min="1"
                    class="input"
                    :placeholder="'例如 30'"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label class="input-label">{{ "关键词" }}</label>
                  <input
                    v-model="rule.keywords"
                    type="text"
                    class="input"
                    :placeholder="'例如 overloaded, too many requests'"
                  />
                  <p class="input-hint">
                    {{ "多个关键词用逗号分隔，匹配时必须命中其中之一。" }}
                  </p>
                </div>
                <div class="sm:col-span-2">
                  <label class="input-label">{{ "描述" }}</label>
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
            {{ "添加规则" }}
          </button>
        </div>
      </div>

      <!-- Intercept Warmup Requests (Anthropic only) -->
      <div
        v-if="form.platform === 'anthropic'"
        class="border-t border-gray-200 pt-4 dark:border-dark-600"
      >
        <div class="flex items-center justify-between">
          <div>
            <label class="input-label mb-0">{{ "拦截预热请求" }}</label>
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

      <!-- Quota Control Section (Anthropic OAuth/SetupToken only) -->
      <div
        v-if="
          form.platform === 'anthropic' && accountCategory === 'oauth-based'
        "
        class="border-t border-gray-200 pt-4 dark:border-dark-600 space-y-4"
      >
        <div class="mb-3">
          <h3 class="input-label mb-0 text-base font-semibold">
            {{ "配额控制" }}
          </h3>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ "仅适用于 Anthropic OAuth/Setup Token 账号" }}
          </p>
        </div>

        <!-- Window Cost Limit -->
        <div class="rounded-lg border border-gray-200 p-4 dark:border-dark-600">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <label class="input-label mb-0">{{ "5h窗口费用控制" }}</label>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ "限制账号在5小时窗口内的费用使用" }}
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
              <label class="input-label">{{ "费用阈值" }}</label>
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
              <p class="input-hint">{{ "达到阈值后不参与新请求调度" }}</p>
            </div>
            <div>
              <label class="input-label">{{ "粘性预留额度" }}</label>
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
              <p class="input-hint">{{ "为粘性会话预留的额外额度" }}</p>
            </div>
          </div>
        </div>

        <!-- Session Limit -->
        <div class="rounded-lg border border-gray-200 p-4 dark:border-dark-600">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <label class="input-label mb-0">{{ "会话数量控制" }}</label>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ "限制同时活跃的会话数量" }}
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
              <label class="input-label">{{ "最大会话数" }}</label>
              <input
                v-model.number="maxSessions"
                type="number"
                min="1"
                step="1"
                class="input"
                :placeholder="'3'"
              />
              <p class="input-hint">{{ "同时活跃的最大会话数量" }}</p>
            </div>
            <div>
              <label class="input-label">{{ "空闲超时" }}</label>
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
                  >{{ "分钟" }}</span
                >
              </div>
              <p class="input-hint">{{ "会话空闲超时后自动释放" }}</p>
            </div>
          </div>
        </div>

        <!-- TLS Fingerprint -->
        <div class="rounded-lg border border-gray-200 p-4 dark:border-dark-600">
          <div class="flex items-center justify-between">
            <div>
              <label class="input-label mb-0">{{ "TLS 指纹模拟" }}</label>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ "模拟 Node.js/Claude Code 客户端的 TLS 指纹" }}
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
              <label class="input-label mb-0">{{ "会话 ID 伪装" }}</label>
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

      <div>
        <label class="input-label">{{ "代理" }}</label>
        <ProxySelector v-model="form.proxy_id" :proxies="proxies" />
      </div>

      <div class="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div>
          <label class="input-label">{{ "并发数" }}</label>
          <input
            v-model.number="form.concurrency"
            type="number"
            min="1"
            class="input"
          />
        </div>
        <div>
          <label class="input-label">{{ "优先级" }}</label>
          <input
            v-model.number="form.priority"
            type="number"
            min="1"
            class="input"
            data-tour="account-form-priority"
          />
          <p class="input-hint">{{ "优先级越小的账号优先使用" }}</p>
        </div>
        <div>
          <label class="input-label">{{ "账号计费倍率" }}</label>
          <input
            v-model.number="form.rate_multiplier"
            type="number"
            min="0"
            step="0.001"
            class="input"
          />
          <p class="input-hint">
            {{ ">=0，0 表示该账号计费为 0；仅影响账号计费口径" }}
          </p>
        </div>
      </div>
      <div class="border-t border-gray-200 pt-4 dark:border-dark-600">
        <label class="input-label">{{ "过期时间" }}</label>
        <input v-model="expiresAtInput" type="datetime-local" class="input" />
        <p class="input-hint">{{ "留空表示不过期" }}</p>
      </div>

      <div>
        <div class="flex items-center justify-between">
          <div>
            <label class="input-label mb-0">{{ "过期自动暂停调度" }}</label>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ "启用后，账号过期将自动暂停调度" }}
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

      <div class="border-t border-gray-200 pt-4 dark:border-dark-600">
        <!-- Mixed Scheduling (only for antigravity accounts) -->
        <div
          v-if="form.platform === 'antigravity'"
          class="flex items-center gap-2"
        >
          <label class="flex cursor-pointer items-center gap-2">
            <input
              v-model="mixedScheduling"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 dark:border-dark-500"
            />
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ "在 /v1/messages 中使用" }}
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

        <!-- Group Selection - 仅标准模式显示 -->
        <GroupSelector
          v-if="!authStore.isSimpleMode"
          v-model="form.group_ids"
          :groups="groups"
          :platform="form.platform"
          :mixed-scheduling="mixedScheduling"
          data-tour="account-form-groups"
        />
      </div>
    </form>

    <!-- Step 2: OAuth Authorization -->
    <div v-else class="space-y-5">
      <OAuthAuthorizationFlow
        ref="oauthFlowRef"
        :add-method="form.platform === 'anthropic' ? addMethod : 'oauth'"
        :auth-url="currentAuthUrl"
        :session-id="currentSessionId"
        :loading="currentOAuthLoading"
        :error="currentOAuthError"
        :show-help="form.platform === 'anthropic'"
        :show-proxy-warning="form.platform !== 'openai' && !!form.proxy_id"
        :allow-multiple="form.platform === 'anthropic'"
        :show-cookie-option="form.platform === 'anthropic'"
        :platform="form.platform"
        :show-project-id="geminiOAuthType === 'code_assist'"
        @generate-url="handleGenerateUrl"
        @cookie-auth="handleCookieAuth"
      />
    </div>

    <template #footer>
      <div v-if="step === 1" class="flex justify-end gap-3">
        <button type="button" class="btn btn-secondary" @click="handleClose">
          {{ "取消" }}
        </button>
        <button
          type="submit"
          form="create-account-form"
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
          {{ isOAuthFlow ? "下一步" : submitting ? "创建中..." : "创建" }}
        </button>
      </div>
      <div v-else class="flex justify-between gap-3">
        <button
          type="button"
          class="btn btn-secondary"
          @click="goBackToBasicInfo"
        >
          {{ "返回" }}
        </button>
        <button
          v-if="isManualInputMethod"
          type="button"
          :disabled="!canExchangeCode"
          class="btn btn-primary"
          @click="handleExchangeCode"
        >
          <svg
            v-if="currentOAuthLoading"
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
          {{ currentOAuthLoading ? "验证中..." : "完成授权" }}
        </button>
      </div>
    </template>
  </BaseDialog>

  <!-- Gemini Help Dialog -->
  <BaseDialog
    :show="showGeminiHelpDialog"
    :title="'Gemini 使用指南'"
    max-width="max-w-3xl"
    @close="showGeminiHelpDialog = false"
  >
    <div class="space-y-6">
      <!-- Setup Guide Section -->
      <div>
        <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {{ "Gemini 使用准备" }}
        </h3>
        <div class="space-y-4">
          <div>
            <p
              class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {{ "准备工作" }}
            </p>
            <ul
              class="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400"
            >
              <li>{{ "使用美国 IP，并确保账号归属地为美国。" }}</li>
              <li>{{ "账号需满 18 岁。" }}</li>
            </ul>
          </div>
          <div>
            <p
              class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {{ "服务激活" }}
            </p>
            <ul
              class="list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-400"
            >
              <li>{{ "激活 Gemini Web，避免 User not initialized。" }}</li>
              <li>{{ "激活 GCP 项目，获取 Code Assist 所需 Project ID。" }}</li>
            </ul>
            <div class="mt-2 flex flex-wrap gap-2">
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noreferrer"
                class="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {{ "检查归属地" }}
              </a>
              <span class="text-gray-400">·</span>
              <a
                href="https://policies.google.com/country-association-form"
                target="_blank"
                rel="noreferrer"
                class="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                修改归属地
              </a>
              <span class="text-gray-400">·</span>
              <a
                href="https://gemini.google.com/gems/create?hl=en-US&pli=1"
                target="_blank"
                rel="noreferrer"
                class="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {{ "激活 Gemini Web" }}
              </a>
              <span class="text-gray-400">·</span>
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                rel="noreferrer"
                class="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {{ "打开 GCP 控制台" }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Quota Policy Section -->
      <div class="border-t border-gray-200 pt-6 dark:border-dark-600">
        <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {{ "Gemini 配额与限流政策（参考）" }}
        </h3>
        <p class="mb-4 text-xs text-amber-600 dark:text-amber-400">
          {{
            "注意：Gemini 官方未提供用量查询接口。此处显示的“每日配额”是由系统根据账号等级模拟计算的估算值，仅供调度参考，请以 Google 官方实际报错为准。"
          }}
        </p>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-gray-50 dark:bg-dark-600">
              <tr>
                <th
                  class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300"
                >
                  {{ "授权通道" }}
                </th>
                <th
                  class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300"
                >
                  {{ "账号状态" }}
                </th>
                <th
                  class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300"
                >
                  {{ "限流政策" }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-dark-600">
              <tr>
                <td class="px-3 py-2 text-gray-900 dark:text-white">
                  {{
                    "Google One OAuth（个人版 / Code Assist for Individuals）"
                  }}
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">Free</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                  {{ "共享池：1000 RPD / 60 RPM（不分模型）" }}
                </td>
              </tr>
              <tr>
                <td class="px-3 py-2 text-gray-900 dark:text-white"></td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">Pro</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                  {{ "共享池：1500 RPD / 120 RPM（不分模型）" }}
                </td>
              </tr>
              <tr>
                <td class="px-3 py-2 text-gray-900 dark:text-white"></td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                  Ultra
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                  {{ "共享池：2000 RPD / 120 RPM（不分模型）" }}
                </td>
              </tr>
              <tr>
                <td class="px-3 py-2 text-gray-900 dark:text-white">
                  {{ "GCP Code Assist OAuth（企业版）" }}
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                  Standard
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                  {{ "共享池：1500 RPD / 120 RPM（不分模型）" }}
                </td>
              </tr>
              <tr>
                <td class="px-3 py-2 text-gray-900 dark:text-white"></td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                  Enterprise
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                  {{ "共享池：2000 RPD / 120 RPM（不分模型）" }}
                </td>
              </tr>
              <tr>
                <td class="px-3 py-2 text-gray-900 dark:text-white">
                  {{ "AI Studio API Key / OAuth" }}
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">Free</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                  {{ "RPD 50；RPM 2（Pro）/ 15（Flash）" }}
                </td>
              </tr>
              <tr>
                <td class="px-3 py-2 text-gray-900 dark:text-white"></td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">Paid</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">
                  {{ "RPD 不限；RPM 1000（Pro）/ 2000（Flash）（按模型配额）" }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="mt-4 flex flex-wrap gap-3">
          <a
            :href="geminiQuotaDocs.codeAssist"
            target="_blank"
            rel="noreferrer"
            class="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {{ "Code Assist 配额" }}
          </a>
          <a
            :href="geminiQuotaDocs.aiStudio"
            target="_blank"
            rel="noreferrer"
            class="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {{ "AI Studio 定价" }}
          </a>
          <a
            :href="geminiQuotaDocs.vertex"
            target="_blank"
            rel="noreferrer"
            class="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {{ "Vertex AI 配额" }}
          </a>
        </div>
      </div>

      <!-- API Key Links Section -->
      <div class="border-t border-gray-200 pt-6 dark:border-dark-600">
        <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
          {{ "API Key 相关链接" }}
        </h3>
        <div class="flex flex-wrap gap-3">
          <a
            :href="geminiHelpLinks.apiKey"
            target="_blank"
            rel="noreferrer"
            class="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {{ "获取 API Key" }}
          </a>
          <a
            :href="geminiHelpLinks.aiStudioPricing"
            target="_blank"
            rel="noreferrer"
            class="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            {{ "配额说明" }}
          </a>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button
          type="button"
          class="btn btn-primary"
          @click="showGeminiHelpDialog = false"
        >
          {{ "关闭" }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { useAppStore } from "@/stores/app";
import {
  claudeModels,
  getPresetMappingsByPlatform,
  getModelsByPlatform,
  buildModelMappingObject,
} from "@/composables/useModelWhitelist";
import { useAuthStore } from "@/stores/auth";
import { adminAPI } from "@/api/admin";
import {
  useAccountOAuth,
  type AddMethod,
  type AuthInputMethod,
} from "@/composables/useAccountOAuth";
import { useOpenAIOAuth } from "@/composables/useOpenAIOAuth";
import { useGeminiOAuth } from "@/composables/useGeminiOAuth";
import { useAntigravityOAuth } from "@/composables/useAntigravityOAuth";
import type { Proxy, AdminGroup, AccountPlatform, AccountType } from "@/types";
import {
  formatDateTimeLocalInput,
  parseDateTimeLocalInput,
} from "@/utils/format";

// Type for exposed OAuthAuthorizationFlow component
// Note: defineExpose automatically unwraps refs, so we use the unwrapped types
interface OAuthFlowExposed {
  authCode: string;
  oauthState: string;
  projectId: string;
  sessionKey: string;
  inputMethod: AuthInputMethod;
  reset: () => void;
}

const authStore = useAuthStore();

const oauthStepTitle = computed(() => {
  if (form.platform === "openai") return "OpenAI 账户授权";
  if (form.platform === "gemini") return "Gemini 账户授权";
  if (form.platform === "antigravity") return "Antigravity 账户授权";
  return "Claude 账号授权";
});

// Platform-specific hints for API Key type
const baseUrlHint = computed(() => {
  if (form.platform === "openai") return "留空使用官方 OpenAI API";
  if (form.platform === "gemini") return "留空使用官方 Gemini API";
  return "留空使用官方 Anthropic API";
});

const apiKeyHint = computed(() => {
  if (form.platform === "openai") return "您的 OpenAI API Key";
  if (form.platform === "gemini") return "您的 Gemini API Key（以 AIza 开头）";
  return "您的 Claude Console API Key";
});

interface Props {
  show: boolean;
  proxies: Proxy[];
  groups: AdminGroup[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  created: [];
}>();

const appStore = useAppStore();

// OAuth composables
const oauth = useAccountOAuth(); // For Anthropic OAuth
const openaiOAuth = useOpenAIOAuth(); // For OpenAI OAuth
const geminiOAuth = useGeminiOAuth(); // For Gemini OAuth
const antigravityOAuth = useAntigravityOAuth(); // For Antigravity OAuth

// Computed: current OAuth state for template binding
const currentAuthUrl = computed(() => {
  if (form.platform === "openai") return openaiOAuth.authUrl.value;
  if (form.platform === "gemini") return geminiOAuth.authUrl.value;
  if (form.platform === "antigravity") return antigravityOAuth.authUrl.value;
  return oauth.authUrl.value;
});

const currentSessionId = computed(() => {
  if (form.platform === "openai") return openaiOAuth.sessionId.value;
  if (form.platform === "gemini") return geminiOAuth.sessionId.value;
  if (form.platform === "antigravity") return antigravityOAuth.sessionId.value;
  return oauth.sessionId.value;
});

const currentOAuthLoading = computed(() => {
  if (form.platform === "openai") return openaiOAuth.loading.value;
  if (form.platform === "gemini") return geminiOAuth.loading.value;
  if (form.platform === "antigravity") return antigravityOAuth.loading.value;
  return oauth.loading.value;
});

const currentOAuthError = computed(() => {
  if (form.platform === "openai") return openaiOAuth.error.value;
  if (form.platform === "gemini") return geminiOAuth.error.value;
  if (form.platform === "antigravity") return antigravityOAuth.error.value;
  return oauth.error.value;
});

// Refs
const oauthFlowRef = ref<OAuthFlowExposed | null>(null);

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
const step = ref(1);
const submitting = ref(false);
const accountCategory = ref<"oauth-based" | "apikey">("oauth-based"); // UI selection for account category
const addMethod = ref<AddMethod>("oauth"); // For oauth-based: 'oauth' or 'setup-token'
const apiKeyBaseUrl = ref("https://api.anthropic.com");
const apiKeyValue = ref("");
const modelMappings = ref<ModelMapping[]>([]);
const modelRestrictionMode = ref<"whitelist" | "mapping">("whitelist");
const allowedModels = ref<string[]>([]);
const customErrorCodesEnabled = ref(false);
const selectedErrorCodes = ref<number[]>([]);
const customErrorCodeInput = ref<number | null>(null);
const interceptWarmupRequests = ref(false);
const autoPauseOnExpired = ref(true);
const mixedScheduling = ref(false); // For antigravity accounts: enable mixed scheduling
const tempUnschedEnabled = ref(false);
const tempUnschedRules = ref<TempUnschedRuleForm[]>([]);
const geminiOAuthType = ref<"code_assist" | "google_one" | "ai_studio">(
  "google_one",
);
const geminiAIStudioOAuthEnabled = ref(false);
const showAdvancedOAuth = ref(false);
const showGeminiHelpDialog = ref(false);

// Quota control state (Anthropic OAuth/SetupToken only)
const windowCostEnabled = ref(false);
const windowCostLimit = ref<number | null>(null);
const windowCostStickyReserve = ref<number | null>(null);
const sessionLimitEnabled = ref(false);
const maxSessions = ref<number | null>(null);
const sessionIdleTimeout = ref<number | null>(null);
const tlsFingerprintEnabled = ref(false);
const sessionIdMaskingEnabled = ref(false);

// Gemini tier selection (used as fallback when auto-detection is unavailable/fails)
const geminiTierGoogleOne = ref<
  "google_one_free" | "google_ai_pro" | "google_ai_ultra"
>("google_one_free");
const geminiTierGcp = ref<"gcp_standard" | "gcp_enterprise">("gcp_standard");
const geminiTierAIStudio = ref<"aistudio_free" | "aistudio_paid">(
  "aistudio_free",
);

const geminiSelectedTier = computed(() => {
  if (form.platform !== "gemini") return "";
  if (accountCategory.value === "apikey") return geminiTierAIStudio.value;
  switch (geminiOAuthType.value) {
    case "google_one":
      return geminiTierGoogleOne.value;
    case "code_assist":
      return geminiTierGcp.value;
    default:
      return geminiTierAIStudio.value;
  }
});

const geminiQuotaDocs = {
  codeAssist:
    "https://developers.google.com/gemini-code-assist/resources/quotas",
  aiStudio: "https://ai.google.dev/pricing",
  vertex: "https://cloud.google.com/vertex-ai/generative-ai/docs/quotas",
};

const geminiHelpLinks = {
  apiKey: "https://aistudio.google.com/app/apikey",
  aiStudioPricing: "https://ai.google.dev/pricing",
  gcpProject: "https://console.cloud.google.com/welcome/new",
  geminiWebActivation: "https://gemini.google.com/gems/create?hl=en-US&pli=1",
  countryCheck: "https://policies.google.com/terms",
  countryChange: "https://policies.google.com/country-association-form",
};

// Computed: current preset mappings based on platform
const presetMappings = computed(() =>
  getPresetMappingsByPlatform(form.platform),
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

const form = reactive({
  name: "",
  notes: "",
  platform: "anthropic" as AccountPlatform,
  type: "oauth" as AccountType, // Will be 'oauth', 'setup-token', or 'apikey'
  credentials: {} as Record<string, unknown>,
  proxy_id: null as number | null,
  concurrency: 10,
  priority: 1,
  rate_multiplier: 1,
  group_ids: [] as number[],
  expires_at: null as number | null,
});

// Helper to check if current type needs OAuth flow
const isOAuthFlow = computed(() => accountCategory.value === "oauth-based");

const isManualInputMethod = computed(() => {
  return oauthFlowRef.value?.inputMethod === "manual";
});

const expiresAtInput = computed({
  get: () => formatDateTimeLocal(form.expires_at),
  set: (value: string) => {
    form.expires_at = parseDateTimeLocal(value);
  },
});

const canExchangeCode = computed(() => {
  const authCode = oauthFlowRef.value?.authCode || "";
  if (form.platform === "openai") {
    return (
      authCode.trim() &&
      openaiOAuth.sessionId.value &&
      !openaiOAuth.loading.value
    );
  }
  if (form.platform === "gemini") {
    return (
      authCode.trim() &&
      geminiOAuth.sessionId.value &&
      !geminiOAuth.loading.value
    );
  }
  if (form.platform === "antigravity") {
    return (
      authCode.trim() &&
      antigravityOAuth.sessionId.value &&
      !antigravityOAuth.loading.value
    );
  }
  return authCode.trim() && oauth.sessionId.value && !oauth.loading.value;
});

// Watchers
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      // Modal opened - fill related models
      allowedModels.value = [...getModelsByPlatform(form.platform)];
    } else {
      resetForm();
    }
  },
);

// Sync form.type based on accountCategory and addMethod
watch(
  [accountCategory, addMethod],
  ([category, method]) => {
    if (category === "oauth-based") {
      form.type = method as AccountType; // 'oauth' or 'setup-token'
    } else {
      form.type = "apikey";
    }
  },
  { immediate: true },
);

// Reset platform-specific settings when platform changes
watch(
  () => form.platform,
  (newPlatform) => {
    // Reset base URL based on platform
    apiKeyBaseUrl.value =
      newPlatform === "openai"
        ? "https://api.openai.com"
        : newPlatform === "gemini"
          ? "https://generativelanguage.googleapis.com"
          : "https://api.anthropic.com";
    // Clear model-related settings
    allowedModels.value = [];
    modelMappings.value = [];
    // Reset Anthropic-specific settings when switching to other platforms
    if (newPlatform !== "anthropic") {
      interceptWarmupRequests.value = false;
    }
    // Antigravity only supports OAuth
    if (newPlatform === "antigravity") {
      accountCategory.value = "oauth-based";
    }
    // Reset OAuth states
    oauth.resetState();
    openaiOAuth.resetState();
    geminiOAuth.resetState();
    antigravityOAuth.resetState();
  },
);

// Gemini AI Studio OAuth availability (requires operator-configured OAuth client)
watch(
  [() => props.show, () => form.platform, accountCategory],
  async ([show, platform, category]) => {
    if (!show || platform !== "gemini" || category !== "oauth-based") {
      geminiAIStudioOAuthEnabled.value = false;
      return;
    }
    const caps = await geminiOAuth.getCapabilities();
    geminiAIStudioOAuthEnabled.value = !!caps?.ai_studio_oauth_enabled;
    if (
      !geminiAIStudioOAuthEnabled.value &&
      geminiOAuthType.value === "ai_studio"
    ) {
      geminiOAuthType.value = "code_assist";
    }
  },
  { immediate: true },
);

const handleSelectGeminiOAuthType = (
  oauthType: "code_assist" | "google_one" | "ai_studio",
) => {
  if (oauthType === "ai_studio" && !geminiAIStudioOAuthEnabled.value) {
    appStore.showError(
      "AI Studio OAuth 未配置：请先设置 GEMINI_OAUTH_CLIENT_ID / GEMINI_OAUTH_CLIENT_SECRET，并在 Google OAuth Client 添加 Redirect URI：http://localhost:1455/auth/callback",
    );
    return;
  }
  geminiOAuthType.value = oauthType;
};

// Auto-fill related models when switching to whitelist mode or changing platform
watch([modelRestrictionMode, () => form.platform], ([newMode]) => {
  if (newMode === "whitelist") {
    allowedModels.value = [...getModelsByPlatform(form.platform)];
  }
});

// Model mapping helpers
const addModelMapping = () => {
  modelMappings.value.push({ from: "", to: "" });
};

const removeModelMapping = (index: number) => {
  modelMappings.value.splice(index, 1);
};

const addPresetMapping = (from: string, to: string) => {
  if (modelMappings.value.some((m) => m.from === from)) {
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

const splitTempUnschedKeywords = (value: string) => {
  return value
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

// Methods
const resetForm = () => {
  step.value = 1;
  form.name = "";
  form.notes = "";
  form.platform = "anthropic";
  form.type = "oauth";
  form.credentials = {};
  form.proxy_id = null;
  form.concurrency = 10;
  form.priority = 1;
  form.rate_multiplier = 1;
  form.group_ids = [];
  form.expires_at = null;
  accountCategory.value = "oauth-based";
  addMethod.value = "oauth";
  apiKeyBaseUrl.value = "https://api.anthropic.com";
  apiKeyValue.value = "";
  modelMappings.value = [];
  modelRestrictionMode.value = "whitelist";
  allowedModels.value = [...claudeModels]; // Default fill related models
  customErrorCodesEnabled.value = false;
  selectedErrorCodes.value = [];
  customErrorCodeInput.value = null;
  interceptWarmupRequests.value = false;
  autoPauseOnExpired.value = true;
  // Reset quota control state
  windowCostEnabled.value = false;
  windowCostLimit.value = null;
  windowCostStickyReserve.value = null;
  sessionLimitEnabled.value = false;
  maxSessions.value = null;
  sessionIdleTimeout.value = null;
  tlsFingerprintEnabled.value = false;
  sessionIdMaskingEnabled.value = false;
  tempUnschedEnabled.value = false;
  tempUnschedRules.value = [];
  geminiOAuthType.value = "code_assist";
  geminiTierGoogleOne.value = "google_one_free";
  geminiTierGcp.value = "gcp_standard";
  geminiTierAIStudio.value = "aistudio_free";
  oauth.resetState();
  openaiOAuth.resetState();
  geminiOAuth.resetState();
  antigravityOAuth.resetState();
  oauthFlowRef.value?.reset();
};

const handleClose = () => {
  emit("close");
};

const handleSubmit = async () => {
  // For OAuth-based type, handle OAuth flow (goes to step 2)
  if (isOAuthFlow.value) {
    if (!form.name.trim()) {
      appStore.showError("请输入账号名称");
      return;
    }
    step.value = 2;
    return;
  }

  // For apikey type, create directly
  if (!apiKeyValue.value.trim()) {
    appStore.showError("请输入 API Key");
    return;
  }

  // Determine default base URL based on platform
  const defaultBaseUrl =
    form.platform === "openai"
      ? "https://api.openai.com"
      : form.platform === "gemini"
        ? "https://generativelanguage.googleapis.com"
        : "https://api.anthropic.com";

  // Build credentials with optional model mapping
  const credentials: Record<string, unknown> = {
    base_url: apiKeyBaseUrl.value.trim() || defaultBaseUrl,
    api_key: apiKeyValue.value.trim(),
  };
  if (form.platform === "gemini") {
    credentials.tier_id = geminiTierAIStudio.value;
  }

  // Add model mapping if configured
  const modelMapping = buildModelMappingObject(
    modelRestrictionMode.value,
    allowedModels.value,
    modelMappings.value,
  );
  if (modelMapping) {
    credentials.model_mapping = modelMapping;
  }

  // Add custom error codes if enabled
  if (customErrorCodesEnabled.value) {
    credentials.custom_error_codes_enabled = true;
    credentials.custom_error_codes = [...selectedErrorCodes.value];
  }

  // Add intercept warmup requests setting
  if (interceptWarmupRequests.value) {
    credentials.intercept_warmup_requests = true;
  }
  if (!applyTempUnschedConfig(credentials)) {
    return;
  }

  form.credentials = credentials;

  submitting.value = true;
  try {
    await adminAPI.accounts.create({
      ...form,
      group_ids: form.group_ids,
      auto_pause_on_expired: autoPauseOnExpired.value,
    });
    appStore.showSuccess("账号创建成功");
    emit("created");
    handleClose();
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || "创建账号失败");
  } finally {
    submitting.value = false;
  }
};

const goBackToBasicInfo = () => {
  step.value = 1;
  oauth.resetState();
  openaiOAuth.resetState();
  geminiOAuth.resetState();
  antigravityOAuth.resetState();
  oauthFlowRef.value?.reset();
};

const handleGenerateUrl = async () => {
  if (form.platform === "openai") {
    await openaiOAuth.generateAuthUrl(form.proxy_id);
  } else if (form.platform === "gemini") {
    await geminiOAuth.generateAuthUrl(
      form.proxy_id,
      oauthFlowRef.value?.projectId,
      geminiOAuthType.value,
      geminiSelectedTier.value,
    );
  } else if (form.platform === "antigravity") {
    await antigravityOAuth.generateAuthUrl(form.proxy_id);
  } else {
    await oauth.generateAuthUrl(addMethod.value, form.proxy_id);
  }
};

const formatDateTimeLocal = formatDateTimeLocalInput;
const parseDateTimeLocal = parseDateTimeLocalInput;

// Create account and handle success/failure
const createAccountAndFinish = async (
  platform: AccountPlatform,
  type: AccountType,
  credentials: Record<string, unknown>,
  extra?: Record<string, unknown>,
) => {
  if (!applyTempUnschedConfig(credentials)) {
    return;
  }
  await adminAPI.accounts.create({
    name: form.name,
    notes: form.notes,
    platform,
    type,
    credentials,
    extra,
    proxy_id: form.proxy_id,
    concurrency: form.concurrency,
    priority: form.priority,
    rate_multiplier: form.rate_multiplier,
    group_ids: form.group_ids,
    expires_at: form.expires_at,
    auto_pause_on_expired: autoPauseOnExpired.value,
  });
  appStore.showSuccess("账号创建成功");
  emit("created");
  handleClose();
};

// OpenAI OAuth 授权码兑换
const handleOpenAIExchange = async (authCode: string) => {
  if (!authCode.trim() || !openaiOAuth.sessionId.value) return;

  openaiOAuth.loading.value = true;
  openaiOAuth.error.value = "";

  try {
    const tokenInfo = await openaiOAuth.exchangeAuthCode(
      authCode.trim(),
      openaiOAuth.sessionId.value,
      form.proxy_id,
    );
    if (!tokenInfo) return;

    const credentials = openaiOAuth.buildCredentials(tokenInfo);
    const extra = openaiOAuth.buildExtraInfo(tokenInfo);
    await createAccountAndFinish("openai", "oauth", credentials, extra);
  } catch (error: any) {
    openaiOAuth.error.value = error.response?.data?.detail || "授权失败";
    appStore.showError(openaiOAuth.error.value);
  } finally {
    openaiOAuth.loading.value = false;
  }
};

// Gemini OAuth 授权码兑换
const handleGeminiExchange = async (authCode: string) => {
  if (!authCode.trim() || !geminiOAuth.sessionId.value) return;

  geminiOAuth.loading.value = true;
  geminiOAuth.error.value = "";

  try {
    const stateFromInput = oauthFlowRef.value?.oauthState || "";
    const stateToUse = stateFromInput || geminiOAuth.state.value;
    if (!stateToUse) {
      geminiOAuth.error.value = "授权失败";
      appStore.showError(geminiOAuth.error.value);
      return;
    }

    const tokenInfo = await geminiOAuth.exchangeAuthCode({
      code: authCode.trim(),
      sessionId: geminiOAuth.sessionId.value,
      state: stateToUse,
      proxyId: form.proxy_id,
      oauthType: geminiOAuthType.value,
      tierId: geminiSelectedTier.value,
    });
    if (!tokenInfo) return;

    const credentials = geminiOAuth.buildCredentials(tokenInfo);
    const extra = geminiOAuth.buildExtraInfo(tokenInfo);
    await createAccountAndFinish("gemini", "oauth", credentials, extra);
  } catch (error: any) {
    geminiOAuth.error.value = error.response?.data?.detail || "授权失败";
    appStore.showError(geminiOAuth.error.value);
  } finally {
    geminiOAuth.loading.value = false;
  }
};

// Antigravity OAuth 授权码兑换
const handleAntigravityExchange = async (authCode: string) => {
  if (!authCode.trim() || !antigravityOAuth.sessionId.value) return;

  antigravityOAuth.loading.value = true;
  antigravityOAuth.error.value = "";

  try {
    const stateFromInput = oauthFlowRef.value?.oauthState || "";
    const stateToUse = stateFromInput || antigravityOAuth.state.value;
    if (!stateToUse) {
      antigravityOAuth.error.value = "授权失败";
      appStore.showError(antigravityOAuth.error.value);
      return;
    }

    const tokenInfo = await antigravityOAuth.exchangeAuthCode({
      code: authCode.trim(),
      sessionId: antigravityOAuth.sessionId.value,
      state: stateToUse,
      proxyId: form.proxy_id,
    });
    if (!tokenInfo) return;

    const credentials = antigravityOAuth.buildCredentials(tokenInfo);
    const extra = mixedScheduling.value
      ? { mixed_scheduling: true }
      : undefined;
    await createAccountAndFinish("antigravity", "oauth", credentials, extra);
  } catch (error: any) {
    antigravityOAuth.error.value = error.response?.data?.detail || "授权失败";
    appStore.showError(antigravityOAuth.error.value);
  } finally {
    antigravityOAuth.loading.value = false;
  }
};

// Anthropic OAuth 授权码兑换
const handleAnthropicExchange = async (authCode: string) => {
  if (!authCode.trim() || !oauth.sessionId.value) return;

  oauth.loading.value = true;
  oauth.error.value = "";

  try {
    const proxyConfig = form.proxy_id ? { proxy_id: form.proxy_id } : {};
    const endpoint =
      addMethod.value === "oauth"
        ? "/admin/accounts/exchange-code"
        : "/admin/accounts/exchange-setup-token-code";

    const tokenInfo = await adminAPI.accounts.exchangeCode(endpoint, {
      session_id: oauth.sessionId.value,
      code: authCode.trim(),
      ...proxyConfig,
    });

    // Build extra with quota control settings
    const baseExtra = oauth.buildExtraInfo(tokenInfo) || {};
    const extra: Record<string, unknown> = { ...baseExtra };

    // Add window cost limit settings
    if (
      windowCostEnabled.value &&
      windowCostLimit.value != null &&
      windowCostLimit.value > 0
    ) {
      extra.window_cost_limit = windowCostLimit.value;
      extra.window_cost_sticky_reserve = windowCostStickyReserve.value ?? 10;
    }

    // Add session limit settings
    if (
      sessionLimitEnabled.value &&
      maxSessions.value != null &&
      maxSessions.value > 0
    ) {
      extra.max_sessions = maxSessions.value;
      extra.session_idle_timeout_minutes = sessionIdleTimeout.value ?? 5;
    }

    // Add TLS fingerprint settings
    if (tlsFingerprintEnabled.value) {
      extra.enable_tls_fingerprint = true;
    }

    // Add session ID masking settings
    if (sessionIdMaskingEnabled.value) {
      extra.session_id_masking_enabled = true;
    }

    const credentials = {
      ...tokenInfo,
      ...(interceptWarmupRequests.value
        ? { intercept_warmup_requests: true }
        : {}),
    };
    await createAccountAndFinish(
      form.platform,
      addMethod.value as AccountType,
      credentials,
      extra,
    );
  } catch (error: any) {
    oauth.error.value = error.response?.data?.detail || "授权失败";
    appStore.showError(oauth.error.value);
  } finally {
    oauth.loading.value = false;
  }
};

// 主入口：根据平台路由到对应处理函数
const handleExchangeCode = async () => {
  const authCode = oauthFlowRef.value?.authCode || "";

  switch (form.platform) {
    case "openai":
      return handleOpenAIExchange(authCode);
    case "gemini":
      return handleGeminiExchange(authCode);
    case "antigravity":
      return handleAntigravityExchange(authCode);
    default:
      return handleAnthropicExchange(authCode);
  }
};

const handleCookieAuth = async (sessionKey: string) => {
  oauth.loading.value = true;
  oauth.error.value = "";

  try {
    const proxyConfig = form.proxy_id ? { proxy_id: form.proxy_id } : {};
    const keys = oauth.parseSessionKeys(sessionKey);

    if (keys.length === 0) {
      oauth.error.value = "请输入至少一个有效的 sessionKey";
      return;
    }

    const tempUnschedPayload = tempUnschedEnabled.value
      ? buildTempUnschedRules(tempUnschedRules.value)
      : [];
    if (tempUnschedEnabled.value && tempUnschedPayload.length === 0) {
      appStore.showError("请至少填写一条包含错误码、关键词和时长的规则。");
      return;
    }

    const endpoint =
      addMethod.value === "oauth"
        ? "/admin/accounts/cookie-auth"
        : "/admin/accounts/setup-token-cookie-auth";

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < keys.length; i++) {
      try {
        const tokenInfo = await adminAPI.accounts.exchangeCode(endpoint, {
          session_id: "",
          code: keys[i],
          ...proxyConfig,
        });

        // Build extra with quota control settings
        const baseExtra = oauth.buildExtraInfo(tokenInfo) || {};
        const extra: Record<string, unknown> = { ...baseExtra };

        // Add window cost limit settings
        if (
          windowCostEnabled.value &&
          windowCostLimit.value != null &&
          windowCostLimit.value > 0
        ) {
          extra.window_cost_limit = windowCostLimit.value;
          extra.window_cost_sticky_reserve =
            windowCostStickyReserve.value ?? 10;
        }

        // Add session limit settings
        if (
          sessionLimitEnabled.value &&
          maxSessions.value != null &&
          maxSessions.value > 0
        ) {
          extra.max_sessions = maxSessions.value;
          extra.session_idle_timeout_minutes = sessionIdleTimeout.value ?? 5;
        }

        // Add TLS fingerprint settings
        if (tlsFingerprintEnabled.value) {
          extra.enable_tls_fingerprint = true;
        }

        // Add session ID masking settings
        if (sessionIdMaskingEnabled.value) {
          extra.session_id_masking_enabled = true;
        }

        const accountName =
          keys.length > 1 ? `${form.name} #${i + 1}` : form.name;

        // Merge interceptWarmupRequests into credentials
        const credentials: Record<string, unknown> = {
          ...tokenInfo,
          ...(interceptWarmupRequests.value
            ? { intercept_warmup_requests: true }
            : {}),
        };
        if (tempUnschedEnabled.value) {
          credentials.temp_unschedulable_enabled = true;
          credentials.temp_unschedulable_rules = tempUnschedPayload;
        }

        await adminAPI.accounts.create({
          name: accountName,
          notes: form.notes,
          platform: form.platform,
          type: addMethod.value, // Use addMethod as type: 'oauth' or 'setup-token'
          credentials,
          extra,
          proxy_id: form.proxy_id,
          concurrency: form.concurrency,
          priority: form.priority,
          rate_multiplier: form.rate_multiplier,
          group_ids: form.group_ids,
          expires_at: form.expires_at,
          auto_pause_on_expired: autoPauseOnExpired.value,
        });

        successCount++;
      } catch (error: any) {
        failedCount++;
        errors.push(
          `密钥 ${i + 1}: ${error.response?.data?.detail || "授权失败"}`,
        );
      }
    }

    if (successCount > 0) {
      appStore.showSuccess(`成功创建 ${successCount} 个账号`);
      if (failedCount === 0) {
        emit("created");
        handleClose();
      } else {
        emit("created");
      }
    }

    if (failedCount > 0) {
      oauth.error.value = errors.join("\n");
    }
  } catch (error: any) {
    oauth.error.value = error.response?.data?.detail || "Cookie 授权失败";
  } finally {
    oauth.loading.value = false;
  }
};
</script>
