<script setup lang="ts">
import { ref, computed, defineEmits } from "vue";
import { validateEmailFormat, validateName } from "~/utils/validators";
import { useConsultationService } from "~/composables/useConsultationService";
import { getUserInfoPropertyFromCookie } from "@/composables/useCookieService";
import { usePatientService } from "~/composables/usePatientService";
import { usePatientDetailsService } from "~/composables/usePatientDetailsService";

const { shareReport, reportData } = useConsultationService();
const { patientDetails, consultationDetails } = usePatientDetailsService();

const patientId = computed(() => {
  return unref(patientDetails.value?.patient?.id) ??
         unref(reportData.value?.patient?.patientInfo?.id) ??
         0;
});

const consultationId = computed(() => {
  return unref(consultationDetails.value?.id) ??
         unref(reportData.value?.ConsultationId) ??
         0;
});

const emits = defineEmits(["close"]);
const { patient } = usePatientService();
const recipientName = ref(patient.value.name || "");
const recipientEmail = ref(patient.value.email || "");
const selectedReport = ref("");
const reportOptions = [
  { value: "report", label: "Complete Report" },
  { value: "prescriptions", label: "Prescriptions" },
  { value: "tests", label: "Tests Advised" },
];

const errors = ref({
  name: "",
  email: "",
  report: "",
});

const isNameInputActive = ref(false);
const isEmailInputActive = ref(false);
const isLoading = ref(false);
const isSuccess = ref(false);
const isError = ref(false);

const cancel = () => emits("close");

const interactWithField = (field: string) => {
  isNameInputActive.value = field === "name" && recipientName.value.length > 0;
  isEmailInputActive.value =
    field === "email" && recipientEmail.value.length > 0;
};

const validateField = (field: string) => {
  if (field === "name") {
    errors.value.name = validateName(recipientName.value);
  } else if (field === "email") {
    errors.value.email = validateEmailFormat(recipientEmail.value);
  } else if (field === "report") {
    errors.value.report = selectedReport.value ? "" : "Please select a report";
  }
};

const isFormValid = computed(() => {
  return (
    recipientName.value.trim() &&
    recipientEmail.value.trim() &&
    selectedReport.value &&
    !errors.value.name &&
    !errors.value.email &&
    !errors.value.report
  );
});

const handleShareReport = async () => {
  validateField("name");
  validateField("email");
  validateField("report");

  if (isFormValid.value) {
    try {
      isLoading.value = true;
      isSuccess.value = false;
      isError.value = false;

      const userId = getUserInfoPropertyFromCookie("userId") || "";
      const response = await shareReport(
        recipientEmail.value,
        recipientName.value,
        userId,
        selectedReport.value,
        consultationId.value, patientId.value
      );

      if (response.success) {
        isSuccess.value = true;
      } else {
        isError.value = true;
        console.error("Share Report failed:", response.message);
      }
    } catch (error: any) {
      isError.value = true;
      console.error("Unexpected error:", error);
    } finally {
      isLoading.value = false;
    }
  }
};

const handleNameInput = () => {
  interactWithField("name");
  errors.value.name = "";
};

const handleEmailInput = () => {
  interactWithField("email");
  errors.value.email = "";
};

const selectReport = (value: string) => {
  selectedReport.value = value;
  errors.value.report = "";
};

const resetForm = () => {
  isSuccess.value = false;
  isError.value = false;
  isLoading.value = false;
  errors.value.name = "";
  errors.value.email = "";
  errors.value.report = "";
};
</script>

