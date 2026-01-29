<template>
  <div
    class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/30"
  >
    <div class="flex items-start gap-4">
      <div
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500"
      >
        <Icon name="link" size="md" class="text-white" />
      </div>
      <div class="flex-1">
        <h4 class="mb-3 font-semibold text-blue-900 dark:text-blue-200">
          {{ oauthTitle }}
        </h4>

        <!-- Auth Method Selection -->
        <div v-if="showCookieOption" class="mb-4">
          <label
            class="mb-2 block text-sm font-medium text-blue-800 dark:text-blue-300"
          >
            {{ methodLabel }}
          </label>
          <div class="flex gap-4">
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="inputMethod"
                type="radio"
                value="manual"
                class="text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-blue-900 dark:text-blue-200">{{
                "手动授权"
              }}</span>
            </label>
            <label class="flex cursor-pointer items-center gap-2">
              <input
                v-model="inputMethod"
                type="radio"
                value="cookie"
                class="text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm text-blue-900 dark:text-blue-200">{{
                "Cookie 自动授权"
              }}</span>
            </label>
          </div>
        </div>

        <!-- Cookie Auto-Auth Form -->
        <div v-if="inputMethod === 'cookie'" class="space-y-4">
          <div
            class="rounded-lg border border-blue-300 bg-white/80 p-4 dark:border-blue-600 dark:bg-gray-800/80"
          >
            <p class="mb-3 text-sm text-blue-700 dark:text-blue-300">
              {{
                "使用 claude.ai sessionKey 自动完成 OAuth 授权，无需手动打开浏览器。"
              }}
            </p>

            <!-- sessionKey Input -->
            <div class="mb-4">
              <label
                class="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                <Icon name="key" size="sm" class="text-blue-500" />
                sessionKey
                <span
                  v-if="parsedKeyCount > 1 && allowMultiple"
                  class="rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white"
                >
                  {{ `${parsedKeyCount} 个密钥` }}
                </span>
                <button
                  v-if="showHelp"
                  type="button"
                  class="text-blue-500 hover:text-blue-600"
                  @click="showHelpDialog = !showHelpDialog"
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
                      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                    />
                  </svg>
                </button>
              </label>
              <textarea
                v-model="sessionKeyInput"
                rows="3"
                class="input w-full resize-y font-mono text-sm"
                :placeholder="
                  allowMultiple
                    ? '每行一个 sessionKey，例如：\nsk-ant-sid01-xxxxx...\nsk-ant-sid01-yyyyy...'
                    : 'sk-ant-sid01-xxxxx...'
                "
              ></textarea>
              <p
                v-if="parsedKeyCount > 1 && allowMultiple"
                class="mt-1 text-xs text-blue-600 dark:text-blue-400"
              >
                {{ `将批量创建 ${parsedKeyCount} 个账号` }}
              </p>
            </div>

            <!-- Help Section -->
            <div
              v-if="showHelpDialog && showHelp"
              class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/30"
            >
              <h5 class="mb-2 font-semibold text-amber-800 dark:text-amber-200">
                如何获取 sessionKey
              </h5>
              <ol
                class="list-inside list-decimal space-y-1 text-xs text-amber-700 dark:text-amber-300"
              >
                <li>在浏览器中登录 claude.ai</li>
                <li>按 F12 打开开发者工具</li>
                <li>切换到 Application 标签</li>
                <li>找到 Cookies → https://claude.ai</li>
                <li>找到 sessionKey 所在行</li>
                <li>复制 Value 列的值</li>
              </ol>
              <p
                class="mt-2 text-xs text-amber-600 dark:text-amber-400"
                v-text="'sessionKey 通常以 sk-ant-sid01- 开头'"
              ></p>
            </div>

            <!-- Error Message -->
            <div
              v-if="error"
              class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-700 dark:bg-red-900/30"
            >
              <p
                class="whitespace-pre-line text-sm text-red-600 dark:text-red-400"
              >
                {{ error }}
              </p>
            </div>

            <!-- Auth Button -->
            <button
              type="button"
              class="btn btn-primary w-full"
              :disabled="loading || !sessionKeyInput.trim()"
              @click="handleCookieAuth"
            >
              <svg
                v-if="loading"
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
              <Icon v-else name="sparkles" size="sm" class="mr-2" />
              {{ loading ? "授权中..." : "开始自动授权" }}
            </button>
          </div>
        </div>

        <!-- Manual Authorization Flow -->
        <div v-else class="space-y-4">
          <p class="mb-4 text-sm text-blue-800 dark:text-blue-300">
            {{ oauthFollowSteps }}
          </p>

          <!-- Step 1: Generate Auth URL -->
          <div
            class="rounded-lg border border-blue-300 bg-white/80 p-4 dark:border-blue-600 dark:bg-gray-800/80"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white"
              >
                1
              </div>
              <div class="flex-1">
                <p class="mb-2 font-medium text-blue-900 dark:text-blue-200">
                  {{ oauthStep1GenerateUrl }}
                </p>
                <div v-if="showProjectId && platform === 'gemini'" class="mb-3">
                  <label class="input-label flex items-center gap-2">
                    Project ID（可选）
                    <a
                      href="https://console.cloud.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1 text-xs font-normal text-blue-500 hover:text-blue-600 dark:text-blue-400"
                    >
                      <svg
                        class="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="1.5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                        />
                      </svg>
                      如何获取
                    </a>
                  </label>
                  <input
                    v-model="projectId"
                    type="text"
                    class="input w-full font-mono text-sm"
                    :placeholder="'例如：my-gcp-project 或 cloud-ai-companion-xxxxx'"
                  />
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {{
                      "留空则在兑换授权码后自动探测；若自动探测失败，可填写后重新生成授权链接再授权。"
                    }}
                  </p>
                </div>
                <button
                  v-if="!authUrl"
                  type="button"
                  :disabled="loading"
                  class="btn btn-primary text-sm"
                  @click="handleGenerateUrl"
                >
                  <svg
                    v-if="loading"
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
                  <Icon v-else name="link" size="sm" class="mr-2" />
                  {{ loading ? "生成中..." : oauthGenerateAuthUrl }}
                </button>
                <div v-else class="space-y-3">
                  <div class="flex items-center gap-2">
                    <input
                      :value="authUrl"
                      readonly
                      type="text"
                      class="input flex-1 bg-gray-50 font-mono text-xs dark:bg-gray-700"
                    />
                    <button
                      type="button"
                      class="btn btn-secondary p-2"
                      title="Copy URL"
                      @click="handleCopyUrl"
                    >
                      <svg
                        v-if="!copied"
                        class="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="1.5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                        />
                      </svg>
                      <Icon
                        v-else
                        name="check"
                        size="sm"
                        class="text-green-500"
                        :stroke-width="2"
                      />
                    </button>
                  </div>
                  <button
                    type="button"
                    class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    @click="handleRegenerate"
                  >
                    <Icon name="refresh" size="xs" class="mr-1 inline" />
                    重新生成
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Open URL and authorize -->
          <div
            class="rounded-lg border border-blue-300 bg-white/80 p-4 dark:border-blue-600 dark:bg-gray-800/80"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white"
              >
                2
              </div>
              <div class="flex-1">
                <p class="mb-2 font-medium text-blue-900 dark:text-blue-200">
                  {{ oauthStep2OpenUrl }}
                </p>
                <p class="text-sm text-blue-700 dark:text-blue-300">
                  {{ oauthOpenUrlDesc }}
                </p>
                <!-- OpenAI Important Notice -->
                <div
                  v-if="isOpenAI"
                  class="mt-2 rounded border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/30"
                >
                  <p
                    class="text-xs text-amber-800 dark:text-amber-300"
                    v-text="oauthImportantNotice"
                  ></p>
                </div>
                <!-- Proxy Warning (for non-OpenAI) -->
                <div
                  v-else-if="showProxyWarning"
                  class="mt-2 rounded border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-900/30"
                >
                  <p
                    class="text-xs text-yellow-800 dark:text-yellow-300"
                    v-text="
                      '注意：如果您配置了代理，请确保浏览器使用相同的代理访问授权页面。'
                    "
                  ></p>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Enter authorization code -->
          <div
            class="rounded-lg border border-blue-300 bg-white/80 p-4 dark:border-blue-600 dark:bg-gray-800/80"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white"
              >
                3
              </div>
              <div class="flex-1">
                <p class="mb-2 font-medium text-blue-900 dark:text-blue-200">
                  {{ oauthStep3EnterCode }}
                </p>
                <p
                  class="mb-3 text-sm text-blue-700 dark:text-blue-300"
                  v-text="oauthAuthCodeDesc"
                ></p>
                <div>
                  <label class="input-label">
                    <Icon
                      name="key"
                      size="sm"
                      class="mr-1 inline text-blue-500"
                    />
                    {{ oauthAuthCode }}
                  </label>
                  <textarea
                    v-model="authCodeInput"
                    rows="3"
                    class="input w-full resize-none font-mono text-sm"
                    :placeholder="oauthAuthCodePlaceholder"
                  ></textarea>
                  <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <Icon name="infoCircle" size="xs" class="mr-1 inline" />
                    {{ oauthAuthCodeHint }}
                  </p>

                  <!-- Gemini-specific state parameter warning -->
                  <div
                    v-if="platform === 'gemini'"
                    class="mt-3 rounded-lg border-2 border-amber-400 bg-amber-50 p-3 dark:border-amber-600 dark:bg-amber-900/30"
                  >
                    <div class="flex items-start gap-2">
                      <Icon
                        name="exclamationTriangle"
                        size="md"
                        class="flex-shrink-0 text-amber-600 dark:text-amber-400"
                        :stroke-width="2"
                      />
                      <div class="text-sm text-amber-800 dark:text-amber-300">
                        <p class="font-semibold">提示</p>
                        <p class="mt-1">
                          建议粘贴完整回调链接（包含 code 和 state）。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Error Message -->
                <div
                  v-if="error"
                  class="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-700 dark:bg-red-900/30"
                >
                  <p
                    class="whitespace-pre-line text-sm text-red-600 dark:text-red-400"
                  >
                    {{ error }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useClipboard } from "@/composables/useClipboard";
