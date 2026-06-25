import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { menuForRole } from '@/data/menu';
import { useAuthStore } from '../../store/auth';

// Command Palette — lompat cepat ke menu mana pun (buka via ⌘K / Ctrl+K).
export default function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role);
  const sections = menuForRole(role);

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <DialogTitle className="sr-only">Cari menu</DialogTitle>
        <Command>
          <CommandInput placeholder="Cari halaman atau menu…" />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>Tidak ada hasil.</CommandEmpty>
            {sections.map((sec) => (
              <CommandGroup key={sec.section} heading={sec.section}>
                {sec.items.map((item) => (
                  <CommandItem key={item.to} value={`${sec.section} ${item.label}`} onSelect={() => go(item.to)}>
                    <span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">{item.icon}</span>
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
