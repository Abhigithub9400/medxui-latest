<script setup lang="ts">
const layout = "default";

import { useWebsiteUrl } from "~/composables/useRuntimeEnv";
import { useSignupService } from "~/composables/useSignupService";
import { Toaster, toast } from "vue-sonner";
import {
  validateEmailSignup,
  validatePasswordSignup,
  validateConfirmPassword,
  validateTitle,
  validateName,
  validateGender,
  validateDob,
  validateCountry,
  validateLicenseNumber,
  validateMedicalCredentials,
  validateSpecialization,
  validateAgreements,
} from "~/utils/validators";
import { useStorage } from "@vueuse/core";

const {
  checkDuplicateLicense,
  checkDuplicateEmail,
  signUpUser,
  getInitialData,
  getLicenseRegexPattern,
} = useSignupService();

import { useRouter } from "vue-router";

const config = useRuntimeConfig();
const websiteUrl = config.public.websiteUrl;
const router = useRouter();
const form = ref({
  title: "",
  name: "",
  gender: "",
  dob: "",
  country: "",
  licenseNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
  medicalCredentials: "",
  specialization: "",
  agreeTerms: false,
  agreeLicense: false,
});
const titleOptions = ref<any[]>([]);
const genderOptions = ref<any[]>([]);
const countryOptions = ref<any[]>([]);
const medicalCredentialsOptions = ref<any[]>([]);
const passwordVisible = ref(false);
const isPasswordInputActive = ref(false);
const isConfirmPasswordInputActive = ref(false);
const ConfirmpasswordVisible = ref(false);
const tooltipVisible = ref(false);
const passwordRules = ref({
  isLengthValid: false,
  hasUpperCase: false,
  hasLowerCase: false,
  hasDigit: false,
  hasSpecialChar: false,
});
const isLoading = ref(false);
const regexPattern = ref<RegExp | null>();
const licenseNumberTouched = ref(false);
const successMessage = useStorage<string | null>("successMessage", null);
const errors = ref({
  title: "",
  name: "",
  gender: "",
  dob: "",
  country: "",
  licenseNumber: "",
  email: "",
  password: "",
  confirmPassword: "",
  medicalCredentials: "",
  specialization: "",
  agreeTerms: "",
  agreeLicense: "",
});

useHead({
  title: "Sign Up for MediNoteX | Try AI Medical Scribe Software",
  meta: [
    {
      name: "description",
      content:
        "Create your MediNoteX account to access AI-powered medical scribe tools that simplify clinical documentation for healthcare providers. Start your free trial today.",
    },
  ],
});

const interacted = ref({
  title: false,
  name: false,
  gender: false,
  dob: false,
  country: false,
  licenseNumber: false,
  email: false,
  password: false,
  confirmPassword: false,
  medicalCredentials: false,
  specialization: false,
  agreeTerms: false,
  agreeLicense: false,
});

const interactWithField = (
  field:
    | "title"
    | "name"
    | "gender"
    | "dob"
    | "country"
    | "licenseNumber"
    | "email"
    | "password"
    | "confirmPassword"
    | "medicalCredentials"
    | "specialization"
    | "agreeTerms"
    | "agreeLicense"
) => {
  interacted.value[field] = true;
};
const validateField = (
  field:
    | "title"
    | "name"
    | "gender"
    | "dob"
    | "country"
    | "licenseNumber"
    | "email"
    | "password"
    | "confirmPassword"
    | "medicalCredentials"
    | "specialization"
    | "agreeTerms"
    | "agreeLicense"
) => {
  if (!interacted.value[field]) return;

  switch (field) {
    case "title":
      errors.value.title = validateTitle(form.value.title);
      break;

    case "name":
      errors.value.name = validateName(form.value.name);
      break;

    case "gender":
      errors.value.gender = validateGender(form.value.gender);
      break;

    case "dob":
      dobErrors.value = validateDob(form.value.dob);
      break;

    case "country":
      errors.value.country = validateCountry(form.value.country);
      break;

    case "licenseNumber":
      if (regexPattern.value) {
        errors.value.licenseNumber = validateLicenseNumber(
          form.value.licenseNumber,
          licenseNumberTouched.value,
          regexPattern.value
        );
      }
      break;

    case "email":
      errors.value.email = validateEmailSignup(form.value.email);
      break;

    case "password":
      errors.value.password = validatePasswordSignup(form.value.password);
      break;

    case "confirmPassword":
      errors.value.confirmPassword = validateConfirmPassword(
        form.value.password,
        form.value.confirmPassword
      );
      break;

    case "medicalCredentials":
      errors.value.medicalCredentials = validateMedicalCredentials(
        form.value.medicalCredentials
      );
      break;

    case "specialization":
      errors.value.specialization = validateSpecialization(
        form.value.specialization
      );
      break;

    case "agreeTerms":
    case "agreeLicense":
      const agreementErrors = validateAgreements(
        form.value.agreeTerms,
        form.value.agreeLicense,
        {
          agreeTerms: form.value.agreeTerms,
          agreeLicense: form.value.agreeLicense,
        }
      );
      errors.value.agreeTerms = agreementErrors.agreeTerms;
      errors.value.agreeLicense = agreementErrors.agreeLicense;
      break;
  }
};

