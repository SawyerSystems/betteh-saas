import { ActivityActorType, ActivityActionType, ActivityCategory, ActivityTargetType, type InsertActivityLog, type ActivityLog, type ActivityLogWithDetails } from "../shared/schema";
import { SupabaseStorage } from "./storage";
import { logger } from "./logger";
import { v4 as uuidv4 } from 'uuid';

export interface ActivityLogContext {
  // Actor information
  actorType: ActivityActorType;
  actorId?: number;
  actorName: string;
  
  // Request context
  ipAddress?: string;
  userAgent?: string;
  
  // Optional batch context
  batchId?: string;
  batchDescription?: string;
}

export interface ActivityLogData {
  actionType: ActivityActionType;
  actionCategory: ActivityCategory;
  actionDescription: string;
  
  targetType: ActivityTargetType;
  targetId?: number;
  targetIdentifier: string;
  
  fieldChanged?: string;
  previousValue?: string;
  newValue?: string;
  
  notes?: string;
  metadata?: Record<string, any>;
}

export class ActivityLogger {
  private storage: SupabaseStorage;
  
  constructor(storage: SupabaseStorage) {
    this.storage = storage;
  }

  /**
   * Log a single activity with context
   */
  async logActivity(context: ActivityLogContext, data: ActivityLogData): Promise<ActivityLog | null> {
    try {
      const activityLog: InsertActivityLog = {
        // Actor
        actorType: context.actorType,
        actorId: context.actorId,
        actorName: context.actorName,
        
        // Action
        actionType: data.actionType,
        actionCategory: data.actionCategory,
        actionDescription: data.actionDescription,
        
        // Target
        targetType: data.targetType,
        targetId: data.targetId,
        targetIdentifier: data.targetIdentifier,
        
        // Changes
        fieldChanged: data.fieldChanged,
        previousValue: data.previousValue,
        newValue: data.newValue,
        
        // Context
        notes: data.notes,
        metadata: data.metadata,
        
        // Technical
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        
        // Batch
        batchId: context.batchId,
        batchDescription: context.batchDescription,
        
        // Defaults
        isDeleted: false,
        isReversed: false,
      };

      const result = await this.storage.createActivityLog(activityLog);
      
      // Log to system logger as well for debugging
      logger.info('Activity logged', {
        actor: `${context.actorType}:${context.actorName}`,
        action: `${data.actionCategory}.${data.actionType}`,
        target: data.targetIdentifier,
        description: data.actionDescription
      });
      
      return result;
    } catch (error) {
      logger.error('Failed to log activity', { error, context, data });
      return null;
    }
  }

  /**
   * Log multiple activities as a batch
   */
  async logBatchActivity(context: ActivityLogContext, activities: ActivityLogData[], batchDescription: string): Promise<ActivityLog[]> {
    const batchId = uuidv4();
    const batchContext = {
      ...context,
      batchId,
      batchDescription
    };

    const results: ActivityLog[] = [];
    
    for (const activity of activities) {
      const result = await this.logActivity(batchContext, activity);
      if (result) {
        results.push(result);
      }
    }

    // Log summary entry for the batch operation
    await this.logActivity(batchContext, {
      actionType: ActivityActionType.BULK_OPERATION,
      actionCategory: ActivityCategory.ADMIN,
      actionDescription: `${batchDescription} (${activities.length} items)`,
      targetType: ActivityTargetType.ADMIN_SETTING,
      targetIdentifier: `Batch Operation`,
      metadata: {
        operationCount: activities.length,
        operationTypes: Array.from(new Set(activities.map(a => a.actionType)))
      }
    });

    return results;
  }

  /**
   * Mark an activity as reversed/undone
   */
  async reverseActivity(activityId: number, context: ActivityLogContext, reason?: string): Promise<boolean> {
    try {
      // Get original activity
      const original = await this.storage.getActivityLog(activityId);
      if (!original) {
        logger.warn('Attempted to reverse non-existent activity', { activityId });
        return false;
      }

      // Create reverse action log entry
      const reverseLog = await this.logActivity(context, {
        actionType: ActivityActionType.UPDATED,
        actionCategory: ActivityCategory.ADMIN,
        actionDescription: `Reversed action: ${original.actionDescription}`,
        targetType: original.targetType as ActivityTargetType,
        targetId: original.targetId || undefined,
        targetIdentifier: original.targetIdentifier || 'Unknown Target',
        notes: reason || 'Action reversed by admin',
        metadata: {
          originalActivityId: activityId,
          reversalReason: reason
        }
      });

      if (!reverseLog) {
        return false;
      }

      // Mark original as reversed
      return await this.storage.markActivityReversed(activityId, context.actorId, reverseLog.id);
    } catch (error) {
      logger.error('Failed to reverse activity', { error, activityId });
      return false;
    }
  }

