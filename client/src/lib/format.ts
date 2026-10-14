/** Display helpers. Server is the source of truth for all real numbers. */

export function formatRupees(rupees: number): string {
  return "₹" + rupees.toLocaleString("en-IN");
}

/** 9876543210 -> 9876XXXX10 (display only; server masks authoritatively). */
export function maskMobile(mobile: string): string {
  if (mobile.length !== 10) return mobile;
  return mobile.slice(0, 4) + "XXXX" + mobile.slice(8);
}
