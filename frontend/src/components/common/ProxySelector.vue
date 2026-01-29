<template>
  <div ref="containerRef" class="relative">
    <button
      type="button"
      :disabled="disabled"
      :class="[
        'select-trigger',
        isOpen && 'select-trigger-open',
        disabled && 'select-trigger-disabled',
      ]"
      @click="toggle"
    >
      <span class="select-value">
        {{ selectedLabel }}
      </span>
      <span class="select-icon">
        <Icon
          name="chevronDown"
          size="md"
          :class="['transition-transform duration-200', isOpen && 'rotate-180']"
        />
      </span>
    </button>

    <Transition name="select-dropdown">
      <div v-if="isOpen" class="select-dropdown">
        <!-- Search and Batch Test Header -->
        <div class="select-header">
          <div class="select-search">
            <Icon name="search" size="sm" class="text-gray-400" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="'搜索代理...'"
              class="select-search-input"
              @click.stop
            />
          </div>
          <button
            v-if="proxies.length > 0"
            type="button"
            :disabled="batchTesting"
            class="batch-test-btn"
            :title="'批量测试'"
            @click.stop="handleBatchTest"
          >
            <svg
              v-if="batchTesting"
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
            <Icon v-else name="play" size="sm" />
          </button>
        </div>

        <!-- Options list -->
        <div class="select-options">
          <!-- No Proxy option -->
          <div
            :class="[
              'select-option',
              modelValue === null && 'select-option-selected',
            ]"
            @click="selectOption(null)"
          >
            <span class="select-option-label">无代理</span>
            <Icon
              v-if="modelValue === null"
              name="check"
              size="sm"
              class="text-primary-500"
            />
          </div>

          <!-- Proxy options -->
          <div
            v-for="proxy in filteredProxies"
            :key="proxy.id"
            :class="[
              'select-option',
              modelValue === proxy.id && 'select-option-selected',
            ]"
            @click="selectOption(proxy.id)"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate font-medium">{{ proxy.name }}</span>
                <!-- Account count badge -->
                <span
                  v-if="proxy.account_count !== undefined"
                  class="inline-flex flex-shrink-0 items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-dark-600 dark:text-gray-400"
                >
                  {{ proxy.account_count }}
                </span>
                <!-- Test result badges -->
                <template v-if="testResults[proxy.id]">
                  <span
                    v-if="testResults[proxy.id].success"
                    class="inline-flex flex-shrink-0 items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >
                    <span v-if="testResults[proxy.id].country">{{
                      testResults[proxy.id].country
                    }}</span>
                    <span v-if="testResults[proxy.id].latency_ms"
                      >{{ testResults[proxy.id].latency_ms }}ms</span
                    >
                  </span>
                  <span
                    v-else
                    class="inline-flex flex-shrink-0 items-center rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  >
                    失败
                  </span>
                </template>
              </div>
              <div class="truncate text-xs text-gray-500 dark:text-gray-400">
                {{ proxy.protocol }}://{{ proxy.host }}:{{ proxy.port }}
              </div>
            </div>

            <!-- Individual test button -->
            <button
              type="button"
              :disabled="testingProxyIds.has(proxy.id)"
              class="test-btn"
              :title="'测试连接'"
              @click.stop="handleTestProxy(proxy)"
            >
              <svg
                v-if="testingProxyIds.has(proxy.id)"
                class="h-3.5 w-3.5 animate-spin"
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
              <Icon v-else name="play" size="xs" />
            </button>

            <Icon
              v-if="modelValue === proxy.id"
              name="check"
              size="sm"
              class="flex-shrink-0 text-primary-500"
            />
          </div>

          <!-- Empty state -->
          <div
            v-if="filteredProxies.length === 0 && searchQuery"
            class="select-empty"
          >
            无匹配选项
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import { adminAPI } from "@/api/admin";
import type { Proxy } from "@/types";

interface ProxyTestResult {
  success: boolean;
  message: string;
  latency_ms?: number;
  ip_address?: string;
  city?: string;
  region?: string;
  country?: string;
}

interface Props {
  modelValue: number | null;
  proxies: Proxy[];
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: number | null];
}>();

const isOpen = ref(false);
const searchQuery = ref("");
const containerRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

// Test state
const testResults = reactive<Record<number, ProxyTestResult>>({});
const testingProxyIds = reactive(new Set<number>());
const batchTesting = ref(false);

const selectedProxy = computed(() => {
  if (props.modelValue === null) return null;
  return props.proxies.find((p) => p.id === props.modelValue) || null;
});

const selectedLabel = computed(() => {
  if (!selectedProxy.value) {
    return "无代理";
  }
  const proxy = selectedProxy.value;
  return `${proxy.name} (${proxy.protocol}://${proxy.host}:${proxy.port})`;
});

const filteredProxies = computed(() => {
  if (!searchQuery.value) {
    return props.proxies;
  }
  const query = searchQuery.value.toLowerCase();
  return props.proxies.filter((proxy) => {
    const name = proxy.name.toLowerCase();
    const host = proxy.host.toLowerCase();
    return name.includes(query) || host.includes(query);
  });
});

const toggle = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
};

const selectOption = (value: number | null) => {
  emit("update:modelValue", value);
  isOpen.value = false;
  searchQuery.value = "";
};

const handleTestProxy = async (proxy: Proxy) => {
  if (testingProxyIds.has(proxy.id)) return;

  testingProxyIds.add(proxy.id);
  try {
    const result = await adminAPI.proxies.testProxy(proxy.id);
    testResults[proxy.id] = result;
  } catch (error: any) {
    testResults[proxy.id] = {
      success: false,
      message: error.response?.data?.detail || "Test failed",
    };
  } finally {
    testingProxyIds.delete(proxy.id);
  }
};

const handleBatchTest = async () => {
  if (batchTesting.value || props.proxies.length === 0) return;

  batchTesting.value = true;

  // Test all proxies in parallel
  const testPromises = props.proxies.map(async (proxy) => {
    testingProxyIds.add(proxy.id);
    try {
      const result = await adminAPI.proxies.testProxy(proxy.id);
      testResults[proxy.id] = result;
    } catch (error: any) {
      testResults[proxy.id] = {
        success: false,
        message: error.response?.data?.detail || "Test failed",
      };
    } finally {
      testingProxyIds.delete(proxy.id);
    }
  });

  await Promise.all(testPromises);
  batchTesting.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (
    containerRef.value &&
    !containerRef.value.contains(event.target as Node)
  ) {
    isOpen.value = false;
    searchQuery.value = "";
  }
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === "Escape" && isOpen.value) {
    isOpen.value = false;
    searchQuery.value = "";
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscape);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleEscape);
});
</script>
