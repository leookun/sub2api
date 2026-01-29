<template>
  <div
    :class="[
      'inline-block h-8 w-8 animate-spin rounded-full border-2 border-current border-r-transparent',
      sizeClasses,
      colorClass
    ]"
    role="status"
    :aria-label="'加载中...'"
  >
    <span class="sr-only">加载中...</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
type SpinnerSize = "sm" | "md" | "lg" | "xl";
type SpinnerColor = "primary" | "secondary" | "white" | "gray";

interface Props {
  size?: SpinnerSize;
  color?: SpinnerColor;
}

const props = withDefaults(defineProps<Props>(), {
  size: "md",
  color: "primary",
});

const sizeClasses = computed(() => {
  const sizes: Record<SpinnerSize, string> = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 h-12 border-[3px]",
    xl: "h-16 w-16 border-4",
  };
  return sizes[props.size];
});

const colorClass = computed(() => {
  const colors: Record<SpinnerColor, string> = {
    primary: "text-primary-500",
    secondary: "text-gray-500 dark:text-dark-400",
    white: "text-white",
    gray: "text-gray-400 dark:text-dark-500",
  };
  return colors[props.color];
});
</script>
