import { useApiBaseUrl } from "~/composables/useRuntimeEnv";
export interface LogoutResponse {
  success: boolean;
  message?: string;
}

export const useLogout = () => {
const baseUrl = useApiBaseUrl();

  const logout = async (): Promise<LogoutResponse> => {
    try {
      const response = await $fetch<LogoutResponse>(
        `${baseUrl}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      return {
        success: true,
        message: response?.message || "Logged out successfully",
      };
    } catch (error) {
      console.error("Logout failed:", error);
      return {
        success: false,
        message: "Logout failed. Please try again.",
      };
    }
  };

  return { logout };
};
