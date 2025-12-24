<script setup lang="ts">
  definePageMeta({
  layout: "panel",
});
import { useProfileService } from "~/composables/useProfileService";
import { Toaster, toast } from "vue-sonner";
import DeleteAccountAlert from "@/components/alerts/ConfirmationAlert.vue";
import { useRouter } from "vue-router";
import { useLogout } from "~/composables/useProfileDropdownService";
import { getUserInfoPropertyFromCookie } from "@/composables/useCookieService";
import PageLoader from "@/components/common/PageLoader.vue";
import {
  validateTitle,
  validateMedicalCredentials,
  validateSpecialization,
  validateGender,
  validateDob,
} from "~/utils/validators";

useHead({
  title: "MediNoteX Profile – Manage Your Account Details",
  meta: [
    {
      name: "description",
      content:
        "Update your personal information, credentials, and contact details to keep your MediNoteX profile accurate and secure.",
    },
  ],
});

const { logout } = useLogout();
const { updateProfile, getProfile, deleteAccount, isLoading, error } =
  useProfileService();
const formData = ref({
  title: 0,
  fullName: "",
  email: "",
  gender: 0,
  dob: "",
  medCred: 0,
  specialization: "",
  licRegNo: "",
});
const router = useRouter();
const showToast = ref(false);
const profileUpload = ref(false);
const profileUploadMessage = ref("");
const message = ref("");
const success = ref(false);
const image = ref("");
const profileImage = ref<string | null>(null);
const userId = ref("");
const isProfileImageError = ref(false);
const profileImageErrorMessage = ref("");
const showDeletePopup = ref(false);
const menuOpen = ref(false);

const errors = ref({
  title: "",
  medCred: "",
  specialization: "",
  gender: "",
});
const dobErrors = ref({
  invalidDateFormat: false,
  invalidAge: false,
  futureDate: false,
  blankDob: false,
});

useHead({
  title: "MediNoteX Profile – Manage Your Account Details",
  meta: [
    {
      name: "description",
      content:
        "Update your personal information, credentials, and contact details to keep your MediNoteX profile accurate and secure.",
    },
  ],
});

const handleSave = async () => {
  validateField("title");
  validateField("medCred");
  validateField("specialization");
  validateField("gender");
  validateField("dob");
  const hasErrors =
    Object.values(errors.value).some((error) => error !== "") ||
    Object.values(dobErrors.value).some((error) => error === true);
  if (hasErrors) {
    return;
  }
  const imageDataUrlForApi = profileImage.value ?? "";

  const payload = {
    Title: formData.value.title,
    Gender: formData.value.gender,
    Dob: formData.value.dob ? new Date(formData.value.dob) : null,
    Image: imageDataUrlForApi,
    MedicalCredentials: formData.value.medCred,
    Specialization: formData.value.specialization,
    UserId: userId.value,
  };
  try {
    const result = await updateProfile(payload);

    if (result.success) {
      document.cookie = `title=${encodeURIComponent(
        formData.value.title
      )}; path=/; Secure; SameSite=Strict`;
      document.cookie = `specialization=${encodeURIComponent(
        formData.value.specialization
      )}; path=/; Secure; SameSite=Strict`;

      if (profileImage.value) {
        const imageBase64 = profileImage.value.includes(",")
          ? profileImage.value.split(",")[1]
          : profileImage.value;
        try {
          localStorage.setItem("image", imageBase64);
          window.dispatchEvent(
            new CustomEvent("image-updated", { detail: { image: imageBase64 } })
          );
        } catch {}
      }

      window.dispatchEvent(new Event("profile-updated"));

      toast.success(result.message || "Profile updated successfully!", {
        duration: 5000,
      });
    } else {
      toast.error(
        result.message || "An error occurred while updating the profile.",
        {
          duration: 5000,
        }
      );
    }
  } catch (error) {
    toast.error(
      "An error occurred while updating the profile. Please try again later.",
      {
        duration: 5000,
      }
    );
  }
};

