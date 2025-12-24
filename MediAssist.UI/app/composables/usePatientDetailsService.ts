import { useApiBaseUrl } from "~/composables/useRuntimeEnv";
import type { ConsultationDetails } from "~/types/interfaces/Consultation";
import type { PatientHistory } from "~/types/interfaces/Patient";

      const patientDetails = ref<PatientHistory>();
      const consultationDetails = ref<ConsultationDetails>();

export const usePatientDetailsService = () => {
      const baseUrl = useApiBaseUrl();
      const { id } = useRoute().params;

    const getConsultationData = async (id:number) => {
        try {
       const response = await $fetch<ConsultationDetails>(
        `${baseUrl}/consultation/${id}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (response) {
        consultationDetails.value = response;
        return consultationDetails;
      }
    } catch (err: any) {
      throw new Error(err?.data?.message || "Failed to generate report.");
    }
      };
    const getPatientDetails =  async () => {
try {
       const response = await $fetch<PatientHistory>(
        `${baseUrl}/patient/${id}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (response) {
        patientDetails.value = response;
        return response;
      }
    } catch (err: any) {
      throw new Error(err?.data?.message || "Failed to generate report.");
    }
    };

    const getPatientHistoryData = async () => {
      const patient = await getPatientDetails();
      if(patient?.consultations && patient?.consultations.length !== 0){
        const latest = patient?.consultations?.reduce((a, b) =>
          new Date(a.createdAt) > new Date(b.createdAt) ? a : b
        );
        await getConsultationData(latest.id);
      }
      return true;
    }
    return{
        getPatientHistoryData,
        getConsultationData,
        patientDetails,
        consultationDetails
    };
}