import { Modal as AntModal } from 'antd';
import type { ReactNode } from 'react';

// Molecule Modal — wrapper Ant Design dengan API lama (open/title/onClose/children/wide).
// footer dimatikan karena tombol aksi dirender di dalam children.
export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <AntModal open={open} title={title} onCancel={onClose} footer={null} width={wide ? 760 : 520} destroyOnHidden>
      {children}
    </AntModal>
  );
}
