<template>
  <AppLayout>
    <TablePageLayout>
      <!-- Single Row: Search, Filters, and Actions -->
      <template #filters>
        <div
          class="flex w-full flex-col gap-3 md:flex-row md:flex-wrap-reverse md:items-center md:justify-between md:gap-4"
        >
          <!-- Left: Search + Active Filters -->
          <div
            class="flex min-w-[280px] flex-1 flex-wrap content-start items-center gap-3 md:order-1"
          >
            <!-- Search Box -->
            <div class="relative w-full md:w-64">
              <Icon
                name="search"
                size="md"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="'搜索用户...'"
                class="input pl-10"
                @input="handleSearch"
              />
            </div>

            <!-- Role Filter (visible when enabled) -->
            <div v-if="visibleFilters.has('role')" class="w-full sm:w-32">
              <Select
                v-model="filters.role"
                :options="[
                  { value: '', label: '全部角色' },
                  { value: 'admin', label: '管理员' },
                  { value: 'user', label: '用户' },
                ]"
                @change="applyFilter"
              />
            </div>

            <!-- Status Filter (visible when enabled) -->
            <div v-if="visibleFilters.has('status')" class="w-full sm:w-32">
              <Select
                v-model="filters.status"
                :options="[
                  { value: '', label: '全部状态' },
                  { value: 'active', label: '启用' },
                  { value: 'disabled', label: '禁用' },
                ]"
                @change="applyFilter"
              />
            </div>

            <!-- Dynamic Attribute Filters -->
            <template
              v-for="(value, attrId) in activeAttributeFilters"
              :key="attrId"
            >
              <div
                v-if="visibleFilters.has(`attr_${attrId}`)"
                class="relative w-full sm:w-36"
              >
                <!-- Text/Email/URL/Textarea/Date type: styled input -->
                <input
                  v-if="
                    ['text', 'textarea', 'email', 'url', 'date'].includes(
                      getAttributeDefinition(Number(attrId))?.type || 'text',
                    )
                  "
                  :value="value"
                  :placeholder="getAttributeDefinitionName(Number(attrId))"
                  class="input w-full"
                  @input="
                    (e) =>
                      updateAttributeFilter(
                        Number(attrId),
                        (e.target as HTMLInputElement).value,
                      )
                  "
                  @keyup.enter="applyFilter"
                />
                <!-- Number type: number input -->
                <input
                  v-else-if="
                    getAttributeDefinition(Number(attrId))?.type === 'number'
                  "
                  :value="value"
                  type="number"
                  :placeholder="getAttributeDefinitionName(Number(attrId))"
                  class="input w-full"
                  @input="
                    (e) =>
                      updateAttributeFilter(
                        Number(attrId),
                        (e.target as HTMLInputElement).value,
                      )
                  "
                  @keyup.enter="applyFilter"
                />
                <!-- Select/Multi-select type -->
                <template
                  v-else-if="
                    ['select', 'multi_select'].includes(
                      getAttributeDefinition(Number(attrId))?.type || '',
                    )
                  "
                >
                  <div class="w-full">
                    <Select
                      :model-value="value"
                      :options="[
                        {
                          value: '',
                          label: getAttributeDefinitionName(Number(attrId)),
                        },
                        ...(getAttributeDefinition(Number(attrId))?.options ||
                          []),
                      ]"
                      @update:model-value="
                        (val) => {
                          updateAttributeFilter(
                            Number(attrId),
                            String(val ?? ''),
                          );
                          applyFilter();
                        }
                      "
                    />
                  </div>
                </template>
                <!-- Fallback -->
                <input
                  v-else
                  :value="value"
                  :placeholder="getAttributeDefinitionName(Number(attrId))"
                  class="input w-full"
                  @input="
                    (e) =>
                      updateAttributeFilter(
                        Number(attrId),
                        (e.target as HTMLInputElement).value,
                      )
                  "
                  @keyup.enter="applyFilter"
                />
              </div>
            </template>
          </div>

          <!-- Right: Actions and Settings -->
          <div
            class="flex w-full items-center justify-between gap-2 md:order-2 md:ml-auto md:max-w-full md:flex-wrap md:justify-end md:gap-3"
          >
            <!-- Mobile: Secondary buttons (icon only) -->
            <div class="flex items-center gap-2 md:contents">
              <!-- Refresh Button -->
              <button
                :disabled="loading"
                class="btn btn-secondary px-2 md:px-3"
                :title="'刷新'"
                @click="loadUsers"
              >
                <Icon
                  name="refresh"
                  size="md"
                  :class="loading ? 'animate-spin' : ''"
                />
              </button>
              <!-- Filter Settings Dropdown -->
              <div ref="filterDropdownRef" class="relative">
                <button
                  class="btn btn-secondary px-2 md:px-3"
                  :title="'筛选设置'"
                  @click="showFilterDropdown = !showFilterDropdown"
                >
                  <Icon name="filter" size="sm" class="md:mr-1.5" />
                  <span class="hidden md:inline">筛选设置</span>
                </button>
                <!-- Dropdown menu -->
                <div
                  v-if="showFilterDropdown"
                  class="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-dark-600 dark:bg-dark-800"
                >
                  <!-- Built-in filters -->
                  <button
                    v-for="filter in builtInFilters"
                    :key="filter.key"
                    class="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700"
                    @click="toggleBuiltInFilter(filter.key)"
                  >
                    <span>{{ filter.name }}</span>
                    <Icon
                      v-if="visibleFilters.has(filter.key)"
                      name="check"
                      size="sm"
                      class="text-primary-500"
                      :stroke-width="2"
                    />
                  </button>
                  <!-- Divider if custom attributes exist -->
                  <div
                    v-if="filterableAttributes.length > 0"
                    class="my-1 border-t border-gray-100 dark:border-dark-700"
                  ></div>
                  <!-- Custom attribute filters -->
                  <button
                    v-for="attr in filterableAttributes"
                    :key="attr.id"
                    class="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700"
                    @click="toggleAttributeFilter(attr)"
                  >
                    <span>{{ attr.name }}</span>
                    <Icon
                      v-if="visibleFilters.has(`attr_${attr.id}`)"
                      name="check"
                      size="sm"
                      class="text-primary-500"
                      :stroke-width="2"
                    />
                  </button>
                </div>
              </div>
              <!-- Column Settings Dropdown -->
              <div ref="columnDropdownRef" class="relative">
                <button
                  class="btn btn-secondary px-2 md:px-3"
                  :title="'列设置'"
                  @click="showColumnDropdown = !showColumnDropdown"
                >
                  <svg
                    class="h-4 w-4 md:mr-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z"
                    />
                  </svg>
                  <span class="hidden md:inline">列设置</span>
                </button>
                <!-- Dropdown menu -->
                <div
                  v-if="showColumnDropdown"
                  class="absolute right-0 top-full z-50 mt-1 max-h-80 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-dark-600 dark:bg-dark-800"
                >
                  <button
                    v-for="col in toggleableColumns"
                    :key="col.key"
                    class="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700"
                    @click="toggleColumn(col.key)"
                  >
                    <span>{{ col.label }}</span>
                    <Icon
                      v-if="isColumnVisible(col.key)"
                      name="check"
                      size="sm"
                      class="text-primary-500"
                      :stroke-width="2"
                    />
                  </button>
                </div>
              </div>
              <!-- Attributes Config Button -->
              <button
                class="btn btn-secondary px-2 md:px-3"
                :title="'属性配置'"
                @click="showAttributesModal = true"
              >
                <Icon name="cog" size="sm" class="md:mr-1.5" />
                <span class="hidden md:inline">属性配置</span>
              </button>
            </div>

            <!-- Create User Button (full width on mobile, auto width on desktop) -->
            <button
              class="btn btn-primary flex-1 md:flex-initial"
              @click="showCreateModal = true"
            >
              <Icon name="plus" size="md" class="mr-2" />
              创建用户
            </button>
          </div>
        </div>
      </template>

      <!-- Users Table -->
      <template #table>
        <DataTable
          :columns="columns"
          :data="users"
          :loading="loading"
          :actions-count="7"
        >
          <template #cell-email="{ value }">
            <div class="flex items-center gap-2">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30"
              >
                <span
                  class="text-sm font-medium text-primary-700 dark:text-primary-300"
                >
                  {{ value.charAt(0).toUpperCase() }}
                </span>
              </div>
              <span class="font-medium text-gray-900 dark:text-white">{{
                value
              }}</span>
            </div>
          </template>

          <template #cell-username="{ value }">
            <span class="text-sm text-gray-700 dark:text-gray-300">{{
              value || "-"
            }}</span>
          </template>

          <template #cell-notes="{ value }">
            <div class="max-w-xs">
              <span
                v-if="value"
                :title="value.length > 30 ? value : undefined"
                class="block truncate text-sm text-gray-600 dark:text-gray-400"
              >
                {{ value.length > 30 ? value.substring(0, 25) + "..." : value }}
              </span>
              <span v-else class="text-sm text-gray-400">-</span>
            </div>
          </template>

          <!-- Dynamic attribute columns -->
          <template
            v-for="def in attributeDefinitions.filter((d) => d.enabled)"
            :key="def.id"
            #[`cell-attr_${def.id}`]="{ row }"
          >
            <div class="max-w-xs">
              <span
                class="block truncate text-sm text-gray-700 dark:text-gray-300"
                :title="getAttributeValue(row.id, def.id)"
              >
                {{ getAttributeValue(row.id, def.id) }}
              </span>
            </div>
          </template>

          <template #cell-role="{ value }">
            <span
              :class="[
                'badge',
                value === 'admin' ? 'badge-purple' : 'badge-gray',
              ]"
            >
              {{ value === "admin" ? "管理员" : "普通用户" }}
            </span>
          </template>

          <template #cell-subscriptions="{ row }">
            <div
              v-if="row.subscriptions && row.subscriptions.length > 0"
              class="flex flex-wrap gap-1.5"
            >
              <GroupBadge
                v-for="sub in row.subscriptions"
                :key="sub.id"
                :name="sub.group?.name || ''"
                :platform="sub.group?.platform"
                :subscription-type="sub.group?.subscription_type"
                :rate-multiplier="sub.group?.rate_multiplier"
                :days-remaining="
                  sub.expires_at ? getDaysRemaining(sub.expires_at) : null
                "
                :title="sub.expires_at ? formatDateTime(sub.expires_at) : ''"
              />
            </div>
            <span
              v-else
              class="inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-400 dark:bg-dark-700/50 dark:text-dark-500"
            >
              <Icon name="ban" size="xs" class="h-3.5 w-3.5" />
              <span>暂无订阅</span>
            </span>
          </template>

          <template #cell-balance="{ value }">
            <span class="font-medium text-gray-900 dark:text-white"
              >${{ value.toFixed(2) }}</span
            >
          </template>

          <template #cell-usage="{ row }">
            <div class="text-sm">
              <div class="flex items-center gap-1.5">
                <span class="text-gray-500 dark:text-gray-400">今日:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  ${{ (usageStats[row.id]?.today_actual_cost ?? 0).toFixed(4) }}
                </span>
              </div>
              <div class="mt-0.5 flex items-center gap-1.5">
                <span class="text-gray-500 dark:text-gray-400">累计:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  ${{ (usageStats[row.id]?.total_actual_cost ?? 0).toFixed(4) }}
                </span>
              </div>
            </div>
          </template>

          <template #cell-concurrency="{ value }">
            <span class="text-sm text-gray-700 dark:text-gray-300">{{
              value
            }}</span>
          </template>

          <template #cell-status="{ value }">
            <div class="flex items-center gap-1.5">
              <span
                :class="[
                  'inline-block h-2 w-2 rounded-full',
                  value === 'active' ? 'bg-green-500' : 'bg-red-500',
                ]"
              ></span>
              <span class="text-sm text-gray-700 dark:text-gray-300">
                {{ value === "active" ? "启用" : "禁用" }}
              </span>
            </div>
          </template>

          <template #cell-created_at="{ value }">
            <span class="text-sm text-gray-500 dark:text-dark-400">{{
              formatDateTime(value)
            }}</span>
          </template>

          <template #cell-actions="{ row }">
            <div class="flex items-center gap-1">
              <!-- Edit Button -->
              <button
                class="flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-dark-700 dark:hover:text-primary-400"
                @click="handleEdit(row)"
              >
                <Icon name="edit" size="sm" />
                <span class="text-xs">编辑</span>
              </button>

              <!-- Toggle Status Button (not for admin) -->
              <button
                v-if="row.role !== 'admin'"
                :class="[
                  'flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-gray-500 transition-colors',
                  row.status === 'active'
                    ? 'hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400'
                    : 'hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400',
                ]"
                @click="handleToggleStatus(row)"
              >
                <Icon v-if="row.status === 'active'" name="ban" size="sm" />
                <Icon v-else name="checkCircle" size="sm" />
                <span class="text-xs">{{
                  row.status === "active" ? "禁用" : "启用"
                }}</span>
              </button>

              <!-- More Actions Menu Trigger -->
              <button
                class="action-menu-trigger flex flex-col items-center gap-0.5 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-dark-700 dark:hover:text-white"
                :class="{
                  'bg-gray-100 text-gray-900 dark:bg-dark-700 dark:text-white':
                    activeMenuId === row.id,
                }"
                @click="openActionMenu(row, $event)"
              >
                <Icon name="more" size="sm" />
                <span class="text-xs">更多</span>
              </button>
            </div>
          </template>

          <template #empty>
            <EmptyState
              :title="'暂无用户'"
              :description="'创建您的第一个用户以开始使用系统'"
              :action-text="'创建用户'"
              @action="showCreateModal = true"
            />
          </template>
        </DataTable>
      </template>

      <!-- Pagination -->
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

    <!-- Action Menu (Teleported) -->
    <Teleport to="body">
      <div
        v-if="activeMenuId !== null && menuPosition"
        class="action-menu-content fixed z-[9999] w-48 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5 dark:bg-dark-800 dark:ring-white/10"
        :style="{
          top: menuPosition.top + 'px',
          left: menuPosition.left + 'px',
        }"
      >
        <div class="py-1">
          <template v-for="user in users" :key="user.id">
            <template v-if="user.id === activeMenuId">
              <!-- View API Keys -->
              <button
                class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700"
                @click="
                  handleViewApiKeys(user);
                  closeActionMenu();
                "
              >
                <Icon
                  name="key"
                  size="sm"
                  class="text-gray-400"
                  :stroke-width="2"
                />
                API密钥
              </button>

              <!-- Allowed Groups -->
              <button
                class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700"
                @click="
                  handleAllowedGroups(user);
                  closeActionMenu();
                "
              >
                <Icon
                  name="users"
                  size="sm"
                  class="text-gray-400"
                  :stroke-width="2"
                />
                分组
              </button>

              <div
                class="my-1 border-t border-gray-100 dark:border-dark-700"
              ></div>

              <!-- Deposit -->
              <button
                class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700"
                @click="
                  handleDeposit(user);
                  closeActionMenu();
                "
              >
                <Icon
                  name="plus"
                  size="sm"
                  class="text-emerald-500"
                  :stroke-width="2"
                />
                充值
              </button>

              <!-- Withdraw -->
              <button
                class="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700"
                @click="
                  handleWithdraw(user);
                  closeActionMenu();
                "
              >
                <svg
                  class="h-4 w-4 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 12H4"
                  />
                </svg>
                退款
              </button>

              <div
                class="my-1 border-t border-gray-100 dark:border-dark-700"
              ></div>

              <!-- Delete (not for admin) -->
              <button
                v-if="user.role !== 'admin'"
                class="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                @click="
                  handleDelete(user);
                  closeActionMenu();
                "
              >
                <Icon name="trash" size="sm" :stroke-width="2" />
                删除
              </button>
            </template>
          </template>
        </div>
      </div>
    </Teleport>

    <ConfirmDialog
      :show="showDeleteDialog"
      :title="'删除用户'"
      :message="`确定要删除用户 '${deletingUser?.email}' 吗？此操作无法撤销。`"
      :danger="true"
      @confirm="confirmDelete"
      @cancel="showDeleteDialog = false"
    />
    <UserCreateModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @success="loadUsers"
    />
    <UserEditModal
      :show="showEditModal"
      :user="editingUser"
      @close="closeEditModal"
      @success="loadUsers"
    />
    <UserApiKeysModal
      :show="showApiKeysModal"
      :user="viewingUser"
      @close="closeApiKeysModal"
    />
    <UserAllowedGroupsModal
      :show="showAllowedGroupsModal"
      :user="allowedGroupsUser"
      @close="closeAllowedGroupsModal"
      @success="loadUsers"
    />
    <UserBalanceModal
      :show="showBalanceModal"
      :user="balanceUser"
      :operation="balanceOperation"
      @close="closeBalanceModal"
      @success="loadUsers"
    />
    <UserAttributesConfigModal
      :show="showAttributesModal"
      @close="handleAttributesModalClose"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useAppStore } from "@/stores/app";

