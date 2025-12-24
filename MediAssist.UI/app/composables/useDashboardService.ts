import { useApiBaseUrl } from "~/composables/useRuntimeEnv";

export interface FeedbackPayload {
  userId: string;
  CategoryIDs: number[];
  Rating: number;
  CustomCategoryText: string;
  IssueDescription: string;
  SuggestionsImprovement: string;
}

export interface FeedbackResponse {
  success: boolean;
  message?: string;
}

export const useSubmitFeedback = () => {
  const baseUrl = useApiBaseUrl();
  const submitFeedback = async (
    payload: FeedbackPayload
  ): Promise<FeedbackResponse> => {
    try {
      const response = await $fetch<FeedbackResponse>(
        `${baseUrl}/feedback/submit`,
        {
          method: "POST",
          body: payload,
          credentials: "include",
        }
      );
      console.log("response", response);
      return response;
    } catch (error) {
      console.error("Feedback submission failed:", error);
      return { success: false, message: "Submission failed" };
    }
  };

  return { submitFeedback };
};
