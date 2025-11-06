<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { getUserInfoPropertyFromCookie } from "@/composables/useCookieService";
import { useClinic } from "@/composables/useClinicInfoService";
import { validateFields, validateClinicEmail } from "@/utils/validators";
import { settingsUpdatedHook } from "@/composables/useSettingsUpdate";

const { getClinicDetailsAPI, updateClinicAPI } = useClinic();

const docIcon = ref<string | null>(null);
const iconImage = ref("");
const isDocIconError = ref(false);
const iconError = ref("");
const fileInput = ref(null);
const imagePreview = ref(null);
const userId = ref("");
const clinicId = ref<number | null>(null);
const success = ref(false);
const message = ref("");
const logo = ref("");

const form = ref({
  hospitalName: "",
  phoneNumber: "",
  email: "",
  address: "",
  websiteLink: "",
  countryCode: "+1",
  invalidPhone: false,
});

const errors = ref({
  hospitalName: "",
  phoneNumber: "",
  email: "",
  address: "",
});

type FieldKey = "hospitalName" | "phoneNumber" | "email" | "address";
type ErrorField = keyof typeof errors.value;

onBeforeUnmount(() => {
  if (imagePreview.value) {
    URL.revokeObjectURL(imagePreview.value);
  }
});

onMounted(() => {
  userId.value = getUserInfoPropertyFromCookie("userId") || "";
  getClinicDetails(userId.value);
});

const validateField = (field: FieldKey) => {
  if (field === "email") {
    const trimmedEmail = form.value.email.trim();
    form.value.email = trimmedEmail;
    errors.value.email = validateClinicEmail(form.value.email);
  } else {
    const trimmedValues: Record<Exclude<FieldKey, "email">, string> = {
      hospitalName: form.value.hospitalName.trim(),
      phoneNumber: form.value.phoneNumber.trim(),
      address: form.value.address.trim(),
    };
    form.value[field] = trimmedValues[field];
    errors.value[field] = validateFields(field, trimmedValues[field], {
      countryCode: form.value.countryCode,
    });
  }
};
const browseFile = () => {
  (document.querySelector(".hiddenFileInput") as HTMLElement)?.click();
};

const handleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  validateAndProcessFile(file);
  (event.target as HTMLInputElement).value = "";
};

const handleFileDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files?.[0];
  validateAndProcessFile(file);
};

const validateAndProcessFile = (file?: File) => {
  if (!file) return;

  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  if (fileExtension === "png" || fileExtension === "jpg") {
    const reader = new FileReader();
    reader.onload = (e) => {
      iconImage.value = e.target?.result as string;
      docIcon.value = iconImage.value;
      isDocIconError.value = false;
      iconError.value = "";
    };
    reader.readAsDataURL(file);
  } else {
    iconError.value = "Please upload a valid file format";
    isDocIconError.value = true;
    setTimeout(() => {
      isDocIconError.value = false;
      iconError.value = "";
    }, 3000);
  }
};

const deleteLogoImage = () => {
  iconImage.value = "";
  docIcon.value = "";
};
const clearError = (field: ErrorField) => {
  errors.value[field] = "";
};

const handleSave = async () => {
  (["hospitalName", "phoneNumber", "address", "email"] as FieldKey[]).forEach(
    validateField
  );

  if (!docIcon.value) {
    iconError.value = "Please upload the Logo";
    isDocIconError.value = true;
    return;
  }
  const hasErrors = Object.values(errors.value).some((err) => err !== "");
  if (hasErrors) return;

  const payload = {
    ClinicId: clinicId.value,
    UserId: userId.value,
    ClinicName: form.value.hospitalName,
    ClinicAddress: form.value.address,
    PhoneNumber: form.value.phoneNumber,
    CountryCode: form.value.countryCode,
    Email: form.value.email ? form.value.email : null,
    Website: form.value.websiteLink,
    Logo: docIcon.value,
  };

  try {
    const response = await updateClinicAPI(payload);
    const isSuccess = response?.success;

    message.value = response.message || "";
    success.value = isSuccess;

    settingsUpdatedHook.trigger({
      success: isSuccess,
      message: isSuccess
        ? "Clinic information updated successfully."
        : "Clinic information update failed.",
    });
  } catch (err) {
    message.value = "An error occurred while updating the clinic information.";
    success.value = false;

    settingsUpdatedHook.trigger({
      success: false,
      message: message.value,
    });
  }
};

