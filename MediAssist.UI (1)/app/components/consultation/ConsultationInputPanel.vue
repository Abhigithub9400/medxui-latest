<script setup lang="ts">
import AnimatedMessage from "@/components/consultation/AnimatedMessage.vue";
import { useConsultationInputs } from "~/composables/useConsultationInputs";
import { ref } from "vue";

const props = defineProps<{
  sessionStopped: boolean;
  prescriptions?: { items: string[]; editIndex: number; };
}>();
const activeSection = ref("prescription");
const toggleSection = (section: string) => {
  activeSection.value = section;
};

const {
  notes,
  prescriptions,
  vitals,
  appointments,
  newNoteValue,
  newPrescriptionValue,
  newVitalValue,
  newAppointmentValue,
  addItem,
  removeItem,
  startEditing,
  finishEditing,
} = useConsultationInputs();

watch(
  () => props.prescriptions?.items,
  (newPrescriptions) => {
    if (newPrescriptions) {
      newPrescriptions.forEach((p) => {
        if (!prescriptions.value.items.includes(p)) {
          prescriptions.value.items.push(p);
        }
      });
    }
  },
  { immediate: true, deep: true }
    );

</script>

<template>
  <div class="notes-section">
    <div class="add-section-heading">
      <h3
        class="h3-responsive-size"
        :class="{ active: activeSection === 'notes' }"
        @click="toggleSection('notes')"
      >
        Add Notes
      </h3>
      <h3
        class="h3-responsive-size"
        :class="{ active: activeSection === 'prescription' }"
        @click="toggleSection('prescription')"
      >
        Add Prescription
      </h3>
      <h3
        class="h3-responsive-size"
        :class="{ active: activeSection === 'vitals' }"
        @click="toggleSection('vitals')"
      >
        Vitals
      </h3>
      <h3
        class="h3-responsive-size"
        :class="{ active: activeSection === 'nextAppointment' }"
        @click="toggleSection('nextAppointment')"
      >
        Next Appointment
      </h3>
    </div>

    <!-- Notes Section -->
    <div v-if="activeSection === 'notes'">
      <div class="notes-input-container">
        <input
          v-model="newNoteValue"
          placeholder="Write your notes here."
          @keyup.enter="addItem(notes, newNoteValue)"
          class="notes-input"
          maxlength="200"
        />
        <button class="add-note-btn" @click="addItem(notes, newNoteValue)">
          <img
            src="@/assets/consultation/union.svg"
            alt="Union Icon"
            class="union-icon"
          />
        </button>
      </div>

      <div class="notes-list">
        <div
          v-for="(note, index) in notes.items"
          :key="index"
          class="note-item"
        >
          <input
            v-if="notes.editIndex === index"
            v-model="notes.items[index]"
            @blur="finishEditing(notes, index)"
            @keyup.enter="finishEditing(notes, index)"
            class="note-text editable"
          />
          <span v-else class="note-text">{{ note }}</span>

          <button
            v-if="notes.editIndex !== index"
            class="close-btn"
            @click="startEditing(notes, index)"
          >
            <img
              src="@/assets/consultation/edit.svg"
              alt="Edit Icon"
              class="edit-icon"
            />
          </button>
          <button class="close-btn" @click="removeItem(notes, index)">
            <img
              src="@/assets/icons/close-icon.svg"
              alt="Close Icon"
              class="close-icon"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Prescription Section -->
    <div v-if="activeSection === 'prescription'">
      <div class="notes-input-container">
        <input
          v-model="newPrescriptionValue"
          placeholder="Write your prescription here."
          class="notes-input"
          maxlength="200"
          :readonly="!sessionStopped"
          :class="{ disabled: !sessionStopped }"
          @keyup.enter="addItem(prescriptions, newPrescriptionValue)"
        />
        <button
          class="add-note-btn"
          @click="addItem(prescriptions, newPrescriptionValue)"
        >
          <img
            src="@/assets/consultation/union.svg"
            alt="Union Icon"
            class="union-icon"
          />
        </button>
      </div>

      <div class="prescription-list">
        <div
          v-for="(prescription, index) in prescriptions.items"
          :key="index"
          class="note-item"
        >
          <input
            v-if="prescriptions.editIndex === index"
            v-model="prescriptions.items[index]"
            @blur="finishEditing(prescriptions, index)"
            @keyup.enter="finishEditing(prescriptions, index)"
            class="note-text editable"
            ref="editPrescriptionInput"
          />
          <span v-else class="note-text">
            <AnimatedMessage :text="prescription" />
          </span>

          <button
            v-if="sessionStopped && prescriptions.editIndex !== index"
            class="close-btn"
            @click="startEditing(prescriptions, index)"
          >
            <img
              src="@/assets/consultation/edit.svg"
              alt="Edit Icon"
              class="edit-icon"
            />
          </button>
          <button
            v-if="sessionStopped && prescriptions.editIndex !== index"
            class="close-btn"
            @click="removeItem(prescriptions, index)"
          >
            <img
              src="@/assets/icons/close-icon.svg"
              alt="Close Icon"
              class="close-icon"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Disclaimer -->
    <div v-if="activeSection === 'prescription'" class="footer">
      <p class="footer-text">
        <img
          src="@/assets/consultation/disclaimer.svg"
          alt="Disclaimer Icon"
          class="disclaimer-icon"
        />
        The prescriptions generated by AI are automatically captured from the
        conversation once the session starts and are based on the information
        provided during the consultation.
      </p>
    </div>

    <!-- Vitals Section -->
    <div v-if="activeSection === 'vitals'">
      <div class="notes-input-container">
        <input
          v-model="newVitalValue"
          placeholder="Write your vitals here."
          class="notes-input"
          maxlength="200"
          @keyup.enter="addItem(vitals, newVitalValue)"
        />
        <button class="add-note-btn" @click="addItem(vitals, newVitalValue)">
          <img
            src="@/assets/consultation/union.svg"
            alt="Union Icon"
            class="union-icon"
          />
        </button>
      </div>
      <div class="prescription-list">
        <div
          v-for="(vital, index) in vitals.items"
          :key="index"
          class="note-item"
        >
          <input
            v-if="vitals.editIndex === index"
            v-model="vitals.items[index]"
            @blur="finishEditing(vitals, index)"
            @keyup.enter="finishEditing(vitals, index)"
            class="note-text editable"
            ref="editPrescriptionInput"
          />
          <span v-else class="note-text">
            <AnimatedMessage :text="vital" />
          </span>
          <button
            v-if="vitals.editIndex !== index"
            class="close-btn"
            @click="startEditing(vitals, index)"
          >
            <img
              src="@/assets/consultation/edit.svg"
              alt="Edit Icon"
              class="edit-icon"
            />
          </button>
          <button
            v-if="vitals.editIndex !== index"
            class="close-btn"
            @click="removeItem(vitals, index)"
          >
            <img
              src="@/assets/icons/close-icon.svg"
              alt="Close Icon"
              class="close-icon"
            />
          </button>
        </div>
      </div>
    </div>

   <!-- Next Appointment Section -->
   <div v-if="activeSection === 'nextAppointment'">
      <div v-if="appointments.items.length === 0" class="notes-input-container appointment-input">
        <input
          ref="dateInput"
          type="date"
          placeholder="DD-MM-YYYY"
          name="newAppointmentValue"
          id="newAppointment"
          v-model="newAppointmentValue"
          class="notes-input dob-picker"
          @keyup.enter="addItem(appointments, newAppointmentValue)"
         @blur="formatDate"
        />
        <button class="add-note-btn" @click="addItem(appointments, newAppointmentValue)">
          <img
            src="@/assets/consultation/union.svg"
            alt="Union Icon"
            class="union-icon"
          />
        </button>
      </div>

      <div v-if="appointments.items.length > 0" class="appointment-display">
        <div class="note-item appointment-item">
          <input
            v-if="appointments.editIndex === 0"
            v-model="appointments.items[0]"
            type="date"
            @blur="finishEditing(appointments, 0)"
            @keyup.enter="finishEditing(appointments, 0)"
            class="note-text editable"
          />
          <span v-else class="note-text appointment-text">
            {{ appointments.items[0] ? new Date(appointments.items[0]).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : 'Invalid Date' }}
          </span>

            <button
              v-if="appointments.editIndex !== 0"
              class="close-btn"
              @click="startEditing(appointments, 0)"
              title="Edit appointment"
            >
              <img
                src="@/assets/consultation/edit.svg"
                alt="Edit Icon"
                class="edit-icon"
              />
            </button>
            <button 
              class="close-btn" 
              @click="removeItem(appointments, 0)"
              title="Remove appointment"
            >
              <img
                src="@/assets/icons/close-icon.svg"
                alt="Close Icon"
                class="close-icon"
              />
            </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/components/consultation/consultation-input-panel.css";
</style>
