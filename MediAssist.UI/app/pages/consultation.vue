<script setup lang="ts">
definePageMeta({
  layout: "panel",
});
import { useRouter, onBeforeRouteLeave } from "vue-router";
import LanguageDropdown from "~/components/consultation/languageSelector.vue";
import {
  default as ClearSessionAlert,
  default as FeedBackForm,
  default as GenerateReportAlert,
  default as PatientConsentConfirmation,
} from "@/components/alerts/ConfirmationAlert.vue";
import FeedbackPopup from "~/components/modals/FeedbackPopup.vue";
import {
  default as FeedbackErrorPopup,
  default as FeedbackSuccessPopup,
} from "~/components/modals/FeedbackSuccessErrorPopup.vue";
import SettingUpdateAlert from "~/components/alerts/SettingUpdateAlert.vue";
import { useSubmitFeedback } from "@/composables/useDashboardService";
import { useConsultationService } from "~/composables/useConsultationService";
import DiagnosisPopup from "~/components/alerts/PotentialDiagnosisPopUp.vue";
import StopSessionAlert from "@/components/alerts/StopSessionAlert.vue";
import ConsultationReport from "@/components/consultation/ConsultationReport.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import { useMyStore } from "~/store/store";
import AnimatedMessage from "@/components/consultation/AnimatedMessage.vue";
import PatientDetailsForm from "~/components/patient/patientActionsBar.vue";
import ConsultationInputPanel from "~/components/consultation/ConsultationInputPanel.vue";
import { getUserInfoPropertyFromCookie } from "@/composables/useCookieService";
import { useTranscription } from "@/composables/useTranscription";
import { showAlert } from "~/composables/useAlertService";
import { usePatientService } from "~/composables/usePatientService";
import { useConsultationInputs } from "~/composables/useConsultationInputs";
import patientCard from "@/components/patient/patientCard.vue";
import { Toaster, toast } from "vue-sonner";

useHead({
  title: "Conversations – Review and Edit Clinical Transcriptions",
  meta: [
    {
      name: "description",
      content:
        "View and manage AI-generated transcriptions of patient-doctor conversations. Edit notes, extract key data, and ensure accuracy before saving to your EHR.",
    },
  ],
});

const {
  conversation,
  cumulativeTranscript,
  recording,
  SuggestedDiagnosisList,
  generatedPrescriptions,
  showPlanExpired,
  showSessionWillEndSoon,
  startTranscription,
  stopTranscription,
  send,
  sendEvent,
  isSessionEnded,
  consultationId,
  errorMessage,
} = useTranscription();
const { patient } = usePatientService();
const { notes, prescriptions, vitals, appointments } = useConsultationInputs();
const { checkSettingsUpdated, generateResults, isResultGenerated } =
  useConsultationService();
const { submitFeedback } = useSubmitFeedback();
const store = useMyStore();
const router = useRouter();

const session = {
  started: false,
  paused: false,
  stopped: false,
};
const texts = {
  feedbackTitle: "We Value Your Feedback!",
  feedbackMessage: "Submit Feedback",
  popupTitle: "Share Your Feedback",
  cancelText: "Maybe Later",
  confirmText: "Submit",
  successTitle: "Submission Successful",
  errorTitle: "Submission Failed",
  tryAgainButton: "Try Again",
  feedback:
    "Please provide your valuable insights to help us improve your experience.",
  successMessage:
    "Thank you for your feedback! It has been successfully submitted.",
  errorMessage:
    "There was a problem submitting your feedback. Please try again later.",
};
const flags = reactive({
  showPatientConsentConfirmation: false,
  patientConsent: false,
  availableHoursExceeded: false,
  showPopup: false,
  sessionStopConfirmation: false,
  isAzureLoading: false,
  showDiagnosis: true,
  isTranscriptionStarted: false,
  showDiagnosisPopup: false,
  isAlertVisible: false,
  showGenerateResultPreviewPopUp: false,
  isRepostGenerationInProgress: false,
  isReportValidationShow: false,
  showGenerateReportAlert: false,
  showFeedbackPopup: false,
  showSuccessPopup: false,
  showErrorPopup: false,
  showClearPopup: false,
  showSettingsPopup: false,
  generateTranscriptionReport: true,
});

