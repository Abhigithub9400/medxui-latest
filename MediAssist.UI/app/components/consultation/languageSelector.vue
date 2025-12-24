<script setup lang="ts">
import { ref, watch, defineEmits } from "vue";
import recognisationlanguageicon from "@/assets/consultation/language-selector.svg";
import { onClickOutside } from "@vueuse/core";

// Define language type
interface Language {
  label: string;
  code: string;
  model: string;
}

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

// Languages list
const languages: Language[] = [
  { label: "English", code: "en-US", model: "azure" },
  { label: "عربى", code: "ar-SA", model: "azure" },
  { label: "മലയാളം", code: "ml-IN", model: "azure" },
  { label: "हिन्दी", code: "hi-IN", model: "azure" },
  { label: "Français", code: "fr-FR", model: "azure" },
  { label: "Spanish", code: "es-ES", model: "azure" },
  { label: "नेपाली", code: "ne-NP", model: "azure" },
  { label: "Kiswahili", code: "sw-KE", model: "azure" },
];

const selectedLanguage = ref<Language>(languages[0] ?? { label: "", code: "" });

// Emit typed event
const emit =
  defineEmits<(e: "languageChange", code: string, model: string) => void>();

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const handleLanguageChange = (language: Language) => {
  emit("languageChange", language.code, language.model);
  isOpen.value = false;
};

onClickOutside(dropdownRef, () => {
  isOpen.value = false;
});

watch(selectedLanguage, () => {
  isOpen.value = false;
});
</script>

<template>
  <div class="language-dropdown" ref="dropdownRef">
    <button @click="toggleDropdown" class="dropdown-button">
      <img
        :src="recognisationlanguageicon"
        alt="language icon"
        class="language-icon"
      />
      <div class="selected-language-label">{{ selectedLanguage.label }}</div>
      <span class="arrow-icon">
        <svg
          v-if="isOpen"
          width="12"
          height="6"
          viewBox="0 0 12 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M11.8602 5.79046C11.6515 6.04206 11.2849 6.0712 11.0415 5.85554L6 1.39024L0.958532 5.85554C0.715054 6.0712 0.348493 6.04206 0.139797 5.79046C-0.0688992 5.53887 -0.0407019 5.16009 0.202777 4.94444L5.62212 0.144446C5.83957 -0.0481481 6.16043 -0.0481481 6.37788 0.144446L11.7972 4.94444C12.0407 5.16009 12.0689 5.53887 11.8602 5.79046Z"
            fill="#959595"
          />
        </svg>
        <svg
          v-else
          width="12"
          height="6"
          viewBox="0 0 16 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M0.186396 0.279381C0.464658 -0.0560792 0.953405 -0.0949283 1.27804 0.192609L8 6.14634L14.722 0.192609C15.0466 -0.0949277 15.5353 -0.0560785 15.8136 0.279382C16.0919 0.614842 16.0543 1.11988 15.7296 1.40742L8.50384 7.80741C8.21391 8.0642 7.78609 8.0642 7.49616 7.80741L0.270369 1.40742C-0.0542702 1.11988 -0.0918661 0.614841 0.186396 0.279381Z"
            fill="#959595"
          />
        </svg>
      </span>
    </button>
    <div v-if="isOpen" class="dropdown-menu">
      <div
        v-for="(language, index) in languages"
        :key="index"
        class="dropdown-item"
      >
        <input
          type="radio"
          :id="`lang-${index}`"
          :value="language"
          v-model="selectedLanguage"
          @change="handleLanguageChange(language)"
        />
        <label :for="`lang-${index}`">{{ language.label }}</label>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/components/consultation/language-selector.css";
</style>
