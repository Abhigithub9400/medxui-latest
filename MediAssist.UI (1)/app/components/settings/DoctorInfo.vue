<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getUserInfoPropertyFromCookie } from "@/composables/useCookieService";
import { useDoctorInfo } from "@/composables/useDoctorInfoService";
import { validateSpecializationInput, validateFieldsDoctorInfo } from "@/utils/validators";
import { settingsUpdatedHook } from "@/composables/useSettingsUpdate";

const { getDoctorDetailsAPI, updateDoctorInfoAPI } = useDoctorInfo();

const userId = ref("");
const fullName = ref("");
const medCred = ref("");
const specialization = ref("");
const message = ref("");
const success = ref(false);
const docSign = ref<string | null>(null);
const signImage = ref("");
const signature = ref("");
const isDocSignError = ref(false);
const signatureError = ref("");
const errors = ref<{ [key: string]: string }>({});

onMounted(() => {
  userId.value = getUserInfoPropertyFromCookie("userId") || "";
  getDocterDetails(userId.value);
});

const getDocterDetails = async (userId: string) => {
  try {
    const response = await getDoctorDetailsAPI(userId);

    if (!response || !response.success) {
      console.error("Failed to fetch doctor details.");
      return;
    }

    fullName.value = response.data.fullName || "";
    medCred.value = response.data.medicalCredentials || "";
    specialization.value = response.data.specialization || "";

    let imageType = "png";
    if (response.data.signature) {
      if (response.data.signature.startsWith("/9j")) imageType = "jpeg";
      signature.value = `data:image/${imageType};base64,${response.data.signature}`;
      signImage.value = signature.value;
      docSign.value = signature.value;
    } else {
      signImage.value = "";
      docSign.value = "";
    }
  } catch (err) {
    console.log("An error occurred while fetching user data.");
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
      signImage.value = e.target?.result as string;
      docSign.value = signImage.value;
      isDocSignError.value = false;
      signatureError.value = "";
    };
    reader.readAsDataURL(file);
  } else {
    signatureError.value = "Please upload a valid file format";
    isDocSignError.value = true;
    setTimeout(() => {
      isDocSignError.value = false;
      signatureError.value = "";
    }, 3000);
  }
};

const deleteSignImage = () => {
  signImage.value = "";
  docSign.value = "";
};

const cancelDocUpdateAction = () => {
  errors.value.medCred = "";
  errors.value.specialization = "";
  signatureError.value = "";
  isDocSignError.value = false;
  getDocterDetails(userId.value);
};

const validateSpecialization = (event: Event) => {
  const input = (event.target as HTMLInputElement).value.trim();
  const sanitized = validateSpecializationInput(input);
  specialization.value = sanitized.trim();
  (event.target as HTMLInputElement).value = sanitized.trim();
};

const validateField = (field: string) => {
  errors.value[field] = "";
  const validationErrors = validateFieldsDoctorInfo({
    medCred: medCred.value,
    specialization: specialization.value,
  });
  if (validationErrors[field]) {
    errors.value[field] = validationErrors[field];
  }
};
const handleSave = async () => {
  validateField("medCred");
  validateField("specialization");

  if (!docSign.value) {
    signatureError.value = "Please upload your signature";
    isDocSignError.value = true;
    return;
  }

  const hasErrors = Object.values(errors.value).some((error) => error !== "");
  if (hasErrors) {
    return;
  }
  const payload = {
    Signature: docSign.value,
    MedicalCredentials: medCred.value,
    Specialization: specialization.value,
    UserId: userId.value,
  };
  try {
    const response = await updateDoctorInfoAPI(payload);
    const isSuccess = response?.success;

    success.value = isSuccess;
    message.value = response?.message || "";
    
    if (isSuccess) {
        const specializationCookie = useCookie("specialization", {
        path: "/",
        secure: true,
        sameSite: "strict"
      });
      specializationCookie.value = specialization.value;

      settingsUpdatedHook.trigger({
        success: true,
        message: "Doctor's information updated successfully.",
        specialization: specialization.value,
      });
    } else {
      settingsUpdatedHook.trigger({
        success: false,
        message: "Doctor's information update failed.",
      });
    }
  } catch (error) {
    message.value =
      "An error occurred while updating the doctor's information.";
    success.value = false;

    settingsUpdatedHook.trigger({
      success: false,
      message: message.value,
    });
  }
};
</script>

