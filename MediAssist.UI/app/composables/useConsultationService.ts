import { ref } from "vue";
import { useApiBaseUrl } from "~/composables/useRuntimeEnv";
import type { Conversation } from "~/types/interfaces/Consultation";
import type { PatientConsultation } from "~/types/interfaces/Patient";
import type { ReportSummary } from "~/types/interfaces/ReportSummary";
import type { ResultResponse } from "~/types/utils/ResultResponse";

const reportData = ref<{
  patient: PatientConsultation;
  SummaryReport: ReportSummary;
  conversation: Conversation[];
  ConsultationId: number;
}>({
  patient: {} as PatientConsultation,
  SummaryReport: {} as ReportSummary,
  conversation: [],
  ConsultationId: 0,
});

export const useConsultationService = () => {
  const baseUrl = useApiBaseUrl();
  const error = ref<string | undefined>();

  const checkSettingsUpdated = async (
    userId: string
  ): Promise<ResultResponse> => {
    try {
      return await $fetch<ResultResponse>(
        `${baseUrl}/settings/check-settings-updated`,
        {
          method: "GET",
          query: { userId },
          credentials: "include",
        }
      );
    } catch (err: any) {
      const message =
        err?.data?.message || "An error occurred while checking settings.";
      return { success: false, message };
    }
  };

  const requestReport = async (payload: {
    transcription: string;
    notes: string[];
    medlab: any[];
    vitals: any[];
    nextAppointment: string;
    consultationId?: number;
    userId: string;
    sessionId: number;
    patientId: number;
  }) => {
    try {
      return await $fetch<ResultResponse<ReportSummary>>(
        `${baseUrl}/consultation/generate-report`,
        {
          method: "POST",
          body: payload,
          credentials: "include",
        }
      );
    } catch (err: any) {
      throw new Error(err?.data?.message || "Failed to generate report.");
    }
  };

  const isResultGenerated = ref(false);
  const showGenerateResultPreviewPopUp = ref(false);
  const isDownloading = ref(false);

  const mapPatientDetails = (consultation: PatientConsultation) => {
    return {
      patientInfo: {
        id: consultation.patientInfo.id,
        mrn: consultation.patientInfo.mrn,
        name: consultation.patientInfo.name,
        gender: consultation.patientInfo.gender,
        age: consultation.patientInfo.age,
        dob: consultation.patientInfo.dob,
        email: consultation.patientInfo.email,
      },
      consultingDoctor: consultation.consultingDoctor,
    };
  };

  const generateResults = async (payload: {
    transcription: string;
    notes: string[];
    medlab: any[];
    vitals?: any[];
    nextAppointment?: string;
    consultationId?: number;
    conversation?: Conversation[];
    patient: PatientConsultation;
    userId: string;
    sessionId: number;
  }) => {
    try {
      const response = await requestReport({
        transcription: payload.transcription,
        notes: payload.notes,
        medlab: payload.medlab,
        vitals: payload.vitals || [],
        nextAppointment: payload.nextAppointment || "",
        consultationId: payload.consultationId,
        userId: payload.userId,
        sessionId: payload.sessionId,
        patientId: payload.patient.patientInfo.id!,
      });

      if (response) {
        reportData.value = {
          patient: mapPatientDetails(payload.patient),
          SummaryReport: (response.data ?? {}) as ReportSummary,
          conversation: payload.conversation ?? [],
          ConsultationId: payload.consultationId ?? 0,
        };
        isResultGenerated.value = true;
        showGenerateResultPreviewPopUp.value = true;
      }
    } catch (err) {
      isResultGenerated.value = false;
      showGenerateResultPreviewPopUp.value = false;
      error.value = (err as Error).message;
    }
  };

  const downloadPdf = async (
    userId: string,
    selectedReport: string,
    consultationId: number,
    patientId: number
  ) => {
    if (isDownloading.value) return;
    isDownloading.value = true;

    try {
      const response = await fetch(`${baseUrl}/consultation/download-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          selectedReport,
          consultationId,
          patientId,
        }),
      });

      if (!response.ok) {
        console.error("Failed to download PDF:", response.statusText);
        return;
      }

      const result = await response.json();

      if (!result?.success || !result?.data) {
        console.error("PDF generation failed:", result?.message);
        return;
      }

      const { fileBytes, fileName, contentType } = result.data;

      if (!fileBytes) {
        console.error("No PDF data received");
        return;
      }

      // Decode base64 and convert to Blob
      const byteCharacters = atob(fileBytes);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: contentType || "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "Report.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    } finally {
      isDownloading.value = false;
    }
  };

  const shareReport = async (
    recipientEmail: string,
    recipientName: string,
    userId: string,
    selectedReport: string,
    consultationId: number,
    patientId: number
  ) => {
    try {
      const response = await fetch(`${baseUrl}/consultation/share-pdf-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          patientId: patientId,
          consultationId: consultationId,
          recipientEmail: recipientEmail,
          recipientName: recipientName,
          userId: userId,
          selectedReport: selectedReport,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          message: errorData?.message || "Something went wrong",
        };
      }

      const result = await response.json();
      return {
        success: result.success ?? true,
        message: result.message ?? "Report sent successfully",
      };
    } catch (error) {
      console.error("Error sharing PDF:", error);
      return {
        success: false,
        message: "Network error while sharing PDF",
      };
    }
  };

  const updateSummaryReport = async (
    consultationId: number,
    updatedSummary: ReportSummary
  ) => {
    try {
      const response = await $fetch<ResultResponse>(
        `${baseUrl}/consultation/update-summary-report`,
        {
          method: "PUT",
          body: JSON.stringify({
            consultationId: consultationId,
            summary: updatedSummary,
          }),
          credentials: "include",
        }
      );
      if (response.success) {
        reportData.value.SummaryReport = updatedSummary;
      }
      return response;
    } catch (err: any) {
      const message =
        err?.data?.message || "An error occurred while updating the report.";
      return { success: false, message };
    }
  };

  return {
    error,
    reportData,
    isResultGenerated,
    showGenerateResultPreviewPopUp,
    checkSettingsUpdated,
    requestReport,
    generateResults,
    downloadPdf,
    shareReport,
    isDownloading,
    updateSummaryReport,
  };
};
