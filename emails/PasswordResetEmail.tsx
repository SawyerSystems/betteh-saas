import { Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailFooter } from './components/EmailFooter';
import { theme } from './components/theme';

interface PasswordResetEmailProps {
  firstName: string;
  resetToken: string;
  resetUrl: string;
  logoUrl?: string;
}

export const SUBJECT = 'Reset your Coach Will Tumbles password';
export const PREHEADER = 'Reset your password to regain access to your parent portal.';

export function PasswordResetEmail({ firstName = 'Gymnastics Parent', resetToken = 'xyz123', resetUrl = 'https://coachwilltumbles.com/parent/set-password?token=xyz123', logoUrl }: PasswordResetEmailProps) {
  return (
      <EmailLayout logoUrl={logoUrl} title="Reset Your Password" preheader={PREHEADER}>

        <Text style={{ color: theme.colors.text }}>Hi {firstName},</Text>
        <Text style={{ color: theme.colors.text }}>
          We received a request to reset your password for your Coach Will Tumbles parent portal account. If you didn't make this request, you can safely ignore this email.
        </Text>
        <Text style={{ color: theme.colors.text }}>
          To reset your password, click the button below. This link will expire in 24 hours for your security.
        </Text>
        <div style={{ textAlign: 'center', margin: `${theme.spacing.lg} 0` }}>
          <a
            href={resetUrl}
            style={{
              display: 'inline-block',
              backgroundColor: theme.colors.primary,
              color: '#FFFFFF',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            🔒 Reset My Password
          </a>
        </div>
        <Text style={{ color: theme.colors.text }}>
          If the button doesn't work, copy and paste this link into your browser:
        </Text>
        <Text style={{ color: theme.colors.primary }}>
          <a href={resetUrl} style={{ color: theme.colors.primary, textDecoration: 'underline' }}>{resetUrl}</a>
        </Text>
        <Text style={{ color: theme.colors.text, marginTop: theme.spacing.md }}>
          For your security:
        </Text>
        <Text style={{ color: theme.colors.text, marginLeft: '20px' }}>
          • This link will expire in 24 hours<br/>
          • Only use this link if you requested a password reset<br/>
          • If you didn't request this, please contact us immediately
        </Text>
        <Text style={{ color: theme.colors.text, marginTop: theme.spacing.md }}>
          Need help? Contact Coach Will at the gym or reply to this email.
        </Text>

        <EmailFooter />
      </EmailLayout>
  );
}

export default PasswordResetEmail;
