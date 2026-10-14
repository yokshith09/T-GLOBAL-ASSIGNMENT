import { z } from "zod";

/**
 * Validation shared by the REST API and the agent's tools, so both reject the
 * same inputs with the same messages. Keep messages user-facing and specific.
 */

export const KARATS = [18, 22, 24] as const;
export const MAX_WEIGHT_GRAMS = 1000;

const weight = z
  .number({ invalid_type_error: "Enter a number." })
  .positive("Must be greater than 0.")
  .max(MAX_WEIGHT_GRAMS, `Must be ${MAX_WEIGHT_GRAMS} g or less.`);

export const QuoteInput = z
  .object({
    netWeightGrams: weight,
    grossWeightGrams: weight,
    karat: z
      .number()
      .refine((k) => (KARATS as readonly number[]).includes(k), {
        message: "Karat must be 18, 22 or 24.",
      }),
  })
  .refine((v) => v.netWeightGrams <= v.grossWeightGrams, {
    path: ["netWeightGrams"],
    message: "Net weight cannot exceed gross weight.",
  });

export const LeadInput = z
  .object({
    name: z
      .string()
      .trim()
      .regex(/^[A-Za-z ]{2,60}$/, "Use letters and spaces only, 2–60 characters."),
    mobileNumber: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
    netWeightGrams: weight,
    grossWeightGrams: weight,
    karat: z.number().refine((k) => (KARATS as readonly number[]).includes(k), {
      message: "Karat must be 18, 22 or 24.",
    }),
    schemeId: z.string().min(1, "Choose a plan."),
  })
  .refine((v) => v.netWeightGrams <= v.grossWeightGrams, {
    path: ["netWeightGrams"],
    message: "Net weight cannot exceed gross weight.",
  });

export type QuoteInputType = z.infer<typeof QuoteInput>;
export type LeadInputType = z.infer<typeof LeadInput>;
