<template>
  <div class="card">
    <div class="border-b border-gray-100 px-6 py-4 dark:border-dark-700">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        {{ "编辑个人资料" }}
      </h2>
    </div>
    <div class="px-6 py-6">
      <form class="space-y-4" @submit.prevent="handleUpdateProfile">
        <div>
          <label for="username" class="input-label">
            {{ "用户名" }}
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="input"
            :placeholder="'输入用户名'"
          />
        </div>

        <div class="flex justify-end pt-4">
          <button type="submit" :disabled="loading" class="btn btn-primary">
            {{ loading ? "更新中..." : "更新资料" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useAppStore } from "@/stores/app";
import { userAPI } from "@/api";

const props = defineProps<{
  initialUsername: string;
}>();

const authStore = useAuthStore();
const appStore = useAppStore();

const username = ref(props.initialUsername);
const loading = ref(false);

watch(
  () => props.initialUsername,
  (val) => {
    username.value = val;
  },
);

const handleUpdateProfile = async () => {
  if (!username.value.trim()) {
    appStore.showError("用户名不能为空");
    return;
  }

  loading.value = true;
  try {
    const updatedUser = await userAPI.updateProfile({
      username: username.value,
    });
    authStore.user = updatedUser;
    appStore.showSuccess("资料更新成功");
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || "资料更新失败");
  } finally {
    loading.value = false;
  }
};
</script>