import { adminAPI } from "@/api/admin";
import type { AdminUser, UserAttributeDefinition } from "@/types";
import type { BatchUserUsageStats } from "@/api/admin/dashboard";
import type { Column } from "@/components/common/types";

const appStore = useAppStore();

// Generate dynamic attribute columns from enabled definitions
const attributeColumns = computed<Column[]>(() =>
  attributeDefinitions.value
    .filter((def) => def.enabled)
    .map((def) => ({
      key: `attr_${def.id}`,
      label: def.name,
      sortable: false,
    })),
);

// Get formatted attribute value for display in table
const getAttributeValue = (userId: number, attrId: number): string => {
  const userAttrs = userAttributeValues.value[userId];
  if (!userAttrs) return "-";
  const value = userAttrs[attrId];
  if (!value) return "-";

  // Find definition for this attribute
  const def = attributeDefinitions.value.find((d) => d.id === attrId);
  if (!def) return value;

  // Format based on type
  if (def.type === "multi_select" && value) {
    try {
      const arr = JSON.parse(value);
      if (Array.isArray(arr)) {
        // Map values to labels
        return arr
          .map((v) => {
            const opt = def.options?.find((o) => o.value === v);
            return opt?.label || v;
          })
          .join(", ");
      }
    } catch {
      return value;
    }
  }

  if (def.type === "select" && value && def.options) {
    const opt = def.options.find((o) => o.value === value);
    return opt?.label || value;
  }

  return value;
};

