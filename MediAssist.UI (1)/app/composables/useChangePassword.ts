import { useApiBaseUrl } from "~/composables/useRuntimeEnv";
export interface ChangePasswordPayload {
  UserId: string;
  Password: string;
  NewPassword: string;
  ConfirmPassword: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  ifPasswordCorrect?: boolean;
}

export const useChangePassword = () => {
const baseUrl = useApiBaseUrl();
  const changePasswordAPI = async (
    payload: ChangePasswordPayload
  ): Promise<ApiResponse> => {
    try {
      return await $fetch<ApiResponse>(`${baseUrl}/user/change-password`, {
        method: "POST",
        body: payload,
        credentials: "include",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      return { success: false, message: "Failed to change password" };
    }
  };

  const checkPasswordAPI = async (
    userId: string,
    password: string
  ): Promise<ApiResponse> => {
    try {
      return await $fetch<ApiResponse>(`${baseUrl}/user/password-check`, {
        method: "GET",
        params: { userId, password },
        credentials: "include",
      });
    } catch (error) {
      console.error("Error checking password:", error);
      return { success: false };
    }
  };

  const logoutAPI = async (): Promise<void> => {
    try {
      await $fetch(`${baseUrl}/auth/logout`, { method: "POST" });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return {
    changePasswordAPI,
    checkPasswordAPI,
    logoutAPI,
  };
};
