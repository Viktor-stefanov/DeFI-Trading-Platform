import { createLogger, format, transports } from "winston";
import type { TransformableInfo } from "logform";

const level =
  process.env.LOG_LEVEL ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

const logger = createLogger({
  level,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.printf((info: TransformableInfo & { timestamp?: string }) => {
      const { timestamp, level, message, ...meta } = info;
      const messageText =
        typeof message === "string"
          ? message
          : message instanceof Error
          ? message.message
          : JSON.stringify(message);
      const metaPayload = Object.keys(meta).length
        ? ` ${JSON.stringify(meta)}`
        : "";
      return `${timestamp ?? ""} [${level}] ${messageText}${metaPayload}`;
    })
  ),
  transports: [
    new transports.Console({
      stderrLevels: ["error", "warn"],
    }),
  ],
});

export default logger;