// All possible columns (for column settings)
const allColumns = computed<Column[]>(() => [
  { key: "email", label: "用户", sortable: true },
  { key: "id", label: "ID", sortable: true },
  { key: "username", label: "用户名", sortable: true },
  { key: "notes", label: "备注", sortable: false },
  // Dynamic attribute columns
  ...attributeColumns.value,
  { key: "role", label: "角色", sortable: true },
  { key: "subscriptions", label: "订阅分组", sortable: false },
  { key: "balance", label: "余额", sortable: true },
  { key: "usage", label: "用量", sortable: false },
  { key: "concurrency", label: "并发数", sortable: true },
  { key: "status", label: "状态", sortable: true },
  { key: "created_at", label: "创建时间", sortable: true },
  { key: "actions", label: "操作", sortable: false },
]);

// Columns that can be toggled (exclude email and actions which are always visible)
const toggleableColumns = computed(() =>
  allColumns.value.filter(
    (col) => col.key !== "email" && col.key !== "actions",
  ),
);

// Hidden columns (stored in Set - columns NOT in this set are visible)
// This way, new columns are visible by default
const hiddenColumns = reactive<Set<string>>(new Set());

// Default hidden columns (columns hidden by default on first load)
const DEFAULT_HIDDEN_COLUMNS = [
  "notes",
  "subscriptions",
  "usage",
  "concurrency",
];

