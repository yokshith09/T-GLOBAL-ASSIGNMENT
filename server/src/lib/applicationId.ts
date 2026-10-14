/** Human-friendly application id, e.g. GL-482193. */
export function newApplicationId(): string {
  return `GL-${Math.floor(100000 + Math.random() * 900000)}`;
}
// ponytail: random 6-digit id with a unique constraint + retry in the service.
// If strictly sequential vanity ids (GL-1042, GL-1043…) are needed, back it with a DB sequence.
