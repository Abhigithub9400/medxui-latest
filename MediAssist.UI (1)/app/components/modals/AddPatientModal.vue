<script setup lang="ts">
import {
  computed,
  reactive,
  onMounted,
  onBeforeUnmount,
  ref,
  watch,
  nextTick,
} from "vue";
import {
  validateName,
  validateEmailFormat,
  validatePhone,
  formatDateToDDMMYYYY,
} from "@/utils/validators";
import { usePatientService } from "~/composables/usePatientService";
import DuplicatePatientModal from "~/components/modals/DuplicatePatientModal.vue";

/* Props & emits */
const props = withDefaults(
  defineProps<{
    show: boolean;
    autoSave?: boolean;
    saveAndLaunchConsultation?: boolean;
    editPatient?: {
      id: number;
      mrn?: string;
      userName: string;
      email: string;
      phoneNumber: string;
      gender?: string;
      dob?: string;
    } | null;
  }>(),
  { autoSave: true, editPatient: null }
);
const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "save",
    payload: {
      mrn: string;
      name: string;
      dob: string;
      gender: string;
      email: string;
      phone: string;
    }
  ): void;
  (e: "saved", payload: { success: boolean; message?: string }): void;
}>();

/* Form state */
const formState = reactive({
  mrn: "",
  name: "",
  dob: "", // KEEP this as ISO (YYYY-MM-DD)
  gender: "",
  email: "",
  phone: "",
});

const dobInputType = ref<"text" | "date">("text");
const isSaving = ref(false);

/* Duplicate modal state */
const showDuplicate = ref(false);
const duplicateMessage = ref("");

/* ----------------------
   DOB helpers & validators
   ---------------------- */
type DobErrors = {
  invalidDateFormat: boolean;
  invalidAge: boolean;
  futureDate: boolean;
  blankDob: boolean;
};

const parseDobToDate = (dob: string): Date | null => {
  if (!dob || !dob.trim()) return null;
  const s = dob.trim();

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  // Last resort: try Date parsing and normalize
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }

  return null;
};

const calculateAge = (dobInput: string | Date): number => {
  let dobDate: Date | null;
  if (typeof dobInput === "string") {
    dobDate = parseDobToDate(dobInput);
  } else {
    dobDate = dobInput;
  }

  if (!dobDate) return NaN;

  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const m = today.getMonth() - dobDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
    age--;
  }

  return age;
};

const validateDob = (dob: string): DobErrors => {
  const errors: DobErrors = {
    invalidDateFormat: false,
    invalidAge: false,
    futureDate: false,
    blankDob: false,
  };

  if (!dob || dob.trim() === "") {
    errors.blankDob = true;
    return errors;
  }

  const selectedDate = parseDobToDate(dob);
  if (!selectedDate) {
    errors.invalidDateFormat = true;
    return errors;
  }

  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (selectedDate > normalizedToday) {
    errors.futureDate = true;
    return errors;
  }

  const age = calculateAge(selectedDate);
  if (isNaN(age) || age < 18) {
    errors.invalidAge = true;
  }

  return errors;
};

const ddmmyyyyToIso = (s: string) => {
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split("-");
    return `${y}-${m}-${d}`;
  }
  const parsed = parseDobToDate(s);
  if (parsed) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return s;
};

/* ----------------------
   Computed binding for DOB input
   ---------------------- */
const inputDob = computed<string>({
  get: () => {
    if (dobInputType.value === "date") {
      return formState.dob || "";
    }
    if (!formState.dob) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(formState.dob)) {
      return formatDateToDDMMYYYY(formState.dob);
    }
    return formState.dob;
  },
  set: (value: string) => {
    if (dobInputType.value === "date") {
      formState.dob = value || "";
      return;
    }

    if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
      formState.dob = ddmmyyyyToIso(value);
      return;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      formState.dob = value;
      return;
    }

    const parsed = parseDobToDate(value);
    if (parsed) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const d = String(parsed.getDate()).padStart(2, "0");
      formState.dob = `${y}-${m}-${d}`;
      return;
    }

    formState.dob = value;
  },
});

const convertDobForAPI = (dobValue: string): string => {
  if (!dobValue) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dobValue)) return dobValue;
  return ddmmyyyyToIso(dobValue);
};

/* ----------------------
   Errors & validators
   ---------------------- */
