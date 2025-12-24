<script setup lang="ts">
definePageMeta({
  layout: "panel",
});
import ConfirmationAlert from "@/components/alerts/ConfirmationAlert.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import PaymentStatusModal from "~/components/modals/PaymentStatus.vue";
import { computed, ref, onBeforeMount } from "vue";
import { useSubscriptionService } from "@/composables/useSubscriptionService";
import highlightedInclude from "@/assets/icons/highlightedinclude.svg";
import include from "@/assets/icons/include.svg";
import highlightedExclude from "@/assets/icons/highlightedexclude.svg";
import exclude from "@/assets/icons/exclude.svg";
import ContactForm from "@/components/modals/ContactForm.vue";
import { useMyStore } from "~/store/store";
import { getUserInfoPropertyFromCookie } from "@/composables/useCookieService";

useHead({
  title: "MediNoteX Subscription – Manage Your Plan & Billing",
  meta: [
    {
      name: "description",
      content:
        "View and manage your MediNoteX subscription plan, billing details, and upgrade options. Ensure uninterrupted access to AI medical scribe services.",
    },
  ],
});

// Reactive states
const flags = ref({
  showConfirmationAlert: false,
  AvailableHoursExceeded: false,
  GenerateTranscriptionReport: false,
  isShowNotificationBanner: false,
  showPopup: false,
});
const selectedPlan = ref("");
const confirmationAlertMessage = ref("");
const selectedModalType = ref("");
const currentPlan = ref("");
const country = ref("");
const userId = ref("");
const { payNow, status, modal, isAnnual } = useSubscriptionService();
const store = useMyStore();
const currency = ref("")
const enterprisePrice = ref("Talk to Sales");

//currency based on countrytype
const currencyMap: Record<string, string> = {
  india: "₹",
  "us": "$",
  "uae": "د.إ",
  "uk": "£",
};

    const prices = reactive({
        free:0,
        pro: 0,
        advanced: 0,
        enterprise: "Talk to Sales",
    });

// Confirmation Alert Modal
const ContactUs = (planName: string, modalType: string) => {
  flags.value.showConfirmationAlert = true;
  selectedPlan.value = planName;
  selectedModalType.value = modalType;
  confirmationAlertMessage.value = `Are you sure you want to upgrade to the ${planName} plan? Your account will be charged accordingly.`;
};

const confirmationAlertTitle = computed(() =>
  selectedPlan.value === "Pro" || selectedPlan.value === "Advanced"
    ? "Confirm Pay Now"
    : "Confirm Contact Us"
);

const confirmContactUs = async () => {
  status.isLoading.value = true;
  flags.value.showConfirmationAlert = false;

  setTimeout(async () => {
    localStorage.setItem("modalType", selectedModalType.value);
    localStorage.setItem("selectedPlan", selectedPlan.value);

    if (selectedPlan.value === "Pro" || selectedPlan.value === "Advanced") {
        const planId = selectedPlan.value === "Pro" ? 2 : 3;
        await payNow(planId, userId.value,country.value);
    } else {
      flags.value.showPopup = true;
    }

    status.isLoading.value = false;
  }, 1000);
};

const cancelContactUs = () => {
  flags.value.showConfirmationAlert = false;
};

const updatePrices = () => {
  // Price update logic if needed
};

 onBeforeMount(async () => {
  userId.value = getUserInfoPropertyFromCookie("userId") || "";
  if (userId.value) {
    await store.fetchUserActivityMetrics(userId.value);
  }
  flags.value.AvailableHoursExceeded =
    store.UserActivityMetrics.AvailableHours <= 0;
  flags.value.GenerateTranscriptionReport =
    store.UserActivityMetrics.Transcriptions > 0;
        currentPlan.value = store.UserActivityMetrics.CurrentPlanName.toLowerCase();
  if (
    !flags.value.GenerateTranscriptionReport ||
    flags.value.AvailableHoursExceeded
  ) {
    flags.value.isShowNotificationBanner = true;
    }
    country.value = store.UserActivityMetrics.CountryName.toLowerCase();
    currency.value = currencyMap[country.value] || "$";
    const plans = store.UserActivityMetrics.PlanPricing || [];
    plans.forEach(plan => {
        switch (plan.planId) {
            case 1: // free plan
                prices.free = `${plan.amount}`;
                break;
            case 2: // Pro plan
                prices.pro = `${plan.amount}`;
                break;
            case 3: // Advanced lan
                prices.advanced = `${plan.amount}`;
                break;
            case 4: // Enterprise plan
                prices.enterprise = plan.amount === 0 ? "Talk to Sales" : `${plan.amount}`;
                break;
            default:
                break;
        }
    });
});
</script>

