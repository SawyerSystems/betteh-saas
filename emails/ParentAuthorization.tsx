import React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { theme } from './components/theme';
import { EmailFooter } from './components/EmailFooter';

export const SUBJECT = 'Your parent access code 🔐';
export const PREHEADER = 'Use this one-time code to access your portal and manage your athlete.';

export function ParentAuthorization({ parentName, authCode, logoUrl }: { parentName: string; authCode: string; logoUrl?: string }) {
  return (
  <EmailLayout title="🗝️ Access Code to Begin Your Journey" preheader={PREHEADER}>

      <Text style={{ color: theme.colors.text }}>Hi {parentName},</Text>
      <Text style={{ color: theme.colors.text }}>
        Welcome to the Tumbleverse! You're one step closer to unlocking your athlete's next level.
      </Text>
      <Text style={{ fontSize: '18px', fontWeight: 700, color: theme.colors.text }}>Your Access Code: {authCode}</Text>
      <Text style={{ color: theme.colors.muted }}>This code expires in 10 minutes. Let the journey begin!</Text>

      <EmailFooter />
    </EmailLayout>
  );
}