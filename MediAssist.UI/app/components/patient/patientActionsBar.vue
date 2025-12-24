<script setup lang="ts">
import { usePatientService } from "~/composables/usePatientService";
import type { Patient } from "~/types/interfaces/Patient";
import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";
import AddPatientModal from "~/components/modals/AddPatientModal.vue";
import { useRouter } from "vue-router";

const router = useRouter();
const containerRef = ref<HTMLElement | null>(null);
const errors = ref({
  name: "",
});
const suggestions = ref<Patient[]>([]);
const showSuggestions = ref(false);
const highlightedIndex = ref(-1);
const addNewClicked = ref(false);

const { patient, searchPatientsByUserName } = usePatientService();

const onInput = async () => {
  if (addNewClicked.value) {
    suggestions.value = [];
    showSuggestions.value = false;
    highlightedIndex.value = -1;
    return;
  }

  if (!patient.value.name || patient.value.name.trim() === "") {
    suggestions.value = [];
    showSuggestions.value = false;
    highlightedIndex.value = -1;
    return;
  }

  try {
    const result = await searchPatientsByUserName(patient.value.name);
    suggestions.value = result.slice(0, 4).map((item: any) => ({
      id: item.id,
      mrn: item.mrn,
      name: item.userName,
      email: item.email,
      gender: item.gender,
      dob: item.dob,
      age: item.age,
    }));
    showSuggestions.value = true;
    highlightedIndex.value = -1;
  } catch (e) {
    console.error("Search error", e);
  }
};

const onFocus = async () => {
  if (addNewClicked.value) {
    showSuggestions.value = false;
    return;
  }

  try {
    if (patient.value.name && patient.value.name.trim() !== "") {
      const result = await searchPatientsByUserName(patient.value.name);
      suggestions.value = result.slice(0, 4).map((item: any) => ({
        id: item.id,
        mrn: item.mrn,
        name: item.userName,
        email: item.email,
        gender: item.gender,
        dob: item.dob,
        age: item.age,
      }));
      showSuggestions.value = true;
    } else {
      suggestions.value = [];
    }
    highlightedIndex.value = -1;
  } catch (e) {
    console.error("Search error", e);
  }
};

const highlightNext = () => {
  if (highlightedIndex.value < suggestions.value.length) {
    highlightedIndex.value++;
  }
};
const highlightPrev = () => {
  if (highlightedIndex.value > -1) {
    highlightedIndex.value--;
  }
};
const selectHighlighted = () => {
  if (highlightedIndex.value === -1) {
    return;
  }
  if (
    highlightedIndex.value >= 0 &&
    highlightedIndex.value < suggestions.value.length
  ) {
    const selected = suggestions.value[highlightedIndex.value];
    if (selected) {
      selectPatient(selected);
    }
  }
};

const selectPatient = (searchResult: Patient) => {
  showSuggestions.value = false;
  patient.value = {
    id: searchResult.id,
    mrn: searchResult.mrn,
    name: searchResult.name,
    dob: searchResult.dob,
    gender: searchResult.gender,
    age: searchResult.age,
    email: searchResult.email,
  };
};

const addNewPatient = () => {
  addNewClicked.value = true;
  showSuggestions.value = false;
  patient.value = {
    mrn: "",
    name: patient.value.name,
    dob: "",
    gender: "",
  };
};

onClickOutside(containerRef, () => {
  showSuggestions.value = false;
});

const preventNumbers = (event: KeyboardEvent) => {
  if (!/[a-zA-Z\s']/.test(event.key)) {
    event.preventDefault();
  }
};

function handleSave() {
  console.log("save");
}

const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="patient-info">
    <div class="frame-group">
      <div class="patient-info-wrapper">
        <button @click="goBack" class="go-back-icon">
          <img src="~/assets/icons/back-arrow.svg" alt="Previous page" />
        </button>
        <h2 class="patient-info-title2">Clinical Transcription</h2>
      </div>
      <div class="form-group" id="patient-info-form">
        <div class="name-container">
          <div class="name-wrapper">
            <div class="input-container search-container" ref="containerRef">
              <input
                type="text"
                name="name"
                id="name"
                v-model="patient.name"
                class="input-field"
                placeholder="Search Patients"
                maxlength="30"
                @keypress="preventNumbers"
                @input="onInput"
                @keydown.down="highlightNext"
                @keydown.up="highlightPrev"
                @focus="onFocus"
                @keydown.enter.prevent="selectHighlighted"
              />
              <span class="error-message">{{ errors.name }}</span>

              <ul
                v-if="showSuggestions"
                class="absolute bg-white border w-full mt-1 rounded shadow z-10"
              >
                <template v-if="suggestions.length > 0">
                  <li
                    v-for="(patient, index) in suggestions"
                    :key="patient.mrn"
                    :class="[
                      'px-4 py-2 cursor-pointer',
                      highlightedIndex === index ? 'bg-blue-100' : '',
                    ]"
                    @click="selectPatient(patient)"
                  >
                    {{ patient.name }} ({{ patient.mrn }})
                  </li>
                </template>

                <li v-else class="grey-clr px-4 py-2 text-gray-500 cursor-default">
                  No records found
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="add-patient-container">
          <button class="add-patient-button" @click="addNewClicked = true">
            Add New Patient
          </button>
          <AddPatientModal
            :show="addNewClicked"
            :saveAndLaunchConsultation="true"
            @close="addNewClicked = false"
            @save="handleSave"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/components/patient/patient-actions-bar.css";
</style>
