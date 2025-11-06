
  <script setup lang="ts">
    import { ref, onMounted, defineEmits } from "vue";

    const emit = defineEmits(["closePopup"]);
    const showPotentialDiagnosisPopup = ref(true);

    onMounted(() => {
    setTimeout(() => {
        showPotentialDiagnosisPopup.value = false;
        emit("closePopup");
    }, 7000);
    });

    const closePopup = () => {
    showPotentialDiagnosisPopup.value = false;
    emit("closePopup");
    };
  </script>

<template>
  <transition name="fade">
    <div v-if="showPotentialDiagnosisPopup" class="diagnosis-popup">
      <div class="popup-content">
        <div class="diagnosis-icon">
          <img src="~/assets/consultation/potential-diagnosis-popup-icon.svg" alt="Potential Diagnosis Popup Icon" class="popup-icon" />
        </div>
        <p class="diagnosis-tooltip-text">
          If you prefer not to use the AI-powered <b>Potential Diagnosis</b> feature, you can easily switch it off before starting the session.
        </p>
        <button @click="closePopup" class="popup-button">Okay</button>
      </div>
      <div>
          <img src="~/assets/consultation/downarrow-diagnosispopup.svg" alt="Potential Diagnosis Popup Down Arrow Icon" class="down-arrow" />
      </div>
    </div>
  </transition>
</template>

<style scoped>
@import "~/assets/css/components/alerts/potential-diagnosis-popUp.css";
</style>
  
  
  