<template>
  <BaseDialog
    :show="show"
    :title="'设置允许分组'"
    width="normal"
    @close="$emit('close')"
  >
    <div v-if="user" class="space-y-4">
      <div
        class="flex items-center gap-3 rounded-xl bg-gray-50 p-4 dark:bg-dark-700"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100"
        >
          <span class="text-lg font-medium text-primary-700">{{
            user.email.charAt(0).toUpperCase()
          }}</span>
        </div>
        <p class="font-medium text-gray-900 dark:text-white">
          {{ user.email }}
        </p>
      </div>
      <div v-if="loading" class="flex justify-center py-8">
        <svg
          class="h-8 w-8 animate-spin text-primary-500"
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
      <div v-else>
        <p class="mb-3 text-sm text-gray-600">
          选择此用户可以使用的标准分组。订阅类型分组请在订阅管理中配置。
        </p>
        <div class="max-h-64 space-y-2 overflow-y-auto">
          <label
            v-for="group in groups"
            :key="group.id"
            class="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
            :class="{
              'border-primary-300 bg-primary-50': selectedIds.includes(
                group.id,
              ),
            }"
          >
            <input
              v-model="selectedIds"
              type="checkbox"
              :value="group.id"
              class="h-4 w-4 rounded border-gray-300 text-primary-600"
            />
            <div class="flex-1">
              <p class="font-medium text-gray-900">{{ group.name }}</p>
              <p
                v-if="group.description"
                class="truncate text-sm text-gray-500"
              >
                {{ group.description }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge badge-gray text-xs">{{ group.platform }}</span
              ><span
                v-if="group.is_exclusive"
                class="badge badge-purple text-xs"
                >专属</span
              >
            </div>
          </label>
        </div>
        <div class="mt-4 border-t border-gray-200 pt-4">
          <label
            class="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
            :class="{
              'border-green-300 bg-green-50': selectedIds.length === 0,
            }"
          >
            <input
              type="radio"
              :checked="selectedIds.length === 0"
              class="h-4 w-4 border-gray-300 text-green-600"
              @change="selectedIds = []"
            />
            <div class="flex-1">
              <p class="font-medium text-gray-900">允许全部分组</p>
              <p class="text-sm text-gray-500">用户可以使用任何非专属分组</p>
            </div>
          </label>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-3">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button
          :disabled="submitting"
          class="btn btn-primary"
          @click="handleSave"
        >
          {{ submitting ? "保存中..." : "保存" }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useAppStore } from "@/stores/app";
import { adminAPI } from "@/api/admin";
import type { AdminUser, Group } from "@/types";

const props = defineProps<{ show: boolean; user: AdminUser | null }>();
const emit = defineEmits(["close", "success"]);
const appStore = useAppStore();

const groups = ref<Group[]>([]);
const selectedIds = ref<number[]>([]);
const loading = ref(false);
const submitting = ref(false);

watch(
  () => props.show,
  (v) => {
    if (v && props.user) {
      selectedIds.value = props.user.allowed_groups || [];
      load();
    }
  },
);
const load = async () => {
  loading.value = true;
  try {
    const res = await adminAPI.groups.list(1, 1000);
    groups.value = res.items.filter(
      (g) => g.subscription_type === "standard" && g.status === "active",
    );
  } catch (error) {
    console.error("Failed to load groups:", error);
  } finally {
    loading.value = false;
  }
};
const handleSave = async () => {
  if (!props.user) return;
  submitting.value = true;
  try {
    await adminAPI.users.update(props.user.id, {
      allowed_groups: selectedIds.value,
    });
    appStore.showSuccess("允许分组更新成功");
    emit("success");
    emit("close");
  } catch (error) {
    console.error("Failed to update allowed groups:", error);
  } finally {
    submitting.value = false;
  }
};
</script>
