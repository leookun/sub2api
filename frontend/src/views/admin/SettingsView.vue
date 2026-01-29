<template>
  <AppLayout>
    <div class="mx-auto max-w-4xl space-y-6">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600"></div>
      </div>

      <!-- Settings Form -->
      <form v-else class="space-y-6" @submit.prevent="saveSettings">
        <!-- Admin API Key Settings -->
        <div class="card">
          <div class="border-b border-gray-100 px-6 py-4 dark:border-dark-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ '管理员 API Key' }}
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ '用于外部系统集成的全局 API Key，拥有完整的管理员权限' }}
            </p>
          </div>
          <div class="space-y-4 p-6">
            <!-- Security Warning -->
            <div
              class="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"
            >
              <div class="flex items-start">
                <Icon
                  name="exclamationTriangle"
                  size="md"
                  class="mt-0.5 flex-shrink-0 text-amber-500"
                />
                <p class="ml-3 text-sm text-amber-700 dark:text-amber-300">
                  {{ '警告：此密钥拥有完整的管理员权限，请妥善保管。' }}
                </p>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="adminApiKeyLoading" class="flex items-center gap-2 text-gray-500">
              <div class="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-600"></div>
              {{ '加载中...' }}
            </div>

            <!-- No Key Configured -->
            <div v-else-if="!adminApiKeyExists" class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400">
                {{ '尚未配置管理员 API Key' }}
              </span>
              <button
                type="button"
                :disabled="adminApiKeyOperating"
                class="btn btn-primary btn-sm"
                @click="createAdminApiKey"
              >
                <svg
                  v-if="adminApiKeyOperating"
                  class="mr-1 h-4 w-4 animate-spin"
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
                {{
                  adminApiKeyOperating
                    ? '创建中...'
                    : '创建密钥'
                }}
              </button>
            </div>

            <!-- Key Exists -->
            <div v-else class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ '当前密钥' }}
                  </label>
                  <code
                    class="rounded bg-gray-100 px-2 py-1 font-mono text-sm text-gray-900 dark:bg-dark-700 dark:text-gray-100"
                  >
                    {{ adminApiKeyMasked }}
                  </code>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    :disabled="adminApiKeyOperating"
                    class="btn btn-secondary btn-sm"
                    @click="regenerateAdminApiKey"
                  >
                    {{
                      adminApiKeyOperating
                        ? '生成中...'
                        : '重新生成'
                    }}
                  </button>
                  <button
                    type="button"
                    :disabled="adminApiKeyOperating"
                    class="btn btn-secondary btn-sm text-red-600 hover:text-red-700 dark:text-red-400"
                    @click="deleteAdminApiKey"
                  >
                    {{ '删除' }}
                  </button>
                </div>
              </div>

              <!-- Newly Generated Key Display -->
              <div
                v-if="newAdminApiKey"
                class="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
              >
                <p class="text-sm font-medium text-green-700 dark:text-green-300">
                  {{ '此密钥仅显示一次，请立即复制保存。' }}
                </p>
                <div class="flex items-center gap-2">
                  <code
                    class="flex-1 select-all break-all rounded border border-green-300 bg-white px-3 py-2 font-mono text-sm dark:border-green-700 dark:bg-dark-800"
                  >
                    {{ newAdminApiKey }}
                  </code>
                  <button
                    type="button"
                    class="btn btn-primary btn-sm flex-shrink-0"
                    @click="copyNewKey"
                  >
                    {{ '复制密钥' }}
                  </button>
                </div>
                <p class="text-xs text-green-600 dark:text-green-400">
                  {{ '使用方法：在请求头中添加 x-api-key: <your-admin-api-key>' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Stream Timeout Settings -->
        <div class="card">
          <div class="border-b border-gray-100 px-6 py-4 dark:border-dark-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ '流超时处理' }}
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ '配置上游响应超时时的账户处理策略，避免问题账户持续被选中' }}
            </p>
          </div>
          <div class="space-y-5 p-6">
            <!-- Loading State -->
            <div v-if="streamTimeoutLoading" class="flex items-center gap-2 text-gray-500">
              <div class="h-4 w-4 animate-spin rounded-full border-b-2 border-primary-600"></div>
              {{ '加载中...' }}
            </div>

            <template v-else>
              <!-- Enable Stream Timeout -->
              <div class="flex items-center justify-between">
                <div>
                  <label class="font-medium text-gray-900 dark:text-white">{{
                    '启用流超时处理'
                  }}</label>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ '当上游响应超时时，自动处理问题账户' }}
                  </p>
                </div>
                <Toggle v-model="streamTimeoutForm.enabled" />
              </div>

              <!-- Settings - Only show when enabled -->
              <div
                v-if="streamTimeoutForm.enabled"
                class="space-y-4 border-t border-gray-100 pt-4 dark:border-dark-700"
              >
                <!-- Action -->
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ '处理方式' }}
                  </label>
                  <select v-model="streamTimeoutForm.action" class="input w-64">
                    <option value="temp_unsched">{{ '临时不可调度' }}</option>
                    <option value="error">{{ '标记为错误状态' }}</option>
                    <option value="none">{{ '不处理' }}</option>
                  </select>
                  <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {{ '超时后对账户执行的操作' }}
                  </p>
                </div>

                <!-- Temp Unsched Minutes (only show when action is temp_unsched) -->
                <div v-if="streamTimeoutForm.action === 'temp_unsched'">
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ '暂停时长（分钟）' }}
                  </label>
                  <input
                    v-model.number="streamTimeoutForm.temp_unsched_minutes"
                    type="number"
                    min="1"
                    max="60"
                    class="input w-32"
                  />
                  <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {{ '临时不可调度的持续时间（1-60分钟）' }}
                  </p>
                </div>

                <!-- Threshold Count -->
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ '触发阈值（次数）' }}
                  </label>
                  <input
                    v-model.number="streamTimeoutForm.threshold_count"
                    type="number"
                    min="1"
                    max="10"
                    class="input w-32"
                  />
                  <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {{ '累计超时多少次后触发处理（1-10次）' }}
                  </p>
                </div>

                <!-- Threshold Window Minutes -->
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ '阈值窗口（分钟）' }}
                  </label>
                  <input
                    v-model.number="streamTimeoutForm.threshold_window_minutes"
                    type="number"
                    min="1"
                    max="60"
                    class="input w-32"
                  />
                  <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {{ '超时计数的时间窗口（1-60分钟）' }}
                  </p>
                </div>
              </div>

              <!-- Save Button -->
              <div class="flex justify-end border-t border-gray-100 pt-4 dark:border-dark-700">
                <button
                  type="button"
                  :disabled="streamTimeoutSaving"
                  class="btn btn-primary btn-sm"
                  @click="saveStreamTimeoutSettings"
                >
                  <svg
                    v-if="streamTimeoutSaving"
                    class="mr-1 h-4 w-4 animate-spin"
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
                  {{ streamTimeoutSaving ? '保存中...' : '保存' }}
                </button>
              </div>
            </template>
          </div>
        </div>

        <!-- Registration Settings -->
        <div class="card">
          <div class="border-b border-gray-100 px-6 py-4 dark:border-dark-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ '注册设置' }}
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ '控制用户注册和验证' }}
            </p>
          </div>
          <div class="space-y-5 p-6">
            <!-- Enable Registration -->
            <div class="flex items-center justify-between">
              <div>
                <label class="font-medium text-gray-900 dark:text-white">{{
                  '开放注册'
                }}</label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ '允许新用户注册' }}
                </p>
              </div>
              <Toggle v-model="form.registration_enabled" />
            </div>

            <!-- Email Verification -->
            <div
              class="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-dark-700"
            >
              <div>
                <label class="font-medium text-gray-900 dark:text-white">{{
                  '邮箱验证'
                }}</label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ '新用户注册时需要验证邮箱' }}
                </p>
              </div>
              <Toggle v-model="form.email_verify_enabled" />
            </div>

            <!-- Promo Code -->
            <div
              class="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-dark-700"
            >
              <div>
                <label class="font-medium text-gray-900 dark:text-white">{{
                  '优惠码'
                }}</label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ '允许用户在注册时使用优惠码' }}
                </p>
              </div>
              <Toggle v-model="form.promo_code_enabled" />
            </div>

            <!-- Password Reset - Only show when email verification is enabled -->
            <div
              v-if="form.email_verify_enabled"
              class="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-dark-700"
            >
              <div>
                <label class="font-medium text-gray-900 dark:text-white">{{
                  '忘记密码'
                }}</label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ '允许用户通过邮箱重置密码' }}
                </p>
              </div>
              <Toggle v-model="form.password_reset_enabled" />
            </div>

            <!-- TOTP 2FA -->
            <div
              class="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-dark-700"
            >
              <div>
                <label class="font-medium text-gray-900 dark:text-white">{{
                  '双因素认证 (2FA)'
                }}</label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ '允许用户使用 Google Authenticator 等应用进行二次验证' }}
                </p>
                <!-- Warning when encryption key not configured -->
                <p
                  v-if="!form.totp_encryption_key_configured"
                  class="mt-2 text-sm text-amber-600 dark:text-amber-400"
                >
                  {{ '请先在环境变量中配置 TOTP_ENCRYPTION_KEY。使用命令 openssl rand -hex 32 生成密钥。' }}
                </p>
              </div>
              <Toggle
                v-model="form.totp_enabled"
                :disabled="!form.totp_encryption_key_configured"
              />
            </div>
          </div>
        </div>

        <!-- Cloudflare Turnstile Settings -->
        <div class="card">
          <div class="border-b border-gray-100 px-6 py-4 dark:border-dark-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ 'Cloudflare Turnstile' }}
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ '登录和注册的机器人防护' }}
            </p>
          </div>
          <div class="space-y-5 p-6">
            <!-- Enable Turnstile -->
            <div class="flex items-center justify-between">
              <div>
                <label class="font-medium text-gray-900 dark:text-white">{{
                  '启用 Turnstile'
                }}</label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ '需要 Cloudflare Turnstile 验证' }}
                </p>
              </div>
              <Toggle v-model="form.turnstile_enabled" />
            </div>

            <!-- Turnstile Keys - Only show when enabled -->
            <div
              v-if="form.turnstile_enabled"
              class="border-t border-gray-100 pt-4 dark:border-dark-700"
            >
              <div class="grid grid-cols-1 gap-6">
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ '站点密钥' }}
                  </label>
                  <input
                    v-model="form.turnstile_site_key"
                    type="text"
                    class="input font-mono text-sm"
                    placeholder="0x4AAAAAAA..."
                  />
                  <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {{ '从 Cloudflare Dashboard 获取' }}
                    <a
                      href="https://dash.cloudflare.com/"
                      target="_blank"
                      class="text-primary-600 hover:text-primary-500"
                      >{{ 'Cloudflare Dashboard' }}</a
                    >
                  </p>
                </div>
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ '私密密钥' }}
                  </label>
                  <input
                    v-model="form.turnstile_secret_key"
                    type="password"
                    class="input font-mono text-sm"
                    placeholder="0x4AAAAAAA..."
                  />
                  <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {{
                      form.turnstile_secret_key_configured
                        ? '密钥已配置，留空以保留当前值。'
                        : '服务端验证密钥（请保密）'
                    }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- LinuxDo Connect OAuth 登录 -->
        <div class="card">
          <div class="border-b border-gray-100 px-6 py-4 dark:border-dark-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ 'LinuxDo Connect 登录' }}
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ '配置 LinuxDo Connect OAuth，用于 Sub2API 用户登录' }}
            </p>
          </div>
          <div class="space-y-5 p-6">
            <div class="flex items-center justify-between">
              <div>
                <label class="font-medium text-gray-900 dark:text-white">{{
                  '启用 LinuxDo 登录'
                }}</label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ '在登录/注册页面显示 LinuxDo 登录入口' }}
                </p>
              </div>
              <Toggle v-model="form.linuxdo_connect_enabled" />
            </div>

            <div
              v-if="form.linuxdo_connect_enabled"
              class="border-t border-gray-100 pt-4 dark:border-dark-700"
            >
              <div class="grid grid-cols-1 gap-6">
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ 'Client ID' }}
                  </label>
                  <input
                    v-model="form.linuxdo_connect_client_id"
                    type="text"
                    class="input font-mono text-sm"
                    :placeholder="'例如：hprJ5pC3...'"
                  />
                  <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {{ '从 Connect.Linux.Do 后台获取' }}
                  </p>
                </div>

                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ 'Client Secret' }}
                  </label>
                  <input
                    v-model="form.linuxdo_connect_client_secret"
                    type="password"
                    class="input font-mono text-sm"
                    :placeholder="
                      form.linuxdo_connect_client_secret_configured
                        ? '********'
                        : '********'
                    "
                  />
                  <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {{
                      form.linuxdo_connect_client_secret_configured
                        ? '密钥已配置，留空以保留当前值。'
                        : '用于后端交换 token（请保密）'
                    }}
                  </p>
                </div>

                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ '回调地址（Redirect URL）' }}
                  </label>
                  <input
                    v-model="form.linuxdo_connect_redirect_url"
                    type="url"
                    class="input font-mono text-sm"
                    :placeholder="'https://your-domain.com/api/v1/auth/oauth/linuxdo/callback'"
                  />
                  <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <button
                      type="button"
                      class="btn btn-secondary btn-sm w-fit"
                      @click="setAndCopyLinuxdoRedirectUrl"
                    >
                      {{ '使用当前站点生成并复制' }}
                    </button>
                    <code
                      v-if="linuxdoRedirectUrlSuggestion"
                      class="select-all break-all rounded bg-gray-50 px-2 py-1 font-mono text-xs text-gray-600 dark:bg-dark-800 dark:text-gray-300"
                    >
                      {{ linuxdoRedirectUrlSuggestion }}
                    </code>
                  </div>
                  <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {{ '需与 Connect.Linux.Do 中配置的回调地址一致（必须是 http(s) 完整 URL）' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Default Settings -->
        <div class="card">
          <div class="border-b border-gray-100 px-6 py-4 dark:border-dark-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ '用户默认设置' }}
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ '新用户的默认值' }}
            </p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ '默认余额' }}
                </label>
                <input
                  v-model.number="form.default_balance"
                  type="number"
                  step="0.01"
                  min="0"
                  class="input"
                  placeholder="0.00"
                />
                <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ '新用户的初始余额' }}
                </p>
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ '默认并发数' }}
                </label>
                <input
                  v-model.number="form.default_concurrency"
                  type="number"
                  min="1"
                  class="input"
                  placeholder="1"
                />
                <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ '新用户的最大并发请求数' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Site Settings -->
        <div class="card">
          <div class="border-b border-gray-100 px-6 py-4 dark:border-dark-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ '站点设置' }}
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ '自定义站点品牌' }}
            </p>
          </div>
          <div class="space-y-6 p-6">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ '站点名称' }}
                </label>
                <input
                  v-model="form.site_name"
                  type="text"
                  class="input"
                  :placeholder="'Sub2API'"
                />
                <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ '显示在邮件和页面标题中' }}
                </p>
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ '站点副标题' }}
                </label>
                <input
                  v-model="form.site_subtitle"
                  type="text"
                  class="input"
                  :placeholder="'订阅转 API 转换平台'"
                />
                <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {{ '显示在登录和注册页面' }}
                </p>
              </div>
            </div>

            <!-- API Base URL -->
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ 'API 端点地址' }}
              </label>
              <input
                v-model="form.api_base_url"
                type="text"
                class="input font-mono text-sm"
                :placeholder="'https://api.example.com'"
              />
              <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {{ '用于"使用密钥"和"导入到 CC Switch"功能，留空则使用当前站点地址' }}
              </p>
            </div>

            <!-- Contact Info -->
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ '客服联系方式' }}
              </label>
              <input
                v-model="form.contact_info"
                type="text"
                class="input"
                :placeholder="'例如：QQ: 123456789'"
              />
              <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {{ '填写客服联系方式，将展示在兑换页面、个人资料等位置' }}
              </p>
            </div>

            <!-- Doc URL -->
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ '文档链接' }}
              </label>
              <input
                v-model="form.doc_url"
                type="url"
                class="input font-mono text-sm"
                :placeholder="'https://docs.example.com'"
              />
              <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {{ '文档网站的链接。留空则隐藏文档链接。' }}
              </p>
            </div>

            <!-- Site Logo Upload -->
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ '站点Logo' }}
              </label>
              <div class="flex items-start gap-6">
                <!-- Logo Preview -->
                <div class="flex-shrink-0">
                  <div
                    class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:border-dark-600 dark:bg-dark-800"
                    :class="{ 'border-solid': form.site_logo }"
                  >
                    <img
                      v-if="form.site_logo"
                      :src="form.site_logo"
                      alt="Site Logo"
                      class="h-full w-full object-contain"
                    />
                    <svg
                      v-else
                      class="h-8 w-8 text-gray-400 dark:text-dark-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <!-- Upload Controls -->
                <div class="flex-1 space-y-3">
                  <div class="flex items-center gap-3">
                    <label class="btn btn-secondary btn-sm cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        @change="handleLogoUpload"
                      />
                      <Icon name="upload" size="sm" class="mr-1.5" :stroke-width="2" />
                      {{ '上传图片' }}
                    </label>
                    <button
                      v-if="form.site_logo"
                      type="button"
                      class="btn btn-secondary btn-sm text-red-600 hover:text-red-700 dark:text-red-400"
                      @click="form.site_logo = ''"
                    >
                      <Icon name="trash" size="sm" class="mr-1.5" :stroke-width="2" />
                      {{ '移除' }}
                    </button>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ 'PNG、JPG 或 SVG 格式，最大 300KB。建议：80x80px 正方形图片。' }}
                  </p>
                  <p v-if="logoError" class="text-xs text-red-500">{{ logoError }}</p>
                </div>
              </div>
            </div>

            <!-- Home Content -->
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ '首页内容' }}
              </label>
              <textarea
                v-model="form.home_content"
                rows="6"
                class="input font-mono text-sm"
                :placeholder="'在此输入首页内容，支持 Markdown & HTML 代码。如果输入的是一个链接，则会使用该链接作为 iframe 的 src 属性。'"
              ></textarea>
              <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {{ '自定义首页内容，支持 Markdown/HTML。如果输入的是链接（以 http:// 或 https:// 开头），则会使用该链接作为 iframe 的 src 属性，这允许你设置任意网页作为首页。设置后首页的状态信息将不再显示。' }}
              </p>
              <!-- iframe CSP Warning -->
              <p class="mt-2 text-xs text-amber-600 dark:text-amber-400">
                {{ '⚠️ iframe 模式提示：部分网站设置了 X-Frame-Options 或 CSP 安全策略，禁止被嵌入到 iframe 中。如果页面显示空白或报错，请确认目标网站允许被嵌入，或考虑使用 HTML 模式自行构建页面内容。' }}
              </p>
            </div>

            <!-- Hide CCS Import Button -->
            <div
              class="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-dark-700"
            >
              <div>
                <label class="font-medium text-gray-900 dark:text-white">{{
                  '隐藏 CCS 导入按钮'
                }}</label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ '启用后将在 API Keys 页面隐藏"导入 CCS"按钮' }}
                </p>
              </div>
              <Toggle v-model="form.hide_ccs_import_button" />
            </div>
          </div>
        </div>

        <!-- SMTP Settings - Only show when email verification is enabled -->
        <div v-if="form.email_verify_enabled" class="card">
          <div
            class="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-dark-700"
          >
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ 'SMTP 设置' }}
              </h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ '配置用于发送验证码的邮件服务' }}
              </p>
            </div>
            <button
              type="button"
              :disabled="testingSmtp"
              class="btn btn-secondary btn-sm"
              @click="testSmtpConnection"
            >
              <svg v-if="testingSmtp" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
              {{
                testingSmtp
                  ? '测试中...'
                  : '测试连接'
              }}
            </button>
          </div>
          <div class="space-y-6 p-6">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ 'SMTP 主机' }}
                </label>
                <input
                  v-model="form.smtp_host"
                  type="text"
                  class="input"
                  :placeholder="'smtp.gmail.com'"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ 'SMTP 端口' }}
                </label>
                <input
                  v-model.number="form.smtp_port"
                  type="number"
                  min="1"
                  max="65535"
                  class="input"
                  :placeholder="'587'"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ 'SMTP 用户名' }}
                </label>
                <input
                  v-model="form.smtp_username"
                  type="text"
                  class="input"
                  placeholder="your-email@gmail.com"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ 'SMTP 密码' }}
                </label>
                <input
                  v-model="form.smtp_password"
                  type="password"
                  class="input"
                  :placeholder="
                    form.smtp_password_configured
                      ? '********'
                      : '********'
                  "
                />
                <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {{
                    form.smtp_password_configured
                      ? '密码已配置，留空以保留当前值。'
                      : '留空以保留现有密码'
                  }}
                </p>
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ '发件人邮箱' }}
                </label>
                <input
                  v-model="form.smtp_from_email"
                  type="email"
                  class="input"
                  placeholder="noreply@example.com"
                />
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ '发件人名称' }}
                </label>
                <input
                  v-model="form.smtp_from_name"
                  type="text"
                  class="input"
                  :placeholder="'Sub2API'"
                />
              </div>
            </div>

            <!-- Use TLS Toggle -->
            <div
              class="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-dark-700"
            >
              <div>
                <label class="font-medium text-gray-900 dark:text-white">{{
                  '使用 TLS'
                }}</label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ '为 SMTP 连接启用 TLS 加密' }}
                </p>
              </div>
              <Toggle v-model="form.smtp_use_tls" />
            </div>
          </div>
        </div>

        <!-- Purchase Subscription Page -->
        <div class="card">
          <div class="border-b border-gray-100 px-6 py-4 dark:border-dark-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ '购买订阅页面' }}
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ '在侧边栏展示“购买订阅”入口，并在页面内通过 iframe 打开指定链接' }}
            </p>
          </div>
          <div class="space-y-6 p-6">
            <!-- Enable Toggle -->
            <div class="flex items-center justify-between">
              <div>
                <label class="font-medium text-gray-900 dark:text-white">{{
                  '显示购买订阅入口'
                }}</label>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ '仅在标准模式（非简单模式）下展示' }}
                </p>
              </div>
              <Toggle v-model="form.purchase_subscription_enabled" />
            </div>

            <!-- URL -->
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ '购买页面 URL' }}
              </label>
              <input
                v-model="form.purchase_subscription_url"
                type="url"
                class="input font-mono text-sm"
                :placeholder="'https://example.com/purchase'"
              />
              <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {{ '必须是完整的 http(s) 链接' }}
              </p>
              <p class="mt-2 text-xs text-amber-600 dark:text-amber-400">
                {{ '⚠️ iframe 提示：部分网站会通过 X-Frame-Options 或 CSP（frame-ancestors）禁止被 iframe 嵌入，出现空白时可引导用户使用“新窗口打开”。' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Send Test Email - Only show when email verification is enabled -->
        <div v-if="form.email_verify_enabled" class="card">
          <div class="border-b border-gray-100 px-6 py-4 dark:border-dark-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ '发送测试邮件' }}
            </h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ '发送测试邮件以验证 SMTP 配置' }}
            </p>
          </div>
          <div class="p-6">
            <div class="flex items-end gap-4">
              <div class="flex-1">
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ '收件人邮箱' }}
                </label>
                <input
                  v-model="testEmailAddress"
                  type="email"
                  class="input"
                  placeholder="test@example.com"
                />
              </div>
              <button
                type="button"
                :disabled="sendingTestEmail || !testEmailAddress"
                class="btn btn-secondary"
                @click="sendTestEmail"
              >
                <svg
                  v-if="sendingTestEmail"
                  class="h-4 w-4 animate-spin"
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
                {{
                  sendingTestEmail
                    ? '发送中...'
                    : '发送测试邮件'
                }}
              </button>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end">
          <button type="submit" :disabled="saving" class="btn btn-primary">
            <svg v-if="saving" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
            {{ saving ? '保存中...' : '保存设置' }}
          </button>
        </div>
      </form>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { adminAPI } from '@/api'
