import { getRuntimeConfig } from "../utils/runtimeConfig";

export async function getConfiguredBreakTimeQrCode() {
  const config = await getRuntimeConfig();
  return `${config.CONFIG_QR_CODE || ""}`.trim();
}

export function validateBreakTimeQrCode(scannedValue, configuredValue) {
  if (!scannedValue || !configuredValue) {
    return false;
  }

  return scannedValue.trim() === configuredValue.trim();
}
