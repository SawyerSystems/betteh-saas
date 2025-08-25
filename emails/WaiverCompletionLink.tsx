import React from 'react';
import { Section, Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailFooter } from './components/EmailFooter';
import { theme } from './components/theme';
import { formatPossessivePronoun, type Gender } from './utils/pronouns';

export const SUBJECT = 'Please complete your waiver';
export const PREHEADER = 'Required before the first session — it only takes a minute.';
interface WaiverCompletionLinkProps {
  parentName: string;
  athleteName: string;
  athleteGender?: Gender;
  loginLink: string;
  logoUrl?: string;
}

export function WaiverCompletionLink({ parentName, athleteName, athleteGender, loginLink, logoUrl }: WaiverCompletionLinkProps) {
  return (
    <EmailLayout logoUrl={logoUrl} title="📝 Complete Your Waiver" preheader={PREHEADER}>

      <Section>
        <Text style={{ fontSize: '16px', color: theme.colors.text, lineHeight: theme.font.lineHeight }}>
          Hi {parentName}! Welcome to the CoachWillTumbles family!
        </Text>
        <Text style={{ fontSize: '16px', color: theme.colors.text, lineHeight: theme.font.lineHeight }}>
          Before {athleteName} can begin {formatPossessivePronoun(athleteGender)} gymnastics adventure, I need you to complete {formatPossessivePronoun(athleteGender)} digital waiver and adventure agreement. This ensures everyone's safety and sets clear expectations for the training experience.
        </Text>
      </Section>

      <Section style={{ backgroundColor: '#fff3cd', padding: theme.spacing.lg, borderRadius: theme.radius.md, marginBottom: theme.spacing.lg, border: '1px solid #ffeaa7' }}>
        <Text style={{ fontSize: '14px', fontWeight: 700, color: '#856404', margin: 0 }}>⚠️ Required Before First Lesson</Text>
        <Text style={{ fontSize: '14px', color: '#856404', margin: 0, lineHeight: theme.font.lineHeight }}>
          Every athlete must have a signed waiver on file before they can participate in any training session. No waiver = no training.
        </Text>
      </Section>

      <Section style={{ textAlign: 'center', marginBottom: theme.spacing.lg }}>
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
          Complete Waiver Form
        </a>
      </Section>

      <Section>
        <Text style={{ fontSize: '14px', color: theme.colors.muted, lineHeight: theme.font.lineHeight }}>
          <strong>What to expect:</strong><br />
          • Secure parent portal login<br />
          • Digital waiver form (takes 2-3 minutes)<br />
          • Electronic signature capability<br />
          • Automatic confirmation email when complete
        </Text>
      </Section>

      <EmailFooter />
  </EmailLayout>
  );
}