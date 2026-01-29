<template>
  <AppLayout>
    <div class="mx-auto max-w-2xl space-y-6">
      <!-- Current Balance Card -->
      <div class="card overflow-hidden">
        <div
          class="bg-gradient-to-br from-primary-500 to-primary-600 px-6 py-8 text-center"
        >
          <div
            class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
          >
            <Icon name="creditCard" size="xl" class="text-white" />
          </div>
          <p class="text-sm font-medium text-primary-100">当前余额</p>
          <p class="mt-2 text-4xl font-bold text-white">
            ${{ user?.balance?.toFixed(2) || "0.00" }}
          </p>
          <p class="mt-2 text-sm text-primary-100">
            并发数: {{ user?.concurrency || 0 }} 请求
          </p>
        </div>
      </div>

      <!-- Redeem Form -->
      <div class="card">
        <div class="p-6">
          <form class="space-y-5" @submit.prevent="handleRedeem">
            <div>
              <label for="code" class="input-label"> 兑换码 </label>
              <div class="relative mt-1">
                <div
                  class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"
                >
                  <Icon
                    name="gift"
                    size="md"
                    class="text-gray-400 dark:text-dark-500"
                  />
                </div>
                <input
                  id="code"
                  v-model="redeemCode"
                  type="text"
                  required
                  :placeholder="'请输入兑换码'"
                  :disabled="submitting"
                  class="input py-3 pl-12 text-lg"
                />
              </div>
              <p class="input-hint">兑换码区分大小写</p>
            </div>

            <button
              type="submit"
              :disabled="!redeemCode || submitting"
              class="btn btn-primary w-full py-3"
            >
              <svg
                v-if="submitting"
                class="-ml-1 mr-2 h-5 w-5 animate-spin"
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
              <Icon v-else name="checkCircle" size="md" class="mr-2" />
              {{ submitting ? "兑换中..." : "兑换" }}
            </button>
          </form>
        </div>
      </div>

      <!-- Success Message -->
      <transition name="fade">
        <div
          v-if="redeemResult"
          class="card border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-900/20"
        >
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30"
              >
                <Icon
                  name="checkCircle"
                  size="md"
                  class="text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <div class="flex-1">
                <h3
                  class="text-sm font-semibold text-emerald-800 dark:text-emerald-300"
                >
                  兑换成功！
                </h3>
                <div
                  class="mt-2 text-sm text-emerald-700 dark:text-emerald-400"
                >
                  <p>{{ redeemResult.message }}</p>
                  <div class="mt-3 space-y-1">
                    <p
                      v-if="redeemResult.type === 'balance'"
                      class="font-medium"
                    >
                      已添加: ${{ redeemResult.value.toFixed(2) }}
                    </p>
                    <p
                      v-else-if="redeemResult.type === 'concurrency'"
                      class="font-medium"
                    >
                      已添加: {{ redeemResult.value }}
                      并发请求
                    </p>
                    <p
                      v-else-if="redeemResult.type === 'subscription'"
                      class="font-medium"
                    >
                      订阅已分配
                      <span v-if="redeemResult.group_name">
                        - {{ redeemResult.group_name }}</span
                      >
                      <span v-if="redeemResult.validity_days">
                        ({{ `${redeemResult.validity_days} 天` }})</span
                      >
                    </p>
                    <p v-if="redeemResult.new_balance !== undefined">
                      新余额:
                      <span class="font-semibold"
                        >${{ redeemResult.new_balance.toFixed(2) }}</span
                      >
                    </p>
                    <p v-if="redeemResult.new_concurrency !== undefined">
                      新并发数:
                      <span class="font-semibold"
                        >{{ redeemResult.new_concurrency }} 请求</span
                      >
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Error Message -->
      <transition name="fade">
        <div
          v-if="errorMessage"
          class="card border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-900/20"
        >
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div
                class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30"
              >
                <Icon
                  name="exclamationCircle"
                  size="md"
                  class="text-red-600 dark:text-red-400"
                />
              </div>
              <div class="flex-1">
                <h3
                  class="text-sm font-semibold text-red-800 dark:text-red-300"
                >
                  兑换失败
                </h3>
                <p class="mt-2 text-sm text-red-700 dark:text-red-400">
                  {{ errorMessage }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Information Card -->
      <div
        class="card border-primary-200 bg-primary-50 dark:border-primary-800/50 dark:bg-primary-900/20"
      >
        <div class="p-6">
          <div class="flex items-start gap-4">
            <div
              class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30"
            >
              <Icon
                name="infoCircle"
                size="md"
                class="text-primary-600 dark:text-primary-400"
              />
            </div>
            <div class="flex-1">
              <h3
                class="text-sm font-semibold text-primary-800 dark:text-primary-300"
              >
                关于兑换码
              </h3>
              <ul
                class="mt-2 list-inside list-disc space-y-1 text-sm text-primary-700 dark:text-primary-400"
              >
                <li>每个兑换码只能使用一次</li>
                <li>兑换码可以增加余额、并发数或试用权限</li>
                <li>
                  如有兑换问题，请联系客服
                  <span
                    v-if="contactInfo"
                    class="ml-1.5 inline-flex items-center rounded-md bg-primary-200/50 px-2 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-800/40 dark:text-primary-200"
                  >
                    {{ contactInfo }}
                  </span>
                </li>
                <li>余额和并发数即时更新</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <div class="border-b border-gray-100 px-6 py-4 dark:border-dark-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            最近活动
          </h2>
        </div>
        <div class="p-6">
          <!-- Loading State -->
          <div
            v-if="loadingHistory"
            class="flex items-center justify-center py-8"
          >
            <svg
              class="h-6 w-6 animate-spin text-primary-500"
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
          </div>

          <!-- History List -->
          <div v-else-if="history.length > 0" class="space-y-3">
            <div
              v-for="item in history"
              :key="item.id"
              class="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-dark-800"
            >
              <div class="flex items-center gap-4">
                <div
                  :class="[
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    isBalanceType(item.type)
                      ? item.value >= 0
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                      : isSubscriptionType(item.type)
                        ? 'bg-purple-100 dark:bg-purple-900/30'
                        : item.value >= 0
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-orange-100 dark:bg-orange-900/30',
                  ]"
                >
                  <!-- 余额类型图标 -->
                  <Icon
                    v-if="isBalanceType(item.type)"
                    name="dollar"
                    size="md"
                    :class="
                      item.value >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    "
                  />
                  <!-- 订阅类型图标 -->
                  <Icon
                    v-else-if="isSubscriptionType(item.type)"
                    name="badge"
                    size="md"
                    class="text-purple-600 dark:text-purple-400"
                  />
                  <!-- 并发类型图标 -->
                  <Icon
                    v-else
                    name="bolt"
                    size="md"
                    :class="
                      item.value >= 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-orange-600 dark:text-orange-400'
                    "
                  />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ getHistoryItemTitle(item) }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-dark-400">
                    {{ formatDateTime(item.used_at) }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p
                  :class="[
                    'text-sm font-semibold',
                    isBalanceType(item.type)
                      ? item.value >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                      : isSubscriptionType(item.type)
                        ? 'text-purple-600 dark:text-purple-400'
                        : item.value >= 0
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-orange-600 dark:text-orange-400',
                  ]"
                >
                  {{ formatHistoryValue(item) }}
                </p>
                <p
                  v-if="!isAdminAdjustment(item.type)"
                  class="font-mono text-xs text-gray-400 dark:text-dark-500"
                >
                  {{ item.code.slice(0, 8) }}...
                </p>
                <p v-else class="text-xs text-gray-400 dark:text-dark-500">
                  管理员调整
                </p>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state py-8">
            <div
              class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-dark-800"
            >
              <Icon
                name="clock"
                size="xl"
                class="text-gray-400 dark:text-dark-500"
              />
            </div>
            <p class="text-sm text-gray-500 dark:text-dark-400">
              您的兑换历史将显示在这里
            </p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useAppStore } from "@/stores/app";
