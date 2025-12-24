<script setup lang="ts">
import { useMyStore } from "~/store/store";
import AppLogo from "~/components/common/AppLogo.vue";

const store = useMyStore();
const fromDashboard = ref(false);
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="content">
        <div class="left-section">
          <div class="logo">
            <AppLogo :fromDashboard="(fromDashboard = true)" />
          </div>
        </div>
        <div class="right-section">
          <div class="powered-by sm-regular">
            <p>powered by</p>
            <img src="@/assets/logos/pits-logo.png" class="pits-logo" alt="pits-logo" />
          </div>
        </div>
      </div>
      <div class="copyright">
        <hr />
        <p class="sm-regular">
          Copyright © {{ store.MediAssistConfigManager.DomainName }}. All rights
          reserved.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
@import "~/assets/css/components/common/footer.css";
</style>
