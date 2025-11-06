<script setup lang="ts">
import { ref } from "vue";
import { useConsultationService } from "~/composables/useConsultationService";
import { usePatientDetailsService } from "~/composables/usePatientDetailsService";
import { useTranscription } from "~/composables/useTranscription";
import { getUserInfoPropertyFromCookie } from "@/composables/useCookieService";
import { onClickOutside } from "@vueuse/core";
import ShareReportModal from "@/components/modals/ShareReportModal.vue";
import conversationtemplate from "@/components/patient/conversation.vue";

const props = defineProps<{
  isEditOptionEnabled?: boolean;
  isResultGenerated?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "update:modelValue"): void;
}>();

function onClose() {
  emit("close");
}

const dropdownContainer = ref<HTMLElement | null>(null);
const isShareReportModal = ref(false);
const baseUrl = useApiBaseUrl();

const { reportData, downloadPdf, isDownloading, updateSummaryReport } = useConsultationService();
const { consultationDetails, patientDetails } = usePatientDetailsService();
const {audioFile} = useTranscription();

const audioUrl = computed(() => baseUrl +"/consultation/audio/stream/" + ( props.isEditOptionEnabled ? audioFile : consultationDetails.value?.audioFileName));
const patient = computed(() => reportData.value?.patient ?? {});
const patientId = computed(() => {
   if (!props.isEditOptionEnabled) {
    return patientDetails.value?.patient.id ?? {};
  }
  return patient.value.patientInfo.id ?? {};
});
const consultationId = computed(() => {
  if (!props.isEditOptionEnabled) {
    return unref(consultationDetails.value?.id) ?? 0;
  }
  return unref(reportData.value.ConsultationId) ?? 0;
});
const report = computed(() => {
  const defaultReport = {
    subjective: {
      chiefComplaint: "",
      medicalHistory: "",
    },
    objective: {
      vitals: [],
    },
    assessment: {
      potentialDiagnosis: "",
    },
    plan: {
      prescriptions: [],
      testsAdvised: [],
      nextAppointment: "",
    },
    codes: [],
    consultationDateTime: "",
  };
  if (props.isEditOptionEnabled) {
    return { ...defaultReport, ...(reportData.value?.SummaryReport ?? {}) };
  } else {
    return { ...defaultReport, ...(consultationDetails.value?.report ?? {}) };
  }
});
const conversation = computed(() =>
  props.isEditOptionEnabled
    ? (reportData.value?.conversation ?? [])
        .filter(
          (item: any) =>
            typeof item?.speaker === "string" && typeof item?.text === "string"
        )
        .map((item: any) => ({
          speaker: item.speaker ?? "",
          text: item.text ?? "",
        }))
    : (consultationDetails.value?.conversation ?? [])
        .filter(
          (item: any) =>
            typeof item?.speaker === "string" && typeof item?.text === "string"
        )
        .map((item: any) => ({
          speaker: item.speaker ?? "",
          text: item.text ?? "",
        }))
);

const now = ref(new Date());
setInterval(() => {
  now.value = new Date();
}, 60000);

const editingField = ref<string | null>(null);
const tempValue = ref<any>("");
const editValue = ref("");

const startEditing = (field: string, currentValue: any) => {
  editingField.value = field;
  tempValue.value = currentValue;
  editValue.value = currentValue;
};

const finishEditing = (field: string) => {
  if (!reportData.value.SummaryReport) return;

  const [section, key] = field.split(".");
  if (
    typeof section === "string" &&
    section !== undefined &&
    section &&
    key &&
    reportData.value.SummaryReport &&
    Object.hasOwn(reportData.value.SummaryReport, section)
  ) {
    (reportData.value.SummaryReport as any)[section][key] = tempValue.value;
    updateSummaryReport(consultationId.value, reportData.value.SummaryReport);
  }
  editingField.value = null;
};

const cancelEditing = () => {
  editingField.value = null;
  tempValue.value = "";
};