const rating = ref(0);
const userId = ref("");
const selectedCategories = ref<number[]>([]);
const customCategoryText = ref("");
const diagnosisSocket = ref<WebSocket | null>(null);
const selectedLanguage = ref("en-US");
const selectedModel = ref("azure");
const userSessionId = ref(0);
let NumberOfTranscriptions = 0;
let totalCost = 0.0;
let totalToken = 0;

const handleSelectedCategories = (categories: { id: number }[]) => {
  selectedCategories.value = categories.map((category) => category.id);
};

const handleCustomCategoryText = (text: string) => {
  customCategoryText.value = text;
};

const confirmPopup = async (payload: {
  rating: number;
  selectedItems: { id: number; label: string }[];
  description: string;
  suggestion: string;
  otherCategoryText: string;
}) => {
  try {
    const formattedPayload = {
      userId: userId.value,
      CategoryIDs: payload.selectedItems.map((item) => item.id),
      Rating: payload.rating,
      CustomCategoryText: payload.otherCategoryText,
      IssueDescription: payload.description,
      SuggestionsImprovement: payload.suggestion,
    };

    const response = await submitFeedback(formattedPayload);

    if (response.success) {
      flags.showSuccessPopup = true;
      flags.showFeedbackPopup = false;
    } else {
      flags.showErrorPopup = true;
    }
  } catch (error) {
    console.error("Error submitting feedback:", error);
  }
};

const CloseSessionWarning = () => {
  showPlanExpired.value = false;
};

const cancelPopup = () => {
  flags.showFeedbackPopup = false;
};

const confirmationRequired = () => {
  flags.showFeedbackPopup = true;
  flags.showPopup = false;
};

const cancelAction = () => {
  flags.showPopup = false;
};

const successCancel = () => {
  flags.showSuccessPopup = false;
  flags.showErrorPopup = false;
};

const tryAgain = () => {
  flags.showSuccessPopup = false;
  flags.showErrorPopup = false;
};

const setRating = (star: number) => {
  rating.value = star;
};

const handleLanguageChange = (languageCode: string, model: string) => {
  selectedLanguage.value = languageCode;
  selectedModel.value = model;
};

const handleStartSessionClick = () => {
  flags.showPatientConsentConfirmation = true;
};

const togglePauseResume = () => {
  if (session.started && !session.stopped && !session.paused) {
    session.paused = true;
    sendEvent("pause");
    recording.value = false;
  } else {
    session.paused = false;
    sendEvent("resume");
  }
};

const showConfirmation = () => {
  flags.sessionStopConfirmation = true;
  recording.value = false;
  sendEvent("pause");
};
const toggleDiagnosis = () => {
  flags.showDiagnosisPopup = false;
  if (!flags.isTranscriptionStarted) {
    flags.showDiagnosis = !flags.showDiagnosis;
  }
};

onMounted(async () => {
  userId.value = getUserInfoPropertyFromCookie("userId") ?? "";
});

onBeforeUnmount(() => {
  if (
    diagnosisSocket.value &&
    diagnosisSocket.value.readyState === WebSocket.OPEN
  ) {
    diagnosisSocket.value.close();
  }
});

onBeforeMount(async () => {
  const userId = getUserInfoPropertyFromCookie("userId") || "";
  if (userId) {
    await store.fetchUserActivityMetrics(userId);
  }
  if (store.UserActivityMetrics.UserSessionsCount < 3) {
    flags.showDiagnosisPopup = true;
  }
  flags.availableHoursExceeded = store.UserActivityMetrics.AvailableHours <= 0;
  NumberOfTranscriptions = store.UserActivityMetrics.Transcriptions;
  flags.generateTranscriptionReport =
    store.UserActivityMetrics.Transcriptions > 0;
  if (flags.availableHoursExceeded || !flags.generateTranscriptionReport) {
    router.replace("/subscription");
  }
});

onBeforeRouteLeave((to, from, next) => {
  notes.value = { items: [], editIndex: -1 };
  prescriptions.value = { items: [], editIndex: -1 };
  vitals.value = { items: [], editIndex: -1 };
  appointments.value = { items: [], editIndex: -1 };
  next();
});

const confirmPatientConsent = () => {
  startSession();
  flags.showPatientConsentConfirmation = false;
  flags.patientConsent = true;
};

const showSettingsAlertPopup = () => {
  flags.showSettingsPopup = true;
};

const confirmSettingsUpdated = () => {
  router.push("/settings");
};

const cancelSettingsPopup = () => {
  flags.showSettingsPopup = false;
};

