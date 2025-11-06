import type { Consultation } from "./Consultation";

export interface Patient {
  id?: number;
  mrn?: string;
  name?: string;
  email?: string; 
  gender?: string;
  dob?: string;
  age?: number;
}

export interface PatientDetails {
  Patient: Patient;
  numberOfSessions?: number;
  emailId?: string;
  phoneNumber?: string;
  sessions?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientConsultation{
    patientInfo: Patient;
    consultingDoctor: string;
}

export interface PatientHistory{
  patient: Patient;
  consultations : Consultation[];
}