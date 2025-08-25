import { Html, Head, Preview, Body, Container, Section, Row, Column, Heading, Text, Link, Hr } from '@react-email/components';
import { EmailHeader } from './components/EmailHeader';
import { EmailFooter } from './components/EmailFooter';

interface AdminNewAthleteProps {
  athleteId: string;
  athleteName: string;
  athleteAge?: number;
  athleteGender?: string;
  athleteExperience?: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  registrationDate: string;
  waiverStatus?: string;
  adminPanelLink: string;
}

export default function AdminNewAthlete({
  athleteId,
  athleteName,
  athleteAge,
  athleteGender,
  athleteExperience,
  parentName,
  parentEmail,
  parentPhone,
  registrationDate,
  waiverStatus,
  adminPanelLink,
}: AdminNewAthleteProps) {
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

  const getWaiverStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'signed':
      case 'completed':
        return { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' };
      case 'pending':
      case 'unsigned':
        return { bg: '#fef3cd', border: '#f6cc02', text: '#92400e' };
      default:
        return { bg: '#f8fafc', border: '#e2e8f0', text: '#374151' };
    }
  };

  const waiverColors = getWaiverStatusColor(waiverStatus);

  return (
    <Html>
      <Head />
      <Preview>New athlete registered: {athleteName}</Preview>
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
                  🤸‍♀️ New Athlete Registered!
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
                    🌟 New Athlete: A new gymnast has joined your coaching program!
                  </Text>
                </div>
              </Column>
            </Row>

            {/* Athlete Information */}
            <Row>
              <Column>
                <Heading style={{ 
                  color: '#374151', 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  margin: '0 0 16px 0' 
                }}>
                  Athlete Details
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
                        Athlete ID:
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        borderBottom: '1px solid #e5e7eb' 
                      }}>
                        #{athleteId}
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
                        {athleteName}
                      </td>
                    </tr>
                    {athleteAge && (
                      <tr>
                        <td style={{ 
                          padding: '8px 12px', 
                          backgroundColor: '#f9fafb',
                          borderBottom: '1px solid #e5e7eb',
                          fontWeight: 'bold'
                        }}>
                          Age:
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          borderBottom: '1px solid #e5e7eb' 
                        }}>
                          {athleteAge} years old
                        </td>
                      </tr>
                    )}
                    {athleteGender && (
                      <tr>
                        <td style={{ 
                          padding: '8px 12px', 
                          backgroundColor: '#f9fafb',
                          borderBottom: '1px solid #e5e7eb',
                          fontWeight: 'bold'
                        }}>
                          Gender:
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          borderBottom: '1px solid #e5e7eb' 
                        }}>
                          {athleteGender.charAt(0).toUpperCase() + athleteGender.slice(1)}
                        </td>
                      </tr>
                    )}
                    {athleteExperience && (
                      <tr>
                        <td style={{ 
                          padding: '8px 12px', 
                          backgroundColor: '#f9fafb',
                          borderBottom: '1px solid #e5e7eb',
                          fontWeight: 'bold'
                        }}>
                          Experience:
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          borderBottom: '1px solid #e5e7eb' 
                        }}>
                          {athleteExperience.charAt(0).toUpperCase() + athleteExperience.slice(1)}
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
                        {formatDate(registrationDate)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Column>
            </Row>

            {/* Waiver Status */}
            {waiverStatus && (
              <Row>
                <Column>
                  <Heading style={{ 
                    color: '#374151', 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    margin: '0 0 16px 0' 
                  }}>
                    Waiver Status
                  </Heading>
                  
                  <div style={{
                    backgroundColor: waiverColors.bg,
                    border: `1px solid ${waiverColors.border}`,
                    borderRadius: '6px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <Text style={{ 
                      color: waiverColors.text, 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      margin: '0'
                    }}>
                      📋 Waiver Status: {waiverStatus.charAt(0).toUpperCase() + waiverStatus.slice(1)}
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

            {/* Next Steps */}
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
                    • Review athlete profile and experience level
                  </Text>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#92400e',
                    margin: '0 0 4px 0'
                  }}>
                    • Plan appropriate skill assessments
                  </Text>
                  {waiverStatus !== 'signed' && (
                    <Text style={{ 
                      fontSize: '14px', 
                      color: '#92400e',
                      margin: '0 0 4px 0'
                    }}>
                      • Follow up on waiver completion
                    </Text>
                  )}
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#92400e',
                    margin: '0'
                  }}>
                    • Schedule initial evaluation session
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
                  View Athlete Profile
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
                  Welcome your new athlete to the gymnastics journey!
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
