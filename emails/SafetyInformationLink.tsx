import React from 'react';
import { Section, Text, Hr } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailFooter } from './components/EmailFooter';
import { theme } from './components/theme';
import { formatPossessivePronoun, type Gender } from './utils/pronouns';

interface SafetyInformationLinkProps {
  parentName: string;
  athleteName: string;
  athleteGender?: Gender;
  loginLink: string;
  logoUrl?: string;
}

export const SUBJECT = 'Set your safety authorization';
export const PREHEADER = 'Add who can pick up and drop off — this keeps your athlete safe.';

export function SafetyInformationLink({ parentName, athleteName, athleteGender, loginLink, logoUrl }: SafetyInformationLinkProps) {
  return (
  <EmailLayout title="Important: Safety Authorization Required 🛡️" preheader={PREHEADER}>

      <Section>
        <Text style={{ fontSize: '16px', color: theme.colors.text, lineHeight: theme.font.lineHeight }}>
          Hi {parentName}! As part of keeping {athleteName} safe during {formatPossessivePronoun(athleteGender)} gymnastics sessions, we need you to specify who is authorized for pickup and drop-off.
        </Text>
      </Section>

      <Section style={{ backgroundColor: '#e8f5e8', padding: theme.spacing.lg, borderRadius: theme.radius.md, marginBottom: theme.spacing.lg, border: '1px solid #c3e6c3' }}>
        <Text style={{ fontSize: '14px', fontWeight: 700, color: '#2d5016', margin: 0 }}>🛡️ Our Safety Commitment</Text>
        <Text style={{ fontSize: '14px', color: '#2d5016', margin: 0, lineHeight: theme.font.lineHeight }}>
          We only release athletes to authorized individuals. This protects {athleteName} and gives you peace of mind.
        </Text>
      </Section>

      <Section>
        <Text style={{ fontSize: '16px', color: theme.colors.text, lineHeight: theme.font.lineHeight }}>
          Please log in to your parent portal to specify:
        </Text>
        <Text style={{ fontSize: '14px', color: theme.colors.text, lineHeight: theme.font.lineHeight }}>
          • <strong>Drop-off Person:</strong> Who can bring {athleteName} to sessions<br />
          • <strong>Pickup Person:</strong> Who can collect {athleteName} after sessions<br />
          • <strong>Emergency Contacts:</strong> Backup authorized individuals<br />
          • <strong>Relationship Details:</strong> How each person relates to {athleteName}
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
          Set Safety Authorization
        </a>
      </Section>

      <Section>
        <Text style={{ fontSize: '14px', color: theme.colors.muted, lineHeight: theme.font.lineHeight }}>
          <strong>Quick & Easy Process:</strong><br />
          • Access your secure parent portal<br />
          • Complete safety authorization form<br />
          • Save authorized pickup/drop-off contacts<br />
          • Receive confirmation when complete
        </Text>
      </Section>

      <EmailFooter />
    </EmailLayout>
  );
}