<template>
  <div class="share-report-overlay" @click.self="cancel">
    <div class="share-report-modal">
      <div
        class="modal-header"
        :class="{ 'success-error': isSuccess || isError }"
      >
        <h2 v-if="!isSuccess && !isError" class="modal-title">Share Report</h2>
        <button class="close-button" @click="cancel">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <!-- Success State with Transition -->
      <Transition name="fade-scale" mode="out-in">
        <div v-if="isSuccess" key="success" class="mail-success">
          <img
            class="mail-sent animate-bounce-in"
            src="@/assets/icons/email-icon.svg"
            alt="Mail Sent"
          />
          <h2 class="report-status align-center animate-slide-up">
            Report Shared Successfully!
          </h2>
          <p class="success-message animate-slide-up delay-1">
            The report has been successfully shared with {{ recipientName }}.
          </p>
          <div class="okay-button-wrapper animate-slide-up delay-2">
            <button class="okay-btn" @click.self="cancel">Okay</button>
          </div>
        </div>

        <!-- Error State with Transition -->
        <div v-else-if="isError" key="error" class="mail-success">
          <img
            class="mail-sent animate-shake"
            src="@/assets/icons/error-icon.svg"
            alt="Error"
          />
          <h2 class="report-status align-center animate-slide-up">
            Sharing Failed
          </h2>
          <p class="error-message animate-slide-up delay-1">
            Failed to send the email. Please try again later.
          </p>
          <div class="okay-button-wrapper animate-slide-up delay-2">
            <button class="okay-btn" @click.self="cancel">Okay</button>
          </div>
        </div>

        <!-- Form State with Transition -->
        <div v-else key="form" class="modal-content">
          <form @submit.prevent="handleShareReport">
            <div class="form-row">
              <div class="input-group">
                <label for="recipientName">Recipient Name*</label>
                <input
                  v-model="recipientName"
                  type="text"
                  id="recipientName"
                  placeholder="Enter Name"
                  @focus="interactWithField('name')"
                  @blur="validateField('name')"
                  @input="handleNameInput"
                  required
                />
                <span v-if="errors.name" class="error">{{ errors.name }}</span>
              </div>

              <div class="input-group">
                <label for="recipientEmail">Email Address*</label>
                <input
                  v-model="recipientEmail"
                  type="email"
                  id="recipientEmail"
                  placeholder="Enter Email Address"
                  @focus="interactWithField('email')"
                  @blur="validateField('email')"
                  @input="handleEmailInput"
                  required
                />
                <span v-if="errors.email" class="error">{{
                  errors.email
                }}</span>
              </div>
            </div>

            <div class="input-group">
              <div class="select-label">
                Select Report<span class="required">*</span>
              </div>
              <div class="report-picker">
                <button
                  v-for="option in reportOptions"
                  :key="option.value"
                  type="button"
                  class="picker-button"
                  :class="{ selected: selectedReport === option.value }"
                  @click="selectReport(option.value)"
                >
                  <span class="radio-indicator">
                    <svg
                      v-if="selectedReport === option.value"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M13.9993 6.9987C13.9993 10.6806 11.0146 13.6654 7.33268 13.6654C3.65078 13.6654 0.666016 10.6806 0.666016 6.9987C0.666016 3.3168 3.65078 0.332031 7.33268 0.332031C11.0146 0.332031 13.9993 3.3168 13.9993 6.9987ZM10.0196 4.97848C10.2148 5.17374 10.2148 5.49032 10.0196 5.68558L6.68624 9.01892C6.49097 9.21418 6.17439 9.21418 5.97913 9.01892L4.6458 7.68559C4.45053 7.49032 4.45053 7.17374 4.6458 6.97848C4.84106 6.78322 5.15764 6.78322 5.3529 6.97848L6.33268 7.95826L7.82257 6.46837L9.31246 4.97848C9.50772 4.78322 9.82431 4.78322 10.0196 4.97848Z"
                        fill="#1C274C"
                      />
                    </svg>
                  </span>
                  {{ option.label }}
                </button>
              </div>
              <span v-if="errors.report" class="error">{{
                errors.report
              }}</span>
            </div>

            <div class="modal-footer">
              <button type="button" class="cancel-btn" @click="cancel">
                Cancel
              </button>
              <button
                type="submit"
                class="share-btn"
                :disabled="!isFormValid || isLoading"
              >
                <span v-if="isLoading">Sharing...</span>
                <span v-else>Share Report</span>
              </button>
            </div>
          </form>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/components/modals/share-report.css";
</style>
