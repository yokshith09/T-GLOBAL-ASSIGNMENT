import "./env.js"; // loads .env before the client reads DATABASE_URL
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