import type { AddMethod, AuthInputMethod } from "@/composables/useAccountOAuth";

interface Props {
  addMethod: AddMethod;
  authUrl?: string;
  sessionId?: string;
  loading?: boolean;
  error?: string;
  showHelp?: boolean;
  showProxyWarning?: boolean;
  allowMultiple?: boolean;
  methodLabel?: string;
  showCookieOption?: boolean; // Whether to show cookie auto-auth option
  platform?: "anthropic" | "openai" | "gemini" | "antigravity"; // Platform type for different UI/text
  showProjectId?: boolean; // New prop to control project ID visibility
}

const props = withDefaults(defineProps<Props>(), {
  authUrl: "",
  sessionId: "",
  loading: false,
  error: "",
  showHelp: true,
  showProxyWarning: true,
  allowMultiple: false,
  methodLabel: "Authorization Method",
  showCookieOption: true,
  platform: "anthropic",
  showProjectId: true,
});

const emit = defineEmits<{
  "generate-url": [];
  "exchange-code": [code: string];
  "cookie-auth": [sessionKey: string];
  "update:inputMethod": [method: AuthInputMethod];
}>();

const isOpenAI = computed(() => props.platform === "openai");

// Translation maps for different platforms
const translations: Record<string, Record<string, string>> = {
  openai: {
    title: "OpenAI OAuth 授权",
    followSteps: "请按照以下步骤完成授权：",
    step1GenerateUrl: "1. 生成授权 URL",
    generateAuthUrl: "生成授权链接",
    step2OpenUrl: "2. 打开授权链接",
    openUrlDesc: "点击上方按钮打开 OpenAI 授权页面",
    step3EnterCode: "3. 输入授权码",
    authCodeDesc: "在授权页面完成授权后，复制授权码并粘贴到下方",
    authCode: "授权码",
    authCodePlaceholder: "请输入授权码",
    authCodeHint: "从授权页面复制授权码粘贴到此处",
  },
  gemini: {
    title: "Gemini OAuth 授权",
    followSteps: "请按照以下步骤完成授权：",
    step1GenerateUrl: "1. 生成授权 URL",
    generateAuthUrl: "生成授权链接",
    step2OpenUrl: "2. 打开授权链接",
    openUrlDesc: "点击上方按钮打开 Gemini 授权页面",
    step3EnterCode: "3. 输入授权码",
    authCodeDesc: "在授权页面完成授权后，复制授权码并粘贴到下方",
    authCode: "授权码",
    authCodePlaceholder: "请输入授权码",
    authCodeHint: "从授权页面复制授权码粘贴到此处",
  },
  antigravity: {
    title: "Antigravity OAuth 授权",
    followSteps: "请按照以下步骤完成授权：",
    step1GenerateUrl: "1. 生成授权 URL",
    generateAuthUrl: "生成授权链接",
    step2OpenUrl: "2. 打开授权链接",
    openUrlDesc: "点击上方按钮打开 Antigravity 授权页面",
    step3EnterCode: "3. 输入授权码",
    authCodeDesc: "在授权页面完成授权后，复制授权码并粘贴到下方",
    authCode: "授权码",
    authCodePlaceholder: "请输入授权码",
    authCodeHint: "从授权页面复制授权码粘贴到此处",
  },
};

