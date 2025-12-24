interface Country {
  countryId: number;
  countryName: string;
}

interface Tittle{
  Id: number;
  Title: string
  Abbreviations : string
}

interface Gender{
  Id: number;
  Gender: string
}

interface MedicalCredentials{
  Id: number;
  MedicalCredentials: string
}

type SignupFormResponse = {
  countries: Country[];
  userTitles: Tittle[];
  userGenders: Gender[];
  doctorMedicalCredentials: MedicalCredentials[];
  message?: string;
}

type SignupFormTransformed = {
  countries: Country[];
  titles: Tittle[];
  gender: Gender[];
  medicalCredentials: MedicalCredentials[];
  message?: string;
}
import { ref } from 'vue';
import { useFetch } from 'nuxt/app'
import { useApiBaseUrl } from "~/composables/useRuntimeEnv";

export const useSignupService = () => {
  const baseUrl = useApiBaseUrl();
  const error = ref<string | undefined>(undefined);

 const signUpUser = async (
  payload: any
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await $fetch<{ success: boolean; message: string }>(
      `${baseUrl}/auth/signup`,
      {
        method: 'POST',
        body: payload,
      },
    );

    return response;
  } catch (err:any) {
    error.value = err?.data?.message || 'Signup failed';
    return {
      success: false,message: "An error occurred while creating your account.",
    };
  }
};

 const checkDuplicateEmail = async (
  emailId: string
): Promise<{ isDuplicate: boolean; message?: string }> => {
  error.value = undefined;
  try {
    const response = await $fetch<{ ifEmailExist: boolean }>(
      `${baseUrl}/auth/emailcheck`,
      {
        method: 'GET',
        query: { emailId }, // changed 'params' to 'query' for consistency
      }
    );

    return {
      isDuplicate: response.ifEmailExist,
    };
  } catch (err: any) {
    error.value =
      err?.data?.message || "An error occurred while checking the email.";
    return {
      isDuplicate: false,
      message: error.value,
    };
  } 
};

      

const checkDuplicateLicense = async (
  licenseNumber: string
): Promise<{ isDuplicate: boolean; message?: string }> => {
  error.value = undefined;
  try {
    const response = await $fetch<{ isDuplicate: boolean }>(
      `${baseUrl}/auth/check-duplicate-license`,
      {
        method: 'GET',
        query: { licenseNumber }, // Use 'query' instead of 'params' to align with the other function
      }
    );

    return {
      isDuplicate: response.isDuplicate,
    };
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      "An error occurred while checking the license number.";
    return {
      isDuplicate: false,
      message: error.value,
    };
  } 
};



 const getLicenseRegexPattern = async (
  countryId: string
): Promise<{ pattern: RegExp | null; message?: string }> => {
  error.value = undefined;
  try {
    const response = await $fetch<{ regexPattern: string }>(
      `${baseUrl}/auth/license-pattern/${countryId}`,
      {
        method: 'GET',
      }
    );

    const rawPattern = response.regexPattern;
    const cleanedPattern = rawPattern.replace(/(^\/|\/$)/g, '');


    return {
      pattern: new RegExp(cleanedPattern),
    };
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      "An error occurred while fetching the license pattern.";
    return {
      pattern: null,
      message: error.value,
    };
  } 
};

const getInitialData = async (): Promise<{
  countries: Country[];
  titles: Tittle[];
  gender: Gender[];
  medicalCredentials: MedicalCredentials[];
  message?: string;
  success: boolean
}> => {
  error.value = undefined;

  const { data, error: fetchError } = await useFetch<{
    success: boolean;
    message: string;
    data: {
      countries: Country[];
      userTitles: Tittle[];
      userGenders: Gender[];
      doctorMedicalCredentials: MedicalCredentials[];
    };
  }>(`${baseUrl}/auth/signup-form-data`, {
    method: 'GET',
  });

  const response = data.value;
  if (fetchError.value || !response?.success) {
    error.value =
      fetchError.value?.data?.message ||
      response?.message ||
      "An error occurred while fetching initial data.";
    return {
      countries: [],
      titles: [],
      gender: [],
      medicalCredentials: [],
      message: error.value,
      success: false
    };
  }

  const payload = response.data;

  return {
    countries: payload.countries ?? [],
    titles: payload.userTitles ?? [],
    gender: payload.userGenders ?? [],
    medicalCredentials: payload.doctorMedicalCredentials ?? [],
    message: response.message,
    success: true
  };
};



return {
  error,
  signUpUser,
  checkDuplicateEmail,
  checkDuplicateLicense,
  getLicenseRegexPattern,
  getInitialData,
};
};







