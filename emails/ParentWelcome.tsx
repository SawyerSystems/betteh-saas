import { Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailFooter } from './components/EmailFooter';
import { theme } from './components/theme';

export const SUBJECT = 'Welcome to Coach Will Tumbles 👋';
export const PREHEADER = 'Here’s how to get started, log in, and make the most of training.';

export function ParentWelcome({ parentName, loginLink }: { parentName: string; loginLink: string }) {
  return (
  <EmailLayout title="Welcome to Coach Will Tumbles! 🤸‍♀️" preheader={PREHEADER}>

      <Text style={{ color: theme.colors.text }}>Hi {parentName},</Text>
      <Text style={{ color: theme.colors.text }}>
        I’m thrilled to welcome you to the Coach Will Tumbles family! Here’s how to get set up in just a few minutes:
      </Text>
      <ul style={{ color: theme.colors.text, paddingLeft: '18px', marginTop: 0 }}>
        <li>Complete your athlete’s profile</li>
        <li>Book your first session</li>
        <li>Sign the digital waiver</li>
      </ul>
      <div style={{ textAlign: 'center', margin: `${theme.spacing.lg} 0` }}>
        <a
          href={loginLink}
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
          Access Your Parent Portal
        </a>
      </div>
      <Text style={{ color: theme.colors.muted }}>
        Questions? Just reply here — I’m happy to help. I can’t wait to see your athlete grow in strength and confidence!
      </Text>

      <EmailFooter />
    </EmailLayout>
  );
}
