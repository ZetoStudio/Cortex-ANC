import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: process.env.CORTEX_SERVICE ?? 'cortex',
    ...(process.env.LOKI_URL ? { loki: process.env.LOKI_URL } : {}),
  },
});

export function createLogger(service: string) {
  return logger.child({ service });
}
