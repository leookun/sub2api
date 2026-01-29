<template>
  <div
    class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-dark-700 dark:bg-dark-800 sm:px-6"
  >
    <div class="flex flex-1 items-center justify-between sm:hidden">
      <!-- Mobile pagination -->
      <button
        :disabled="page === 1"
        class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-200 dark:hover:bg-dark-600"
        @click="goToPage(page - 1)"
      >
        上一页
      </button>
      <span class="text-sm text-gray-700 dark:text-gray-300">
        {{ `第 {page} / ${totalPages} 页` }}
      </span>
      <button
        :disabled="page === totalPages"
        class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-200 dark:hover:bg-dark-600"
        @click="goToPage(page + 1)"
      >
        下一页
      </button>
    </div>

    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <!-- Desktop pagination info -->
      <div class="flex items-center space-x-4">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          显示
          <span class="font-medium">{{ fromItem }}</span>
          至
          <span class="font-medium">{{ toItem }}</span>
          共
          <span class="font-medium">{{ total }}</span>
          条结果
        </p>

        <!-- Page size selector -->
        <div v-if="showPageSizeSelector" class="flex items-center space-x-2">
          <span class="text-sm text-gray-700 dark:text-gray-300">每页:</span>
          <div
            class="w-20 [&_.select-trigger]:px-3 [&_.select-trigger]:py-1.5 [&_.select-trigger]:text-sm"
          >
            <Select
              :model-value="pageSize"
              :options="pageSizeSelectOptions"
              @update:model-value="handlePageSizeChange"
            />
          </div>
        </div>

        <div v-if="showJump" class="flex items-center space-x-2">
          <span class="text-sm text-gray-700 dark:text-gray-300">{{
            "跳转页"
          }}</span>
          <input
            v-model="jumpPage"
            type="number"
            min="1"
            :max="totalPages"
            class="input w-20 text-sm"
            :placeholder="'页码'"
            @keyup.enter="submitJump"
          />
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="submitJump"
          >
            跳转
          </button>
        </div>
      </div>

      <!-- Desktop pagination buttons -->
      <nav
        class="relative z-0 inline-flex -space-x-px rounded-md shadow-sm"
        aria-label="Pagination"
      >
        <!-- Previous button -->
        <button
          :disabled="page === 1"
          class="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-400 dark:hover:bg-dark-600"
          :aria-label="'上一页'"
          @click="goToPage(page - 1)"
        >
          <Icon name="chevronLeft" size="md" />
        </button>

        <!-- Page numbers -->
        <button
          v-for="pageNum in visiblePages"
          :key="pageNum"
          :disabled="typeof pageNum !== 'number'"
          :class="[
            'relative inline-flex items-center border px-4 py-2 text-sm font-medium',
            pageNum === page
              ? 'z-10 border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-300 dark:hover:bg-dark-600',
            typeof pageNum !== 'number' && 'cursor-default',
          ]"
          :aria-label="
            typeof pageNum === 'number' ? `跳转到第 ${pageNum} 页` : undefined
          "
          :aria-current="pageNum === page ? 'page' : undefined"
          @click="typeof pageNum === 'number' && goToPage(pageNum)"
        >
          {{ pageNum }}
        </button>

        <!-- Next button -->
        <button
          :disabled="page === totalPages"
          class="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-600 dark:bg-dark-700 dark:text-gray-400 dark:hover:bg-dark-600"
          :aria-label="'下一页'"
          @click="goToPage(page + 1)"
        >
          <Icon name="chevronRight" size="md" />
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

interface Props {
  total: number;
  page: number;
  pageSize: number;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showJump?: boolean;
}

interface Emits {
  (e: "update:page", page: number): void;
  (e: "update:pageSize", pageSize: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  pageSizeOptions: () => [10, 20, 50, 100],
  showPageSizeSelector: true,
  showJump: false,
});

const emit = defineEmits<Emits>();

const totalPages = computed(() => Math.ceil(props.total / props.pageSize));

const fromItem = computed(() => {
  if (props.total === 0) return 0;
  return (props.page - 1) * props.pageSize + 1;
});

const toItem = computed(() => {
  const to = props.page * props.pageSize;
  return to > props.total ? props.total : to;
});

const pageSizeSelectOptions = computed(() => {
  return props.pageSizeOptions.map((size) => ({
    value: size,
    label: String(size),
  }));
});

const jumpPage = ref("");

const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const maxVisible = 7;
  const total = totalPages.value;

  if (total <= maxVisible) {
    // Show all pages if total is small
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    const start = Math.max(2, props.page - 2);
    const end = Math.min(total - 1, props.page + 2);

    // Add ellipsis before if needed
    if (start > 2) {
      pages.push("...");
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis after if needed
    if (end < total - 1) {
      pages.push("...");
    }

    // Always show last page
    pages.push(total);
  }

  return pages;
});

const goToPage = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value && newPage !== props.page) {
    emit("update:page", newPage);
  }
};

const handlePageSizeChange = (value: string | number | boolean | null) => {
  if (value === null || typeof value === "boolean") return;
  const newPageSize = typeof value === "string" ? parseInt(value) : value;
  emit("update:pageSize", newPageSize);
};

const submitJump = () => {
  const value = jumpPage.value.trim();
  if (!value) return;
  const pageNum = Number.parseInt(value, 10);
  if (Number.isNaN(pageNum)) return;
  const nextPage = Math.min(Math.max(pageNum, 1), totalPages.value);
  jumpPage.value = "";
  goToPage(nextPage);
};
</script>
