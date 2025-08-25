import { Html, Head, Preview, Body, Container, Section, Row, Column, Heading, Text, Link, Hr } from '@react-email/components';
import { EmailHeader } from './components/EmailHeader';
import { EmailFooter } from './components/EmailFooter';

interface AdminNewBookingProps {
  bookingId: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  sessionDate: string;
  sessionTime: string;
  lessonType: string;
  athleteNames: string[];
  paymentStatus: string;
  bookingMethod: string;
  specialRequests?: string;
  adminPanelLink: string;
}

export default function AdminNewBooking({
  bookingId,
  parentName,
  parentEmail,
  parentPhone,
  sessionDate,
  sessionTime,
  lessonType,
  athleteNames = [],
  paymentStatus,
  bookingMethod,
  specialRequests,
  adminPanelLink,
}: AdminNewBookingProps) {
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

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'reservation-paid':
        return { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' };
      case 'pending':
      case 'unpaid':
        return { bg: '#fef3cd', border: '#f6cc02', text: '#92400e' };
      default:
        return { bg: '#f8fafc', border: '#e2e8f0', text: '#374151' };
    }
  };

  const paymentColors = getPaymentStatusColor(paymentStatus);

  return (
    <Html>
      <Head />
      <Preview>New booking #{bookingId} from {parentName}</Preview>
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
                  🎉 New Booking Received!
                </Heading>
              </Column>
            </Row>

            {/* Alert Banner */}
            <Row>
              <Column>
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <Text style={{ 
                    color: '#16a34a', 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    margin: '0'
                  }}>
                    🎯 Action Required: A new booking has been created and may need confirmation.
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
                    <tr>
                      <td style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold'
                      }}>
                        Date:
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        borderBottom: '1px solid #e5e7eb' 
                      }}>
                        {formatDate(sessionDate)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold'
                      }}>
                        Time:
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        borderBottom: '1px solid #e5e7eb' 
                      }}>
                        {formatTime(sessionTime)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold'
                      }}>
                        Booking Method:
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        borderBottom: '1px solid #e5e7eb' 
                      }}>
                        {bookingMethod}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Column>
            </Row>

            {/* Payment Status */}
            <Row>
              <Column>
                <Heading style={{ 
                  color: '#374151', 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  margin: '0 0 16px 0' 
                }}>
                  Payment Status
                </Heading>
                
                <div style={{
                  backgroundColor: paymentColors.bg,
                  border: `1px solid ${paymentColors.border}`,
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <Text style={{ 
                    color: paymentColors.text, 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    margin: '0'
                  }}>
                    💳 Payment Status: {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                  </Text>
                </div>
              </Column>
            </Row>

            {/* Special Requests */}
            {specialRequests && (
              <Row>
                <Column>
                  <Heading style={{ 
                    color: '#374151', 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    margin: '0 0 16px 0' 
                  }}>
                    Special Requests
                  </Heading>
                  
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <Text style={{ 
                      fontSize: '14px', 
                      color: '#6b7280',
                      margin: '0',
                      fontStyle: 'italic'
                    }}>
                      "{specialRequests}"
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
                  Please review the booking details and confirm with the parent if needed.
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
