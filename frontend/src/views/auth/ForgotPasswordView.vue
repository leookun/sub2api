<template>
  <AuthLayout>
    <div class="space-y-6">
      <!-- Title -->
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          重置密码
        </h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-dark-400">
          输入您的邮箱地址，我们将向您发送密码重置链接。
        </p>
      </div>

      <!-- Success State -->
      <div v-if="isSubmitted" class="space-y-6">
        <div
          class="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800/50 dark:bg-green-900/20"
        >
          <div class="flex flex-col items-center gap-4 text-center">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-800/50"
            >
              <Icon
                name="checkCircle"
                size="lg"
                class="text-green-600 dark:text-green-400"
              />
            </div>
            <div>
              <h3
                class="text-lg font-semibold text-green-800 dark:text-green-200"
              >
                重置链接已发送
              </h3>
              <p class="mt-2 text-sm text-green-700 dark:text-green-300">
                {{
                  "如果该邮箱已注册，您将很快收到密码重置链接。请检查您的收件箱和垃圾邮件文件夹。"
                }}
              </p>
            </div>
          </div>
        </div>

        <div class="text-center">
          <router-link
            to="/login"
            class="inline-flex items-center gap-2 font-medium text-primary-600 transition-colors hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <Icon name="arrowLeft" size="sm" />
            返回登录
          </router-link>
        </div>
      </div>

      <!-- Form State -->
      <form v-else class="space-y-5" @submit.prevent="handleSubmit">
        <!-- Email Input -->
        <div>
          <label for="email" class="input-label"> 邮箱 </label>
          <div class="relative">
            <div
              class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5"
            >
              <Icon
                name="mail"
                size="md"
                class="text-gray-400 dark:text-dark-500"
              />
            </div>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              autofocus
              autocomplete="email"
              :disabled="isLoading"
              class="input pl-11"
              :class="{ 'input-error': errors.email }"
              :placeholder="'请输入邮箱'"
            />
          </div>
          <p v-if="errors.email" class="input-error-text">
            {{ errors.email }}
          </p>
        </div>

        <!-- Turnstile Widget -->
        <div v-if="turnstileEnabled && turnstileSiteKey">
          <TurnstileWidget
            ref="turnstileRef"
            :site-key="turnstileSiteKey"
            @verify="onTurnstileVerify"
            @expire="onTurnstileExpire"
            @error="onTurnstileError"
          />
          <p v-if="errors.turnstile" class="input-error-text mt-2 text-center">
            {{ errors.turnstile }}
          </p>
        </div>

        <!-- Error Message -->
        <transition name="fade">
          <div
            v-if="errorMessage"
            class="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/20"
          >
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0">
                <Icon name="exclamationCircle" size="md" class="text-red-500" />
              </div>
              <p class="text-sm text-red-700 dark:text-red-400">
                {{ errorMessage }}
              </p>
            </div>
          </div>
        </transition>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading || (turnstileEnabled && !turnstileToken)"
          class="btn btn-primary w-full"
        >
          <svg
            v-if="isLoading"
            class="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
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
          <Icon v-else name="mail" size="md" class="mr-2" />
          {{ isLoading ? "发送中..." : "发送重置链接" }}
        </button>
      </form>
    </div>

    <!-- Footer -->
    <template #footer>
      <p class="text-gray-500 dark:text-dark-400">
        想起密码了？
        <router-link
          to="/login"
          class="font-medium text-primary-600 transition-colors hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
        >
          登录
        </router-link>
      </p>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type TurnstileWidget from "@/components/TurnstileWidget.vue";
import { useAppStore } from "@/stores";
import { getPublicSettings, forgotPassword } from "@/api/auth";

// ==================== Stores ====================

const appStore = useAppStore();

// ==================== State ====================

const isLoading = ref<boolean>(false);
const isSubmitted = ref<boolean>(false);
const errorMessage = ref<string>("");

// Public settings
const turnstileEnabled = ref<boolean>(false);
const turnstileSiteKey = ref<string>("");

// Turnstile
const turnstileRef = ref<InstanceType<typeof TurnstileWidget> | null>(null);
const turnstileToken = ref<string>("");

const formData = reactive({
  email: "",
});

const errors = reactive({
  email: "",
  turnstile: "",
});

// ==================== Lifecycle ====================

onMounted(async () => {
  try {
    const settings = await getPublicSettings();
    turnstileEnabled.value = settings.turnstile_enabled;
    turnstileSiteKey.value = settings.turnstile_site_key || "";
  } catch (error) {
    console.error("Failed to load public settings:", error);
  }
});

// ==================== Turnstile Handlers ====================

function onTurnstileVerify(token: string): void {
  turnstileToken.value = token;
  errors.turnstile = "";
}

function onTurnstileExpire(): void {
  turnstileToken.value = "";
  errors.turnstile = "验证已过期，请重试";
}

function onTurnstileError(): void {
  turnstileToken.value = "";
  errors.turnstile = "验证失败，请重试";
}

// ==================== Validation ====================

function validateForm(): boolean {
  errors.email = "";
  errors.turnstile = "";

  let isValid = true;

  // Email validation
  if (!formData.email.trim()) {
    errors.email = "请输入邮箱";
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = "请输入有效的邮箱地址";
    isValid = false;
  }

  // Turnstile validation
  if (turnstileEnabled.value && !turnstileToken.value) {
    errors.turnstile = "请完成验证";
    isValid = false;
  }

  return isValid;
}

// ==================== Form Handlers ====================

async function handleSubmit(): Promise<void> {
  errorMessage.value = "";

  if (!validateForm()) {
    return;
  }

  isLoading.value = true;

  try {
    await forgotPassword({
      email: formData.email,
      turnstile_token: turnstileEnabled.value
        ? turnstileToken.value
        : undefined,
    });

    isSubmitted.value = true;
    appStore.showSuccess("重置链接已发送");
  } catch (error: unknown) {
    // Reset Turnstile on error
    if (turnstileRef.value) {
      turnstileRef.value.reset();
      turnstileToken.value = "";
    }

    const err = error as {
      message?: string;
      response?: { data?: { detail?: string } };
    };

    if (err.response?.data?.detail) {
      errorMessage.value = err.response.data.detail;
    } else if (err.message) {
      errorMessage.value = err.message;
    } else {
      errorMessage.value = "发送重置链接失败，请重试。";
    }

    appStore.showError(errorMessage.value);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