const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const onImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const maxSizeInBytes = 1 * 1024 * 1024;
    const allowed = ["png", "jpg", "jpeg"];
    if (!allowed.includes(fileExtension || "")) {
      isProfileImageError.value = true;
      profileImageErrorMessage.value = "Please upload a PNG or JPG image.";
      setTimeout(() => {
        isProfileImageError.value = false;
      }, 3000);
      return;
    }
    if (file.size > maxSizeInBytes) {
      isProfileImageError.value = true;
      profileImageErrorMessage.value =
        "File size should be ≤ 1 MB.";
      setTimeout(() => {
        isProfileImageError.value = false;
      }, 3000);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      profileImage.value = (e.target as FileReader).result as string;
      profileUploadMessage.value = "Profile updated successfully.";
      isProfileImageError.value = false;
      profileUpload.value = true;
    };
    reader.readAsDataURL(file);
  }
};

const deleteProfileAction = () => {
  showDeletePopup.value = true;
};

const cancelProfileAction = async () => {
  await getDoctorDetails(userId.value);
};

const confirmDeleteAccount = () => {
  deleteUserAccount(userId.value);
};

const cancelDeleteAccount = () => {
  showDeletePopup.value = false;
};

const deleteUserAccount = async (userId: string) => {
  localStorage.setItem("accountDeleted", Date.now().toString());

  try {
    const response = await deleteAccount(userId);

    if (response.success) {
      await logout(); 
      // Save flags AFTER clearing storage
      sessionStorage.clear();
      localStorage.clear();
      sessionStorage.setItem("showDeleteSuccessPopup", "true");
      localStorage.setItem("userLogOut", Date.now().toString());

      await redirectAndLockToRoot();
    } else {
      handleDeleteFailure();
    }
  } catch (err) {
    handleDeleteFailure();
  }
};

const handleDeleteFailure = () => {
  showDeletePopup.value = false;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 5000);
  success.value = false;
  message.value = "An error occurred. Please try again.";
};

function redirectAndLockToRoot() {
  router.replace("/");
  history.replaceState(null, "", "/");
  history.pushState(null, "", "/");

  window.onpopstate = function () {
    history.pushState(null, "", "/");
  };
}

const handleClickOutside = (event: MouseEvent) => {
  const menu = document.querySelector(".user-profile");
  const userIcon = document.querySelector(".doctor-icon");
  if (
    menu &&
    !menu.contains(event.target as Node) &&
    !userIcon?.contains(event.target as Node)
  ) {
    menuOpen.value = false;
  }
};


