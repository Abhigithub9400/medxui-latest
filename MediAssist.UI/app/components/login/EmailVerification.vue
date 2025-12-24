<script setup lang="ts">
import { ref, computed, nextTick, defineProps } from "vue";
import emailIcon from "@/assets/icons/email-icon.svg";
import circleTick from "@/assets/icons/circle-tick.svg";
import { useLoginService } from "~/composables/useLoginService";
import { useRouter } from "vue-router";
import { Toaster, toast } from "vue-sonner";
import { useStorage } from "@vueuse/core";
import { settingsUpdatedHook } from "@/composables/useSettingsUpdate";

const { verifyLoginOtp, clearOtp, resendOtp } = useLoginService();
const router = useRouter();
const props = defineProps({
  email: {
    type: String,
    required: true,
  },
  remember: {
    type: Boolean,
    required: true,
  },
});
const isReadyToVerify = ref(false);
const isVerified = ref(false);
const showToast = ref(false);
const isDisabled = ref(false);
const isLoading = ref(false);
const fullCode = computed(() => codeInputs.value.join(""));
const userData = ref();
const codeInputs = ref(["", "", "", ""]);
const inputRefs = ref<(HTMLInputElement | null)[]>([]);
const image = useStorage<string | null>("image", null);

const setInputRef = (
  el: Element | ComponentPublicInstance | null,
  idx: number
) => {
  inputRefs.value[idx] = el instanceof HTMLInputElement ? el : null;
};

const handleInput = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const idx = parseInt(input.dataset.idx || "0");
  const numeric = input.value.replace(/\D/g, ""); // Keep only digits

  codeInputs.value[idx] = numeric;

  if (numeric && idx < codeInputs.value.length - 1) {
    await nextTick();
    const nextInput = inputRefs.value[idx + 1];
    nextInput?.focus();
  }
};

const verifyMail = async () => {
  if (isVerified.value) {
    isLoading.value = true;
    sessionStorage.removeItem("logoutState");
    window.onpopstate = null;
    image.value = userData.value.image;

    await router.push(userData.value.redirectUrl);

    if (!userData.value.isSettingsUpdated) {
      setTimeout(() => {
        settingsUpdatedHook.trigger({
          success: true,
          message:
            "Complete your settings page to access all features and benefits",
        });
      }, 100);
    }

    isLoading.value = false;
    return;
  }

  if (isReadyToVerify.value) {
    try {
      isLoading.value = true;

      const response = await verifyLoginOtp(
        props.email,
        fullCode.value,
        props.remember
      );

      if (response.success) {
        userData.value = response.data;
        isVerified.value = true;
      } 
    } catch (error: any) {
      toast.error(
        error.data?.message ||
          "Oops! The code you entered is incorrect or expired. Please check your email and try again.",
        {
          duration: 5000,
        }
      );
    } finally {
      isLoading.value = false;
    }

    return;
  }

  isReadyToVerify.value = true;
};

const goBack = async () => {
  try {
    await clearOtp();
  } catch {
    console.log("OTP clear failed");
  }
  router.go(0);
};

const resendMail = async () => {
  if (isDisabled.value) return;

  try {
    isDisabled.value = true;
    await resendOtp(props.email);
    setTimeout(() => {
      isDisabled.value = false;
    }, 30000);
  } catch {
    isDisabled.value = false;
  }
};

const reset = () => {
  isLoading.value = false;
  showToast.value = false;
};
</script>

<template>
  <div v-if="true" class="verify-card">
    <img
      :src="isVerified ? circleTick : emailIcon"
      :alt="isVerified ? 'Success Icon' : 'Email Icon'"
      class="email-icon"
    />

    <h2>{{ isVerified ? "Login successful" : "Check your Email" }}</h2>
    <p v-if="isVerified" class="subtext">
      Please click the button below to continue to the interface
    </p>
    <p v-else class="subtext">
      We sent verification code to
      <span class="email">{{ props.email }}</span>
    </p>

    <div v-if="isReadyToVerify && !isVerified" class="code-inputs">
      <input
        v-for="(val, idx) in codeInputs"
        :key="idx"
        v-model="codeInputs[idx]"
        :data-idx="idx"
        maxlength="1"
        inputmode="numeric"
        pattern="\d*"
        type="text"
        @input="handleInput"
        :ref="(el) => setInputRef(el, idx)"
      />
    </div>
    <button
      :disabled="isLoading || (isReadyToVerify && fullCode.length < 4)"
      class="verify-btn"
      @click="verifyMail"
    >
      <span v-if="isLoading">
        <i class="pi pi-spinner pi-spin"></i> Loading...
      </span>
      <span v-else>{{
        isVerified
          ? "Continue"
          : isReadyToVerify
          ? "Verify OTP"
          : "Enter code manually"
      }}</span>
    </button>

    <p v-if="!isVerified" class="resend-text">
      Didn’t receive the email?
      <a
        @click="resendMail"
        :class="{ disabled: isDisabled }"
        :title="isDisabled ? 'Please wait 30 seconds before resending' : ''"
        >Click to resend</a
      >
    </p>

    <div v-if="!isVerified" class="back-login" @click="goBack">
      <span class="arrow">&#8592;</span>
      <span>Back to Login</span>
    </div>

    <Toaster
      position="top-right"
      richColors
      :toastOptions="{
        style: {
          width: '590px',
        },
      }"
    />
  </div>
</template>

<style scoped>
@import "~/assets/css/components/login/email-verification.css";
</style>