  /**
   * Create a standardized activity context from request
   */
  static createContext(req: any, actorType: ActivityActorType, actorId?: number, actorName?: string): ActivityLogContext {
    let resolvedActorName = actorName;
    
    if (!resolvedActorName) {
      if (actorType === ActivityActorType.SYSTEM) {
        resolvedActorName = 'System';
      } else if (actorType === ActivityActorType.ADMIN && req.session?.adminId) {
        resolvedActorName = req.session.adminEmail || `Admin #${req.session.adminId}`;
      } else if (actorType === ActivityActorType.PARENT && req.session?.parentId) {
        resolvedActorName = req.session.parentName || `Parent #${req.session.parentId}`;
      } else {
        resolvedActorName = 'Unknown';
      }
    }

    return {
      actorType,
      actorId,
      actorName: resolvedActorName || 'Unknown',
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    };
  }

  /**
   * Helper method for booking-related logs
   */
  async logBookingActivity(context: ActivityLogContext, bookingId: number, actionType: ActivityActionType, description: string, previousValue?: any, newValue?: any, fieldChanged?: string): Promise<ActivityLog | null> {
    return this.logActivity(context, {
      actionType,
      actionCategory: ActivityCategory.BOOKING,
      actionDescription: description,
      targetType: ActivityTargetType.BOOKING,
      targetId: bookingId,
      targetIdentifier: `Booking #${bookingId}`,
      fieldChanged,
      previousValue: previousValue ? JSON.stringify(previousValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined
    });
  }

  /**
   * Helper method for payment-related logs
   */
  async logPaymentActivity(context: ActivityLogContext, paymentId: number | null, bookingId: number, actionType: ActivityActionType, description: string, amount?: number, metadata?: Record<string, any>): Promise<ActivityLog | null> {
    return this.logActivity(context, {
      actionType,
      actionCategory: ActivityCategory.PAYMENT,
      actionDescription: description,
      targetType: ActivityTargetType.PAYMENT,
      targetId: paymentId || undefined,
      targetIdentifier: `Payment for Booking #${bookingId}`,
      metadata: {
        bookingId,
        amount,
        ...metadata
      }
    });
  }

  /**
   * Helper method for athlete-related logs
   */
  async logAthleteActivity(context: ActivityLogContext, athleteId: number, athleteName: string, actionType: ActivityActionType, description: string, previousValue?: any, newValue?: any, fieldChanged?: string): Promise<ActivityLog | null> {
    return this.logActivity(context, {
      actionType,
      actionCategory: ActivityCategory.ATHLETE,
      actionDescription: description,
      targetType: ActivityTargetType.ATHLETE,
      targetId: athleteId,
      targetIdentifier: athleteName,
      fieldChanged,
      previousValue: previousValue ? JSON.stringify(previousValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined
    });
  }

  /**
   * Helper method for waiver-related logs
   */
  async logWaiverActivity(context: ActivityLogContext, waiverId: number, athleteName: string, actionType: ActivityActionType, description: string): Promise<ActivityLog | null> {
    return this.logActivity(context, {
      actionType,
      actionCategory: ActivityCategory.WAIVER,
      actionDescription: description,
      targetType: ActivityTargetType.WAIVER,
      targetId: waiverId,
      targetIdentifier: `Waiver for ${athleteName}`
    });
  }

  /**
   * Helper method for communication logs
   */
  async logCommunicationActivity(context: ActivityLogContext, recipient: string, actionType: ActivityActionType, subject: string, status: string, metadata?: Record<string, any>): Promise<ActivityLog | null> {
    const commType = actionType === ActivityActionType.EMAIL_SENT ? 'email' : 'sms';
    
    return this.logActivity(context, {
      actionType,
      actionCategory: ActivityCategory.COMMUNICATION,
      actionDescription: `${commType.toUpperCase()} to ${recipient}: ${subject} (${status})`,
      targetType: commType === 'email' ? ActivityTargetType.EMAIL : ActivityTargetType.SMS,
      targetIdentifier: recipient,
      metadata: {
        subject,
        status,
        ...metadata
      }
    });
  }
}

// Singleton instance
let activityLogger: ActivityLogger;

export function getActivityLogger(storage: SupabaseStorage): ActivityLogger {
  if (!activityLogger) {
    activityLogger = new ActivityLogger(storage);
  }
  return activityLogger;
}

export { activityLogger };