import { useSubscriptionStore } from "@/stores/subscriptions";
import { redeemAPI, authAPI, type RedeemHistoryItem } from "@/api";

const authStore = useAuthStore();
const appStore = useAppStore();
const subscriptionStore = useSubscriptionStore();

const user = computed(() => authStore.user);

const redeemCode = ref("");
const submitting = ref(false);
const redeemResult = ref<{
  message: string;
  type: string;
  value: number;
  new_balance?: number;
  new_concurrency?: number;
  group_name?: string;
  validity_days?: number;
} | null>(null);
const errorMessage = ref("");

// History data
const history = ref<RedeemHistoryItem[]>([]);
const loadingHistory = ref(false);
const contactInfo = ref("");

// Helper functions for history display
const isBalanceType = (type: string) => {
  return type === "balance" || type === "admin_balance";
};

const isSubscriptionType = (type: string) => {
  return type === "subscription";
};

const isAdminAdjustment = (type: string) => {
  return type === "admin_balance" || type === "admin_concurrency";
};

const getHistoryItemTitle = (item: RedeemHistoryItem) => {
  if (item.type === "balance") {
    return "余额充值（兑换）";
  } else if (item.type === "admin_balance") {
    return item.value >= 0 ? "余额充值（管理员）" : "余额扣除（管理员）";
  } else if (item.type === "concurrency") {
    return "并发增加（兑换）";
  } else if (item.type === "admin_concurrency") {
    return item.value >= 0 ? "并发增加（管理员）" : "并发减少（管理员）";
  } else if (item.type === "subscription") {
    return "订阅已分配";
  }
  return "未知";
};