const startListEditing = (field: string, value: any) => {
  editingField.value = field;
  if (Array.isArray(value)) {
    editValue.value = value.join("\n");
  } else {
    editValue.value = "";
  }
};

const saveListEditing = (field: string) => {
  if (!reportData.value.SummaryReport) return;

  const updatedList = editValue.value
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const fieldPath = field.split(".");

  if (
    fieldPath.length === 1 &&
    typeof fieldPath[0] === "string" &&
    reportData.value.SummaryReport
  ) {
    (reportData.value.SummaryReport as Record<string, any>)[fieldPath[0]] =
      updatedList;
  } else if (
    fieldPath.length === 2 &&
    typeof fieldPath[0] === "string" &&
    typeof fieldPath[1] === "string" &&
    reportData.value.SummaryReport
  ) {
    const [section, key] = fieldPath;
    if (section in reportData.value.SummaryReport) {
      if (!(reportData.value.SummaryReport as any)[section]) {
        (reportData.value.SummaryReport as any)[section] = {};
      }
      (reportData.value.SummaryReport as any)[section][key] = updatedList;
    }
  }
  updateSummaryReport(consultationId.value, reportData.value.SummaryReport);
  editingField.value = null;
};

const cancelListEditing = () => {
  editingField.value = null;
  editValue.value = "";
};

const tempMedications = ref<any[]>([]);

const startMedicationEditing = (
  field: string,
  medications: any[] | undefined
) => {
  editingField.value = field;
  tempMedications.value = medications
    ? JSON.parse(JSON.stringify(medications))
    : [];
};

const saveMedicationEditing = (field: string) => {
  if (!reportData.value.SummaryReport) return;

  const validMedications = tempMedications.value.filter(
    (med) => med.name && med.name.trim() !== ""
  );

  const [section, key] = field.split(".");
  if (
    typeof section === "string" &&
    section &&
    typeof key === "string" &&
    key &&
    section in reportData.value.SummaryReport
  ) {
    if (!(reportData.value.SummaryReport as any)[section]) {
      (reportData.value.SummaryReport as any)[section] = {};
    }
    (reportData.value.SummaryReport as any)[section][key] = validMedications;
  }
  updateSummaryReport(consultationId.value, reportData.value.SummaryReport);
  editingField.value = null;
  tempMedications.value = [];
};

const cancelMedicationEditing = () => {
  editingField.value = null;
  tempMedications.value = [];
};

const hasEmptyMedication = computed(() => {
  return tempMedications.value.some(
    (med) => !med.name || med.name.trim() === ""
  );
});

const addNewMedication = () => {
  // Only add if there are no empty medications
  if (!hasEmptyMedication.value) {
    tempMedications.value.push({
      name: "",
      dosage: "",
      frequency: "",
      timing: "",
      duration: "",
    });
  }
};

const removeMedication = (index: number) => {
  tempMedications.value.splice(index, 1);
};

const getCurrentMedications = () => {
  if (editingField.value === "plan.prescriptions") {
    return tempMedications.value;
  }
  return report.value.plan?.prescriptions || [];
};

const handleDownloadReport = (type: string) => {
  if (isDownloading.value) return;
  isDownloadOptionsOpen.value = false;
  const userId = getUserInfoPropertyFromCookie("userId") || "";
  downloadPdf(userId, type, consultationId.value, patientId.value as number);
};

const openDropdown = ref<number | null>(null);
const activeParent = ref("");

const menuItems = [
  {
    name: "Once daily",
    children: [{ name: "Before food" }, { name: "After food" }],
  },
  {
    name: "Twice daily",
    children: [{ name: "Before food" }, { name: "After food" }],
  },
  {
    name: "If needed",
    children: [{ name: "Before food" }, { name: "After food" }],
  },
];

const toggleDropdown = (idx: number) => {
  openDropdown.value = openDropdown.value === idx ? null : idx;
};