const errors = reactive({
  mrn: "",
  name: "",
  dob: "",
  gender: "",
  email: "",
  phone: "",
});

const dobErrors = reactive({
  invalidDateFormat: false,
  invalidAge: false,
  futureDate: false,
  blankDob: false,
});

function resetForm() {
  if (props.editPatient) {
    formState.mrn = props.editPatient.mrn || "";
    formState.name = props.editPatient.userName || "";
    formState.dob = props.editPatient.dob || "";
    formState.gender = props.editPatient.gender ? props.editPatient.gender.toLowerCase() : "";
    formState.email = props.editPatient.email || "";
    formState.phone = props.editPatient.phoneNumber || "";
  } else {
    formState.mrn = "";
    formState.name = "";
    formState.dob = "";
    formState.gender = "";
    formState.email = "";
    formState.phone = "";
  }

  errors.mrn = "";
  errors.name = "";
  errors.dob = "";
  errors.gender = "";
  errors.email = "";
  errors.phone = "";

  dobErrors.invalidDateFormat = false;
  dobErrors.invalidAge = false;
  dobErrors.futureDate = false;
  dobErrors.blankDob = false;

  dobInputType.value = "text";
}

const fieldValidators: Record<string, () => string> = {
  mrn: () => "",
  name: () => validateName(formState.name),

  dob: () => {
    const dobForValidation =
      formState.dob && /^\d{4}-\d{2}-\d{2}$/.test(formState.dob)
        ? formatDateToDDMMYYYY(formState.dob)
        : formState.dob || "";

    const dobValidation = validateDob(dobForValidation);
    Object.assign(dobErrors, dobValidation);

    if (dobValidation.blankDob) {
      return "Date of Birth is required";
    }

    if (dobValidation.invalidDateFormat) {
      return "Please enter a valid date";
    }

    if (dobValidation.futureDate) {
      return "Date of Birth cannot be in the future";
    }

    if (dobValidation.invalidAge) {
      return "Patient must be at least 18 years old";
    }

    return "";
  },

  gender: () => {
    if (!formState.gender) {
      return "Gender is required";
    }
    return "";
  },

  email: () => {
    return validateEmailFormat(formState.email);
  },

  phone: () => {
    return validatePhone(formState.phone);
  },
};

const validateField = (field: string) => {
  if (fieldValidators[field]) {
    errors[field as keyof typeof errors] = fieldValidators[field]();
  }
};

const isValid = computed(() => {
  if (props.editPatient) {
    return (
      !errors.email &&
      !errors.phone &&
      formState.email.trim() &&
      formState.phone.trim()
    );
  }
  return (
    !errors.name &&
    !errors.dob &&
    !errors.gender &&
    !errors.email &&
    !errors.phone &&
    formState.name.trim() &&
    formState.dob &&
    formState.gender &&
    formState.email.trim() &&
    formState.phone.trim()
  );
});

/* ----------------------
   Save / API integration
   ---------------------- */
function onClose() {
  resetForm();
  emit("close");
}

// Helpers used by onSave
function validateBeforeSave() {
  if (props.editPatient) {
    validateField("email");
    validateField("phone");
  } else {
    validateField("mrn");
    validateField("name");
    validateField("dob");
    validateField("gender");
    validateField("email");
    validateField("phone");
  }
  return isValid.value && !isSaving.value;
}

/**
 * Normalize different possible response shapes into a small result object.
 */
function normalizeResult(result: any) {
  const maybeData = result?.data ?? result ?? {};
  const payload = maybeData?.data ?? maybeData;
  const message = payload?.message ?? maybeData?.message ?? result?.message ?? "";
  const isSuccess =
    payload?.success === true || maybeData?.success === true || result?.success === true;
  return { payload, message, isSuccess };
}

/**
 * Handle a successful save. Accepts patientRef (the ref returned by usePatientService).
 * patientRef is the shared reactive object we update when saveAndLaunchConsultation is true.
 */
function handleSuccess(payload: any, patientRef: any) {
  emit("saved", { success: true });

  if (props.saveAndLaunchConsultation && patientRef) {
    const d = payload?.data ?? payload;
    patientRef.value.name = d?.name ?? formState.name;
    patientRef.value.id = d?.patientId ?? d?.id ?? patientRef.value.id;
    patientRef.value.dob = formState.dob;
    patientRef.value.mrn = d?.mrn ?? formState.mrn;
    patientRef.value.gender = d?.gender ?? formState.gender;
    patientRef.value.email = formState.email;
    patientRef.value.age = d?.age ?? patientRef.value.age;
  }

  onClose();
}

