import { cn } from '@/lib/utils';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

// Segmented control (pengganti grup tombol pil) bergaya shadcn — dipakai untuk
// tab/filter status di banyak halaman agar konsisten.
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
}) {
  return (
    <div className={cn('inline-flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            value === o.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