// Get current platform translations
const currentTranslations = computed(() => {
  return translations[props.platform] || translations.openai;
});

// Computed translations for current platform
const oauthTitle = computed(() => currentTranslations.value.title);
const oauthFollowSteps = computed(() => currentTranslations.value.followSteps);
const oauthStep1GenerateUrl = computed(
  () => currentTranslations.value.step1GenerateUrl,
);
const oauthGenerateAuthUrl = computed(
  () => currentTranslations.value.generateAuthUrl,
);
const oauthStep2OpenUrl = computed(
  () => currentTranslations.value.step2OpenUrl,
);
const oauthOpenUrlDesc = computed(() => currentTranslations.value.openUrlDesc);
const oauthStep3EnterCode = computed(
  () => currentTranslations.value.step3EnterCode,
);
const oauthAuthCodeDesc = computed(
  () => currentTranslations.value.authCodeDesc,
);
const oauthAuthCode = computed(() => currentTranslations.value.authCode);
const oauthAuthCodePlaceholder = computed(
  () => currentTranslations.value.authCodePlaceholder,
);
const oauthAuthCodeHint = computed(
  () => currentTranslations.value.authCodeHint,
);
const oauthImportantNotice = computed(() => {
  if (props.platform === "openai")
    return "重要提示：授权后页面可能会加载较长时间，请耐心等待。当浏览器地址栏变为 http://localhost... 开头时，表示授权已完成。";
  if (props.platform === "antigravity")
    return "重要提示：授权后页面可能会加载较长时间，请耐心等待。当浏览器地址栏变为 http://localhost... 开头时，表示授权已完成。";
  return "";
});

