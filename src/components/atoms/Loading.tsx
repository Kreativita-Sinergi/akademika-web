import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/lottie/loading-spinner.json';

const SIZE_PX = { sm: 20, md: 32, lg: 48 } as const;

// Atom Loading — pengganti Loader2 + animate-spin, dipakai di seluruh halaman.
export function Loading({ size = 'md', className }: { size?: keyof typeof SIZE_PX; className?: string }) {
  const px = SIZE_PX[size];
  return (
    <Lottie
      animationData={loadingAnimation}
      loop
      className={className}
      style={{ width: px, height: px }}
    />
  );
}
