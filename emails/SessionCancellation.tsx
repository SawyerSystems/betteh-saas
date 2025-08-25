import React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { theme } from './components/theme';
import { EmailFooter } from './components/EmailFooter';

export const SUBJECT = 'Your session has been canceled';
export const PREHEADER = 'No worries — you can reschedule in seconds with the link inside.';

export function SessionCancellation({ 
  parentName, 
  rescheduleLink,
  sessionDate,
  sessionTime,
  athleteNames,
  lessonType
}: { 
  parentName: string; 
  rescheduleLink: string;
  sessionDate?: string;
  sessionTime?: string;
  athleteNames?: string[];
  lessonType?: string;
}) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <EmailLayout title="❌ Session Cancelled" preheader={PREHEADER}>
      <Text style={{ color: theme.colors.text }}>Hi {parentName},</Text>
      
      {sessionDate && sessionTime && (
        <>
          <Text style={{ color: theme.colors.text, fontWeight: 'bold', marginBottom: '8px' }}>
            Your session scheduled for:
          </Text>
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            padding: '16px', 
            margin: '16px 0' 
          }}>
            <Text style={{ color: theme.colors.text, margin: '0 0 8px 0', fontSize: '16px' }}>
              📅 <strong>{formatDate(sessionDate)}</strong>
            </Text>
            <Text style={{ color: theme.colors.text, margin: '0 0 8px 0', fontSize: '16px' }}>
              ⏰ <strong>{formatTime(sessionTime)}</strong>
            </Text>
            {athleteNames && athleteNames.length > 0 && (
              <Text style={{ color: theme.colors.text, margin: '0 0 8px 0', fontSize: '16px' }}>
                👤 <strong>{athleteNames.join(', ')}</strong>
              </Text>
            )}
            {lessonType && (
              <Text style={{ color: theme.colors.text, margin: '0', fontSize: '16px' }}>
                🎯 <strong>{lessonType}</strong>
              </Text>
            )}
          </div>
        </>
      )}
      
      <Text style={{ color: theme.colors.text }}>
        This session has been cancelled — but no worries, I've got plenty of times open next week and beyond.
      </Text>
      
      <div style={{ textAlign: 'center', margin: `${theme.spacing.lg} 0` }}>
        <a
          href={rescheduleLink}
          style={{
            display: 'inline-block',
            backgroundColor: theme.colors.danger,
            color: '#FFFFFF',
            padding: '10px 20px',
            borderRadius: '5px',
            textDecoration: 'none',
            fontSize: '16px',
          }}
        >
          Reschedule Now
        </a>
      </div>
      
      <Text style={{ color: theme.colors.muted }}>
        Need help finding a time? Just reply and I'll help you pick a great slot.
      </Text>

      <EmailFooter />
    </EmailLayout>
  );
}
