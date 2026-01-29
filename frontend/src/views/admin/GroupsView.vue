<template>
  <AppLayout>
    <TablePageLayout>
      <template #filters>
        <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <!-- Left: fuzzy search + filters (can wrap to multiple lines) -->
          <div class="flex flex-1 flex-wrap items-center gap-3">
            <div class="relative w-full sm:w-64">
              <Icon
                name="search"
                size="md"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="'搜索分组...'"
                class="input pl-10"
                @input="handleSearch"
              />
            </div>
          <Select
            v-model="filters.platform"
            :options="platformFilterOptions"
            :placeholder="'全部平台'"
            class="w-44"
            @change="loadGroups"
          />
          <Select
            v-model="filters.status"
            :options="statusOptions"
            :placeholder="'全部状态'"
            class="w-40"
            @change="loadGroups"
          />
          <Select
            v-model="filters.is_exclusive"
            :options="exclusiveOptions"
            :placeholder="'全部分组'"
            class="w-44"
            @change="loadGroups"
          />
          </div>

          <!-- Right: actions -->
          <div class="flex w-full flex-shrink-0 flex-wrap items-center justify-end gap-3 lg:w-auto">
            <button
              :disabled="loading"
              class="btn btn-secondary"
              :title="'刷新'"
              @click="loadGroups"
            >
              <Icon name="refresh" size="md" :class="loading ? 'animate-spin' : ''" />
            </button>
            <button
              class="btn btn-primary"
              data-tour="groups-create-btn"
              @click="showCreateModal = true"
            >
              <Icon name="plus" size="md" class="mr-2" />
              {{ '创建分组' }}
            </button>
          </div>
        </div>
      </template>

      <template #table>
        <DataTable :columns="columns" :data="groups" :loading="loading">
          <template #cell-name="{ value }">
            <span class="font-medium text-gray-900 dark:text-white">{{ value }}</span>
          </template>

          <template #cell-platform="{ value }">
            <span
              :class="[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                value === 'anthropic'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : value === 'openai'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : value === 'antigravity'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              ]"
            >
              <PlatformIcon :platform="value" size="xs" />
              {{ value === 'anthropic' ? 'Anthropic' : value === 'openai' ? 'OpenAI' : value === 'gemini' ? 'Gemini' : 'Antigravity' }}
            </span>
          </template>

          <template #cell-billing_type="{ row }">
            <div class="space-y-1">
              <!-- Type Badge -->
              <span
                :class="[
                  'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                  row.subscription_type === 'subscription'
                    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                ]"
              >
                {{
                  row.subscription_type === 'subscription'
                    ? '订阅（配额）'
                    : '标准（余额）'
                }}
              </span>
              <!-- Subscription Limits - compact single line -->
              <div
                v-if="row.subscription_type === 'subscription'"
                class="text-xs text-gray-500 dark:text-gray-400"
              >
                <template
                  v-if="row.daily_limit_usd || row.weekly_limit_usd || row.monthly_limit_usd"
                >
                  <span v-if="row.daily_limit_usd"
                    >${{ row.daily_limit_usd }}/{{ '日' }}</span
                  >
                  <span
                    v-if="row.daily_limit_usd && (row.weekly_limit_usd || row.monthly_limit_usd)"
                    class="mx-1 text-gray-300 dark:text-gray-600"
                    >·</span
                  >
                  <span v-if="row.weekly_limit_usd"
                    >${{ row.weekly_limit_usd }}/{{ '周' }}</span
                  >
                  <span
                    v-if="row.weekly_limit_usd && row.monthly_limit_usd"
                    class="mx-1 text-gray-300 dark:text-gray-600"
                    >·</span
                  >
                  <span v-if="row.monthly_limit_usd"
                    >${{ row.monthly_limit_usd }}/{{ '月' }}</span
                  >
                </template>
                <span v-else class="text-gray-400 dark:text-gray-500">{{
                  '无限制'
                }}</span>
              </div>
            </div>
          </template>

          <template #cell-rate_multiplier="{ value }">
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ value }}x</span>
          </template>

          <template #cell-is_exclusive="{ value }">
            <span :class="['badge', value ? 'badge-primary' : 'badge-gray']">
              {{ value ? '专属' : '公开' }}
            </span>
          </template>

          <template #cell-account_count="{ value }">
            <span
              class="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-dark-600 dark:text-gray-300"
            >
              {{ `${value || 0} 个账号` }}
            </span>
          </template>

          <template #cell-status="{ value }">
            <span :class="['badge', value === 'active' ? 'badge-success' : 'badge-danger']">
              {{ value === 'active' ? '正常' : '停用' }}
            </span>
          </template>

          <template #cell-actions="{ row }">
            <div class="flex items-center gap-1">
              <button
                class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-dark-700 dark:hover:text-primary-400"
                @click="handleEdit(row)"
              >
                <Icon name="edit" size="sm" />
                <span class="text-xs">{{ '编辑' }}</span>
              </button>
              <button
                class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                @click="handleDelete(row)"
              >
                <Icon name="trash" size="sm" />
                <span class="text-xs">{{ '删除' }}</span>
              </button>
            </div>
          </template>

          <template #empty>
            <EmptyState
              :title="'暂无分组'"
              :description="'创建您的第一个分组来组织 API 密钥。'"
              :action-text="'创建分组'"
              @action="showCreateModal = true"
            />
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

    <!-- Create Group Modal -->
    <BaseDialog
      :show="showCreateModal"
      :title="'创建分组'"
      width="normal"
      @close="closeCreateModal"
    >
      <form id="create-group-form" class="space-y-5" @submit.prevent="handleCreateGroup">
        <div>
          <label class="input-label">{{ '名称' }}</label>
          <input
            v-model="createForm.name"
            type="text"
            required
            class="input"
            :placeholder="'请输入分组名称'"
            data-tour="group-form-name"
          />
        </div>
        <div>
          <label class="input-label">{{ '描述' }}</label>
          <textarea
            v-model="createForm.description"
            rows="3"
            class="input"
            :placeholder="'可选描述'"
          ></textarea>
        </div>
        <div>
          <label class="input-label">{{ '平台' }}</label>
          <Select
            v-model="createForm.platform"
            :options="platformOptions"
            data-tour="group-form-platform"
          />
          <p class="input-hint">{{ '选择此分组关联的平台' }}</p>
        </div>
        <div>
          <label class="input-label">{{ '费率倍数' }}</label>
          <input
            v-model.number="createForm.rate_multiplier"
            type="number"
            step="0.001"
            min="0.001"
            required
            class="input"
            data-tour="group-form-multiplier"
          />
          <p class="input-hint">{{ '1.0 = 标准费率，0.5 = 半价，2.0 = 双倍' }}</p>
        </div>
        <div v-if="createForm.subscription_type !== 'subscription'" data-tour="group-form-exclusive">
          <div class="mb-1.5 flex items-center gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ '专属分组' }}
            </label>
            <!-- Help Tooltip -->
            <div class="group relative inline-flex">
              <Icon
                name="questionCircle"
                size="sm"
                :stroke-width="2"
                class="cursor-help text-gray-400 transition-colors hover:text-primary-500 dark:text-gray-500 dark:hover:text-primary-400"
              />
              <!-- Tooltip Popover -->
              <div class="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-72 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                <div class="rounded-lg bg-gray-900 p-3 text-white shadow-lg dark:bg-gray-800">
                  <p class="mb-2 text-xs font-medium">{{ '什么是专属分组？' }}</p>
                  <p class="mb-2 text-xs leading-relaxed text-gray-300">
                    {{ '开启后，用户在创建 API Key 时将无法看到此分组。只有管理员手动将用户分配到此分组后，用户才能使用。' }}
                  </p>
                  <div class="rounded bg-gray-800 p-2 dark:bg-gray-700">
                    <p class="text-xs leading-relaxed text-gray-300">
                      <span class="inline-flex items-center gap-1 text-primary-400"><Icon name="lightbulb" size="xs" /> {{ '使用场景：' }}</span>
                      {{ '公开分组费率 0.8，您可以创建一个费率 0.7 的专属分组，手动分配给 VIP 用户，让他们享受更优惠的价格。' }}
                    </p>
                  </div>
                  <!-- Arrow -->
                  <div class="absolute -bottom-1.5 left-3 h-3 w-3 rotate-45 bg-gray-900 dark:bg-gray-800"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                createForm.is_exclusive ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
              ]"
              @click="createForm.is_exclusive = !createForm.is_exclusive"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  createForm.is_exclusive ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ createForm.is_exclusive ? '专属' : '公开' }}
            </span>
          </div>
        </div>

        <!-- Subscription Configuration -->
        <div class="mt-4 border-t pt-4">
          <div>
            <label class="input-label">{{ '计费类型' }}</label>
            <Select v-model="createForm.subscription_type" :options="subscriptionTypeOptions" />
            <p class="input-hint">{{ '标准计费从用户余额扣除。订阅模式使用配额限制。' }}</p>
          </div>

          <!-- Subscription limits (only show when subscription type is selected) -->
          <div
            v-if="createForm.subscription_type === 'subscription'"
            class="space-y-4 border-l-2 border-primary-200 pl-4 dark:border-primary-800"
          >
            <div>
              <label class="input-label">{{ '每日限额（USD）' }}</label>
              <input
                v-model.number="createForm.daily_limit_usd"
                type="number"
                step="0.01"
                min="0"
                class="input"
                :placeholder="'无限制'"
              />
            </div>
            <div>
              <label class="input-label">{{ '每周限额（USD）' }}</label>
              <input
                v-model.number="createForm.weekly_limit_usd"
                type="number"
                step="0.01"
                min="0"
                class="input"
                :placeholder="'无限制'"
              />
            </div>
            <div>
              <label class="input-label">{{ '每月限额（USD）' }}</label>
              <input
                v-model.number="createForm.monthly_limit_usd"
                type="number"
                step="0.01"
                min="0"
                class="input"
                :placeholder="'无限制'"
              />
            </div>
          </div>
        </div>

        <!-- 图片生成计费配置（antigravity 和 gemini 平台） -->
        <div v-if="createForm.platform === 'antigravity' || createForm.platform === 'gemini'" class="border-t pt-4">
          <label class="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            {{ '图片生成计费' }}
          </label>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {{ '配置 gemini-3-pro-image 模型的图片生成价格，留空则使用默认价格' }}
          </p>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="input-label">1K ($)</label>
              <input
                v-model.number="createForm.image_price_1k"
                type="number"
                step="0.001"
                min="0"
                class="input"
                placeholder="0.134"
              />
            </div>
            <div>
              <label class="input-label">2K ($)</label>
              <input
                v-model.number="createForm.image_price_2k"
                type="number"
                step="0.001"
                min="0"
                class="input"
                placeholder="0.134"
              />
            </div>
            <div>
              <label class="input-label">4K ($)</label>
              <input
                v-model.number="createForm.image_price_4k"
                type="number"
                step="0.001"
                min="0"
                class="input"
                placeholder="0.268"
              />
            </div>
          </div>
        </div>

        <!-- Claude Code 客户端限制（仅 anthropic 平台） -->
        <div v-if="createForm.platform === 'anthropic'" class="border-t pt-4">
          <div class="mb-1.5 flex items-center gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ 'Claude Code 客户端限制' }}
            </label>
            <!-- Help Tooltip -->
            <div class="group relative inline-flex">
              <Icon
                name="questionCircle"
                size="sm"
                :stroke-width="2"
                class="cursor-help text-gray-400 transition-colors hover:text-primary-500 dark:text-gray-500 dark:hover:text-primary-400"
              />
              <div class="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-72 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                <div class="rounded-lg bg-gray-900 p-3 text-white shadow-lg dark:bg-gray-800">
                  <p class="text-xs leading-relaxed text-gray-300">
                    {{ '启用后，此分组仅允许 Claude Code 官方客户端访问。非 Claude Code 请求将被拒绝或降级到指定分组。' }}
                  </p>
                  <div class="absolute -bottom-1.5 left-3 h-3 w-3 rotate-45 bg-gray-900 dark:bg-gray-800"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                createForm.claude_code_only ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
              ]"
              @click="createForm.claude_code_only = !createForm.claude_code_only"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  createForm.claude_code_only ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ createForm.claude_code_only ? '仅限 Claude Code' : '允许所有客户端' }}
            </span>
          </div>
          <!-- 降级分组选择（仅当启用 claude_code_only 时显示） -->
          <div v-if="createForm.claude_code_only" class="mt-3">
            <label class="input-label">{{ '降级分组' }}</label>
            <Select
              v-model="createForm.fallback_group_id"
              :options="fallbackGroupOptions"
              :placeholder="'不降级（直接拒绝）'"
            />
            <p class="input-hint">{{ '非 Claude Code 请求将使用此分组，留空则直接拒绝' }}</p>
          </div>
        </div>

        <!-- 模型路由配置（仅 anthropic 平台） -->
        <div v-if="createForm.platform === 'anthropic'" class="border-t pt-4">
          <div class="mb-1.5 flex items-center gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ '模型路由配置' }}
            </label>
            <!-- Help Tooltip -->
            <div class="group relative inline-flex">
              <Icon
                name="questionCircle"
                size="sm"
                :stroke-width="2"
                class="cursor-help text-gray-400 transition-colors hover:text-primary-500 dark:text-gray-500 dark:hover:text-primary-400"
              />
              <div class="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-80 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                <div class="rounded-lg bg-gray-900 p-3 text-white shadow-lg dark:bg-gray-800">
                  <p class="text-xs leading-relaxed text-gray-300">
                    {{ '配置特定模型请求优先路由到指定账号。支持通配符匹配，如 claude-opus-* 匹配所有 opus 模型。' }}
                  </p>
                  <div class="absolute -bottom-1.5 left-3 h-3 w-3 rotate-45 bg-gray-900 dark:bg-gray-800"></div>
                </div>
              </div>
            </div>
          </div>
          <!-- 启用开关 -->
          <div class="flex items-center gap-3 mb-3">
            <button
              type="button"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                createForm.model_routing_enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
              ]"
              @click="createForm.model_routing_enabled = !createForm.model_routing_enabled"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  createForm.model_routing_enabled ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ createForm.model_routing_enabled ? '已启用' : '已禁用' }}
            </span>
          </div>
          <p v-if="!createForm.model_routing_enabled" class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {{ '启用后，配置的路由规则才会生效' }}
          </p>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {{ '添加路由规则以将特定模型请求优先路由到指定账号' }}
          </p>
          <!-- 路由规则列表（仅在启用时显示） -->
          <div v-if="createForm.model_routing_enabled" class="space-y-3">
            <div
              v-for="(rule, index) in createModelRoutingRules"
              :key="index"
              class="rounded-lg border border-gray-200 p-3 dark:border-dark-600"
            >
              <div class="flex items-start gap-3">
                <div class="flex-1 space-y-2">
                  <div>
                    <label class="input-label text-xs">{{ '模型模式' }}</label>
                    <input
                      v-model="rule.pattern"
                      type="text"
                      class="input text-sm"
                      :placeholder="'claude-opus-*'"
                    />
                  </div>
                  <div>
                    <label class="input-label text-xs">{{ '优先账号' }}</label>
                    <!-- 已选账号标签 -->
                    <div v-if="rule.accounts.length > 0" class="flex flex-wrap gap-1.5 mb-2">
                      <span
                        v-for="account in rule.accounts"
                        :key="account.id"
                        class="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                      >
                        {{ account.name }}
                        <button
                          type="button"
                          class="ml-0.5 text-primary-500 hover:text-primary-700 dark:hover:text-primary-200"
                          @click="removeSelectedAccount(index, account.id, false)"
                        >
                          <Icon name="x" size="xs" />
                        </button>
                      </span>
                    </div>
                    <!-- 账号搜索输入框 -->
                    <div class="relative account-search-container">
                      <input
                        v-model="accountSearchKeyword[`create-${index}`]"
                        type="text"
                        class="input text-sm"
                        :placeholder="'搜索账号...'"
                        @input="searchAccounts(`create-${index}`)"
                        @focus="onAccountSearchFocus(index, false)"
                      />
                      <!-- 搜索结果下拉框 -->
                      <div
                        v-if="showAccountDropdown[`create-${index}`] && accountSearchResults[`create-${index}`]?.length > 0"
                        class="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-white shadow-lg dark:border-dark-600 dark:bg-dark-800"
                      >
                        <button
                          v-for="account in accountSearchResults[`create-${index}`]"
                          :key="account.id"
                          type="button"
                          class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-700"
                          :class="{ 'opacity-50': rule.accounts.some(a => a.id === account.id) }"
                          :disabled="rule.accounts.some(a => a.id === account.id)"
                          @click="selectAccount(index, account, false)"
                        >
                          <span>{{ account.name }}</span>
                          <span class="ml-2 text-xs text-gray-400">#{{ account.id }}</span>
                        </button>
                      </div>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">{{ '选择此模型模式优先使用的账号' }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="mt-5 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  :title="'删除规则'"
                  @click="removeCreateRoutingRule(index)"
                >
                  <Icon name="trash" size="sm" />
                </button>
              </div>
            </div>
          </div>
          <!-- 添加规则按钮（仅在启用时显示） -->
          <button
            v-if="createForm.model_routing_enabled"
            type="button"
            class="mt-3 flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            @click="addCreateRoutingRule"
          >
            <Icon name="plus" size="sm" />
            {{ '添加路由规则' }}
          </button>
        </div>
