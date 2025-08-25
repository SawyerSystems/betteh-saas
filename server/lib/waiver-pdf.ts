import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';

interface WaiverData {
  athleteName: string;
  signerName: string;
  relationshipToAthlete: string;
  emergencyContactNumber: string;
  signature: string; // Base64 signature
  signedAt: Date;
  understandsRisks: boolean;
  agreesToPolicies: boolean;
  authorizesEmergencyCare: boolean;
  allowsPhotoVideo: boolean;
  confirmsAuthority: boolean;
}

const WAIVER_TEXT = `
CoachWillTumbles.com
Waiver & Adventure Agreement

Welcome to the journey! Every hero needs a guide, and every quest begins with a few ground rules. Before your athlete joins the adventure, please read this carefully. Signing below means you're all in — ready, aware, and on board with everything below.

1. What's a Session?
Whether we call it a session or a lesson, it means the same thing — a scheduled block of training with Coach Will.

2. Risks of the Journey
Tumbling, gymnastics, and athletic training are physical adventures — and every adventure carries risks, including but not limited to:
- Scrapes, bruises, strains, sprains
- Joint dislocations, muscle pulls, broken bones
- Head, neck, and spinal injuries
- Accidental contact with equipment or others

You acknowledge these risks cannot be eliminated and voluntarily assume all risks associated with participation.

3. Release of Liability and Indemnification
In consideration of participation, you, on behalf of yourself, your athlete, and your heirs, release and hold harmless Coach Will Sawyer, affiliated coaches and staff, Oceanside Gymnastics, and any partnered facilities (collectively, the "Providers") from any and all claims, demands, or causes of action arising out of ordinary negligence. This release does not apply to gross negligence, willful misconduct, or intentional acts.

You agree to indemnify and defend the Providers against any claims, damages, or expenses arising from your athlete's participation.

4. Emergency Medical Care Authorization
In case of injury, you authorize Coach Will and affiliated staff to administer first aid and/or seek emergency medical treatment, including transportation to a medical facility. You agree to be financially responsible for all related costs and understand you will be notified as soon as reasonably possible.

5. Booking & Payment Policies
- A reservation fee is required to secure your session.
- If payment fails, you have 12 hours to complete it before your spot is forfeited.
- Remaining balance is due at session start.
- Accepted payments: Cash, Zelle, Venmo, CashApp (no cards or checks).
- Semi-private sessions include no more than two athletes per session.
- Reservation fees are non-refundable if canceled within 24 hours of the session.
- No-shows without notifying Coach Will forfeit reservation fees.
- Cancellations must be made via text, email, or the CoachWillTumbles.com Parent Portal.
- Do not call the gym to cancel — always contact Coach Will directly.

6. Session Timing
Late arrivals will be charged full session fees. Early arrivals may warm up quietly but must wait for coach approval before using equipment or practicing skills.

7. Parents, Guests & Siblings
Only athletes and coaches are allowed in training areas or on equipment. Please watch from designated viewing areas and keep floors clear during active sessions.

8. Photo & Video Release
You grant permission for CoachWillTumbles to use photos or videos of your athlete for training, promotional materials, or social media. You agree to provide written notice to opt out.

9. Appropriate Attire
For the safety and comfort of all athletes, participants must wear suitable athletic clothing that allows free movement and does not restrict performance. Recommended attire includes fitted t-shirts or tank tops, athletic shorts, leggings, or gymnastics leotards. Please avoid loose or baggy clothing, jewelry, watches, or any accessories that could cause injury or interfere with training. Proper footwear or bare feet are required as directed by the coach. Failure to wear appropriate attire may result in exclusion from training.

10. Waiver Requirements
Every athlete must have a signed waiver on file with both Oceanside Gymnastics and CoachWillTumbles.com. No waiver = no training.

11. Severability
If any part of this Agreement is found invalid or unenforceable, the remaining provisions shall remain in full force and effect.

12. Governing Law and Venue
This Agreement shall be governed by the laws of the State of California. Any disputes arising hereunder shall be resolved exclusively in the courts located in San Diego County, California.

13. Acknowledgment and Authority to Sign
By signing below, you certify that:
- You have read this entire Waiver & Adventure Agreement, fully understand its terms, and voluntarily agree to be bound by it.
- You are either the parent or legal guardian of the athlete named below, or you are at least 18 years old and signing on your own behalf.
- You acknowledge the risks involved and voluntarily assume those risks.
`;

