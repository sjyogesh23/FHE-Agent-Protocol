export enum AgentRole {
  PATIENT = 'PATIENT',                // Agent A
  GENERAL_DOCTOR = 'GENERAL_DOCTOR',  // Agent B
  SPECIALIST = 'SPECIALIST',          // Agent C
  MEDICAL_LAB = 'MEDICAL_LAB',        // Agent D
  BILLING = 'BILLING',                // Agent E
  HUMAN_DOCTOR = 'HUMAN_DOCTOR'       // New Node
}

export enum EncryptionState {
  PLAINTEXT = 'PLAINTEXT',
  ENCRYPTED = 'ENCRYPTED',
  PROCESSED = 'PROCESSED',
  DECRYPTED = 'DECRYPTED'
}

export interface CreditProfile {
  annualIncome: number;
  monthlyDebt: number;
  creditUtilization: number;
  paymentHistory: number;
  creditAgeYears: number;
  hardInquiries: number;
  derogatoryMarks: number;
}

export interface PatientVitals {
  heartRate: number;     // bpm
  systolic: number;      // mmHg
  diastolic: number;     // mmHg
  temperature: number;   // Celsius
  oxygenSat: number;     // %
  symptomSeverity: number; // 0-100
}

export type FheDataType = number | CreditProfile | PatientVitals;

export interface FheValue {
  id: string;
  rawValue: FheDataType;
  encryptedBlob: string;
  state: EncryptionState;
  history: string[];
  bills?: Record<string, number>; // Agent -> Bill mapping
  totalBill?: number;
  severity?: number;
}

export interface SimulatedOpResult {
  value: FheValue;
  logDetails: string;
  mathFormula?: string;
  stepByStepCalculation: string[];
  metrics: Record<string, string | number>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  source: AgentRole;
  action: string;
  details: string;
  hash?: string;
  metrics?: Record<string, string | number>;
  mathFormula?: string;
  stepByStepCalculation?: string[];
}

export type OperationType = 'ADD' | 'MUL' | 'PBS_SQUARE' | 'INFERENCE' | 'DELEGATE' | 'CUSTOM';

export interface ScenarioStep {
  label: string;
  operation: OperationType;
  value?: number;
  description: string;
  target?: AgentRole;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultClientValue: FheDataType;
}