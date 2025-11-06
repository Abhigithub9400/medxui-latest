import { useApiBaseUrl } from "~/composables/useRuntimeEnv";

export interface DoctorInfoPayload {
  UserId: string;
  MedicalCredentials: string;
  Specialization: string;
  Signature: string;
}

export interface DoctorInfoResponse {
  success: boolean;
  message?: string;
  data: {
    fullName?: string;
    medicalCredentials?: string;
    specialization?: string;
    signature?: string;
  };
}

export const useDoctorInfo = () => {
  const baseUrl = useApiBaseUrl();

  const getDoctorDetailsAPI = async (
    userId: string
  ): Promise<DoctorInfoResponse | null> => {
    try {
      return await $fetch<DoctorInfoResponse>(`${baseUrl}/profile/get`, {
        method: "GET",
        params: { userId },
        credentials: "include",
      });
    } catch (error) {
      console.error("Error fetching doctor details:", error);
      return null;
    }
  };

  const updateDoctorInfoAPI = async (
    payload: DoctorInfoPayload
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      return await $fetch<{ success: boolean; message?: string }>(
        `${baseUrl}/settings/update-doctor`,
        {
          method: "POST",
          body: payload,
          credentials: "include",
        }
      );
    } catch (error) {
      console.error("Error updating doctorInfo:", error);
      return {
        success: false,
        message: "Failed to update doctor information.",
      };
    }
  };

  return {
    getDoctorDetailsAPI,
    updateDoctorInfoAPI,
  };
};
