import { ref } from "vue";

export const alertMessage = ref("");
export const alertType = ref<"success" | "error" | "info">("success");
export const isAlertVisible = ref(false);

export const showAlert = (
  message: string,
  type: "success" | "error" | "info" = "success"
) => {
  alertMessage.value = message;
  alertType.value = type;
  isAlertVisible.value = true;

  setTimeout(() => {
    closeAlert();
  }, 5000);
};

export const closeAlert = () => {
  isAlertVisible.value = false;
};
