<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError
})
</script>

<template>
    <div class="container">
        <img class="responsive-svg" src="@/assets/error/error.svg" alt="My Icon" />
    </div>
  </template>

<style scoped>
@import "~/assets/css/pages/error.css";
</style>
