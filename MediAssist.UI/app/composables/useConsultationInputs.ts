import { ref, nextTick, type Ref } from "vue";

export interface EditableList {
  items: string[];
  editIndex: number;
}

const notes = ref<EditableList>({ items: [], editIndex: -1 });
const prescriptions = ref<EditableList>({ items: [], editIndex: -1 });
const vitals = ref<EditableList>({ items: [], editIndex: -1 });
const appointments = ref<EditableList>({ items: [], editIndex: -1 });

export const useConsultationInputs = () => {
  const newNoteValue = ref("");
  const newPrescriptionValue = ref("");
  const newVitalValue = ref("");
  const newAppointmentValue = ref("");

  const addItem = (
    list: EditableList,
    newValue: Ref<string> | string,
    resetFn?: () => void
  ) => {
    const value = typeof newValue === "string" ? newValue : newValue.value;
    if (!value.trim()) return;

    list.items.push(value.trim());
    newNoteValue.value = "";
    newPrescriptionValue.value = "";
    newVitalValue.value = "";
    newAppointmentValue.value = "";
    if (resetFn) {
      resetFn();
    } else if (typeof newValue !== "string") {
      newValue.value = "";
    }
  };

  const removeItem = (list: EditableList, index: number) => {
    if (index >= 0 && index < list.items.length) {
      list.items.splice(index, 1);
    }
  };

  const startEditing = (list: EditableList, index: number) => {
    list.editIndex = index;
    nextTick(() => {
      const inputElement = document.querySelector(
        `.note-item:nth-child(${index + 1}) input.note-text.editable`
      );
      if (inputElement instanceof HTMLInputElement) {
        inputElement.focus();
        inputElement.select();
      }
    });
  };

  const finishEditing = (list: EditableList, index: number) => {
    if (!list.items[index]?.trim()) {
      removeItem(list, index);
    }
    list.editIndex = -1;
  };

  return {
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
  };
};
