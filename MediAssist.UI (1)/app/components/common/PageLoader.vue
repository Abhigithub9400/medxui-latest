<script setup lang="ts">
import { useMyStore } from "~/store/store";
const store = useMyStore();
const props = defineProps<{
  visible: boolean;
}>();
</script>

<template>
  <div v-if="visible" class="page-loader">
    <div class="loader-content">
      <!-- Animated Logo Container -->
      <div class="logo-container">
        <!-- Pulsing Circle Background -->
        <div class="pulse-circle"></div>
        
        <!-- Rotating Ring -->
        <div class="rotating-ring"></div>
        
        <!-- Logo -->
        <div class="logo">
           <img src="@/assets/logos/medi-assist-logo.svg" alt="Logo" class="loader-logo" />
        </div>
      </div>
      
      <!-- Brand Name -->
      <div class="brand-name">
        <h1>{{ store.MediAssistConfigManager.DomainName }}</h1>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/components/common/page-loader.css";
</style>