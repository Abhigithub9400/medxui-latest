<script setup lang="ts">
definePageMeta({
  layout: false,
});
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { validateNewPassword, validateConfirmPassword } from '~/utils/validators';
import { useLoginService } from '~/composables/useLoginService';
import { useStorage } from '@vueuse/core';

useHead({
  title: "Reset Your MediNoteX Password | Secure Account Access",
  meta: [
    {
      name: "description",
      content:
        "Easily reset your MediNoteX password to regain secure access to your medical dictation account. Follow the steps to create a new password.",
    },
  ],
});
const { resetPassword, validateResetPasswordToken } = useLoginService();
const route = useRoute();
const router = useRouter();

const token = ref<string>('');
const uid = ref<string>('');
const userEmailId = ref<string>('');
const newPassword = ref<string>('');
const confirmPassword = ref<string>('');
const passwordVisible = ref<boolean>(false);
const confirmPasswordVisible = ref<boolean>(false);
const isPasswordInputActive = ref<boolean>(false);
const isConfirmPasswordInputActive = ref<boolean>(false);
const errorMessage = ref<string>('');
const validationMessage = ref<string>('');
const isValidToken = ref<boolean>(false);
const successMessage = useStorage<string | null>('successMessage', null);

const errors = ref<{
  newPassword: string;
  confirmPassword: string;
}>({
  newPassword: '',
  confirmPassword: '',
});

onMounted(() => {
  token.value = (route.query.token as string) ?? '';
  uid.value = (route.query.uid as string) ?? '';
  validateToken();
});

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value;
};

const toggleConfirmPasswordVisibility = () => {
  confirmPasswordVisible.value = !confirmPasswordVisible.value;
};

const interactWithField = (field: 'newPassword' | 'confirmPassword') => {
  if (field === 'newPassword') {
    isPasswordInputActive.value = newPassword.value.length > 0;
  } else if (field === 'confirmPassword') {
    isConfirmPasswordInputActive.value = confirmPassword.value.length > 0;
  }
};

const validateField = (field: 'newPassword' | 'confirmPassword') => {
  if (field === 'newPassword') {
    errors.value.newPassword = validateNewPassword(newPassword.value);
  } else if (field === 'confirmPassword') {
    errors.value.confirmPassword = validateConfirmPassword(newPassword.value, confirmPassword.value);
  }
};

const isFormValid = computed(() => {
  return (
    newPassword.value.length > 0 &&
    confirmPassword.value.length > 0 &&
    errors.value.newPassword === '' &&
    errors.value.confirmPassword === ''
  );
});

const validateToken = async () => {
  try {
    const response = await validateResetPasswordToken(token.value, uid.value);

    isValidToken.value = response.success;

    if (response.success) {
      userEmailId.value = response.data.email ?? '';
    } else {
      validationMessage.value = response.message ?? 'Token validation failed.';
    }
  } catch (error: any) {
    if (error?.response?.data?.message) {
      validationMessage.value = error.response.data.message;
    } else {
      validationMessage.value = 'Token validation failed.';
    }
    isValidToken.value = false;
  }
};

const resetPasswordHandler = async () => {
  validateField('newPassword');
  validateField('confirmPassword');

  if (isFormValid.value) {
    try {
      const response = await resetPassword(
        newPassword.value,
        confirmPassword.value,
        userEmailId.value,
        token.value
      );

      if (response.success) {
        const clearCookie = (name: string) => {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
        };
        ['userId', 'firstName', 'specialization', 'title'].forEach(clearCookie);

        successMessage.value = 'Your password has been reset successfully. Please sign in using your new password';
        router.push('/login');
      } else {
        errorMessage.value = response.message ?? 'Password reset failed. Please try again.';
      }
    } catch (error : any) {
      errorMessage.value =
        error.value || 'An error occurred while resetting your password. Please try again.';
    }
  }
};

const checkPasswordInput = () => {
  interactWithField('newPassword');

  if (validationMessage.value) {
    validationMessage.value = '';
  }
};

const handleConfirmPasswordInput = () => {
  interactWithField('confirmPassword');

  if (errors.value.confirmPassword) {
    errors.value.confirmPassword = '';
  }

  if (validationMessage.value) {
    validationMessage.value = '';
  }
};
</script>

<template>
  <div class="reset-password-page">
    <div class="background-container">
      <iframe
        src="/"
        class="background-blur"
        title="Descriptive title here"
      ></iframe>
    </div>

    <div v-if="!isValidToken" class="error-container">
      <img
        src="@/assets/icons/error-icon.svg"
        alt="Error"
        class="error-image"
      />
      <p class="error-message">{{ validationMessage }}</p>
    </div>

    <div v-else class="reset-password-popup">
      <h2>Reset Password</h2>
      <form @submit.prevent="resetPasswordHandler">
        <div class="input-group">
          <label for="newPassword">Enter your Password</label>
          <div class="password-wrapper">
            <input
              v-model="newPassword"
              :type="passwordVisible ? 'text' : 'password'"
              id="newPassword"
              @focus="interactWithField('newPassword')"
              @blur="validateField('newPassword')"
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
          <span v-if="errors.newPassword" class="error">{{
            errors.newPassword
          }}</span>
        </div>

        <div class="input-group">
          <label for="confirmPassword">Confirm Password</label>
          <div class="password-wrapper">
            <input
              v-model="confirmPassword"
              :type="confirmPasswordVisible ? 'text' : 'password'"
              id="confirmPassword"
              @focus="interactWithField('confirmPassword')"
              @blur="validateField('confirmPassword')"
              @input="handleConfirmPasswordInput"
              required
            />
            <button
              v-if="isConfirmPasswordInputActive"
              type="button"
              @click="toggleConfirmPasswordVisibility"
            >
              <i
                :class="
                  confirmPasswordVisible ? 'pi pi-eye-slash' : 'pi pi-eye'
                "
              ></i>
            </button>
          </div>
          <span v-if="errors.confirmPassword" class="error">{{
            errors.confirmPassword
          }}</span>
        </div>

        <p v-if="validationMessage" class="error-message">
          {{ validationMessage }}
        </p>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <button type="submit" class="reset-button" :disabled="!isFormValid">
          Reset Password
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/pages/reset-password.css";
</style>