const getClinicDetails = async (userId: string) => {
  try {
    const response = await getClinicDetailsAPI(userId);

    if (!response || !response.success) {
      console.error("Failed to fetch clinic details.");
      return;
    }

    clinicId.value = response.data.clinicId || null;
    form.value.hospitalName = response.data.clinicName || "";
    form.value.address = response.data.clinicAddress || "";
    form.value.phoneNumber = response.data.phoneNumber || "";
    form.value.countryCode = response.data.countryCode || "";
    form.value.email = response.data.email || "";
    form.value.websiteLink = response.data.website || "";

    let imageType = "png";
    if (response.data.logo) {
      if (response.data.logo.startsWith("/9j")) imageType = "jpeg";
      logo.value = `data:image/${imageType};base64,${response.data.logo}`;
      iconImage.value = logo.value;
      docIcon.value = logo.value;
    } else {
      iconImage.value = "";
      docIcon.value = "";
    }
  } catch (err) {
    console.error("An error occurred while fetching user data.");
  }
};

const cancelForm = () => {
  errors.value.hospitalName = "";
  errors.value.phoneNumber = "";
  errors.value.address = "";
  isDocIconError.value = false;
  iconError.value = "";
  getClinicDetails(userId.value);
};

</script>

<template>
  <div class="form-container">
    <h2>Hospital/Clinic Information</h2>
    <form @submit.prevent="handleSave">
      <div class="form-left">
        <div class="form-group">
          <label for="hospitalName"
            >Hospital/Clinic Name<span class="required">*</span></label
          >
          <input
            type="text"
            v-model="form.hospitalName"
            id="hospitalName"
            @blur="validateField('hospitalName')"
            @input="clearError('hospitalName')"
          />
          <span class="error">{{ errors.hospitalName }}</span>
        </div>

        <div class="form-group">
          <label for="address">Address<span class="required">*</span></label>
          <textarea
            placeholder="Enter address"
            v-model="form.address"
            id="address"
            maxlength="200"
            @blur="validateField('address')"
            @input="clearError('address')"
          />
          <span class="error">{{ errors.address }}</span>
          <span class="char-count">{{ form.address.length }}/200</span>
        </div>

        <div class="form-group">
          <label for="phoneNumber"
            >Phone Number<span class="required">*</span></label
          >
          <div class="phone-container">
            <select
              v-model="form.countryCode"
              class="input-group input country-code"
              :class="{ error: form.invalidPhone }"
              @blur="validateField('phoneNumber')"
            >
              <option value="+1">+1 (US)</option>
              <option value="+44">+44 (UK)</option>
              <option value="+91">+91 (IND)</option>
              <option value="+971">+971 (UAE)</option>
            </select>
            <div class="phone-form">
              <input
                class="input-phone-number"
                type="text"
                v-model="form.phoneNumber"
                id="phoneNumber"
                @blur="validateField('phoneNumber')"
                @input="clearError('phoneNumber')"
              />
              <span class="error">{{ errors.phoneNumber }}</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="email"
            >Email <span class="optional">(Optional)</span></label
          >
          <input
            type="text"
            v-model="form.email"
            id="email"
            @blur="validateField('email')"
            @input="clearError('email')"
          />
          <span class="error">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="websiteLink"
            >Website Link <span class="optional">(Optional)</span></label
          >
          <input type="text" v-model="form.websiteLink" id="websiteLink" />
          <small
            >Please enter full path e.g., http:// or https:// before the URL, or
            the UNC path.</small
          >
        </div>
      </div>

      <div class="form-right">
        <label for="iconImage"
          >Hospital/Clinic Logo<span class="required">*</span></label
        >
        <diV v-if="iconImage" class="delete-icon" @click="deleteLogoImage">
          <img
            src="@/assets/settings/image-close-icon.svg"
            alt="Delete Icon"
            class="trashIcon"
          />
        </diV>
        <div>
          <div
            class="upload-box"
            @dragover.prevent
            @dragenter.prevent
            @drop.prevent="handleFileDrop"
          >
            <input
              type="file"
              ref="fileInput"
              class="hiddenFileInput"
              accept="image/jpeg, image/png"
              @change="handleFileSelect"
            />

            <div class="upload-icon" v-if="!iconImage">
              <img src="@/assets/settings/Upload-icon.svg" alt="Upload Icon" />
            </div>
            <div class="dragAndDrop" v-if="!iconImage">
              Drag & drop files or
              <span class="browseText" @click="browseFile">Browse</span>
            </div>
            <div class="supportedText" v-if="!iconImage">
              Supported formates: JPEG, PNG
            </div>
            <div v-if="iconImage" class="imagePreview">
              <img
                :src="iconImage"
                alt="Uploaded Signature Preview"
                class="previewImage"
              />
            </div>
          </div>
          <span class="error-image-upload" v-if="isDocIconError">{{
            iconError
          }}</span>
        </div>
      </div>

      <div class="button-group">
        <button type="button" class="cancel-btn" @click="cancelForm">
          Cancel
        </button>
        <button type="submit" class="save-btn">Save</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
@import "@/assets/css/components/settings/clinic-info.css";
</style>
