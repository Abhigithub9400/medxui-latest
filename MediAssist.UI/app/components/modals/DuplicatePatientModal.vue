<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

/* single svg file you added to icons folder */
import testSvg from "@/assets/icons/test.svg";

const props = defineProps<{
  show: boolean;
  message?: string;
}>();

const emit = defineEmits<{
  (e: "update:show", val: boolean): void;
  (e: "confirm"): void;
}>();

function close() {
  emit("update:show", false);
}

function confirm() {
  emit("confirm");
  close();
}
</script>

<template>
  <teleport to="body">
    <div v-if="show" class="overlay" @click.self="close">
      <div
        class="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dup-title"
        aria-describedby="dup-desc"
      >
        <!-- Close -->
        <button class="close-btn" @click="close" aria-label="Close">
          <img src="~/assets/icons/close-modal.svg" alt="Close" />
        </button>

        <!-- single svg icon (centered) -->
        <div class="icon-wrap" aria-hidden="true">
          <!-- using imported svg file -->
          <img :src="testSvg" class="icon-svg" alt="" />
        </div>

        <!-- Title + subtitle -->
        <div class="content">
          <h2 id="dup-title" class="title">Patient Details Already Exist!</h2>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button class="btn btn-primary" @click="confirm">Okay</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
/* overlay + modal kept same as before */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 15, 41, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: min(722px, 92vw);
  height: 442px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 28px rgba(0, 35, 102, 0.12), 0 4px 14px -1px #e5f1ff;
  padding: 32px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  top: 25px;
  overflow: visible;
}

/* close */
.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
}
.close-btn img {
  width: 24px;
  height: 36px;
}

/* Icon container sized exactly as figma */
.icon-wrap {
  width: 166px;
  height: 166px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* single svg image: exact dims to match Figma */
.icon-svg {
  width: 166px;
  height: 166px;
  display: block;
  pointer-events: none;
  user-select: none;
}

/* Content text */
.content {
  width: 100%;
  text-align: center;
  margin-top: 8px;
  padding: 0 24px;
}
.title {
  margin: 0;
  font-size: 28px;
  line-height: 1.15;
  font-weight: 700;
  color: #000;
}
.subtitle {
  margin: 12px auto 0;
  font-size: 14px;
  color: #55595f;
  max-width: 520px;
  line-height: 1.5;
}

/* Actions and button */
.actions {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-bottom: 6px;
}
.btn {
  display: inline-flex;
  height: 42px;
  padding: 8px 20px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  box-sizing: border-box;
  
}
.btn-primary {
  background: #0066d4;
  color: #ffffff;
  width: 150px;
  font-weight: 500;
  transition: none;
}

.btn-primary:hover,
.btn-primary:active,
.btn-primary:focus {
  background: #0066d4 !important;
  color: #ffffff !important;
  box-shadow: none !important;
  transform: none !important;
  opacity: 1 !important;
  outline: none; /* if you want to keep keyboard focus visible, remove this line */
}

/* responsiveness */
@media (max-width: 420px) {
  .modal {
    height: auto;
    padding: 24px;
  }
  .btn-primary {
    width: 160px;
  }
  .icon-wrap,
  .icon-svg {
    width: 140px;
    height: 140px;
  }
}
</style>