</form>

      <template #footer>
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" class="btn btn-secondary" @click="closeCreateModal">
            {{ '取消' }}
          </button>
          <button
            type="submit"
            form="create-group-form"
            :disabled="submitting"
            class="btn btn-primary"
            data-tour="group-form-submit"
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
            {{ submitting ? '创建中...' : '创建' }}
          </button>
        </div>
      </template>
    </BaseDialog>

    <!-- Edit Group Modal -->
    <BaseDialog
      :show="showEditModal"
      :title="'编辑分组'"
      width="normal"
      @close="closeEditModal"
    >
      <form
        v-if="editingGroup"
        id="edit-group-form"
        class="space-y-5"
        @submit.prevent="handleUpdateGroup"
      >
        <div>
          <label class="input-label">{{ '名称' }}</label>
          <input
            v-model="editForm.name"
            type="text"
            required
            class="input"
            data-tour="edit-group-form-name"
          />
        </div>
        <div>
          <label class="input-label">{{ '描述' }}</label>
          <textarea v-model="editForm.description" rows="3" class="input"></textarea>
        </div>
        <div>
          <label class="input-label">{{ '平台' }}</label>
          <Select
            v-model="editForm.platform"
            :options="platformOptions"
            :disabled="true"
            data-tour="group-form-platform"
          />
          <p class="input-hint">{{ '创建后不可更改平台' }}</p>
        </div>
        <div>
          <label class="input-label">{{ '费率倍数' }}</label>
          <input
            v-model.number="editForm.rate_multiplier"
            type="number"
            step="0.001"
            min="0.001"
            required
            class="input"
            data-tour="group-form-multiplier"
          />
        </div>
        <div v-if="editForm.subscription_type !== 'subscription'">
          <div class="mb-1.5 flex items-center gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ '专属分组' }}
            </label>
            <!-- Help Tooltip -->
            <div class="group relative inline-flex">
              <Icon
                name="questionCircle"
                size="sm"
                :stroke-width="2"
                class="cursor-help text-gray-400 transition-colors hover:text-primary-500 dark:text-gray-500 dark:hover:text-primary-400"
              />
              <!-- Tooltip Popover -->
              <div class="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-72 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                <div class="rounded-lg bg-gray-900 p-3 text-white shadow-lg dark:bg-gray-800">
                  <p class="mb-2 text-xs font-medium">{{ '什么是专属分组？' }}</p>
                  <p class="mb-2 text-xs leading-relaxed text-gray-300">
                    {{ '开启后，用户在创建 API Key 时将无法看到此分组。只有管理员手动将用户分配到此分组后，用户才能使用。' }}
                  </p>
                  <div class="rounded bg-gray-800 p-2 dark:bg-gray-700">
                    <p class="text-xs leading-relaxed text-gray-300">
                      <span class="inline-flex items-center gap-1 text-primary-400"><Icon name="lightbulb" size="xs" /> {{ '使用场景：' }}</span>
                      {{ '公开分组费率 0.8，您可以创建一个费率 0.7 的专属分组，手动分配给 VIP 用户，让他们享受更优惠的价格。' }}
                    </p>
                  </div>
                  <!-- Arrow -->
                  <div class="absolute -bottom-1.5 left-3 h-3 w-3 rotate-45 bg-gray-900 dark:bg-gray-800"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                editForm.is_exclusive ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
              ]"
              @click="editForm.is_exclusive = !editForm.is_exclusive"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  editForm.is_exclusive ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ editForm.is_exclusive ? '专属' : '公开' }}
            </span>
          </div>
        </div>
        <div>
          <label class="input-label">{{ '状态' }}</label>
          <Select v-model="editForm.status" :options="editStatusOptions" />
        </div>

        <!-- Subscription Configuration -->
        <div class="mt-4 border-t pt-4">
          <div>
            <label class="input-label">{{ '计费类型' }}</label>
            <Select
              v-model="editForm.subscription_type"
              :options="subscriptionTypeOptions"
              :disabled="true"
            />
            <p class="input-hint">{{ '分组创建后无法修改计费类型。' }}</p>
          </div>

          <!-- Subscription limits (only show when subscription type is selected) -->
          <div
            v-if="editForm.subscription_type === 'subscription'"
            class="space-y-4 border-l-2 border-primary-200 pl-4 dark:border-primary-800"
          >
            <div>
              <label class="input-label">{{ '每日限额（USD）' }}</label>
              <input
                v-model.number="editForm.daily_limit_usd"
                type="number"
                step="0.01"
                min="0"
                class="input"
                :placeholder="'无限制'"
              />
            </div>
            <div>
              <label class="input-label">{{ '每周限额（USD）' }}</label>
              <input
                v-model.number="editForm.weekly_limit_usd"
                type="number"
                step="0.01"
                min="0"
                class="input"
                :placeholder="'无限制'"
              />
            </div>
            <div>
              <label class="input-label">{{ '每月限额（USD）' }}</label>
              <input
                v-model.number="editForm.monthly_limit_usd"
                type="number"
                step="0.01"
                min="0"
                class="input"
                :placeholder="'无限制'"
              />
            </div>
          </div>
        </div>

        <!-- 图片生成计费配置（antigravity 和 gemini 平台） -->
        <div v-if="editForm.platform === 'antigravity' || editForm.platform === 'gemini'" class="border-t pt-4">
          <label class="block mb-2 font-medium text-gray-700 dark:text-gray-300">
            {{ '图片生成计费' }}
          </label>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {{ '配置 gemini-3-pro-image 模型的图片生成价格，留空则使用默认价格' }}
          </p>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="input-label">1K ($)</label>
              <input
                v-model.number="editForm.image_price_1k"
                type="number"
                step="0.001"
                min="0"
                class="input"
                placeholder="0.134"
              />
            </div>
            <div>
              <label class="input-label">2K ($)</label>
              <input
                v-model.number="editForm.image_price_2k"
                type="number"
                step="0.001"
                min="0"
                class="input"
                placeholder="0.134"
              />
            </div>
            <div>
              <label class="input-label">4K ($)</label>
              <input
                v-model.number="editForm.image_price_4k"
                type="number"
                step="0.001"
                min="0"
                class="input"
                placeholder="0.268"
              />
            </div>
          </div>
        </div>

        <!-- Claude Code 客户端限制（仅 anthropic 平台） -->
        <div v-if="editForm.platform === 'anthropic'" class="border-t pt-4">
          <div class="mb-1.5 flex items-center gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ 'Claude Code 客户端限制' }}
            </label>
            <!-- Help Tooltip -->
            <div class="group relative inline-flex">
              <Icon
                name="questionCircle"
                size="sm"
                :stroke-width="2"
                class="cursor-help text-gray-400 transition-colors hover:text-primary-500 dark:text-gray-500 dark:hover:text-primary-400"
              />
              <div class="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-72 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                <div class="rounded-lg bg-gray-900 p-3 text-white shadow-lg dark:bg-gray-800">
                  <p class="text-xs leading-relaxed text-gray-300">
                    {{ '启用后，此分组仅允许 Claude Code 官方客户端访问。非 Claude Code 请求将被拒绝或降级到指定分组。' }}
                  </p>
                  <div class="absolute -bottom-1.5 left-3 h-3 w-3 rotate-45 bg-gray-900 dark:bg-gray-800"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                editForm.claude_code_only ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
              ]"
              @click="editForm.claude_code_only = !editForm.claude_code_only"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  editForm.claude_code_only ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ editForm.claude_code_only ? '仅限 Claude Code' : '允许所有客户端' }}
            </span>
          </div>
          <!-- 降级分组选择（仅当启用 claude_code_only 时显示） -->
          <div v-if="editForm.claude_code_only" class="mt-3">
            <label class="input-label">{{ '降级分组' }}</label>
            <Select
              v-model="editForm.fallback_group_id"
              :options="fallbackGroupOptionsForEdit"
              :placeholder="'不降级（直接拒绝）'"
            />
            <p class="input-hint">{{ '非 Claude Code 请求将使用此分组，留空则直接拒绝' }}</p>
          </div>
        </div>

        <!-- 模型路由配置（仅 anthropic 平台） -->
        <div v-if="editForm.platform === 'anthropic'" class="border-t pt-4">
          <div class="mb-1.5 flex items-center gap-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ '模型路由配置' }}
            </label>
            <!-- Help Tooltip -->
            <div class="group relative inline-flex">
              <Icon
                name="questionCircle"
                size="sm"
                :stroke-width="2"
                class="cursor-help text-gray-400 transition-colors hover:text-primary-500 dark:text-gray-500 dark:hover:text-primary-400"
              />
              <div class="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-80 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
                <div class="rounded-lg bg-gray-900 p-3 text-white shadow-lg dark:bg-gray-800">
                  <p class="text-xs leading-relaxed text-gray-300">
                    {{ '配置特定模型请求优先路由到指定账号。支持通配符匹配，如 claude-opus-* 匹配所有 opus 模型。' }}
                  </p>
                  <div class="absolute -bottom-1.5 left-3 h-3 w-3 rotate-45 bg-gray-900 dark:bg-gray-800"></div>
                </div>
              </div>
            </div>
          </div>
          <!-- 启用开关 -->
          <div class="flex items-center gap-3 mb-3">
            <button
              type="button"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                editForm.model_routing_enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
              ]"
              @click="editForm.model_routing_enabled = !editForm.model_routing_enabled"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  editForm.model_routing_enabled ? 'translate-x-6' : 'translate-x-1'
                ]"
              />
            </button>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ editForm.model_routing_enabled ? '已启用' : '已禁用' }}
            </span>
          </div>
          <p v-if="!editForm.model_routing_enabled" class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {{ '启用后，配置的路由规则才会生效' }}
          </p>
          <p v-else class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {{ '添加路由规则以将特定模型请求优先路由到指定账号' }}
          </p>
          <!-- 路由规则列表（仅在启用时显示） -->
          <div v-if="editForm.model_routing_enabled" class="space-y-3">
            <div
              v-for="(rule, index) in editModelRoutingRules"
              :key="index"
              class="rounded-lg border border-gray-200 p-3 dark:border-dark-600"
            >
              <div class="flex items-start gap-3">
                <div class="flex-1 space-y-2">
                  <div>
                    <label class="input-label text-xs">{{ '模型模式' }}</label>
                    <input
                      v-model="rule.pattern"
                      type="text"
                      class="input text-sm"
                      :placeholder="'claude-opus-*'"
                    />
                  </div>
                  <div>
                    <label class="input-label text-xs">{{ '优先账号' }}</label>
                    <!-- 已选账号标签 -->
                    <div v-if="rule.accounts.length > 0" class="flex flex-wrap gap-1.5 mb-2">
                      <span
                        v-for="account in rule.accounts"
                        :key="account.id"
                        class="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                      >
                        {{ account.name }}
                        <button
                          type="button"
                          class="ml-0.5 text-primary-500 hover:text-primary-700 dark:hover:text-primary-200"
                          @click="removeSelectedAccount(index, account.id, true)"
                        >
                          <Icon name="x" size="xs" />
                        </button>
                      </span>
                    </div>
                    <!-- 账号搜索输入框 -->
                    <div class="relative account-search-container">
                      <input
                        v-model="accountSearchKeyword[`edit-${index}`]"
                        type="text"
                        class="input text-sm"
                        :placeholder="'搜索账号...'"
                        @input="searchAccounts(`edit-${index}`)"
                        @focus="onAccountSearchFocus(index, true)"
                      />
                      <!-- 搜索结果下拉框 -->
                      <div
                        v-if="showAccountDropdown[`edit-${index}`] && accountSearchResults[`edit-${index}`]?.length > 0"
                        class="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-white shadow-lg dark:border-dark-600 dark:bg-dark-800"
                      >
                        <button
                          v-for="account in accountSearchResults[`edit-${index}`]"
                          :key="account.id"
                          type="button"
                          class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-700"
                          :class="{ 'opacity-50': rule.accounts.some(a => a.id === account.id) }"
                          :disabled="rule.accounts.some(a => a.id === account.id)"
                          @click="selectAccount(index, account, true)"
                        >
                          <span>{{ account.name }}</span>
                          <span class="ml-2 text-xs text-gray-400">#{{ account.id }}</span>
                        </button>
                      </div>
                    </div>
                    <p class="text-xs text-gray-400 mt-1">{{ '选择此模型模式优先使用的账号' }}</p>
                  </div>
                </div>
                <button
                  type="button"
                  class="mt-5 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  :title="'删除规则'"
                  @click="removeEditRoutingRule(index)"
                >
                  <Icon name="trash" size="sm" />
                </button>
              </div>
            </div>
          </div>
          <!-- 添加规则按钮（仅在启用时显示） -->
          <button
            v-if="editForm.model_routing_enabled"
            type="button"
            class="mt-3 flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            @click="addEditRoutingRule"
          >
            <Icon name="plus" size="sm" />
            {{ '添加路由规则' }}
          </button>
        </div>