// localStorage key for column settings
const HIDDEN_COLUMNS_KEY = "user-hidden-columns";

// Load saved column settings
const loadSavedColumns = () => {
  try {
    const saved = localStorage.getItem(HIDDEN_COLUMNS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as string[];
      parsed.forEach((key) => hiddenColumns.add(key));
    } else {
      // Use default hidden columns on first load
      DEFAULT_HIDDEN_COLUMNS.forEach((key) => hiddenColumns.add(key));
    }
  } catch (e) {
    console.error("Failed to load saved columns:", e);
    DEFAULT_HIDDEN_COLUMNS.forEach((key) => hiddenColumns.add(key));
  }
};

// Save column settings to localStorage
const saveColumnsToStorage = () => {
  try {
    localStorage.setItem(
      HIDDEN_COLUMNS_KEY,
      JSON.stringify([...hiddenColumns]),
    );
  } catch (e) {
    console.error("Failed to save columns:", e);
  }
};

// Toggle column visibility
const toggleColumn = (key: string) => {
  if (hiddenColumns.has(key)) {
    hiddenColumns.delete(key);
  } else {
    hiddenColumns.add(key);
  }
  saveColumnsToStorage();
};

// Check if column is visible (not in hidden set)
const isColumnVisible = (key: string) => !hiddenColumns.has(key);

