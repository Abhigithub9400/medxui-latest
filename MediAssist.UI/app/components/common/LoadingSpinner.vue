<script setup lang="ts">
const props = defineProps<{
  visible: boolean;
  message?: string;
}>();
</script>

<template>
  <div v-if="visible" class="loader-overlay">
    <div class="progress-loader">
      <svg class="circle" viewBox="0 0 36 36">
        <path
          class="circle-bg"
          d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32"
        ></path>
        <path
          class="circle-progress"
          d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32"
        ></path>
      </svg>

      <img src="@/assets/logos/medi-assist-logo.svg" alt="Logo" class="loader-logo" />
    </div>

    <p v-if="message">{{ message || "Loading ..." }}</p>
  </div>
</template>

<style scoped>
@import "~/assets/css/components/common/loading-spinner.css";
</style>