</form>

      <template #footer>
        <div class="flex justify-end gap-3 pt-4">
          <button type="button" class="btn btn-secondary" @click="closeEditModal">
            {{ '取消' }}
          </button>
          <button
            type="submit"
            form="edit-group-form"
            :disabled="submitting"
            class="btn btn-primary"
            data-tour="group-form-submit"
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
            {{ submitting ? '更新中...' : '更新' }}
          </button>
        </div>
      </template>
    </BaseDialog>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      :show="showDeleteDialog"
      :title="'删除分组'"
      :message="deleteConfirmMessage"
      :confirm-text="'删除'"
      :cancel-text="'取消'"
      :danger="true"
      @confirm="confirmDelete"
      @cancel="showDeleteDialog = false"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useOnboardingStore } from '@/stores/onboarding'
import { adminAPI } from '@/api/admin'
import type { AdminGroup, GroupPlatform, SubscriptionType } from '@/types'
import type { Column } from '@/components/common/types'
import AppLayout from '@/components/layout/AppLayout.vue'
import TablePageLayout from '@/components/layout/TablePageLayout.vue'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Select from '@/components/common/Select.vue'
import PlatformIcon from '@/components/common/PlatformIcon.vue'
import Icon from '@/components/icons/Icon.vue'

const appStore = useAppStore()
const onboardingStore = useOnboardingStore()

