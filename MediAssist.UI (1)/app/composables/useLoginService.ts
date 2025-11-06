import { ref } from "vue";

export interface ValidateResetTokenResponse {
  success: boolean;
  message?: string;
  data:{
  email?: string;
  }
}

export const useLoginService = () => {
  const config = useRuntimeConfig();
 const baseUrl = config.public.apiBaseUrl;
  const loading = ref(false);
  const error = ref<string | undefined>(undefined);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; token?: string; message?: string }> => {
    loading.value = true;
    error.value = undefined;
    try {
      const result = await $fetch<{
        success: boolean;
        token?: string;
        message?: string;
      }>(`${baseUrl}/auth/login`, {
        method: "POST",
        credentials: "include",
        body: {
          Email: email,
          Password: password,
        },
      });
      return result;
    } catch (err: any) {
      error.value = err?.data?.message || "Login failed";
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const verifyLoginOtp = async (
    email: string,
    verificationCode: string,
    remember: boolean
  ): Promise<any> => {
    loading.value = true;
    error.value = undefined;
    try {
      return await $fetch(`${baseUrl}/auth/login/verify`, {
        method: "POST",
        credentials: "include",
        body: {
          Email: email,
          VerificationCode: verificationCode,
          RememberMe: remember,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err: any) {
      error.value = err?.data?.message || "OTP verification failed";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const clearOtp = async (): Promise<void> => {
    loading.value = true;
    error.value = undefined;
    try {
      await $fetch(`${baseUrl}/auth/login/clear-otp`, {
        method: "POST",
      });
    } catch (err: any) {
      error.value = err?.data?.message || "Failed to clear OTP";
    } finally {
      loading.value = false;
    }
  };

  const resendOtp = async (email: string): Promise<void> => {
    loading.value = true;
    error.value = undefined;
    try {
      await $fetch(`${baseUrl}/auth/login/verify/resend`, {
        method: "POST",
        body: { Email: email },
      });
    } catch (err: any) {
      error.value = err?.data?.message || "Failed to resend OTP";
    } finally {
      loading.value = false;
    }
  };

  const forgetPassword = async (
    email: string
  ): Promise<{ success: boolean; message?: string }> => {
    loading.value = true;
    error.value = undefined;
    try {
      return await $fetch(`${baseUrl}/user/forgot-password?email=${email}`, {
        method: "POST",
      });
    } catch (err: any) {
      error.value = err?.data?.message || "Forget password failed";
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const resetPassword = async (
    newPassword: string,
    confirmPassword: string,
    userEmailId: string,
    token: string
  ): Promise<{ success: boolean; message?: string }> => {
    loading.value = true;
    error.value = undefined;
    try {
      return await $fetch(`${baseUrl}/user/reset-password`, {
        method: "POST",
        body: {
          Password: newPassword,
          ConfirmPassword: confirmPassword,
          Email: userEmailId,
          Token: token,
        },
      });
    } catch (err: any) {
      error.value = err?.data?.message || "Password reset failed. Please try again.";
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  };

  const validateResetPasswordToken = async (
    token: string,
    uid: string
  ): Promise<ValidateResetTokenResponse> => {
    loading.value = true;
    error.value = undefined;
    try {
      return await $fetch(`${baseUrl}/user/validate-reset-token`, {
        method: 'GET',
        params: { token, uid },
      });
    } catch (err: any) {
      error.value = err?.data?.message || "Token validation failed";
      return { success: false, message: error.value, data: {email: ""} };
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    login,
    verifyLoginOtp,
    clearOtp,
    resendOtp,
    forgetPassword,
    resetPassword,
    validateResetPasswordToken,
  };
};