import type { SystemSettings, UpdateSettingsRequest } from '@/api/admin/settings'
import AppLayout from '@/components/layout/AppLayout.vue'
import Icon from '@/components/icons/Icon.vue'
import Toggle from '@/components/common/Toggle.vue'
import { useClipboard } from '@/composables/useClipboard'
import { useAppStore } from '@/stores'

const appStore = useAppStore()
const { copyToClipboard } = useClipboard()

const loading = ref(true)
const saving = ref(false)
const testingSmtp = ref(false)
const sendingTestEmail = ref(false)
const testEmailAddress = ref('')
const logoError = ref('')

// Admin API Key 状态
const adminApiKeyLoading = ref(true)
const adminApiKeyExists = ref(false)
const adminApiKeyMasked = ref('')
const adminApiKeyOperating = ref(false)
const newAdminApiKey = ref('')

// Stream Timeout 状态
const streamTimeoutLoading = ref(true)
const streamTimeoutSaving = ref(false)
const streamTimeoutForm = reactive({
  enabled: true,
  action: 'temp_unsched' as 'temp_unsched' | 'error' | 'none',
  temp_unsched_minutes: 5,
  threshold_count: 3,
  threshold_window_minutes: 10
})

type SettingsForm = SystemSettings & {
  smtp_password: string
  turnstile_secret_key: string
  linuxdo_connect_client_secret: string
}

