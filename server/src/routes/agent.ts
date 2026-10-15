import { Router } from "express";
import { z } from "zod";
import { asyncHandler, parseOrThrow } from "../lib/errors.js";
import { confirmAndSubmit, runChat } from "../agent/orchestrator.js";
import { isConfigured } from "../agent/provider.js";

export const agent = Router();

const ChatBody = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .min(1),
});

agent.get(
  "/status",
  asyncHandler(async (_req, res) => {
    res.json({ configured: isConfigured() });
  }),
);

agent.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const { messages } = parseOrThrow(ChatBody, req.body);
    res.json(await runChat(messages));
  }),
);

agent.post(
  "/confirm",
  asyncHandler(async (req, res) => {
    const created = await confirmAndSubmit(req.body?.payload);
    res.status(201).json(created);
  }),
);