// Close dropdown when clicking anywhere in the table except dropdown button
const handleTableClick = (event: Event) => {
  const target = event.target as HTMLElement;
  const isDropdownButton = target.closest('.dropdown-btn');
  const isDropdownMenu = target.closest('.dropdown-menu');
  const isDropdownSubmenu = target.closest('.dropdown-submenu');
  
  // Close dropdown if clicking in table but not on dropdown-related elements
  if (!isDropdownButton && !isDropdownMenu && !isDropdownSubmenu) {
    openDropdown.value = null;
  }
};

const medicationsContainer = ref<HTMLElement | null>(null);

// Close dropdowns when clicking outside the medications container
onClickOutside(medicationsContainer, (event) => {
  // Check if the click is on a dropdown button
  const target = event.target as HTMLElement;
  const isDropdownButton = target.closest('.dropdown-btn');
  
  // Only close if not clicking on a dropdown button
  if (!isDropdownButton) {
    openDropdown.value = null;
  }
});

const isDownloadOptionsOpen = ref(false);

const toggleDownloadOptions = () => {
  isDownloadOptionsOpen.value = !isDownloadOptionsOpen.value;
};

onClickOutside(dropdownContainer, () => {
  isDownloadOptionsOpen.value = false;
});

const selectFrequency = (idx: number, parent: string, child: string) => {
  tempMedications.value[idx].frequency = `${parent} - ${child}`;
  openDropdown.value = null;
};
</script>

