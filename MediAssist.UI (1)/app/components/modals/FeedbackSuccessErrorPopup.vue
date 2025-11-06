<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
const props = defineProps({
  isVisible: {
    type: Boolean,
    required: true
  },
  tryAgain: {
    type: String,
    default: 'Retry'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  isError: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
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
          <div v-if="isError" class="error-icon">
         <img class="alert-image" src="@/assets/feedback/feedbackerror.svg" alt="Error Icon"/>
        </div>
        <div v-else class="success-icon">
          <img src="@/assets/feedback/feedbacksuccess.svg" alt="Success Icon"/>
        </div>
          <h2 class="modal-title">{{ title }}</h2>
          <p class="modal-message">{{ message }}</p>
          <div class="modal-buttons" v-if="isError">
          <button @click="confirm" class="confirm-button">{{ tryAgain }}</button>
        </div>
        </div>
      </div>
    </div>
</template>

<style scoped>
@import "~/assets/css/components/modals/feedback-success-error-popup.css";
</style>