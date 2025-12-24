import { ref, computed, readonly } from "vue";
import { useApiBaseUrl } from "~/composables/useRuntimeEnv";
import type { Patient } from "~/types/interfaces/Patient";
import type { ResultResponse } from "~/types/utils/ResultResponse";

export interface PatientDetailResponse {
  id: number;
  mrn?: string;
  userName: string;
  sessions: number;
  age: number;
  email: string;
  phoneNumber: string;
  gender?: string;
  dob?: string;
}

export interface PatientFilters {
  search?: string;
  ageRange?: { min: number; max: number };
  sessionCount?: { min: number; max: number };
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

interface PatientDetailsResponseApi {
  totalCount: number;
  patients: Array<{
    patientId: number;
    userName: string;
    mrnNumber?: string;
    numberOfSessions: number;
    age: string;
    emailId: string | null;
    phoneNumber: string | null;
    gender?: string;
    dob?: string;
  }>;
}

interface ApiEnvelope<T> {
  data: T;
  success: boolean;
  message: string;
}

// Single patient state
const patient = ref<Patient>({
  id: 0,
  age: 0,
  mrn: "",
  name: "",
  email: "",
  gender: "",
  dob: "",
});

export const usePatientService = () => {
  const baseUrl = useApiBaseUrl();
  const patients = ref<PatientDetailResponse[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Helpers to reduce duplication
  const calculateAgeFromDob = (dob: string): number => {
    if (!dob) return 0;
    const dobDate = new Date(dob);
    if (Number.isNaN(dobDate.getTime())) return 0;
    const today = new Date();
    const years = today.getFullYear() - dobDate.getFullYear();
    const monthDiff = today.getMonth() - dobDate.getMonth();
    const birthdayNotPassed =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate());
    return birthdayNotPassed ? years - 1 : years;
  };

  type ApiPatient = {
    patientId: number;
    userName: string;
    mrnNumber?: string;
    numberOfSessions: number;
    age: string;
    emailId: string | null;
    phoneNumber: string | null;
    gender?: string;
    dob?: string;
  };

  const normalizeGender = (gender?: string): string | undefined => {
    if (!gender) return undefined;
    const g = String(gender).toLowerCase();
    if (g === "m" || g === "male") return capitalizeGender("male");
    if (g === "f" || g === "female") return capitalizeGender("female");
    if (g === "transgender") return capitalizeGender("transgender");
    if (g === "non-binary" || g === "nonbinary") return capitalizeGender("non-binary");
    if (g === "prefer-not-to-say" || g === "prefer not to say")
      return capitalizeGender("prefer-not-to-say");
    return capitalizeGender(g);
  };

  const mapApiPatientToDetail = (p: ApiPatient): PatientDetailResponse => ({
    id: p.patientId,
    mrn: p.mrnNumber,
    userName: p.userName,
    sessions: p.numberOfSessions ?? 0,
    age: Number.parseInt(p.age || "0", 10) || 0,
    email: p.emailId ?? "",
    phoneNumber: p.phoneNumber ?? "",
    gender: normalizeGender(p.gender),
    dob: p.dob,
  });

  const commonFetchOptions = {
    credentials: "include" as const,
  };
  const pagination = ref<PaginationParams>({
    page: 1,
    limit: 10,
    total: 0,
  });
  const filters = ref<PatientFilters>({});

  const fetchPatients = async (params?: {
    page?: number;
    limit?: number;
    filters?: PatientFilters;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const page = params?.page ?? pagination.value.page;
      const limit = params?.limit ?? pagination.value.limit;

      const response = await $fetch<ApiEnvelope<PatientDetailsResponseApi>>(
        `${baseUrl}/patient/details`,
        {
          method: "GET",
          credentials: "include",
          params: {
            Skip: (page - 1) * limit,
            Top: limit,
            SearchBy: params?.filters?.search ? "UserName" : undefined,
            SearchTerm: params?.filters?.search || undefined,
            SortBy: "UserName",
            SortOrder: "asc",
            IsOrganizationRequired: false,
          },
        }
      );

      const payload = response?.data;
      const mapped: PatientDetailResponse[] = (payload?.patients || []).map(
        mapApiPatientToDetail
      );

      patients.value = mapped;
      pagination.value = {
        page,
        limit,
        total: payload?.totalCount ?? 0,
      };
    } catch (err) {
      error.value = "Failed to fetch patients";
      console.error("Error fetching patients:", err);
    } finally {
      loading.value = false;
    }
  };

  const setSelectedPatient = (selected: Patient) => {
    patient.value = {
      id: selected.id ?? 0,
      mrn: selected.mrn ?? "",
      name: selected.name ?? "",
      email: selected.email ?? "",
      gender: selected.gender ?? "",
      dob: selected.dob ?? "",
      age: selected.age ?? 0,
    };
  };

  const setSelectedPatientFromDetail = (detail: PatientDetailResponse) => {
    patient.value = {
      id: detail.id,
      name: detail.userName,
      email: detail.email,
      gender: detail.gender,
      mrn: detail.mrn,
      age: detail.age,
      dob: detail.dob,
    };
  };

  const createPatient = async (
    patientData: Omit<PatientDetailResponse, "id">
  ) => {
    loading.value = true;
    error.value = null;

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newPatient: PatientDetailResponse = {
        ...patientData,
        id: Date.now(),
      };

      patients.value.unshift(newPatient);
      pagination.value.total += 1;

      return newPatient;
    } catch (err) {
      error.value = "Failed to create patient";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const savePatient = async (payload: {
    mrn: string;
    name: string;
    dob: string;
    gender: string;
    email: string;
    phone: string;
  }): Promise<ResultResponse<{ id: number }>> => {
    loading.value = true;
    error.value = null;
    try {
      const { getUserInfoPropertyFromCookie } = await import(
        "~/composables/useCookieService"
      );
      const userId = getUserInfoPropertyFromCookie("userId");

      if (!userId) {
        throw new Error("User ID not found");
      }

      // Calculate age from DOB
      const calculatedAge = calculateAgeFromDob(payload.dob);

      const response = await $fetch<ResultResponse<Patient>>(
        `${baseUrl}/patient/save`,
        {
          method: "POST",
          ...commonFetchOptions,
          body: {
            userId: userId,
            emailId: payload.email,
            phoneNumber: payload.phone,
            patientId: 0,
            clinicId: 1, // Default clinic Id
            patientConsent: true,
            patient: {
              patientId: 0, // New patient
              mrn: payload.mrn || undefined,
              name: payload.name,
              gender: payload.gender,
              age: calculatedAge,
              dob: payload.dob,
            },
          },
        }
      );
      return response;
    } catch (err) {
      error.value = "Failed to save patient";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updatePatient = async (
    id: number,
    patientData: {
      email: string;
      phone: string;
    }
  ): Promise<ResultResponse> => {
    loading.value = true;
    error.value = null;

    try {
      const { getUserInfoPropertyFromCookie } = await import(
        "~/composables/useCookieService"
      );
      const userId = getUserInfoPropertyFromCookie("userId");

      if (!userId) {
        throw new Error("User Id not found");
      }

      const response = await $fetch<ResultResponse>(
        `${baseUrl}/patient/update-contact/${id}`,
        {
          method: "PUT",
          ...commonFetchOptions,
          body: {
            EmailId: patientData.email,
            PhoneNumber: patientData.phone,
            ModifiedBy: userId,
          },
        }
      );

      // Update local cache for email/phone if present
      const patientIndex = patients.value.findIndex((p) => p.id === id);
      if (patientIndex !== -1 && response?.success) {
        patients.value[patientIndex] = {
          ...patients.value[patientIndex],
          email: patientData.email,
          phoneNumber: patientData.phone,
        };
      }

      return response;
    } catch (err) {
      error.value = "Failed to update patient";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deletePatient = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const patientIndex = patients.value.findIndex((p) => p.id === id);
      if (patientIndex !== -1) {
        patients.value.splice(patientIndex, 1);
        pagination.value.total -= 1;
        return true;
      } else {
        throw new Error("Patient not found");
      }
    } catch (err) {
      error.value = "Failed to delete patient";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getPatientById = async (
    id: number
  ): Promise<PatientDetailResponse | null> => {
    loading.value = true;
    error.value = null;

    try {
      // First try to find in local cache
      const localPatient = patients.value.find((p) => p.id === id);
      if (localPatient) {
        return localPatient;
      }

      // If not found locally, fetch from API
      const response = await $fetch<ApiEnvelope<ApiPatient>>(
        `${baseUrl}/patient/${id}`,
        {
          method: "GET",
          ...commonFetchOptions,
        }
      );

      if (response?.data) {
        return mapApiPatientToDetail(response.data);
      }

      return null;
    } catch (err) {
      console.error("Fetch patient failed:", err);
      error.value = "Failed to fetch patient";
      return null;
    } finally {
      loading.value = false;
    }
  };

  // search by username
  const searchPatientsByUserName = async (
    userName: string
  ): Promise<Patient[]> => {
    await fetchPatients({ filters: { search: userName } });
    return patients.value;
  };

  const resetPatient = () => {
    patient.value = {
      id: 0,
      name: "",
      age: 0,
      email: "",
      gender: "",
      dob: "",
    };
  };

  // Computed properties
  const totalPages = computed(() =>
    Math.ceil(pagination.value.total / pagination.value.limit)
  );
  const hasNextPage = computed(() => pagination.value.page < totalPages.value);
  const hasPreviousPage = computed(() => pagination.value.page > 1);
  const startIndex = computed(
    () => (pagination.value.page - 1) * pagination.value.limit + 1
  );
  const endIndex = computed(() =>
    Math.min(
      pagination.value.page * pagination.value.limit,
      pagination.value.total
    )
  );

  return {
    // State
    patients: readonly(patients),
    patient,
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    filters: readonly(filters),

    // Computed
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,

    // Methods
    fetchPatients,
    createPatient,
    updatePatient,
    deletePatient,
    getPatientById,
    searchPatientsByUserName,
    resetPatient,
    setSelectedPatient,
    setSelectedPatientFromDetail,
    savePatient,

    // Filters
    setFilters: (newFilters: PatientFilters) => {
      filters.value = newFilters;
    },
    clearFilters: () => {
      filters.value = {};
    },

    // Pagination
    setPage: (page: number) => {
      pagination.value.page = page;
    },
    setLimit: (limit: number) => {
      pagination.value.limit = limit;
      pagination.value.page = 1;
    },
  };
};
