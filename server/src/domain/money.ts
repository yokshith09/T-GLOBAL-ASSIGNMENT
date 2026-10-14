/** Money is always integer paise. 1 rupee = 100 paise. Never store float rupees. */

export const PAISE_PER_RUPEE = 100;

/** Floor paise down to whole rupees (loan amounts are quoted in whole rupees). */
export function paiseToWholeRupees(paise: number): number {
  return Math.floor(paise / PAISE_PER_RUPEE);
}