// Local state
const inputMethod = ref<AuthInputMethod>(
  props.showCookieOption ? "manual" : "manual",
);
const authCodeInput = ref("");
const sessionKeyInput = ref("");
const showHelpDialog = ref(false);
const oauthState = ref("");
const projectId = ref("");

// Clipboard
const { copied, copyToClipboard } = useClipboard();

// Computed
const parsedKeyCount = computed(() => {
  return sessionKeyInput.value
    .split("\n")
    .map((k) => k.trim())
    .filter((k) => k).length;
});

// Watchers
watch(inputMethod, (newVal) => {
  emit("update:inputMethod", newVal);
});

// Auto-extract code from callback URL (OpenAI/Gemini/Antigravity)
// e.g., http://localhost:8085/callback?code=xxx...&state=...
watch(authCodeInput, (newVal) => {
  if (
    props.platform !== "openai" &&
    props.platform !== "gemini" &&
    props.platform !== "antigravity"
  )
    return;

  const trimmed = newVal.trim();
  // Check if it looks like a URL with code parameter
  if (trimmed.includes("?") && trimmed.includes("code=")) {
    try {
      // Try to parse as URL
      const url = new URL(trimmed);
      const code = url.searchParams.get("code");
      const stateParam = url.searchParams.get("state");
      if (
        (props.platform === "gemini" || props.platform === "antigravity") &&
        stateParam
      ) {
        oauthState.value = stateParam;
      }
      if (code && code !== trimmed) {
        // Replace the input with just the code
        authCodeInput.value = code;
      }
    } catch {
      // If URL parsing fails, try regex extraction
      const match = trimmed.match(/[?&]code=([^&]+)/);
      const stateMatch = trimmed.match(/[?&]state=([^&]+)/);
      if (
        (props.platform === "gemini" || props.platform === "antigravity") &&
        stateMatch &&
        stateMatch[1]
      ) {
        oauthState.value = stateMatch[1];
      }
      if (match && match[1] && match[1] !== trimmed) {
        authCodeInput.value = match[1];
      }
    }
  }
});

// Methods
const handleGenerateUrl = () => {
  emit("generate-url");
};

const handleCopyUrl = () => {
  if (props.authUrl) {
    copyToClipboard(props.authUrl, "URL copied to clipboard");
  }
};

const handleRegenerate = () => {
  authCodeInput.value = "";
  emit("generate-url");
};

const handleCookieAuth = () => {
  if (sessionKeyInput.value.trim()) {
    emit("cookie-auth", sessionKeyInput.value);
  }
};

// Expose methods and state
defineExpose({
  authCode: authCodeInput,
  oauthState,
  projectId,
  sessionKey: sessionKeyInput,
  inputMethod,
  reset: () => {
    authCodeInput.value = "";
    oauthState.value = "";
    projectId.value = "";
    sessionKeyInput.value = "";
    inputMethod.value = "manual";
    showHelpDialog.value = false;
  },
});
</script>
