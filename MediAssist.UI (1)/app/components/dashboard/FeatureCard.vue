<script setup lang="ts">
defineProps<{
  icon: string;
  title: string;
  description: string;
}>();
</script>

<template>
  <div class="feature-card">
    <img :src="icon" alt="Feature Icon" class="feature-icon" />
    <div class="feature-details">
      <h3 class="feature-title">{{ title }}</h3>
      <p class="feature-description">{{ description }}</p>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/components/dashboard/feature-card.css";
</style>
