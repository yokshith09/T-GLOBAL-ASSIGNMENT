import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { env } from "../lib/env.js";
import { AppError } from "../lib/errors.js";

type Provider = { name: string; baseURL: string; apiKey: string; model: string };

/** Gemini first, Groq as fallback. Both speak the OpenAI chat-completions shape. */
function providers(): Provider[] {
  const list: Provider[] = [];
  if (env.gemini.apiKey)
    list.push({
      name: "gemini",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      apiKey: env.gemini.apiKey,
      model: env.gemini.model,
    });
  if (env.groq.apiKey)
    list.push({
      name: "groq",
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: env.groq.apiKey,
      model: env.groq.model,
    });
  return list;
}

export const isConfigured = () => providers().length > 0;

/** One chat turn with tools. Tries each provider in order; the last error surfaces. */
export async function chat(
  messages: ChatCompletionMessageParam[],
  tools: ChatCompletionTool[],
) {
  const options = providers();
  if (options.length === 0) {
    throw new AppError(503, "AGENT_UNCONFIGURED", "The assistant isn't configured. Add an LLM API key.");
  }
  let lastError: unknown;
  for (const p of options) {
    try {
      const client = new OpenAI({ apiKey: p.apiKey, baseURL: p.baseURL });
      const res = await client.chat.completions.create({
        model: p.model,
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.2,
      });
      return res.choices[0].message;
    } catch (e) {
      lastError = e;
    }
  }
  throw new AppError(502, "AGENT_PROVIDER_ERROR", "The assistant is temporarily unavailable.", [], {
    cause: lastError instanceof Error ? lastError.message : String(lastError),
  });
}
