<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import {defineProps, onMounted} from 'vue';
import { useMyStore } from "~/store/store";

const props = defineProps({
  fromDashboard : {
    type: Boolean,
    default: false,
  }
})

const router = useRouter();
const route = useRoute();
 const store = useMyStore();
let branding;

onMounted(() => {
  branding = document.querySelector("#branding");
  if (route.path === '/dashboard' && branding instanceof HTMLElement) {
    branding.style.color = 'white';
  }
});


const goHome = () => {
  if (props.fromDashboard ) {
    router.push('/dashboard');
  } else {
    router.push('/login');
  }
};
</script>

<template>
  <div class="website logo" @click="goHome">
    <img
      src="@/assets/logos/medi-assist-logo.svg"
      alt="MediAssist"
      class="icon"
    />
    <h4 class="h4-bold" id="branding">{{ store.MediAssistConfigManager.DomainName }}</h4>
  </div>
</template>

<style scoped>
@import "~/assets/css/components/common/applogo.css";
</style>
