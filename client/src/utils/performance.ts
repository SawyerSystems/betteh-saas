// Performance monitoring and optimization utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure component render time
  measureRender(componentName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(componentName)) {
        this.metrics.set(componentName, []);
      }
      
      this.metrics.get(componentName)!.push(duration);
      
      // Log slow renders in development
      if (process.env.NODE_ENV === 'development' && duration > 50) {
        console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  // Measure API request time
  async measureApiCall<T>(operation: string, apiCall: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(`api_${operation}`)) {
        this.metrics.set(`api_${operation}`, []);
      }
      
      this.metrics.get(`api_${operation}`)!.push(duration);
      
      // Log slow API calls
      if (process.env.NODE_ENV === 'development' && duration > 1000) {
        console.warn(`Slow API call: ${operation} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`Failed API call: ${operation} took ${duration.toFixed(2)}ms and failed`, error);
      throw error;
    }
  }

  // Get performance report
  getReport(): Record<string, { count: number; avgTime: number; maxTime: number; minTime: number }> {
    const report: Record<string, any> = {};
    
    this.metrics.forEach((times, name) => {
      if (times.length > 0) {
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);
        
        report[name] = {
          count: times.length,
          avgTime: parseFloat(avgTime.toFixed(2)),
          maxTime: parseFloat(maxTime.toFixed(2)),
          minTime: parseFloat(minTime.toFixed(2))
        };
      }
    });
    
    return report;
  }

  // Clear metrics
  clear(): void {
    this.metrics.clear();
  }

  // Log performance report to console
  logReport(): void {
    console.table(this.getReport());
  }
}

// Hook for measuring component performance
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    startMeasure: () => monitor.measureRender(componentName),
    measureApiCall: <T>(operation: string, apiCall: () => Promise<T>) => 
      monitor.measureApiCall(operation, apiCall),
    getReport: () => monitor.getReport(),
    logReport: () => monitor.logReport()
  };
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}