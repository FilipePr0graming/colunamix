// Placeholder — o agente vai implementar a validação do trial/licença aqui
import type { LicenseStatus } from "../shared/license.types";

export async function getLicenseStatus(): Promise<LicenseStatus> {
  return {
    mode: "TRIAL",
    deviceId: "PENDING",
    trialStartedAt: undefined,
    trialExpiresAt: undefined,
    daysLeft: undefined
  };
}
