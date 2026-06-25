import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Molecule Pagination — pager bergaya shadcn dengan API lama (page/totalPage/onChange).
export function Pagination({
  page,
  totalPage,
  onChange,
}: {
  page: number;
  totalPage: number;
  onChange: (page: number) => void;
}) {
  if (totalPage <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm text-muted-foreground">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="font-medium text-foreground">
        {page} / {totalPage}
      </span>
      <Button variant="outline" size="sm" disabled={page >= totalPage} onClick={() => onChange(page + 1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
