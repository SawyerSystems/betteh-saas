import React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailFooter } from './components/EmailFooter';
import { theme } from './components/theme';
import { formatPossessivePronoun, type Gender } from './utils/pronouns';

export const SUBJECT = 'How did training go?';
export const PREHEADER = 'Ready for the next step? Book again when you’re ready — link inside.';

export function SessionFollowUp({ 
  athleteName, 
  athleteGender,
  bookingLink 
}: { 
  athleteName: string; 
  athleteGender?: Gender;
  bookingLink: string; 
}) {
  return (
  <EmailLayout title="🏆 Great work today!" preheader={PREHEADER}>

      <Text style={{ color: theme.colors.text }}>
        {athleteName} crushed it today — I always appreciate hard work. I'm very proud of {formatPossessivePronoun(athleteGender)} effort and progress.
      </Text>
      <Text style={{ color: theme.colors.text }}>
        Keep the momentum going with another session:
      </Text>
      <div style={{ textAlign: 'center', margin: `${theme.spacing.lg} 0` }}>
        <a
          href={bookingLink}
          style={{
            display: 'inline-block',
            backgroundColor: theme.colors.info,
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: '5px',
            textDecoration: 'none',
            fontSize: '16px',
          }}
        >
          Book Your Next Session
        </a>
      </div>
      <Text style={{ color: theme.colors.muted }}>
        Questions or goals to share? Reply to this email — I love partnering with parents.
      </Text>

      <EmailFooter />
    </EmailLayout>
  );
}