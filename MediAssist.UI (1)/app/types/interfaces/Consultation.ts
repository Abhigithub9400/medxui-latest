import type { ReportSummary } from "@/types/interfaces/ReportSummary";

export interface Conversation {
  speaker: string;
  text: string;
}

export interface Consultation {
  id: number;
  name: string;
  createdAt: string;
}

export interface ConsultationDetails {
  id: number;
  name: string;
  createdAt: string;
  report: ReportSummary;
  conversation: Conversation;
  audioFileName: string;
  reportId : number;
}
