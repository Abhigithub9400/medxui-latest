<script setup lang="ts">
definePageMeta({
  layout: "default",
});

import { ref, computed, onMounted, onUnmounted } from "vue";
import { useLoginService } from "~/composables/useLoginService";
import { validateLoginEmail, validatePassword } from "@/utils/validators";
import EmailVerification from "@/components/login/EmailVerification.vue";
import ForgetPassword from "@/components/modals/ForgetPassword.vue";
import { Toaster, toast } from "vue-sonner";
import { useStorage } from "@vueuse/core";

const { loading, login } = useLoginService();
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const passwordVisible = ref(false);
const isPasswordInputActive = ref(false);
const showForgotPasswordModal = ref(false);
const isReadyToVerify = ref(false);
useHead({
  title: "MediNoteX Login - Medical Dictation Software | Explore Now",
  meta: [
    {
      name: "description",
      content:
        "AI-powered medical Dictation software that transcribes patient-doctor conversations in real time to streamline clinical documentation and integrate with your EHR systems.",
    },
  ],
});

const successMessage = useStorage<string>("successMessage", "");

// Error tracking
const errors = ref<{ email: string; password: string }>({
  email: "",
  password: "",
});
const interacted = ref<{ email: boolean; password: boolean }>({
  email: false,
  password: false,
});

// Field interaction
const interactWithField = (field: "email" | "password") => {
  interacted.value[field] = true;
};

// Handle mount/unmount
onMounted(() => {
  if (successMessage.value) {
    toast.success(successMessage.value, { duration: 5000 });
    successMessage.value = "";
  }
});

// Input helpers
const trimEmail = () => {
  email.value = email.value.trim();
};

const handlePaste = () => {
  setTimeout(() => {
    email.value = email.value.trim();
  }, 0);
};

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value;
};

const checkPasswordInput = () => {
  isPasswordInputActive.value = password.value.trim().length > 0;
};

// Validation
const validateField = (field: "email" | "password") => {
  if (!interacted.value[field]) return;

  if (field === "email") {
    errors.value.email = validateLoginEmail(email.value);
  }

  if (field === "password") {
    errors.value.password = validatePassword(password.value);
  }
};

const isFormValid = computed(() => {
  return (
    email.value.trim() !== "" &&
    password.value !== "" &&
    errors.value.email === "" &&
    errors.value.password === ""
  );
});

const handleLogin = async () => {
  validateField("email");
  validateField("password");

  if (errors.value.email || errors.value.password) return;

  try {
    const data = await login(email.value, password.value);

    if (data.success) {
      isReadyToVerify.value = true;
    } else {
      toast.error(data.message || "Login failed", { duration: 5000 });
    }
  } catch (error: any) {
    toast.error(error.data?.message || "Login failed. Please try again.", {
      duration: 5000,
    });
  }
};
</script>

<template>
  <EmailVerification
    :email="email"
    :remember="rememberMe"
    v-if="isReadyToVerify"
  />
  <div class="form-content" v-else>
    <h2 class="form-heading">Login</h2>

    <form @submit.prevent="handleLogin">
      <div class="input-group">
        <label for="email">Email</label>
        <input
          v-model="email"
          type="text"
          id="email"
          @input="trimEmail"
          @paste="handlePaste"
          @focus="interactWithField('email')"
          @blur="validateField('email')"
          required
        />
        <span v-if="errors.email" class="error">{{ errors.email }}</span>
      </div>

      <div class="input-group">
        <label for="password">Password</label>
        <div class="password-wrapper">
          <input
            v-model="password"
            :type="passwordVisible ? 'text' : 'password'"
            id="password"
            @focus="interactWithField('password')"
            @blur="validateField('password')"
            @input="checkPasswordInput"
            required
          />
          <button
            v-if="isPasswordInputActive"
            type="button"
            @click="togglePasswordVisibility"
          >
            <i :class="passwordVisible ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
          </button>
        </div>
        <span v-if="errors.password" class="error">{{ errors.password }}</span>
      </div>

      <div class="options">
        <div>
          <input
            type="checkbox"
            id="rememberMe"
            v-model="rememberMe"
            @keydown.enter.prevent="rememberMe = !rememberMe"
          />
          <label for="rememberMe">Remember me</label>
        </div>

        <a
          href="#"
          class="forgot-password"
          @click.prevent="showForgotPasswordModal = true"
          >Forgot Password?</a
        >
      </div>

      <button
        type="submit"
        class="login-button"
        :disabled="!isFormValid || loading"
      >
        <span v-if="loading">
          <i class="pi pi-spinner pi-spin"></i> Loading...
        </span>
        <span v-else>Login</span>
      </button>
    </form>
  </div>
  <ForgetPassword
    :is-visible="showForgotPasswordModal"
    title="Forgot Password"
    description="Enter your registered email address to receive a password reset link"
    submitButtonText="Submit"
    modal-type="forgot-password"
    @close="showForgotPasswordModal = false"
  />
  <Toaster position="top-right" richColors />
</template>

<style scoped>
@import "~/assets/css/pages/login.css";
</style>
