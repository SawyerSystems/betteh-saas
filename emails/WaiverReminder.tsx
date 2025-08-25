import React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailFooter } from './components/EmailFooter';
import { theme } from './components/theme';

export const SUBJECT = 'Reminder: Please complete your waiver';
export const PREHEADER = 'It only takes a minute — waiver is required before the first session.';

export function WaiverReminder({ parentName, waiverLink }: { parentName: string; waiverLink: string }) {
  return (
  <EmailLayout title="📜 One quick step before the fun!" preheader={PREHEADER}>

      <Text style={{ color: theme.colors.text }}>Hi {parentName},</Text>
      <Text style={{ color: theme.colors.text }}>
        You’re almost set — I just need your digital waiver to finalize your athlete’s first session.
      </Text>
      <div style={{ textAlign: 'center', margin: `${theme.spacing.lg} 0` }}>
        <a
          href={waiverLink}
          style={{
            display: 'inline-block',
            backgroundColor: theme.colors.danger,
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: '5px',
            textDecoration: 'none',
            fontSize: '16px',
          }}
        >
          Complete the Waiver
        </a>
      </div>
      <Text style={{ color: theme.colors.muted }}>
        It only takes a minute, and then you’re all set. I can’t wait to welcome you!
      </Text>

      <EmailFooter />
    </EmailLayout>
  );
}