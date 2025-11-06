import { ref } from 'vue';
import { useApiBaseUrl } from "~/composables/useRuntimeEnv";

interface ProfileData {
  success: boolean;
  message?: string;
  data?:{
  email: string;
  fullName: string;
  title: number;
  gender: number;
  image: string | null;
  dob: string;
  licenseNumber: string;
  medicalCredentials: number;
  specialization: string;
  signature: string;
  countryId: number;
  }
}

export const useProfileService = () => {
  const baseUrl = useApiBaseUrl();
  const isLoading = ref(false);
  const error = ref<string | undefined>(undefined);

  const updateProfile = async (
    payload: any
  ): Promise<{ success: boolean; message: string; data?: any }> => {
    try {
      const response = await $fetch<{ success: boolean; message: string; data?: any }>(
        `${baseUrl}/profile/update`,
        {
          method: 'POST',
          body: payload,
          credentials: 'include',
        },
      );
      return response;
    } catch (err:any) {
      error.value = err?.data?.message || 'Profile update failed';
      return {
        success: false,message: "An error occurred while creating your account.",
      };
    }
  };

  const getProfile = async (
    userId: string
  ): Promise<ProfileData> => {
    try {
      return await $fetch<any>(`${baseUrl}/profile/get`, {
        method: "GET",
        credentials: "include",
        params: { UserId: userId },
      });
      
    } catch (err: any) {
      error.value = err?.data?.message || "Failed to fetch profile details";
      return {
        success: false,
        message: "An error occurred while fetching your profile.",
        data : undefined
      };
    }
  };
  
  

  const deleteAccount = async (
    userId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await $fetch<{ success: boolean; message: string }>(
        `${baseUrl}/profile/delete`,
        {
          method: 'DELETE',
          params: { UserId: userId },
          credentials: 'include',
        }
      );
      return response;
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to delete account';
      return {
        success: false,
        message: "An error occurred while deleting your account.",
      };
    }
  };
  

  return{updateProfile,getProfile,deleteAccount,isLoading,error};
};