const form = reactive<SettingsForm>({
  registration_enabled: true,
  email_verify_enabled: false,
  promo_code_enabled: true,
  password_reset_enabled: false,
  totp_enabled: false,
  totp_encryption_key_configured: false,
  default_balance: 0,
  default_concurrency: 1,
  site_name: 'Sub2API',
  site_logo: '',
  site_subtitle: 'Subscription to API Conversion Platform',
  api_base_url: '',
  contact_info: '',
  doc_url: '',
  home_content: '',
  hide_ccs_import_button: false,
  purchase_subscription_enabled: false,
  purchase_subscription_url: '',
  smtp_host: '',
  smtp_port: 587,
  smtp_username: '',
  smtp_password: '',
  smtp_password_configured: false,
  smtp_from_email: '',
  smtp_from_name: '',
  smtp_use_tls: true,
  // Cloudflare Turnstile
  turnstile_enabled: false,
  turnstile_site_key: '',
  turnstile_secret_key: '',
  turnstile_secret_key_configured: false,
  // LinuxDo Connect OAuth 登录
  linuxdo_connect_enabled: false,
  linuxdo_connect_client_id: '',
  linuxdo_connect_client_secret: '',
  linuxdo_connect_client_secret_configured: false,
  linuxdo_connect_redirect_url: '',
  // Model fallback
  enable_model_fallback: false,
  fallback_model_anthropic: 'claude-3-5-sonnet-20241022',
  fallback_model_openai: 'gpt-4o',
  fallback_model_gemini: 'gemini-2.5-pro',
  fallback_model_antigravity: 'gemini-2.5-pro',
  // Identity patch (Claude -> Gemini)
  enable_identity_patch: true,
  identity_patch_prompt: '',
  // Ops monitoring (vNext)
  ops_monitoring_enabled: true,
  ops_realtime_monitoring_enabled: true,
  ops_query_mode_default: 'auto',
  ops_metrics_interval_seconds: 60
})

