// Test script to send an email with gender-conditional pronouns
const { sendEmail } = require('./server/lib/email.ts');

async function testGenderPronouns() {
  console.log('🧪 Testing gender-conditional pronouns in email templates...');

  try {
    // Test with female athlete
    console.log('\n📧 Sending SessionConfirmation with female pronouns...');
    await sendEmail({
      type: 'session-confirmation',
      to: 'will@sawyerss.com',
      data: {
        parentName: 'Test Parent',
        athleteName: 'Emma',
        athleteGender: 'female',
        sessionDate: 'Saturday, August 16th, 2025',
        sessionTime: '10:00 AM',
        manageLink: 'https://coachwilltumbles.com/parent/bookings'
      }
    });
    console.log('✅ Female pronouns email sent successfully!');

    // Test with male athlete
    console.log('\n📧 Sending SessionFollowUp with male pronouns...');
    await sendEmail({
      type: 'session-follow-up',
      to: 'will@sawyerss.com',
      data: {
        athleteName: 'Alex',
        athleteGender: 'male',
        bookingLink: 'https://coachwilltumbles.com/book'
      }
    });
    console.log('✅ Male pronouns email sent successfully!');

    // Test with non-binary athlete
    console.log('\n📧 Sending WaiverCompletionLink with they/them pronouns...');
    await sendEmail({
      type: 'waiver-completion',
      to: 'will@sawyerss.com',
      data: {
        parentName: 'Test Parent',
        athleteName: 'Jordan',
        athleteGender: 'non-binary',
        loginLink: 'https://coachwilltumbles.com/parent/login'
      }
    });
    console.log('✅ Non-binary pronouns email sent successfully!');

    // Test with no gender specified (defaults to they/them)
    console.log('\n📧 Sending SafetyInformationLink with default pronouns...');
    await sendEmail({
      type: 'safety-information',
      to: 'will@sawyerss.com',
      data: {
        parentName: 'Test Parent',
        athleteName: 'Casey',
        // athleteGender not specified - should default to they/them
        loginLink: 'https://coachwilltumbles.com/parent/login'
      }
    });
    console.log('✅ Default pronouns email sent successfully!');

    console.log('\n🎉 All test emails sent! Check will@sawyerss.com inbox.');
    console.log('\nPronouns tested:');
    console.log('- Emma (female): her training');
    console.log('- Alex (male): his effort and progress');
    console.log('- Jordan (non-binary): their gymnastics adventure');
    console.log('- Casey (default): their gymnastics sessions');

  } catch (error) {
    console.error('❌ Error sending test emails:', error);
  }
}

testGenderPronouns();