const columns = computed<Column[]>(() => [
  { key: 'name', label: '名称', sortable: true },
  { key: 'platform', label: '平台', sortable: true },
  { key: 'billing_type', label: '计费类型', sortable: true },
  { key: 'rate_multiplier', label: '费率倍数', sortable: true },
  { key: 'is_exclusive', label: '类型', sortable: true },
  { key: 'account_count', label: '账号数', sortable: true },
  { key: 'status', label: '状态', sortable: true },
  { key: 'actions', label: '操作', sortable: false }
])

// Filter options
const statusOptions = computed(() => [
  { value: '', label: '全部状态' },
  { value: 'active', label: '正常' },
  { value: 'inactive', label: '停用' }
])

const exclusiveOptions = computed(() => [
  { value: '', label: '全部分组' },
  { value: 'true', label: '专属' },
  { value: 'false', label: '公开' }
])

const platformOptions = computed(() => [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'antigravity', label: 'Antigravity' }
])

const platformFilterOptions = computed(() => [
  { value: '', label: '全部平台' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'antigravity', label: 'Antigravity' }
])

const editStatusOptions = computed(() => [
  { value: 'active', label: '正常' },
  { value: 'inactive', label: '停用' }
])

const subscriptionTypeOptions = computed(() => [
  { value: 'standard', label: '标准（余额）' },
  { value: 'subscription', label: '订阅（配额）' }
])

