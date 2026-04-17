// Placeholder — o agente vai implementar o licenciamento aqui
export type LicenseMode = "TRIAL" | "FULL" | "BLOCKED";

export interface LicenseStatus {
  mode: LicenseMode;
  deviceId: string;
  trialStartedAt?: string;
  trialExpiresAt?: string;
  daysLeft?: number;
  tamper?: boolean;
  licensePath?: string;
  error?: string;
}
