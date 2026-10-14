/** Mirror of the server's rules for instant inline feedback. The API stays authoritative. */

export type FormValues = { name: string; mobile: string; gross: string; net: string; karat: number };
export type FieldErrors = Partial<Record<"name" | "mobile" | "gross" | "net", string>>;

export function validateDetails(v: FormValues): FieldErrors {
  const e: FieldErrors = {};
  if (!/^[A-Za-z ]{2,60}$/.test(v.name.trim())) e.name = "Use letters and spaces, 2–60 characters.";
  if (!/^[6-9]\d{9}$/.test(v.mobile)) e.mobile = "Enter a valid 10-digit Indian mobile number.";

  const net = Number(v.net);
  const gross = Number(v.gross);
  if (!v.gross || !(gross > 0 && gross <= 1000)) e.gross = "Enter a weight between 0 and 1000 g.";
  if (!v.net || !(net > 0 && net <= 1000)) e.net = "Enter a weight between 0 and 1000 g.";
  else if (v.gross && net > gross) e.net = "Net weight cannot exceed gross weight.";

  return e;
}

export const hasErrors = (e: FieldErrors) => Object.keys(e).length > 0;