// 降级分组选项（创建时）- 仅包含 anthropic 平台且未启用 claude_code_only 的分组
const fallbackGroupOptions = computed(() => {
  const options: { value: number | null; label: string }[] = [
    { value: null, label: '不降级（直接拒绝）' }
  ]
  const eligibleGroups = groups.value.filter(
    (g) => g.platform === 'anthropic' && !g.claude_code_only && g.status === 'active'
  )
  eligibleGroups.forEach((g) => {
    options.push({ value: g.id, label: g.name })
  })
  return options
})

// 降级分组选项（编辑时）- 排除自身
const fallbackGroupOptionsForEdit = computed(() => {
  const options: { value: number | null; label: string }[] = [
    { value: null, label: '不降级（直接拒绝）' }
  ]
  const currentId = editingGroup.value?.id
  const eligibleGroups = groups.value.filter(
    (g) => g.platform === 'anthropic' && !g.claude_code_only && g.status === 'active' && g.id !== currentId
  )
  eligibleGroups.forEach((g) => {
    options.push({ value: g.id, label: g.name })
  })
  return options
})

const groups = ref<AdminGroup[]>([])
const loading = ref(false)
const searchQuery = ref('')
const filters = reactive({
  platform: '',
  status: '',
  is_exclusive: ''
})
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0,
  pages: 0
})

