import { Img } from '@react-email/components';

interface EmailLogoProps {
  logoUrl?: string;
  width?: string | number;
  height?: string | number;
}

export function EmailLogo({
  logoUrl = 'https://nwdgtdzrcyfmislilucy.supabase.co/storage/v1/object/public/site-media/site-logos/CWT_Circle_Logo.png',
  width = 120,
  height,
}: EmailLogoProps) {
  const finalWidth = width ?? 120;
  const finalHeight = (height ?? width ?? 120) as string | number;
  return (
    <Img
      src={logoUrl}
      width={finalWidth}
      height={finalHeight}
      alt="Coach Will Tumbles Logo"
      style={{
        display: 'block',
        margin: '0 auto',
        marginBottom: '20px',
        objectFit: 'contain',
      }}
    />
  );
}
