import React from 'react';

export function EmailHeader({ logoUrl }: { logoUrl?: string }) {
  const defaultLogoUrl = 'https://nwdgtdzrcyfmislilucy.supabase.co/storage/v1/object/public/site-media/site-media/1751370655067-o42c7ikqg5.svg';
  
  return (
    <div style={{ textAlign: 'left', marginBottom: '20px' }}>
      <a href="https://coachwilltumbles.com" style={{ display: 'inline-block' }}>
        <img
          src={logoUrl || defaultLogoUrl}
          alt="Coach Will Tumbles Logo"
          style={{ width: '150px', height: 'auto' }}
        />
      </a>
    </div>
  );
}
