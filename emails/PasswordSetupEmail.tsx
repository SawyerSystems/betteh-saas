import { Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailFooter } from './components/EmailFooter';
import { theme } from './components/theme';

interface PasswordSetupEmailProps {
  firstName: string;
  resetToken: string;
  resetUrl: string;
  logoUrl?: string;
}

export const SUBJECT = 'Welcome to Coach Will Tumbles! Set up your password to get started';
export const PREHEADER = 'Welcome to our gymnastics family! Create your password to access your parent portal.';

export function PasswordSetupEmail({ firstName = 'Gymnastics Parent', resetToken = 'xyz123', resetUrl = 'https://coachwilltumbles.com/parent/set-password?token=xyz123', logoUrl }: PasswordSetupEmailProps) {
  return (
      <EmailLayout logoUrl={logoUrl} title="Welcome to Coach Will Tumbles!" preheader={PREHEADER}>

        <Text style={{ color: theme.colors.text }}>Hi {firstName},</Text>
        <Text style={{ color: theme.colors.text }}>
          🎉 <strong>Welcome to the Coach Will Tumbles family!</strong> We're thrilled to have you join our gymnastics community.
        </Text>
        <Text style={{ color: theme.colors.text }}>
          Your account has been created and we're excited to help your gymnast(s) grow their skills and confidence. To get started and access your parent portal where you can view bookings, track progress, and stay connected, you'll need to set up your password.
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
            🔐 Set Up My Password
          </a>
        </div>
        <Text style={{ color: theme.colors.text }}>
          Once you've set up your password, you'll be able to:
        </Text>
        <Text style={{ color: theme.colors.text, marginLeft: '20px' }}>
          • View and manage your gymnast's upcoming sessions<br/>
          • Track progress and achievements<br/>
          • Access important safety information and waivers<br/>
          • Communicate directly with Coach Will<br/>
          • Book future sessions with ease
        </Text>
        <Text style={{ color: theme.colors.text }}>
          If the button doesn't work, copy and paste this link into your browser:
        </Text>
        <Text style={{ color: theme.colors.primary }}>
          <a href={resetUrl} style={{ color: theme.colors.primary, textDecoration: 'underline' }}>{resetUrl}</a>
        </Text>
        <Text style={{ color: theme.colors.text, marginTop: theme.spacing.md }}>
          Welcome to our gymnastics family! We can't wait to help your gymnast soar to new heights! 🤸‍♀️✨
        </Text>

        <EmailFooter />
      </EmailLayout>
  );
}

export default PasswordSetupEmail;