// LinuxDo OAuth redirect URL suggestion
const linuxdoRedirectUrlSuggestion = computed(() => {
  if (typeof window === 'undefined') return ''
  const origin =
    window.location.origin || `${window.location.protocol}//${window.location.host}`
  return `${origin}/api/v1/auth/oauth/linuxdo/callback`
})

async function setAndCopyLinuxdoRedirectUrl() {
  const url = linuxdoRedirectUrlSuggestion.value
  if (!url) return

  form.linuxdo_connect_redirect_url = url
  await copyToClipboard(url, '已使用当前站点生成回调地址并复制到剪贴板')
}

function handleLogoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  logoError.value = ''

  if (!file) return

  // Check file size (300KB = 307200 bytes)
  const maxSize = 300 * 1024
  if (file.size > maxSize) {
    logoError.value = `图片大小超过 300KB 限制（${(file.size / 1024).toFixed(1)}KB）`
    input.value = ''
    return
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    logoError.value = '请选择图片文件'
    input.value = ''
    return
  }

  // Convert to base64
  const reader = new FileReader()
  reader.onload = (e) => {
    form.site_logo = e.target?.result as string
  }
  reader.onerror = () => {
    logoError.value = '读取图片文件失败'
  }
  reader.readAsDataURL(file)

  // Reset input
  input.value = ''
}

