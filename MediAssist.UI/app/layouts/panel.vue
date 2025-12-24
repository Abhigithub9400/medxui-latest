<script setup lang="ts">
import Sidebar from "@/components/common/SideMenu.vue";
import Icon from "@/assets/icons/doctor.svg";
import { ref, onMounted, onBeforeMount } from "vue";
import ProfileDropDown from "~/components/common/ProfileDropDown.vue";
import { useRoute } from "vue-router";
import { getUserInfoPropertyFromCookie } from "@/composables/useCookieService";
import { useEventListener } from "@vueuse/core";
import ALERTMESSAGE from '@/components/alerts/AlertMessage.vue';
import { alertMessage, alertType, isAlertVisible, closeAlert } from "~/composables/useAlertService";
import { useMyStore } from "~/store/store";

const image = ref("");
const menuOpen = ref(false);
const userId = ref("");
const route = useRoute();
 const store = useMyStore();

// const pageTitle = computed(() => {
//   const path = route.path;
//   if (path.includes("dashboard")) return "Dashboard";
//   if (path.includes("profile")) return "Profile";
//   if (path.includes("settings")) return "Settings";
//   if (path.includes("subscription")) return "Subscription";
//   if (path.includes("consultation")) return "Consultation";
//   if (path.includes("patient-listing")) return "Patients";
//   if (path.includes("patient")) return "Patient History";
//   return "Page";
// });

const handleClickOutside = (event: MouseEvent) => {
  const menu = document.querySelector(".fee__user-profile");
  const userIcon = document.querySelector(".fee__user-avatar");

  if (
    menu &&
    userIcon &&
    !menu.contains(event.target as Node) &&
    !userIcon.contains(event.target as Node)
  ) {
    menuOpen.value = false;
  }
};

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

// Lifecycle Hooks
onMounted(() => {
  userId.value = getUserInfoPropertyFromCookie("userId") || "";
  const imageValue = localStorage.getItem("image");

  let imageType = "png";
  if (imageValue && imageValue !== "null") {
    if (imageValue.startsWith("/9j")) {
      imageType = "jpeg";
    }
    image.value = `data:image/${imageType};base64,${imageValue}`;
  } else {
    image.value = Icon;
  }

  useEventListener(document, "click", handleClickOutside);
  window.addEventListener("image-updated", (e: Event) => {
    const detail = (e as CustomEvent).detail as { image?: string };
    const value = detail?.image ?? localStorage.getItem("image") ?? "";
    let imgType = "png";
    if (value && value.startsWith("/9j")) {
      imgType = "jpeg";
    }
    image.value = value ? `data:image/${imgType};base64,${value}` : Icon;
  });
});

onBeforeMount(async () => {
  const uid = getUserInfoPropertyFromCookie("userId") || "";
  if (!uid) return;

  userId.value = uid;
});
</script>

<template>
  <div class="fee">
    <div class="fee__sidebar">
      <Sidebar />
    </div>
  
    <div class="fee__content">
      <header class="fee__header">
        <div class="label">
          <NuxtLink to="/dashboard" class="app-name">{{ store.MediAssistConfigManager.DomainName }}</NuxtLink>
        </div>
        <!-- <div class="fee__header-title">
          <NuxtLink to="/dashboard" class="fee__header-title">Home </NuxtLink>
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd"
              d="M0.674613 0.269107C0.884276 0.100628 1.19993 0.123391 1.37964 0.31995L5.37964 4.69495C5.54013 4.87049 5.54013 5.12952 5.37964 5.30507L1.37964 9.68007C1.19993 9.87663 0.884276 9.89939 0.674613 9.73091C0.46495 9.56243 0.44067 9.26651 0.620381 9.06995L4.34147 5.00001L0.620381 0.930067C0.44067 0.733508 0.46495 0.437586 0.674613 0.269107Z"
              fill="#707070" />
          </svg>
          {{ pageTitle }}
        </div> -->
        <ALERTMESSAGE :message="alertMessage" :type="alertType" :isVisible="isAlertVisible" @close="closeAlert" />
        <div class="fee__header-actions">
          <div class="fee__user-menu">
            <img :src="image" alt="Doctor Icon" class="fee__user-avatar" @click="toggleMenu" />
          </div>
          <div class="fee__user-profile">
            <ProfileDropDown :menuOpen="menuOpen" />
          </div>
        </div>
      </header>
      <main>
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/pages/subscription.css";
</style>
