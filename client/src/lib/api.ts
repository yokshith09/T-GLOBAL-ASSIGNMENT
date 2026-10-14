const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";

export type Scheme = {
  id: string;
  name: string;
  annualRatePercent: number;
  maxLtvPercent: number;
  tenureMonths: number;
  tenureNote: string;
};

export type QuoteRequest = { netWeightGrams: number; grossWeightGrams: number; karat: number };

export type Quote = {
  pureGoldGrams: number;
  goldValuePaise: number;
  goldValueRupees: number;
  quotes: { schemeId: string; eligibleLoanRupees: number; maxLtvPercent: number }[];
};

export type LeadRequest = QuoteRequest & { name: string; mobileNumber: string; schemeId: string };

export type LeadCreated = {
  applicationId: string;
  status: string;
  eligibleLoanRupees: number;
  mobileNumber: string; // masked
};

export type ApiError = {
  code: string;
  message: string;
  fields: { field: string; message: string }[];
  applicationId?: string;
  appliedAt?: string;
};

/** Thrown for any non-2xx response, carrying the server's error contract. */
export class ApiException extends Error {
  constructor(
    public status: number,
    public error: ApiError,
  ) {
    super(error.message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiException(0, { code: "NETWORK_ERROR", message: "Can't reach the server.", fields: [] });
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiException(res.status, body?.error ?? { code: "UNKNOWN", message: "Request failed.", fields: [] });
  }
  return body as T;
}

export type Lead = {
  applicationId: string;
  name: string;
  mobileNumberMasked: string;
  netWeightGrams: number;
  schemeId: string;
  eligibleLoanRupees: number;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  createdAt: string;
};

export const getSchemes = () => request<Scheme[]>("/loan-schemes");
export const getLeads = (schemeId?: string) =>
  request<Lead[]>(`/leads${schemeId ? `?schemeId=${encodeURIComponent(schemeId)}` : ""}`);
export const postQuote = (input: QuoteRequest) =>
  request<Quote>("/quotes", { method: "POST", body: JSON.stringify(input) });
export const postLead = (input: LeadRequest) =>
  request<LeadCreated>("/leads", { method: "POST", body: JSON.stringify(input) });