const dobErrors = ref({
  invalidDateFormat: false,
  invalidAge: false,
  futureDate: false,
  blankDob: false,
});

const handleSignUp = async () => {
  validateField("title");
  validateField("name");
  validateField("gender");
  validateField("dob");
  validateField("email");
  validateField("password");
  validateField("confirmPassword");
  validateField("medicalCredentials");
  validateField("specialization");
  validateField("agreeTerms");
  validateField("agreeLicense");
  validateField("country");
  validateField("licenseNumber");
  const hasErrors = Object.values(dobErrors.value).some(
    (error) => error === true
  );

  if (
    !errors.value.title &&
    !errors.value.name &&
    !errors.value.gender &&
    !hasErrors &&
    !errors.value.email &&
    !errors.value.password &&
    !errors.value.confirmPassword &&
    !errors.value.medicalCredentials &&
    !errors.value.specialization &&
    !errors.value.agreeTerms &&
    !errors.value.agreeLicense &&
    !errors.value.country &&
    !errors.value.licenseNumber
  ) {
    isLoading.value = true;
    try {
      const payload = {
        Title: form.value.title,
        Name: form.value.name,
        Gender: form.value.gender,
        DateOfBirth: form.value.dob,
        Email: form.value.email,
        Password: form.value.password,
        ConfirmPassword: form.value.confirmPassword,
        MedicalCredentials: form.value.medicalCredentials,
        Specialization: form.value.specialization,
        TermsAndPrivacy: form.value.agreeTerms,
        LicenseAgreement: form.value.agreeLicense,
        CountryId: form.value.country,
        LicenseNumber: form.value.licenseNumber,
      };

      const result = await signUpUser(payload);

      if (result.success) {
        successMessage.value =
          "Your account has been successfully created. Please sign in to continue.";
        router.push("/login");
      } else {
        toast.error(result.message || "An error occurred. Please try again.", {
          duration: 5000,
        });
      }
    } catch (error) {
      toast.error(
        "There was an error submitting the form. Please try again later.",
        {
          duration: 5000,
        }
      );
    } finally {
      isLoading.value = false;
    }
  }
};

const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fetchLicenseRegex = async (countryId: string) => {
  const result = await getLicenseRegexPattern(countryId);

  regexPattern.value = result.pattern;

  if (!result.pattern && result.message) {
    // Optionally handle error message
    console.warn(result.message);
  }
};

const onLicenseBlur = async () => {
  licenseNumberTouched.value = true;
  validateField("licenseNumber");

  if (errors.value.licenseNumber === "") {
    const result = await checkDuplicateLicense(form.value.licenseNumber);

    if (result.isDuplicate) {
      errors.value.licenseNumber = "License number already exists.";
    }
  }
};

const result = await getInitialData();

if (!result.success) {
  toast.error(result.message || "An error occurred. Please try again.", {
    duration: 5000,
  });
} else {
  countryOptions.value = result.countries;
  titleOptions.value = result.titles;
  genderOptions.value = result.gender;
  medicalCredentialsOptions.value = result.medicalCredentials;
}

const toggleConfirmpasswordVisibleVisibility = () => {
  ConfirmpasswordVisible.value = !ConfirmpasswordVisible.value;
};

const checkConfirmPasswordInput = () => {
  isConfirmPasswordInputActive.value =
    form.value.confirmPassword.trim().length > 0;
};