async function loadSettings() {
  loading.value = true
  try {
    const settings = await adminAPI.settings.getSettings()
    Object.assign(form, settings)
    form.smtp_password = ''
    form.turnstile_secret_key = ''
    form.linuxdo_connect_client_secret = ''
  } catch (error: any) {
    appStore.showError(
      '加载设置失败' + ': ' + (error.message || '发生未知错误')
    )
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    const payload: UpdateSettingsRequest = {
      registration_enabled: form.registration_enabled,
      email_verify_enabled: form.email_verify_enabled,
      promo_code_enabled: form.promo_code_enabled,
      password_reset_enabled: form.password_reset_enabled,
      totp_enabled: form.totp_enabled,
      default_balance: form.default_balance,
      default_concurrency: form.default_concurrency,
      site_name: form.site_name,
      site_logo: form.site_logo,
      site_subtitle: form.site_subtitle,
      api_base_url: form.api_base_url,
      contact_info: form.contact_info,
      doc_url: form.doc_url,
      home_content: form.home_content,
      hide_ccs_import_button: form.hide_ccs_import_button,
      purchase_subscription_enabled: form.purchase_subscription_enabled,
      purchase_subscription_url: form.purchase_subscription_url,
      smtp_host: form.smtp_host,
      smtp_port: form.smtp_port,
      smtp_username: form.smtp_username,
      smtp_password: form.smtp_password || undefined,
      smtp_from_email: form.smtp_from_email,
      smtp_from_name: form.smtp_from_name,
      smtp_use_tls: form.smtp_use_tls,
      turnstile_enabled: form.turnstile_enabled,
      turnstile_site_key: form.turnstile_site_key,
      turnstile_secret_key: form.turnstile_secret_key || undefined,
      linuxdo_connect_enabled: form.linuxdo_connect_enabled,
      linuxdo_connect_client_id: form.linuxdo_connect_client_id,
      linuxdo_connect_client_secret: form.linuxdo_connect_client_secret || undefined,
      linuxdo_connect_redirect_url: form.linuxdo_connect_redirect_url,
      enable_model_fallback: form.enable_model_fallback,
      fallback_model_anthropic: form.fallback_model_anthropic,
      fallback_model_openai: form.fallback_model_openai,
      fallback_model_gemini: form.fallback_model_gemini,
      fallback_model_antigravity: form.fallback_model_antigravity,
      enable_identity_patch: form.enable_identity_patch,
      identity_patch_prompt: form.identity_patch_prompt
    }
    const updated = await adminAPI.settings.updateSettings(payload)
    Object.assign(form, updated)
    form.smtp_password = ''
    form.turnstile_secret_key = ''
    form.linuxdo_connect_client_secret = ''
    // Refresh cached public settings so sidebar/header update immediately
    await appStore.fetchPublicSettings(true)
    appStore.showSuccess('设置保存成功')
  } catch (error: any) {
    appStore.showError(
      '保存设置失败' + ': ' + (error.message || '发生未知错误')
    )
  } finally {
    saving.value = false
  }
}