<template>
  <div class="container">
    <form @submit.prevent="handleSave">
      <div class="docInfo-container">
        <div class="docInfo-title">Doctor's Information</div>
        <div class="fieldTexts">
          Signature<span class="mandatorySymbol">*</span>
        </div>
        <diV v-if="signImage" class="delete-icon" @click="deleteSignImage">
          <img
            src="@/assets/settings/image-close-icon.svg"
            alt="Delete Icon"
            class="trashIcon"
          />
        </diV>
        <div>
          <div
            class="signatureBox"
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

            <div class="uploadIcon" v-if="!signImage">
              <img src="@/assets/settings/Upload-icon.svg" alt="Upload Icon" />
            </div>
            <div class="dragAndDrop" v-if="!signImage">
              Drag & drop files or
              <span class="browseText" @click="browseFile">Browse</span>
            </div>
            <div class="supportedText" v-if="!signImage">
              Supported formates: JPEG, PNG
            </div>
            <div v-if="signImage" class="imagePreview">
              <img
                :src="signImage"
                alt="Uploaded Signature Preview"
                class="previewImage"
              />
            </div>
          </div>
          <span class="error-image-upload" v-if="isDocSignError">{{
            signatureError
          }}</span>
        </div>
        <div class="nameField">
          <div class="fieldTexts">
            <label for="fullName"
              >Full Name<span class="mandatorySymbol">*</span></label
            >
          </div>
          <div>
            <input
              type="text"
              name="fullName"
              id="fullName"
              v-model="fullName"
              class="inputTextBoxes"
              disabled
            />
          </div>
        </div>
        <div class="medicalCredSpecGroup">
          <div>
            <div class="fieldTexts">
              <label for="medCred"
                >Medical Credentials<span class="mandatorySymbol"
                  >*</span
                ></label
              >
            </div>
            <div>
              <select
                name="medCred"
                id="medCred"
                class="medCredDropDownBox"
                v-model.number="medCred"
                @blur="validateField('medCred')"
              >
                <option :value="1">MD (Doctor of Medicine)</option>
                <option :value="2">
                  MBBS (Bachelor of Medicine, Bachelor of Surgery)
                </option>
                <option :value="3">DO (Doctor of Osteopathic Medicine)</option>
                <option :value="4">BDS (Bachelor of Dental Surgery)</option>
                <option :value="5">MCh (Master of Surgery)</option>
                <option :value="6">DM (Doctorate of Medicine)</option>
                <option :value="7">
                  FRCS (Fellowship of the Royal College of Surgeons)
                </option>
                <option :value="8">
                  FACP (Fellow of the American College of Physicians)
                </option>
                <option :value="9">MS (Master of Surgery)</option>
                <option :value="10">DNB (Diplomate of National Board)</option>
              </select>
            </div>
            <span v-if="errors.medCred" class="error">
              {{ errors.medCred }}
            </span>
          </div>
          <div>
            <div class="fieldTexts">
              <label for="specialization"
                >Specialization<span class="mandatorySymbol">*</span></label
              >
            </div>
            <div>
              <input
                type="text"
                name="specialization"
                id="specialization"
                v-model="specialization"
                @blur="validateField('specialization')"
                @input="validateSpecialization"
                class="inputTextBoxes"
              />
            </div>
            <span v-if="errors.specialization" class="error">
              {{ errors.specialization }}
            </span>
          </div>
        </div>
      </div>

      <div class="btnSession">
        <button type="button" @click="cancelDocUpdateAction" class="cancel-btn">
          Cancel
        </button>
        <button type="submit" class="save-btn">Save</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
@import "@/assets/css/components/settings/doctor-info.css";
</style>
