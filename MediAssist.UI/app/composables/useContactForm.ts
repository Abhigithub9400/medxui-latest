import { useApiBaseUrl } from "~/composables/useRuntimeEnv";

interface ResultResponse {
  success: boolean;
  message: string;
}

export function useContactForm(form: any, options: { selectedPlan: string }) {
  const baseUrl = useApiBaseUrl();

  const submitForm = async (selectedPlan: string) => {
    try {
      return await $fetch<ResultResponse>(`${baseUrl}/email/subscription`, {
        method: "POST",
        body: {
          Name: form.name,
          Email: form.email,
          CountryCode: form.countryCode,
          Phone: form.phoneNumber,
          Requirements: form.requirements,
          SelectedPlan: selectedPlan,
        },
      });
    } catch (error: any) {
      return {
        success: false,
        message:
          "An unexpected error occurred while processing your subscription plan enquiry.Please try again later.",
      };
    }
  };

  return {
    submitForm,
  };
}
