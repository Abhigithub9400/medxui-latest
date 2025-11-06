// nuxt.config.ts
import { resolve } from "path";

export default defineNuxtConfig({
  srcDir: "app/",
  
  dir: {
    public: resolve("./public"),
  },
  
  ssr: true,
  compatibilityDate: "2025-05-15",
  devtools: { enabled: false },
  
  css: [
    "@/assets/css/main.css",
    "primeicons/primeicons.css",
    "vue-sonner/style.css",
  ],
  
  runtimeConfig: {
    apiSecret: process.env.NUXT_API_SECRET || "123",
    
    public: {
      apiBaseUrl: process.env.API_BASE_URL || "http://localhost:5153",
      webSocketUrl: process.env.WEB_SOCKET_URL || "ws://localhost:5153",
      websiteUrl: process.env.WEBSITE_URL || "https://medx.dev.displayme.net",
    },
  },
  
  modules: ["@pinia/nuxt"],
  
  app: {
    baseURL: '/',
    head: {
      script: [
        {
          src: "https://checkout.razorpay.com/v1/checkout.js",
          defer: true,
        },
      ],
    },
  },

  nitro: {
    preset: 'node-server',
  },

  experimental: {
    payloadExtraction: false,
  },
});