
<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{
  isVisible: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}>();

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

function confirm() {
  emit('confirm');
}

function cancel() {
  emit('cancel');
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
        <img class="bold-essentional-ui-check" alt="success icon" src="~/assets/consultation/setting_alert.png"/>
        <h2 class="modal-title">{{ title }}</h2>
        <p class="modal-message">
          Please complete your profile and settings before starting the session to ensure a smooth and personalized experience.
        </p>
        <div class="modal-buttons">
          <button @click="confirm" class="confirm-button">Update Settings</button>
       </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/components/alerts/settings-update-alert.css";
</style>
 
