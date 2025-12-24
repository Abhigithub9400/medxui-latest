<script setup lang="ts">
definePageMeta({
  layout: 'panel',
});

import { ref, computed, onMounted, nextTick } from 'vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import Pagination from '~/components/common/Pagination.vue';
import AddPatientModal from '~/components/modals/AddPatientModal.vue';
import LoadingSpinner from '~/components/common/LoadingSpinner.vue';
import { usePatientService } from '~/composables/usePatientService';

useHead({
  title: "Patient Listing - MediAssist Admin Dashboard",
  meta: [
    {
      name: "description",
      content: "Manage and view patient information, sessions, and contact details in the MediAssist admin dashboard.",
    },
  ],
});

const router = useRouter();

interface Patient {
  id: number;
  mrn: string;
  userName: string;
  sessions: number;
  age: number;
  email: string;
  phoneNumber: string;
}

/* ---------- existing service & state ---------- */
const {
  patients: patientsRef,
  loading,
  error,
  pagination,
  fetchPatients,
  setPage,
  setLimit,
  setSelectedPatientFromDetail,
  getPatientById,
} = usePatientService();

const patients = patientsRef as unknown as Ref<Patient[]>;

const currentPage = ref(1);
const itemsPerPage = ref(10);
const totalItems = computed(() => pagination.value.total);

/* helper computed to check if there are any records overall */
const hasRecords = computed(() => (totalItems.value ?? 0) > 0);

/* pagination helpers */
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage.value));
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, totalItems.value));

const goToPage = async (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    setPage(page);
    await fetchPatients({ page, limit: itemsPerPage.value });
  }
};

const goToPatient = (patientDetail: Patient) => {
  setSelectedPatientFromDetail(patientDetail);
  router.push({ path: `/patient/${patientDetail.id}` });
};

/* Action menu state */
const activeActionMenu = ref<number | null>(null);
const toggleActionMenu = (patientId: number) => {
  activeActionMenu.value = activeActionMenu.value === patientId ? null : patientId;
};
const closeActionMenu = () => {
  activeActionMenu.value = null;
};

/* Edit / Add handlers (unchanged) */
const handleEditPatient = async (patient: Patient) => {
  try {
    const patientDetails = await getPatientById(patient.id);
    if (patientDetails) {
      editPatient.value = patientDetails;
      isEditMode.value = true;
      showModal.value = true;
    } else {
      console.error('Failed to fetch patient details');
    }
  } catch (err) {
    console.error('Error fetching patient details:', err);
  }
  closeActionMenu();
};

const handleAddNewPatient = () => {
  editPatient.value = null;
  isEditMode.value = false;
  showModal.value = true;
};

/* modal + other state */
const showModal = ref(false);
const isSaving = ref(false);
const searchQuery = ref('');
const editPatient = ref<{
  id: number;
  mrn?: string;
  userName: string;
  email: string;
  phoneNumber: string;
  gender?: string;
  dob?: string;
} | null>(null);
const isEditMode = ref(false);

async function handlePatientSaved(ev: { success: boolean }) {
  showModal.value = false;
  editPatient.value = null;
  isEditMode.value = false;

  if (ev?.success) {
    await nextTick();
    await fetchPatients({ page: currentPage.value, limit: itemsPerPage.value });
  }
}

/* Search logic (unchanged) */
const handleSearch = async () => {
  if (searchQuery.value.trim()) {
    await fetchPatients({
      page: 1,
      limit: itemsPerPage.value,
      filters: { search: searchQuery.value.trim() }
    });
    currentPage.value = 1;
    setPage(1);
  } else {
    await fetchPatients({
      page: currentPage.value,
      limit: itemsPerPage.value
    });
  }
};

const clearSearch = async () => {
  searchQuery.value = '';
  await fetchPatients({
    page: currentPage.value,
    limit: itemsPerPage.value
  });
};

const goBack = () => router.back();

/* initial load + outside click to close action menus */
onMounted(async () => {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu')) {
      closeActionMenu();
    }
  });
  await fetchPatients({ page: currentPage.value, limit: itemsPerPage.value });
});
</script>

<template>
  <!-- Page Header (unchanged) -->
  <div class="page-header">
    <div class="header-title">
      <button @click="goBack" class="go-back-icon">
        <img src="~/assets/icons/back-arrow.svg" alt="Previous page" />
      </button>
      <h1 class="page-title">Patient Directory</h1>
    </div>

    <div class="header-actions">
      <div class="search-container">
        <input
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          @input="handleSearch"
          type="text"
          placeholder="Search Patients"
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-search-btn">✕</button>
      </div>

      <button class="add-patient-btn" @click="showModal = true">Add New Patient</button>
    </div>

    <AddPatientModal
      :show="showModal"
      :editPatient="editPatient"
      @close="showModal = false; editPatient = null; isEditMode = false"
      @saved="handlePatientSaved"
    />
  </div>

  <div class="patient-listing">
    <div class="table-container">
      <!-- Table Header: show only when we have records -->
<div v-if="hasRecords" class="table-header">
  <div class="header-row">
    <div class="header-cell">Name</div>
    <div class="header-cell">MRN Number</div>
    <div class="header-cell">Age</div>
    <div class="header-cell">Email Id</div>
    <div class="header-cell">Phone Number</div>
    <div class="header-cell">Action</div>
  </div>