// Filtered columns based on visibility
const columns = computed<Column[]>(() =>
  allColumns.value.filter(
    (col) =>
      col.key === "email" ||
      col.key === "actions" ||
      !hiddenColumns.has(col.key),
  ),
);

const users = ref<AdminUser[]>([]);
const loading = ref(false);
const searchQuery = ref("");

// Filter values (role, status, and custom attributes)
const filters = reactive({
  role: "",
  status: "",
});
const activeAttributeFilters = reactive<Record<number, string>>({});

// Visible filters tracking (which filters are shown in the UI)
// Keys: 'role', 'status', 'attr_${id}'
const visibleFilters = reactive<Set<string>>(new Set());

// Dropdown states
const showFilterDropdown = ref(false);
const showColumnDropdown = ref(false);

// Dropdown refs for click outside detection
const filterDropdownRef = ref<HTMLElement | null>(null);
const columnDropdownRef = ref<HTMLElement | null>(null);

// localStorage keys
const FILTER_VALUES_KEY = "user-filter-values";
const VISIBLE_FILTERS_KEY = "user-visible-filters";

// All filterable attribute definitions (enabled attributes)
const filterableAttributes = computed(() =>
  attributeDefinitions.value.filter((def) => def.enabled),
);

// Built-in filter definitions
const builtInFilters = computed(() => [
  { key: "role", name: "角色", type: "select" as const },
  { key: "status", name: "状态", type: "select" as const },
]);

