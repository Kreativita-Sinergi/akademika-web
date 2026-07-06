import Lottie from 'lottie-react';
import emptyBoxAnimation from '@/assets/lottie/empty-box.json';

// Atom EmptyState — keadaan kosong (animasi kotak kosong + pesan).
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
      <Lottie animationData={emptyBoxAnimation} loop={false} style={{ width: 48, height: 48 }} />
      <span className="text-sm">{message}</span>
    </div>
  );
}