const ClosePatientConsentConfirmation = () => {
  flags.showPatientConsentConfirmation = false;
  flags.patientConsent = false;
};

const startSession = async () => {
  flags.showDiagnosisPopup = false;
  const response = await checkSettingsUpdated(userId.value);

  if (!response.success) {
    showSettingsAlertPopup();
  } else {
    if (session.started) return;
    errorMessage.value = false;
    session.started = true;
    session.paused = false;
    session.stopped = false;
    await handleStart();
  }
};

watch(errorMessage, () => {
 if (errorMessage.value) {
  session.started = false;
    session.paused = false;
    session.stopped = false; }
});
const handleStart = () => {
  startTranscription({
    userId: userId.value,
    sessionId: userSessionId.value,
    totalToken: totalToken,
    totalCost: totalCost,
    showDiagnosis: flags.showDiagnosis,
    selectedLanguage: selectedLanguage.value,
    selectedModel: selectedModel.value,
    PatientId: patient.value.id ?? 0,
  });
};

const confirmStop = () => {
  session.stopped = true;
  session.paused = false;
  session.started = false;
  flags.sessionStopConfirmation = false;
  stopRecording();
  showAlert(
    "Session ended. Please make any necessary adjustments to the prescription or notes before generating the report.",
    "info"
  );
};

function stopRecording() {
  sendEvent("stop");
  recording.value = false;
  session.paused = false;
  //if (socket && socket.readyState === WebSocket.OPEN) socket.close();
  //if (audioContext) audioContext.close();
  console.log("🛑 Stopped");
}

const handleclearSession = () => {
  flags.showClearPopup = true;
};

const confirmClearSession = () => {
  router.go(0)
};

const cancelClearSession = () => {
  flags.showClearPopup = false;
};

const cancelStop = () => {
  flags.sessionStopConfirmation = false;
  if (session.started && !session.stopped) {
    session.paused = true;
    recording.value = false;
  }
};

const handleGenerateResults = async () => {
  if (!flags.generateTranscriptionReport) {
    showPlanExpired.value = true;
    setTimeout(() => {
      showPlanExpired.value = false;
    }, 10000);
  } else if (flags.generateTranscriptionReport) {
    flags.showGenerateReportAlert = true;
  }
};

const handleGenerateReportConfirm = async () => {
  flags.showGenerateReportAlert = false;
  flags.isRepostGenerationInProgress = true;
  const firstName = getUserInfoPropertyFromCookie("firstName") || "";
  const titleValue = getUserInfoPropertyFromCookie("title");

  if (
    cumulativeTranscript.value.length === 0 ||
    consultationId.value === null ||
    consultationId.value < 0
  ) {
    toast.error("No conversation data available to generate report.", {
      duration: 5000,
    });
    flags.isRepostGenerationInProgress = false;
    return;
  }
  await generateResults({
    transcription: cumulativeTranscript.value,
    notes: notes.value.items,
    medlab: prescriptions.value.items,
    vitals: vitals.value.items,
    nextAppointment:
      appointments.value.items.length > 0 ? appointments.value.items[0] : "",
    consultationId: consultationId.value ?? 0,
    userId: userId.value,
    sessionId: userSessionId.value,
    conversation: conversation.value,
    patient: {
      patientInfo: {
        id: patient.value.id,
        mrn: patient.value.mrn,
        name: patient.value.name,
        gender: patient.value.gender,
        dob: patient.value.dob,
        age: patient.value.age,
        email: patient.value.email,
      },
      consultingDoctor: `${titleValue} ${firstName}`,
    },
  });

  if (NumberOfTranscriptions == 0) {
    flags.generateTranscriptionReport = false;
  }
  setTimeout(() => {
    flags.isRepostGenerationInProgress = false;
    flags.showGenerateResultPreviewPopUp = true;
  }, 0);
};

const handleGenerateReportCancel = () => {
  flags.showGenerateReportAlert = false;
};
</script>