// Load saved filters from localStorage
const loadSavedFilters = () => {
  try {
    // Load visible filters
    const savedVisible = localStorage.getItem(VISIBLE_FILTERS_KEY);
    if (savedVisible) {
      const parsed = JSON.parse(savedVisible) as string[];
      parsed.forEach((key) => visibleFilters.add(key));
    }
    // Load filter values
    const savedValues = localStorage.getItem(FILTER_VALUES_KEY);
    if (savedValues) {
      const parsed = JSON.parse(savedValues);
      if (parsed.role) filters.role = parsed.role;
      if (parsed.status) filters.status = parsed.status;
      if (parsed.attributes) {
        Object.assign(activeAttributeFilters, parsed.attributes);
      }
    }
  } catch (e) {
    console.error("Failed to load saved filters:", e);
  }
};

// Save filters to localStorage
const saveFiltersToStorage = () => {
  try {
    // Save visible filters
    localStorage.setItem(
      VISIBLE_FILTERS_KEY,
      JSON.stringify([...visibleFilters]),
    );
    // Save filter values
    const values = {
      role: filters.role,
      status: filters.status,
      attributes: activeAttributeFilters,
    };
    localStorage.setItem(FILTER_VALUES_KEY, JSON.stringify(values));
  } catch (e) {
    console.error("Failed to save filters:", e);
  }
};

// Get attribute definition by ID
const getAttributeDefinition = (
  attrId: number,
): UserAttributeDefinition | undefined => {
  return attributeDefinitions.value.find((d) => d.id === attrId);
};
const usageStats = ref<Record<string, BatchUserUsageStats>>({});
// User attribute definitions and values
const attributeDefinitions = ref<UserAttributeDefinition[]>([]);
const userAttributeValues = ref<Record<number, Record<number, string>>>({});
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0,
  pages: 0,
});

const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteDialog = ref(false);
const showApiKeysModal = ref(false);
const showAttributesModal = ref(false);
const editingUser = ref<AdminUser | null>(null);
const deletingUser = ref<AdminUser | null>(null);
const viewingUser = ref<AdminUser | null>(null);
let abortController: AbortController | null = null;

// Action Menu State
const activeMenuId = ref<number | null>(null);
const menuPosition = ref<{ top: number; left: number } | null>(null);