onMounted(async () => {
  userId.value = getUserInfoPropertyFromCookie("userId") ?? "";
  getDoctorDetails(userId.value);
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("delete-account", (event) => {
    const customEvent = event as CustomEvent<{ key: string }>;
    if (customEvent.detail.key === "userLogOut") {
      redirectAndLockToRoot();
    }
  });
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const getDoctorDetails = async (userId: string) => {
  isLoading.value = true;

  try {
    const result = await getProfile(userId);
    if (result.success && result.data) {
      isLoading.value = false;
      const data = result.data;
      let imageType = "png";
      if (data.image != null) {
        if (data.image.startsWith("/9j")) {
          imageType = "jpeg";
        }
        profileImage.value = `data:image/${imageType};base64,${data.image}`;
      } else {
        profileImage.value = "";
      }

      formData.value.title = data.title;
      formData.value.fullName = data.fullName;
      formData.value.email = data.email;
      formData.value.gender = data.gender;
      formData.value.dob = data.dob
        ? new Date(data.dob).toLocaleDateString("en-CA")
        : "";
      formData.value.medCred = data.medicalCredentials;
      formData.value.specialization = data.specialization;
      formData.value.licRegNo = data.licenseNumber;
    } else {
      error.value = result.message || "Failed to fetch profile details.";
    }
  } catch (err) {
    error.value =
      "An error occurred while fetching the profile. Please try again later.";
  } finally {
    isLoading.value = false;
  }
};

const validateField = (field: string) => {
  switch (field) {
    case "title":
      errors.value.title = validateTitle(formData.value.title.toString());
      break;

    case "medCred":
      errors.value.medCred = validateMedicalCredentials(
        formData.value.medCred.toString()
      );
      break;

    case "specialization":
      formData.value.specialization =
        formData.value.specialization.trim() || "";
      errors.value.specialization = validateSpecialization(
        formData.value.specialization
      );
      break;

    case "gender":
      errors.value.gender = validateGender(formData.value.gender.toString());
      break;

    case "dob":
      dobErrors.value = validateDob(formData.value.dob);
      break;
  }
};
</script>
<template>
  <div class="profile-management">
    <div class="my-profile-title">
      <h2>My Profile</h2>
    </div>
    <div class="profile-container">
      <div class="profile-card">
        <div class="profile-top"></div>
        <div class="profile-info"></div>
        <div class="profile-content">
          <img
            v-if="profileImage"
            :src="profileImage"
            alt="Profile"
            class="profile-image"
          />
          <div v-else class="placeholder-image"></div>
          <input
            id="profile-file"
            type="file"
            @change="onImageUpload"
            accept="image/png, image/jpeg"
            style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;"
          />
          <label class="edit-icon" for="profile-file" title="Change profile picture" aria-label="Change profile picture">
            <i class="edit">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M10.0738 2.19738C11.2928 0.978315 13.2693 0.978315 14.4884 2.19738C15.7074 3.41644 15.7074 5.39294 14.4884 6.612L8.16485 12.9355C7.80357 13.2968 7.5909 13.5095 7.3543 13.6941C7.07544 13.9116 6.7737 14.0981 6.45444 14.2502C6.18358 14.3793 5.89823 14.4744 5.41349 14.636L3.19274 15.3762L2.65802 15.5545C2.22432 15.699 1.74615 15.5861 1.42288 15.2629C1.09962 14.9396 0.986737 14.4614 1.13131 14.0277L2.04979 11.2723C2.21135 10.7875 2.30646 10.5022 2.43555 10.2313C2.5877 9.91206 2.77418 9.61033 2.99169 9.33146C3.17623 9.09486 3.38893 8.88218 3.75025 8.52089L10.0738 2.19738ZM3.16968 14.3298L5.06402 13.6984C5.59143 13.5226 5.81552 13.447 6.02422 13.3475C6.27792 13.2266 6.51768 13.0784 6.73928 12.9056C6.92158 12.7634 7.08942 12.5968 7.48253 12.2036L12.5288 7.15732C12.0031 6.97189 11.3258 6.62817 10.6917 5.99409C10.0576 5.36 9.71387 4.68267 9.52844 4.15691L4.48212 9.20323C4.08901 9.59634 3.92239 9.76418 3.7802 9.94648C3.60736 10.1681 3.45918 10.4078 3.33827 10.6615C3.23881 10.8702 3.1632 11.0943 2.9874 11.6217L2.35595 13.5161L3.16968 14.3298ZM10.3396 3.34578C10.3624 3.46242 10.4009 3.62098 10.4652 3.80633C10.61 4.22363 10.8835 4.77167 11.3988 5.28698C11.9141 5.80229 12.4621 6.07577 12.8794 6.22055C13.0648 6.28485 13.2233 6.32339 13.34 6.34619L13.7813 5.9049C14.6098 5.07636 14.6098 3.73303 13.7813 2.90449C12.9527 2.07595 11.6094 2.07595 10.7809 2.90449L10.3396 3.34578Z"
                  fill="#707070"
                />
              </svg>
            </i>
          </label>

          <h3 :title="formData.fullName">{{ formData.fullName }}</h3>
          <p :title="formData.email">{{ formData.email }}</p>
        </div>
        <span class="error-image-upload" v-if="isProfileImageError">
          {{ profileImageErrorMessage }}</span
        >
      </div>
      <div class="profile-form">
        <form class="form-container" @submit.prevent="handleSave">
          <div class="personal-details-container">
            <div class="pers-details-title">
              <h3>Personal Details</h3>
            </div>
            <div class="tit-and-fullName">
              <div class="form-group">
                <label for="title">Title</label>
                <select
                  name="title"
                  id="title"
                  v-model.number="formData.title"
                  @blur="validateField('title')"
                >
                  <option :value="1">Dr. (Doctor)</option>
                  <option :value="2">Consultant</option>
                  <option :value="3">Resident</option>
                  <option :value="4">Attending Physician</option>
                  <option :value="5">Senior Consultant</option>
                  <option :value="6">Chief Surgeon</option>
                  <option :value="7">Clinical Lead</option>
                </select>
                <span v-if="errors.title" class="error">{{
                  errors.title
                }}</span>
              </div>
              <div class="form-group">
                <label for="fullName">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  v-model="formData.fullName"
                  disabled
                />
              </div>
            </div>
            <div class="gen-and-dob">
              <div class="form-group">
                <label for="gender">Gender</label>
                <select
                  name="gender"
                  id="gender"
                  v-model.number="formData.gender"
                  @blur="validateField('gender')"
                >
                  <option :value="1">Male</option>
                  <option :value="2">Female</option>
                  <option :value="3">Transgender</option>
                  <option :value="4">Non-binary</option>
                  <option :value="5">Prefer Not to Say</option>
                </select>
                <span v-if="errors.gender" class="error">
                  {{ errors.gender }}
                </span>
              </div>
              <div class="form-group">
                <label for="dob">Date Of Birth</label>
                <input
                  type="date"
                  name="dob"
                  id="dob"
                  v-model="formData.dob"
                  class="dob-picker"
                  @blur="validateField('dob')"
                  @input="validateField('dob')"
                  :max="getCurrentDate()"
                />
                <span v-if="dobErrors.blankDob" class="error"
                  >Date of Birth cannot be left blank.</span
                >
                <span v-if="dobErrors.invalidDateFormat" class="error"
                  >Please enter a valid date in the format.</span
                >
                <span v-if="dobErrors.invalidAge" class="error"
                  >The age must be above 18 years.</span
                >
                <span v-if="dobErrors.futureDate" class="error"
                  >Date of birth cannot be a future date.</span
                >
              </div>
            </div>
          </div>
          <div class="prof-details-title">
            <h3>Professional Details</h3>
          </div>
          <div class="med-and-spec">
            <div class="form-group">
              <label for="lic-reg-no">License/Registration number</label>
              <input
                type="text"
                name=""
                id="lic-reg-no"
                v-model="formData.licRegNo"
                disabled
              />
            </div>
            <div class="form-group">
              <label for="medCred">Medical Credentials</label>
              <select
                name="medCred"
                id="medCred"
                v-model.number="formData.medCred"
                @blur="validateField('medCred')"
              >
                <option :value="1" class="try-Width">
                  MD (Doctor of Medicine)
                </option>
                <option :value="2" class="try-Width">
                  MBBS (Bachelor of Medicine, Bachelor of Surgery)
                </option>
                <option :value="3" class="try-Width">
                  DO (Doctor of Osteopathic Medicine)
                </option>
                <option :value="4" class="try-Width">
                  BDS (Bachelor of Dental Surgery)
                </option>
                <option :value="5" class="try-Width">
                  MCh (Master of Surgery)
                </option>
                <option :value="6" class="try-Width">
                  DM (Doctorate of Medicine)
                </option>
                <option :value="7" class="try-Width">
                  FRCS (Fellowship of the Royal College of Surgeons)
                </option>
                <option :value="8" class="try-Width">
                  FACP (Fellow of the American College of Physicians)
                </option>
                <option :value="9" class="try-Width">
                  MS (Master of Surgery)
                </option>
                <option :value="10" class="try-Width">
                  DNB (Diplomate of National Board)
                </option>
              </select>
              <span v-if="errors.medCred" class="error">
                {{ errors.medCred }}
              </span>
            </div>
            <div class="form-group">
              <label for="specialization">Specialization</label>
              <input
                type="text"
                name="specialization"
                id="specialization"
                v-model="formData.specialization"
                @blur="validateField('specialization')"
                @input="validateField('specialization')"
              />
              <span v-if="errors.specialization" class="error">
                {{ errors.specialization }}
              </span>
            </div>
          </div>
          <div class="button-group">
            <button
              type="button"
              @click="deleteProfileAction"
              class="delete-btn"
            >
              Delete Account
            </button>
            <div class="second-btn-grp">
              <button
                type="button"
                @click="cancelProfileAction"
                class="cancel-btn"
              >
                Cancel
              </button>
              <button type="submit" class="save-btn">Save</button>
            </div>
          </div>
        </form>
      </div>
    </div>
    <DeleteAccountAlert
      v-if="showDeletePopup"
      :isVisible="showDeletePopup"
      title="Confirm Account Deletion"
      message="Are you sure you want to delete your account? This action is irreversible, and all your data will be permanently removed."
      confirmText="Confirm"
      cancelText="Cancel"
      @confirm="confirmDeleteAccount"
      @cancel="cancelDeleteAccount"
    />
  </div>
  <Toaster position="top-right" richColors />
  <PageLoader 
      :visible="isLoading"
    />
</template>

<style scoped>
@import "~/assets/css/pages/profile.css";
</style>
