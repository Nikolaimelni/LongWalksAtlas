import { pino } from "pino";
import { env } from "./env.ts";

export const log = process.stdout.isTTY
	? pino({ level: env.LOG_LEVEL, transport: { target: "pino-pretty" } })
	: pino({ level: env.LOG_LEVEL });
