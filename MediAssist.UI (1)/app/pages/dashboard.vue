<script setup lang="ts">
definePageMeta({
  layout: false,
});
import Icon from "@/assets/icons/doctor-icon.svg";
import FeedBackForm from "@/components/alerts/ConfirmationAlert.vue";
import FeedbackPopup from "~/components/modals/FeedbackPopup.vue";
import {
  default as FeedbackErrorPopup,
  default as FeedbackSuccessPopup,
} from "~/components/modals/FeedbackSuccessErrorPopup.vue";
import AppLogo from "~/components/common/AppLogo.vue";
import FeatureCard from "~/components/dashboard/FeatureCard.vue";
import ProfileDropDown from "~/components/common/ProfileDropDown.vue";
import { useMyStore } from "~/store/store";
import { onBeforeMount, onMounted, ref } from "vue";
import { useSubmitFeedback } from "@/composables/useDashboardService";
import EffortlessImage from "@/assets/dashboard/effortless_real-time_transcription.png";
import SmartSessionImage from "@/assets/dashboard/smart_session_controls.png";
import AIPoweredImage from "@/assets/dashboard/ai_powered_diagnostics.png";
import ReportingImage from "@/assets/dashboard/comprehensive_reporting.png";
import { Toaster } from "vue-sonner";
import { useStorage, useEventListener } from "@vueuse/core";
import { getUserInfoPropertyFromCookie } from "@/composables/useCookieService";
import { settingsUpdatedHook } from "@/composables/useSettingsUpdate";
import { usePatientService } from "~/composables/usePatientService";
import { useRouter } from 'vue-router';

useHead({
  title: "MediNoteX Dashboard – Manage Medical Transcriptions & Insights",
  meta: [
    {
      name: "description",
      content:
        "Access your AI-driven medical scribe dashboard to view, manage, and analyze transcriptions, coding suggestions, and EHR integrations—all in one place.",
    },
  ],
});
const store = useMyStore();
const { submitFeedback } = useSubmitFeedback();
const { resetPatient } = usePatientService();
const router = useRouter();

const firstName = ref("");
const rating = ref(0);
const userId = ref("");
const selectedCategories = ref<number[]>([]);
const customCategoryText = ref("");
const message = ref("");
const imageSrc = ref();

const flags = ref({
  fromDashboard: false,
  menuOpen: false,
  showPopup: false,
  showFeedbackPopup: false,
  showSuccessPopup: false,
  showErrorPopup: false,
  showToast: false,
  success: false,
});

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


const handleSelectedCategories = (categories: { id: number }[]) => {
  selectedCategories.value = categories.map((category) => category.id);
};

const handleCustomCategoryText = (text: string) => {
  customCategoryText.value = text;
};

const toggleMenu = () => {
  flags.value.menuOpen = !flags.value.menuOpen;
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
    console.log("res", response);

    if (response.success) {
      flags.value.showSuccessPopup = true;
      flags.value.showFeedbackPopup = false;
    } else {
      flags.value.showErrorPopup = true;
    }
  } catch (error) {
    console.error("Error submitting feedback:", error);
  }
};

const cancelPopup = () => {
  flags.value.showFeedbackPopup = false;
};
const confirmationRequired = () => {
  flags.value.showFeedbackPopup = true;
  flags.value.showPopup = false;
};
const showFeedbackForm = () => {
  flags.value.showPopup = true;
};

const cancelAction = () => {
  flags.value.showPopup = false;
};

const successCancel = () => {
  flags.value.showSuccessPopup = false;
  flags.value.showErrorPopup = false;
};

const tryAgain = () => {
  flags.value.showSuccessPopup = false;
  flags.value.showErrorPopup = false;
};

const setRating = (star: number) => {
  rating.value = star;
};

const handleClickOutside = (event: MouseEvent) => {
  const menu = document.querySelector(".user-profile");
  const userIcon = document.querySelector(".user-icon");
  if (
    menu &&
    !menu.contains(event.target as Node) &&
    userIcon &&
    !userIcon.contains(event.target as Node)
  ) {
    flags.value.menuOpen = false;
  }
};

