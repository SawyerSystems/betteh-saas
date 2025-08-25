import { Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { theme } from './components/theme';
import { EmailFooter } from './components/EmailFooter';

export const SUBJECT = 'Verify your email';
export const PREHEADER = 'Quick tap to verify — takes just a second.';

export function MinimalEmailVerification({ firstName, verificationUrl, logoUrl }: { firstName: string; verificationUrl: string; logoUrl?: string }) {
  return (
  <EmailLayout logoUrl={logoUrl} title="Verify Your Email Address" preheader={PREHEADER}>

        <Text style={{ color: theme.colors.text }}>Hi {firstName},</Text>
        <Text style={{ color: theme.colors.text }}>Please verify your email by clicking the button below:</Text>
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <a
            href={verificationUrl}
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
            Verify Email
          </a>
        </div>
        <EmailFooter />
      </EmailLayout>
  );
}
