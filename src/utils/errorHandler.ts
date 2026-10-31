import { logger } from "./logger";

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred.";
}

export function reportError(operation: string, error: unknown): string {
  const message = getErrorMessage(error);

  logger.error(`Operation failed: ${operation}`, {
    message,
    errorName: error instanceof Error ? error.name : "UnknownError",
    stack: __DEV__ && error instanceof Error ? error.stack : undefined,
  });

  return message;
}