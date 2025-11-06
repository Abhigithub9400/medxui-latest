<script setup lang="ts">
definePageMeta({
  layout: "panel",
});

useHead({
  title: "MediNoteX Settings – Customize Your Medical Scribe Experience",
  meta: [
    {
      name: "description",
      content:
        "Manage your account preferences, system configurations to personalize your MediNoteX experience.",
    },
  ],
});
import { ref } from "vue";
import doctorInfoIcon from "@/assets/settings/doctorInfo.svg";
import hospitalInfoIcon from "@/assets/settings/hospitaInfo.svg";
import legalInfoIcon from "@/assets/settings/legalCompliance.svg";
import HospitalInformation from "@/components/settings/ClinicInfo.vue";
import DoctorInformation from "@/components/settings/DoctorInfo.vue";
import LegalCompliance from "@/components/settings/LegalCompliance.vue"
import { useEventListener } from "@vueuse/core";
import { settingsUpdatedHook } from "@/composables/useSettingsUpdate";
import { Toaster, toast } from "vue-sonner";

useHead({
  title: "MediNoteX Settings – Customize Your Medical Scribe Experience",
  meta: [
    {
      name: "description",
      content:
        "Manage your account preferences, system configurations to personalize your MediNoteX experience.",
    },
  ],
});

const menuOpen = ref(false);
const selectedOption = ref("hospital");

const selectOption = (option: string) => {
  selectedOption.value = option;
};

settingsUpdatedHook.on((data) => {
  if (data.success) {
    toast.success(data.message || "Settings updated successfully.", {
      duration: 4000,
    });
  } else {
    toast.error(data.message || "Something went wrong while updating.", {
      duration: 4000,
    });
  }
});

const handleClickOutside = (event: MouseEvent) => {
  const menu = document.querySelector(".user-profile");
  const userIcon = document.querySelector(".doctor-icon");
  if (
    menu &&
    !menu.contains(event.target as Node) &&
    userIcon &&
    !userIcon.contains(event.target as Node)
  ) {
    menuOpen.value = false;
  }
};

useEventListener(document, "click", handleClickOutside);
</script>

<template>
  <div class="parent-container">
    <div class="main-content">
      <div class="frame">
        <div class="frame-wrapper">
          <div class="div-wrapper">
            <div class="div">
              <div class="text-wrapper">Settings</div>
            </div>
          </div>
        </div>
      </div>
      <div class="panelframe">
        <div class="sidepanel">
          <div class="hospital">
            <a
              class="menu-item"
              @click="selectOption('hospital')"
              :class="{
                active: selectedOption === 'hospital',
                bold: selectedOption === 'hospital',
              }"
              style="pointer-events: auto"
            >
              <div class="menu-content">
                <i class="icon">
                  <img :src="hospitalInfoIcon" alt="Hospital Icon" />
                </i>
                <div class="hospital-info">Hospital/Clinic Information</div>
              </div>
              <div class="arrow" v-if="selectedOption === 'hospital'">
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
                    d="M6.08965 3.45437C6.29932 3.27465 6.61497 3.29893 6.79468 3.5086L10.7947 8.17526C10.9552 8.36251 10.9552 8.63881 10.7947 8.82606L6.79468 13.4927C6.61497 13.7024 6.29932 13.7267 6.08965 13.547C5.87999 13.3672 5.85571 13.0516 6.03542 12.8419L9.75651 8.50066L6.03542 4.15939C5.85571 3.94973 5.87999 3.63408 6.08965 3.45437Z"
                    fill="#707070"
                  />
                </svg>
              </div>
            </a>
          </div>
          <hr />
          <div class="doctor">
            <a
              class="menu-item"
              @click="selectOption('doctor')"
              :class="{
                active: selectedOption === 'doctor',
                bold: selectedOption === 'doctor',
              }"
            >
              <div class="menu-content">
                <i class="icon">
                  <img
                    :src="doctorInfoIcon"
                    alt="Doctor Icon"
                    class="doctor-info-icon"
                  />
                </i>
                <div class="doctor-info">Doctor's Information</div>
              </div>
              <div class="arrow" v-if="selectedOption === 'doctor'">
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
                    d="M6.08965 3.45437C6.29932 3.27465 6.61497 3.29893 6.79468 3.5086L10.7947 8.17526C10.9552 8.36251 10.9552 8.63881 10.7947 8.82606L6.79468 13.4927C6.61497 13.7024 6.29932 13.7267 6.08965 13.547C5.87999 13.3672 5.85571 13.0516 6.03542 12.8419L9.75651 8.50066L6.03542 4.15939C5.85571 3.94973 5.87999 3.63408 6.08965 3.45437Z"
                    fill="#707070"
                  />
                </svg>
              </div>
            </a>
          </div>
          <hr />
          <div class="legal">
            <a
              class="menu-item"
              @click="selectOption('legal')"
              :class="{
                active: selectedOption === 'legal',
                bold: selectedOption === 'legal',
              }"
            >
              <div class="menu-content">
                <i class="icon">
                  <img :src="legalInfoIcon" alt="Legal Icon" />
                </i>
                <div class="legal-info">Legal & Compliance Settings</div>
              </div>
              <div class="arrow" v-if="selectedOption === 'legal'">
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
                    d="M6.08965 3.45437C6.29932 3.27465 6.61497 3.29893 6.79468 3.5086L10.7947 8.17526C10.9552 8.36251 10.9552 8.63881 10.7947 8.82606L6.79468 13.4927C6.61497 13.7024 6.29932 13.7267 6.08965 13.547C5.87999 13.3672 5.85571 13.0516 6.03542 12.8419L9.75651 8.50066L6.03542 4.15939C5.85571 3.94973 5.87999 3.63408 6.08965 3.45437Z"
                    fill="#707070"
                  />
                </svg>
              </div>
            </a>
          </div>
        </div>
        <div class="content-panel">
          <HospitalInformation v-if="selectedOption === 'hospital'" />
          <DoctorInformation v-if="selectedOption === 'doctor'" />
          <LegalCompliance v-if="selectedOption === 'legal'" />
        </div>
      </div>
    </div>
  </div>
  <Toaster position="top-right" richColors />
</template>

<style scoped>
@import "~/assets/css/pages/settings.css";
</style>