const openActionMenu = (user: AdminUser, e: MouseEvent) => {
  if (activeMenuId.value === user.id) {
    closeActionMenu();
  } else {
    const target = e.currentTarget as HTMLElement;
    if (!target) {
      closeActionMenu();
      return;
    }

    const rect = target.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = 240;
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left, top;

    if (viewportWidth < 768) {
      // 居中显示,水平位置
      left = Math.max(
        padding,
        Math.min(
          rect.left + rect.width / 2 - menuWidth / 2,
          viewportWidth - menuWidth - padding,
        ),
      );

      // 优先显示在按钮下方
      top = rect.bottom + 4;

      // 如果下方空间不够,显示在上方
      if (top + menuHeight > viewportHeight - padding) {
        top = rect.top - menuHeight - 4;
        // 如果上方也不够,就贴在视口顶部
        if (top < padding) {
          top = padding;
        }
      }
    } else {
      left = Math.max(
        padding,
        Math.min(e.clientX - menuWidth, viewportWidth - menuWidth - padding),
      );
      top = e.clientY;
      if (top + menuHeight > viewportHeight - padding) {
        top = viewportHeight - menuHeight - padding;
      }
    }

    menuPosition.value = { top, left };
    activeMenuId.value = user.id;
  }
};

const closeActionMenu = () => {
  activeMenuId.value = null;
  menuPosition.value = null;
};

// Close menu when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (
    !target.closest(".action-menu-trigger") &&
    !target.closest(".action-menu-content")
  ) {
    closeActionMenu();
  }
  // Close filter dropdown when clicking outside
  if (filterDropdownRef.value && !filterDropdownRef.value.contains(target)) {
    showFilterDropdown.value = false;
  }
  // Close column dropdown when clicking outside
  if (columnDropdownRef.value && !columnDropdownRef.value.contains(target)) {
    showColumnDropdown.value = false;
  }
};

// Allowed groups modal state
const showAllowedGroupsModal = ref(false);
const allowedGroupsUser = ref<AdminUser | null>(null);

// Balance (Deposit/Withdraw) modal state
const showBalanceModal = ref(false);
const balanceUser = ref<AdminUser | null>(null);
const balanceOperation = ref<"add" | "subtract">("add");

// 计算剩余天数
const getDaysRemaining = (expiresAt: string): number => {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const loadAttributeDefinitions = async () => {
  try {
    attributeDefinitions.value =
      await adminAPI.userAttributes.listEnabledDefinitions();
  } catch (e) {
    console.error("Failed to load attribute definitions:", e);
  }
};

// Handle attributes modal close - reload definitions and users
const handleAttributesModalClose = async () => {
  showAttributesModal.value = false;
  await loadAttributeDefinitions();
  loadUsers();
};

const loadUsers = async () => {
  abortController?.abort();
  const currentAbortController = new AbortController();
  abortController = currentAbortController;
  const { signal } = currentAbortController;
  loading.value = true;
  try {
    // Build attribute filters from active filters
    const attrFilters: Record<number, string> = {};
    for (const [attrId, value] of Object.entries(activeAttributeFilters)) {
      if (value) {
        attrFilters[Number(attrId)] = value;
      }
    }

    const response = await adminAPI.users.list(
      pagination.page,
      pagination.page_size,
      {
        role: filters.role as any,
        status: filters.status as any,
        search: searchQuery.value || undefined,
        attributes:
          Object.keys(attrFilters).length > 0 ? attrFilters : undefined,
      },
      { signal },
    );
    if (signal.aborted) {
      return;
    }
    users.value = response.items;
    pagination.total = response.total;
    pagination.pages = response.pages;

    // Load usage stats and attribute values for all users in the list
    if (response.items.length > 0) {
      const userIds = response.items.map((u) => u.id);
      // Load usage stats
      try {
        const usageResponse =
          await adminAPI.dashboard.getBatchUsersUsage(userIds);
        if (signal.aborted) {
          return;
        }
        usageStats.value = usageResponse.stats;
      } catch (e) {
        if (signal.aborted) {
          return;
        }
        console.error("Failed to load usage stats:", e);
      }
      // Load attribute values
      if (attributeDefinitions.value.length > 0) {
        try {
          const attrResponse =
            await adminAPI.userAttributes.getBatchUserAttributes(userIds);
          if (signal.aborted) {
            return;
          }
          userAttributeValues.value = attrResponse.attributes;
        } catch (e) {
          if (signal.aborted) {
            return;
          }
          console.error("Failed to load user attribute values:", e);
        }
      }
    }
  } catch (error: any) {
    const errorInfo = error as { name?: string; code?: string };
    if (
      errorInfo?.name === "AbortError" ||
      errorInfo?.name === "CanceledError" ||
      errorInfo?.code === "ERR_CANCELED"
    ) {
      return;
    }
    const message =
      error.response?.data?.detail || error.message || "加载用户列表失败";
    appStore.showError(message);
    console.error("Error loading users:", error);
  } finally {
    if (abortController === currentAbortController) {
      loading.value = false;
    }
  }
};

let searchTimeout: ReturnType<typeof setTimeout>;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.page = 1;
    loadUsers();
  }, 300);
};