let abortController: AbortController | null = null

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteDialog = ref(false)
const submitting = ref(false)
const editingGroup = ref<AdminGroup | null>(null)
const deletingGroup = ref<AdminGroup | null>(null)

const createForm = reactive({
  name: '',
  description: '',
  platform: 'anthropic' as GroupPlatform,
  rate_multiplier: 1.0,
  is_exclusive: false,
  subscription_type: 'standard' as SubscriptionType,
  daily_limit_usd: null as number | null,
  weekly_limit_usd: null as number | null,
  monthly_limit_usd: null as number | null,
  // 图片生成计费配置（仅 antigravity 平台使用）
  image_price_1k: null as number | null,
  image_price_2k: null as number | null,
  image_price_4k: null as number | null,
  // Claude Code 客户端限制（仅 anthropic 平台使用）
  claude_code_only: false,
  fallback_group_id: null as number | null,
  // 模型路由开关
  model_routing_enabled: false
})

// 简单账号类型（用于模型路由选择）
interface SimpleAccount {
  id: number
  name: string
}

// 模型路由规则类型
interface ModelRoutingRule {
  pattern: string
  accounts: SimpleAccount[] // 选中的账号对象数组
}

// 创建表单的模型路由规则
const createModelRoutingRules = ref<ModelRoutingRule[]>([])