function handleDuplicate(message: string) {
  duplicateMessage.value = message;
  showDuplicate.value = true;
  emit("saved", { success: false, message });
}

function extractErrorMessage(e: any): string {
  return (
    e?.data?.message ??
    e?.response?.data?.message ??
    (typeof e?.response?.data === "string" ? e.response.data : undefined) ??
    e?.message ??
    ""
  );
}

// Refactored onSave
async function onSave() {
  // single validation invocation
  if (!validateBeforeSave()) return;

  if (!props.autoSave) {
    emit("save", {
      ...formState,
      dob: convertDobForAPI(formState.dob),
    });
    return;
  }

  try {
    isSaving.value = true;
    const { savePatient, updatePatient, patient } = usePatientService();

    let result: any;
    if (props.editPatient) {
      result = await updatePatient(props.editPatient.id, {
        email: formState.email,
        phone: formState.phone,
      });
    } else {
      result = await savePatient({
        mrn: formState.mrn,
        name: formState.name,
        dob: convertDobForAPI(formState.dob),
        gender: formState.gender,
        email: formState.email,
        phone: formState.phone,
      });
    }

    const { payload, message, isSuccess } = normalizeResult(result);

    if (isSuccess) {
      // pass patient ref into helper so it can update the shared patient object
      handleSuccess(payload, patient);
      return;
    }

    // Duplicate detection
    if (
      message &&
      (message.includes("A patient with the same full details already exists") ||
        message.toLowerCase().includes("same full details"))
    ) {
      handleDuplicate(message);
      return;
    }

    // generic failure
    emit("saved", { success: false, message: message || "Failed to save patient" });
  } catch (e: any) {
    const errMsg = extractErrorMessage(e);
    if (
      errMsg &&
      (errMsg.includes("A patient with the same full details already exists") ||
        errMsg.toLowerCase().includes("same full details"))
    ) {
      handleDuplicate(errMsg);
      return;
    }
    emit("saved", { success: false, message: errMsg || "Unexpected error occurred." });
  } finally {
    isSaving.value = false;
  }
}

/* Handler called when user confirms duplicate dialog.
   Moved to script to avoid TS template resolution issues. */
function onDuplicateConfirm() {
  nextTick(() => {
    // use globalThis.document to be explicit for TS
    const el = globalThis.document.getElementById("name") as HTMLInputElement | null;
    if (el) {
      el.focus();
      el.select?.();
    }
  });
}

/* ----------------------
   Watch for opening modal to reset
   ---------------------- */
watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      resetForm();
    }
  }
);

/* ----------------------
   Keyboard escape handling
   ---------------------- */
function handleEsc(e: KeyboardEvent) {
  if (e.key === "Escape" && props.show) onClose();
}
onMounted(() => document.addEventListener("keydown", handleEsc));
onBeforeUnmount(() => document.removeEventListener("keydown", handleEsc));

</script>

