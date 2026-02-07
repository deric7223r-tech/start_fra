const isProd = import.meta.env.PROD;

export const logger = {
  debug(message: string, data?: unknown) {
    if (!isProd) console.debug(`[FRA] ${message}`, data ?? '');
  },
  info(message: string, data?: unknown) {
    if (!isProd) console.info(`[FRA] ${message}`, data ?? '');
  },
  warn(message: string, data?: unknown) {
    console.warn(`[FRA] ${message}`, data ?? '');
  },
  error(message: string, data?: unknown) {
    console.error(`[FRA] ${message}`, data ?? '');
  },
};
