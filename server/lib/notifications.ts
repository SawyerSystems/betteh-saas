import { IStorage, storage as defaultStorage } from '../storage';
import { ActivityActionType, ActivityActorType, ActivityCategory, ActivityTargetType } from '../../shared/schema';

type NotificationsPrefs = {
  channelsByEvent: Record<string, { email: boolean; sms: boolean }>;
  quietHours: { enabled: boolean; start: string; end: string; urgentOnlyDuringQuietHours: boolean };
  digest: { enabled: boolean; deliveryTime: string };
  smsProviderConfigured?: boolean;
};

const defaultPrefs: NotificationsPrefs = {
  channelsByEvent: { test: { email: true, sms: false } },
  quietHours: { enabled: false, start: '21:00', end: '08:00', urgentOnlyDuringQuietHours: true },
  digest: { enabled: false, deliveryTime: '08:00' },
  smsProviderConfigured: false,
};

function parseTime(value: string): { h: number; m: number } {
  const [h, m] = (value || '00:00').split(':').map(n => parseInt(n, 10) || 0);
  return { h, m };
}

function isWithinQuietHours(now: Date, start: string, end: string) {
  const { h: sh, m: sm } = parseTime(start);
  const { h: eh, m: em } = parseTime(end);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;
  const curMinutes = now.getHours() * 60 + now.getMinutes();
  if (startMinutes === endMinutes) return false; // disabled-like
  // if crosses midnight
  if (startMinutes > endMinutes) {
    return curMinutes >= startMinutes || curMinutes < endMinutes;
  }
  return curMinutes >= startMinutes && curMinutes < endMinutes;
}

// In-memory queues (dev only). For production, use a durable store.
const digestQueue: Array<{ when: Date; eventKey: string; subject: string; body: string }> = [];

export async function getNotificationPrefs(storage: IStorage = defaultStorage): Promise<NotificationsPrefs> {
  const site = await storage.getSiteContent();
  const prefs = (site?.about?.notifications as NotificationsPrefs) || defaultPrefs;
  // merge with defaults defensively
  return {
    ...defaultPrefs,
    ...prefs,
    channelsByEvent: { ...defaultPrefs.channelsByEvent, ...(prefs.channelsByEvent || {}) },
    quietHours: { ...defaultPrefs.quietHours, ...(prefs.quietHours || {}) },
    digest: { ...defaultPrefs.digest, ...(prefs.digest || {}) },
  };
}

export async function sendAdminTestEmail(to?: string, storage: IStorage = defaultStorage) {
  console.log('[NOTIFICATIONS] sendAdminTestEmail invoked', { to, env: process.env.NODE_ENV });
  const prefs = await getNotificationPrefs(storage);
  const allowEmail = prefs.channelsByEvent?.test?.email !== false;
  const now = new Date();
  const quiet = prefs.quietHours.enabled && isWithinQuietHours(now, prefs.quietHours.start, prefs.quietHours.end);
  const subject = 'CoachWillTumbles — Test Notification';
  const body = '<p>This is a test notification from Admin settings.</p>';

  const admin = await storage.getAdminByEmail(process.env.ADMIN_EMAIL || 'admin@coachwilltumbles.com');
  const recipient = to || admin?.email || process.env.ADMIN_EMAIL || 'admin@coachwilltumbles.com';

  // Activity log helper
  const log = async (status: 'sent' | 'queued' | 'skipped' | 'failed', error?: any) => {
    try {
      await storage.createActivityLog({
        actorType: ActivityActorType.ADMIN,
        actorId: admin?.id as any,
        actorName: 'Admin',
        actionType: status === 'sent' ? ActivityActionType.EMAIL_SENT : ActivityActionType.UPDATED,
        actionCategory: ActivityCategory.COMMUNICATION,
        actionDescription: `Admin test email ${status}`,
        targetType: ActivityTargetType.EMAIL,
        targetId: 0 as any,
        targetIdentifier: recipient,
        metadata: { eventKey: 'test', quiet, subject, to: recipient, error: error ? String(error) : undefined },
      } as any);
    } catch {}
  };

  if (!allowEmail) {
    await log('skipped');
    return { queued: false, sent: false, message: 'Email disabled for this event' };
  }

  // In development, avoid invoking external email libraries (which may use CommonJS 'require')
  // and simply simulate a successful send while recording an activity log.
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEV][NOTIFICATIONS] Simulating test email send (no external send performed):', {
      to: recipient,
      subject,
      quiet,
    });
    await log('sent');
    return { queued: false, sent: true, message: 'Test email sent (development mode simulated)' };
  }

  if (quiet && prefs.digest.enabled) {
    digestQueue.push({ when: now, eventKey: 'test', subject, body });
    await log('queued');
    return { queued: true, sent: false, message: 'Quiet hours active — queued for digest' };
  }

  try {
  // Dynamically import email sender to avoid loading it at module import time
  const { sendGenericEmail } = await import('./email');
  await sendGenericEmail(recipient, subject, body);
    await log('sent');
    return { queued: false, sent: true, message: 'Test email sent successfully' };
  } catch (e) {
    await log('failed', e);
    throw e;
  }
}

// Simple digest sender; call on server start and every minute
let digestTimer: NodeJS.Timeout | null = null;
export function startDigestScheduler(storage: IStorage = defaultStorage) {
  if (digestTimer) return;
  digestTimer = setInterval(async () => {
    try {
      const prefs = await getNotificationPrefs(storage);
      if (!prefs.digest.enabled) return;
      const now = new Date();
      const target = parseTime(prefs.digest.deliveryTime);
      if (now.getHours() !== target.h || now.getMinutes() !== target.m) return;
      if (digestQueue.length === 0) return;

  const admin = await storage.getAdminByEmail(process.env.ADMIN_EMAIL || 'admin@coachwilltumbles.com');
  const recipient = admin?.email || process.env.ADMIN_EMAIL || 'admin@coachwilltumbles.com';
      const items = digestQueue.splice(0, digestQueue.length);
      const subject = 'CoachWillTumbles — Daily Digest';
      const body = `<h3>Queued Notifications</h3><ul>${items.map(i => `<li>${i.eventKey}: ${i.subject}</li>`).join('')}</ul>`;
  // Dynamically import email sender to avoid top-level dependency
  const { sendGenericEmail } = await import('./email');
  await sendGenericEmail(recipient, subject, body);
      await storage.createActivityLog({
        actorType: ActivityActorType.SYSTEM,
        actorId: null as any,
        actorName: 'System',
        actionType: ActivityActionType.EMAIL_SENT,
        actionCategory: ActivityCategory.COMMUNICATION,
        actionDescription: 'Daily digest sent',
        targetType: ActivityTargetType.EMAIL,
        targetId: 0 as any,
        targetIdentifier: recipient,
        metadata: { count: items.length },
      } as any);
    } catch (e) {
      // swallow; not critical for dev
    }
  }, 60 * 1000);
}
