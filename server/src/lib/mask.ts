/** 9876543210 -> 9876XXXX10. Used on every response and log line. */
export function maskMobile(mobile: string): string {
  return mobile.length === 10 ? `${mobile.slice(0, 4)}XXXX${mobile.slice(8)}` : mobile;
}
