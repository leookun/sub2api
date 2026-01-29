<template>
  <AuthLayout>
    <div class="space-y-6">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          正在完成登录
        </h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-dark-400">
          {{
            isProcessing
              ? "正在验证登录信息，请稍候..."
              : "如果页面未自动跳转，请返回登录页重试。"
          }}
        </p>
      </div>

      <transition name="fade">
        <div
          v-if="errorMessage"
          class="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/20"
        >
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <Icon name="exclamationCircle" size="md" class="text-red-500" />
            </div>
            <div class="space-y-2">
              <p class="text-sm text-red-700 dark:text-red-400">
                {{ errorMessage }}
              </p>
              <router-link to="/login" class="btn btn-primary">
                返回登录
              </router-link>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore, useAppStore } from "@/stores";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const appStore = useAppStore();

const isProcessing = ref(true);
const errorMessage = ref("");

function parseFragmentParams(): URLSearchParams {
  const raw = typeof window !== "undefined" ? window.location.hash : "";
  const hash = raw.startsWith("#") ? raw.slice(1) : raw;
  return new URLSearchParams(hash);
}

function sanitizeRedirectPath(path: string | null | undefined): string {
  if (!path) return "/dashboard";
  if (!path.startsWith("/")) return "/dashboard";
  if (path.startsWith("//")) return "/dashboard";
  if (path.includes("://")) return "/dashboard";
  if (path.includes("\n") || path.includes("\r")) return "/dashboard";
  return path;
}

onMounted(async () => {
  const params = parseFragmentParams();

  const token = params.get("access_token") || "";
  const redirect = sanitizeRedirectPath(
    params.get("redirect") ||
      (route.query.redirect as string | undefined) ||
      "/dashboard",
  );
  const error = params.get("error");
  const errorDesc =
    params.get("error_description") || params.get("error_message") || "";

  if (error) {
    errorMessage.value = errorDesc || error;
    appStore.showError(errorMessage.value);
    isProcessing.value = false;
    return;
  }

  if (!token) {
    errorMessage.value = "登录信息缺失，请返回重试。";
    appStore.showError(errorMessage.value);
    isProcessing.value = false;
    return;
  }

  try {
    await authStore.setToken(token);
    appStore.showSuccess("登录成功！欢迎回来。");
    await router.replace(redirect);
  } catch (e: unknown) {
    const err = e as {
      message?: string;
      response?: { data?: { detail?: string } };
    };
    errorMessage.value =
      err.response?.data?.detail ||
      err.message ||
      "登录失败，请检查您的凭据后重试。";
    appStore.showError(errorMessage.value);
    isProcessing.value = false;
  }
});
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
