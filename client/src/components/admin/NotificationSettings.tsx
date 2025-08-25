import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type ChannelPref = { email: boolean; sms: boolean };
type EventKey = keyof ReturnType<typeof getDefaultEvents>;

function getDefaultEvents() {
  return {
    test: { label: 'Test Notification', description: 'Send a test notification to verify settings.' },
    session_confirmation: { label: 'Session Confirmation', description: 'Email after booking is confirmed.' },
    session_reminder: { label: 'Session Reminder', description: 'Reminder before a session.' },
    session_cancelled: { label: 'Session Cancelled', description: 'Notify when a session is cancelled.' },
    session_no_show: { label: 'No-Show Notice', description: 'Notify after a missed session.' },
    session_follow_up: { label: 'Post-Session Follow-up', description: 'Follow-up after a completed session.' },
    waiver_reminder: { label: 'Waiver Reminder', description: 'Reminder to complete waiver.' },
    reservation_payment: { label: 'Reservation Payment', description: 'Send reservation payment link.' },
    waiver_completion: { label: 'Waiver Completion', description: 'Notify with waiver completion link.' },
    safety_information: { label: 'Safety Information', description: 'Send safety information link.' },
  } as const;
}

type NotificationsPrefs = {
  channelsByEvent: Record<string, ChannelPref>;
  quietHours: { enabled: boolean; start: string; end: string; urgentOnlyDuringQuietHours: boolean };
  digest: { enabled: boolean; deliveryTime: string };
  smsProviderConfigured?: boolean;
};

const defaultPrefs: NotificationsPrefs = {
  channelsByEvent: Object.fromEntries(Object.keys(getDefaultEvents()).map(k => [k, { email: true, sms: false }])),
  quietHours: { enabled: false, start: '21:00', end: '08:00', urgentOnlyDuringQuietHours: true },
  digest: { enabled: false, deliveryTime: '08:00' },
  smsProviderConfigured: false,
};

