import { Button as AntButton } from 'antd';
import type { ReactNode } from 'react';

// Atom Button — wrapper Ant Design dengan API kompatibel kode lama
// (variant: primary/secondary/danger/ghost, type: button/submit).
export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  className = '',
  block,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
  block?: boolean;
}) {
  const map: Record<string, { type?: 'primary' | 'default' | 'text'; danger?: boolean }> = {
    primary: { type: 'primary' },
    secondary: { type: 'default' },
    danger: { type: 'primary', danger: true },
    ghost: { type: 'text' },
  };
  const cfg = map[variant];
  return (
    <AntButton
      type={cfg.type}
      danger={cfg.danger}
      htmlType={type}
      disabled={disabled}
      block={block}
      className={className}
      onClick={onClick}
    >
      {children}
    </AntButton>
  );
}
