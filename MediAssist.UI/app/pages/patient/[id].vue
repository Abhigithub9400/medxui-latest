<template>
  <LoadingSpinner :visible="isLoading" :message="'Intializing the session, please wait...'" />
  
  <div v-show="!isLoading" class="consultation-page">
    <patientCard v-if="patient" :isHistory="true" :patient="patient" />
    <!-- Left Panel -->
    <div v-if="consultations?.length" class="panel">
      <div class="left-panel">
        <div class="tabs">
          <span class="tab">Consultations</span>
        </div>
        <div class="sessions-list">
          <div class="session-item" v-for="s in consultations" :key="s.id" :class="{ selected: s.id === selectedId }"
            @click="selectSession(s.id)">
            <div class="session-info">
              <div class="session-title">{{ s.name }}</div>
              <div class="session-date">{{ formatDate(s.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Right Panel -->
  
      <div class="right-panel">
        <ConsultationReport v-if="!isLoading" />
  
      </div>
    </div>
    <div v-else class="no-record">No Record Found</div>
  </div>
</template>

<script setup lang="ts">
import patientCard from "@/components/patient/patientCard.vue";
import ConsultationReport from "@/components/consultation/ConsultationReport.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import { formatDateToDDMMYYYY } from "~/utils/validators";

import type { Patient } from "~/types/interfaces/Patient";
import type { Consultation } from "~/types/interfaces/Consultation";

definePageMeta({
  layout: "panel",
});

const patient = ref<Patient>();
const consultations = ref<Consultation[]>();
const selectedId = ref<number | null>(null);

const isSession = ref(true);
const isLoading = ref(true);
const { getPatientHistoryData, patientDetails, getConsultationData } = usePatientDetailsService();

const selectSession = async (id: number) => {
  await getConsultationData(id);
  selectedId.value = id;
};
function formatDate(dateString: string) {
  return formatDateToDDMMYYYY(dateString);
}


onMounted(async () => {
  if (await getPatientHistoryData()) {
    patient.value = patientDetails.value?.patient;
    consultations.value = patientDetails.value?.consultations;
    if (consultations.value?.length > 0) {
      selectedId.value = consultations.value[0].id;
    }
    isLoading.value = false;
  }

});
</script>

<style scoped>
@import "~/assets/css/pages/patient/[id].css";
</style>