export default function NotificationSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['/api/site-content/about'],
    queryFn: async () => {
      const res = await fetch('/api/site-content/about');
      if (!res.ok) throw new Error('Failed to load about');
      return res.json() as Promise<{ about: any }>;
    },
  });

  const [prefs, setPrefs] = useState<NotificationsPrefs>(defaultPrefs);

  const events = useMemo(() => getDefaultEvents(), []);
  const smsDisabled = !prefs.smsProviderConfigured;

  useEffect(() => {
    if (data?.about) {
      const incoming = (data.about.notifications as NotificationsPrefs) || ({} as any);
      setPrefs({
        ...defaultPrefs,
        ...incoming,
        channelsByEvent: { ...defaultPrefs.channelsByEvent, ...(incoming.channelsByEvent || {}) },
        quietHours: { ...defaultPrefs.quietHours, ...(incoming.quietHours || {}) },
        digest: { ...defaultPrefs.digest, ...(incoming.digest || {}) },
        smsProviderConfigured: !!incoming.smsProviderConfigured,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (nextPrefs: NotificationsPrefs) => {
      const res = await fetch('/api/admin/site-content/about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ about: { ...(data?.about || {}), notifications: nextPrefs } }),
      });
      if (!res.ok) throw new Error('Failed to save notifications');
      return res.json() as Promise<{ success: boolean; about: any }>;
    },
    onSuccess: (out) => {
      qc.invalidateQueries({ queryKey: ['/api/site-content/about'] });
      const saved = (out?.about?.notifications as NotificationsPrefs) || defaultPrefs;
      setPrefs(prev => ({ ...prev, ...saved }));
    },
  });

  const handleToggle = (eventKey: string, channel: keyof ChannelPref, value: boolean) => {
    setPrefs(prev => ({
      ...prev,
      channelsByEvent: {
        ...prev.channelsByEvent,
        [eventKey]: { ...prev.channelsByEvent[eventKey], [channel]: value },
      },
    }));
  };

  const handleQuietHoursChange = (key: 'enabled' | 'start' | 'end' | 'urgentOnlyDuringQuietHours', value: boolean | string) => {
    setPrefs(prev => ({ ...prev, quietHours: { ...prev.quietHours, [key]: value } as any }));
  };

  const handleDigestChange = (key: 'enabled' | 'deliveryTime', value: boolean | string) => {
    setPrefs(prev => ({ ...prev, digest: { ...prev.digest, [key]: value } as any }));
  };

  const [testTo, setTestTo] = useState('');
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const sendTest = async () => {
    setTestStatus('Sending…');
    try {
      const res = await fetch('/api/admin/notifications/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testTo || undefined, urgent: false, eventKey: 'test' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to send');
      setTestStatus(json?.message || 'Sent');
    } catch (e: any) {
      setTestStatus(`Error: ${e.message}`);
    }
  };

  if (isLoading) return (
    <div className="rounded-lg border p-4 bg-white/40 dark:bg-white/5 dark:border-white/10">
      <div className="font-medium mb-2">Notifications</div>
      <div className="text-sm text-gray-500 dark:text-slate-400">Loading…</div>
    </div>
  );

  return (
    <div className="rounded-lg border p-4 space-y-6 bg-white/40 dark:bg-white/5 dark:border-white/10">
      <div>
        <div className="font-medium text-lg">Notifications</div>
        <div className="text-sm text-gray-600 dark:text-slate-300">Email-first. SMS is disabled until a provider is configured.</div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {Object.entries(events).map(([key, meta]) => (
          <div key={key} className="border rounded-md p-3 bg-white/30 dark:bg-white/5 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{meta.label}</div>
                <div className="text-sm text-gray-600 dark:text-slate-300">{meta.description}</div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!prefs.channelsByEvent[key]?.email}
                    onChange={(e) => handleToggle(key, 'email', e.target.checked)}
                  />
                  Email
                </label>
                <label className="flex items-center gap-2 text-sm opacity-60">
                  <input
                    type="checkbox"
                    disabled={smsDisabled}
                    checked={!!prefs.channelsByEvent[key]?.sms}
                    onChange={(e) => handleToggle(key, 'sms', e.target.checked)}
                  />
                  SMS {smsDisabled && <span className="text-xs text-gray-500 dark:text-slate-400">(disabled)</span>}
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-md p-3 space-y-3 bg-white/30 dark:bg-white/5 dark:border-white/10">
          <div className="font-medium">Quiet Hours</div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.quietHours.enabled}
              onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
            />
            Enable quiet hours
          </label>
          <div className="flex gap-3 items-center">
            <div className="text-sm w-20">Start</div>
            <input
              type="time"
              className="border rounded px-2 py-1 text-sm bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60"
              value={prefs.quietHours.start}
              onChange={(e) => handleQuietHoursChange('start', e.target.value)}
            />
          </div>
          <div className="flex gap-3 items-center">
            <div className="text-sm w-20">End</div>
            <input
              type="time"
              className="border rounded px-2 py-1 text-sm bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60"
              value={prefs.quietHours.end}
              onChange={(e) => handleQuietHoursChange('end', e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.quietHours.urgentOnlyDuringQuietHours}
              onChange={(e) => handleQuietHoursChange('urgentOnlyDuringQuietHours', e.target.checked)}
            />
            Urgent-only during quiet hours
          </label>
        </div>

        <div className="border rounded-md p-3 space-y-3 bg-white/30 dark:bg-white/5 dark:border-white/10">
          <div className="font-medium">Non-urgent Digest</div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.digest.enabled}
              onChange={(e) => handleDigestChange('enabled', e.target.checked)}
            />
            Enable daily digest for non-urgent
          </label>
          <div className="flex gap-3 items-center">
            <div className="text-sm w-32">Delivery time</div>
            <input
              type="time"
              className="border rounded px-2 py-1 text-sm bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60"
              value={prefs.digest.deliveryTime}
              onChange={(e) => handleDigestChange('deliveryTime', e.target.value)}
            />
          </div>
          <div className="pt-2 border-t mt-2">
            <div className="text-sm font-medium mb-2">Send a test</div>
            <div className="flex gap-2 items-center">
              <input
                type="email"
                placeholder="you@example.com (optional)"
                className="border rounded px-2 py-1 text-sm flex-1 bg-white dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
              />
              <button onClick={sendTest} className="px-3 py-1 rounded bg-blue-600 text-white text-sm">Send Test</button>
            </div>
            {testStatus && <div className="text-xs text-gray-600 dark:text-slate-300 mt-2">{testStatus}</div>}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="px-4 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700"
          onClick={() => saveMutation.mutate(prefs)}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
