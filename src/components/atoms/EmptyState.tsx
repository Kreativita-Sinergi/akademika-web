import { Inbox } from 'lucide-react';

// Atom EmptyState — keadaan kosong bergaya shadcn (ikon + pesan).
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-6 w-6 opacity-60" />
      </div>
      <span className="text-sm">{message}</span>
    </div>
  );
}
