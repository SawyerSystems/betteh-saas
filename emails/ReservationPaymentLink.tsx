import React from "react";
import { Section, Text, Hr } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { EmailFooter } from './components/EmailFooter';
import { theme } from "./components/theme";

export const SUBJECT = 'Complete your reservation payment';
export const PREHEADER = 'Secure your spot — finish payment now to confirm your session.';

interface ReservationPaymentLinkProps {
  parentName: string;
  athleteName: string;
  lessonType: string;
  lessonDate: string;
  lessonTime: string;
  amount: string;
  paymentLink: string;
}

export function ReservationPaymentLink({
  parentName,
  athleteName,
  lessonType,
  lessonDate,
  lessonTime,
  amount,
  paymentLink
}: ReservationPaymentLinkProps) {
  return (
    <EmailLayout title="Complete Your Reservation" preheader={PREHEADER}>

      {/* Greeting */}
      <Section>
        <Text style={{ fontSize: '18px', fontWeight: 700, color: theme.colors.text, marginBottom: theme.spacing.md }}>
          Hi {parentName}! 🎯
        </Text>
        <Text style={{ fontSize: '16px', color: theme.colors.text, lineHeight: theme.font.lineHeight, marginBottom: theme.spacing.lg }}>
          Fantastic news! I’ve reserved a spot for <strong>{athleteName}</strong> — here are the details:
        </Text>
      </Section>

      {/* Lesson Details */}
      <Section style={{ backgroundColor: theme.colors.surface, padding: theme.spacing.lg, borderRadius: theme.radius.md, marginBottom: theme.spacing.lg }}>
        <Text style={{ fontSize: '16px', fontWeight: 700, color: theme.colors.text, margin: 0 }}>Lesson Details</Text>
        <Text style={{ fontSize: '14px', color: theme.colors.muted, margin: '8px 0 0 0', lineHeight: theme.font.lineHeight }}>
          <strong>Lesson Type:</strong> {lessonType}<br />
          <strong>Date:</strong> {lessonDate}<br />
          <strong>Time:</strong> {lessonTime}<br />
          <strong>Athlete:</strong> {athleteName}<br />
          <strong>Reservation Amount:</strong> ${amount}
        </Text>
      </Section>

      {/* CTA */}
      <Section style={{ textAlign: 'center', marginBottom: theme.spacing.lg }}>
        <a
          href={paymentLink}
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
          Complete Reservation Payment
        </a>
      </Section>

      {/* Supporting Info */}
      <Section>
        <Text style={{ fontSize: '14px', color: theme.colors.muted, lineHeight: theme.font.lineHeight, marginBottom: theme.spacing.md }}>
          <strong>What happens next?</strong><br />
          • Complete your reservation payment (secure and quick!)<br />
          • Receive waiver and safety information emails<br />
          • Get ready for an amazing gymnastics adventure!
        </Text>
      </Section>

      <EmailFooter />
    </EmailLayout>
  );
}