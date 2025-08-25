/**
 * Shared utility functions for the Coach Will Gymnastics application
 * Eliminates code duplication and provides consistent implementations
 */

import { logger } from './logger';
import { getBaseUrl } from './lib/url';

// Re-export the centralized URL utility
export { getBaseUrl };

// Supabase configuration utilities
export class SupabaseUtils {
  static getConfig() {
    const BASE_URL = process.env.SUPABASE_URL;
    const API_KEY = process.env.SUPABASE_ANON_KEY;
    
    if (!BASE_URL || !API_KEY) {
      throw new Error('Supabase configuration missing');
    }
    
    return { BASE_URL, API_KEY };
  }

  static getHeaders(apiKey: string) {
    return {
      'apikey': apiKey,
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  static async makeRequest(method: string, endpoint: string, body?: any) {
    const { BASE_URL, API_KEY } = this.getConfig();
    const perfTimer = logger.performance.db.query(`${method} ${endpoint}`);
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: this.getHeaders(API_KEY),
        body: body ? JSON.stringify(body) : undefined
      });

      const data = response.ok ? await response.json() : null;
      const count = Array.isArray(data) ? data.length : (data ? 1 : 0);
      
      perfTimer.end();
      
      return {
        ok: response.ok,
        status: response.status,
        data,
        count
      };
    } catch (error) {
      perfTimer.end();
      throw error;
    }
  }

  static async deleteAll(table: string): Promise<{ count: number; success: boolean }> {
    try {
      const result = await this.makeRequest('DELETE', `/rest/v1/${table}?id=neq.0`);
      return {
        success: result.ok,
        count: result.count
      };
    } catch (error) {
      logger.error(`Failed to delete from ${table}:`, error);
      return { success: false, count: 0 };
    }
  }

  static async count(table: string): Promise<number> {
    try {
      const result = await this.makeRequest('GET', `/rest/v1/${table}?select=count`);
      return result.ok ? (result.data?.[0]?.count || 0) : 0;
    } catch (error) {
      logger.error(`Failed to count ${table}:`, error);
      return 0;
    }
  }
}

// Data validation utilities
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhone(phone: string): boolean {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    // Check if it's 10 or 11 digits (with or without country code)
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  static sanitizeString(str: string): string {
    return str.trim().replace(/[<>]/g, '');
  }

  static validateAge(dateOfBirth: string): { isValid: boolean; age: number } {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    // Adjust age if birthday hasn't occurred this year
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
      ? age - 1 : age;
    
    return {
      isValid: adjustedAge >= 6 && adjustedAge <= 18,
      age: adjustedAge
    };
  }
}

// File system utilities
export class FileUtils {
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fs = await import('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to delete file ${filePath}:`, error);
      return false;
    }
  }

  static async ensureDirectory(dirPath: string): Promise<boolean> {
    try {
      const fs = await import('fs');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return true;
    } catch (error) {
      logger.error(`Failed to create directory ${dirPath}:`, error);
      return false;
    }
  }

  static async listFiles(dirPath: string, filter?: (filename: string) => boolean): Promise<string[]> {
    try {
      const fs = await import('fs');
      if (!fs.existsSync(dirPath)) {
        return [];
      }
      
      const files = fs.readdirSync(dirPath);
      return filter ? files.filter(filter) : files;
    } catch (error) {
      logger.error(`Failed to list files in ${dirPath}:`, error);
      return [];
    }
  }
}

// Response utilities
export class ResponseUtils {
  static success(data: any, message?: string) {
    return {
      success: true,
      data,
      message: message || 'Operation completed successfully'
    };
  }

  static error(message: string, details?: any) {
    return {
      success: false,
      error: message,
      details
    };
  }

  static paginated(data: any[], page: number, limit: number, total: number) {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }
}

// Date/Time utilities
export class DateUtils {
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }

  static formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toTimeString().slice(0, 5);
  }

  static formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }

  static addDays(date: Date | string, days: number): Date {
    const d = typeof date === 'string' ? new Date(date) : new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  static isFutureDate(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d > new Date();
  }

  static isPastDate(date: Date | string): boolean {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d < new Date();
  }
}

// Lesson utilities
export class LessonUtils {
  static getDurationMinutes(lessonType: string): number {
    const durations: Record<string, number> = {
      'quick-journey': 60,
      'deep-dive': 60,
      'dual-quest': 90,
      'partner-progression': 90
    };
    return durations[lessonType] || 60;
  }

  static getLessonPrice(lessonType: string): number {
    const prices: Record<string, number> = {
      'quick-journey': 40,
      'deep-dive': 60,
      'dual-quest': 50,
      'partner-progression': 80
    };
    return prices[lessonType] || 40;
  }

  static isMultiAthleteLesson(lessonType: string): boolean {
    return ['dual-quest', 'partner-progression'].includes(lessonType);
  }

  static validateLessonType(lessonType: string): boolean {
    const validTypes = ['quick-journey', 'deep-dive', 'dual-quest', 'partner-progression'];
    return validTypes.includes(lessonType);
  }
}

// Async utilities
export class AsyncUtils {
  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        logger.warn(`Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await this.sleep(delay);
        delay *= 2; // Exponential backoff
      }
    }
    
    throw lastError!;
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async parallel<T>(operations: (() => Promise<T>)[], maxConcurrency: number = 5): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];
    
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      
      const promise = operation().then(result => {
        results[i] = result;
      });
      
      executing.push(promise);
      
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }
    
    await Promise.all(executing);
    return results;
  }
}

export default {
  SupabaseUtils,
  ValidationUtils,
  FileUtils,
  ResponseUtils,
  DateUtils,
  LessonUtils,
  AsyncUtils,
  getBaseUrl,
};