async function testSmtpConnection() {
  testingSmtp.value = true
  try {
    const result = await adminAPI.settings.testSmtpConnection({
      smtp_host: form.smtp_host,
      smtp_port: form.smtp_port,
      smtp_username: form.smtp_username,
      smtp_password: form.smtp_password,
      smtp_use_tls: form.smtp_use_tls
    })
    // API returns { message: "..." } on success, errors are thrown as exceptions
    appStore.showSuccess(result.message || 'SMTP 连接成功')
  } catch (error: any) {
    appStore.showError(
      'SMTP 连接测试失败' + ': ' + (error.message || '发生未知错误')
    )
  } finally {
    testingSmtp.value = false
  }
}

async function sendTestEmail() {
  if (!testEmailAddress.value) {
    appStore.showError('请输入收件人邮箱地址')
    return
  }

  sendingTestEmail.value = true
  try {
    const result = await adminAPI.settings.sendTestEmail({
      email: testEmailAddress.value,
      smtp_host: form.smtp_host,
      smtp_port: form.smtp_port,
      smtp_username: form.smtp_username,
      smtp_password: form.smtp_password,
      smtp_from_email: form.smtp_from_email,
      smtp_from_name: form.smtp_from_name,
      smtp_use_tls: form.smtp_use_tls
    })
    // API returns { message: "..." } on success, errors are thrown as exceptions
    appStore.showSuccess(result.message || '测试邮件发送成功')
  } catch (error: any) {
    appStore.showError(
      '发送测试邮件失败' + ': ' + (error.message || '发生未知错误')
    )
  } finally {
    sendingTestEmail.value = false
  }
}

