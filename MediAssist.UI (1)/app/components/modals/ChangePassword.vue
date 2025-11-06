<script setup lang="ts">
import { ref, onMounted, computed, defineEmits, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useChangePassword } from '~/composables/useChangePassword';
import { validateChangePassword, validateConfirmPassword } from '@/utils/validators';
import { Toaster, toast } from "vue-sonner";
import { useStorage,useEventListener } from '@vueuse/core';
import { getUserInfoPropertyFromCookie } from '@/composables/useCookieService';

const { changePasswordAPI, checkPasswordAPI, logoutAPI } = useChangePassword()
const router = useRouter();
const password = ref('');
const confirmPassword = ref('');
const currentPassword = ref('');
const passwordVisible = ref(false);
const confirmPasswordVisible = ref(false);
const currentPasswordVisible = ref(false);
const isPasswordInputActive = ref(false);
const isConfirmPasswordInputActive = ref(false);
const isCurrentPasswordInputActive = ref(false);
const userId = ref('');
const currentPasswordError = ref('');


const logoutEvent = useStorage<string | null>("logoutEvent", null);
const userLoggedOut = useStorage<string | null>("userLoggedOut", null);
const successMessage = useStorage<string | null>('successMessage', null);
const image = useStorage<string | null>("image", null);

const emits = defineEmits(['close']);
const cancel = () => emits('close');
const errors = ref({
  password: '',
  confirmPassword: '',
});

watch(currentPassword, () => {
  if (password.value) {
    errors.value.password = validateChangePassword(password.value, currentPassword.value);
  }
});

function clearUserStorage() {
  image.value = null
  logoutEvent.value = null
}
function handleStorageEvent(event: StorageEvent) {
  if (event.key === 'userLoggedOut') {
    redirectAndLockOnLoginPage();
  }

  if (event.key === 'logout-event') {
    router.push('/login');
  }
}

onMounted(() => {
  userId.value = getUserInfoPropertyFromCookie("userId") || "";
});

useEventListener(document, "click", handleStorageEvent);
const toggleCurrentPasswordVisibility = () => {
  currentPasswordVisible.value = !currentPasswordVisible.value;
};
const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value;
};

const toggleConfirmPasswordVisibility = () => {
  confirmPasswordVisible.value = !confirmPasswordVisible.value;
};

const interactWithField = (field: string) => {
  isPasswordInputActive.value = field === 'password' && password.value.length > 0;
  isConfirmPasswordInputActive.value = field === 'confirmPassword' && confirmPassword.value.length > 0;
  isCurrentPasswordInputActive.value = field === 'currentPassword' && currentPassword.value.length > 0;
};

const validateField = (field: string) => {
  if (field === 'password') {
    errors.value.password = validateChangePassword(password.value, currentPassword.value);
  } else if (field === 'confirmPassword') {
    errors.value.confirmPassword = validateConfirmPassword(confirmPassword.value, password.value);
  }
};

const isFormValid = computed(() => {
  return password.value && confirmPassword.value && currentPassword.value && !errors.value.password && !errors.value.confirmPassword;
});


const checkPassword = async (): Promise<boolean> => {
  try {
    if (!currentPassword.value) {
      currentPasswordError.value = 'Current password is required.';
      return false;
    }else if (currentPassword.value.length < 8) {
      currentPasswordError.value = 'Please enter the correct password to proceed.';
      return false;
    }
    
    const response = await checkPasswordAPI(userId.value, currentPassword.value);

    if (!response.success) {
      currentPasswordError.value = 'Please enter the correct password to proceed.';
      return false;
    }
    currentPasswordError.value = '';
    return true; 
  }  catch (error: any) {
    currentPasswordError.value = error?.message || 'An error occurred. Please try again.';
    return false;
  }
};

const changePassword = async () => {
  logoutEvent.value = Date.now().toString()
  validateField('password');
  validateField('confirmPassword');

  if (isFormValid.value && await checkPassword()) {
    try {
      const response = await changePasswordAPI({
        NewPassword: password.value,
        ConfirmPassword: confirmPassword.value,
        Password: currentPassword.value,
        UserId: userId.value
      });

      if (response.success) {
        await logoutAPI();
        clearUserStorage();
        successMessage.value = response.message || 'Your password has been successfully changed. Please sign in using your new password';
        userLoggedOut.value = Date.now().toString();
        redirectAndLockOnLoginPage();
      } 
    } catch (error:any) {
      toast.error(error?.message || 'An error occurred while changing your password. Please try again.', { duration: 5000 });
    }   
  }
};

const redirectAndLockOnLoginPage = () => {
  router.replace('/login');
  history.pushState(null, '', '/login');
  window.onpopstate = () => history.pushState(null, '', '/login');
};

const checkPasswordInput = () => {
  interactWithField('password');
    errors.value.password = '';
}

const checkCurrentPasswordInput = () => {
  interactWithField('currentPassword');
      currentPasswordError.value = '';
}
const handleConfirmPasswordInput = () => {
    interactWithField('confirmPassword');
        errors.value.confirmPassword = ''; 
};
</script>

<template>
  <div class="change-password-page">
    <div class="change-password-popup">
      <div class="modal-header">
        <button class="close-button" @click="cancel">
          <span>&times;</span>
        </button>
      </div>
      <h2 class="modal-title">Change Password</h2>
      <form @submit.prevent="changePassword">
        <div class="input-group">
          <label for="currentPassword">Current Password</label>
          <div class="password-wrapper">
            <input
              v-model="currentPassword"
              :type="currentPasswordVisible ? 'text' : 'password'"
              id="currentPassword"
              @focus="interactWithField('currentPassword')"
              @blur="checkPassword"
              @input="checkCurrentPasswordInput"
              required
            />
            <button
              v-if="isCurrentPasswordInputActive"
              type="button"
              @click="toggleCurrentPasswordVisibility"
            >
              <i
                :class="
                  currentPasswordVisible ? 'pi pi-eye-slash' : 'pi pi-eye'
                "
              ></i>
            </button>
          </div>
          <span v-if="currentPasswordError" class="error">{{
            currentPasswordError
          }}</span>
        </div>

        <div class="input-group">
          <label for="password">New Password</label>
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
          <span v-if="errors.password" class="error">{{
            errors.password
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

        <button type="submit" class="reset-button" :disabled="!isFormValid">
          Change Password
        </button>
      </form>
    </div>
  </div>
  <Toaster position="top-right" richColors />
</template>

<style scoped>
@import "~/assets/css/components/modals/change-password.css";
</style>