// 编辑表单的模型路由规则
const editModelRoutingRules = ref<ModelRoutingRule[]>([])

// 账号搜索相关状态
const accountSearchKeyword = ref<Record<string, string>>({}) // 每个规则的搜索关键词 (key: "create-0" 或 "edit-0")
const accountSearchResults = ref<Record<string, SimpleAccount[]>>({}) // 每个规则的搜索结果
const showAccountDropdown = ref<Record<string, boolean>>({}) // 每个规则的下拉框显示状态
let accountSearchTimeout: ReturnType<typeof setTimeout> | null = null

// 搜索账号（仅限 anthropic 平台）
const searchAccounts = async (key: string) => {
  if (accountSearchTimeout) clearTimeout(accountSearchTimeout)
  accountSearchTimeout = setTimeout(async () => {
    const keyword = accountSearchKeyword.value[key] || ''
    try {
      const res = await adminAPI.accounts.list(1, 20, {
        search: keyword,
        platform: 'anthropic'
      })
      accountSearchResults.value[key] = res.items.map((a) => ({ id: a.id, name: a.name }))
    } catch {
      accountSearchResults.value[key] = []
    }
  }, 300)
}

// 选择账号
const selectAccount = (ruleIndex: number, account: SimpleAccount, isEdit: boolean = false) => {
  const rules = isEdit ? editModelRoutingRules.value : createModelRoutingRules.value
  const rule = rules[ruleIndex]
  if (!rule) return

  // 检查是否已选择
  if (!rule.accounts.some(a => a.id === account.id)) {
    rule.accounts.push(account)
  }

  // 清空搜索
  const key = `${isEdit ? 'edit' : 'create'}-${ruleIndex}`
  accountSearchKeyword.value[key] = ''
  showAccountDropdown.value[key] = false
}

// 移除已选账号
const removeSelectedAccount = (ruleIndex: number, accountId: number, isEdit: boolean = false) => {
  const rules = isEdit ? editModelRoutingRules.value : createModelRoutingRules.value
  const rule = rules[ruleIndex]
  if (!rule) return

  rule.accounts = rule.accounts.filter(a => a.id !== accountId)
}

// 处理账号搜索输入框聚焦
const onAccountSearchFocus = (ruleIndex: number, isEdit: boolean = false) => {
  const key = `${isEdit ? 'edit' : 'create'}-${ruleIndex}`
  showAccountDropdown.value[key] = true
  // 如果没有搜索结果，触发一次搜索
  if (!accountSearchResults.value[key]?.length) {
    searchAccounts(key)
  }
}

// 添加创建表单的路由规则
const addCreateRoutingRule = () => {
  createModelRoutingRules.value.push({ pattern: '', accounts: [] })
}

// 删除创建表单的路由规则
const removeCreateRoutingRule = (index: number) => {
  createModelRoutingRules.value.splice(index, 1)
  // 清理相关的搜索状态
  const key = `create-${index}`
  delete accountSearchKeyword.value[key]
  delete accountSearchResults.value[key]
  delete showAccountDropdown.value[key]
}

// 添加编辑表单的路由规则
const addEditRoutingRule = () => {
  editModelRoutingRules.value.push({ pattern: '', accounts: [] })
}

// 删除编辑表单的路由规则
const removeEditRoutingRule = (index: number) => {
  editModelRoutingRules.value.splice(index, 1)
  // 清理相关的搜索状态
  const key = `edit-${index}`
  delete accountSearchKeyword.value[key]
  delete accountSearchResults.value[key]
  delete showAccountDropdown.value[key]
}

// 将 UI 格式的路由规则转换为 API 格式
const convertRoutingRulesToApiFormat = (rules: ModelRoutingRule[]): Record<string, number[]> | null => {
  const result: Record<string, number[]> = {}
  let hasValidRules = false

  for (const rule of rules) {
    const pattern = rule.pattern.trim()
    if (!pattern) continue

    const accountIds = rule.accounts.map(a => a.id).filter(id => id > 0)

    if (accountIds.length > 0) {
      result[pattern] = accountIds
      hasValidRules = true
    }
  }

  return hasValidRules ? result : null
}

// 将 API 格式的路由规则转换为 UI 格式（需要加载账号名称）
const convertApiFormatToRoutingRules = async (apiFormat: Record<string, number[]> | null): Promise<ModelRoutingRule[]> => {
  if (!apiFormat) return []

  const rules: ModelRoutingRule[] = []
  for (const [pattern, accountIds] of Object.entries(apiFormat)) {
    // 加载账号信息
    const accounts: SimpleAccount[] = []
    for (const id of accountIds) {
      try {
        const account = await adminAPI.accounts.getById(id)
        accounts.push({ id: account.id, name: account.name })
      } catch {
        // 如果账号不存在，仍然显示 ID
        accounts.push({ id, name: `#${id}` })
      }
    }
    rules.push({ pattern, accounts })
  }
  return rules
}

const editForm = reactive({
  name: '',
  description: '',
  platform: 'anthropic' as GroupPlatform,
  rate_multiplier: 1.0,
  is_exclusive: false,
  status: 'active' as 'active' | 'inactive',
  subscription_type: 'standard' as SubscriptionType,
  daily_limit_usd: null as number | null,
  weekly_limit_usd: null as number | null,
  monthly_limit_usd: null as number | null,
  // 图片生成计费配置（仅 antigravity 平台使用）
  image_price_1k: null as number | null,
  image_price_2k: null as number | null,
  image_price_4k: null as number | null,
  // Claude Code 客户端限制（仅 anthropic 平台使用）
  claude_code_only: false,
  fallback_group_id: null as number | null,
  // 模型路由开关
  model_routing_enabled: false
})

