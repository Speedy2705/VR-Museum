import { logger } from "@/lib/logger";

process.on("uncaughtException", (error) => {
  logger.error("Uncaught server exception", { error });
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled server promise rejection", { reason });
});
