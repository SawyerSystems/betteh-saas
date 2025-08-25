import { Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailFooter } from './components/EmailFooter';
import { theme } from './components/theme';

interface EmailVerificationProps {
  firstName: string;
  verificationUrl: string;
  logoUrl?: string;
}

export const SUBJECT = 'Verify your email to continue';
export const PREHEADER = 'Tap the button to verify your address and secure your account.';

export function EmailVerification({ firstName = 'Gymnastics Parent', verificationUrl = 'https://example.com/verify', logoUrl }: EmailVerificationProps) {
  return (
      <EmailLayout logoUrl={logoUrl} title="Verify Your Email Address" preheader={PREHEADER}>

        <Text style={{ color: theme.colors.text }}>Hi {firstName},</Text>
        <Text style={{ color: theme.colors.text }}>
          Thank you for registering with Coach Will Tumbles! Please verify your email address to complete your account setup and ensure you receive important updates about your sessions.
        </Text>
        <div style={{ textAlign: 'center', margin: `${theme.spacing.lg} 0` }}>
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
            Verify My Email
          </a>
        </div>
        <Text style={{ color: theme.colors.text }}>
          If the button above doesn't work, copy and paste this URL into your browser:
        </Text>
        <Text style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px', fontSize: '14px', wordBreak: 'break-all', color: theme.colors.text }}>
          {verificationUrl}
        </Text>

        <EmailFooter />
      </EmailLayout>
  );
}

export default EmailVerification;
