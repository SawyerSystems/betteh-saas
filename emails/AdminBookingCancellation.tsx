import { Html, Head, Preview, Body, Container, Section, Row, Column, Heading, Text, Link, Hr } from '@react-email/components';
import { EmailHeader } from './components/EmailHeader';
import { EmailFooter } from './components/EmailFooter';

interface AdminBookingCancellationProps {
  bookingId: string;
  parentName: string;
  parentEmail: string;
  sessionDate: string;
  sessionTime: string;
  lessonType: string;
  athleteNames: string[];
  cancellationReason: string;
  wantsReschedule: boolean;
  preferredRescheduleDate?: string;
  preferredRescheduleTime?: string;
  adminPanelLink: string;
}

export default function AdminBookingCancellation({
  bookingId,
  parentName,
  parentEmail,
  sessionDate,
  sessionTime,
  lessonType,
  athleteNames = [],
  cancellationReason,
  wantsReschedule,
  preferredRescheduleDate,
  preferredRescheduleTime,
  adminPanelLink,
}: {
  bookingId: string;
  parentName: string;
  parentEmail: string;
  sessionDate?: string;
  sessionTime?: string;
  lessonType: string;
  athleteNames: string[];
  cancellationReason: string;
  wantsReschedule: boolean;
  preferredRescheduleDate?: string;
  preferredRescheduleTime?: string;
  adminPanelLink: string;
}) {
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return 'Not specified';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      return 'Invalid time';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not specified';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>
        {wantsReschedule 
          ? `Booking Cancellation & Reschedule Request - ${parentName}` 
          : `Booking Cancellation Notice - ${parentName}`
        }
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <EmailHeader />
          
          <Section style={content}>
            <Heading style={h1}>
              {wantsReschedule ? '🔄 Reschedule Request' : '❌ Booking Cancelled'}
            </Heading>
            
            <Text style={text}>
              A parent has {wantsReschedule ? 'cancelled their booking and requested a reschedule' : 'cancelled their booking'}.
            </Text>

            {/* Alert Box */}
            <Section style={wantsReschedule ? alertBoxReschedule : alertBoxCancel}>
              <Text style={alertText}>
                {wantsReschedule 
                  ? '⚠️ Action Required: Please contact the parent to arrange a new session time.'
                  : 'ℹ️ No further action needed - this is a full cancellation.'
                }
              </Text>
            </Section>

            {/* Booking Details */}
            <Section style={detailsSection}>
              <Heading style={h2}>📋 Booking Details</Heading>
              
              <Row style={detailRow}>
                <Column style={labelColumn}>
                  <Text style={label}>Booking ID:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={value}>#{bookingId}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={labelColumn}>
                  <Text style={label}>Parent:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={value}>{parentName}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={labelColumn}>
                  <Text style={label}>Email:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Link href={`mailto:${parentEmail}`} style={emailLink}>
                    {parentEmail}
                  </Link>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={labelColumn}>
                  <Text style={label}>Athletes:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={value}>
                    {athleteNames.length > 0 ? athleteNames.join(', ') : 'Not specified'}
                  </Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={labelColumn}>
                  <Text style={label}>Session Date:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={value}>{formatDate(sessionDate)}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={labelColumn}>
                  <Text style={label}>Session Time:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={value}>{formatTime(sessionTime)}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={labelColumn}>
                  <Text style={label}>Lesson Type:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={value}>{lessonType}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={labelColumn}>
                  <Text style={label}>Reason:</Text>
                </Column>
                <Column style={valueColumn}>
                  <Text style={value}>{cancellationReason || 'No reason provided'}</Text>
                </Column>
              </Row>
            </Section>

            {/* Reschedule Information */}
            {wantsReschedule && (
              <Section style={rescheduleSection}>
                <Heading style={h2}>🔄 Reschedule Request</Heading>
                <Text style={text}>
                  The parent has requested to reschedule this session:
                </Text>
                
                {preferredRescheduleDate && (
                  <Row style={detailRow}>
                    <Column style={labelColumn}>
                      <Text style={label}>Preferred Date:</Text>
                    </Column>
                    <Column style={valueColumn}>
                      <Text style={value}>{formatDate(preferredRescheduleDate)}</Text>
                    </Column>
                  </Row>
                )}

                {preferredRescheduleTime && (
                  <Row style={detailRow}>
                    <Column style={labelColumn}>
                      <Text style={label}>Preferred Time:</Text>
                    </Column>
                    <Column style={valueColumn}>
                      <Text style={value}>{formatTime(preferredRescheduleTime)}</Text>
                    </Column>
                  </Row>
                )}

                <Text style={actionText}>
                  Please contact {parentName} at {parentEmail} to arrange the new session time.
                </Text>
              </Section>
            )}

            <Hr style={hr} />

            {/* Action Button */}
            <Section style={buttonSection}>
              <Link href={adminPanelLink} style={button}>
                View in Admin Panel
              </Link>
            </Section>

            <Text style={footerText}>
              This notification was automatically generated when the parent cancelled their booking.
            </Text>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const content = {
  padding: '5px 50px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#374151',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '24px 0 16px',
};

const text = {
  color: '#6b7280',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const alertBoxCancel = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
};

const alertBoxReschedule = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fed7aa',
  borderRadius: '8px',
  padding: '16px',
  margin: '20px 0',
};

const alertText = {
  color: '#991b1b',
  fontSize: '14px',
  fontWeight: '500',
  lineHeight: '20px',
  margin: '0',
  textAlign: 'center' as const,
};

const detailsSection = {
  backgroundColor: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const rescheduleSection = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const detailRow = {
  margin: '8px 0',
};

const labelColumn = {
  width: '140px',
  verticalAlign: 'top' as const,
};

const valueColumn = {
  verticalAlign: 'top' as const,
};

const label = {
  color: '#374151',
  fontSize: '14px',
  fontWeight: '500',
  lineHeight: '20px',
  margin: '0',
};

const value = {
  color: '#1f2937',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
};

const emailLink = {
  color: '#3b82f6',
  fontSize: '14px',
  lineHeight: '20px',
  textDecoration: 'underline',
};

const actionText = {
  color: '#059669',
  fontSize: '14px',
  fontWeight: '500',
  lineHeight: '20px',
  margin: '16px 0 0',
  textAlign: 'center' as const,
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '32px 0 0',
  textAlign: 'center' as const,
};
