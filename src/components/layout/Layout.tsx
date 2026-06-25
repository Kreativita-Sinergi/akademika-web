import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GraduationCap, LogOut, Menu as MenuIcon, X, Search, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import NotificationBell from './NotificationBell';
import CommandPalette from '../organisms/CommandPalette';
import { menuForRole, roleLabel } from '@/data/menu';

const OPEN_KEY = 'akademika-sidebar-open';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('akademika-theme', next ? 'dark' : 'light');
  };

  const menu = menuForRole(user?.role);

  // Menu aktif berdasarkan path terpanjang yang cocok.
  const allPaths = menu.flatMap((g) => g.items.map((i) => i.to));
  const selectedKey =
    allPaths
      .filter((p) => (p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)))
      .sort((a, b) => b.length - a.length)[0] ?? location.pathname;
  const activeSection = menu.find((g) => g.items.some((i) => i.to === selectedKey))?.section;

  // Seksi sidebar yang terbuka (bisa di-collapse). Default: hanya seksi aktif yang
  // terbuka; pilihan user disimpan di localStorage.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(OPEN_KEY) || '{}');
    } catch {
      return {};
    }
  });
  useEffect(() => {
    localStorage.setItem(OPEN_KEY, JSON.stringify(openSections));
  }, [openSections]);

  const isOpen = (section: string) =>
    section in openSections ? openSections[section] : section === activeSection;
  const toggleSection = (section: string) =>
    setOpenSections((prev) => ({ ...prev, [section]: !isOpen(section) }));

  // Pastikan seksi yang memuat halaman aktif selalu terbuka & tutup drawer mobile.
  useEffect(() => {
    setMobileOpen(false);
    if (activeSection) setOpenSections((prev) => ({ ...prev, [activeSection]: true }));
  }, [location.pathname, activeSection]);

  // Pintasan keyboard ⌘K / Ctrl+K untuk membuka command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  // Isi sidebar dipakai bersama oleh versi desktop & drawer mobile.
  const sidebar = (
    <>
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm shadow-primary/30">
          <GraduationCap size={20} />
        </div>
        <span className="text-xl font-bold tracking-tight text-gradient">Akademika</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {menu.map((group) => {
          const expanded = isOpen(group.section);
          return (
            <div key={group.section}>
              <button
                onClick={() => toggleSection(group.section)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                {group.section}
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', !expanded && '-rotate-90')} />
              </button>
              {expanded && (
                <div className="mb-1 space-y-1">
                  {group.items.map((item) => {
                    const active = selectedKey === item.to;
                    return (
                      <button
                        key={item.to}
                        onClick={() => navigate(item.to)}
                        className={cn(
                          'group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                          active
                            ? 'bg-brand-gradient text-white shadow-sm shadow-primary/30'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        <span className="[&_svg]:h-[18px] [&_svg]:w-[18px]">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border/70 bg-background lg:flex">
        {sidebar}
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 animate-in fade-in-0" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-background shadow-xl duration-200 animate-in slide-in-from-left">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1 text-muted-foreground hover:bg-accent"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main — min-w-0 agar tabel lebar discroll di dalam tabel */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-border/70 bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground lg:hidden" onClick={() => setMobileOpen(true)}>
              <MenuIcon className="h-5 w-5" />
            </Button>
            {/* Pemicu Command Palette */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Cari menu…</span>
              <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={toggleTheme} title={dark ? 'Mode terang' : 'Mode gelap'}>
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <NotificationBell />
            <div className="mx-1 hidden h-6 w-px bg-border sm:block" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-accent">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="hidden text-left sm:block">
                    <p className="text-sm font-semibold leading-tight">{user?.name}</p>
                    <p className="text-[11px] leading-tight text-muted-foreground">
                      {roleLabel[user?.role ?? ''] ?? user?.role}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" /> Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
