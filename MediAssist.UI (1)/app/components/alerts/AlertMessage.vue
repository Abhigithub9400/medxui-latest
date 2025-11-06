<script setup lang="ts">
import { computed } from "vue";
import successIcon from "@/assets/icons/circle-tick.svg";
import errorIcon from "@/assets/icons/close-circle.svg";
import closeIcon from "@/assets/icons/close-icon.svg";
import infoIcon from "@/assets/icons/info-icon.png";

type AlertType = "success" | "error" | "info";

const props = defineProps<{
  message: string;
  type?: AlertType;
  isVisible?: boolean;
}>();

const emit = defineEmits<(
  e: "close"
) => void>();

const alertType = computed<AlertType>(() => props.type ?? "success");
const isVisible = computed<boolean>(() => props.isVisible ?? false);

const iconSrc = computed<string>(() => {
  switch (alertType.value) {
    case "success":
      return successIcon;
    case "error":
      return errorIcon;
    case "info":
      return infoIcon;
    default:
      return successIcon;
  }
});

const iconAlt = computed<string>(
  () => `${alertType.value.charAt(0).toUpperCase()}${alertType.value.slice(1)} icon`
);

const emitClose = (): void => {
  emit("close");
};
</script>

<template>
  <Transition name="fade">
    <div v-if="isVisible" :class="['alert', type]">
      <div class="frame">
        <img class="icon" :alt="iconAlt" :src="iconSrc" />
        <div class="text-wrapper">{{ message }}</div>
        <img
          class="close-icon"
          alt="Close icon"
          :src="closeIcon"
          @click="emitClose"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@import "~/assets/css/components/alerts/alert-meassage.css";
</style>