// Admin API Key 方法
async function loadAdminApiKey() {
  adminApiKeyLoading.value = true
  try {
    const status = await adminAPI.settings.getAdminApiKey()
    adminApiKeyExists.value = status.exists
    adminApiKeyMasked.value = status.masked_key
  } catch (error: any) {
    console.error('Failed to load admin API key status:', error)
  } finally {
    adminApiKeyLoading.value = false
  }
}

async function createAdminApiKey() {
  adminApiKeyOperating.value = true
  try {
    const result = await adminAPI.settings.regenerateAdminApiKey()
    newAdminApiKey.value = result.key
    adminApiKeyExists.value = true
    adminApiKeyMasked.value = result.key.substring(0, 10) + '...' + result.key.slice(-4)
    appStore.showSuccess('新的管理员 API Key 已生成')
  } catch (error: any) {
    appStore.showError(error.message || '错误')
  } finally {
    adminApiKeyOperating.value = false
  }
}

async function regenerateAdminApiKey() {
  if (!confirm('确定要重新生成吗？当前密钥将立即失效。')) return
  await createAdminApiKey()
}

async function deleteAdminApiKey() {
  if (!confirm('确定要删除管理员 API Key 吗？外部集成将停止工作。')) return
  adminApiKeyOperating.value = true
  try {
    await adminAPI.settings.deleteAdminApiKey()
    adminApiKeyExists.value = false
    adminApiKeyMasked.value = ''
    newAdminApiKey.value = ''
    appStore.showSuccess('管理员 API Key 已删除')
  } catch (error: any) {
    appStore.showError(error.message || '错误')
  } finally {
    adminApiKeyOperating.value = false
  }
}