const formatHistoryValue = (item: RedeemHistoryItem) => {
  if (isBalanceType(item.type)) {
    const sign = item.value >= 0 ? "+" : "";
    return `${sign}$${item.value.toFixed(2)}`;
  } else if (isSubscriptionType(item.type)) {
    // 订阅类型显示有效天数和分组名称
    const days = item.validity_days || Math.round(item.value);
    const groupName = item.group?.name || "";
    return groupName ? `${days}${"天"} - ${groupName}` : `${days}${"天"}`;
  } else {
    const sign = item.value >= 0 ? "+" : "";
    return `${sign}${item.value} ${"请求"}`;
  }
};

const fetchHistory = async () => {
  loadingHistory.value = true;
  try {
    history.value = await redeemAPI.getHistory();
  } catch (error) {
    console.error("Failed to fetch history:", error);
  } finally {
    loadingHistory.value = false;
  }
};

const handleRedeem = async () => {
  if (!redeemCode.value.trim()) {
    appStore.showError("请输入兑换码");
    return;
  }

  submitting.value = true;
  errorMessage.value = "";
  redeemResult.value = null;

  try {
    const result = await redeemAPI.redeem(redeemCode.value.trim());

    redeemResult.value = result;

    // Refresh user data to get updated balance/concurrency
    await authStore.refreshUser();

    // If subscription type, immediately refresh subscription status
    if (result.type === "subscription") {
      try {
        await subscriptionStore.fetchActiveSubscriptions(true); // force refresh
      } catch (error) {
        console.error("Failed to refresh subscriptions after redeem:", error);
        appStore.showWarning("兑换成功，但订阅状态刷新失败。");
      }
    }

    // Clear the input
    redeemCode.value = "";

    // Refresh history
    await fetchHistory();

    // Show success toast
    appStore.showSuccess("兑换成功！");
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.detail || "兑换失败，请检查兑换码后重试。";

    appStore.showError("兑换失败");
  } finally {
    submitting.value = false;
  }
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(() => {
  fetchHistory();
});
</script>
