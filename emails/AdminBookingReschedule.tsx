import { Html, Head, Preview, Body, Container, Section, Row, Column, Heading, Text, Link, Hr } from '@react-email/components';
import { EmailHeader } from './components/EmailHeader';
import { EmailFooter } from './components/EmailFooter';

interface AdminBookingRescheduleProps {
  bookingId: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  oldSessionDate: string;
  oldSessionTime: string;
  newSessionDate: string;
  newSessionTime: string;
  lessonType: string;
  athleteNames: string[];
  rescheduleReason?: string;
  adminPanelLink: string;
}

export default function AdminBookingReschedule({
  bookingId,
  parentName,
  parentEmail,
  parentPhone,
  oldSessionDate,
  oldSessionTime,
  newSessionDate,
  newSessionTime,
  lessonType,
  athleteNames = [],
  rescheduleReason,
  adminPanelLink,
}: AdminBookingRescheduleProps) {
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return 'Not specified';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
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
    } catch {
      return dateStr;
    }
  };

  return (
    <Html>
      <Head />
      <Preview>Booking #{bookingId} has been rescheduled by {parentName}</Preview>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ margin: '0 auto', padding: '20px', maxWidth: '600px' }}>
          <EmailHeader />
          
          <Section style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '32px', marginTop: '20px' }}>
            {/* Header */}
            <Row>
              <Column>
                <Heading style={{ 
                  color: '#1f2937', 
                  fontSize: '24px', 
                  fontWeight: 'bold', 
                  margin: '0 0 24px 0',
                  textAlign: 'center'
                }}>
                  🔄 Booking Rescheduled
                </Heading>
              </Column>
            </Row>

            {/* Alert Banner */}
            <Row>
              <Column>
                <div style={{
                  backgroundColor: '#fef3cd',
                  border: '1px solid #f6cc02',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <Text style={{ 
                    color: '#92400e', 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    margin: '0'
                  }}>
                    ⚠️ Action Required: A booking has been rescheduled and may need your attention.
                  </Text>
                </div>
              </Column>
            </Row>

            {/* Booking Information */}
            <Row>
              <Column>
                <Heading style={{ 
                  color: '#374151', 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  margin: '0 0 16px 0' 
                }}>
                  Booking Details
                </Heading>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                  <tbody>
                    <tr>
                      <td style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold',
                        width: '140px'
                      }}>
                        Booking ID:
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        borderBottom: '1px solid #e5e7eb' 
                      }}>
                        #{bookingId}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold'
                      }}>
                        Lesson Type:
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        borderBottom: '1px solid #e5e7eb' 
                      }}>
                        {lessonType}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold'
                      }}>
                        Athletes:
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        borderBottom: '1px solid #e5e7eb' 
                      }}>
                        {athleteNames.length > 0 ? athleteNames.join(', ') : 'Not specified'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Column>
            </Row>

            {/* Schedule Changes */}
            <Row>
              <Column>
                <Heading style={{ 
                  color: '#374151', 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  margin: '0 0 16px 0' 
                }}>
                  Schedule Changes
                </Heading>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '20px', 
                  marginBottom: '24px',
                  flexWrap: 'wrap'
                }}>
                  {/* Old Schedule */}
                  <div style={{ 
                    flex: '1',
                    minWidth: '200px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    padding: '16px'
                  }}>
                    <Text style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      color: '#dc2626',
                      margin: '0 0 8px 0'
                    }}>
                      ❌ Previous Schedule
                    </Text>
                    <Text style={{ 
                      fontSize: '14px', 
                      color: '#374151',
                      margin: '0 0 4px 0'
                    }}>
                      <strong>Date:</strong> {formatDate(oldSessionDate)}
                    </Text>
                    <Text style={{ 
                      fontSize: '14px', 
                      color: '#374151',
                      margin: '0'
                    }}>
                      <strong>Time:</strong> {formatTime(oldSessionTime)}
                    </Text>
                  </div>

                  {/* New Schedule */}
                  <div style={{ 
                    flex: '1',
                    minWidth: '200px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    padding: '16px'
                  }}>
                    <Text style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      color: '#16a34a',
                      margin: '0 0 8px 0'
                    }}>
                      ✅ New Schedule
                    </Text>
                    <Text style={{ 
                      fontSize: '14px', 
                      color: '#374151',
                      margin: '0 0 4px 0'
                    }}>
                      <strong>Date:</strong> {formatDate(newSessionDate)}
                    </Text>
                    <Text style={{ 
                      fontSize: '14px', 
                      color: '#374151',
                      margin: '0'
                    }}>
                      <strong>Time:</strong> {formatTime(newSessionTime)}
                    </Text>
                  </div>
                </div>
              </Column>
            </Row>

            {/* Reschedule Reason */}
            {rescheduleReason && (
              <Row>
                <Column>
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <Text style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      color: '#374151',
                      margin: '0 0 8px 0'
                    }}>
                      Reschedule Reason:
                    </Text>
                    <Text style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      margin: '0',
                      fontStyle: 'italic'
                    }}>
                      "{rescheduleReason}"
                    </Text>
                  </div>
                </Column>
              </Row>
            )}

            {/* Parent Information */}
            <Row>
              <Column>
                <Heading style={{ 
                  color: '#374151', 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  margin: '0 0 16px 0' 
                }}>
                  Parent Information
                </Heading>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                  <tbody>
                    <tr>
                      <td style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold',
                        width: '140px'
                      }}>
                        Name:
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        borderBottom: '1px solid #e5e7eb' 
                      }}>
                        {parentName}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold'
                      }}>
                        Email:
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        borderBottom: '1px solid #e5e7eb' 
                      }}>
                        <Link href={`mailto:${parentEmail}`} style={{ color: '#2563eb' }}>
                          {parentEmail}
                        </Link>
                      </td>
                    </tr>
                    {parentPhone && (
                      <tr>
                        <td style={{ 
                          padding: '8px 12px', 
                          backgroundColor: '#f9fafb',
                          borderBottom: '1px solid #e5e7eb',
                          fontWeight: 'bold'
                        }}>
                          Phone:
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          borderBottom: '1px solid #e5e7eb' 
                        }}>
                          <Link href={`tel:${parentPhone}`} style={{ color: '#2563eb' }}>
                            {parentPhone}
                          </Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Column>
            </Row>

            {/* Action Button */}
            <Row>
              <Column align="center">
                <Link
                  href={adminPanelLink}
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    display: 'inline-block',
                    margin: '16px 0'
                  }}
                >
                  View in Admin Panel
                </Link>
              </Column>
            </Row>

            <Hr style={{ margin: '32px 0', borderColor: '#e5e7eb' }} />

            {/* Footer Note */}
            <Row>
              <Column>
                <Text style={{ 
                  fontSize: '12px', 
                  color: '#6b7280', 
                  textAlign: 'center',
                  margin: '0'
                }}>
                  This is an automated notification from your Coach Will Tumbles booking system.
                  <br />
                  Please update your calendar and confirm the new schedule with the parent if needed.
                </Text>
              </Column>
            </Row>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
}