</div>

      <!-- If there are records show them, otherwise show No Records placeholder -->
      <div v-if="hasRecords && !loading" class="table-body">
        <div
          v-for="patient in patients"
          :key="patient.id"
          class="patient-row"
          @click="goToPatient(patient)"
          :class="{ 'row-active': activeActionMenu === patient.id }"
        >
          <div class="patient-cell patient-name">{{ patient.userName }}</div>
          <div class="patient-cell">{{ patient.mrn }}</div>
          <div class="patient-cell">{{ patient.age }}</div>
          <div class="patient-cell">{{ patient.email }}</div>
          <div class="patient-cell">{{ patient.phoneNumber }}</div>
          <div class="patient-cell action-cell">
            <div class="action-menu" :class="{ 'active': activeActionMenu === patient.id }">
              <button
                class="action-trigger"
                @click="toggleActionMenu(patient.id)"
                @click.stop
                aria-haspopup="true"
                :aria-expanded="activeActionMenu === patient.id"
              >
                <!-- 3-dots svg -->
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M8.75 5C8.75 4.66848 8.8817 4.35054 9.11612 4.11612C9.35054 3.8817 9.66848 3.75 10 3.75C10.3315 3.75 10.6495 3.8817 10.8839 4.11612C11.1183 4.35054 11.25 4.66848 11.25 5C11.25 5.33152 11.1183 5.64946 10.8839 5.88388C10.6495 6.1183 10.3315 6.25 10 6.25C9.66848 6.25 9.35054 6.1183 9.11612 5.88388C8.8817 5.64946 8.75 5.33152 8.75 5ZM8.75 10C8.75 9.66848 8.8817 9.35054 9.11612 9.11612C9.35054 8.8817 9.66848 8.75 10 8.75C10.3315 8.75 10.6495 8.8817 10.8839 9.11612C11.1183 9.35054 11.25 9.66848 11.25 10C11.25 10.3315 11.1183 10.6495 10.8839 10.8839C10.6495 11.1183 10.3315 11.25 10 11.25C9.66848 11.25 9.35054 11.1183 9.11612 10.8839C8.8817 10.6495 8.75 10.3315 8.75 10ZM8.75 15C8.75 14.6685 8.8817 14.3505 9.11612 14.1161C9.35054 13.8817 9.66848 13.75 10 13.75C10.3315 13.75 10.6495 13.8817 10.8839 14.1161C11.1183 14.3505 11.25 14.6685 11.25 15C11.25 15.3315 11.1183 15.6495 10.8839 15.8839C10.6495 16.1183 10.3315 16.25 10 16.25C9.66848 16.25 9.35054 16.1183 9.11612 15.8839C8.8817 15.6495 8.75 15.3315 8.75 15Z" fill="#0D0212"/>
                </svg>
              </button>

              <div v-if="activeActionMenu === patient.id" class="action-dropdown" @click.stop>
                <button
                  @click="() => { setSelectedPatientFromDetail(patient); router.push('/consultation'); closeActionMenu() }"
                  class="dropdown-item"
                >Launch consultation</button>

                <button
                  @click="() => { goToPatient(patient); closeActionMenu() }"
                  class="dropdown-item"
                >Reports</button>

                <button @click="handleEditPatient(patient)" class="dropdown-item">Edit</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No records placeholder -->
      <div v-else-if="!loading" class="table-body no-records-wrap">
        <div class="no-records">No Records Found</div>
      </div>

      <!-- If loading is true, keep table body empty — the global LoadingSpinner component will show -->
    </div>

    <!-- hide pagination when there are no results -->
    <Pagination
      v-if="hasRecords"
      :totalItems="totalItems"
      :pageSizeOptions="[10, 20, 50]"
      @update:page="goToPage"
      @update:pageSize="(size:number) => { itemsPerPage = size; setLimit(size); goToPage(1); }"
    />

    <!-- Loading Spinners -->
    <LoadingSpinner :visible="loading" :message="'Loading patients...'" />
    <LoadingSpinner :visible="isSaving" :message="'Saving patient...'" />
  </div>
</template>

<style scoped>
@import "~/assets/css/pages/patient-listing.css";

.action-menu {
  position: relative;
  display: inline-flex;
}

/* dropdown opens to the right of the trigger */
.action-dropdown {
  position: absolute;
  top: calc(100% + 8px);

  /* open to the RIGHT of the trigger */
  left: 15px;
  right: auto;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 12px;
  gap: 8px;
  width: 166px; 
  height: 110px;

  background: #FFF;
  border: 1.05px solid #EFEFEF;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(201, 201, 201, 0.25);

  z-index: 3000; /* high so it sits above cards */
  box-sizing: border-box;
  white-space: nowrap;
}

/* responsive fallback: if viewport is narrow, align dropdown inside the table to avoid overflow */
@media (max-width: 768px) {
  .action-dropdown {
    left: auto;
    right: 8px;
    margin-left: 0;
    width: 160px;
  }
}

/* dropdown items */
.action-dropdown .dropdown-item {
  width: 100%;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  color: #000;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  transition: background 0.12s ease;
}
.action-dropdown .dropdown-item:hover {
  background: #F5F5F5;
  border-radius: 6px;
}
.action-dropdown .dropdown-item + .dropdown-item {
  border-top: 1px solid #F1F1F1;
}

/* Keep dropdown visible and properly layered */
.table-container,
.table-body,
.patient-row,
.action-cell {
  overflow: visible;
  position: relative;
}

.patient-row { position: relative; }
.row-active { z-index: 1100; }

</style> 