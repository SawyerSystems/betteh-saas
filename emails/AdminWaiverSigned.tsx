import { Html, Head, Preview, Body, Container, Section, Row, Column, Heading, Text, Link, Hr } from '@react-email/components';
import { EmailHeader } from './components/EmailHeader';
import { EmailFooter } from './components/EmailFooter';

interface AdminWaiverSignedProps {
  waiverId: string;
  athleteName: string;
  athleteId: string;
  parentName: string;
  parentEmail: string;
  signedDate: string;
  ipAddress?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalConditions?: string;
  adminPanelLink: string;
  waiverPdfLink?: string;
}

export default function AdminWaiverSigned({
  waiverId,
  athleteName,
  athleteId,
  parentName,
  parentEmail,
  signedDate,
  ipAddress,
  emergencyContactName,
  emergencyContactPhone,
  medicalConditions,
  adminPanelLink,
  waiverPdfLink,
}: AdminWaiverSignedProps) {
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

  const hasMedicalConditions = medicalConditions && medicalConditions.trim() !== '' && medicalConditions.toLowerCase() !== 'none';

  return (
    <Html>
      <Head />
      <Preview>Waiver signed for {athleteName} - Ready for training!</Preview>
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
                  ✅ Waiver Completed!
                </Heading>
              </Column>
            </Row>

            {/* Success Banner */}
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
                    🎉 Great News: {athleteName} is now cleared to participate in gymnastics activities!
                  </Text>
                </div>
              </Column>
            </Row>

            {/* Waiver Information */}
            <Row>
              <Column>
                <Heading style={{ 
                  color: '#374151', 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  margin: '0 0 16px 0' 
                }}>
                  Waiver Details
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
                        Waiver ID:
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        borderBottom: '1px solid #e5e7eb' 
                      }}>
                        #{waiverId}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold'
                      }}>
                        Athlete:
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        borderBottom: '1px solid #e5e7eb' 
                      }}>
                        {athleteName} (ID: #{athleteId})
                      </td>
                    </tr>
                    <tr>
                      <td style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold'
                      }}>
                        Signed By:
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
                    <tr>
                      <td style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#f9fafb',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 'bold'
                      }}>
                        Signed Date:
                      </td>
                      <td style={{ 
                        padding: '8px 12px', 
                        borderBottom: '1px solid #e5e7eb' 
                      }}>
                        {formatDate(signedDate)}
                      </td>
                    </tr>
                    {ipAddress && (
                      <tr>
                        <td style={{ 
                          padding: '8px 12px', 
                          backgroundColor: '#f9fafb',
                          borderBottom: '1px solid #e5e7eb',
                          fontWeight: 'bold'
                        }}>
                          IP Address:
                        </td>
                        <td style={{ 
                          padding: '8px 12px', 
                          borderBottom: '1px solid #e5e7eb',
                          fontSize: '12px',
                          fontFamily: 'monospace'
                        }}>
                          {ipAddress}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Column>
            </Row>

            {/* Emergency Contact */}
            {(emergencyContactName || emergencyContactPhone) && (
              <Row>
                <Column>
                  <Heading style={{ 
                    color: '#374151', 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    margin: '0 0 16px 0' 
                  }}>
                    Emergency Contact
                  </Heading>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                    <tbody>
                      {emergencyContactName && (
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
                            {emergencyContactName}
                          </td>
                        </tr>
                      )}
                      {emergencyContactPhone && (
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
                            <Link href={`tel:${emergencyContactPhone}`} style={{ color: '#2563eb' }}>
                              {emergencyContactPhone}
                            </Link>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Column>
              </Row>
            )}

            {/* Medical Conditions Alert */}
            {hasMedicalConditions && (
              <Row>
                <Column>
                  <Heading style={{ 
                    color: '#374151', 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    margin: '0 0 16px 0' 
                  }}>
                    Medical Information
                  </Heading>
                  
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
                      margin: '0 0 8px 0'
                    }}>
                      ⚠️ Medical Conditions Reported:
                    </Text>
                    <Text style={{ 
                      color: '#92400e', 
                      fontSize: '14px',
                      margin: '0',
                      fontStyle: 'italic'
                    }}>
                      "{medicalConditions}"
                    </Text>
                  </div>
                </Column>
              </Row>
            )}

            {!hasMedicalConditions && (
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
                      ✅ No medical conditions reported - Athlete cleared for all activities
                    </Text>
                  </div>
                </Column>
              </Row>
            )}

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
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#1e40af',
                    margin: '0 0 8px 0',
                    fontWeight: 'bold'
                  }}>
                    📋 Athlete is now cleared for:
                  </Text>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#1e40af',
                    margin: '0 0 4px 0'
                  }}>
                    • Participating in all gymnastics activities
                  </Text>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#1e40af',
                    margin: '0 0 4px 0'
                  }}>
                    • Booking lessons and sessions
                  </Text>
                  <Text style={{ 
                    fontSize: '14px', 
                    color: '#1e40af',
                    margin: '0 0 4px 0'
                  }}>
                    • Competing in events and competitions
                  </Text>
                  {hasMedicalConditions && (
                    <Text style={{ 
                      fontSize: '14px', 
                      color: '#dc2626',
                      margin: '8px 0 0 0',
                      fontWeight: 'bold'
                    }}>
                      ⚠️ Note: Review medical conditions before activities
                    </Text>
                  )}
                </div>
              </Column>
            </Row>

            {/* Action Buttons */}
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
                    margin: '8px 16px'
                  }}
                >
                  View Athlete Profile
                </Link>
                
                {waiverPdfLink && (
                  <Link
                    href={waiverPdfLink}
                    style={{
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      padding: '12px 24px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontWeight: 'bold',
                      display: 'inline-block',
                      margin: '8px 16px'
                    }}
                  >
                    Download Signed Waiver
                  </Link>
                )}
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
                  This is an automated notification from your Coach Will Tumbles waiver system.
                  <br />
                  The signed waiver has been securely stored and is legally binding.
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
