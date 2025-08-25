/**
 * Production-safe logging utility
 */

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugMode = process.env.DEBUG === 'true' || process.env.LOG_LEVEL === 'debug';

export const logger = {
  /**
   * Log informational messages (always shown)
   */
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },

  /**
   * Log warnings (always shown)
   */
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  /**
   * Log errors (always shown)
   */
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },

  /**
   * Debug logging (only in development or when DEBUG=true)
   */
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment || isDebugMode) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  /**
   * Admin operation logging (only shown for admin operations)
   */
  admin: (message: string, ...args: any[]) => {
    if (!isProduction || isDebugMode) {
      console.log(`[ADMIN] ${message}`, ...args);
    }
  },

  /**
   * Audit logging for important business operations (always shown)
   */
  audit: (message: string, ...args: any[]) => {
    console.log(`[AUDIT] ${message}`, ...args);
  },

  /**
   * Performance timing logs (only in development)
   */
  perf: (operation: string, startTime: number) => {
    if (isDevelopment || isDebugMode) {
      const duration = Date.now() - startTime;
      console.log(`[PERF] ${operation} completed in ${duration}ms`);
    }
  },

  /**
   * Performance monitoring utility
   */
  performance: {
    /**
     * Start a performance timer
     */
    start: (operation: string) => {
      const startTime = Date.now();
      if (isDevelopment || isDebugMode) {
        console.log(`[PERF] Starting ${operation}...`);
      }
      return {
        end: () => {
          const duration = Date.now() - startTime;
          if (isDevelopment || isDebugMode) {
            console.log(`[PERF] ${operation} completed in ${duration}ms`);
          }
          return duration;
        },
        endWithResult: (result: any) => {
          const duration = Date.now() - startTime;
          if (isDevelopment || isDebugMode) {
            const resultSize = typeof result === 'object' ? 
              (Array.isArray(result) ? result.length : Object.keys(result).length) : 
              'N/A';
            console.log(`[PERF] ${operation} completed in ${duration}ms (result size: ${resultSize})`);
          }
          return { duration, result };
        }
      };
    },

    /**
     * Measure async operation performance
     */
    measure: async <T>(operation: string, asyncFn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
      const timer = logger.performance.start(operation);
      try {
        const result = await asyncFn();
        const duration = timer.end();
        return { result, duration };
      } catch (error) {
        timer.end();
        throw error;
      }
    },

    /**
     * Database operation performance monitoring
     */
    db: {
      query: (query: string, count?: number) => {
        const startTime = Date.now();
        return {
          end: () => {
            const duration = Date.now() - startTime;
            if (isDevelopment || isDebugMode) {
              const countInfo = count !== undefined ? ` (${count} records)` : '';
              console.log(`[PERF] DB Query: ${query} - ${duration}ms${countInfo}`);
            }
            return duration;
          }
        };
      }
    },

    /**
     * API operation performance monitoring
     */
    api: {
      request: (method: string, path: string) => {
        const startTime = Date.now();
        return {
          end: (statusCode?: number) => {
            const duration = Date.now() - startTime;
            if (isDevelopment || isDebugMode) {
              const status = statusCode ? ` [${statusCode}]` : '';
              console.log(`[PERF] API ${method} ${path}${status} - ${duration}ms`);
            }
            return duration;
          }
        };
      }
    }
  }
};

export default logger;