export async function generateWaiverPDF(waiverData: WaiverData): Promise<Buffer> {
  // Input normalization and diagnostics
  const coerceDate = (value: any): Date => {
    if (value instanceof Date) return value;
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      console.warn('[PDF] Invalid signedAt; defaulting to now. Got:', value);
      return new Date();
    }
    return d;
  };

  console.log('[PDF] generateWaiverPDF payload snapshot:', {
    athleteName: waiverData?.athleteName,
    signerName: waiverData?.signerName,
    relationshipToAthlete: waiverData?.relationshipToAthlete,
    emergencyContactNumber: waiverData?.emergencyContactNumber,
    signedAtType: waiverData?.signedAt instanceof Date ? 'Date' : typeof (waiverData as any)?.signedAt,
    signedAtRaw: (waiverData as any)?.signedAt,
    signaturePrefix: typeof waiverData?.signature === 'string' ? waiverData.signature.slice(0, 30) : null,
    signatureLength: typeof waiverData?.signature === 'string' ? waiverData.signature.length : 0,
    flags: {
      understandsRisks: waiverData?.understandsRisks,
      agreesToPolicies: waiverData?.agreesToPolicies,
      authorizesEmergencyCare: waiverData?.authorizesEmergencyCare,
      allowsPhotoVideo: waiverData?.allowsPhotoVideo,
      confirmsAuthority: waiverData?.confirmsAuthority,
    }
  });

  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Add pages as needed
  let page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  const margin = 50;
  const maxWidth = width - (margin * 2);
  
  let yPosition = height - margin;
  const lineHeight = 14;
  const smallLineHeight = 12;
  
  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, font: any, fontSize: number, color = rgb(0, 0, 0), maxWidth?: number) => {
    if (maxWidth) {
      const words = text.split(' ');
      let line = '';
      let currentY = y;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (textWidth > maxWidth && line !== '') {
          page.drawText(line.trim(), {
            x,
            y: currentY,
            size: fontSize,
            font,
            color,
          });
          line = words[i] + ' ';
          currentY -= lineHeight;
          
          // Check if we need a new page
          if (currentY < margin + 100) {
            page = pdfDoc.addPage([612, 792]);
            currentY = height - margin;
          }
        } else {
          line = testLine;
        }
      }
      
      if (line.trim() !== '') {
        page.drawText(line.trim(), {
          x,
          y: currentY,
          size: fontSize,
          font,
          color,
        });
        currentY -= lineHeight;
      }
      
      return currentY;
    } else {
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color,
      });
      return y - lineHeight;
    }
  };
  
  // Header: title on the left, logo on the top-right
  let titleX = margin;
  let headerBlockHeight = 0;
  try {
    const logoPathCandidates = [
      // Repo root assets
      path.join(process.cwd(), 'attached_assets', 'CWT_Circle_LogoSPIN.png'),
      path.join(process.cwd(), 'attached_assets', 'CoachWillTumblesText.png'),
      // When cwd differs, resolve relative to compiled server files
      path.resolve(__dirname, '../../attached_assets/CWT_Circle_LogoSPIN.png'),
      path.resolve(__dirname, '../../attached_assets/CoachWillTumblesText.png'),
      // Fallback to client/public where the web app serves the same asset
      path.join(process.cwd(), 'client', 'public', 'CWT_Circle_LogoSPIN.png'),
      path.resolve(__dirname, '../../client/public/CWT_Circle_LogoSPIN.png'),
    ];
    let logoBytes: Buffer | null = null;
    let logoPathUsed: string | null = null;
    for (const p of logoPathCandidates) {
      try {
        logoBytes = await fs.readFile(p);
        logoPathUsed = p;
        break;
      } catch { /* try next */ }
    }
  if (logoBytes) {
      // Try PNG first; if it fails, try JPG
      let logoImage: any = null;
      try {
        logoImage = await pdfDoc.embedPng(logoBytes);
      } catch {
        try {
          logoImage = await pdfDoc.embedJpg(logoBytes);
        } catch { /* ignore */ }
      }
      if (logoImage) {
        // Target height for a compact header logo (slightly larger for visibility)
        const targetHeight = 42;
        const scale = targetHeight / logoImage.height;
        const drawHeight = targetHeight;
        const drawWidth = logoImage.width * scale;
        // Position at top-right of the page, inside margins
        const x = width - margin - drawWidth;
        const y = height - margin - drawHeight + 6;
        page.drawImage(logoImage, { x, y, width: drawWidth, height: drawHeight });
        // Keep title at left margin; header height should fit tallest element
        headerBlockHeight = Math.max(headerBlockHeight, drawHeight);
        if (logoPathUsed) {
          console.log('[PDF] Embedded logo from:', logoPathUsed);
        }
      } else {
        console.warn('[PDF] Logo image could not be embedded (unsupported format)');
      }
    } else {
      console.warn('[PDF] Logo file not found in attached_assets');
    }
  } catch (logoErr) {
    console.warn('[PDF] Failed to embed logo:', logoErr);
  }

  // Title text at the left
  const titleTopY = height - margin - 2;
  page.drawText('CoachWillTumbles.com', {
    x: titleX,
    y: titleTopY,
    size: 18,
    font: helveticaBold,
    color: rgb(0.8, 0.2, 0.2),
  });
  page.drawText('Waiver & Adventure Agreement', {
    x: titleX,
    y: titleTopY - 20,
    size: 16,
    font: helveticaBold,
    color: rgb(0.8, 0.2, 0.2),
  });
  headerBlockHeight = Math.max(headerBlockHeight, 38);
  yPosition = height - margin - headerBlockHeight - 20;
  
  // Date - format to local date string for better readability
  const signedDate = coerceDate(waiverData.signedAt);
  const dateStr = signedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  yPosition = addText(`Signed on: ${dateStr}`, margin, yPosition, helveticaFont, 10);
  yPosition -= 20;
  
  // Waiver content
  const sections = WAIVER_TEXT.trim().split('\n\n');
  
  for (const section of sections) {
    if (section.trim() === '') continue;
    
    // Check if we need a new page
    if (yPosition < margin + 150) {
      page = pdfDoc.addPage([612, 792]);
      yPosition = height - margin;
    }
    
    if (section.startsWith('CoachWillTumbles.com') || section.startsWith('Waiver & Adventure Agreement')) {
      continue; // Skip title sections already added
    }
    
    // Check if it's a numbered section
    if (/^\d+\./.test(section.trim())) {
      const [title, ...content] = section.split('\n');
      yPosition = addText(title, margin, yPosition, helveticaBold, 12, rgb(0, 0, 0), maxWidth);
      yPosition -= 5;
      
      for (const line of content) {
        if (line.trim() !== '') {
          yPosition = addText(line, margin, yPosition, helveticaFont, 10, rgb(0, 0, 0), maxWidth);
        }
      }
    } else {
      yPosition = addText(section, margin, yPosition, helveticaFont, 10, rgb(0, 0, 0), maxWidth);
    }
    
    yPosition -= 10;
  }
  
  // Add signature section
  if (yPosition < margin + 200) {
    page = pdfDoc.addPage([612, 792]);
    yPosition = height - margin;
  }
  
  yPosition -= 30;
  
  // Agreement checkboxes
  const checkboxSize = 10;
  const checkboxes = [
    `[X] I understand that tumbling and gymnastics carry inherent risks, and I accept full responsibility for any injuries that may occur.`,
    `[X] I have read and agree to the payment, cancellation, and attendance policies, including that reservation fees are non-refundable within 24 hours of the session.`,
    `[X] I authorize Coach Will and affiliated staff to provide or seek emergency medical care for my athlete if needed.`,
    `${waiverData.allowsPhotoVideo ? '[X]' : '[ ]'} I give permission for CoachWillTumbles to use photos or videos of my athlete for training or promotional purposes, unless I submit a written opt-out.`,
    `[X] I confirm that I am the athlete's parent or legal guardian, or I am over 18 and signing for myself, and I agree to all terms in this Waiver & Adventure Agreement.`
  ];
  
  yPosition = addText('AGREEMENTS:', margin, yPosition, helveticaBold, 12);
  yPosition -= 10;
  
  for (const checkbox of checkboxes) {
    yPosition = addText(checkbox, margin, yPosition, helveticaFont, 10, rgb(0, 0, 0), maxWidth);
    yPosition -= 5;
  }
  
  yPosition -= 20;
  
  // Signature fields
  yPosition = addText(`Athlete Name: ${waiverData.athleteName || 'Unknown Athlete'}`, margin, yPosition, helveticaFont, 12);
  yPosition -= 20;
  
  yPosition = addText(`Name of Signer: ${waiverData.signerName || 'Unknown Signer'}`, margin, yPosition, helveticaFont, 12);
  yPosition -= 20;
  
  yPosition = addText(`Relationship to Athlete: ${waiverData.relationshipToAthlete || 'Parent/Guardian'}`, margin, yPosition, helveticaFont, 12);
  yPosition -= 20;
  
  yPosition = addText(`Emergency Contact #: ${waiverData.emergencyContactNumber || ''}`, margin, yPosition, helveticaFont, 12);
  yPosition -= 30;
  
  // Add signature image if provided
  if (waiverData.signature && waiverData.signature.startsWith('data:image/')) {
    try {
      const [meta, base64] = waiverData.signature.split(',');
      const isPng = /data:image\/png/i.test(meta);
      const isJpeg = /data:image\/(jpeg|jpg)/i.test(meta);
      const buf = Buffer.from(base64, 'base64');
      const signatureImage = isPng ? await pdfDoc.embedPng(buf) : isJpeg ? await pdfDoc.embedJpg(buf) : null;

      if (!signatureImage) {
        console.warn('[PDF] Unsupported signature MIME type:', meta);
        yPosition = addText('Signature: [Electronic Signature Applied]', margin, yPosition, helveticaFont, 12);
        yPosition -= 20;
      } else {
        const signatureDims = signatureImage.scale(0.5);
        
        page.drawImage(signatureImage, {
          x: margin,
          y: yPosition - signatureDims.height,
          width: signatureDims.width,
          height: signatureDims.height,
        });
        
        yPosition -= signatureDims.height + 10;
      }
    } catch (error) {
      console.error('Error embedding signature:', error);
      yPosition = addText('Signature: [Electronic Signature Applied]', margin, yPosition, helveticaFont, 12);
      yPosition -= 20;
    }
  } else {
    if (waiverData.signature && !waiverData.signature.startsWith('data:image/')) {
      console.warn('[PDF] Signature provided but not a data URL; expected data:image/...');
    }
    yPosition = addText('Signature: [Electronic Signature Applied]', margin, yPosition, helveticaFont, 12);
    yPosition -= 20;
  }
  
  yPosition = addText(`Date: ${dateStr}`, margin, yPosition, helveticaFont, 12);
  
  // Footer
  page.drawText('This document was electronically signed via CoachWillTumbles.com', {
    x: margin,
    y: 30,
    size: 8,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function saveWaiverPDF(waiverData: WaiverData, waiverRecordId: number): Promise<string> {
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateWaiverPDF(waiverData);
  } catch (err) {
    console.error('[PDF] Failed to generate PDF buffer:', err);
    throw err;
  }
  
  // Ensure waivers directory exists
  const waiverDir = path.join(process.cwd(), 'data', 'waivers');
  try {
    await fs.access(waiverDir);
  } catch {
    try {
      await fs.mkdir(waiverDir, { recursive: true });
    } catch (mkdirErr) {
      console.error('[PDF] Failed to create waivers directory', { waiverDir, error: mkdirErr });
      throw mkdirErr;
    }
  }
  
  // Save PDF file
  const filename = `waiver_${waiverRecordId}_${Date.now()}.pdf`;
  const filepath = path.join(waiverDir, filename);
  
  try {
    await fs.writeFile(filepath, pdfBuffer);
  } catch (writeErr) {
    console.error('[PDF] Failed to write PDF file', { filepath, error: writeErr });
    throw writeErr;
  }
  
  return filepath;
}