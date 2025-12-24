<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

const {
  isVisible,
  title = "Confirmation",
  message = "Are you sure?",
} = defineProps<{
  isVisible: boolean;
  title?: string;
  message?: string;
}>();

const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

function confirm() {
  emit("confirm");
}

function cancel() {
  emit("cancel");
}
</script>

<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <button class="close-button" @click="cancel">
          <span>&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <h2 class="modal-title">{{ title }}</h2>
        <p class="modal-message">{{ message }}</p>
        <div class="modal-buttons">
          <button @click="cancel" class="cancel-button">Cancel</button>
          <button @click="confirm" class="confirm-button">Yes</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/components/alerts/stop-session-alert.css";
</style>
