import { getActivityLogger, ActivityLogger } from '../activity-logger';
import { ActivityActorType, ActivityActionType, ActivityCategory, ActivityTargetType } from '../../shared/schema';
import { SupabaseStorage } from '../storage';

interface EmailLogContext {
  actorType: ActivityActorType;
  actorId?: number;
  actorName: string;
  ipAddress?: string;
  userAgent?: string;
  targetType?: ActivityTargetType;
  targetId?: number;
  targetIdentifier?: string;
}

interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function logEmailActivity(
  storage: SupabaseStorage,
  context: EmailLogContext,
  recipient: string,
  subject: string,
  emailType: string,
  result: EmailSendResult,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const activityLogger = getActivityLogger(storage);
    
    const status = result.success ? 'sent' : 'failed';
    const description = `Email "${emailType}" ${status} to ${recipient}: ${subject}`;
    
    await activityLogger.logCommunicationActivity(
      {
        actorType: context.actorType,
        actorId: context.actorId,
        actorName: context.actorName,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
      recipient,
      ActivityActionType.EMAIL_SENT,
      subject,
      status,
      {
        emailType,
        messageId: result.messageId,
        error: result.error,
        targetType: context.targetType,
        targetId: context.targetId,
        targetIdentifier: context.targetIdentifier,
        ...metadata
      }
    );
  } catch (error) {
    console.error('Failed to log email activity:', error);
  }
}

export function createEmailLogContext(
  req: any,
  actorType: ActivityActorType,
  actorId?: number,
  actorName?: string,
  targetType?: ActivityTargetType,
  targetId?: number,
  targetIdentifier?: string
): EmailLogContext {
  let resolvedActorName = actorName;
  
  if (!resolvedActorName) {
    if (actorType === ActivityActorType.SYSTEM) {
      resolvedActorName = 'System';
    } else if (actorType === ActivityActorType.ADMIN && req?.session?.adminId) {
      resolvedActorName = req.session.adminEmail || `Admin #${req.session.adminId}`;
    } else if (actorType === ActivityActorType.PARENT && req?.session?.parentId) {
      resolvedActorName = req.session.parentName || `Parent #${req.session.parentId}`;
    } else {
      resolvedActorName = 'Unknown';
    }
  }

  return {
    actorType,
    actorId,
    actorName: resolvedActorName || 'Unknown',
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get?.('User-Agent'),
    targetType,
    targetId,
    targetIdentifier
  };
}