const handlePageChange = (page: number) => {
  // 确保页码在有效范围内
  const validPage = Math.max(1, Math.min(page, pagination.pages || 1));
  pagination.page = validPage;
  loadUsers();
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.page_size = pageSize;
  pagination.page = 1;
  loadUsers();
};

// Filter helpers
const getAttributeDefinitionName = (attrId: number): string => {
  const def = attributeDefinitions.value.find((d) => d.id === attrId);
  return def?.name || String(attrId);
};

// Toggle a built-in filter (role/status)
const toggleBuiltInFilter = (key: string) => {
  if (visibleFilters.has(key)) {
    visibleFilters.delete(key);
    if (key === "role") filters.role = "";
    if (key === "status") filters.status = "";
  } else {
    visibleFilters.add(key);
  }
  saveFiltersToStorage();
  pagination.page = 1;
  loadUsers();
};

// Toggle a custom attribute filter
const toggleAttributeFilter = (attr: UserAttributeDefinition) => {
  const key = `attr_${attr.id}`;
  if (visibleFilters.has(key)) {
    visibleFilters.delete(key);
    delete activeAttributeFilters[attr.id];
  } else {
    visibleFilters.add(key);
    activeAttributeFilters[attr.id] = "";
  }
  saveFiltersToStorage();
  pagination.page = 1;
  loadUsers();
};

const updateAttributeFilter = (attrId: number, value: string) => {
  activeAttributeFilters[attrId] = value;
};

// Apply filter and save to localStorage
const applyFilter = () => {
  saveFiltersToStorage();
  loadUsers();
};

const handleEdit = (user: AdminUser) => {
  editingUser.value = user;
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingUser.value = null;
};

const handleToggleStatus = async (user: AdminUser) => {
  const newStatus = user.status === "active" ? "disabled" : "active";
  try {
    await adminAPI.users.toggleStatus(user.id, newStatus);
    appStore.showSuccess(newStatus === "active" ? "用户已启用" : "用户已禁用");
    loadUsers();
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || "更新用户状态失败");
    console.error("Error toggling user status:", error);
  }
};

const handleViewApiKeys = (user: AdminUser) => {
  viewingUser.value = user;
  showApiKeysModal.value = true;
};

const closeApiKeysModal = () => {
  showApiKeysModal.value = false;
  viewingUser.value = null;
};

const handleAllowedGroups = (user: AdminUser) => {
  allowedGroupsUser.value = user;
  showAllowedGroupsModal.value = true;
};

const closeAllowedGroupsModal = () => {
  showAllowedGroupsModal.value = false;
  allowedGroupsUser.value = null;
};

const handleDelete = (user: AdminUser) => {
  deletingUser.value = user;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!deletingUser.value) return;
  try {
    await adminAPI.users.delete(deletingUser.value.id);
    appStore.showSuccess("成功");
    showDeleteDialog.value = false;
    deletingUser.value = null;
    loadUsers();
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || "删除用户失败");
    console.error("Error deleting user:", error);
  }
};

const handleDeposit = (user: AdminUser) => {
  balanceUser.value = user;
  balanceOperation.value = "add";
  showBalanceModal.value = true;
};

const handleWithdraw = (user: AdminUser) => {
  balanceUser.value = user;
  balanceOperation.value = "subtract";
  showBalanceModal.value = true;
};

const closeBalanceModal = () => {
  showBalanceModal.value = false;
  balanceUser.value = null;
};

// 滚动时关闭菜单
const handleScroll = () => {
  closeActionMenu();
};

onMounted(async () => {
  await loadAttributeDefinitions();
  loadSavedFilters();
  loadSavedColumns();
  loadUsers();
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("scroll", handleScroll, true);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("scroll", handleScroll, true);
  clearTimeout(searchTimeout);
  abortController?.abort();
});
</script>
