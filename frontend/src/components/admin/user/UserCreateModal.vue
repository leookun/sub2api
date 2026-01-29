<template>
  <BaseDialog
    :show="show"
    :title="'创建用户'"
    width="normal"
    @close="$emit('close')"
  >
    <form id="create-user-form" class="space-y-5" @submit.prevent="submit">
      <div>
        <label class="input-label">{{ "邮箱" }}</label>
        <input
          v-model="form.email"
          type="email"
          required
          class="input"
          :placeholder="'请输入邮箱'"
        />
      </div>
      <div>
        <label class="input-label">{{ "密码" }}</label>
        <div class="flex gap-2">
          <div class="relative flex-1">
            <input
              v-model="form.password"
              type="text"
              required
              class="input pr-10"
              :placeholder="'请输入密码'"
            />
          </div>
          <button
            type="button"
            class="btn btn-secondary px-3"
            @click="generateRandomPassword"
          >
            <Icon name="refresh" size="md" />
          </button>
        </div>
      </div>
      <div>
        <label class="input-label">{{ "用户名" }}</label>
        <input
          v-model="form.username"
          type="text"
          class="input"
          :placeholder="'请输入用户名（选填）'"
        />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="input-label">{{ "余额" }}</label>
          <input
            v-model.number="form.balance"
            type="number"
            step="any"
            class="input"
          />
        </div>
        <div>
          <label class="input-label">{{ "并发数" }}</label>
          <input
            v-model.number="form.concurrency"
            type="number"
            class="input"
          />
        </div>
      </div>
    </form>
    <template #footer>
      <div class="flex justify-end gap-3">
        <button type="button" class="btn btn-secondary" @click="$emit('close')">
          {{ "取消" }}
        </button>
        <button
          type="submit"
          form="create-user-form"
          :disabled="loading"
          class="btn btn-primary"
        >
          {{ loading ? "创建中..." : "创建" }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import { adminAPI } from "@/api/admin";
import { useForm } from "@/composables/useForm";

const props = defineProps<{ show: boolean }>();
const emit = defineEmits(["close", "success"]);
const form = reactive({
  email: "",
  password: "",
  username: "",
  notes: "",
  balance: 0,
  concurrency: 1,
});

const { loading, submit } = useForm({
  form,
  submitFn: async (data) => {
    await adminAPI.users.create(data);
    emit("success");
    emit("close");
  },
  successMsg: "用户创建成功",
});

watch(
  () => props.show,
  (v) => {
    if (v)
      Object.assign(form, {
        email: "",
        password: "",
        username: "",
        notes: "",
        balance: 0,
        concurrency: 1,
      });
  },
);

const generateRandomPassword = () => {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*";
  let p = "";
  for (let i = 0; i < 16; i++)
    p += chars.charAt(Math.floor(Math.random() * chars.length));
  form.password = p;
};
</script>
