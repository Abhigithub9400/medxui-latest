import { createEventHook } from "@vueuse/core";

export const settingsUpdatedHook = createEventHook<{
  success: boolean;
  message: string;
  specialization?: string;
}>();