import { Button } from '@react-email/components';
import { theme } from './theme';

interface CTAButtonProps {
  href: string;
  children: React.ReactNode;
  color?: 'primary' | 'accent' | 'coral' | 'danger' | 'info';
}

export function CTAButton({ href, children, color = 'primary' }: CTAButtonProps) {
  const bg = theme.colors[color] || theme.colors.primary;
  return (
    <Button
      href={href}
      style={{
        backgroundColor: bg,
        color: '#ffffff',
        padding: '14px 24px',
        borderRadius: theme.radius.md,
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '16px',
        display: 'inline-block',
      }}
    >
      {children}
    </Button>
  );
}
