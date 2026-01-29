<template>
  <div class="card">
    <div class="border-b border-gray-100 px-6 py-4 dark:border-dark-700">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white">
        {{ "修改密码" }}
      </h2>
    </div>
    <div class="px-6 py-6">
      <form class="space-y-4" @submit.prevent="handleChangePassword">
        <div>
          <label for="old_password" class="input-label">
            {{ "当前密码" }}
          </label>
          <input
            id="old_password"
            v-model="form.old_password"
            type="password"
            required
            autocomplete="current-password"
            class="input"
          />
        </div>

        <div>
          <label for="new_password" class="input-label">
            {{ "新密码" }}
          </label>
          <input
            id="new_password"
            v-model="form.new_password"
            type="password"
            required
            autocomplete="new-password"
            class="input"
          />
          <p class="input-hint">
            {{ "密码至少需要 8 个字符" }}
          </p>
        </div>

        <div>
          <label for="confirm_password" class="input-label">
            {{ "确认新密码" }}
          </label>
          <input
            id="confirm_password"
            v-model="form.confirm_password"
            type="password"
            required
            autocomplete="new-password"
            class="input"
          />
          <p
            v-if="
              form.new_password &&
              form.confirm_password &&
              form.new_password !== form.confirm_password
            "
            class="input-error-text"
          >
            {{ "两次输入的密码不一致" }}
          </p>
        </div>

        <div class="flex justify-end pt-4">
          <button type="submit" :disabled="loading" class="btn btn-primary">
            {{ loading ? "修改中..." : "修改密码" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAppStore } from "@/stores/app";
import { userAPI } from "@/api";

const appStore = useAppStore();

const loading = ref(false);
const form = ref({
  old_password: "",
  new_password: "",
  confirm_password: "",
});

const handleChangePassword = async () => {
  if (form.value.new_password !== form.value.confirm_password) {
    appStore.showError("两次输入的密码不一致");
    return;
  }

  if (form.value.new_password.length < 8) {
    appStore.showError("密码至少需要 8 个字符");
    return;
  }

  loading.value = true;
  try {
    await userAPI.changePassword(
      form.value.old_password,
      form.value.new_password,
    );
    form.value = { old_password: "", new_password: "", confirm_password: "" };
    appStore.showSuccess("密码修改成功");
  } catch (error: any) {
    appStore.showError(error.response?.data?.detail || "密码修改失败");
  } finally {
    loading.value = false;
  }
};
</script>
