import { Calculator, Coins, FileCheck, type LucideIcon } from "lucide-react";

export const PARTNERS = ["Bharat Bullion", "Kanaka Finance", "VaultOne", "AuNinety", "GoldTrust"];

export type Step = { icon: LucideIcon; title: string; body: string };
export const STEPS: Step[] = [
  { icon: Coins, title: "Enter your gold", body: "Net and gross weight, karat, and your details, with checks as you type." },
  { icon: Calculator, title: "See a live quote", body: "Pure gold, market value, and the eligible loan per plan, calculated instantly." },
  { icon: FileCheck, title: "Submit & track", body: "Get an application ID on the spot. An agent verifies the gold and confirms." },
];

export type Faq = { q: string; a: string };
export const FAQS: Faq[] = [
  { q: "How is my loan amount calculated?", a: "We value your pure gold at today's 24K rate, then lend up to the plan's loan-to-value, never above 75%. Every figure is computed on our server, not estimated." },
  { q: "Which purities do you accept?", a: "18K, 22K and 24K jewellery. We use the net weight (gold only, without stones) to work out pure gold." },
  { q: "Is this the final loan amount?", a: "It's a preliminary offer. The final amount is confirmed after an in-branch appraisal of your gold." },
  { q: "How is my data handled?", a: "Your mobile number is masked everywhere it's shown and in our logs, and nothing is stored until you submit." },
  { q: "Can I apply by chatting instead?", a: "Yes. Loan Assist collects your details conversationally and files the same application, through the same validated backend." },
  { q: "What's the difference between the plans?", a: "Bullet Repayment settles interest and principal at maturity (up to 70% LTV). Monthly EMI spreads it over equal instalments (up to 75% LTV)." },
  { q: "Do I need an account?", a: "No. You can get an estimate and apply without signing up." },
];
