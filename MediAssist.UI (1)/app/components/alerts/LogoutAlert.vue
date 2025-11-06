<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  isVisible: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "Confirmation",
  },
  message: {
    type: String,
    default: "Are you sure?",
  },
});

const emit = defineEmits(["confirm", "cancel"]);

const confirm = () => {
  emit("confirm");
};

const cancel = () => {
  emit("cancel");
};
</script>

<template>
  <div v-if="isVisible" class="modal-overlay">
    <div class="confirm-popup">
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
          <button @click="confirm" class="confirm-button">Logout</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/components/alerts/logout-alert.css";
</style>