<template>
  <div v-if="isResultGenerated" class="consultation-report-view">
    <ConsultationReport
      :isResultGenerated="isResultGenerated"
      :isEditOptionEnabled="true"
      :conversation="cumulativeTranscript"
      @close="isResultGenerated = false"
    />
  </div>
  <div v-else class="maincontent-container">
    <patientCard
      v-if="patient && patient.id"
      :isHistory="false"
      :patient="patient"
      class="patient-card"
    />
    <PatientDetailsForm v-else />
    <div class="main-content">
      <div class="conversations">
        <div class="conversation-header">
          <h2 class="h2-responsive-size">Your conversations</h2>
          <div class="conversation-actions">
            <LanguageDropdown
              v-if="!session.started && !session.stopped"
              @languageChange="handleLanguageChange"
            />
            <button
              v-if="!session.started && session.stopped"
              @click="handleGenerateResults()"
              class="start-session"
              :disabled="flags.sessionStopConfirmation || !isSessionEnded"
            >
              {{ !isSessionEnded ? "Stopping..." : "Generate Results" }}
            </button>

            <button
              v-if="!session.started && session.stopped"
              @click="handleclearSession()"
              class="clear-button"
              :disabled="!isSessionEnded"
            >
              <img
                src="@/assets/consultation/trash-bin.svg"
                alt="Stop Button"
                class="clear"
              />
            </button>
            <button
              v-if="
                !session.started &&
                (!session.stopped ||
                  flags.availableHoursExceeded ||
                  !(patient && patient.id))
              "
              @click="handleStartSessionClick"
              :disabled="
                flags.availableHoursExceeded || !patient || !patient.id
              "
              :class="[
                flags.availableHoursExceeded || !(patient && patient.id)
                  ? 'disabled-button'
                  : 'start-session',
              ]"
            >
              <img
                src="~/assets/consultation/play-button.svg"
                alt="Play Button"
                class="play-button"
              />
              Start Session
            </button>
            <button
              v-if="session.started && !session.stopped"
              @click="togglePauseResume"
              class="start-session"
              :disabled="flags.sessionStopConfirmation"
            >
              <img
                v-if="!session.paused"
                src="@/assets/consultation/Pause.svg"
                alt="Pause Button"
                class="pause-button"
              />
              <img
                v-else
                src="@/assets/consultation/play-button.svg"
                alt="Play Button"
                class="play-button"
              />
              {{ session.paused ? "Resume Session" : "Pause Session" }}
            </button>
            <button
              v-if="session.started && !session.stopped"
              @click="showConfirmation"
              class="stop-button"
            >
              <img
                src="@/assets/consultation/stop.svg"
                alt="Stop Button"
                class="stop"
              />
            </button>
          </div>
        </div>
        <div class="conversation-content">
          <div class="conversation-audio">
            <div class="wave-animation">
              <img
                v-if="recording && !flags.isAzureLoading"
                src="@/assets/consultation/waveform-animated.gif"
                alt="Recording Waveform"
              />
              <img
                v-if="recording && !flags.isAzureLoading"
                src="@/assets/consultation/waveform-animated.gif"
                alt="Recording Waveform"
              />
              <img
                v-if="recording && !flags.isAzureLoading"
                src="@/assets/consultation/waveform-animated.gif"
                alt="Recording Waveform"
              />
              <img
                v-if="recording && !flags.isAzureLoading"
                src="@/assets/consultation/waveform-animated.gif"
                alt="Recording Waveform"
              />
              <img
                v-else
                src="@/assets/consultation/waveform-static.png"
                alt="Static Waveform"
                class="centered-image"
              />
            </div>
          </div>
          <div class="conversation-text">
            <span class="no-data-found" v-if="conversation.length === 0">
              Real-time conversation will appear here once the session starts.
            </span>
            <ul class="conversation-text-with-flex">
              <li
                v-for="(message, index) in conversation"
                :key="index"
                :class="{
                  'guest1-message': message.speaker === 'Guest-1',
                  'guest2-message': message.speaker === 'Guest-2',
                }"
                class="message-bubble"
              >
                <AnimatedMessage :text="message.text" />
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="right-side-content">
        <ConsultationInputPanel
          :sessionStopped="session.stopped"
          :prescriptions="generatedPrescriptions"
        />
        <div class="potential-diagnosis">
          <div class="potential-diagnosis-toggle">
            <h3>Potential Diagnosis</h3>
            <div class="toggle-container">
              <label class="switch">
                <input
                  type="checkbox"
                  @change="toggleDiagnosis"
                  :disabled="flags.isTranscriptionStarted"
                  :checked="flags.showDiagnosis"
                />
                <span class="slider round"></span>
              </label>
              <span class="toggle-text">{{
                flags.showDiagnosis ? "On" : "Off"
              }}</span>
            </div>
          </div>
          <div v-if="SuggestedDiagnosisList">
            <div>Based on the conversation, potential diagnoses are:</div>
            <div
              v-for="(diagnosis, index) in SuggestedDiagnosisList"
              :key="index"
            >
              <br />&ensp;&bull;
              <AnimatedMessage :text="diagnosis" />
            </div>
          </div>
          <span v-else class="no-data-found">No records available</span>
          <div class="footer">
            <p class="footer-text">
              <img
                src="@/assets/consultation/disclaimer.svg"
                alt="Disclaimer Icon"
                class="disclaimer-icon"
              />
              This AI-powered doctor assistant provides general guidance based
              on input data but is not a substitute for professional medical
              advice, diagnosis, or treatment.
            </p>
          </div>
        </div>
      </div>
    </div>
    <FeedBackForm
      :isVisible="flags.showPopup"
      :title="texts.feedbackTitle"
      :message="texts.feedback"
      :cancelText="texts.cancelText"
      :confirmText="texts.confirmText"
      @confirm="confirmationRequired"
      @cancel="cancelAction"
    />

    <FeedbackPopup
      :isVisible="flags.showFeedbackPopup"
      :title="texts.popupTitle"
      :confirmText="texts.feedbackMessage"
      @confirm="confirmPopup"
      @cancel="cancelPopup"
      @setRating="setRating"
      @update:selectedItems="handleSelectedCategories"
      @text:otherCategoryText="handleCustomCategoryText"
    />

    <FeedbackSuccessPopup
      :isVisible="flags.showSuccessPopup"
      :title="texts.successTitle"
      :message="texts.successMessage"
      @cancel="successCancel"
    />

    <FeedbackErrorPopup
      :isVisible="flags.showErrorPopup"
      :isError="flags.showErrorPopup"
      :title="texts.errorTitle"
      :message="texts.errorMessage"
      :tryAgain="texts.tryAgainButton"
      @confirm="tryAgain"
      @cancel="successCancel"
    />

    <PatientConsentConfirmation
      v-if="flags.showPatientConsentConfirmation"
      :isVisible="flags.showPatientConsentConfirmation"
      title="Patient Consent Confirmation"
      message="Please confirm that you have obtained the patient’s consent to use this application and store their medical data."
      confirmText="Yes"
      cancelText="Cancel"
      @confirm="confirmPatientConsent"
      @cancel="ClosePatientConsentConfirmation"
    />

    <SettingUpdateAlert
      v-if="flags.showSettingsPopup"
      :isVisible="flags.showSettingsPopup"
      title="Profile and Settings Incomplete"
      @confirm="confirmSettingsUpdated"
      @cancel="cancelSettingsPopup"
    />

    <DiagnosisPopup
      v-if="flags.showDiagnosisPopup"
      @closePopup="flags.showDiagnosisPopup = false"
    />

    <StopSessionAlert
      v-if="flags.sessionStopConfirmation"
      :isVisible="flags.sessionStopConfirmation"
      title="Confirm Stop Session"
      message="Are you sure you want to stop the session?"
      @confirm="confirmStop"
      @cancel="cancelStop"
    />

    <LoadingSpinner
      :visible="flags.isAzureLoading"
      :message="'Intializing the session, please wait...'"
    />

    <SessionEndWaring
      :showSessionWillEndSoon="showSessionWillEndSoon"
      @close="CloseSessionWarning"
      v-if="showPlanExpired && !isAlertVisible"
    />

    <ClearSessionAlert
      v-if="flags.showClearPopup"
      :isVisible="flags.showClearPopup"
      title="Confirm Clear Session"
      message="Are you sure you want to clear this session? All transcription and prescription data will be lost."
      confirmText="Yes"
      cancelText="Cancel"
      @confirm="confirmClearSession"
      @cancel="cancelClearSession"
    />

    <GenerateReportAlert
      :isVisible="flags.showGenerateReportAlert"
      title="Confirmation Required"
      message="Please review the changes. Confirming will generate the report based on the current diagnosis and prescription. Do you wish to proceed?"
      confirmText="Confirm Action"
      cancelText="Cancel"
      @confirm="handleGenerateReportConfirm"
      @cancel="handleGenerateReportCancel"
    />

    <LoadingSpinner
      :visible="flags.isRepostGenerationInProgress"
      :message="'Generating report, please wait...'"
    />
  </div>
  <Toaster position="top-center" richColors />
</template>

<style scoped>
@import "~/assets/css/pages/consultation.css";
</style>