<template v-if="props.isResultGenerated">
  <div class="header-card" v-if="isEditOptionEnabled">
    <div>
      <h2 class="doctor-name">Generated Result</h2>
    </div>
    <button class="report-close-btn" @click="onClose">
      <span>×</span>
    </button>
  </div>
  <div
    class="report-component"
    :class="{ 'report-component-margin': isEditOptionEnabled }"
  >
    <div v-if="isEditOptionEnabled || (!isEditOptionEnabled && consultationDetails?.reportId)" class="report-wrapper">
      <div v-if="isEditOptionEnabled" class="report-header">
        <div class="header-top-row">
          <h2 class="patient-name">{{ patient.patientInfo?.name }}</h2>
          <span class="date-time">{{ report.consultationDateTime }}</span>
        </div>

        <div class="header-bottom-row">
          <div class="patient-meta">
            <div class="patient-table">
              <div class="table-column">
                <span class="table-header">MRN Number</span>
                <span class="table-value">{{ patient.patientInfo?.mrn }}</span>
              </div>
              <div class="table-column">
                <span class="table-header">Age</span>
                <span class="table-value">{{ patient.patientInfo?.age }}</span>
              </div>
              <div class="table-column">
                <span class="table-header">Gender</span>
                <span class="table-value">{{
                 capitalizeGender(patient.patientInfo?.gender)
                }}</span>
              </div>
              <div class="table-column">
                <span class="table-header">Consulting Doctor</span>
                <span class="table-value">{{ patient.consultingDoctor }}</span>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button class="share-btn" @click="isShareReportModal = true">
              <div class="share-icon"></div>
            </button>
            <div class="dropdown" ref="dropdownContainer">
              <button class="download-btn" @click="toggleDownloadOptions" :disabled="isDownloading">
                <div class="btn-content">
                  <div class="btn-text">
                    <span v-if="!isDownloading">Download</span>
                    <span v-else>Downloading...</span>
                  </div>
                  <div class="arrow">
                    <img
                      src="@/assets/icons/down-arrow-white.svg"
                      alt="v"
                      class="down-arrow-white"
                    />
                  </div>
                </div>
              </button>

              <ul v-if="isDownloadOptionsOpen" class="download-dropdown-menu">
                <li @click="handleDownloadReport('report')">Complete Report</li>
                <li @click="handleDownloadReport('prescriptions')">
                  Prescriptions
                </li>
                <li @click="handleDownloadReport('tests')">Tests Advised</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div
        v-else
        class="report-header"
        :class="{ 'report-title': !isEditOptionEnabled }"
      >
        Generated Report
        <div class="action-buttons">
          <button class="share-btn" @click="isShareReportModal = true">
            <div class="share-icon"></div>
          </button>
          <div class="dropdown" ref="dropdownContainer">
            <button class="download-btn" @click="toggleDownloadOptions" :disabled="isDownloading">
              <div class="btn-content">
                <div class="btn-text">
                  <span v-if="!isDownloading">Download</span>
                    <span v-else>Downloading...</span>
                </div>
                <div class="arrow">
                  <img
                    src="@/assets/icons/down-arrow-white.svg"
                    alt="v"
                    class="down-arrow-white"
                  />
                </div>
              </div>
            </button>

            <ul v-if="isDownloadOptionsOpen" class="download-dropdown-menu">
              <li @click="handleDownloadReport('report')">Complete Report</li>
              <li @click="handleDownloadReport('prescriptions')">
                Prescriptions
              </li>
              <li @click="handleDownloadReport('tests')">Tests Advised</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="report-container">
        <div v-if="report?.subjective" class="report-section">
          <h3>Subjective</h3>
          <div class="report-subsection">
            <div class="subsection-header">
              <h4>Chief Complaint (CC)</h4>
              <template
                v-if="
                  isEditOptionEnabled &&
                  editingField === 'subjective.chiefComplaint'
                "
              >
                <div class="edit-actions">
                  <button
                    class="tick-btn"
                    @click="finishEditing('subjective.chiefComplaint')"
                  >
                    <img
                      src="@/assets/icons/tick.svg"
                      alt="Save"
                      class="tick-icon"
                    />
                  </button>
                  <button class="close-btn" @click="cancelEditing()">
                    <img
                      src="@/assets/icons/red-close.svg"
                      alt="Cancel"
                      class="close-icon"
                    />
                  </button>
                </div>
              </template>
              <button
                v-else-if="isEditOptionEnabled"
                class="edit-btn"
                @click="
                  startEditing(
                    'subjective.chiefComplaint',
                    report.subjective?.chiefComplaint
                  )
                "
              >
                <img
                  src="@/assets/consultation/edit.svg"
                  alt="Edit"
                  class="edit-icon"
                />
              </button>
            </div>

            <div class="editable-field">
              <textarea
                v-if="editingField === 'subjective.chiefComplaint'"
                v-model="tempValue"
                @keyup.enter="finishEditing('subjective.chiefComplaint')"
                class="editable"
              />
              <p v-else>{{ report.subjective?.chiefComplaint }}</p>
            </div>
          </div>

          <div class="report-subsection">
            <div class="subsection-header">
              <h4>Medical History</h4>
              <template
                v-if="
                  isEditOptionEnabled &&
                  editingField === 'subjective.medicalHistory'
                "
              >
                <div class="edit-actions">
                  <button
                    class="tick-btn"
                    @click="finishEditing('subjective.medicalHistory')"
                  >
                    <img
                      src="@/assets/icons/tick.svg"
                      alt="Save"
                      class="tick-icon"
                    />
                  </button>
                  <button class="close-btn" @click="cancelEditing()">
                    <img
                      src="@/assets/icons/red-close.svg"
                      alt="Cancel"
                      class="close-icon"
                    />
                  </button>
                </div>
              </template>
              <button
                v-else-if="isEditOptionEnabled"
                class="edit-btn"
                @click="
                  startEditing(
                    'subjective.medicalHistory',
                    report.subjective?.medicalHistory
                  )
                "
              >
                <img
                  src="@/assets/consultation/edit.svg"
                  alt="Edit"
                  class="edit-icon"
                />
              </button>
            </div>

            <div class="editable-field">
              <textarea
                v-if="editingField === 'subjective.medicalHistory'"
                v-model="tempValue"
                @keyup.enter="finishEditing('subjective.medicalHistory')"
                class="editable"
              />
              <p v-else>{{ report.subjective?.medicalHistory }}</p>
            </div>
          </div>
        </div>

        <div v-if="report?.objective" class="report-section">
          <h3>Objective</h3>

          <div class="report-subsection">
            <div class="subsection-header">
              <h4>Vitals</h4>
              <template
                v-if="
                  isEditOptionEnabled && editingField === 'objective.vitals'
                "
              >
                <div class="edit-actions">
                  <button
                    class="tick-btn"
                    @click="saveListEditing('objective.vitals')"
                  >
                    <img
                      src="@/assets/icons/tick.svg"
                      alt="Save"
                      class="tick-icon"
                    />
                  </button>
                  <button class="close-btn" @click="cancelListEditing()">
                    <img
                      src="@/assets/icons/red-close.svg"
                      alt="Cancel"
                      class="close-icon"
                    />
                  </button>
                </div>
              </template>
              <button
                v-else-if="
                  isEditOptionEnabled && editingField !== 'objective.vitals'
                "
                class="edit-btn"
                @click="
                  startListEditing('objective.vitals', report.objective?.vitals)
                "
              >
                <img
                  src="@/assets/consultation/edit.svg"
                  alt="Edit"
                  class="edit-icon"
                />
              </button>
            </div>

            <ul v-if="editingField !== 'objective.vitals'">
              <li
                v-for="(item, index) in report.objective?.vitals"
                :key="index"
              >
                {{ item }}
              </li>
            </ul>

            <div v-else>
              <textarea
                v-model="editValue"
                rows="5"
                class="list-editor"
              ></textarea>
            </div>
          </div>
        </div>

        <div v-if="report?.assessment" class="report-section">
          <h3>Assessment</h3>
          <div class="report-subsection">
            <div class="subsection-header">
              <h4>Potential Diagnosis</h4>
              <template
                v-if="
                  isEditOptionEnabled &&
                  editingField === 'assessment.potentialDiagnosis'
                "
              >
                <div class="edit-actions">
                  <button
                    class="tick-btn"
                    @click="finishEditing('assessment.potentialDiagnosis')"
                  >
                    <img
                      src="@/assets/icons/tick.svg"
                      alt="Save"
                      class="tick-icon"
                    />
                  </button>
                  <button class="close-btn" @click="cancelEditing()">
                    <img
                      src="@/assets/icons/red-close.svg"
                      alt="Cancel"
                      class="close-icon"
                    />
                  </button>
                </div>
              </template>
              <button
                v-else-if="isEditOptionEnabled"
                class="edit-btn"
                @click="
                  startEditing(
                    'assessment.potentialDiagnosis',
                    report.assessment?.potentialDiagnosis
                  )
                "
              >
                <img
                  src="@/assets/consultation/edit.svg"
                  alt="Edit"
                  class="edit-icon"
                />
              </button>
            </div>

            <div class="editable-field">
              <textarea
                v-if="editingField === 'assessment.potentialDiagnosis'"
                v-model="tempValue"
                @keyup.enter="finishEditing('assessment.potentialDiagnosis')"
                class="editable"
              />
              <p v-else>{{ report.assessment?.potentialDiagnosis }}</p>
            </div>
          </div>
        </div>

        <div v-if="report?.plan" class="report-section">
          <h3>Plan</h3>
          <div class="report-subsection">
            <div class="subsection-header">
              <h4>Prescriptions</h4>
              <template
                v-if="
                  isEditOptionEnabled && editingField === 'plan.prescriptions'
                "
              >
                <div class="edit-actions">
                  <button
                    class="tick-btn"
                    @click="saveMedicationEditing('plan.prescriptions')"
                  >
                    <img
                      src="@/assets/icons/tick.svg"
                      alt="Save"
                      class="tick-icon"
                    />
                  </button>
                  <button class="close-btn" @click="cancelMedicationEditing()">
                    <img
                      src="@/assets/icons/red-close.svg"
                      alt="Cancel"
                      class="close-icon"
                    />
                  </button>
                </div>
              </template>
              <button
                v-else-if="isEditOptionEnabled"
                class="edit-btn"
                @click="
                  startMedicationEditing(
                    'plan.prescriptions',
                    report.plan?.prescriptions || []
                  )
                "
              >
                <img
                  src="@/assets/consultation/edit.svg"
                  alt="Edit"
                  class="edit-icon"
                />
              </button>
            </div>

            <div class="medications-container" ref="medicationsContainer">
              <table class="report-table" aria-label="medications table" @click="handleTableClick">
                <thead>
                  <tr>
                    <th class="first-th">Name</th>
                    <th>Dosage</th>
                    <th
                      :class="
                        editingField === 'plan.prescriptions'
                          ? 'frequency-with'
                          : ''
                      "
                    >
                      Frequency
                    </th>
                    <th
                      :class="{
                        'last-th': editingField != 'plan.prescriptions',
                      }"
                    >
                      Duration
                    </th>
                    <th
                      v-if="editingField === 'plan.prescriptions'"
                      class="last-th"
                    ></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(med, idx) in getCurrentMedications()" :key="idx">
                    <td>
                      <template v-if="editingField === 'plan.prescriptions'">
                        <input
                          v-model="tempMedications[idx].name"
                          type="text"
                          class="td-input"
                          placeholder="Medicine name"
                        />
                      </template>
                      <template v-else>
                        {{ med.name }}
                      </template>
                    </td>
                    <td>
                      <template v-if="editingField === 'plan.prescriptions'">
                        <input
                          v-model="tempMedications[idx].dosage"
                          type="text"
                          class="td-input"
                          placeholder="Dosage"
                        />
                      </template>
                      <template v-else>
                        {{ med.dosage }}
                      </template>
                    </td>
                    <td>
                      <template v-if="editingField === 'plan.prescriptions'">
                        <div class="dropdown">
                          <button
                            class="dropdown-btn"
                            @click.stop="toggleDropdown(idx)"
                          >
                            {{
                              tempMedications[idx].frequency ||
                              "Select Frequency"
                            }}
                            <img
                              src="@/assets/icons/alt-arrow-down.svg"
                              alt="v"
                              class="down-arrow"
                            />
                          </button>

                          <ul v-if="openDropdown === idx" class="dropdown-menu">
                            <li
                              v-for="item in menuItems"
                              :key="item.name"
                              class="dropdown-item"
                              @mouseenter="activeParent = item.name"
                              @mouseleave="activeParent = ''"
                            >
                              <span>{{ item.name }}</span>
                              <div
                                class="chevron-container"
                                v-show="activeParent === item.name"
                              >
                                <img
                                  src="@/assets/icons/right-arrow.svg"
                                  alt=">"
                                  class="chevron-icon"
                                />
                              </div>

                              <!-- Child submenu -->
                              <ul
                                v-if="item.children"
                                class="dropdown-submenu"
                                v-show="activeParent === item.name"
                              >
                                <li
                                  v-for="child in item.children"
                                  :key="child.name"
                                  @click="
                                    selectFrequency(idx, item.name, child.name)
                                  "
                                >
                                  {{ child.name }}
                                </li>
                              </ul>
                            </li>
                          </ul>
                        </div>
                      </template>
                      <template v-else>
                        {{ med.frequency }}
                      </template>
                    </td>

                    <td>
                      <template v-if="editingField === 'plan.prescriptions'">
                        <input
                          v-model="tempMedications[idx].duration"
                          type="text"
                          class="td-input"
                          placeholder="Duration"
                        />
                      </template>
                      <template v-else>
                        {{ med.duration }}
                      </template>
                    </td>
                    <td v-if="editingField === 'plan.prescriptions'">
                      <button
                        class="remove-button"
                        @click="removeMedication(idx)"
                        title="Delete medication"
                      >
                        <img
                          src="@/assets/icons/close-circle.svg"
                          alt="Delete"
                          class="remove-item"
                        />
                      </button>
                    </td>
                  </tr>

                  <!-- Empty state when no medications -->
                  <tr v-if="getCurrentMedications().length === 0">
                    <td
                      :colspan="editingField === 'plan.prescriptions' ? 5 : 4"
                      class="empty-state"
                    >
                      No medications prescribed
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Add Prescription button (only in edit mode) -->
              <button
                v-if="editingField === 'plan.prescriptions'"
                class="add-prescription-btn"
                @click="addNewMedication"
                :disabled="hasEmptyMedication"
                :class="{ 'disabled': hasEmptyMedication }"
              >
                Add Prescription
              </button>
            </div>
          </div>

          <div class="report-subsection">
            <div class="subsection-header">
              <h4>Tests Advised</h4>
              <template
                v-if="
                  isEditOptionEnabled && editingField === 'plan.testsAdvised'
                "
              >
                <div class="edit-actions">
                  <button
                    class="tick-btn"
                    @click="saveListEditing('plan.testsAdvised')"
                  >
                    <img
                      src="@/assets/icons/tick.svg"
                      alt="Save"
                      class="tick-icon"
                    />
                  </button>
                  <button class="close-btn" @click="cancelListEditing()">
                    <img
                      src="@/assets/icons/red-close.svg"
                      alt="Cancel"
                      class="close-icon"
                    />
                  </button>
                </div>
              </template>
              <button
                v-else-if="
                  isEditOptionEnabled && editingField !== 'plan.testsAdvised'
                "
                class="edit-btn"
                @click="
                  startListEditing(
                    'plan.testsAdvised',
                    report.plan?.testsAdvised
                  )
                "
              >
                <img
                  src="@/assets/consultation/edit.svg"
                  alt="Edit"
                  class="edit-icon"
                />
              </button>
            </div>

            <ul v-if="editingField !== 'plan.testsAdvised'">
              <li
                v-for="(item, index) in report.plan?.testsAdvised"
                :key="index"
              >
                {{ item }}
              </li>
            </ul>

            <div v-else>
              <textarea
                v-model="editValue"
                rows="5"
                class="list-editor"
              ></textarea>
            </div>
          </div>

          <div class="report-subsection">
            <div class="subsection-header">
              <h4>Next Appointment</h4>
              <template
                v-if="
                  isEditOptionEnabled && editingField === 'plan.nextAppointment'
                "
              >
                <div class="edit-actions">
                  <button
                    class="tick-btn"
                    @click="finishEditing('plan.nextAppointment')"
                  >
                    <img
                      src="@/assets/icons/tick.svg"
                      alt="Save"
                      class="tick-icon"
                    />
                  </button>
                  <button class="close-btn" @click="cancelEditing()">
                    <img
                      src="@/assets/icons/red-close.svg"
                      alt="Cancel"
                      class="close-icon"
                    />
                  </button>
                </div>
              </template>
              <button
                v-else-if="isEditOptionEnabled"
                class="edit-btn"
                @click="
                  startEditing(
                    'plan.nextAppointment',
                    report.plan?.nextAppointment
                  )
                "
              >
                <img
                  src="@/assets/consultation/edit.svg"
                  alt="Edit"
                  class="edit-icon"
                />
              </button>
            </div>

            <div class="editable-field">
              <textarea
                v-if="editingField === 'plan.nextAppointment'"
                v-model="tempValue"
                @keyup.enter="finishEditing('plan.nextAppointment')"
                class="editable"
              />
              <p v-else>{{ report.plan?.nextAppointment }}</p>
            </div>
          </div>
        </div>

        <div v-if="report?.codes" class="report-section">
          <h3>Code Reference Mapping (Reference Only)</h3>
          <table class="report-table" aria-label="Code reference mapping">
            <thead>
              <tr>
                <th class="first-th">Type</th>
                <th>Code</th>
                <th class="last-th">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(code, idx) in report.codes" :key="idx">
                <td>{{ code.type }}</td>
                <td>{{ code.code }}</td>
                <td>{{ code.description }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div v-else class="report-wrapper">
      <div
        class="report-header report-title"
      >
        Generated Report
      </div>
      <div class="no-report">
              No Reports Generated

      </div>
    </div>
    <div class="card-conversations mini">
      <conversationtemplate
        v-if="audioUrl"
        :conversation="conversation"
        :audioUrl="audioUrl"
      />
    </div>
  </div>
  <ShareReportModal
    v-if="isShareReportModal"
    @close="isShareReportModal = false"
  />
</template>

<style scoped>
@import "~/assets/css/components/consultation/consultation-report.css";
</style>