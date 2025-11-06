<script setup lang="ts">
import { reactive, computed, onMounted } from "vue";
import { useCookie } from "#app";
import {
  validateName,
  validateEmailFormat,
  validatePhone,
  validateRequirements,
} from "~/utils/validators";
import { useContactForm } from "~/composables/useContactForm";
import successIcon from "@/assets/icons/email-icon.svg";
import errorIcon from "@/assets/icons/error-icon.svg";

const props = defineProps({
  isVisible: Boolean,
  title: String,
  selectedPlan: String,
});

const emit = defineEmits(["close"]);

const form = reactive({
  name: "",
  email: "",
  phoneNumber: "",
  countryCode: "+1",
  requirements: "",
});

const errors = reactive({
  name: "",
  email: "",
  phone: "",
  requirements: "",
});

const currentstatus = reactive({
  isLoading: false,
  isSuccess: false,
  isError: false,
  successMessage: "",
  errorMessage: "Something went wrong. Please try again.",
});

onMounted(() => {
  const cookieName = useCookie("firstName");
  const cookieEmail = useCookie("email");
  if (cookieName.value) form.name = cookieName.value;
  if (cookieEmail.value) form.email = cookieEmail.value;
});

const isValid = computed(() => {
  return (
    form.name.trim() &&
    form.email.trim() &&
    form.phoneNumber.trim() &&
    !errors.name &&
    !errors.email &&
    !errors.phone &&
    !errors.requirements
  );
});

function validateField(field: keyof typeof form) {
  switch (field) {
    case "name":
      errors.name = validateName(form.name);
      break;
    case "email":
      errors.email = validateEmailFormat(form.email);
      break;
    case "phoneNumber":
      errors.phone = validatePhone(form.phoneNumber);
      break;
    case "requirements":
      errors.requirements = validateRequirements(form.requirements);
      break;
  }
}

function handleClose() {
  Object.assign(form, {
    name: "",
    email: "",
    phoneNumber: "",
    countryCode: "+1",
    requirements: "",
  });
  Object.assign(errors, {
    name: "",
    email: "",
    phone: "",
    requirements: "",
  });
  Object.assign(currentstatus, {
    isLoading: false,
    isSuccess: false,
    isError: false,
    successMessage: "",
    errorMessage: "Something went wrong. Please try again.",
  });
  emit("close");
}

const contactForm = useContactForm(form, {
  selectedPlan: props.selectedPlan || "",
});

async function handleSubmitForm() {
  ["name", "email", "phoneNumber", "requirements"].forEach((f) =>
    validateField(f as keyof typeof form)
  );

  if (!isValid.value) return;

  currentstatus.isLoading = true;

  try {
    const response = await contactForm.submitForm(props.selectedPlan || "");

    if (response.success) {
      currentstatus.isSuccess = true;
      currentstatus.successMessage =
        response.message || "Submission successful!";
    } else {
      currentstatus.isError = true;
      currentstatus.errorMessage =
        response.message || "Something went wrong.Please try again later";
    }
  } catch (err: any) {
    currentstatus.isError = true;
    currentstatus.errorMessage =
      err?.message || "Unexpected error occurred.Please try again later";
  } finally {
    currentstatus.isLoading = false;
  }
}
</script>

<template>
  <div class="modal" v-if="isVisible">
    <div class="modal-content-contact">
      <span
        class="close"
        @click="handleClose"
        :class="{ disabled: currentstatus.isLoading }"
        :style="{ pointerEvents: currentstatus.isLoading ? 'none' : 'auto' }"
      >
        &times;
      </span>

      <div v-if="!currentstatus.isSuccess && !currentstatus.isError">
        <h2 class="heading">{{ title }}</h2>
        <form @submit.prevent="handleSubmitForm">
          <!-- Name -->
          <div class="input-group mb-8">
            <label>Name<span class="required">*</span></label>
            <input
              v-model="form.name"
              type="text"
              @blur="validateField('name')"
              :class="{ error: errors.name }"
              required
            />
            <div class="error-message">{{ errors.name }}</div>
          </div>

          <!-- Email -->
          <div class="input-group mb-8">
            <label>Email<span class="required">*</span></label>
            <input
              v-model="form.email"
              type="email"
              @blur="validateField('email')"
              :class="{ error: errors.email }"
              required
            />
            <div class="error-message">{{ errors.email }}</div>
          </div>

          <!-- Phone -->
          <div class="input-group phone-input mb-8">
            <label>Phone Number<span class="required">*</span></label>
            <div class="phone-container">
              <select
                v-model="form.countryCode"
                class="country-code"
                :class="{ error: errors.phone }"
              >
                <option value="+1">+1 (US)</option>
                <option value="+44">+44 (UK)</option>
                <option value="+91">+91 (IND)</option>
                <option value="+971">+971 (UAE)</option>
              </select>
              <input
                v-model="form.phoneNumber"
                type="tel"
                @blur="validateField('phoneNumber')"
                class="phone-number"
                :class="{ error: errors.phone }"
                required
              />
            </div>
            <div class="error-message">{{ errors.phone }}</div>
          </div>

          <!-- Requirements -->
          <div class="input-group mb-8">
            <label>Additional Notes / Requirements</label>
            <textarea
              v-model="form.requirements"
              maxlength="500"
              class="requirements-input"
              placeholder="Describe your requirements"
              @blur="validateField('requirements')"
            ></textarea>
            <div class="error-message">{{ errors.requirements }}</div>
          </div>

          <button
            type="submit"
            class="submit-button"
            :disabled="!isValid || currentstatus.isLoading"
          >
            <span v-if="currentstatus.isLoading">
              <i class="pi pi-spinner pi-spin"></i> Loading...
            </span>
            <span v-else>Submit</span>
          </button>
        </form>
      </div>

      <div v-else>
        <div class="mail-success">
          <img
            class="mail-icon"
            :src="currentstatus.isSuccess ? successIcon : errorIcon"
            :alt="currentstatus.isSuccess ? 'Success' : 'Error'"
          />
          <p class="message-text">
            {{
              currentstatus.isSuccess
                ? currentstatus.successMessage
                : currentstatus.errorMessage
            }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/components/modals/contact-form.css";
</style>
