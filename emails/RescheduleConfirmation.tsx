import React from 'react';
import { Text } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { theme } from './components/theme';
import { EmailFooter } from './components/EmailFooter';

export const SUBJECT = 'Your session has been rescheduled';
export const PREHEADER = 'Here are your updated date and time — see you soon!';

export function RescheduleConfirmation({ 
  newSessionDate, 
  newSessionTime, 
  athleteNames, 
  logoUrl 
}: { 
  newSessionDate: string; 
  newSessionTime: string; 
  athleteNames?: string[]; 
  logoUrl?: string;
}) {
  const formatAthleteNames = (names?: string[]) => {
    if (!names || names.length === 0) return "Your";
    
    // Extract first names from full names (in case they're provided as "First Last")
    const firstNames = names.map(name => name.split(' ')[0]);
    
    if (firstNames.length === 1) {
      return `${firstNames[0]}'s`;
    } else if (firstNames.length === 2) {
      return `${firstNames[0]} and ${firstNames[1]}'s`;
    } else {
      // For 3+ athletes, use "FirstName, SecondName, and ThirdName's"
      const lastIndex = firstNames.length - 1;
      const allButLast = firstNames.slice(0, lastIndex).join(', ');
      return `${allButLast}, and ${firstNames[lastIndex]}'s`;
    }
  };

  return (
  <EmailLayout title="🔄 New Adventure Scheduled!" preheader={PREHEADER}>

      <Text style={{ color: theme.colors.text }}>{formatAthleteNames(athleteNames)} session has been successfully rescheduled.</Text>
      <Text style={{ color: theme.colors.text }}>📅 New Date: {newSessionDate}</Text>
      <Text style={{ color: theme.colors.text }}>🕓 New Time: {newSessionTime}</Text>

      <EmailFooter />
    </EmailLayout>
  );
}