function copyNewKey() {
  navigator.clipboard
    .writeText(newAdminApiKey.value)
    .then(() => {
      appStore.showSuccess('密钥已复制到剪贴板')
    })
    .catch(() => {
      appStore.showError('复制失败')
    })
}

// Stream Timeout 方法
async function loadStreamTimeoutSettings() {
  streamTimeoutLoading.value = true
  try {
    const settings = await adminAPI.settings.getStreamTimeoutSettings()
    Object.assign(streamTimeoutForm, settings)
  } catch (error: any) {
    console.error('Failed to load stream timeout settings:', error)
  } finally {
    streamTimeoutLoading.value = false
  }
}

async function saveStreamTimeoutSettings() {
  streamTimeoutSaving.value = true
  try {
    const updated = await adminAPI.settings.updateStreamTimeoutSettings({
      enabled: streamTimeoutForm.enabled,
      action: streamTimeoutForm.action,
      temp_unsched_minutes: streamTimeoutForm.temp_unsched_minutes,
      threshold_count: streamTimeoutForm.threshold_count,
      threshold_window_minutes: streamTimeoutForm.threshold_window_minutes
    })
    Object.assign(streamTimeoutForm, updated)
    appStore.showSuccess('流超时设置保存成功')
  } catch (error: any) {
    appStore.showError(
      '保存流超时设置失败' + ': ' + (error.message || '发生未知错误')
    )
  } finally {
    streamTimeoutSaving.value = false
  }
}

onMounted(() => {
  loadSettings()
  loadAdminApiKey()
  loadStreamTimeoutSettings()
})
</script>
