type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const DEVELOPMENT = __DEV__;

function writeLog(level: LogLevel, message: string, details?: unknown): void {
  if (!DEVELOPMENT && level === "DEBUG") {
    return;
  }

  const timestamp = new Date().toISOString();
  const prefix = `[MediRem][${level}][${timestamp}]`;

  switch (level) {
    case "ERROR":
      console.error(prefix, message, details ?? "");
      break;
    case "WARN":
      console.warn(prefix, message, details ?? "");
      break;
    case "DEBUG":
      console.debug(prefix, message, details ?? "");
      break;
    default:
      console.log(prefix, message, details ?? "");
  }
}

export const logger = {
  debug: (message: string, details?: unknown) => writeLog("DEBUG", message, details),
  info: (message: string, details?: unknown) => writeLog("INFO", message, details),
  warn: (message: string, details?: unknown) => writeLog("WARN", message, details),
  error: (message: string, error?: unknown) => writeLog("ERROR", message, error),
};