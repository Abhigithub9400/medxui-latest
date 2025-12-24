import { useApiBaseUrl } from "~/composables/useRuntimeEnv";

export interface ClinicPayload {
  ClinicId?: number;
  UserId: string;
  ClinicName: string;
  ClinicAddress: string;
  PhoneNumber: string;
  CountryCode: string;
  Email: string | null;
  Website: string;
  Logo: string;
}

export interface ClinicResponse {
  success: boolean;
  message?: string;
  data:{
  clinicId?: number;
  clinicName?: string;
  clinicAddress?: string;
  phoneNumber?: string;
  countryCode?: string;
  email?: string;
  website?: string;
  logo?: string;
  }
}

export const useClinic = () => {
  const baseUrl = useApiBaseUrl();

  const getClinicDetailsAPI = async (
    userId: string
  ): Promise<ClinicResponse | null> => {
    try {
      return await $fetch<ClinicResponse>(`${baseUrl}/settings/get-clinic`, {
        method: "GET",
        params: { userId },
        credentials: "include",
      });
    } catch (error) {
      console.error("Error fetching clinic details:", error);
      return null;
    }
  };

  const updateClinicAPI = async (
    payload: ClinicPayload
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      return await $fetch<{ success: boolean; message?: string }>(
        `${baseUrl}/settings/update-clinic`,
        {
          method: "POST",
          body: payload,
          credentials: "include",
        }
      );
    } catch (error) {
      console.error("Error updating clinic:", error);
      return {
        success: false,
        message: "Failed to update clinic information.",
      };
    }
  };

  return {
    getClinicDetailsAPI,
    updateClinicAPI,
  };
};