// 根据分组类型返回不同的删除确认消息
const deleteConfirmMessage = computed(() => {
  if (!deletingGroup.value) {
    return ''
  }
  if (deletingGroup.value.subscription_type === 'subscription') {
    return `确定要删除订阅分组 '${deletingGroup.value.name}' 吗？此操作会让所有绑定此订阅的用户的 API Key 失效，并删除所有相关的订阅记录。此操作无法撤销。`
  }
  return `确定要删除分组 '${deletingGroup.value.name}' 吗？所有关联的 API 密钥将不再属于任何分组。`
})

const loadGroups = async () => {
  if (abortController) {
    abortController.abort()
  }
  const currentController = new AbortController()
  abortController = currentController
  const { signal } = currentController
  loading.value = true
  try {
    const response = await adminAPI.groups.list(pagination.page, pagination.page_size, {
      platform: (filters.platform as GroupPlatform) || undefined,
      status: filters.status as any,
      is_exclusive: filters.is_exclusive ? filters.is_exclusive === 'true' : undefined,
      search: searchQuery.value.trim() || undefined
    }, { signal })
    if (signal.aborted) return
    groups.value = response.items
    pagination.total = response.total
    pagination.pages = response.pages
  } catch (error: any) {
    if (signal.aborted || error?.name === 'AbortError' || error?.code === 'ERR_CANCELED') {
      return
    }
    appStore.showError('加载分组列表失败')
    console.error('Error loading groups:', error)
  } finally {
    if (abortController === currentController && !signal.aborted) {
      loading.value = false
    }
  }
}

let searchTimeout: ReturnType<typeof setTimeout>
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.page = 1
    loadGroups()
  }, 300)
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadGroups()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.page_size = pageSize
  pagination.page = 1
  loadGroups()
}

const closeCreateModal = () => {
  showCreateModal.value = false
  createForm.name = ''
  createForm.description = ''
  createForm.platform = 'anthropic'
  createForm.rate_multiplier = 1.0
  createForm.is_exclusive = false
  createForm.subscription_type = 'standard'
  createForm.daily_limit_usd = null
  createForm.weekly_limit_usd = null
  createForm.monthly_limit_usd = null
  createForm.image_price_1k = null
  createForm.image_price_2k = null
  createForm.image_price_4k = null
  createForm.claude_code_only = false
  createForm.fallback_group_id = null
  createModelRoutingRules.value = []
}

const handleCreateGroup = async () => {
  if (!createForm.name.trim()) {
    appStore.showError('请输入分组名称')
    return
  }
  submitting.value = true
  try {
    // 构建请求数据，包含模型路由配置
    const requestData = {
      ...createForm,
      model_routing: convertRoutingRulesToApiFormat(createModelRoutingRules.value)
    }
    await adminAPI.groups.create(requestData)
    appStore.showSuccess('分组创建成功')
    closeCreateModal()
    loadGroups()
    // Only advance tour if active, on submit step, and creation succeeded
    if (onboardingStore.isCurrentStep('[data-tour="group-form-submit"]')) {
      onboardingStore.nextStep(500)
    }
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || '创建分组失败')
    console.error('Error creating group:', error)
    // Don't advance tour on error
  } finally {
    submitting.value = false
  }
}

const handleEdit = async (group: AdminGroup) => {
  editingGroup.value = group
  editForm.name = group.name
  editForm.description = group.description || ''
  editForm.platform = group.platform
  editForm.rate_multiplier = group.rate_multiplier
  editForm.is_exclusive = group.is_exclusive
  editForm.status = group.status
  editForm.subscription_type = group.subscription_type || 'standard'
  editForm.daily_limit_usd = group.daily_limit_usd
  editForm.weekly_limit_usd = group.weekly_limit_usd
  editForm.monthly_limit_usd = group.monthly_limit_usd
  editForm.image_price_1k = group.image_price_1k
  editForm.image_price_2k = group.image_price_2k
  editForm.image_price_4k = group.image_price_4k
  editForm.claude_code_only = group.claude_code_only || false
  editForm.fallback_group_id = group.fallback_group_id
  editForm.model_routing_enabled = group.model_routing_enabled || false
  // 加载模型路由规则（异步加载账号名称）
  editModelRoutingRules.value = await convertApiFormatToRoutingRules(group.model_routing)
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingGroup.value = null
  editModelRoutingRules.value = []
}

const handleUpdateGroup = async () => {
  if (!editingGroup.value) return
  if (!editForm.name.trim()) {
    appStore.showError('请输入分组名称')
    return
  }

  submitting.value = true
  try {
    // 转换 fallback_group_id: null -> 0 (后端使用 0 表示清除)
    const payload = {
      ...editForm,
      fallback_group_id: editForm.fallback_group_id === null ? 0 : editForm.fallback_group_id,
      model_routing: convertRoutingRulesToApiFormat(editModelRoutingRules.value)
    }
    await adminAPI.groups.update(editingGroup.value.id, payload)
    appStore.showSuccess('分组更新成功')
    closeEditModal()
    loadGroups()
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || '更新分组失败')
    console.error('Error updating group:', error)
  } finally {
    submitting.value = false
  }
}

const handleDelete = (group: AdminGroup) => {
  deletingGroup.value = group
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!deletingGroup.value) return

  try {
    await adminAPI.groups.delete(deletingGroup.value.id)
    appStore.showSuccess('分组删除成功')
    showDeleteDialog.value = false
    deletingGroup.value = null
    loadGroups()
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || '删除分组失败')
    console.error('Error deleting group:', error)
  }
}

// 监听 subscription_type 变化，订阅模式时 is_exclusive 默认为 true
watch(
  () => createForm.subscription_type,
  (newVal) => {
    if (newVal === 'subscription') {
      createForm.is_exclusive = true
    }
  }
)

// 点击外部关闭账号搜索下拉框
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  // 检查是否点击在下拉框或输入框内
  if (!target.closest('.account-search-container')) {
    Object.keys(showAccountDropdown.value).forEach(key => {
      showAccountDropdown.value[key] = false
    })
  }
}

onMounted(() => {
  loadGroups()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
