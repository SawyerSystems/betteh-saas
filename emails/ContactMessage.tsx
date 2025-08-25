import React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { theme } from './components/theme';
import { EmailFooter } from './components/EmailFooter';

export const SUBJECT = 'New contact form submission';
export const PREHEADER = 'A parent just reached out — details inside.';

export function ContactMessage({
  name,
  email,
  phone,
  athleteInfo,
  message,
  logoUrl,
}: {
  name: string;
  email: string;
  phone: string;
  athleteInfo: string;
  message: string;
  logoUrl?: string;
}) {
  return (
    <EmailLayout title="📬 New Contact Form Message" preheader={PREHEADER}>

      <Text style={{ color: theme.colors.text }}>
        You received a new contact submission from CoachWillTumbles.com.
      </Text>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: theme.spacing.md }}>
        <tbody>
          <tr>
            <td style={{ fontWeight: 600, padding: '6px 8px', borderBottom: `1px solid ${theme.colors.border}` }}>Name</td>
            <td style={{ padding: '6px 8px', borderBottom: `1px solid ${theme.colors.border}` }}>{name}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600, padding: '6px 8px', borderBottom: `1px solid ${theme.colors.border}` }}>Email</td>
            <td style={{ padding: '6px 8px', borderBottom: `1px solid ${theme.colors.border}` }}>{email}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600, padding: '6px 8px', borderBottom: `1px solid ${theme.colors.border}` }}>Phone</td>
            <td style={{ padding: '6px 8px', borderBottom: `1px solid ${theme.colors.border}` }}>{phone}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600, padding: '6px 8px', borderBottom: `1px solid ${theme.colors.border}` }}>Athlete</td>
            <td style={{ padding: '6px 8px', borderBottom: `1px solid ${theme.colors.border}` }}>{athleteInfo}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 600, padding: '6px 8px', verticalAlign: 'top' }}>Message</td>
            <td style={{ padding: '6px 8px', whiteSpace: 'pre-wrap' }}>{message}</td>
          </tr>
        </tbody>
      </table>
      <Text style={{ color: theme.colors.muted, marginTop: theme.spacing.lg }}>
        Reply directly to the sender's email above to continue the conversation.
      </Text>

      <EmailFooter />
    </EmailLayout>
  );
}