let benefits = [
  {
    icon: EffortlessImage,
    title: "Effortless Real-Time Transcription",
    description:
      "Capture and convert conversations into structured reports in seconds.",
  },
  {
    icon: SmartSessionImage,
    title: "Smart Session Controls",
    description:
      "Pause, resume, or end transcriptions with total ease designed for your workflow.",
  },
  {
    icon: AIPoweredImage,
    title: "AI-Powered Diagnostics",
    description:
      "Leverage AI to receive instant diagnosis suggestions and automatic prescription drafts.",
  },
  {
    icon: ReportingImage,
    title: "Comprehensive Reporting",
    description:
      "Generate precise, comprehensive summaries, ready for sharing or archiving.",
  },
];

onBeforeMount(async () => {
  const userId = getUserInfoPropertyFromCookie("userId") || "";
  if (userId) {
    await store.fetchUserActivityMetrics(userId);
  }
});

settingsUpdatedHook.on((data) => {
  flags.value.success = data.success;
  message.value = data.message;
  flags.value.showToast = true;

  setTimeout(() => {
    flags.value.showToast = false;
  }, 8000);
});

const launchConsultation = () => {
  resetPatient();
  router.push({ path: `/consultation` });
};

onMounted(() => {
  userId.value = getUserInfoPropertyFromCookie("userId") || "";
  firstName.value = getUserInfoPropertyFromCookie("firstName") || "";
  const image = useStorage<string | null>("image", null);

  if (image.value && image.value !== "null") {
    const type = image.value.startsWith("/9j") ? "jpeg" : "png";

    if (image.value.startsWith("data:image")) {
      imageSrc.value = image.value;
    }

    imageSrc.value = `data:image/${type};base64,${image.value}`;
  } else {
    imageSrc.value = Icon;
  }
});

useEventListener(document, "click", handleClickOutside);
</script>

<template>
  <div class="home-page">
    <div class="background-section">
      <header class="header-container">
        <hamburger-menu></hamburger-menu>
        <div class="user-menu">
          <div class="toast" v-if="flags.showToast">
            <div class="profile-update" :class="{ success: flags.success }">
              <img
                v-if="flags.success"
                class="bold-essentional-ui-check"
                alt="success icon"
                src="@/assets/dashboard/setting_update_icon.svg"
              />
              <div class="profile-updated-successfully">
                {{ message }}
              </div>
              <router-link to="/settings">
                <button class="updateSettings">Update Settings</button>
              </router-link>
              <button
                class="image-delete-icon"
                @click="flags.showToast = false"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="11"
                  height="11"
                  viewBox="0 0 11 11"
                  fill="none"
                >
                  <path
                    d="M1 9.75L10 1.25M1 1.25L10 9.75"
                    stroke="#7C7C7C"
                    stroke-width="1.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div class="app-logo">
            <AppLogo :fromDashboard="(flags.fromDashboard = true)" />
          </div>
          <div class="settings">
            <router-link to="/settings">
              <img
                src="@/assets/dashboard/settings-icon.svg"
                alt="settings_icon"
              />
            </router-link>
          </div>
          <div>
            <img
              v-if="imageSrc"
              :src="imageSrc"
              alt="User Icon"
              class="user-icon"
              @click="toggleMenu"
            />
          </div>
          <div class="user-profile">
            <ProfileDropDown :menuOpen="flags.menuOpen" />
          </div>
        </div>
        <div class="content-area">
          <h1 class="welcome-heading">
            Hi {{ firstName }}, Welcome to
            {{ store.MediAssistConfigManager.DomainName }}
          </h1>
          <p class="welcome-text">
            Our AI-driven medical scribing application provides real-time
            insights, predictive analytics, and detailed reporting to ensure
            superior patient care and more efficient medical processes.
          </p>
          <div class="button-group">
            <button @click="launchConsultation" class="start-chat-button"
              >Launch Consultation
            </button>
          </div>
        </div>
        <div class="feedback-form" @click="showFeedbackForm">
          <div class="feedback-button">Submit Feedback</div>
        </div>
      </header>
    </div>
    <div class="key-features-container">Key Features</div>

    <div class="key-features">
      <div class="features-grid">
        <FeatureCard
          v-for="(feature, index) in benefits"
          :key="index"
          :icon="feature.icon"
          :title="feature.title"
          :description="feature.description"
        />
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
    <Toaster position="top-right" richColors />
  </div>
</template>

<style scoped>
@import "~/assets/css/pages/dashboard.css";
</style>
