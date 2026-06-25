import type { ReactNode } from 'react';
import { Button as UIButton } from '@/components/ui/button';

// Atom Button — wrapper shadcn dengan API kompatibel kode lama
// (variant: primary/secondary/danger/ghost/outline; opsional size: sm/icon/lg).
const variantMap = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'destructive',
  ghost: 'ghost',
  outline: 'outline',
} as const;

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size,
  disabled,
  className = '',
  block,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  className?: string;
  block?: boolean;
  title?: string;
}) {
  return (
    <UIButton
      type={type}
      variant={variantMap[variant]}
      size={size}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={block ? `w-full ${className}` : className}
    >
      {children}
    </UIButton>
  );
}
