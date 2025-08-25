import React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailFooter } from './components/EmailFooter';
import { theme } from './components/theme';

export const SUBJECT = 'New training tip just dropped ✨';
export const PREHEADER = 'A quick, practical read to help your athlete level up — open for the tip.';

export function NewTipOrBlog({ blogTitle, blogLink, logoUrl }: { blogTitle: string; blogLink: string; logoUrl?: string }) {
  return (
  <EmailLayout title="✨ New Tip Unlocked!" preheader={PREHEADER}>

      <Text style={{ color: theme.colors.text }}>
        {blogTitle} is now live on the Tumbleverse journal. Time to level up your training knowledge.
      </Text>
      <div style={{ textAlign: 'center', margin: `${theme.spacing.lg} 0` }}>
        <a
          href={blogLink}
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
          View the Tip
        </a>
      </div>
      <Text style={{ color: theme.colors.muted }}>
        Want more like this? Reply and tell me what you're training!
      </Text>

      <EmailFooter />
    </EmailLayout>
  );
}