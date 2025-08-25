import React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { theme } from './components/theme';
import { EmailFooter } from './components/EmailFooter';

export const SUBJECT = 'Friendly reminder: Session tomorrow';
export const PREHEADER = 'Quick prep tips and details inside — see you soon!';

export function SessionReminder({ athleteName, sessionDate, sessionTime, manageLink }: { athleteName: string; sessionDate: string; sessionTime: string; manageLink?: string }) {
  return (
  <EmailLayout title="⏰ Session Reminder" preheader={PREHEADER}>

      <Text style={{ color: theme.colors.text }}>
        Quick heads‑up — {athleteName} has a session on <strong>{sessionDate}</strong> at <strong>{sessionTime}</strong>.
      </Text>
      <ul style={{ color: theme.colors.text, paddingLeft: '18px', marginTop: 0 }}>
        <li>Pack water and athletic wear</li>
        <li>Arrive a few minutes early</li>
        <li>A fast stretch = great start</li>
      </ul>
      {manageLink ? (
        <div style={{ textAlign: 'center', margin: `${theme.spacing.lg} 0` }}>
          <a
            href={manageLink}
            style={{
              display: 'inline-block',
              backgroundColor: theme.colors.primary,
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: '5px',
              textDecoration: 'none',
              fontSize: '16px',
            }}
          >
            View Your Booking
          </a>
        </div>
      ) : null}
      <Text style={{ color: theme.colors.muted }}>
        I'm excited for a great session — see you soon!
      </Text>

      <EmailFooter />
    </EmailLayout>
  );
}