<template>
  <teleport to="body">
    <div v-if="props.show" class="overlay" @click.self="onClose">
      <div class="modal" aria-label="Add New Patient">
        <header class="modal-header">
          <h2 class="title">
            {{ props.editPatient ? "Edit Patient" : "Add New Patient" }}
          </h2>
          <button class="close-btn" @click="onClose" aria-label="Close">
            <img src="~/assets/icons/close-modal.svg" alt="Close" />
          </button>
        </header>

        <form class="form" @submit.prevent="onSave">
          <div class="field">
            <label class="label" for="mrn">MRN Number</label>
            <input
              id="mrn"
              v-model.trim="formState.mrn"
              class="input"
              :class="{ error: errors.mrn }"
              type="text"
              placeholder="MRN is auto-managed"
              disabled
            />
            <span v-if="errors.mrn" class="error-message">{{ errors.mrn }}</span>
          </div>

          <div class="field">
            <label class="label" for="name">Name*</label>
            <input
              id="name"
              v-model.trim="formState.name"
              class="input"
              :class="{ error: errors.name }"
              type="text"
              placeholder="Enter Name"
              required
              :disabled="!!props.editPatient"
              @blur="validateField('name')"
              @input="validateField('name')"
            />
            <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
          </div>

          <div class="field">
            <label class="label" for="gender">Gender*</label>
            <select
              id="gender"
              v-model="formState.gender"
              class="input"
              :class="{ error: errors.gender }"
              required
              :disabled="!!props.editPatient"
              @change="validateField('gender')"
            >
              <option value="" disabled hidden class="gender-placeholder">
                Select
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="transgender">Transgender</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer Not to Say</option>
            </select>
            <span v-if="errors.gender" class="error-message">{{ errors.gender }}</span>
          </div>
          
          <div class="field">
          <label class="label" for="dob">Date of Birth*</label>
          <input
            id="dob"
            v-model="inputDob"
            class="input"
            :class="{ error: errors.dob }"
            :type="dobInputType"
            placeholder="DD-MM-YYYY"
            required
            :disabled="!!props.editPatient"
            @focus="dobInputType = 'date'"
            @blur="!formState.dob && (dobInputType = 'text'); validateField('dob');"
            @change="validateField('dob')"
          />
          </div>
          <div class="field">
            <label class="label" for="email">Email id*</label>
            <input
              id="email"
              v-model.trim="formState.email"
              class="input"
              :class="{ error: errors.email }"
              type="email"
              placeholder="Enter email"
              required
              @blur="validateField('email')"
              @input="validateField('email')"
            />
            <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
          </div>

          <div class="field">
            <label class="label" for="phone">Phone Number*</label>
            <input
              id="phone"
              v-model.trim="formState.phone"
              class="input"
              :class="{ error: errors.phone }"
              type="tel"
              placeholder="Enter phone number"
              required
              @blur="validateField('phone')"
              @input="validateField('phone')"
            />
            <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
          </div>

          <div class="actions">
            <button type="button" class="btn btn-secondary" @click="onClose">
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary save-btn"
              :disabled="!isValid || isSaving"
            >
              <span v-if="isSaving"> Saving... </span>
              <span v-else>
                {{
                  saveAndLaunchConsultation
                    ? "Save & Launch Consultation"
                    : "Save"
                }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Duplicate patient validation modal (teleported to body-like AddPatient) -->
    <DuplicatePatientModal
      :show="showDuplicate"
      :message="duplicateMessage"
      @update:show="val => (showDuplicate = val)"
      @confirm="onDuplicateConfirm"
    />
  </teleport>
</template>

<style scoped>
* {
  box-sizing: border-box;
}
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 15, 41, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  width: min(722px, 92vw);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 28px rgba(0, 35, 102, 0.12), 0 4px 14px -1px #e5f1ff;
  padding: 32px; /* 32 all around as in Figma */
  position: relative;
  top: 25px;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 24px;
  border-bottom: 1px solid #f1f1f1;
  margin-bottom: 24px;
}
.title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #000;
}
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #333;
}
.close-btn img {
  width: 24px;
  height: 24px;
}

.form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.label {
  font-size: 14px;
  color: #666;
}
.input {
  height: 40px;
  border-radius: 8px;
  border: 1px solid #eee;
  padding: 10px 12px;
  font-size: 14px;
}
.input:focus {
  outline: none;
  border-color: #0066d4;
  box-shadow: 0 0 0 2px rgba(0, 102, 212, 0.15);
}
.input.error {
  border-color: #dc3545;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.15);
}
.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
}

select.input {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 12px center;
  background-repeat: no-repeat;
  background-size: 16px 12px;
  padding-right: 40px;
  appearance: none;
}

.actions {
  grid-column: span 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.btn {
  display: flex;
  height: 42px;
  padding: 8px 20px;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}
.btn-secondary {
  border: 1px solid #eee;
  background: #fff;
  color: #000;
  font-weight: 500;
  line-height: 150%;
}
.btn-secondary:hover {
  background: #f5f5f5;
}
.btn-primary {
  background: #0066d4;
  color: #fff;
  border: 1px solid transparent;
}
.btn-primary:hover {
  background: #0056b3;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-btn {
  width: auto;
}
@media (max-width: 640px) {
  .form {
    grid-template-columns: 1fr;
  }
  .span-2 {
    grid-column: span 1;
  }
  .actions {
    justify-content: stretch;
    gap: 12px;
  }
  .btn {
    flex: 1 1 auto;
  }
}
</style>