const handleConfirmPasswordInput = () => {
  interactWithField("confirmPassword");
  checkConfirmPasswordInput();
  if (errors.value.confirmPassword) {
    errors.value.confirmPassword = "";
  }
};

const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value;
};
const showTooltip = () => {
  tooltipVisible.value = true;
};

const hideTooltip = () => {
  tooltipVisible.value = false;
};

const handleFocus = () => {
  interactWithField("password");
  showTooltip();
};

const handleBlur = () => {
  validateField("password");
  hideTooltip();
};

const trimEmail = () => {
  form.value.email = form.value.email.trim();
};

const handlePaste = () => {
  setTimeout(() => {
    form.value.email = form.value.email.trim();
  }, 0);
};

const emailFieldCheck = async () => {
  validateField("email");
  if (errors.value.email === "") {
    const result = await checkDuplicateEmail(form.value.email);
    if (result.isDuplicate) {
      errors.value.email =
        "This email is already existing. Please try with another.";
    } else {
      errors.value.email = "";
    }
  }
};

const validatePassword = () => {
  const pwd = form.value.password;
  isPasswordInputActive.value = form.value.password.trim().length > 0;
  passwordRules.value.isLengthValid = pwd.length >= 8;
  passwordRules.value.hasUpperCase = /[A-Z]/.test(pwd);
  passwordRules.value.hasLowerCase = /[a-z]/.test(pwd);
  passwordRules.value.hasDigit = /\d/.test(pwd);
  passwordRules.value.hasSpecialChar =
    /[!@#$%^&*(),.?":{}|<>_+\-=\\`~[\]'/;]/.test(pwd);

  if (interacted.value.password) {
    showTooltip();
  } else {
    hideTooltip();
  }
};

const isFormValid = computed(() => {
  return (
    form.value.title &&
    form.value.name &&
    form.value.gender &&
    form.value.dob &&
    form.value.email &&
    form.value.password &&
    form.value.confirmPassword &&
    form.value.medicalCredentials &&
    form.value.specialization &&
    form.value.agreeTerms &&
    form.value.agreeLicense &&
    form.value.country &&
    form.value.licenseNumber &&
    !errors.value.title &&
    !errors.value.name &&
    !errors.value.gender &&
    !errors.value.dob &&
    !errors.value.email &&
    !errors.value.password &&
    !errors.value.confirmPassword &&
    !errors.value.medicalCredentials &&
    !errors.value.specialization &&
    !errors.value.agreeTerms &&
    !errors.value.agreeLicense &&
    !errors.value.country &&
    !errors.value.licenseNumber
  );
});

watch(
  () => form.value.password,
  () => {
    validatePassword();
  }
);

watch(
  () => form.value.country,
  async (newCountryId) => {
    if (newCountryId) {
      await fetchLicenseRegex(newCountryId);
      if (regexPattern.value) {
        validateLicenseNumber(
          form.value.licenseNumber,
          licenseNumberTouched.value,
          regexPattern.value
        );
      }
    }
  }
);
</script>

<template>
  <div class="form-content">
    <h2 class="form-heading">Sign Up</h2>
    <form @submit.prevent="handleSignUp">
      <div class="input-group double-row">
        <div class="input-field">
          <label for="title">Title</label>
          <select
            class="dropdown-field"
            name="title"
            id="title"
            v-model.number="form.title"
            @focus="interactWithField('title')"
            @blur="validateField('title')"
            required
          >
            <option v-if="!interacted.title" value="" disabled>&nbsp;</option>
            <option
              v-for="option in titleOptions"
              :key="option.id"
              :value="option.id"
            >
              {{ option.title }}
            </option>
          </select>
          <span class="error">{{ errors.title }}</span>
        </div>
        <div class="input-field name-dob-field">
          <label for="name">Full Name</label>
          <input
            v-model="form.name"
            type="text"
            id="name"
            @focus="interactWithField('name')"
            @blur="validateField('name')"
            required
          />
          <span class="error">{{ errors.name }}</span>
        </div>
      </div>

      <div class="input-group double-row">
        <div class="input-field">
          <label for="gender">Gender</label>
          <select
            class="dropdown-field"
            name="gender"
            id="gender"
            v-model.number="form.gender"
            @focus="interactWithField('gender')"
            @blur="validateField('gender')"
            required
          >
            <option v-if="!interacted.title" value="" disabled>&nbsp;</option>
            <option
              v-for="option in genderOptions"
              :key="option.id"
              :value="option.id"
            >
              {{ option.gender }}
            </option>
          </select>
          <span class="error">{{ errors.gender }}</span>
        </div>
        <div class="input-field name-dob-field">
          <label for="dob">Date of Birth</label>
          <input
            type="date"
            name="dob"
            id="dob"
            v-model="form.dob"
            class="dob-picker"
            @focus="interactWithField('dob')"
            @blur="validateField('dob')"
            @input="validateField('dob')"
            :max="getCurrentDate()"
          />
          <span v-if="dobErrors.blankDob" class="error">
            Date of Birth cannot be left blank.
          </span>
          <span v-if="dobErrors.invalidDateFormat" class="error">
            Please enter a valid date.
          </span>
          <span v-if="dobErrors.invalidAge" class="error">
            The age must be above 18 years.
          </span>
          <span v-if="dobErrors.futureDate" class="error">
            Date of birth cannot be a future date.
          </span>
        </div>
      </div>

      <div class="input-group double-row">
        <div class="input-field">
          <label for="country">Country</label>
          <select
            class="dropdown-field"
            name="country"
            id="country"
            v-model.number="form.country"
            @focus="interactWithField('country')"
            @blur="validateField('country')"
            required
          >
            <option v-if="!interacted.title" value="" disabled>&nbsp;</option>
            <option
              v-for="option in countryOptions"
              :key="option.countryId"
              :value="option.countryId"
            >
              {{ option.countryName }}
            </option>
          </select>
          <span class="error">{{ errors.country }}</span>
        </div>
        <div class="input-field name-dob-field">
          <label for="licenseNumber">License Number</label>
          <input
            v-model="form.licenseNumber"
            type="text"
            id="licenseNumber"
            :disabled="!form.country"
            @input="form.licenseNumber = form.licenseNumber.toUpperCase()"
            @focus="interactWithField('licenseNumber')"
            @blur="onLicenseBlur"
            required
          />
          <span class="error">{{ errors.licenseNumber }}</span>
        </div>
      </div>

      <div class="input-group">
        <label for="email">Email</label>
        <input
          v-model="form.email"
          type="text"
          id="email"
          @paste="handlePaste"
          @input="trimEmail"
          @focus="interactWithField('email')"
          @blur="emailFieldCheck"
          required
        />
        <span v-if="errors.email" class="error">{{ errors.email }}</span>
      </div>

      <div class="input-group password-group">
        <label for="password">Password</label>
        <div class="password-wrapper">
          <input
            v-model="form.password"
            :type="passwordVisible ? 'text' : 'password'"
            id="password"
            @focus="handleFocus()"
            @blur="handleBlur()"
            @input="validatePassword()"
            autocomplete="new-password"
            required
          />
          <button
            v-if="isPasswordInputActive"
            type="button"
            @click="togglePasswordVisibility"
          >
            <span v-if="passwordVisible"><i class="pi pi-eye-slash"></i></span>
            <span v-else><i class="pi pi-eye"></i></span>
          </button>
          <div class="message-tooltip" v-if="tooltipVisible">
            <div class="message-content">
              <p>Password must include:</p>
              <ul>
                <li :class="{ valid: passwordRules.isLengthValid }">
                  <i
                    :class="{
                      'pi pi-check': passwordRules.isLengthValid,
                      'pi pi-times': !passwordRules.isLengthValid,
                    }"
                  ></i>
                  At least 8 characters
                </li>
                <li :class="{ valid: passwordRules.hasUpperCase }">
                  <i
                    :class="{
                      'pi pi-check': passwordRules.hasUpperCase,
                      'pi pi-times': !passwordRules.hasUpperCase,
                    }"
                  ></i>
                  One uppercase letter
                </li>
                <li :class="{ valid: passwordRules.hasLowerCase }">
                  <i
                    :class="{
                      'pi pi-check': passwordRules.hasLowerCase,
                      'pi pi-times': !passwordRules.hasLowerCase,
                    }"
                  ></i>
                  One lowercase letter
                </li>
                <li :class="{ valid: passwordRules.hasDigit }">
                  <i
                    :class="{
                      'pi pi-check': passwordRules.hasDigit,
                      'pi pi-times': !passwordRules.hasDigit,
                    }"
                  ></i>
                  One digit
                </li>
                <li :class="{ valid: passwordRules.hasSpecialChar }">
                  <i
                    :class="{
                      'pi pi-check': passwordRules.hasSpecialChar,
                      'pi pi-times': !passwordRules.hasSpecialChar,
                    }"
                  ></i>
                  One special character
                </li>
              </ul>
            </div>
            <div class="message-arrow"></div>
          </div>
        </div>
        <span v-if="errors.password" class="error">{{ errors.password }}</span>
      </div>

      <div class="input-group">
        <label for="confirmPassword">Confirm Password</label>
        <div class="password-wrapper">
          <input
            v-model="form.confirmPassword"
            :type="ConfirmpasswordVisible ? 'text' : 'password'"
            id="confirmPassword"
            @focus="interactWithField('confirmPassword')"
            @blur="validateField('confirmPassword')"
            @input="handleConfirmPasswordInput()"
            autocomplete="off"
            required
          />

          <button
            v-if="isConfirmPasswordInputActive"
            type="button"
            @click="toggleConfirmpasswordVisibleVisibility"
          >
            <span v-if="ConfirmpasswordVisible"
              ><i class="pi pi-eye-slash"></i
            ></span>
            <span v-else><i class="pi pi-eye"></i></span>
          </button>
        </div>
        <span v-if="errors.confirmPassword" class="error">{{
          errors.confirmPassword
        }}</span>
      </div>

      <div class="input-group">
        <label for="medicalCredentials">Medical Credentials</label>
        <select
          class="medCred-field"
          name="medicalCredentials"
          id="medicalCredentials"
          v-model.number="form.medicalCredentials"
          @focus="interactWithField('medicalCredentials')"
          @blur="validateField('medicalCredentials')"
          required
        >
          <option v-if="!interacted.title" value="" disabled>&nbsp;</option>
          <option
            v-for="option in medicalCredentialsOptions"
            :key="option.id"
            :value="option.id"
          >
            {{ option.medicalCredentials }}
          </option>
        </select>
        <span v-if="errors.medicalCredentials" class="error">{{
          errors.medicalCredentials
        }}</span>
      </div>

      <div class="input-group">
        <label for="specialization">Specialization</label>
        <input
          v-model="form.specialization"
          type="text"
          id="specialization"
          @focus="interactWithField('specialization')"
          @blur="validateField('specialization')"
          required
        />
        <span v-if="errors.specialization" class="error">{{
          errors.specialization
        }}</span>
      </div>

      <div class="terms-privacy">
        <input
          type="checkbox"
          id="agreeTerms"
          v-model="form.agreeTerms"
          @focus="interactWithField('agreeTerms')"
          @change="validateField('agreeTerms')"
          required
        />
        <label for="agreeTerms" class="terms-privacy-license">
          I agree to the
          <a :href="`${websiteUrl}/terms-and-conditions`" target="_blank"
            >Terms & Conditions, </a
          >
          <a :href="`${websiteUrl}/wp-content/uploads/2025/10/MediNoteX-AI-MASTER-AGREEMENT-Subscription.pdf`" target="_blank">Governing Agreement</a>
              and
          <a :href="`${websiteUrl}/privacy-policy`" target="_blank">Privacy Policy</a>.
        </label>
      </div>
      <div class="terms-privacy">
        <input
          type="checkbox"
          id="agreeLicense"
          v-model="form.agreeLicense"
          @focus="interactWithField('agreeLicense')"
          @change="validateField('agreeLicense')"
          required
        />
        <label for="agreeLicense" class="terms-privacy-license">
          I agree to the
          <a :href="`${websiteUrl}/license-agreement`" target="_blank"
            >License Agreement</a
          >.
        </label>
      </div>
      <span v-if="errors.agreeTerms && errors.agreeLicense" class="error">
        {{ errors.agreeTerms }}
      </span>
      <span v-else-if="errors.agreeTerms" class="error">
        {{ errors.agreeTerms }}
      </span>
      <span v-else-if="errors.agreeLicense" class="error">
        {{ errors.agreeLicense }}
      </span>

      <button
        type="submit"
        class="signup-button"
        :disabled="!isFormValid || isLoading"
      >
        <span v-if="isLoading">
          <i class="pi pi-spinner pi-spin"></i> Creating...
        </span>
        <span v-else> Create Account </span>
      </button>
    </form>
  </div>
  <Toaster position="top-right" richColors />
</template>

<style scoped>
@import "~/assets/css/pages/signup.css";
</style>
