<script setup lang="ts">
import { defineProps } from "vue";
import type { Patient } from "~/types/interfaces/Patient";
import { useRouter } from "vue-router";

defineProps<{
  patient: Patient;
  isHistory: boolean;
}>();

const router = useRouter();

const toConsultation = () => {
  router.push("/consultation");
};

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="patient-name-card">
    <button @click="goBack" class="go-back-icon">
        <img src="~/assets/icons/back-arrow.svg" alt="Previous page" /> 
    </button>
    <h2 class="doctor-name">{{ patient.name }}</h2>
</div>
  <div v-if="patient" class="patient-card">
    <div class="patient-info">
      <div class="patient-details">
        <div class="detail-item">
          <div class="label">MRN Number</div>
          <div class="value">{{ patient.mrn }}</div>
        </div>

        <div class="detail-item">
          <div class="label">Age</div>
          <div class="value">{{ patient.age }}</div>
        </div>
        <div class="detail-item">
          <div class="label">Gender</div>
          <div class="value">{{capitalizeGender(patient.gender) }}</div>
        </div>
      </div>
    </div>

    <div v-if="isHistory" class="consult-btn">
      <button class="launch-button" @click="toConsultation">
        Launch Consultation
      </button>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/components/patient/patientCard.css";
</style>
