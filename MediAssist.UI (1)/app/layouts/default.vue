<script setup lang="ts">
import AppLogo from "~/components/common/AppLogo.vue";
import { useRouter } from "vue-router";

const router = useRouter();
const redirectToSignUp = () => {
  router.push("/signup");
};

const redirectToSignIn = () => {
  router.push("/login");
};
</script>

<template>
  <div class="website login-container">
    <div class="image-side">
      <img src="@/assets/login/loginPageImage.jpg" alt="login page" />
    </div>

    <div class="form-side">
      <header class="header-container">
        <div class="logo">
          <AppLogo />
        </div>
        <p v-if="$route.path === '/login'" class="signup-option">
          Don’t have an account?
          <a href="/signup" @click="redirectToSignUp">SignUp</a>
        </p>

        <p v-else-if="$route.path === '/signup'" class="signup-option">
          Already have an account?
          <a href="/login" @click="redirectToSignIn">SignIn</a>
        </p>
      </header>
      <slot />
    </div>
  </div>
</template>

<style scoped>
@import "~/assets/css/layouts/default.css";
</style>