<template>
  <section class="website fee-content" id="fee-content" ref="fee-content">
    <div v-if="flags.isShowNotificationBanner" class="plan-expired-notification">
      <div class="plan-expired-notification-content">
        <img src="@/assets/icons/notification.svg" alt="notification-icon" />
        <div class="plan-expired-notification-text">
          <h4 class="notification-title h4-medium">Your trial has expired!</h4>
          <p class="lg-regular">
            Upgrade now to enjoy seamless access in MediNoteX.
          </p>
        </div>
      </div>
    </div>
    <div class="fee-pricing">
      <div class="fee__billing">
        <div class="fee__header-title1">
          <h4 class="pricing-title h4-medium">
            Choose the plan that works for you.
          </h4>
        </div>
        <div class="fee__switch_actions">
          <div class="fee__switch">
            <span class="fee__billing-option lg-medium" :class="{ 'fee__billing-option--active': !isAnnual }"
              @click="isAnnual = false">
              Monthly
            </span>
            <input type="checkbox" v-model="isAnnual" @change="updatePrices" class="fee__switch-input" />
            <span class="fee__switch-slider"></span>
  
            <span class="fee__billing-option lg-medium" :class="{ 'fee__billing-option--active': isAnnual }"
              @click="isAnnual = true">
              Annually
            </span>
          </div>
        </div>
      </div>
      <div class="fee__plans">
        <div class="fee__plans-grid">
          <!-- Free Plan -->
          <div class="plan plan--free" :class="{ 'plan--current': currentPlan === 'free' }">
            <div class="plan__details">
              <h7 class="plan__title h7-bold">Free Plan</h7>
              <div class="plan__price">
                  <h1 class="plan__currency h1-semibold">{{ currency }}</h1>
                  <h1 class="plan__amount h1-semibold">{{ prices.free }}</h1>
                  <span class="plan__period md-regular">/ Month</span>
              </div>
            </div>
            <div class="plan__features">
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'free' ? highlightedInclude : include" alt="checkmark" />
                <div class="tooltip sm-medium">
                  <span class="feature-value sm-medium">*</span>Up to<span class="feature-value">&nbsp;5</span>
                  Transcriptions & Report Generation/month
                  <span class="tooltiptext">Pricing varies with token usage and covers up to 5 million
                    tokens.</span>
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'free' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">
                  Available Access Hours<span class="feature-value">&nbsp;30</span>
                  minutes
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'free' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">
                  Up to<span class="feature-value">&nbsp;10 </span>minutes
                  session limit
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'free' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">Real-time results</div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'free' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">
                  AI-powered draft SOAP note generation
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'free' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">
                  Automatic data deletion for security compliance
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'free' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">
                  Seamless EHR system integration
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'free' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">
                  Generate documents with confidence
                </div>
              </div>
              <div class="plan__feature plan__feature--excluded">
                <img :src="currentPlan === 'free' ? highlightedExclude : exclude" alt="checkmark" />
                <div class="plan-include plan-exclude sm-medium">
                  Email support
                </div>
              </div>
              <div class="plan__feature plan__feature--excluded">
                <img :src="currentPlan === 'free' ? highlightedExclude : exclude" alt="checkmark" />
                <div class="plan-include plan-exclude sm-medium">
                  Priority access to latest models
                </div>
              </div>
              <div class="plan__feature plan__feature--excluded">
                <img :src="currentPlan === 'free' ? highlightedExclude : exclude" alt="checkmark" />
                <div class="plan-include plan-exclude sm-medium">
                  Early access to new AI features
                </div>
              </div>
              <div class="plan__feature plan__feature--excluded">
                <img :src="currentPlan === 'free' ? highlightedExclude : exclude" alt="checkmark" />
                <div class="plan-include plan-exclude sm-medium">
                  Share Reports via Email
                </div>
              </div>
              <div class="plan__feature plan__feature--excluded">
                <img :src="currentPlan === 'free' ? highlightedExclude : exclude" alt="checkmark" />
                <div class="plan-include plan-exclude sm-medium">
                  Watermark removal
                </div>
              </div>
              <div class="plan__feature plan__feature--excluded">
                <img :src="currentPlan === 'free' ? highlightedExclude : exclude" alt="checkmark" />
                <div class="plan-include plan-exclude sm-medium">
                  Tailored Capabilities & advanced support
                </div>
              </div>
            </div>
            <div class="plan-button">
              <div v-if="currentPlan !== 'free'" class="plan__cta-container">
                <!-- <button
                          class="plan__cta sm-semibold"
                          @click.prevent="showScheduleDemoPopUp = true"
                          :disabled="currentPlan !== 'free'"
                        >
                          Contact us
                        </button> -->
              </div>
              <div v-else class="plan__current-label sm-semibold">
                Current Plan
              </div>
            </div>
          </div>
  
          <!-- Pro Plan -->
          <div class="plan plan--pro" :class="{ 'plan--current': currentPlan === 'pro' }">
            <div class="plan__details">
              <h7 class="plan__title h7-bold">Pro Plan</h7>
              <div class="plan__price">
                  <h1 class="plan__currency h1-semibold">{{ currency }}</h1>
                <h1 class="plan__amount h1-semibold">{{ prices.pro }}</h1>
                <span class="plan__period md-regular">/ Month</span>
              </div>
            </div>
            <div class="plan__features">
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'pro' ? highlightedInclude : include" alt="checkmark" />
                <p class="tooltip sm-medium">
                  <span class="feature-value tooltip-trigger sm-medium">*</span>Up to<span
                    class="feature-value">&nbsp;40</span>
                  transcriptions per month
                  <span class="tooltiptext">Pricing varies with token usage and covers up to 5 million
                    tokens.</span>
                </p>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'pro' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">
                  <span class="feature-value">10</span> hours available
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'pro' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">
                  Up to<span class="feature-value">&nbsp;15</span> minutes
                  session limit
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'pro' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">Real-time results</div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'pro' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">
                  AI-powered draft SOAP note generation
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'pro' ? highlightedInclude : include" alt="checkmark" icons />
                <div class="plan-include sm-medium">
                  Automatic data deletion for security compliance
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'pro' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">
                  Seamless EHR system integration
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'pro' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">
                  Generate documents with confidence
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'pro' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">Email support</div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="currentPlan === 'pro' ? highlightedInclude : include" alt="checkmark" />
                <div class="plan-include sm-medium">
                  Priority access to latest models
                </div>
              </div>
              <div class="plan__feature plan__feature--excluded">
                <img :src="currentPlan === 'pro' ? highlightedExclude : exclude" alt="checkmark" />
                <div class="plan-include plan-exclude sm-medium">
                  Early access to new AI features
                </div>
              </div>
              <div class="plan__feature plan__feature--excluded">
                <img :src="currentPlan === 'pro' ? highlightedExclude : exclude" alt="checkmark" />
                <div class="plan-include plan-exclude sm-medium">
                  Share Reports via Email
                </div>
              </div>
              <div class="plan__feature plan__feature--excluded">
                <img :src="currentPlan === 'pro' ? highlightedExclude : exclude" alt="checkmark" />
                <div class="plan-include plan-exclude sm-medium">
                  Watermark removal
                </div>
              </div>
              <div class="plan__feature plan__feature--excluded">
                <img :src="currentPlan === 'pro' ? highlightedExclude : exclude" alt="checkmark" />
                <div class="plan-include plan-exclude sm-medium">
                  Tailored Capabilities & advanced support
                </div>
              </div>
            </div>
            <div class="plan-button">
              <div v-if="currentPlan !== 'pro'" class="plan__cta-container">
                <button class="plan__cta sm-semibold" @click="ContactUs('Pro', 'contact-us-subscription')">
                  Pay now
                </button>
              </div>
              <div v-else class="plan__current-label sm-semibold">
                Current Plan
              </div>
            </div>
          </div>
  
          <!-- Advanced Plan -->
          <div class="plan" :class="{ 'plan--current': currentPlan === 'advanced' }">
            <div class="plan__details">
              <h7 class="plan__title h7-bold">Advanced Plan</h7>
              <div class="plan__price">
                  <h1 class="plan__currency h1-semibold">{{ currency }}</h1>
                <h1 class="plan__amount h1-semibold">{{ prices.advanced }}</h1>
                <span class="plan__period md-regular">/ Month</span>
              </div>
            </div>
            <div class="plan__features">
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'advanced' ? highlightedInclude : include
                      " alt="checkmark" />
                <p class="tooltip sm-medium">
                  <span class="feature-value sm-medium">*</span>Up to<span class="feature-value">&nbsp;80</span>
                  transcriptions per month
                  <span class="tooltiptext">Pricing varies with token usage and covers up to 5 million
                    tokens.</span>
                </p>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'advanced' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  <span class="feature-value">20</span> hours available
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'advanced' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Up to<span class="feature-value">&nbsp;15</span> minutes
                  session limit
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'advanced' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">Real-time results</div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'advanced' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  AI-powered draft SOAP note generation
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'advanced' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Automatic data deletion for security compliance
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'advanced' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Seamless EHR system integration
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'advanced' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Generate documents with confidence
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'advanced' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Email with priority support
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'advanced' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Priority access to latest models
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'advanced' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Early access to new AI features
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'advanced' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Share Reports via Email
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'advanced' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">Watermark removal</div>
              </div>
              <div class="plan__feature plan__feature--excluded">
                <img :src="
                        currentPlan === 'advanced' ? highlightedExclude : exclude
                      " alt="checkmark" />
                <div class="plan-include plan-exclude sm-medium">
                  Tailored Capabilities & advanced support
                </div>
              </div>
            </div>
            <div class="plan-button">
              <div v-if="currentPlan !== 'advanced'" class="plan__cta-container">
                <button class="plan__cta sm-semibold" @click="ContactUs('Advanced', 'contact-us-subscription')">
                  Pay now
                </button>
              </div>
              <div v-else class="plan__current-label sm-semibold">
                Current Plan
              </div>
            </div>
          </div>
  
          <!-- Enterprise Plan -->
          <div class="plan" :class="{ 'plan--current': currentPlan === 'enterprise' }">
            <div class="plan__details">
              <h7 class="plan__title h7-bold">Enterprise Plan</h7>
              <div class="plan__price">
                  <h4 class="enterprice-plan__price h4-bold">
                      {{ enterprisePrice }}
                  </h4>
              </div>
            </div>
            <div class="plan__features">
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'enterprise' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Fully customizable based on needs
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'enterprise' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Flexible to your requirements
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'enterprise' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Adjustable as per your preference
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'enterprise' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">Real-time results</div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'enterprise' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  AI-powered draft SOAP note generation
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'enterprise' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Automatic data deletion for security compliance
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'enterprise' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Seamless EHR system integration
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'enterprise' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Generate documents with confidence
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'enterprise' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">24x7 support</div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'enterprise' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Priority access to latest models
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'enterprise' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Early access to new AI features
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'enterprise' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Share Reports via Email
                </div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'enterprise' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">Watermark removal</div>
              </div>
              <div class="plan__feature plan__feature--included">
                <img :src="
                        currentPlan === 'enterprise' ? highlightedInclude : include
                      " alt="checkmark" />
                <div class="plan-include sm-medium">
                  Tailored Capabilities & advanced support
                </div>
              </div>
            </div>
            <div class="plan-button">
              <div v-if="currentPlan !== 'enterprise'" class="plan__cta-container">
                <button class="plan__cta sm-semibold" @click="ContactUs('Enterprise', 'contact-us-subscription')">
                  Contact us
                </button>
              </div>
              <div v-else class="plan__current-label sm-semibold">
                Current Plan
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="disclaimer">
        <p class="server-costs">
          *Hosting will be provisioned on your preferred cloud provider (e.g.,
          AWS, Azure, GCP) and billed separately based on usage. Terms and
          conditions apply.
        </p>
      </div>
    </div>
  </section>
  
  <ConfirmationAlert v-if="flags.showConfirmationAlert" :isVisible="flags.showConfirmationAlert"
    :title="confirmationAlertTitle" :message="confirmationAlertMessage" confirmText="Confirm Action" cancelText="Cancel"
    @confirm="confirmContactUs" @cancel="cancelContactUs" />
  <LoadingSpinner :visible="status.isLoading.value" :message="'Loading...'" />
  <PaymentStatusModal :isVisible="modal.showModal.value" :isError="status.isError.value" :title="modal.title.value"
    :message="modal.message.value" :description="modal.description.value" :tryAgain="'Try Again'" />
  <ContactForm :is-visible="flags.showPopup" title="Please fill in the details" submitButtonText="Submit"
    selectedPlan="Enterprise" @close="flags.showPopup = false" />
</template>

<style scoped>
@import "~/assets/css/pages/subscription.css";
</style>
