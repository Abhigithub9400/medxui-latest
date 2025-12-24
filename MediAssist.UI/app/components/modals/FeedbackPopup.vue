<script setup lang="ts" >
import { ref, defineProps, defineEmits, onMounted, onUnmounted, watch } from "vue";

const props = defineProps<{
  isVisible: boolean;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  options?: { id: number; label: string }[];
}>();

const defaultOptions = [
  { id: 1, label: "Usability" },
  { id: 2, label: "Performance" },
  { id: 3, label: "Features" },
  { id: 4, label: "Bugs" },
  { id: 5, label: "Other" }
];
const options = props.options ?? defaultOptions;

const emit = defineEmits<{
  (e: "confirm", payload: {
    rating: number;
    selectedItems: { id: number; label: string }[];
    description: string;
    suggestion: string;
    otherCategoryText: string;
  }): void;
  (e: "cancel"): void;
  (e: "setRating", value: number): void;
  (e: "update:selectedItems", value: { id: number; label: string }[]): void;
  (e: "text:otherCategoryText", value: string): void;
}>();

const rating = ref(0);
const isOpen = ref(false);
const selectedItems = ref<{ id: number; label: string }[]>([]);
const dropdownRef = ref<HTMLElement | null>(null);
const otherCategoryText = ref("");
const description = ref("");
const suggestion = ref("");
const errors = ref("");
const hasSubmitAttempt = ref(false);
const isOtherCategory = ref(false);

const validateIfSubmitted = () => {
  if (hasSubmitAttempt.value) validateForm();
};

watch([rating, selectedItems, description], validateIfSubmitted, { deep: true });

const validateForm = () => {
  const valid = {
    rating: rating.value !== 0,
    categories: selectedItems.value.length > 0,
    description: description.value.trim().length > 0
  };

  errors.value = !valid.rating || !valid.categories || !valid.description
    ? "Please complete all required fields before submitting."
    : "";

  return !errors.value;
};

const updateOtherCategory = () => {
  emit("update:selectedItems", selectedItems.value);
  validateIfSubmitted();
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const isSelected = (id: number): boolean => {
  return selectedItems.value.some(item => item.id === id);
};

const toggleItem = (option: { id: number; label: string }) => {
  isOtherCategory.value = option.id === 5;
  const index = selectedItems.value.findIndex(item => item.id === option.id);
  index === -1
    ? selectedItems.value.push(option)
    : selectedItems.value.splice(index, 1);
  validateIfSubmitted();
};

const removeItem = (id: number) => {
  selectedItems.value = selectedItems.value.filter(item => item.id !== id);
  if (id === 5) {
    otherCategoryText.value = "";
    isOtherCategory.value = false;
  }
  validateIfSubmitted();
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

const setRating = (value: number) => {
  rating.value = rating.value === value ? 0 : value;
  validateIfSubmitted();
  emit("setRating", rating.value);
};

const confirm = () => {
  hasSubmitAttempt.value = true;
  if (validateForm()) {
    emit("update:selectedItems", selectedItems.value);
    emit("text:otherCategoryText", otherCategoryText.value);
    emit("confirm", {
      rating: rating.value,
      selectedItems: selectedItems.value,
      description: description.value,
      suggestion: suggestion.value,
      otherCategoryText: otherCategoryText.value
    });
    rating.value = 0;
    selectedItems.value = [];
    description.value = "";
    suggestion.value = "";
    otherCategoryText.value = "";
    isOtherCategory.value = false;
    hasSubmitAttempt.value = false;
    errors.value = "";
  }
};

const cancel = () => {
  emit("cancel");
  rating.value = 0;
    selectedItems.value = [];
    description.value = "";
    suggestion.value = "";
    otherCategoryText.value = "";
    isOtherCategory.value = false;
    hasSubmitAttempt.value = false;
    errors.value = "";
};
</script>

<template>
    <div v-if="isVisible" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ props.title }}</h2>
          <button class="close-button" @click="cancel">
            <span>&times;</span>
          </button>
        </div>
        
        <div class="modal-body">
        <span v-if="hasSubmitAttempt && errors" class="error-message">{{
          errors
        }}</span>
          <div class="star-rating">
            <span aria-required="true"
              v-for="star in 5"
              :key="star"
              @click="setRating(star)"
              :class="{
                star: true,
              }"
            >
              <img
                v-if="rating >= star"
                src="@/assets/feedback/filledStar.svg"
                alt="Star Icon"
              />
              <img v-else src="@/assets/feedback/star.svg" alt="Unfilled Star Icon" />
            </span>
          </div>
  
          <div class="category">Feedback Categories <span class="required">*</span></div>
          <div class="dropdown-container" ref="dropdownRef">
            <!-- Selected items display -->
            <div class="selected-items" @click="toggleDropdown">
              <div v-if="selectedItems.length === 0" class="placeholder-wrapper">
                <span class="placeholder">Select</span>  
                <img class="arrow-down" src="@/assets/icons/alt-arrow-down.svg" alt="Arrow Down Icon" />
              </div>
              <div v-else class="selected-items-wrapper">
                <div
                  v-for="item in selectedItems"
                  :key="item.id"
                  class="selected-tag"
                  aria-required="true"
                >
                  <div class="frame">
                    <div class="text-wrapper">{{ item.label }}</div>
                    <button class="remove-button" @click="removeItem(item.id)">
                      <img
                        class="vector"
                        alt="Vector"
                        src="@/assets/icons/close-icon.svg"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="isOpen" class="dropdown-card">
              <div
                v-for="option in options"
                :key="option.id"
                class="dropdown-item"
                :class="{ selected: isSelected(option.id) }"
                @click="toggleItem(option)"
              >
                <span>{{ option.label }}</span>
                <span v-if="isSelected(option.id)" class="checkmark">
                  <img src="@/assets/feedback/tick-icon.svg" alt="Tick Icon" />
                </span>
              </div>
            </div>
          </div>
          <Transition name="fade">
            <div v-if="isOtherCategory" class="other-category-container">
              <input
                v-model="otherCategoryText"
                type="text"
                class="other-input"
                placeholder="Please specify"
                @input="updateOtherCategory"
              />
            </div>
          </Transition>
          <div class="description">Description of Issue<span class="required">*</span></div>
          <div class="textarea-container">
            <textarea
              v-model="description"
              maxlength="100"
              class="textarea"
              required
              @input="validateIfSubmitted"
            ></textarea>
            <small class="small-text">{{ description.length }}/100</small>
          </div>
          <div class="suggestion">Suggestions for Improvement</div>
          <div class="textarea-container">
            <textarea
              v-model="suggestion"
              maxlength="100"
              class="textarea"
            ></textarea>
            <small class="small-text">{{ suggestion.length }}/100</small>
          </div>
        </div>
        <div class="modal-footer">
          <div class="modal-buttons">
            <button @click="confirm" class="confirm-button">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
</template>

<style scoped>
@import "~/assets/css/components/modals/feedback-popup.css";
</style>