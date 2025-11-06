<script setup lang="ts">
const props = withDefaults(defineProps<{
  isVisible: boolean;
  tryAgain?: string;
  cancelText?: string;
  title?: string;
  message?: string;
  description?: string;
  isError?: boolean;
}>(), {
  tryAgain: "Retry",
  cancelText: "Back Home page",
  title: "",
  message: "",
  description: "",
  isError: false,
});

function confirm() {
  window.location.href = "/dashboard"; 
}
</script>

<template>
  <div class="payment-status-modal" v-if="props.isVisible">
    <div class="payment-modal-content">
      <div class="icon-container">
        <img
          v-if="!isError"
          src="@/assets/icons/circle-tick.svg"
          alt="Success"
          class="status-icon"
        />
        <img
          v-else
          src="@/assets/icons/close-circle.svg"
          alt="Error"
          class="status-icon"
        />
      </div>

      <h3
        class="modal-title h3-semibold"
        :class="{ success: !isError, error: isError }"
      >
        {{ title }}
      </h3>
      <h6 class="modal-subtitle h6-medium">{{ message }}</h6>
      <p class="modal-desc" v-if="description">{{ description }}</p>

      <button v-if="isError" class="primary-btn" @click="confirm">
        Try again
      </button>

      <a v-if="!isError" class="link-btn" @click="confirm"> Back Home page </a>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/components/modals/payment-status.css";
</style>
