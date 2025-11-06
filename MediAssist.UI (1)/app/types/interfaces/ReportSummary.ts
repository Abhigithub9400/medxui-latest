export interface ReportSummary {
  consultationDateTime : string;
  subjective: Subjective;
  objective: Objective;
  assessment: Assessment;
  plan: Plan;
  codes: CodeReference[];
}

interface Subjective {
  chiefComplaint: string;
  medicalHistory: string;
}

interface Objective {
  vitals: string[];
}

interface Assessment {
  potentialDiagnosis: string;
}

interface Plan {
  prescriptions: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  testsAdvised: string;
  nextAppointment: string;
}

interface CodeReference {
  type: string;
  code: string;
  description: string;
}