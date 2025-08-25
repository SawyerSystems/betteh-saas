import { Html, Head, Preview, Body, Container, Section, Row, Column, Heading, Text, Link, Hr } from '@react-email/components';
import { EmailHeader } from './components/EmailHeader';
import { EmailFooter } from './components/EmailFooter';

interface AdminNewParentProps {
  parentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  registrationMethod: string;
  athleteNames?: string[];
  registrationDate: string;
  adminPanelLink: string;
}

export default function AdminNewParent({
  parentId,
  parentName,
  parentEmail,
  parentPhone,
  registrationMethod,
  athleteNames = [],
  registrationDate,
  adminPanelLink,
}: AdminNewParentProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not specified';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Html>
      <Head />
      <Preview>New parent registered: {parentName}</Preview>
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
                  👨‍👩‍👧‍👦 New Parent Registered!
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
                    🎯 New Family: A new parent has joined your coaching family!
                  </Text>
                </div>
              </Column>
            </Row>

            {/* Parent Information */}
            <Row>
              <Column>
                <Heading style={{ 
                  color: '#374151', 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  margin: '0 0 16px 0' 
                }}>
                  Parent Details
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
                        Parent ID:
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        borderBottom: '1px solid #e5e7eb' 
                      }}>
                        #{parentId}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold'
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
                    <tr>
                      <td style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold'
                      }}>
                        Registration:
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        borderBottom: '1px solid #e5e7eb' 
                      }}>
                        {registrationMethod}
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
                        {formatDate(registrationDate)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Column>
            </Row>

            {/* Athletes Information */}
            {athleteNames.length > 0 && (
              <Row>
                <Column>
                  <Heading style={{ 
                    color: '#374151', 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    margin: '0 0 16px 0' 
                  }}>
                    Athletes
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
                      color: '#374151',
                      margin: '0 0 8px 0',
                      fontWeight: 'bold'
                    }}>
                      🤸‍♀️ Registered Athletes:
                    </Text>
                    {athleteNames.map((name, index) => (
                      <Text key={index} style={{ 
                        fontSize: '14px', 
                        color: '#6b7280',
                        margin: '0 0 4px 0'
                      }}>
                        • {name}
                      </Text>
                    ))}
                  </div>
                </Column>
              </Row>
            )}

            {/* Welcome Actions */}
            <Row>
              <Column>
                <Heading style={{ 
                  color: '#374151', 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  margin: '0 0 16px 0' 
                }}>
                  Next Steps
                </Heading>
                
                <div style={{
                  backgroundColor: '#fef3cd',
                  border: '1px solid #f6cc02',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#92400e',
                    margin: '0 0 8px 0',
                    fontWeight: 'bold'
                  }}>
                    📋 Recommended Actions:
                  </Text>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#92400e',
                    margin: '0 0 4px 0'
                  }}>
                    • Review parent and athlete information
                  </Text>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#92400e',
                    margin: '0 0 4px 0'
                  }}>
                    • Send a welcome message if needed
                  </Text>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#92400e',
                    margin: '0 0 4px 0'
                  }}>
                    • Check if waivers need to be completed
                  </Text>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#92400e',
                    margin: '0'
                  }}>
                    • Follow up on any pending bookings
                  </Text>
                </div>
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
                  View Parent Profile
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
                  This is an automated notification from your Coach Will Tumbles registration system.
                  <br />
                  Welcome your new family to the coaching community!
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
